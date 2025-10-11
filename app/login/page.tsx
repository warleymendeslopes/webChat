"use client";

import AuthForm from "@/components/AuthForm";
import SafeRedirect from "@/components/SafeRedirect";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const roleData = useUserRole(user);
  const {
    role,
    hasPendingInvite,
    inviteCompanyId,
    loading: roleLoading,
  } = roleData;
  // Toast notifications
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
    if (typeof window !== "undefined") {
      window.clearTimeout((showToast as any)._t);
      (showToast as any)._t = window.setTimeout(() => setToast(null), 4000);
    }
  };

  const acceptInvite = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      const response = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseAuthUid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }),
      });

      if (response.ok) {
        showToast("Bem-vindo! Você foi adicionado como atendente.", "success");
        router.push("/");
      } else {
        const data = await response.json();
        showToast(data.error || "Erro ao aceitar convite", "error");
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      showToast("Erro ao aceitar convite", "error");
    }
  }, [user, router]);

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (user && role === null && hasPendingInvite && inviteCompanyId) {
      // Tem convite pendente - aceitar automaticamente
      acceptInvite();
    }
  }, [
    user,
    role,
    authLoading,
    roleLoading,
    hasPendingInvite,
    inviteCompanyId,
    acceptInvite,
  ]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Redirecionamento seguro para usuários já cadastrados
  if (user && role && role !== null) {
    return (
      <SafeRedirect
        to="/"
        condition={true}
        loading={authLoading || roleLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-md shadow-lg px-4 py-3 text-sm transition-colors ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
      <div className="max-w-md w-full">
        <AuthForm onAuthSuccess={() => {}} />

        {user && role === null && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 text-center mb-3">
              ✅ Você está logado! Agora pode cadastrar sua empresa.
            </p>
            <Link
              href="/onboarding"
              className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 font-semibold"
            >
              Cadastrar Minha Empresa
            </Link>
          </div>
        )}

        {!user && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma empresa cadastrada?{" "}
              <span className="text-gray-800 font-semibold">
                Faça login acima primeiro
              </span>
            </p>
          </div>
        )}

        {!user && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Como funciona:</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li>
                <strong>1.</strong> Faça login com Google
              </li>
              <li>
                <strong>2.</strong> Cadastre sua empresa (primeiro acesso)
              </li>
              <li>
                <strong>3.</strong> Configure suas credenciais do WhatsApp
              </li>
              <li>
                <strong>4.</strong> Comece a atender clientes!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
