"use client";

import { useState } from "react";

interface WebhookInfoProps {
  baseUrl?: string;
}

export default function WebhookInfo({ baseUrl }: WebhookInfoProps) {
  const [copied, setCopied] = useState(false);

  // Get the base URL from environment or use the provided one
  const webhookUrl =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://seu-dominio.com";
  const fullWebhookUrl = `${webhookUrl}/api/webhook`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullWebhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 p-2 rounded-lg mr-3">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Webhook do WhatsApp
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL do Webhook:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={fullWebhookUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Instruções:
              </h3>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>1. Copie a URL acima</li>
                <li>2. Cole no campo "Webhook URL" do WhatsApp Business API</li>
                <li>
                  3. Configure o Verify Token:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    {process.env.WHATSAPP_VERIFY_TOKEN || "seu-verify-token"}
                  </code>
                </li>
                <li>4. Salve as configurações</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Informações Técnicas:
              </h3>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Método: POST</li>
                <li>• Content-Type: application/json</li>
                <li>
                  • Verificação: GET com parâmetros hub.mode, hub.verify_token,
                  hub.challenge
                </li>
                <li>
                  • Processamento: Mensagens recebidas são salvas no Firebase
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Status do Webhook:
              </h3>
              <p className="text-sm text-green-700 mt-1">
                ✅ Webhook configurado e funcionando
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-600 mt-0.5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-purple-800">
                Problemas com a validação?
              </h3>
              <p className="text-sm text-purple-700 mt-1 mb-2">
                Se está recebendo erro de validação, use nossa ferramenta de
                debug:
              </p>
              <a
                href="/webhook-debug"
                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
              >
                🔧 Debug do Webhook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
