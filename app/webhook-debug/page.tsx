"use client";

import { useEffect, useState } from "react";

export default function WebhookDebugPage() {
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>("");

  // Set base URL on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const testWebhook = async () => {
    setLoading(true);
    setTestResult("");

    try {
      // Test GET request (verification)
      const verifyUrl = new URL(
        "/api/webhook",
        baseUrl || "http://localhost:3000"
      );
      verifyUrl.searchParams.set("hub.mode", "subscribe");
      verifyUrl.searchParams.set(
        "hub.verify_token",
        process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN || "test-token"
      );
      verifyUrl.searchParams.set("hub.challenge", "test-challenge");

      console.log("Testing webhook verification:", verifyUrl.toString());

      const response = await fetch(verifyUrl.toString(), {
        method: "GET",
      });

      const result = await response.text();

      setTestResult(`
=== WEBHOOK DEBUG RESULT ===
Status: ${response.status}
Response: ${result}
URL: ${verifyUrl.toString()}
Verify Token: ${process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN || "test-token"}
========================
      `);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Debug do Webhook WhatsApp
          </h1>

          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                📋 Variáveis de Ambiente
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>WHATSAPP_VERIFY_TOKEN:</strong>{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN ||
                      "NÃO CONFIGURADO"}
                  </code>
                </div>
                <div>
                  <strong>Base URL:</strong>{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    {baseUrl || "Carregando..."}
                  </code>
                </div>
                <div>
                  <strong>Webhook URL:</strong>{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    {baseUrl || "Carregando..."}/api/webhook
                  </code>
                </div>
              </div>
            </div>

            {/* Test Button */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                🧪 Teste do Webhook
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Clique no botão abaixo para testar a verificação do webhook
                localmente.
              </p>
              <button
                onClick={testWebhook}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Testando..." : "Testar Webhook"}
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  📊 Resultado do Teste
                </h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">
                  {testResult}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                📝 Instruções para Configurar
              </h3>
              <ol className="text-sm text-yellow-700 space-y-2">
                <li>
                  <strong>1. Configure a variável de ambiente:</strong>
                  <br />
                  <code className="bg-yellow-100 px-2 py-1 rounded">
                    WHATSAPP_VERIFY_TOKEN=seu-token-aqui
                  </code>
                </li>
                <li>
                  <strong>2. No WhatsApp Business API:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>
                      • URL:{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        {baseUrl || "Carregando..."}/api/webhook
                      </code>
                    </li>
                    <li>
                      • Verify Token:{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        {process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN ||
                          "seu-token-aqui"}
                      </code>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>3. Teste a configuração:</strong>
                  <br />
                  Use o botão "Testar Webhook" acima para verificar se está
                  funcionando.
                </li>
              </ol>
            </div>

            {/* Common Issues */}
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-3">
                ⚠️ Problemas Comuns
              </h3>
              <ul className="text-sm text-red-700 space-y-2">
                <li>
                  <strong>Token mismatch:</strong> Verifique se o
                  WHATSAPP_VERIFY_TOKEN está configurado corretamente
                </li>
                <li>
                  <strong>URL inacessível:</strong> Certifique-se de que o
                  servidor está online e acessível
                </li>
                <li>
                  <strong>HTTPS obrigatório:</strong> O WhatsApp exige HTTPS em
                  produção
                </li>
                <li>
                  <strong>Variáveis de ambiente:</strong> Reinicie o servidor
                  após configurar as variáveis
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/webhook-info"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voltar para Webhook Info
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
