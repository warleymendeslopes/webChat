"use client";

import { subscribeToChats } from "@/lib/firestore";
import { Chat } from "@/types";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatListProps {
  userId: string;
  onSelectChat: (chatId: string) => void | Promise<void>;
  selectedChatId?: string;
  viewedChatIds?: string[];
}

export default function ChatList({
  userId,
  onSelectChat,
  selectedChatId,
  viewedChatIds,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUnreadRef = useRef<Record<string, number>>({});

  function playBeep() {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      o.start();
      // Stop after 160ms
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      o.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // ignore audio errors
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToChats(userId, (updatedChats) => {
      // Sort: unread first, then by last message desc
      const sorted = [...updatedChats].sort((a, b) => {
        const aUnread = (a.unreadCount && a.unreadCount[userId]) || 0;
        const bUnread = (b.unreadCount && b.unreadCount[userId]) || 0;
        if (aUnread !== bUnread) return bUnread - aUnread;
        const aTs = a.lastMessageTimestamp?.getTime?.() || 0;
        const bTs = b.lastMessageTimestamp?.getTime?.() || 0;
        return bTs - aTs;
      });

      // Detect increases in unread counts to play sound
      let shouldBeep = false;
      for (const chat of sorted) {
        const current = (chat.unreadCount && chat.unreadCount[userId]) || 0;
        const prev = prevUnreadRef.current[chat.id] || 0;
        if (current > prev) {
          shouldBeep = true;
        }
      }
      // Update ref after comparison
      const nextMap: Record<string, number> = {};
      for (const chat of sorted) {
        nextMap[chat.id] = (chat.unreadCount && chat.unreadCount[userId]) || 0;
      }
      prevUnreadRef.current = nextMap;

      if (
        shouldBeep &&
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        playBeep();
      }

      setChats(sorted);
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
          <div className="relative mr-3">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <MessageCircle size={24} className="text-gray-600" />
            </div>
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
          {chat.unreadCount && chat.unreadCount[userId] > 0 && (
            <div className="ml-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {chat.unreadCount[userId]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
