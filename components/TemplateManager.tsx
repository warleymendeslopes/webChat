"use client";

import { useTemplateNotifications } from "@/hooks/useTemplateNotifications";
import { FacebookTemplate, TemplateStats } from "@/types/templates";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import NewTemplateModal from "./NewTemplateModal";
import TemplateStatusNotification from "./TemplateStatusNotification";

interface TemplateManagerProps {
  companyId: string;
  userId: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  companyId,
  userId,
}) => {
  const [templates, setTemplates] = useState<FacebookTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  // Notificações de templates
  const {
    notifications,
    addNotification,
    removeNotification,
    startPolling,
    stopPolling,
  } = useTemplateNotifications(companyId);

  // Refs para evitar recriação de funções
  const startPollingRef = useRef(startPolling);
  const stopPollingRef = useRef(stopPolling);

  // Atualizar refs quando as funções mudarem
  startPollingRef.current = startPolling;
  stopPollingRef.current = stopPolling;

  // Buscar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [templatesResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/templates?companyId=${companyId}&search=${searchTerm}&status=${statusFilter}&category=${categoryFilter}`
        ),
        fetch(`/api/templates/stats?companyId=${companyId}`),
      ]);

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchTerm, statusFilter, categoryFilter]);

  // Buscar dados quando filtros mudarem
  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId, fetchData]);

  // Iniciar/parar polling quando componente montar/desmontar
  useEffect(() => {
    if (companyId) {
      startPollingRef.current();
    }

    return () => {
      stopPollingRef.current();
    };
  }, [companyId]); // Apenas companyId como dependência

  // Funções de ação
  const handleSubmitToFacebook = async (templateId: string) => {
    try {
      const response = await fetch("/api/templates/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, companyId }),
      });

      if (response.ok) {
        const data = await response.json();
        addNotification({
          templateId,
          status: "pending",
        });
        alert("Template enviado para aprovação do Facebook!");
        fetchData(); // Recarregar dados
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Error submitting template:", error);
      alert("Erro ao enviar template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Template excluído com sucesso!");
        fetchData(); // Recarregar dados
      } else {
        alert("Erro ao excluir template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Erro ao excluir template");
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Função para obter cor da categoria
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "marketing":
        return "bg-blue-100 text-blue-800";
      case "utility":
        return "bg-purple-100 text-purple-800";
      case "authentication":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Templates do Facebook
          </h2>
          <p className="text-gray-600">
            Gerencie templates de mensagens para WhatsApp
          </p>
        </div>
        <button
          onClick={() => setShowNewTemplateModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Template</span>
        </button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Rejeitados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus.rejected}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="expired">Expirado</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="marketing">Marketing</option>
            <option value="utility">Utilitário</option>
            <option value="authentication">Autenticação</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter size={16} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template._id} className="bg-white rounded-lg shadow p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {template.name}
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      template.status
                    )}`}
                  >
                    {template.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      template.category
                    )}`}
                  >
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{template.language}</p>
              </div>
              {getStatusIcon(template.status)}
            </div>

            {/* Descrição */}
            {template.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>
            )}

            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    /* TODO: Implementar visualização */
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => {
                    /* TODO: Implementar edição */
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template._id!)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {template.status === "draft" && (
                <button
                  onClick={() => handleSubmitToFacebook(template._id!)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                >
                  <Upload size={14} />
                  <span>Enviar</span>
                </button>
              )}
            </div>

            {/* Informações adicionais */}
            <div className="mt-3 text-xs text-gray-500">
              <p>
                Criado em:{" "}
                {new Date(template.createdAt).toLocaleDateString("pt-BR")}
              </p>
              {template.updatedAt && (
                <p>
                  Atualizado em:{" "}
                  {new Date(template.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Comece criando seu primeiro template do Facebook
          </p>
          <button
            onClick={() => setShowNewTemplateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Criar Template
          </button>
        </div>
      )}

      {/* Modal de Novo Template */}
      {showNewTemplateModal && (
        <NewTemplateModal
          companyId={companyId}
          userId={userId}
          onClose={() => setShowNewTemplateModal(false)}
          onSuccess={() => {
            fetchData(); // Recarregar dados
            setShowNewTemplateModal(false);
          }}
        />
      )}

      {/* Notificações de Status */}
      {notifications.map((notification) => (
        <TemplateStatusNotification
          key={notification.id}
          templateId={notification.templateId}
          status={notification.status}
          rejectionReason={notification.rejectionReason}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default TemplateManager;
