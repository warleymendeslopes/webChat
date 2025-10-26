"use client";

import { Lead, LeadStatus } from "@/types/leads";
import { Check, ChevronDown, Star, Tag, Zap } from "lucide-react";
import { useState } from "react";

interface LeadQuickActionsProps {
  chatId: string;
  leadData: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

const STATUS_CONFIG: Record<
  LeadStatus,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  new: {
    icon: "🆕",
    label: "Novo",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  contacted: {
    icon: "📞",
    label: "Contatado",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  qualified: {
    icon: "✅",
    label: "Qualificado",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  negotiating: {
    icon: "💰",
    label: "Negociando",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  won: {
    icon: "🎉",
    label: "Venda Fechada",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  lost: {
    icon: "❌",
    label: "Sem Interesse",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
};

export default function LeadQuickActions({
  chatId,
  leadData,
  onLeadUpdate,
}: LeadQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!leadData) return;

    setIsProcessing(true);
    try {
      let closedValue: number | undefined;
      let lostReason: string | undefined;

      // Ações específicas por status
      if (newStatus === "won") {
        const value = prompt("💰 Valor da venda (R$):");
        if (!value) {
          setIsProcessing(false);
          return;
        }
        closedValue = parseFloat(
          value.replace(/[^\d,]/g, "").replace(",", ".")
        );

        if (isNaN(closedValue) || closedValue <= 0) {
          alert("❌ Valor inválido");
          setIsProcessing(false);
          return;
        }
      } else if (newStatus === "lost") {
        lostReason = prompt("❌ Motivo (opcional):") || undefined;
      }

      // Atualizar via API
      const response = await fetch(`/api/leads/${leadData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          closedValue,
          lostReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();

      // Feedback visual
      const messages: Record<LeadStatus, string> = {
        new: "🆕 Lead marcado como novo",
        contacted: "📞 Lead marcado como contatado",
        qualified: "✅ Lead qualificado!",
        negotiating: "💰 Lead em negociação",
        won: `🎉 Parabéns pela venda de R$ ${closedValue?.toLocaleString(
          "pt-BR"
        )}!`,
        lost: "❌ Lead marcado como perdido",
      };

      alert(messages[newStatus]);

      setIsOpen(false);

      if (onLeadUpdate && data.lead) {
        onLeadUpdate(data.lead);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("❌ Erro ao atualizar status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!leadData) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/leads/${leadData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_favorite" }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const data = await response.json();

      if (onLeadUpdate) {
        const updatedLead = { ...leadData, isFavorite: data.isFavorite };
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!leadData) {
    return null;
  }

  const currentStatusConfig = STATUS_CONFIG[leadData.status];

  return (
    <div className="relative">
      {/* Botão Principal - Status Atual + Ações */}
      <div className="flex items-center space-x-2">
        {/* Status Badge */}
        <div
          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg ${currentStatusConfig.bgColor}`}
        >
          <span>{currentStatusConfig.icon}</span>
          <span className={`text-xs font-medium ${currentStatusConfig.color}`}>
            {currentStatusConfig.label}
          </span>
        </div>

        {/* Botão de Favorito */}
        <button
          onClick={handleToggleFavorite}
          disabled={isProcessing}
          className={`p-1.5 rounded-lg transition-colors ${
            leadData.isFavorite
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title={
            leadData.isFavorite
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
        >
          <Star
            size={18}
            fill={leadData.isFavorite ? "currentColor" : "none"}
          />
        </button>

        {/* Botão de Ações Rápidas */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isProcessing}
          className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Zap size={16} />
          <span className="hidden sm:inline">Ações</span>
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown de Ações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-40 border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <p className="text-xs text-gray-500 font-semibold">
                ⚡ AÇÕES RÁPIDAS
              </p>
            </div>

            {/* Ações de Status */}
            <div className="py-2">
              <p className="px-3 py-1 text-xs text-gray-500 font-medium">
                Atualizar Status:
              </p>

              {(
                Object.entries(STATUS_CONFIG) as [
                  LeadStatus,
                  (typeof STATUS_CONFIG)[LeadStatus]
                ][]
              ).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isProcessing || leadData.status === status}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                    leadData.status === status ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{config.icon}</span>
                    <span className="text-sm">{config.label}</span>
                  </div>
                  {leadData.status === status && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Tags */}
            {leadData.tags.length > 0 && (
              <div className="border-t border-gray-200 py-2">
                <p className="px-3 py-1 text-xs text-gray-500 font-medium flex items-center space-x-1">
                  <Tag size={12} />
                  <span>Tags Atuais:</span>
                </p>
                <div className="px-3 py-1 flex flex-wrap gap-1">
                  {leadData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Valor (se houver) */}
            {leadData.closedValue && (
              <div className="border-t border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-500 mb-1">Valor da Venda:</p>
                <p className="text-lg font-bold text-green-600">
                  R${" "}
                  {leadData.closedValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
