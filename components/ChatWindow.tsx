"use client";

import { subscribeToMessages } from "@/lib/firestore";
import { Message } from "@/types";
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  recipientPhone: string;
  onBack?: () => void;
}

export default function ChatWindow({
  chatId,
  currentUserId,
  recipientPhone,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 font-semibold">
              {recipientPhone[0]}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{recipientPhone}</h2>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900">
            <Video size={22} />
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            <Phone size={22} />
          </button>
          <button className="text-gray-600 hover:text-gray-900">
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput
        chatId={chatId}
        senderId={currentUserId}
        recipientPhone={recipientPhone}
      />
    </div>
  );
}
