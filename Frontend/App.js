import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Linking 
} from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as MailComposer from 'expo-mail-composer';
import { MaterialIcons } from '@expo/vector-icons';
import styles from './styles.js';


export default function App() {
  // State declarations
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processedData, setProcessedData] = useState(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const myip = "192.168.195.26";

  // Recording Functions
  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission');
        return;
      }
  
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
  
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.mp3',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      });
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording..');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecording(null);
      await sendAudioToBackend(uri);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // ... (continued in Part 2)
    // Audio Processing and Backend Communication Functions
    const sendAudioToBackend = async (uri) => {
      try {
        setIsLoading(true);
        setTranscript('');
        setProcessedData(null);
    
        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: 'recording.mp3',
          type: 'audio/mp3',
        });
    
        const response = await axios.post(`http://${myip}:3000/transcribe`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minute timeout
          maxContentLength: 50 * 1024 * 1024, // 50MB
          maxBodyLength: 50 * 1024 * 1024 // 50MB
        });
    
        if (response.data.status === 'success') {
          setTranscript(response.data.transcript);
          setProcessedData({
            calendar_event: response.data.calendar_event,
            todo_items: response.data.todo_items,
            meeting_summary: response.data.meeting_summary
          });
        } else {
          Alert.alert('Error', response.data.error || 'Processing failed');
        }
      } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        Alert.alert('Error', 'Failed to process audio. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    const sendEmail = async (email) => {
      try {
        let emailBody = `Meeting Summary\n\n`;
        
        if (transcript) {
          emailBody += `Transcript:\n${transcript}\n\n`;
        }
    
        if (processedData?.calendar_event) {
          const event = processedData.calendar_event;
          emailBody += `Meeting Details:\n`;
          emailBody += `Title: ${event.title}\n`;
          emailBody += `Date: ${event.date}\n`;
          emailBody += `Time: ${event.time}\n`;
          if (event.participants?.length > 0) {
            emailBody += `Participants: ${event.participants.join(', ')}\n`;
          }
          emailBody += '\n';
        }
    
        if (processedData?.meeting_summary?.key_points) {
          emailBody += `Key Points:\n`;
          processedData.meeting_summary.key_points.forEach(point => {
            emailBody += `• ${point}\n`;
          });
          emailBody += '\n';
        }
    
        if (processedData?.todo_items) {
          emailBody += `Action Items:\n`;
          processedData.todo_items.forEach(item => {
            emailBody += `• ${item.task}\n`;
            emailBody += `  Assignee: ${item.assignee}\n`;
            emailBody += `  Deadline: ${item.deadline}\n\n`;
          });
        }
    
        const encodedBody = encodeURIComponent(emailBody);
        const mailtoUrl = `mailto:${email}?subject=Meeting Summary&body=${encodedBody}`;
    
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
        } else {
          Alert.alert('Error', 'No email app found');
        }
    
        setEmailModalVisible(false);
        setEmailAddress('');
      } catch (error) {
        Alert.alert('Error', 'Failed to send email');
        console.error(error);
      }
    };
  
    const handleEditSave = (editedData) => {
      try {
        setProcessedData(editedData);
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Changes saved successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to save changes');
        console.error(error);
      }
    };
  
    // ... (continued in Part 3)
      // Render Functions
  const renderCalendarEvent = () => {
    if (!processedData?.calendar_event) return null;
    const event = processedData.calendar_event;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meeting Details:</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingData(processedData);
              setIsEditModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={20} color="#8A2BE2" />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemText}>Title: {event.title}</Text>
        <Text style={styles.itemText}>Date: {event.date}</Text>
        <Text style={styles.itemText}>Time: {event.time}</Text>
        {event.participants?.length > 0 && (
          <Text style={styles.itemText}>Participants: {event.participants.join(', ')}</Text>
        )}
      </View>
    );
  };

  const renderTodoItems = () => {
    if (!processedData?.todo_items?.length) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Action Items:</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingData(processedData);
              setIsEditModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={20} color="#8A2BE2" />
          </TouchableOpacity>
        </View>
        {processedData.todo_items.map((item, index) => (
          <View key={index} style={styles.todoItem}>
            <Text style={styles.itemText}>• {item.task}</Text>
            <Text style={styles.itemSubtext}>Assignee: {item.assignee}</Text>
            <Text style={styles.itemSubtext}>Deadline: {item.deadline}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMeetingSummary = () => {
    if (!processedData?.meeting_summary) return null;
    const summary = processedData.meeting_summary;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meeting Summary:</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingData(processedData);
              setIsEditModalVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={20} color="#8A2BE2" />
          </TouchableOpacity>
        </View>
        {summary.key_points?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Key Points:</Text>
            {summary.key_points.map((point, index) => (
              <Text key={index} style={styles.itemText}>• {point}</Text>
            ))}
          </View>
        )}
        {summary.decisions?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Decisions:</Text>
            {summary.decisions.map((decision, index) => (
              <Text key={index} style={styles.itemText}>• {decision}</Text>
            ))}
          </View>
        )}
        {summary.next_steps?.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Next Steps:</Text>
            {summary.next_steps.map((step, index) => (
              <Text key={index} style={styles.itemText}>• {step}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ... (continued in Part 4)
    // Modal Components
    const EmailModal = () => (
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Email Address</Text>
            <TextInput
              style={styles.emailInput}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Enter email address"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={() => sendEmail(emailAddress)}
              >
                <Text style={styles.modalButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  
    const EditModal = () => {
      const [editedData, setEditedData] = useState({
        calendar_event: processedData?.calendar_event || {},
        todo_items: processedData?.todo_items || [],
        meeting_summary: processedData?.meeting_summary || {}
      });
  
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <Text style={styles.modalTitle}>Edit Meeting Details</Text>
              <ScrollView>
                {/* Calendar Event Section */}
                {editedData?.calendar_event && (
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Meeting Details</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editedData.calendar_event.title}
                      onChangeText={(text) => setEditedData({
                        ...editedData,
                        calendar_event: { ...editedData.calendar_event, title: text }
                      })}
                      placeholder="Meeting Title"
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={styles.editInput}
                      value={editedData.calendar_event.date}
                      onChangeText={(text) => setEditedData({
                        ...editedData,
                        calendar_event: { ...editedData.calendar_event, date: text }
                      })}
                      placeholder="Date"
                      placeholderTextColor="#666"
                    />
                    <TextInput
                      style={styles.editInput}
                      value={editedData.calendar_event.time}
                      onChangeText={(text) => setEditedData({
                        ...editedData,
                        calendar_event: { ...editedData.calendar_event, time: text }
                      })}
                      placeholder="Time"
                      placeholderTextColor="#666"
                    />
                  </View>
                )}
  
                {/* Todo Items Section */}
                {editedData?.todo_items?.length > 0 && (
                  <View style={styles.editSection}>
                    <Text style={styles.editSectionTitle}>Action Items</Text>
                    {editedData.todo_items.map((item, index) => (
                      <View key={index} style={styles.editItem}>
                        <TextInput
                          style={styles.editInput}
                          value={item.task}
                          onChangeText={(text) => {
                            const newTodos = [...editedData.todo_items];
                            newTodos[index] = { ...item, task: text };
                            setEditedData({ ...editedData, todo_items: newTodos });
                          }}
                          placeholder="Task"
                          placeholderTextColor="#666"
                        />
                        <TextInput
                          style={styles.editInput}
                          value={item.assignee}
                          onChangeText={(text) => {
                            const newTodos = [...editedData.todo_items];
                            newTodos[index] = { ...item, assignee: text };
                            setEditedData({ ...editedData, todo_items: newTodos });
                          }}
                          placeholder="Assignee"
                          placeholderTextColor="#666"
                        />
                        <TextInput
                          style={styles.editInput}
                          value={item.deadline}
                          onChangeText={(text) => {
                            const newTodos = [...editedData.todo_items];
                            newTodos[index] = { ...item, deadline: text };
                            setEditedData({ ...editedData, todo_items: newTodos });
                          }}
                          placeholder="Deadline"
                          placeholderTextColor="#666"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.sendButton]}
                  onPress={() => handleEditSave(editedData)}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    };
  
    // ... (continued in Part 5)
      // Main Render Function
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice-to-Action App</Text>
      
      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcript:</Text>
          <Text style={styles.transcriptText}>{transcript || 'No transcript yet.'}</Text>
        </View>
        
        {renderCalendarEvent()}
        {renderTodoItems()}
        {renderMeetingSummary()}
      </ScrollView>
  
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Processing your recording...</Text>
        </View>
      )}
  
      <View style={styles.bottomButtonContainer}>
        <View style={styles.buttonRow}>
          {isRecording ? (
            <>
              <View style={styles.mainButton}>
                <TouchableOpacity 
                  style={[styles.recordButton, { backgroundColor: 'red' }]} 
                  onPress={stopRecording}
                >
                  <Text style={styles.recordButtonText}>⏹️ Stop Recording</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cancelButton}>
                <TouchableOpacity 
                  style={[styles.recordButton, { backgroundColor: '#666666' }]}
                  onPress={() => {
                    recording.stopAndUnloadAsync();
                    setRecording(null);
                    setIsRecording(false);
                  }}
                >
                  <Text style={styles.recordButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.mainButton}>
                <TouchableOpacity 
                  style={styles.recordButton} 
                  onPress={startRecording}
                >
                  <Text style={styles.recordButtonText}>🎤 Start Recording</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.emailButton, { opacity: processedData ? 1 : 0.5 }]}
                onPress={() => processedData && setEmailModalVisible(true)}
                disabled={!processedData}
              >
                <MaterialIcons name="email" size={24} color="#8A2BE2" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
  
      <EmailModal />
      <EditModal />
    </View>
  );
}


    