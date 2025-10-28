// src/components/Chat/ChatView.jsx
import React, { useState } from 'react';
import { Send, MessageSquare, Users as UsersIcon } from 'lucide-react';

const ChatView = ({ user, users = [] }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      senderId: user.uid,
      senderName: user.name,
      recipientId: selectedUser.id,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const getConversations = () => {
    return users
      .filter(u => u.id !== user.uid)
      .map(u => ({
        ...u,
        lastMessage: 'Aucun message',
        unread: 0
      }));
  };

  return (
    <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex">
      {/* Liste des conversations */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <UsersIcon size={20} />
            Conversations
          </h2>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {getConversations().map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedUser(conversation)}
              className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                selectedUser?.id === conversation.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                    {conversation.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800 dark:text-white truncate">
                      {conversation.name}
                    </p>
                    {conversation.unread > 0 && (
                      <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {selectedUser.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {selectedUser.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <MessageSquare size={48} className="mb-3" />
                  <p>Aucun message</p>
                  <p className="text-sm">Commencez la conversation</p>
                </div>
              ) : (
                messages
                  .filter(m => 
                    (m.senderId === user.uid && m.recipientId === selectedUser.id) ||
                    (m.senderId === selectedUser.id && m.recipientId === user.uid)
                  )
                  .map((msg) => {
                    const isOwn = msg.senderId === user.uid;
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
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {msg.timestamp.toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Input message */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrire un message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Sélectionnez une conversation</p>
              <p className="text-sm">Choisissez un utilisateur pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;