"use client";

import AuthForm from "@/components/AuthForm";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, loading, firestoreUserId } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setRecipientPhone("+5511999999999"); // TODO: Get actual recipient phone
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !firestoreUserId) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <MessageCircle size={28} />
          <h1 className="text-xl font-semibold">WhatsApp Chat</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </span>
            </div>
            <span className="text-sm">{user.displayName || user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="hover:bg-green-700 p-2 rounded-full transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <aside
          className={`
            ${isMobileMenuOpen ? "block" : "hidden"} 
            lg:block 
            w-full lg:w-96 
            bg-white 
            border-r border-gray-300 
            absolute lg:relative 
            h-full 
            z-10
          `}
        >
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-xl font-semibold text-gray-900">Conversas</h2>
          </div>
          <ChatList
            userId={firestoreUserId}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId || undefined}
          />
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              currentUserId={firestoreUserId}
              recipientPhone={recipientPhone}
              onBack={() => setSelectedChatId(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
              <MessageCircle size={64} className="mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold mb-2">WhatsApp Chat</h2>
              <p className="text-center max-w-md px-4">
                Selecione uma conversa para começar a enviar mensagens
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
