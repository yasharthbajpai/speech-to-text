
# **Voice-to-Action App**

### **Author**: Yasharth Bajpai  
**Date**: February 21, 2025  

---

## **Project Overview**

The **Voice-to-Action App** is a React Native application that allows users to record audio, transcribe it into text, and extract actionable insights such as meeting details, key points, decisions, and follow-up tasks. The app integrates with Google Speech-to-Text API for transcription and Perplexity AI for advanced analysis of the transcript.

This project is designed to streamline meeting management by providing users with:
- A transcript of the recording.
- Structured meeting summaries.
- Actionable to-do lists.
- Email integration for sharing meeting details.

---

## **Features**

### **Audio Recording**
- Record audio directly within the app using the device's microphone.
- Supports both iOS and Android platforms.

### **Speech-to-Text Transcription**
- Converts recorded audio into text using the Google Speech-to-Text API.

### **AI-Powered Insights**
- Extracts structured data from transcripts using Perplexity AI, including:
  - Meeting details (date, time, participants).
  - Key discussion points.
  - Decisions made.
  - Action items with assignees and deadlines.

### **Email Sharing**
- Compose and send meeting summaries via email directly from the app.

### **Editable Meeting Details**
- Modify meeting details and tasks through an intuitive edit modal.

### **Dark-Themed UI**
- A visually appealing dark mode design for better user experience.

---

## **Demo Video**

Watch the demo video of the project [here](https://mail.google.com/mail/u/0/#inbox/FMfcgzQZTMPKWbWVxZVxnhnVnSZFVvCT).

---

## **Technologies Used**

### **Frontend**
- React Native
- Expo AV (for audio recording)
- Axios (for backend communication)
- React Native Modal (for modals)
- React Native Linking (for email integration)

### **Backend**
- Node.js with Express.js
- Google Speech-to-Text API
- Perplexity AI API

---

## **Installation Guide**

### **Prerequisites**
1. Install [Node.js](https://nodejs.org/) and npm.
2. Install [Expo CLI](https://expo.dev/) for running the React Native app.
3. Set up a Google Cloud account and enable the Speech-to-Text API.
4. Obtain an API key from Perplexity AI.

---

### **Steps**

#### Backend Setup
1. Clone the repository and navigate to the backend folder:
   ```
   git clone 
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Add your Google Cloud credentials JSON file (`myjson.json`) to the backend folder.
4. Replace `perplexityApikey` in `transcriptionService.js` with your Perplexity AI API key.
5. Start the server:
   ```
   node index.js
   ```

#### Frontend Setup
1. Navigate to the frontend folder:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Update the `myip` variable in `App.js` with your local machine's IP address (e.g., `192.168.x.x`).
4. Start the Expo development server:
   ```
   expo start
   ```
5. Scan the QR code from Expo on your mobile device or run it on an emulator.

---

## **Usage Instructions**

1. Launch the app on your mobile device or emulator.
2. Tap "🎤 Start Recording" to begin recording audio.
3. Tap "⏹️ Stop Recording" to stop recording and process the audio.
4. View the generated transcript and structured insights (meeting details, tasks, etc.).
5. Edit any details by tapping the edit icon ✏️.
6. Share meeting summaries via email by tapping the email icon 📧.

---

## **Folder Structure**

```
project/
├── backend/
│   ├── index.js                # Main server file
│   ├── transcriptionService.js # Handles transcription and AI analysis
│   └── myjson.json             # Google Cloud credentials file (not included in repo)
├── frontend/
│   ├── App.js                  # Main React Native app file
│   ├── styles.js               # Styling for UI components
│   └── assets/                 # App assets (if any)
└── README.md                   # Documentation file
```



---

## **Future Enhancements**

1. Add support for multiple languages in transcription.
2. Integrate calendar APIs (e.g., Google Calendar) for automatic event creation.
3. Enable offline transcription using local models.

---

## **Contact**

For any questions or feedback, feel free to reach out:  
**Yasharth Bajpai**  
Email: [yasharthbajpai0103@gmail.com](yasharthbajpai0103@gmail.com)

---
