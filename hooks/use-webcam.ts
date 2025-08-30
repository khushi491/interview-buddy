import { useEffect, useRef, useState } from "react";

export function useWebcam(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let elementCheckTimeout: NodeJS.Timeout | null = null;

    setError(null);
    console.log('useWebcam effect triggered:', { enabled, retryCount });

    if (enabled) {
      const start = async () => {
        try {
          setIsLoading(true);
          console.log('Starting webcam...');

          // Wait for video element to be available
          let attempts = 0;
          const maxAttempts = 10;

          while (!videoRef.current && attempts < maxAttempts) {
            console.log(`Waiting for video element... attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => {
              elementCheckTimeout = setTimeout(resolve, 100);
            });
            attempts++;
          }

          if (!videoRef.current) {
            throw new Error('Video element not available after waiting');
          }

          console.log('Video element found, proceeding with webcam setup...');

          // Request video stream with better constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          });

          console.log('Webcam stream obtained:', stream);
          console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

          // Double-check video element is still available
          if (!videoRef.current) {
            throw new Error('Video element became unavailable during setup');
          }

          // Ensure video element is properly set up
          const video = videoRef.current;
          console.log('Video element found:', video);

          // Set video properties
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true; // Mute to avoid feedback
          video.controls = false;

          // Set the stream
          video.srcObject = stream;
          console.log('Stream set on video element');

          // Wait for video to be ready
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Video load timeout'));
            }, 5000);

            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
              resolve(true);
            };

            video.onerror = (e) => {
              clearTimeout(timeout);
              console.error('Video error:', e);
              reject(new Error('Video failed to load'));
            };
          });

          // Start playing
          try {
            await video.play();
            console.log('Video started playing');
          } catch (playError) {
            console.warn('Autoplay failed, but video should still work:', playError);
          }

          setIsLoading(false);
          setRetryCount(0); // Reset retry count on success
          console.log('Webcam setup completed successfully');
        } catch (err) {
          console.error("Failed to access webcam", err);
          setIsLoading(false);

          if (err instanceof Error) {
            const errorMessage = `Failed to access webcam: ${err.message}`;
            setError(errorMessage);

            // Retry logic for common issues
            if (retryCount < 2 && (
              err.message.includes('Permission') ||
              err.message.includes('NotAllowedError') ||
              err.message.includes('NotFoundError') ||
              err.message.includes('Video element not available')
            )) {
              console.log(`Retrying webcam access (attempt ${retryCount + 1})...`);
              setRetryCount(prev => prev + 1);

              // Retry after a short delay
              retryTimeout = setTimeout(() => {
                start();
              }, 1000);
            }
          } else {
            setError("Failed to access webcam. Please check permissions.");
          }
        }
      };

      start();
    } else {
      console.log('Webcam disabled, cleaning up...');
      setIsLoading(false);
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (elementCheckTimeout) {
        clearTimeout(elementCheckTimeout);
      }
      if (stream) {
        console.log('Stopping webcam stream');
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [enabled, retryCount]);

  // Force refresh webcam when needed
  const refreshWebcam = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());

      // Small delay to ensure cleanup
      setTimeout(() => {
        setRetryCount(0);
        setError(null);
      }, 100);
    }
  };

  return { videoRef, error, isLoading, refreshWebcam };
}
