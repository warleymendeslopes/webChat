"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirecionar se já tem role
  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      // Não logado - redirecionar para login
      router.push("/login");
    } else if (user && role) {
      // Já cadastrado - redirecionar para chat
      router.push("/");
    }
  }, [user, role, authLoading, roleLoading, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseAuthUid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
          companyName,
        }),
      });

      if (response.ok) {
        // Sucesso - redirecionar para admin
        alert("Empresa cadastrada com sucesso!");
        router.push("/admin");
      } else {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert("Erro ao criar conta");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo! 🎉
            </h1>
            <p className="text-gray-600">
              Configure sua conta para começar a usar o WhatsApp Chat
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da sua Empresa
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="Minha Empresa Ltda"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                O que você receberá:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Acesso ao painel administrativo</li>
                <li>Configuração do WhatsApp Business API</li>
                <li>Gerenciamento de atendentes</li>
                <li>Sistema completo de chat</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? "Criando conta..." : "Começar Agora"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            Ao continuar, você concorda em configurar suas próprias credenciais
            do WhatsApp Business API
          </p>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
