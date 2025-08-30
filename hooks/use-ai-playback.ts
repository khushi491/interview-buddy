import { useState, useCallback } from 'react';

export function useAIPlayback() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const playAudio = useCallback(async (text: string) => {
        if (!text) return;

        console.log("Attempting to play audio for text:", text);
        setIsPlaying(true);
        setError(null);

        try {
            const response = await fetch('/api/interview/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: text }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch audio' }));
                throw new Error(errorData.error);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = (e) => {
                console.error("Audio playback error:", e);
                setError("Failed to play audio.");
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (err) {
            console.error('Error playing AI audio:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsPlaying(false);
        }
    }, []);

    return { isPlaying, playAudio, error };
}
