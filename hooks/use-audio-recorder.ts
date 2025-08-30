import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    currentTranscript: string;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    error: string | null;
}

export function useAudioRecorder(onTranscriptionUpdate: (text: string) => void): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const SILENCE_THRESHOLD = 0.1; // Adjust as needed (0.0 to 1.0)
    const SILENCE_DURATION = 5000; // 5 seconds of silence to stop recording

    const stopRecording = useCallback(async () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    const processAudio = useCallback(() => {
        if (!analyserRef.current || !audioContextRef.current) return;

        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
            const sample = (dataArray[i] - 128) / 128.0; // Normalize to -1.0 to 1.0
            sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        if (rms < SILENCE_THRESHOLD) {
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    console.log("Silence detected, stopping recording.");
                    stopRecording();
                }, SILENCE_DURATION);
            }
        } else {
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        }

        if (isRecording) {
            requestAnimationFrame(processAudio);
        }
    }, [isRecording, stopRecording]);

    const sendAudioChunk = useCallback(async (audioBlob: Blob) => {
        if (audioBlob.size < 200) return;

        setIsTranscribing(true);
        setError(null);

        try {
            const formData = new FormData();
            const audioFile = new File([audioBlob], 'chunk.webm', { type: 'audio/webm' });
            formData.append('audio', audioFile);

            const response = await fetch('/api/audio/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Transcription failed' }));
                // throw new Error(errorData.error || 'Transcription failed');
                return;
            }

            const result = await response.json();
            if (result.text) {
                setCurrentTranscript(prev => (prev + ' ' + result.text).trim());
                if (onTranscriptionUpdate) {
                    onTranscriptionUpdate(result.text);
                }
            }
        } catch (err) {
            console.error('Chunk transcription error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred during transcription.');
        } finally {
            setIsTranscribing(false);
        }
    }, [onTranscriptionUpdate]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setCurrentTranscript('');
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup AudioContext for silence detection
            const context = new AudioContext();
            audioContextRef.current = context;
            const source = context.createMediaStreamSource(stream);
            microphoneRef.current = source;
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048; // Larger FFT size for better silence detection
            analyserRef.current = analyser;
            source.connect(analyser);

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    sendAudioChunk(event.data);
                }
            };

            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                audioContextRef.current?.close();
                // Send final chunk if any
                if (audioChunksRef.current.length > 0) {
                    const finalBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    sendAudioChunk(finalBlob);
                    audioChunksRef.current = [];
                }
            };

            recorder.start(3000); // chunk every 3 seconds
            setIsRecording(true);
            requestAnimationFrame(processAudio); // Start silence detection

        } catch (err) {
            console.error('Error starting recording:', err);
            setError(err instanceof Error ? err.message : 'Failed to start recording.');
        }
    }, [sendAudioChunk, processAudio]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state !== 'inactive') {
                mediaRecorderRef.current?.stop();
            }
            streamRef.current?.getTracks().forEach(track => track.stop());
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            audioContextRef.current?.close();
        };
    }, []);

    return {
        isRecording,
        isTranscribing,
        currentTranscript,
        startRecording,
        stopRecording,
        error,
    };
}
