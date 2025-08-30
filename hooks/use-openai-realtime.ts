import { useState, useRef, useCallback, useEffect } from 'react';

interface RealtimeEvent {
    type: string;
    text?: string;
    audio?: string;
    data?: string;
    delta?: string;
    content?: string;
    buffer?: string;
    error?: string | { message?: string; code?: string;[key: string]: any };
    event_id?: string;
    response_id?: string;
    item_id?: string;
    output_index?: number;
    [key: string]: any;
}

interface UseOpenAIRealtimeReturn {
    isConnected: boolean;
    isTranscribing: boolean;
    isSpeaking: boolean;
    transcript: string;
    audioLevel: number;
    error: string | null;
    connect: (interviewContext?: any) => Promise<void>;
    disconnect: () => void;
    clearTranscript: () => void;
    sendMessage: (message: string) => void;
    sendAudio: (audioBlob: Blob) => void;
    commitAudioBuffer: () => void;
    clearAudioBuffer: () => void;
    cancelActiveResponse: () => void;
    pauseAudio: () => void;
    resumeAudio: () => void;
}

export function useOpenAIRealtime(): UseOpenAIRealtimeReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // WebRTC refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<string[]>([]);
    const isPlayingRef = useRef(false);

    // Audio analysis refs
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Interview context
    const interviewContextRef = useRef<any>(null);

    // Response state tracking
    const activeResponseRef = useRef<string | null>(null);
    const pendingResponseRef = useRef<boolean>(false);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSpeechTimeRef = useRef<number>(0);
    const pendingUserMessageRef = useRef<string | null>(null); // <-- ADD THIS LINE

    // Audio buffer for continuous recording
    const audioBufferRef = useRef<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const isRecordingRef = useRef(false);

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setAudioLevel(average);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, []);

    const playNextAudioInQueue = useCallback(async () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

        isPlayingRef.current = true;
        const audioData = audioQueueRef.current.shift();

        if (!audioData) {
            isPlayingRef.current = false;
            return;
        }

        try {
            // Create audio context if needed
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            // Decode base64 audio
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Decode audio data
            const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);

            // Create and play audio source
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.onended = () => {
                isPlayingRef.current = false;
                setIsSpeaking(audioQueueRef.current.length > 0);
                // Play next audio in queue
                setTimeout(() => playNextAudioInQueue(), 50);
            };

            setIsSpeaking(true);
            source.start();
        } catch (err) {
            console.error('Error playing audio:', err);
            isPlayingRef.current = false;
            setIsSpeaking(false);
            // Try next audio in queue
            setTimeout(() => playNextAudioInQueue(), 50);
        }
    }, []);

    const createResponseIfNeeded = useCallback(() => {
        if (dataChannelRef.current &&
            dataChannelRef.current.readyState === 'open' &&
            !activeResponseRef.current &&
            !pendingResponseRef.current) {

            pendingResponseRef.current = true;
            const responseEvent = {
                type: 'response.create',
                response: {
                    modalities: ['text', 'audio']
                }
            };
            console.log('Creating response:', responseEvent);
            dataChannelRef.current.send(JSON.stringify(responseEvent));
        } else {
            console.log('Skipping response creation - already has active or pending response');
        }
    }, []);

    const cancelActiveResponse = useCallback(() => {
        if (dataChannelRef.current &&
            dataChannelRef.current.readyState === 'open' &&
            activeResponseRef.current &&
            activeResponseRef.current !== 'active') {

            const cancelEvent = {
                type: 'response.cancel',
                response_id: activeResponseRef.current
            };
            console.log('Canceling active response:', activeResponseRef.current);
            dataChannelRef.current.send(JSON.stringify(cancelEvent));

            // Reset response state
            activeResponseRef.current = null;
            pendingResponseRef.current = false;
        } else {
            console.log('No valid active response to cancel');
            // Just reset state without sending cancel
            activeResponseRef.current = null;
            pendingResponseRef.current = false;
        }
    }, []);

    const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
        console.log('event =======> ', event);
        console.log('Realtime event received:', event.type);

        switch (event.type) {
            case 'session.created':
                console.log('Session created');
                break;

            case 'session.updated':
                console.log('Session updated');
                break;

            // In useOpenAIRealtime.ts -> handleRealtimeEvent

            case 'response.created':
                console.log('Response created:', event.response_id);
                setError(null); // <--- ADD THIS LINE
                activeResponseRef.current = event.response_id;
                pendingResponseRef.current = false;
                break;

            case 'response.done':
                console.log('Response done:', event.response_id);
                activeResponseRef.current = null;
                pendingResponseRef.current = false;
                break;

            case 'response.canceled':
                console.log('Response canceled:', event.response_id);
                activeResponseRef.current = null;
                pendingResponseRef.current = false;

                // --- START: ADD THIS BLOCK ---
                // If a user message was queued pending cancellation, send it now.
                if (pendingUserMessageRef.current) {
                    console.log('Sending queued user message after cancellation.');
                    const message = pendingUserMessageRef.current;
                    pendingUserMessageRef.current = null; // Clear the queue

                    const messageEvent = {
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: 'user',
                            content: [{ type: 'input_text', text: message }]
                        }
                    };
                    dataChannelRef.current?.send(JSON.stringify(messageEvent));
                    createResponseIfNeeded();
                }
                // --- END: ADD THIS BLOCK ---
                break;

            case 'response.audio.delta':
                if (event.audio || event.delta) {
                    const audioData = event.audio || event.delta;
                    audioQueueRef.current.push(audioData);
                    if (!isPlayingRef.current) {
                        playNextAudioInQueue();
                    }
                }
                break;

            case 'response.audio.done':
                console.log('Audio response done');
                break;

            case 'response.audio_transcript.delta':
                if (event.delta) {
                    setTranscript(prev => prev + event.delta);
                }
                break;

            case 'response.audio_transcript.done':
                console.log('Audio transcript done');
                break;

            case 'input_audio_buffer.committed':
                console.log('Audio buffer committed');
                break;

            case 'input_audio_buffer.speech_started':
                console.log('Speech started');
                setIsTranscribing(true);
                lastSpeechTimeRef.current = Date.now();

                // Clear any existing speech timeout
                if (speechTimeoutRef.current) {
                    clearTimeout(speechTimeoutRef.current);
                    speechTimeoutRef.current = null;
                }
                break;

            case 'input_audio_buffer.speech_stopped':
                console.log('Speech stopped');
                setIsTranscribing(false);

                // Set timeout to create response after speech stops
                if (speechTimeoutRef.current) {
                    clearTimeout(speechTimeoutRef.current);
                }

                speechTimeoutRef.current = setTimeout(() => {
                    console.log('Creating response after speech pause');
                    createResponseIfNeeded();
                }, 800); // Wait 800ms after speech stops before responding
                break;

            case 'conversation.item.created':
                console.log('Conversation item created');
                break;

            case 'conversation.item.input_audio_transcription.completed':
                if (event.transcript) {
                    console.log('Input transcription completed:', event.transcript);
                    setTranscript(prev => prev + '\nUser: ' + event.transcript);
                }
                break;

            case 'conversation.item.input_audio_transcription.failed':
                console.log('Input transcription failed');
                break;

            case 'error':
                console.log('Error event received:', event.error);

                if (event.error && event.error.code === "conversation_already_has_active_response") {
                    console.log('Conversation already has active response');
                    break;
                }

                let errorMessage: string = 'Unknown error occurred';
                let isAudioError = false;

                if (typeof event.error === 'string') {
                    errorMessage = event.error;
                    if (errorMessage.toLowerCase().includes('audio')) {
                        isAudioError = true;
                    }
                } else if (event.error && typeof event.error === 'object' && 'code' in event.error) {
                    errorMessage = event.error.message || event.error.code || JSON.stringify(event.error) || 'Unknown error occurred';
                    const errorCode = (event.error.code || '').toLowerCase();
                    if (errorCode.includes('audio') || errorMessage.toLowerCase().includes('audio')) {
                        isAudioError = true;
                    }
                } else if (event.error && typeof event.error === 'object') {
                    errorMessage = event.error.message || JSON.stringify(event.error) || 'Unknown error occurred';
                    if (errorMessage.toLowerCase().includes('audio')) {
                        isAudioError = true;
                    }
                }

                // If it's a non-fatal audio error, just log it and don't show it in the UI.
                if (isAudioError) {
                    console.warn('Suppressed a non-fatal audio error:', event.error);
                } else {
                    console.error('Realtime API error:', event.error);
                    setError(errorMessage || null);
                }

                // Always reset response state on any error to be safe
                activeResponseRef.current = null;
                pendingResponseRef.current = false;
                break;

            default:
                console.log('Unhandled event type:', event.type);
        }
    }, [createResponseIfNeeded, playNextAudioInQueue]);

    const startContinuousRecording = useCallback(() => {
        if (!mediaStreamRef.current || isRecordingRef.current) return;

        try {
            const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            isRecordingRef.current = true;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && dataChannelRef.current?.readyState === 'open') {
                    // Convert to base64 and send
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        const audioEvent = {
                            type: 'input_audio_buffer.append',
                            audio: base64Audio
                        };
                        dataChannelRef.current?.send(JSON.stringify(audioEvent));
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            // Record in small chunks for real-time processing
            mediaRecorder.start(100); // 100ms chunks
        } catch (err) {
            console.error('Error starting continuous recording:', err);
        }
    }, []);

    const stopContinuousRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            isRecordingRef.current = false;
        }
    }, []);

    const connect = useCallback(async (interviewContext?: any) => {
        try {
            setError(null);
            setIsTranscribing(true);
            interviewContextRef.current = interviewContext;

            // Reset state
            activeResponseRef.current = null;
            pendingResponseRef.current = false;
            audioQueueRef.current = [];
            isPlayingRef.current = false;

            // Get ephemeral token from server
            const tokenResponse = await fetch('/api/realtime/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-realtime-preview-2024-10-01',
                    voice: 'alloy',
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get session token');
            }

            const sessionData = await tokenResponse.json();
            const ephemeralKey = sessionData.client_secret.value;

            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 24000,
                    channelCount: 1,
                },
                video: false,
            });

            mediaStreamRef.current = stream;

            // Set up audio analysis
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // Create media stream source for audio analysis
            const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();


            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
            updateAudioLevel();

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                ],
            });

            peerConnectionRef.current = pc;
            pc.addTrack(stream.getAudioTracks()[0], stream);

            // Set up data channel
            const dc = pc.createDataChannel('oai-events');
            dataChannelRef.current = dc;

            dc.addEventListener('open', () => {
                console.log('Data channel opened');
                setIsConnected(true);
                setIsTranscribing(false);

                // Configure session
                const sessionUpdate = {
                    type: 'session.update',
                    session: {
                        voice: 'alloy'
                    }
                };

                console.log('Updating session:', sessionUpdate);
                dc.send(JSON.stringify(sessionUpdate));

                // Start continuous recording
                startContinuousRecording();

                // Send initial greeting
                if (interviewContextRef.current) {
                    setTimeout(() => {
                        const greeting = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'message',
                                role: 'assistant',
                                content: [{
                                    type: 'text',
                                    text: `Hello! I'm excited to conduct this ${interviewContextRef.current.interviewType} interview with you for the ${interviewContextRef.current.position} position. Let's start with you telling me a bit about yourself and your background.`
                                }]
                            }
                        };
                        dc.send(JSON.stringify(greeting));
                        setTimeout(() => createResponseIfNeeded(), 500);
                    }, 1000);
                }
            });

            dc.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleRealtimeEvent(data);
                } catch (err) {
                    console.error('Error parsing data channel message:', err);
                }
            });

            dc.addEventListener('error', (event) => {
                console.error('Data channel error:', event);
                setError('Data channel error occurred');
            });

            dc.addEventListener('close', () => {
                console.log('Data channel closed');
                setIsConnected(false);
                stopContinuousRecording();
            });

            // Create offer and connect
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-10-01';

            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    'Authorization': `Bearer ${ephemeralKey}`,
                    'Content-Type': 'application/sdp',
                },
            });

            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                throw new Error(`Failed to establish WebRTC connection: ${errorText}`);
            }

            const answer = {
                type: 'answer',
                sdp: await sdpResponse.text(),
            };

            await pc.setRemoteDescription(answer);

        } catch (err) {
            console.error('Error connecting to Realtime API:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect');
            setIsTranscribing(false);
            setIsConnected(false);
        }
    }, [updateAudioLevel, handleRealtimeEvent, createResponseIfNeeded, startContinuousRecording]);

    const disconnect = useCallback(() => {
        // Clear timeouts
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }

        // Stop recording
        stopContinuousRecording();

        // Stop audio playback
        if (audioElementRef.current) {
            audioElementRef.current.pause();
            audioElementRef.current = null;
        }

        // Clear audio queue
        audioQueueRef.current = [];
        isPlayingRef.current = false;

        // Close connections
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Stop media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Cancel animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setIsConnected(false);
        setIsTranscribing(false);
        setIsSpeaking(false);
        setAudioLevel(0);
        setError(null);
        activeResponseRef.current = null;
        pendingResponseRef.current = false;
    }, [stopContinuousRecording]);

    const sendMessage = useCallback((message: string) => {
        if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') return;

        // Clear any pending response from speech pause
        if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
        }

        // If AI is speaking, queue the message and cancel the current response.
        // The message will be sent once the 'response.canceled' event is received.
        if (activeResponseRef.current) {
            console.log('User interrupted. Queuing message and canceling response.');
            pendingUserMessageRef.current = message;
            cancelActiveResponse();
        } else {
            // If AI is not speaking, send the message immediately.
            const event = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [{ type: 'input_text', text: message }]
                }
            };
            dataChannelRef.current.send(JSON.stringify(event));
            createResponseIfNeeded();
        }
    }, [cancelActiveResponse, createResponseIfNeeded]);

    const sendAudio = useCallback((audioBlob: Blob) => {
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            const reader = new FileReader();
            reader.onload = () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const event = {
                    type: 'input_audio_buffer.append',
                    audio: base64Audio,
                };
                dataChannelRef.current?.send(JSON.stringify(event));
            };
            reader.readAsDataURL(audioBlob);
        }
    }, []);

    const commitAudioBuffer = useCallback(() => {
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            const event = {
                type: 'input_audio_buffer.commit'
            };
            dataChannelRef.current.send(JSON.stringify(event));
        }
    }, []);

    const clearAudioBuffer = useCallback(() => {
        if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
            const event = {
                type: 'input_audio_buffer.clear'
            };
            dataChannelRef.current.send(JSON.stringify(event));
        }
    }, []);

    const pauseAudio = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
    }, []);

    const resumeAudio = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.play();
        }
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        isTranscribing,
        isSpeaking,
        transcript,
        audioLevel,
        error,
        connect,
        disconnect,
        clearTranscript,
        sendMessage,
        sendAudio,
        commitAudioBuffer,
        clearAudioBuffer,
        cancelActiveResponse,
        pauseAudio,
        resumeAudio,
    };
}