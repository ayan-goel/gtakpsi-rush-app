import { useState, useRef, useCallback } from 'react';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
          
          // Stop all tracks to release microphone
          const stream = mediaRecorderRef.current.stream;
          stream.getTracks().forEach(track => track.stop());
          
          setIsRecording(false);
          resolve(audioBlob);
        };

        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        resolve(null);
      }
    });
  }, [isRecording]);

  const transcribeAudio = useCallback(async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.');
      }

      // Convert webm to wav for better compatibility with Whisper
      const audioBuffer = await audioBlob.arrayBuffer();
      const formData = new FormData();
      
      // Create a File object from the blob
      const audioFile = new File([audioBuffer], 'recording.webm', { 
        type: 'audio/webm;codecs=opus' 
      });
      
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Optional: specify language

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recordAndTranscribe = useCallback(async () => {
    try {
      await startRecording();
      
      // Return a promise that resolves when recording is stopped and transcribed
      return new Promise((resolve, reject) => {
        const handleStop = async () => {
          try {
            const audioBlob = await stopRecording();
            if (audioBlob) {
              const transcription = await transcribeAudio(audioBlob);
              resolve(transcription);
            } else {
              resolve('');
            }
          } catch (error) {
            reject(error);
          }
        };

        // Store the stop handler so it can be called externally
        window._stopRecordingHandler = handleStop;
      });
    } catch (error) {
      throw error;
    }
  }, [startRecording, stopRecording, transcribeAudio]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    transcribeAudio,
    recordAndTranscribe,
  };
}; 