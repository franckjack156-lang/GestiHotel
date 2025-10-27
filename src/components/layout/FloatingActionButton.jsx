import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, label = "Nouvelle intervention" }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center z-40 group"
    >
      <Plus size={28} />
      <span className="absolute right-16 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};

export default FloatingActionButton;