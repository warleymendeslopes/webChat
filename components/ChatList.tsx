"use client";

import { subscribeToChats } from "@/lib/firestore";
import { Chat } from "@/types";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ChatListProps {
  userId: string;
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatList({
  userId,
  onSelectChat,
  selectedChatId,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToChats(userId, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <MessageCircle size={48} className="mb-4" />
        <p>Nenhuma conversa ainda</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
            selectedChatId === chat.id ? "bg-gray-200" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
            <MessageCircle size={24} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold text-gray-900 truncate">Conversa</h3>
              <span className="text-xs text-gray-500 ml-2">
                {format(chat.lastMessageTimestamp, "HH:mm")}
              </span>
            </div>
            {chat.lastMessage && (
              <p className="text-sm text-gray-600 truncate">
                {chat.lastMessage.text || "Mídia"}
              </p>
            )}
          </div>
          {chat.unreadCount[userId] > 0 && (
            <div className="ml-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {chat.unreadCount[userId]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
