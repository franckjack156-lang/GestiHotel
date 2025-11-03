// src/hooks/useVoiceRecognition.js - VERSION PROPRE
import { useState } from 'react';
import { toast } from '../utils/toast'; // ✨ NOUVEAU

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);

  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.warning('Reconnaissance vocale non supportée sur ce navigateur');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Écoute en cours... Parlez maintenant');
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
      toast.error('Erreur de reconnaissance vocale: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      return recognition;
    } catch (error) {
      toast.error('Impossible de démarrer la reconnaissance vocale');
      return null;
    }
  };

  return { isListening, startListening };
};