"use client";

import AttendantStatusControl from "@/components/AttendantStatusControl";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import LoadingSpinner from "@/components/LoadingSpinner";
import SafeRedirect from "@/components/SafeRedirect";
import { useAuthState } from "@/hooks/useAuthState";
import { auth } from "@/lib/firebase";
import { clearUnread, getChatRecipientPhone } from "@/lib/firestore";
import { signOut } from "firebase/auth";
import { LogOut, Menu, MessageCircle, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { user, firestoreUserId, roleData, loading } = useAuthState();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { role, companyId } = roleData;

  // Evitar renderização desnecessária
  const shouldRender =
    !loading &&
    user &&
    firestoreUserId &&
    role &&
    companyId &&
    companyId !== null;

  // Debug logs para identificar problemas
  console.log("Debug - shouldRender:", shouldRender, {
    loading,
    user: !!user,
    firestoreUserId: !!firestoreUserId,
    role,
    companyId,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setIsMobileMenuOpen(false);

    // Get the recipient's phone number from the chat
    if (firestoreUserId) {
      const phone = await getChatRecipientPhone(chatId, firestoreUserId);
      setRecipientPhone(phone);
      // Clear unread for the current user when opening the chat
      await clearUnread(chatId, firestoreUserId);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando chat..." />;
  }

  // Redirecionamentos seguros
  if (!user) {
    return <SafeRedirect to="/login" condition={true} loading={loading} />;
  }

  if (user && role === null && !loading) {
    return <SafeRedirect to="/login" condition={true} loading={loading} />;
  }

  // Se não tem user, role ou companyId, está sendo redirecionado
  if (!shouldRender) {
    return <LoadingSpinner message="Carregando dados do usuário..." />;
  }

  // Apenas admin e attendant podem acessar o chat
  if (role !== "admin" && role !== "attendant") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Acesso negado</p>
      </div>
    );
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
          <Link
            href="/leads"
            className="hidden sm:flex items-center space-x-2 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Users size={20} />
            <span className="text-sm">Leads</span>
          </Link>

          {role === "admin" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center space-x-2 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Settings size={20} />
              <span className="text-sm">Admin</span>
            </Link>
          )}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </span>
            </div>
            <span className="text-sm">{user.displayName || user.email}</span>
            {role === "attendant" && (
              <span className="text-xs bg-green-500 px-2 py-1 rounded">
                Atendente
              </span>
            )}
          </div>

          {/* Status Control for Attendants */}
          {role === "attendant" && firestoreUserId && companyId && (
            <AttendantStatusControl
              userId={firestoreUserId}
              companyId={companyId}
            />
          )}

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
          {companyId && (
            <ChatList
              userId={firestoreUserId}
              companyId={companyId}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChatId || undefined}
            />
          )}
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col">
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              currentUserId={firestoreUserId}
              recipientPhone={recipientPhone}
              companyId={companyId}
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
