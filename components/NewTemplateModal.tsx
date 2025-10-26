"use client";

import { TemplateButton, TemplateComponent } from "@/types/templates";
import { Eye, Plus, Trash2, X } from "lucide-react";
import React, { useState } from "react";

interface NewTemplateModalProps {
  companyId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  companyId,
  userId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "marketing" as "marketing" | "utility" | "authentication",
    language: "pt_BR",
    description: "",
    tags: [] as string[],
  });

  const [components, setComponents] = useState<TemplateComponent[]>([
    {
      type: "HEADER",
      format: "TEXT",
      text: "Bem-vindo!",
      example: {
        header_text: ["Bem-vindo!", "Olá!", "Oi!"],
      },
    },
    {
      type: "BODY",
      format: "TEXT",
      text: "Como posso ajudá-lo hoje?",
      example: {
        body_text: [
          ["Como posso ajudá-lo hoje?"],
          ["Em que posso ajudar?"],
          ["Como posso ser útil?"],
        ],
      },
    },
  ]);

  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const [newTag, setNewTag] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Adicionar componente
  const addComponent = (type: TemplateComponent["type"]) => {
    const newComponent: TemplateComponent = {
      type,
      format: "TEXT",
      text: "",
      example: {
        header_text: type === "HEADER" ? [""] : undefined,
        body_text: type === "BODY" ? [[""]] : undefined,
        footer_text: type === "FOOTER" ? "" : undefined,
      },
    };
    setComponents([...components, newComponent]);
  };

  // Atualizar componente
  const updateComponent = (
    index: number,
    field: keyof TemplateComponent,
    value: any
  ) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  // Remover componente
  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  // Adicionar botão
  const addButton = () => {
    const newButton: TemplateButton = {
      type: "URL",
      text: "",
      url: "",
    };
    setButtons([...buttons, newButton]);
  };

  // Atualizar botão
  const updateButton = (
    index: number,
    field: keyof TemplateButton,
    value: any
  ) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  // Remover botão
  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  // Adicionar tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Nome do template é obrigatório");
      return;
    }

    if (components.length === 0) {
      alert("Adicione pelo menos um componente");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          name: formData.name,
          category: formData.category,
          language: formData.language,
          components,
          buttons: buttons.length > 0 ? buttons : undefined,
          description: formData.description,
          tags: formData.tags,
          createdBy: userId,
        }),
      });

      if (response.ok) {
        alert("Template criado com sucesso!");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Erro ao criar template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Novo Template do Facebook</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center space-x-1"
            >
              <Eye size={16} />
              <span>{previewMode ? "Editar" : "Preview"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex h-[calc(90vh-80px)]">
          {/* Formulário */}
          <div
            className={`flex-1 p-6 overflow-y-auto ${
              previewMode ? "hidden" : "block"
            }`}
          >
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Boas-vindas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="utility">Utilitário</option>
                    <option value="authentication">Autenticação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma *
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pt_BR">Português (Brasil)</option>
                    <option value="en_US">English (US)</option>
                    <option value="es_ES">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-green-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Adicionar tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Componentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Componentes *
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => addComponent("HEADER")}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + Cabeçalho
                    </button>
                    <button
                      type="button"
                      onClick={() => addComponent("BODY")}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + Corpo
                    </button>
                    <button
                      type="button"
                      onClick={() => addComponent("FOOTER")}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + Rodapé
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {components.map((component, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm text-gray-700">
                          {component.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeComponent(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Formato
                          </label>
                          <select
                            value={component.format}
                            onChange={(e) =>
                              updateComponent(index, "format", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="TEXT">Texto</option>
                            <option value="IMAGE">Imagem</option>
                            <option value="VIDEO">Vídeo</option>
                            <option value="DOCUMENT">Documento</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Texto
                          </label>
                          <textarea
                            value={component.text || ""}
                            onChange={(e) =>
                              updateComponent(index, "text", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            rows={2}
                            placeholder="Digite o texto do componente..."
                          />
                        </div>

                        {/* Exemplos */}
                        {component.example && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Exemplos
                            </label>
                            {component.example.header_text && (
                              <div className="space-y-1">
                                {component.example.header_text.map(
                                  (example, i) => (
                                    <input
                                      key={i}
                                      type="text"
                                      value={example}
                                      onChange={(e) => {
                                        const newExample = [
                                          ...component.example!.header_text!,
                                        ];
                                        newExample[i] = e.target.value;
                                        updateComponent(index, "example", {
                                          ...component.example,
                                          header_text: newExample,
                                        });
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                      placeholder={`Exemplo ${i + 1}`}
                                    />
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Botões (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={addButton}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + Botão
                  </button>
                </div>

                <div className="space-y-3">
                  {buttons.map((button, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm text-gray-700">
                          Botão {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeButton(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Tipo
                          </label>
                          <select
                            value={button.type}
                            onChange={(e) =>
                              updateButton(index, "type", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="URL">URL</option>
                            <option value="PHONE_NUMBER">Telefone</option>
                            <option value="QUICK_REPLY">Resposta Rápida</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Texto
                          </label>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) =>
                              updateButton(index, "text", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="Texto do botão"
                          />
                        </div>

                        {button.type === "URL" && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              URL
                            </label>
                            <input
                              type="url"
                              value={button.url || ""}
                              onChange={(e) =>
                                updateButton(index, "url", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="https://exemplo.com"
                            />
                          </div>
                        )}

                        {button.type === "PHONE_NUMBER" && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Número de Telefone
                            </label>
                            <input
                              type="tel"
                              value={button.phone_number || ""}
                              onChange={(e) =>
                                updateButton(
                                  index,
                                  "phone_number",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="+5511999999999"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewMode && (
            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Preview do Template
              </h3>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  {components.map((component, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-green-500 pl-3"
                    >
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        {component.type}
                      </div>
                      <div className="text-sm text-gray-800">
                        {component.text || "(sem texto)"}
                      </div>
                    </div>
                  ))}

                  {buttons.length > 0 && (
                    <div className="border-l-2 border-blue-500 pl-3">
                      <div className="text-xs text-gray-500 uppercase font-medium">
                        Botões
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {buttons.map((button, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {button.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Template"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewTemplateModal;
