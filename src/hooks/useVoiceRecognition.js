import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const { addToast } = useToast();

  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      addToast('Reconnaissance vocale non supportée sur ce navigateur', 'warning');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      addToast('Écoute en cours... Parlez maintenant', 'info');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && onResult) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      addToast('Erreur de reconnaissance vocale: ' + event.error, 'error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      return recognition;
    } catch (error) {
      addToast('Impossible de démarrer la reconnaissance vocale', 'error');
      return null;
    }
  };

  return { isListening, startListening };
};