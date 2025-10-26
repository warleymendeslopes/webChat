"use client";

import LeadAttendantInfo from "@/components/LeadAttendantInfo";
import LoadingSpinner from "@/components/LoadingSpinner";
import NewLeadModal from "@/components/NewLeadModal";
import SafeRedirect from "@/components/SafeRedirect";
import { useAuthState } from "@/hooks/useAuthState";
import { auth } from "@/lib/firebase";
import { Lead, LeadStats, LeadStatus } from "@/types/leads";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  Filter,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LeadsPage() {
  const router = useRouter();
  const { user, firestoreUserId, roleData, loading } = useAuthState();
  const { role, companyId } = roleData;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  const shouldRender = !loading && user && role && companyId;

  useEffect(() => {
    if (!companyId || !role || !firestoreUserId) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Buscar leads com filtro por atendente
        const statusParam =
          statusFilter !== "all" ? `&status=${statusFilter}` : "";
        const searchParam = searchTerm ? `&search=${searchTerm}` : "";
        const roleParam = `&userRole=${role}`;
        const userIdParam = `&userId=${firestoreUserId}`;

        const [leadsResponse, statsResponse] = await Promise.all([
          fetch(
            `/api/leads?companyId=${companyId}${statusParam}${searchParam}${roleParam}${userIdParam}`
          ),
          fetch(
            `/api/leads/stats?companyId=${companyId}${roleParam}${userIdParam}`
          ),
        ]);

        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json();
          setLeads(leadsData.leads || []);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [companyId, role, firestoreUserId, statusFilter, searchTerm]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!user) {
    return <SafeRedirect to="/login" condition={true} loading={false} />;
  }

  if (!shouldRender) {
    return <LoadingSpinner message="Carregando dados..." />;
  }

  if (loadingData) {
    return <LoadingSpinner message="Carregando leads..." />;
  }

  const getStatusColor = (status: LeadStatus) => {
    const colors: Record<LeadStatus, string> = {
      new: "bg-gray-100 text-gray-700",
      contacted: "bg-blue-100 text-blue-700",
      qualified: "bg-green-100 text-green-700",
      negotiating: "bg-purple-100 text-purple-700",
      won: "bg-green-600 text-white",
      lost: "bg-red-100 text-red-700",
    };
    return colors[status];
  };

  const getStatusLabel = (status: LeadStatus) => {
    const labels: Record<LeadStatus, string> = {
      new: "🆕 Novo",
      contacted: "📞 Contatado",
      qualified: "✅ Qualificado",
      negotiating: "💰 Negociando",
      won: "🎉 Venda Fechada",
      lost: "❌ Perdido",
    };
    return labels[status];
  };

  const handleRefreshLeads = async () => {
    if (!companyId || !role || !firestoreUserId) return;

    setLoadingData(true);
    try {
      const statusParam =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const searchParam = searchTerm ? `&search=${searchTerm}` : "";
      const roleParam = `&userRole=${role}`;
      const userIdParam = `&userId=${firestoreUserId}`;

      const [leadsResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/leads?companyId=${companyId}${statusParam}${searchParam}${roleParam}${userIdParam}`
        ),
        fetch(
          `/api/leads/stats?companyId=${companyId}${roleParam}${userIdParam}`
        ),
      ]);

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error refreshing leads:", error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Modal de Novo Lead */}
      {showNewLeadModal && companyId && (
        <NewLeadModal
          companyId={companyId}
          onClose={() => setShowNewLeadModal(false)}
          onSuccess={handleRefreshLeads}
        />
      )}

      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:bg-green-700 p-2 rounded-full">
            <ArrowLeft size={24} />
          </Link>
          <Users size={28} />
          <div>
            <h1 className="text-xl font-semibold">Leads & Contatos</h1>
            {role === "attendant" && (
              <p className="text-sm text-green-200">
                📋 Visualizando apenas seus leads
              </p>
            )}
            {role === "admin" && (
              <p className="text-sm text-green-200">
                👑 Visualizando todos os leads da empresa
              </p>
            )}
          </div>
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.conversionRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-blue-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Leads Ativos</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.byStatus.new +
                  stats.byStatus.contacted +
                  stats.byStatus.qualified +
                  stats.byStatus.negotiating}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="text-purple-600" size={24} />
              </div>
              <p className="text-sm text-gray-600">Em Negociação</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.byStatus.negotiating}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                R$ {stats.negotiatingValue.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-sm text-gray-600">Vendas Fechadas</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.byStatus.won}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                R$ {stats.totalValue.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        )}

        {/* Botão de Novo Lead */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Novo Lead</span>
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos os Status</option>
              <option value="new">🆕 Novos</option>
              <option value="contacted">📞 Contatados</option>
              <option value="qualified">✅ Qualificados</option>
              <option value="negotiating">💰 Negociando</option>
              <option value="won">🎉 Vendas Fechadas</option>
              <option value="lost">❌ Perdidos</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Lista de Leads */}
        {loading ? (
          <LoadingSpinner message="Carregando leads..." />
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum lead encontrado
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Aguarde o primeiro contato via WhatsApp"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div
                key={lead._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/?chat=${lead.chatId}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-lg">
                        {lead.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {lead.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {lead.phoneNumber}
                      </p>
                      <LeadAttendantInfo
                        assignedTo={lead.assignedTo}
                        attendantName={lead.assignedTo} // TODO: Buscar nome real do atendente
                        isAdmin={role === "admin"}
                      />
                    </div>
                  </div>
                  {lead.isFavorite && (
                    <Star
                      size={16}
                      className="text-yellow-500"
                      fill="currentColor"
                    />
                  )}
                </div>

                {/* Status */}
                <div className="mb-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      lead.status
                    )}`}
                  >
                    {getStatusLabel(lead.status)}
                  </span>
                </div>

                {/* Tags */}
                {lead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {lead.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{lead.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    ⏰ Último contato:{" "}
                    {new Date(lead.lastContactAt).toLocaleDateString("pt-BR")}
                  </p>
                  <p>💬 {lead.totalMessages} mensagens</p>
                  {lead.closedValue && (
                    <p className="font-semibold text-green-600">
                      💰 R$ {lead.closedValue.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>

                {/* Notas (preview) */}
                {lead.notes && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                    📝 {lead.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
