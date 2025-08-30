import { useState, useRef, useCallback, useEffect } from 'react';

interface UseOpenAITranscriptionReturn {
    isConnected: boolean;
    isTranscribing: boolean;
    transcript: string;
    audioLevel: number;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    clearTranscript: () => void;
}

export function useOpenAITranscription(): UseOpenAITranscriptionReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setAudioLevel(average);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, []);

    const connect = useCallback(async () => {
        try {
            setError(null);
            setIsTranscribing(true);

            // Get ephemeral token from our server
            const tokenResponse = await fetch('/api/realtime/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-realtime-preview-2025-06-03',
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
                },
                video: false,
            });

            mediaStreamRef.current = stream;

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

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                ],
            });

            peerConnectionRef.current = pc;

            // Add local audio track
            pc.addTrack(stream.getAudioTracks()[0], stream);

            // Set up data channel for events
            const dc = pc.createDataChannel('oai-events');
            dataChannelRef.current = dc;

            dc.addEventListener('open', () => {
                console.log('Data channel opened for transcription');
            });

            dc.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Transcription event:', data);

                    // Handle transcription events
                    switch (data.type) {
                        case 'transcript':
                            if (data.text) {
                                setTranscript(prev => prev + ' ' + data.text);
                            }
                            break;
                        case 'transcript_final':
                            if (data.text) {
                                setTranscript(prev => prev + ' ' + data.text);
                                setIsTranscribing(false);
                            }
                            break;
                        case 'error':
                            setError(data.error || 'Unknown error');
                            break;
                    }
                } catch (err) {
                    console.error('Error parsing data channel message:', err);
                }
            });

            // Create and send offer for transcription-only
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2025-06-03';

            const sdpResponse = await fetch(`${baseUrl}?model=${model}&intent=transcription`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    'Authorization': `Bearer ${ephemeralKey}`,
                    'Content-Type': 'application/sdp',
                },
            });

            if (!sdpResponse.ok) {
                throw new Error('Failed to establish WebRTC connection for transcription');
            }

            const answer = {
                type: 'answer',
                sdp: await sdpResponse.text(),
            };

            await pc.setRemoteDescription(answer);
            setIsConnected(true);
            setIsTranscribing(false);

        } catch (err) {
            console.error('Error connecting to Realtime API for transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect');
            setIsTranscribing(false);
        }
    }, [updateAudioLevel]);

    const disconnect = useCallback(() => {
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        setIsConnected(false);
        setIsTranscribing(false);
        setAudioLevel(0);
        setError(null);
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
        transcript,
        audioLevel,
        error,
        connect,
        disconnect,
        clearTranscript,
    };
} 