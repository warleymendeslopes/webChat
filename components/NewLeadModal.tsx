"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface NewLeadModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewLeadModal({
  companyId,
  onClose,
  onSuccess,
}: NewLeadModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    productInterest: "",
    estimatedValue: "",
    source: "manual",
    tags: [] as string[],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      alert("❌ Nome é obrigatório");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      alert("❌ Telefone é obrigatório");
      return;
    }

    // Validar formato do telefone
    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      alert("❌ Telefone inválido. Use formato: +55 31 98765-4321");
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar metadata
      const customFields: any = {};

      if (formData.productInterest) {
        customFields.productInterest = formData.productInterest;
      }

      if (formData.estimatedValue) {
        customFields.estimatedValue = parseFloat(
          formData.estimatedValue.replace(/[^\d,]/g, "").replace(",", ".")
        );
      }

      // Criar lead
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          phoneNumber: phoneDigits,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          source: formData.source,
          tags: formData.tags,
          notes: formData.notes.trim(),
          customFields,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao criar lead");
      }

      const data = await response.json();

      alert("✅ Lead cadastrado com sucesso!");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error("Error creating lead:", error);
      alert(`❌ Erro ao criar lead: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const suggestedTags = [
    "VIP",
    "Hot Lead",
    "Urgente",
    "Premium",
    "Retornar",
    "Prospecção",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            ➕ Cadastrar Novo Lead
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dados Básicos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 Dados Básicos
            </h3>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Maria Silva"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="maria@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+55 31 98765-4321"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: +55 DDD NÚMERO (com ou sem formatação)
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Produto/Interesse */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🎯 Informações do Produto/Interesse
            </h3>

            <div className="space-y-4">
              {/* Produto de Interesse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto/Serviço de Interesse
                </label>
                <input
                  type="text"
                  value={formData.productInterest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      productInterest: e.target.value,
                    })
                  }
                  placeholder="Ex: Plano Premium, Produto X, Serviço Y"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Valor Estimado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Estimado (R$)
                </label>
                <input
                  type="text"
                  value={formData.estimatedValue}
                  onChange={(e) => {
                    // Permitir apenas números e vírgula
                    const value = e.target.value.replace(/[^\d,]/g, "");
                    setFormData({ ...formData, estimatedValue: value });
                  }}
                  placeholder="5000,00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🏷️ Tags (Classificação)
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.tags.includes(tag)
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {formData.tags.includes(tag) ? "✓ " : ""}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Origem */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              📍 Origem do Lead
            </h3>
            <select
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="manual">📝 Cadastro Manual</option>
              <option value="web">🌐 Site/Formulário Web</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="import">📊 Importação</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Observações/Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informações adicionais sobre o lead..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Cadastrar Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
