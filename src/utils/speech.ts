let voices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakEnglish(
  text: string,
  preferredVoice: 'en-US' | 'en-GB' = 'en-US',
  rate: number = 0.9
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferredVoice;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      if (voices.length === 0) {
        voices = window.speechSynthesis.getVoices();
      }

      // Try to find natural matching voice
      const targetLang = preferredVoice === 'en-GB' ? 'en-GB' : 'en-US';
      const voice =
        voices.find((v) => v.lang.replace('_', '-') === targetLang) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        null;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}
