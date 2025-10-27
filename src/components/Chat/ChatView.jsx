// src/components/Chat/ChatView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, Users, MoreVertical, Phone, Video,
  Paperclip, Smile, X, Check, CheckCheck, Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  or,
  and
} from 'firebase/firestore';
import { db } from '../../Config/firebase';
import { useToast } from '../../contexts/ToastContext';

const ChatView = ({ user, users }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Charger les conversations
  useEffect(() => {
    if (!user) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      or(
        where('participants', 'array-contains', user.uid),
        where('createdBy', '==', user.uid)
      ),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const convos = [];
      snapshot.forEach((doc) => {
        convos.push({ id: doc.id, ...doc.data() });
      });
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Charger les messages de la conversation active
  useEffect(() => {
    if (!activeConversation) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversation.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);

      // Marquer comme lus
      msgs.forEach((msg) => {
        if (!msg.read && msg.senderId !== user.uid) {
          updateDoc(doc(db, 'messages', msg.id), {
            read: true,
            readAt: serverTimestamp()
          });
        }
      });
    });

    return () => unsubscribe();
  }, [activeConversation, user]);

  // Créer ou trouver une conversation
  const startConversation = async (otherUser) => {
    // Chercher si une conversation existe déjà
    const existing = conversations.find(conv => 
      conv.participants.includes(otherUser.id) && 
      conv.participants.includes(user.uid)
    );

    if (existing) {
      setActiveConversation(existing);
      return;
    }

    // Créer une nouvelle conversation
    try {
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, otherUser.id],
        participantNames: {
          [user.uid]: user.name,
          [otherUser.id]: otherUser.name
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: '',
        unreadCount: {
          [user.uid]: 0,
          [otherUser.id]: 0
        }
      });

      const newConv = {
        id: conversationRef.id,
        participants: [user.uid, otherUser.id],
        participantNames: {
          [user.uid]: user.name,
          [otherUser.id]: otherUser.name
        }
      };

      setActiveConversation(newConv);
    } catch (error) {
      console.error('Erreur création conversation:', error);
      addToast({
        type: 'error',
        message: 'Erreur lors de la création de la conversation'
      });
    }
  };

  // Envoyer un message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await addDoc(collection(db, 'messages'), {
        conversationId: activeConversation.id,
        senderId: user.uid,
        senderName: user.name,
        content: newMessage.trim(),
        type: 'text',
        createdAt: serverTimestamp(),
        read: false
      });

      // Mettre à jour la conversation
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: user.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      addToast({
        type: 'error',
        message: 'Erreur lors de l\'envoi du message'
      });
    }
  };

  // Obtenir l'autre utilisateur d'une conversation
  const getOtherUser = (conversation) => {
    const otherUserId = conversation.participants.find(id => id !== user.uid);
    return users.find(u => u.id === otherUserId) || {
      id: otherUserId,
      name: conversation.participantNames?.[otherUserId] || 'Utilisateur inconnu'
    };
  };

  // Formater l'heure
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(u => 
    u.id !== user.uid &&
    u.active !== false &&
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Liste des conversations */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-1">Cliquez sur un utilisateur pour démarrer</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const isActive = activeConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition ${
                    isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                        {otherUser.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 dark:text-white truncate">
                          {otherUser.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conv.lastMessage || 'Démarrer la conversation'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {/* Liste des utilisateurs si recherche active */}
          {searchTerm && filteredUsers.length > 0 && (
            <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2">
              <p className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Utilisateurs
              </p>
              {filteredUsers.map((otherUser) => (
                <button
                  key={otherUser.id}
                  onClick={() => startConversation(otherUser)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                        {otherUser.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {otherUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {otherUser.role}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header du chat */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                    {getOtherUser(activeConversation).name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {getOtherUser(activeConversation).name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    En ligne
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <Phone size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => {
                const isOwn = message.senderId === user.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                        isOwn ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {isOwn && (
                          message.read ? (
                            <CheckCheck size={14} />
                          ) : (
                            <Check size={14} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ImageIcon size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Smile size={20} />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users size={64} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Choisissez une conversation existante ou démarrez-en une nouvelle
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;