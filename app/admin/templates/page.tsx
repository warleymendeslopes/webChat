"use client";

import NewTemplateModal from "@/components/NewTemplateModal";
import TemplateManager from "@/components/TemplateManager";
import { useAuthState } from "@/hooks/useAuthState";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
  const router = useRouter();
  const { user, firestoreUserId, roleData, loading } = useAuthState();
  const { role, companyId } = roleData;
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  const shouldRender = !loading && user && role === "admin" && companyId;

  useEffect(() => {
    if (!loading && (!user || role !== "admin" || !companyId)) {
      router.push("/login");
    }
  }, [loading, user, role, companyId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal de Novo Template */}
      {showNewTemplateModal && companyId && firestoreUserId && (
        <NewTemplateModal
          companyId={companyId}
          userId={firestoreUserId}
          onClose={() => setShowNewTemplateModal(false)}
          onSuccess={() => {
            // Recarregar dados será feito pelo TemplateManager
            setShowNewTemplateModal(false);
          }}
        />
      )}

      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Link href="/admin" className="hover:bg-green-700 p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <Settings size={28} />
          <div>
            <h1 className="text-xl font-semibold">Templates do Facebook</h1>
            <p className="text-sm text-green-200">
              Gerencie templates de mensagens para WhatsApp
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewTemplateModal(true)}
          className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 font-medium"
        >
          Novo Template
        </button>
      </header>

      {/* Conteúdo */}
      <main className="p-6">
        <TemplateManager companyId={companyId} userId={firestoreUserId!} />
      </main>
    </div>
  );
}
