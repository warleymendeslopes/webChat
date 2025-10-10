"use client";

import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { auth } from "@/lib/firebase";
import { clearUnread, getChatRecipientPhone } from "@/lib/firestore";
import { signOut } from "firebase/auth";
import { LogOut, Menu, MessageCircle, Settings, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, firestoreUserId } = useAuth();
  const { role, companyId, loading: roleLoading } = useUserRole(user);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirecionar baseado no role
  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      // Não logado - redirecionar para login
      router.push("/login");
    } else if (user && role === null) {
      // Logado mas não cadastrado - redirecionar para login (deixar escolher criar empresa)
      router.push("/login");
    }
  }, [user, role, authLoading, roleLoading, router]);

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

  const loading = authLoading || roleLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Se não tem user, role ou companyId, está sendo redirecionado
  if (!user || !firestoreUserId || !role || !companyId) {
    return null;
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
          {role === "admin" && (
            <>
              <Link
                href="/admin"
                className="hidden sm:flex items-center space-x-2 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Settings size={20} />
                <span className="text-sm">Admin</span>
              </Link>
              <Link
                href="/webhook-info"
                className="hidden sm:flex items-center space-x-2 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
                title="Informações do Webhook"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span className="text-sm">Webhook</span>
              </Link>
            </>
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
