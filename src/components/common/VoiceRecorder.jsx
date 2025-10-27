import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';

const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioElement = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setHasRecording(true);
        
        // Créer un URL pour la prévisualisation
        const audioUrl = URL.createObjectURL(blob);
        if (audioElement.current) {
          audioElement.current.src = audioUrl;
        }
        
        // Arrêter tous les tracks du stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Timer pour le temps d'enregistrement
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (audioElement.current) {
      if (isPlaying) {
        audioElement.current.pause();
      } else {
        audioElement.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
  };

  const deleteRecording = () => {
    setHasRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (audioElement.current) {
      audioElement.current.src = '';
    }
  };

  const sendRecording = () => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-white">
          Enregistrement vocal
        </h3>
        {!hasRecording && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Indicateur d'enregistrement */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-700 dark:text-red-300 font-medium">
            Enregistrement en cours...
          </span>
          <span className="text-red-600 dark:text-red-400 ml-auto">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Prévisualisation audio */}
      {hasRecording && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Durée: {formatTime(recordingTime)}
              </div>
              <audio
                ref={audioElement}
                onEnded={handlePlaybackEnd}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-2">
        {!hasRecording ? (
          <>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mic size={16} />
                Démarrer
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Square size={16} />
                Arrêter
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={deleteRecording}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
            <button
              onClick={sendRecording}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Envoyer
            </button>
          </>
        )}
      </div>

      {/* Message d'aide */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
        {!hasRecording 
          ? "Cliquez sur 'Démarrer' pour commencer l'enregistrement" 
          : "Écoutez votre enregistrement avant de l'envoyer"
        }
      </p>
    </div>
  );
};

export default VoiceRecorder;