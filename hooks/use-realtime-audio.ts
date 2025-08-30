import { useState, useRef, useCallback, useEffect } from 'react';

interface UseRealtimeAudioReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    transcript: string;
    audioLevel: number;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
}

export function useRealtimeAudio(): UseRealtimeAudioReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setAudioLevel(average);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: false
            });

            // Set up audio analysis for level monitoring
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            // Start audio level monitoring
            updateAudioLevel();

            // Set up media recorder
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);

                    // Send chunk for transcription
                    await transcribeChunk(event.data);
                }
            };

            mediaRecorderRef.current.start(1000); // Collect data every second
            setIsRecording(true);

        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }, [updateAudioLevel]);

    const transcribeChunk = useCallback(async (audioBlob: Blob) => {
        try {
            setIsTranscribing(true);

            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/api/audio/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const result = await response.json();

            if (result.success && result.transcription) {
                setTranscript(prev => prev + ' ' + result.transcription);
            }

        } catch (error) {
            console.error('Error transcribing audio chunk:', error);
        } finally {
            setIsTranscribing(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setAudioLevel(0);
    }, [isRecording]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && isRecording) {
                stopRecording();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecording, stopRecording]);

    return {
        isRecording,
        isTranscribing,
        transcript,
        audioLevel,
        startRecording,
        stopRecording,
        clearTranscript,
    };
} 