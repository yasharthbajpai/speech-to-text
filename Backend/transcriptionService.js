import axios from 'axios';
import fs from 'fs';
import { google } from 'googleapis';

const perplexityApikey = "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";
const googleapijason = "myjson.json";

// Google Auth Setup
const setupGoogleAuth = () => {
    const credentials = JSON.parse(fs.readFileSync(googleapijason));
    return new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/cloud-platform']
    );
};

async function analyzeWithPerplexity(transcript) {
    try {
        const prompt = `
        Analyze this transcript and return a JSON object with exactly this structure:
        {
            "tasks": [
                {
                    "task": "description of task",
                    "assignee": "name of person",
                    "deadline": "date if mentioned"
                }
            ],
            "meeting": {
                "date": "date if mentioned",
                "time": "time if mentioned",
                "participants": ["list of names mentioned"]
            },
            "key_points": ["list of main discussion points"],
            "decisions": ["list of decisions made"],
            "next_steps": ["list of follow-up actions"]
        }

        Transcript: ${transcript}

        Respond only with the JSON object, no additional text.`;

        const response = await axios.post('https://api.perplexity.ai/chat/completions', {
            model: "sonar-pro",
            messages: [
                {
                    role: "system",
                    content: "You are a JSON formatter. Only respond with valid JSON objects."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.1,
            max_tokens: 10000,
        }, {
            headers: {
                'Authorization': `Bearer ${perplexityApikey}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Perplexity API Error:', error);
        return {
            tasks: [],
            meeting: { date: "", time: "", participants: [] },
            key_points: [],
            decisions: [],
            next_steps: []
        };
    }
}

function formatMeetingData(extractedData) {
    return {
        calendar_event: extractedData.meeting?.date ? {
            title: "Meeting",
            date: extractedData.meeting.date,
            time: extractedData.meeting.time || "",
            participants: extractedData.meeting.participants || []
        } : null,
        todo_items: (extractedData.tasks || []).map(task => ({
            task: task.task,
            assignee: task.assignee || "Unassigned",
            deadline: task.deadline || "No deadline",
            status: "pending"
        })),
        meeting_summary: {
            key_points: extractedData.key_points || [],
            decisions: extractedData.decisions || [],
            next_steps: extractedData.next_steps || [],
            generated_at: new Date().toISOString()
        }
    };
}

export const setupTranscriptionRoutes = (app, upload) => {
    const auth = setupGoogleAuth();

    app.post('/transcribe', upload.single('audio'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No audio file uploaded" });
            }

            const token = await auth.authorize();
            const audioBytes = req.file.buffer.toString('base64');

            const speechResponse = await axios.post(
                'https://speech.googleapis.com/v1/speech:recognize',
                {
                    config: {
                        encoding: "MP3",
                        sampleRateHertz: 44100,
                        languageCode: "en-US",
                        model: "default",
                        audioChannelCount: 2,
                        enableAutomaticPunctuation: true,
                        maxAlternatives: 1,
                        useEnhanced: true
                    },
                    audio: { content: audioBytes }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    maxContentLength: 50 * 1024 * 1024,
                    maxBodyLength: 50 * 1024 * 1024
                }
            );

            const transcript = speechResponse.data.results
                ?.map(result => result.alternatives[0].transcript)
                .join(" ") || "";

            if (!transcript) {
                return res.status(400).json({ 
                    status: 'error', 
                    error: 'No transcript generated' 
                });
            }

            const extractedData = await analyzeWithPerplexity(transcript);
            const formattedData = formatMeetingData(extractedData);

            return res.json({
                status: 'success',
                transcript,
                ...formattedData
            });

        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).json({
                status: 'error',
                error: 'Processing failed',
                details: error.message
            });
        }
    });
};
