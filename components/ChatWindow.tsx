"use client";

import { playBeep } from "@/lib/audioUtils";
import {
  setChatAiControl,
  subscribeToChat,
  subscribeToMessages,
} from "@/lib/firestore";
import { Message } from "@/types";
import { Lead } from "@/types/leads";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LeadQuickActions from "./LeadQuickActions";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
  recipientPhone: string;
  companyId: string;
  onBack?: () => void;
}

export default function ChatWindow({
  chatId,
  currentUserId,
  recipientPhone,
  companyId,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiControl, setAiControl] = useState<boolean>(false);
  const [windowExpired, setWindowExpired] = useState<boolean>(false);
  const [checkingWindow, setCheckingWindow] = useState<boolean>(true);
  const [leadData, setLeadData] = useState<Lead | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    const unsubscribeChat = subscribeToChat(chatId, (chat) => {
      setAiControl(Boolean((chat as any)?.aiControl));
    });

    return () => {
      unsubscribe();
      unsubscribeChat();
    };
  }, [chatId]);

  // 🆕 NOVO: Verificar janela de 24h periodicamente
  useEffect(() => {
    const checkWindow = async () => {
      try {
        const response = await fetch(`/api/check-24h-window?chatId=${chatId}`);
        const data = await response.json();
        setWindowExpired(data.expired || false);
        setCheckingWindow(false);
      } catch (error) {
        console.error("Error checking 24h window:", error);
        setCheckingWindow(false);
      }
    };

    // Verificar imediatamente
    checkWindow();

    // Verificar a cada 1 minuto
    const interval = setInterval(checkWindow, 60000);

    return () => clearInterval(interval);
  }, [chatId]);

  // 🆕 NOVO: Buscar dados do lead
  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await fetch(`/api/leads/by-chat/${chatId}`);
        if (response.ok) {
          const data = await response.json();
          setLeadData(data.lead);
        }
      } catch (error) {
        console.error("Error fetching lead:", error);
      }
    };

    fetchLead();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      prevMessageCountRef.current = 0;
      return;
    }

    const previousCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    prevMessageCountRef.current = currentCount;

    if (currentCount > previousCount) {
      const lastMessage = messages[currentCount - 1];
      // Beep apenas quando chegar mensagem do cliente (WhatsApp)
      if (lastMessage && lastMessage.isFromWhatsApp) {
        playBeep();
      }
    }
  }, [messages, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDisableAi = async () => {
    try {
      await setChatAiControl(chatId, false);
    } catch (e) {
      console.error("Falha ao desativar IA:", e);
      alert("Falha ao desativar IA");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Sticky Header + Banner */}
      <div className="sticky top-0 z-20">
        <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex items-center justify-between shadow-sm">
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
              <p className="text-xs text-gray-500">
                {aiControl ? "IA no controle" : "Atendente"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Lead Quick Actions */}
            <LeadQuickActions
              chatId={chatId}
              leadData={leadData}
              onLeadUpdate={(updatedLead) => setLeadData(updatedLead)}
            />

            {aiControl && (
              <button
                onClick={handleDisableAi}
                className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Desativar IA
              </button>
            )}
            <button className="text-gray-600 hover:text-gray-900">
              <MoreVertical size={22} />
            </button>
          </div>
        </div>

        {aiControl && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <span className="text-amber-900 text-sm font-medium">
              IA no controle desta conversa
            </span>
            <button
              onClick={handleDisableAi}
              className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Desativar IA
            </button>
          </div>
        )}

        {/* 🆕 NOVO: Banner de janela de 24h expirada */}
        {windowExpired && !aiControl && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-900 text-sm font-medium">
                ⏰ Janela de 24h expirada - Aguarde o cliente enviar uma nova
                mensagem para poder responder
              </span>
            </div>
          </div>
        )}
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
                // Alinhar à direita quando NÃO for do WhatsApp (ou seja, atendente/IA)
                isOwn={!message.isFromWhatsApp}
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
        companyId={companyId}
        disabled={aiControl || windowExpired}
        disabledMessage={
          aiControl
            ? "IA está no controle desta conversa"
            : windowExpired
            ? "Janela de 24h expirada - aguarde mensagem do cliente"
            : undefined
        }
      />
    </div>
  );
}
