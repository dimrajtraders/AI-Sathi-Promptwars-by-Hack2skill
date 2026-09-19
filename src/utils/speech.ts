// Browser Web Speech API helper for TTS and STT with elder-friendly pacing

export const LANGUAGE_VOICE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  ta: 'ta-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  gu: 'gu-IN',
  fr: 'fr-FR',
  de: 'de-DE',
};

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function speakText(
  text: string,
  lang: string = 'en',
  speed: number = 0.9,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: unknown) => void
): void {
  if (!isSpeechSynthesisSupported()) {
    onError?.('Speech synthesis not supported on this device');
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Clean markdown asterisks or symbols for smoother speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = Math.max(0.7, Math.min(1.2, speed));
    utterance.pitch = 1.0;
    utterance.lang = LANGUAGE_VOICE_MAP[lang] || 'en-US';

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      // Many browsers report 'interrupted' when cancel is called, which is expected
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        onError?.(e);
      }
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    onError?.(err);
    onEnd?.();
  }
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function createSpeechRecognizer(
  lang: string = 'en',
  onResult: (transcript: string) => void,
  onError: (errorMsg: string) => void,
  onStateChange?: (listening: boolean) => void
): SpeechRecognitionController | null {
  if (!isSpeechRecognitionSupported()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognizer = new SpeechRecognitionAPI();

    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = LANGUAGE_VOICE_MAP[lang] || 'en-US';

    recognizer.onstart = () => {
      onStateChange?.(true);
    };

    recognizer.onend = () => {
      onStateChange?.(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognizer.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognizer.onerror = (event: any) => {
      onStateChange?.(false);
      if (event.error === 'no-speech') {
        onError('No speech detected. Please speak clearly into your microphone.');
      } else if (event.error === 'not-allowed') {
        onError('Microphone access is blocked. Please allow microphone permission in your browser.');
      } else {
        onError(`Speech recognition notice: ${event.error || 'error'}`);
      }
    };

    return {
      start: () => {
        try {
          recognizer.start();
        } catch {
          // might already be running
        }
      },
      stop: () => {
        try {
          recognizer.stop();
        } catch {
          // ignore
        }
      },
      abort: () => {
        try {
          recognizer.abort();
        } catch {
          // ignore
        }
      },
    };
  } catch (e) {
    console.warn('SpeechRecognition initialization error:', e);
    return null;
  }
}
