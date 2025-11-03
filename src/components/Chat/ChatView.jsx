// ==========================================
// 💬 CHATVIEW - VERSION COMPLÈTE FIREBASE
// ==========================================
// Ce composant implémente un système de chat en temps réel
// avec Firebase Firestore et toutes les fonctionnalités nécessaires

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Users as UsersIcon,
  Search,
  X,
  CheckCheck,
  Check
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ChatView = ({ currentUser, users = [] }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ==========================================
  // 📨 CHARGER LES CONVERSATIONS
  // ==========================================
  useEffect(() => {
    if (!currentUser) return;

    const loadConversations = async () => {
      try {
        const conversationsMap = {};

        // Récupérer tous les messages impliquant l'utilisateur actuel
        const q1 = query(
          collection(db, 'messages'),
          where('senderId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const q2 = query(
          collection(db, 'messages'),
          where('recipientId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const [sentSnapshot, receivedSnapshot] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        // Traiter les messages envoyés
        sentSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const otherId = data.recipientId;
          if (!conversationsMap[otherId] || data.createdAt?.toDate() > conversationsMap[otherId].lastMessage.createdAt?.toDate()) {
            conversationsMap[otherId] = {
              userId: otherId,
              lastMessage: data,
              unreadCount: 0
            };
          }
        });

        // Traiter les messages reçus
        receivedSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const otherId = data.senderId;
          const isUnread = !data.read;

          if (!conversationsMap[otherId]) {
            conversationsMap[otherId] = {
              userId: otherId,
              lastMessage: data,
              unreadCount: isUnread ? 1 : 0
            };
          } else {
            if (data.createdAt?.toDate() > conversationsMap[otherId].lastMessage.createdAt?.toDate()) {
              conversationsMap[otherId].lastMessage = data;
            }
            if (isUnread) {
              conversationsMap[otherId].unreadCount++;
            }
          }
        });

        // Enrichir avec les données utilisateur
        const conversationsArray = Object.values(conversationsMap).map(conv => {
          const user = users.find(u => u.id === conv.userId);
          return {
            ...conv,
            user: user || { id: conv.userId, name: 'Utilisateur inconnu', role: 'unknown' }
          };
        });

        // Trier par date du dernier message
        conversationsArray.sort((a, b) => {
          const aDate = a.lastMessage.createdAt?.toDate() || new Date(0);
          const bDate = b.lastMessage.createdAt?.toDate() || new Date(0);
          return bDate - aDate;
        });

        setConversations(conversationsArray);
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement conversations:', error);
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser, users]);

  // ==========================================
  // 💬 CHARGER LES MESSAGES D'UNE CONVERSATION
  // ==========================================
  useEffect(() => {
    if (!currentUser || !selectedUser) {
      setMessages([]);
      return;
    }

    // Query pour les messages entre les deux utilisateurs
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
        .filter(msg => 
          (msg.senderId === currentUser.uid && msg.recipientId === selectedUser.id) ||
          (msg.senderId === selectedUser.id && msg.recipientId === currentUser.uid)
        );

      setMessages(messagesData);

      // Marquer comme lu les messages reçus
      messagesData.forEach(async (msg) => {
        if (msg.recipientId === currentUser.uid && !msg.read) {
          await updateDoc(doc(db, 'messages', msg.id), {
            read: true,
            readAt: serverTimestamp()
          });
        }
      });

      scrollToBottom();
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  // ==========================================
  // 📤 ENVOYER UN MESSAGE
  // ==========================================
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser || !currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: message.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.name || currentUser.email,
        recipientId: selectedUser.id,
        recipientName: selectedUser.name || selectedUser.email,
        participants: [currentUser.uid, selectedUser.id],
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ==========================================
  // 🔍 FILTRAGE DES CONVERSATIONS
  // ==========================================
  const filteredConversations = conversations.filter(conv =>
    conv.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // 🎨 HELPERS POUR L'AFFICHAGE
  // ==========================================
  const formatMessageTime = (date) => {
    if (!date) return '';
    return formatDistanceToNow(date, { locale: fr, addSuffix: true });
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      technician: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      reception: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role] || colors.reception;
  };

  const getRoleLabel = (role) => {
    const labels = {
      superadmin: 'Super Admin',
      manager: 'Manager',
      technician: 'Technicien',
      reception: 'Réception'
    };
    return labels[role] || role;
  };

  // ==========================================
  // 🎨 RENDER
  // ==========================================
  return (
    <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex">
      
      {/* ========== SIDEBAR - LISTE DES CONVERSATIONS ========== */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        
        {/* En-tête */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <UsersIcon size={20} />
            Conversations
          </h2>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Chargement...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Aucun résultat' : 'Aucune conversation'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.userId}
                  onClick={() => setSelectedUser(conversation.user)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selectedUser?.id === conversation.user.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-800 dark:text-white truncate">
                          {conversation.user.name || conversation.user.email}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(conversation.user.role)}`}>
                        {getRoleLabel(conversation.user.role)}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-2">
                        {conversation.lastMessage.text}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatMessageTime(conversation.lastMessage.createdAt?.toDate())}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========== ZONE DE CONVERSATION ========== */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* En-tête conversation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {selectedUser.name || selectedUser.email}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 mt-8">
                  Aucun message. Soyez le premier à écrire !
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className={`flex items-center gap-1 text-xs mt-1 ${
                          isOwn ? 'text-indigo-100 justify-end' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>
                            {msg.createdAt.toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isOwn && (
                            msg.read ? <CheckCheck size={14} /> : <Check size={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={20} />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Appuyez sur Entrée pour envoyer
              </p>
            </div>
          </>
        ) : (
          // Message par défaut quand aucune conversation sélectionnée
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
              <p className="text-sm">Choisissez un utilisateur pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;