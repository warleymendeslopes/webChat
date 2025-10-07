"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Bot, LogOut, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, companyId, loading: roleLoading } = useUserRole(user);
  const [activeTab, setActiveTab] = useState<"config" | "users" | "ai">(
    "config"
  );

  // Redirecionar se não for admin
  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      router.push("/login");
    } else if (role && role !== "admin") {
      router.push("/");
    }
  }, [user, role, authLoading, roleLoading, router]);

  // Config state
  const [companyName, setCompanyName] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [saving, setSaving] = useState(false);
  // Load existing WhatsApp config when opening config tab
  useEffect(() => {
    if (!companyId || activeTab !== "config") return;

    (async () => {
      try {
        const res = await fetch(`/api/admin/config?companyId=${companyId}`);
        const data = await res.json();
        if (res.ok) {
          setCompanyName(data.companyName || "");
          setPhoneNumberId(data.whatsappPhoneNumberId || "");
          setAccessToken(data.whatsappAccessToken || "");
          setVerifyToken(data.whatsappVerifyToken || "");
        }
      } catch (e) {
        console.error("Erro ao carregar configuração:", e);
      }
    })();
  }, [companyId, activeTab]);

  // Users state
  const [attendantEmail, setAttendantEmail] = useState("");
  const [attendantName, setAttendantName] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);

  // AI Config state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiStatus, setAiStatus] = useState<
    "draft" | "validating" | "active" | "error"
  >("draft");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<number, string>>({});
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [aiHasKey, setAiHasKey] = useState(false);

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
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 4000);
  };

  // Load users and invites
  useEffect(() => {
    if (!companyId) return;

    async function loadData() {
      try {
        // Load users
        const usersRes = await fetch(`/api/admin/users?companyId=${companyId}`);
        const usersData = await usersRes.json();
        if (usersData.users) {
          setUsers(usersData.users);
        }

        // Load pending invites
        const invitesRes = await fetch(
          `/api/admin/invite-attendant?companyId=${companyId}`
        );
        const invitesData = await invitesRes.json();
        if (invitesData.invites) {
          setPendingInvites(invitesData.invites);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    if (activeTab === "users") {
      loadData();
    }
  }, [companyId, activeTab]);

  // Load AI config when tab opened
  useEffect(() => {
    if (!companyId || activeTab !== "ai") return;
    (async () => {
      try {
        setAiLoading(true);
        const res = await fetch(`/api/admin/ai-config?companyId=${companyId}`);
        const data = await res.json();
        if (res.ok) {
          setAiContext(data.context || "");
          setAiEnabled(!!data.enabled);
          setAiStatus(data.status || "draft");
          setAiHasKey(!!data.hasApiKey);
        }
        // Load logs
        const logsRes = await fetch(
          `/api/admin/ai-logs?companyId=${companyId}&limit=50`
        );
        const logsData = await logsRes.json();
        if (logsRes.ok) setAiLogs(logsData.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setAiLoading(false);
      }
    })();
  }, [companyId, activeTab]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          companyName,
          whatsappPhoneNumberId: phoneNumberId,
          whatsappAccessToken: accessToken,
          whatsappVerifyToken: verifyToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Configuração salva com sucesso!", "success");
      } else {
        showToast(data.error || "Erro ao salvar configuração", "error");
      }
    } catch (error) {
      showToast("Erro ao salvar configuração", "error");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAttendant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) return;

    setInviting(true);

    try {
      const response = await fetch("/api/admin/invite-attendant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: attendantEmail,
          name: attendantName,
          companyId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || "Convite enviado", "success");
        setAttendantEmail("");
        setAttendantName("");

        // Reload invites
        const invitesRes = await fetch(
          `/api/admin/invite-attendant?companyId=${companyId}`
        );
        const invitesData = await invitesRes.json();
        if (invitesData.invites) {
          setPendingInvites(invitesData.invites);
        }
      } else {
        showToast(data.error || "Erro ao enviar convite", "error");
      }
    } catch (error) {
      showToast("Erro ao enviar convite", "error");
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (email: string) => {
    if (!companyId || !confirm(`Cancelar convite para ${email}?`)) return;

    try {
      await fetch(
        `/api/admin/invite-attendant?email=${encodeURIComponent(
          email
        )}&companyId=${companyId}`,
        { method: "DELETE" }
      );

      setPendingInvites(pendingInvites.filter((inv) => inv.email !== email));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Remover este atendente?")) return;

    try {
      await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });

      // Reload users
      const usersRes = await fetch(`/api/admin/users?companyId=${companyId}`);
      const usersData = await usersRes.json();
      if (usersData.users) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Painel Administrativo
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("config")}
              className={`${
                activeTab === "config"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Settings size={20} />
              <span>Configurações do WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`${
                activeTab === "users"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Users size={20} />
              <span>Atendentes</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`${
                activeTab === "ai"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Bot size={20} />
              <span>Atendente AI</span>
            </button>
          </nav>
        </div>

        {/* Config Tab */}
        {activeTab === "config" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações do WhatsApp Business API
            </h2>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="123456789012345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  rows={3}
                  placeholder="EAAGxxxxxxxxxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verify Token
                </label>
                <input
                  type="text"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="seu_token_secreto"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar Configuração"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Como obter essas credenciais:
              </h3>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>
                  Acesse{" "}
                  <a
                    href="https://developers.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Meta for Developers
                  </a>
                </li>
                <li>Crie um app e adicione o produto WhatsApp</li>
                <li>Em "API Setup", copie o Phone Number ID e Access Token</li>
                <li>
                  Crie um Verify Token personalizado (qualquer string segura)
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gerenciar Atendentes
            </h2>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                Como funciona:
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Digite o email e nome do atendente abaixo</li>
                <li>Clique em "Convidar Atendente"</li>
                <li>
                  Peça para a pessoa fazer login em{" "}
                  <strong>
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : ""}
                    /login
                  </strong>
                </li>
                <li>Ela será automaticamente adicionada como atendente!</li>
              </ol>
            </div>

            <form onSubmit={handleAddAttendant} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Atendente
                </label>
                <input
                  type="email"
                  value={attendantEmail}
                  onChange={(e) => setAttendantEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="atendente@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Atendente
                </label>
                <input
                  type="text"
                  value={attendantName}
                  onChange={(e) => setAttendantName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  placeholder="João Silva"
                />
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? "Enviando convite..." : "Convidar Atendente"}
              </button>
            </form>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Convites Pendentes ({pendingInvites.length})
                </h3>
                <div className="space-y-2">
                  {pendingInvites.map((inv) => (
                    <div
                      key={inv.email}
                      className="flex justify-between items-center p-3 border border-yellow-200 bg-yellow-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{inv.name}</p>
                        <p className="text-sm text-gray-500">{inv.email}</p>
                        <p className="text-xs text-gray-400">
                          Aguardando login...
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvite(inv.email)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Users */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Atendentes Ativos ({users.length})
              </h3>
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum atendente ativo ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400">
                          {u.role === "admin" ? "Administrador" : "Atendente"}
                        </p>
                      </div>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleRemoveUser(u.firebaseAuthUid)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Atendente AI
            </h2>

            {aiLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium">{aiStatus}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ativado:{" "}
                      <span className="font-medium">
                        {aiEnabled ? "Sim" : "Não"}
                      </span>
                    </p>
                  </div>
                  <button
                    disabled={aiStatus !== "active"}
                    onClick={async () => {
                      if (!companyId) return;
                      try {
                        const res = await fetch("/api/admin/ai-config/toggle", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            companyId,
                            enabled: !aiEnabled,
                          }),
                        });
                        if (res.ok) {
                          setAiEnabled(!aiEnabled);
                          showToast(
                            !aiEnabled
                              ? "Atendente AI ativado"
                              : "Atendente AI desativado",
                            "success"
                          );
                        } else {
                          const data = await res.json();
                          showToast(
                            data.error || "Não foi possível alternar",
                            "error"
                          );
                        }
                      } catch (e) {
                        console.error(e);
                        showToast("Erro ao alternar AI", "error");
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-white ${
                      aiStatus === "active"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {aiEnabled ? "Desativar" : "Ativar"}
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!companyId) return;
                    try {
                      // Salvar rascunho
                      const saveRes = await fetch("/api/admin/ai-config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          companyId,
                          context: aiContext,
                          aiApiKey: aiApiKey || undefined,
                        }),
                      });
                      if (!saveRes.ok) {
                        const data = await saveRes.json();
                        showToast(data.error || "Erro ao salvar", "error");
                        return;
                      }

                      // Validar chave e gerar perguntas
                      const valRes = await fetch(
                        "/api/admin/ai-config/validate",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ companyId, apiKey: aiApiKey }),
                        }
                      );
                      const val = await valRes.json();
                      if (!valRes.ok) {
                        showToast(val.error || "Erro na validação", "error");
                        return;
                      }
                      setAiQuestions(val.questions || []);
                      setAiStatus("validating");
                      showToast(
                        "Validação iniciada. Responda às perguntas abaixo.",
                        "success"
                      );
                    } catch (e) {
                      console.error(e);
                      showToast("Erro ao validar", "error");
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contexto da empresa
                    </label>
                    <textarea
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      rows={6}
                      placeholder="Descreva produtos, público, políticas, tom de voz, objetivos..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chave de API do Gemini
                    </label>
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder={
                        aiHasKey ? "(já cadastrada no servidor)" : "AIza..."
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A chave é armazenada no servidor. Preencha apenas para
                      atualizar.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/admin/ai-config/ping", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              apiKey: aiApiKey || undefined,
                              companyId,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.ok) {
                            showToast(
                              "Conectividade OK: chave válida e pronta para uso.",
                              "success"
                            );
                          } else {
                            showToast(
                              data.error || "Falha na conectividade da chave",
                              "error"
                            );
                          }
                        } catch (e) {
                          console.error(e);
                          showToast("Erro ao testar conectividade", "error");
                        }
                      }}
                      className="mt-2 inline-flex items-center px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                    >
                      Testar Conectividade
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                  >
                    Testar e Ativar
                  </button>
                </form>

                {aiQuestions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Perguntas de validação
                    </h3>
                    <div className="space-y-3">
                      {aiQuestions.map((q, idx) => (
                        <div key={idx}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {idx + 1}. {q}
                          </label>
                          <textarea
                            value={aiAnswers[idx] || ""}
                            onChange={(e) =>
                              setAiAnswers({
                                ...aiAnswers,
                                [idx]: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        if (!companyId) return;
                        try {
                          const answersPayload = Object.entries(aiAnswers).map(
                            ([i, answer]) => ({
                              question: aiQuestions[Number(i)],
                              answer,
                            })
                          );
                          const res = await fetch(
                            "/api/admin/ai-config/answers",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                companyId,
                                answers: answersPayload,
                              }),
                            }
                          );
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setAiStatus("active");
                            setAiEnabled(true);
                            showToast(
                              "Atendente AI ativado com sucesso!",
                              "success"
                            );
                          } else {
                            const missing = data?.details?.missingTopics;
                            const msgBase =
                              data?.error ||
                              "Respostas insuficientes. Complete melhor as informações.";
                            const msg =
                              Array.isArray(missing) && missing.length
                                ? `${msgBase} (Tópicos ausentes: ${missing.join(
                                    ", "
                                  )})`
                                : msgBase;
                            showToast(msg, "error");
                            setAiStatus("error");
                          }
                        } catch (e) {
                          console.error(e);
                          showToast("Erro ao salvar respostas", "error");
                        }
                      }}
                      className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                    >
                      Confirmar respostas e ativar
                    </button>
                  </div>
                )}

                {/* Logs da AI */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Logs recentes da AI
                    </h3>
                    <button
                      className="text-sm text-gray-600 hover:text-gray-900"
                      onClick={async () => {
                        if (!companyId) return;
                        try {
                          const logsRes = await fetch(
                            `/api/admin/ai-logs?companyId=${companyId}&limit=100`
                          );
                          const logsData = await logsRes.json();
                          if (logsRes.ok) setAiLogs(logsData.logs || []);
                        } catch (e) {
                          console.error(e);
                          showToast("Erro ao carregar logs", "error");
                        }
                      }}
                    >
                      Atualizar
                    </button>
                  </div>
                  {aiLogs.length === 0 ? (
                    <p className="text-sm text-gray-500">Sem logs ainda.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {aiLogs.map((log, idx) => (
                        <div key={idx} className="p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900">
                              {log.action}
                            </span>
                            <span className="text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1 text-gray-700">
                            <span className="font-medium">Cliente:</span>{" "}
                            {log.customerPhone}
                          </div>
                          <div className="mt-1 text-gray-700">
                            <span className="font-medium">Mensagem:</span>{" "}
                            {log.inboundMessage}
                          </div>
                          {log.aiMessage && (
                            <div className="mt-1 text-gray-700">
                              <span className="font-medium">Resposta AI:</span>{" "}
                              {log.aiMessage}
                            </div>
                          )}
                          {typeof log.confidence === "number" && (
                            <div className="mt-1 text-gray-500">
                              Confiança: {Math.round(log.confidence * 100)}%
                            </div>
                          )}
                          {log.error && (
                            <div className="mt-1 text-red-600">
                              Erro: {log.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
