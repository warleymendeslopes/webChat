"use client";

import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, Settings, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, companyId, loading: roleLoading } = useUserRole(user);
  const [activeTab, setActiveTab] = useState<"config" | "users">("config");

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
      </div>
    </div>
  );
}
