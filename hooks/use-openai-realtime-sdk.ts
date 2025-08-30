import { useCallback, useRef, useState, useEffect } from 'react';
import {
    RealtimeSession,
    RealtimeAgent,
    OpenAIRealtimeWebRTC,
} from '@openai/agents/realtime';

const INTERVIEW_MODEL = 'gpt-4o-realtime-preview-2025-06-03';
const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

export interface UseOpenAIRealtimeSDKReturn {
    isConnected: boolean;
    isTranscribing: boolean;
    isSpeaking: boolean;
    transcript: string;
    liveTranscript: string;
    audioLevel: number;
    error: string | null;
    connect: (interviewContext: any) => Promise<void>;
    disconnect: () => void;
    clearTranscript: () => void;
    sendMessage: (text: string) => void;
    pauseAudio: () => void;
    resumeAudio: () => void;
    mute: (muted: boolean) => void;
    interrupt: () => void;
}

export function useOpenAIRealtimeSDK(): UseOpenAIRealtimeSDKReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const sessionRef = useRef<RealtimeSession | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const interviewContextRef = useRef<any>(null);
    const liveTranscriptRef = useRef<string>('');

    // Audio analysis refs
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Create audio element for SDK
    useEffect(() => {
        if (typeof window !== 'undefined' && !audioElementRef.current) {
            console.log('Creating audio element for SDK...');
            const el = document.createElement('audio');
            el.autoplay = true;
            el.muted = false;
            el.volume = 1.0;
            el.style.display = 'none';
            document.body.appendChild(el);
            audioElementRef.current = el;
            console.log('Audio element created and attached to DOM');
        }

        return () => {
            if (audioElementRef.current && document.body.contains(audioElementRef.current)) {
                document.body.removeChild(audioElementRef.current);
                audioElementRef.current = null;
            }
        };
    }, []);

    // Audio level analysis
    const startAudioAnalysis = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();

            analyser.fftSize = 256;
            source.connect(analyser);

            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            const updateAudioLevel = () => {
                if (analyserRef.current && dataArrayRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                    const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
                    setAudioLevel(average);
                }
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };

            updateAudioLevel();
        } catch (err) {
            console.error('Failed to start audio analysis:', err);
        }
    }, []);

    const stopAudioAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        analyserRef.current = null;
        dataArrayRef.current = null;
        setAudioLevel(0);
    }, []);

    // Create interview agent
    const createInterviewAgent = useCallback((context: any): RealtimeAgent => {
        const { position, interviewType, candidateName, cvText, jobDescription, flow, difficulty = 'medium' } = context;

        const systemPrompt = `You are a friendly and professional AI interviewer conducting a ${interviewType} interview for the position of ${position}.

        CANDIDATE INFORMATION:
        - Name: ${candidateName || 'Candidate'}
        - CV: ${cvText || 'Not provided'}
        
        JOB DESCRIPTION:
        ${jobDescription || 'Not provided'}
        
        INTERVIEW FLOW:
        ${JSON.stringify(flow, null, 2)}
        
        DIFFICULTY LEVEL: ${difficulty}
        
        LANGUAGE REQUIREMENT:
        - Only use English. If the candidate switches languages, politely ask them to continue in English.
        
        INSTRUCTIONS:
        You should conduct a natural, conversational interview. Be warm, engaging, and genuinely curious.
        
        CRITICAL RULES:
        1. Do **not** evaluate or label answers as right or wrong during the interview.
        2. Do **not** provide explanations or feedback while questions are ongoing.
        3. If the candidate goes off-topic or their response becomes very long, interject politely:
           - “Let’s refocus on the question, please.”
           - “Could you summarize your answer in one or two sentences?”
        4. Never repeat or paraphrase the candidate’s last words—move the conversation forward with a new question or prompt.
        5. Ask questions that align with the job requirements and adapt difficulty to the ${difficulty} level.
        6. Maintain a friendly, professional tone—use contractions and natural speech patterns.
        7. Keep the conversation flowing: ask follow-ups only when they clarify or deepen the discussion.
        8. Always remain in English.
        
        DIFFICULTY GUIDELINES:
        - **Easy:** Fundamental questions, very supportive.
        - **Medium:** Practical scenarios, balanced challenge.
        - **Hard:** Advanced concepts, deep technical probing.
        
        START:
        Begin with a warm greeting and a brief introduction in English, then proceed through the defined interview flow without pausing to critique or explain answers. Good luck!
        
        Remember:
            - Start with a warm greeting and brief introduction in English.
            - NEVER repeat what the candidate just said
            - ALWAYS use English for all communication

        
        `;



        return new RealtimeAgent({
            name: 'interviewer',
            instructions: systemPrompt,
            tools: [],
            handoffs: [],
        });
    }, []);

    // Connect to Realtime API
    const connect = useCallback(async (interviewContext: any) => {
        try {
            setError(null);
            setIsConnected(false);
            console.log('Starting connection process...');

            // Store context for later use
            interviewContextRef.current = interviewContext;

            // Ensure audio element exists (create on user gesture path)
            if (typeof window !== 'undefined' && !audioElementRef.current) {
                const el = document.createElement('audio');
                el.autoplay = true;
                el.muted = false;
                el.volume = 1.0;
                // @ts-ignore: playsInline is supported on media elements in browsers
                (el as any).playsInline = true;
                el.style.display = 'none';
                document.body.appendChild(el);
                audioElementRef.current = el;
            }

            // Get ephemeral token
            const tokenResponse = await fetch('/api/realtime/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: INTERVIEW_MODEL,
                    voice: 'alloy',
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get session token');
            }

            const sessionData = await tokenResponse.json();

            if (!sessionData.client_secret?.value) {
                throw new Error('No ephemeral key provided');
            }

            // Create interview agent
            const interviewAgent = createInterviewAgent(interviewContext);

            console.log('Creating RealtimeSession with agent:', interviewAgent);

            // Create session
            sessionRef.current = new RealtimeSession(interviewAgent, {
                transport: new OpenAIRealtimeWebRTC({
                    audioElement: audioElementRef.current || undefined,
                }),
                model: INTERVIEW_MODEL,
                config: {
                    inputAudioFormat: 'pcm16',
                    outputAudioFormat: 'pcm16',
                    inputAudioTranscription: {
                        model: TRANSCRIPTION_MODEL,
                        language: 'en',
                        prompt: 'This is an interview conversation. Please transcribe accurately.',
                    },
                },
                context: interviewContext,
            });

            console.log('Session created, setting up event handlers...');

            // Set up event handlers BEFORE connecting
            sessionRef.current.on('error', (...args: any[]) => {
                console.error('Session error:', args[0]);
                setError(args[0]?.message || 'Connection error');
                setIsConnected(false);
                stopAudioAnalysis();
            });



            // Handle transport events for transcription and responses
            sessionRef.current.on('transport_event', (event: any) => {
                console.log('Transport event:', event);
                console.log('Event type:', event.type, 'Event data:', JSON.stringify(event, null, 2));

                switch (event.type) {
                    case 'input_audio_buffer.speech_started':
                        console.log('Speech started - user is speaking');
                        setIsTranscribing(true);
                        setLiveTranscript('');
                        liveTranscriptRef.current = '';
                        break;
                    case 'input_audio_buffer.speech_ended':
                        console.log('Speech ended - user stopped speaking');
                        // Don't set isTranscribing to false yet, wait for transcription
                        break;
                    case 'conversation.item.input_audio_transcription.start':
                        console.log('Transcription started');
                        setIsTranscribing(true);
                        setLiveTranscript('');
                        liveTranscriptRef.current = '';
                        break;
                    case 'conversation.item.input_audio_transcription.done':
                        console.log('Transcription done');
                        setIsTranscribing(false);
                        {
                            // Finalize user's utterance from buffer (or event payload if available)
                            let finalText = '';
                            if (event.item?.content?.[0]?.transcript) {
                                finalText = event.item.content[0].transcript;
                            } else {
                                finalText = liveTranscriptRef.current;
                            }
                            if (finalText && finalText.trim().length > 0) {
                                console.log('Adding user transcript to conversation:', finalText);
                                setTranscript(prev => prev + '\n\nYou: ' + finalText);
                                console.log('User transcript added, waiting for AI response...');
                            }
                            // Clear live transcript buffer
                            setLiveTranscript('');
                            liveTranscriptRef.current = '';
                        }
                        break;
                    case 'conversation.item.input_audio_transcription.delta': {
                        // Support both shapes: string or { transcript }
                        let textDelta: string = '';
                        if (typeof event.delta === 'string') {
                            textDelta = event.delta;
                        } else if (typeof event.delta?.transcript === 'string') {
                            textDelta = event.delta.transcript;
                        }
                        if (textDelta) {
                            console.log('Transcription delta:', textDelta);
                            setLiveTranscript(prev => {
                                const next = prev + textDelta;
                                liveTranscriptRef.current = next;
                                return next;
                            });
                        }
                        break;
                    }
                    case 'response.start':
                        console.log('Response started - AI is speaking');
                        setIsSpeaking(true);
                        break;
                    case 'response.done':
                        console.log('Response done - AI finished speaking');
                        setIsSpeaking(false);
                        break;
                    case 'response.output_item.done':
                        // Handle completed response items (like the one you showed)
                        if (event.item?.content?.[0]?.transcript) {
                            console.log('Response transcript received:', event.item.content[0].transcript);
                            setTranscript(prev => prev + '\n\nAI: ' + event.item.content[0].transcript);
                            console.log('AI transcript added to conversation');
                        } else {
                            console.warn('Response output item done but no transcript found:', event.item);
                        }
                        break;
                    case 'conversation.item.done':
                        // Handle completed conversation items (user input)
                        if (event.item?.role === 'user') {
                            const text = event.item?.content?.[0]?.transcript;
                            // If the event includes a final transcript, prefer it; otherwise rely on buffer (already handled on 'done')
                            if (text && text.trim().length > 0) {
                                console.log('User transcript (conversation.item.done):', text);
                                setTranscript(prev => prev + '\n\nYou: ' + text);
                                setLiveTranscript('');
                                liveTranscriptRef.current = '';
                            }
                        }
                        break;
                    case 'conversation.item.input_audio_transcription.completed':
                        // Some transports emit 'completed' as a finalizer; ensure buffer is flushed once
                        {
                            const text = event.item?.content?.[0]?.transcript || liveTranscriptRef.current;
                            if (text && text.trim().length > 0) {
                                console.log('User transcription completed:', text);
                                setTranscript(prev => prev + '\n\nYou: ' + text);
                                setLiveTranscript('');
                                liveTranscriptRef.current = '';
                            }
                        }
                        break;
                    // Additional event types that might be used
                    case 'input_audio_transcription.start':
                        console.log('Transcription started (alt)');
                        setIsTranscribing(true);
                        break;
                    case 'input_audio_transcription.done':
                        console.log('Transcription done (alt)');
                        setIsTranscribing(false);
                        break;
                    case 'input_audio_transcription.delta':
                        if (event.delta?.transcript) {
                            console.log('Transcription delta (alt):', event.delta.transcript);
                            setLiveTranscript(prev => {
                                const next = prev + event.delta.transcript;
                                liveTranscriptRef.current = next;
                                return next;
                            });
                        }
                        break;
                    case 'input_audio_buffer.speech_started':
                        console.log('Speech started - user is speaking');
                        setIsTranscribing(true);
                        setLiveTranscript('');
                        liveTranscriptRef.current = '';
                        break;
                    case 'input_audio_buffer.speech_ended':
                        console.log('Speech ended - user stopped speaking');
                        // Don't set isTranscribing to false yet, wait for transcription
                        break;
                    case 'input_audio_buffer.committed':
                        console.log('Audio buffer committed - processing user input');
                        break;
                    case 'conversation.item.created':
                        console.log('Conversation item created:', event.item);
                        break;
                    case 'conversation.item.updated':
                        console.log('Conversation item updated:', event.item);
                        break;
                    default:
                        console.log('Unhandled transport event type:', event.type, event);
                        break;
                }
            });

            console.log('Connecting to session with API key...');

            // Connect to the session
            await sessionRef.current.connect({ apiKey: sessionData.client_secret.value });

            console.log('Connect call completed, setting connected status...');

            // Manually set connected status (like the reference implementation)
            setIsConnected(true);
            startAudioAnalysis();

            // Wait a moment for the session to be fully ready, then kick off the conversation
            setTimeout(async () => {
                try {
                    const candidateName = interviewContextRef.current?.candidateName || 'Candidate';
                    console.log('Sending initial greeting message to AI...');

                    // Use a more direct approach to start the conversation
                    const greetingMessage = `Begin the interview now. Greet the candidate by name (${candidateName}), introduce yourself briefly, and ask the first question. Keep your response concise and natural.`;

                    if (sessionRef.current) {
                        console.log('Session exists, sending message:', greetingMessage);
                        await sessionRef.current.sendMessage(greetingMessage);
                        console.log('Initial greeting message sent successfully');
                    } else {
                        console.error('Session not available for initial greeting');
                    }
                } catch (e) {
                    console.warn('Failed to trigger initial greeting:', e);
                }
            }, 1000); // Wait 1 second for session to be fully ready

            // Ensure output audio is audible
            try {
                if (audioElementRef.current) {
                    audioElementRef.current.muted = false;
                    audioElementRef.current.volume = 1.0;
                    audioElementRef.current.autoplay = true;
                    // @ts-ignore: playsInline is supported on media elements in browsers
                    (audioElementRef.current as any).playsInline = true;

                    console.log('Audio element configured:', {
                        muted: audioElementRef.current.muted,
                        volume: audioElementRef.current.volume,
                        autoplay: audioElementRef.current.autoplay
                    });

                    const playPromise = audioElementRef.current.play();
                    if (playPromise && typeof playPromise.then === 'function') {
                        playPromise.then(() => {
                            console.log('Audio playback started successfully');
                        }).catch((err: any) => {
                            console.warn('Autoplay/play failed on audio element:', err);
                        });
                    }
                } else {
                    console.warn('No audio element available for output audio');
                }
            } catch (e) {
                console.warn('Failed to start audio playback:', e);
            }

        } catch (err: any) {
            console.error('Failed to connect:', err);
            setError(err.message || 'Failed to connect');
            setIsConnected(false);
            stopAudioAnalysis();
        }
    }, [createInterviewAgent, startAudioAnalysis, stopAudioAnalysis]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        setIsConnected(false);
        setIsTranscribing(false);
        setIsSpeaking(false);
        setError(null);
        stopAudioAnalysis();
    }, [stopAudioAnalysis]);

    // Clear transcript
    const clearTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    // Send message
    const sendMessage = useCallback((text: string) => {
        if (sessionRef.current && isConnected) {
            sessionRef.current.sendMessage(text);
        }
    }, [isConnected]);

    // Pause audio
    const pauseAudio = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.mute(true);
        }
    }, []);

    // Resume audio
    const resumeAudio = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.mute(false);
        }
        // Also ensure output element is unmuted and playing
        try {
            if (audioElementRef.current) {
                audioElementRef.current.muted = false;
                audioElementRef.current.volume = 1.0;
                const playPromise = audioElementRef.current.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.catch((err: any) => {
                        console.warn('Audio play failed on resume:', err);
                    });
                }
            }
        } catch (e) {
            console.warn('Failed to unmute/play output audio:', e);
        }
    }, []);

    // Mute/unmute
    const mute = useCallback((muted: boolean) => {
        if (sessionRef.current) {
            sessionRef.current.mute(muted);
        }
    }, []);

    // Interrupt
    const interrupt = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.interrupt();
        }
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
        liveTranscript,
        audioLevel,
        error,
        connect,
        disconnect,
        clearTranscript,
        sendMessage,
        pauseAudio,
        resumeAudio,
        mute,
        interrupt,
    };
} 