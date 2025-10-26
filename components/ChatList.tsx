"use client";

import { playNotificationSound } from "@/lib/audioUtils";
import { subscribeToChats } from "@/lib/firestore";
import { Chat } from "@/types";
import { ChatAssignment } from "@/types/admin";
import { format } from "date-fns";
import { MessageCircle, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatListProps {
  userId: string;
  companyId: string; // CRÍTICO: Isolamento por empresa
  onSelectChat: (chatId: string) => void | Promise<void>;
  selectedChatId?: string;
  viewedChatIds?: string[];
}

export default function ChatList({
  userId,
  companyId,
  onSelectChat,
  selectedChatId,
  viewedChatIds,
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<
    Record<string, ChatAssignment>
  >({});
  const prevUnreadRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const unsubscribe = subscribeToChats(userId, companyId, (updatedChats) => {
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

      if (shouldBeep) {
        playNotificationSound();
      }

      setChats(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, companyId]);

  // 🆕 NOVO: Buscar atribuições dos chats
  useEffect(() => {
    const fetchAssignments = async () => {
      if (chats.length === 0) return;

      try {
        const assignmentsMap: Record<string, ChatAssignment> = {};

        // Buscar atribuição de cada chat
        for (const chat of chats) {
          try {
            const response = await fetch(
              `/api/chat-assignments?chatId=${chat.id}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.assignment) {
                assignmentsMap[chat.id] = data.assignment;
              }
            }
          } catch (error) {
            console.error(
              `Failed to fetch assignment for chat ${chat.id}:`,
              error
            );
          }
        }

        setAssignments(assignmentsMap);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    fetchAssignments();
  }, [chats]);

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
      {chats.map((chat) => {
        const assignment = assignments[chat.id];
        const isAssignedToMe = assignment?.assignedTo === userId;
        const isUnassigned = !assignment?.assignedTo;
        const isAssignedToOther =
          assignment?.assignedTo && assignment.assignedTo !== userId;

        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 transition-colors ${
              selectedChatId === chat.id ? "bg-gray-200" : ""
            } ${isAssignedToMe ? "border-l-4 border-green-500" : ""} ${
              isUnassigned ? "border-l-4 border-amber-400" : ""
            }`}
          >
            <div className="relative mr-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <MessageCircle size={24} className="text-gray-600" />
              </div>
              {/* Indicador de atribuição */}
              {isAssignedToMe && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <User size={12} className="text-white" />
                </div>
              )}
              {isUnassigned && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                  <Users size={12} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    Conversa
                  </h3>
                  {/* Badge de status */}
                  {isAssignedToMe && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Meu
                    </span>
                  )}
                  {isUnassigned && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Fila
                    </span>
                  )}
                  {isAssignedToOther && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Outro
                    </span>
                  )}
                </div>
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
        );
      })}
    </div>
  );
}
