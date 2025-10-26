"use client";

import { AlertCircle, CheckCircle, Clock, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

interface TemplateStatusNotificationProps {
  templateId: string;
  status: "draft" | "pending" | "approved" | "rejected" | "expired";
  rejectionReason?: string;
  onClose?: () => void;
}

const TemplateStatusNotification: React.FC<TemplateStatusNotificationProps> = ({
  templateId,
  status,
  rejectionReason,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 10 seconds for success notifications
    if (status === "approved") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          title: "Template Aprovado!",
          message:
            "Seu template foi aprovado pelo Facebook e está pronto para uso.",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          title: "Template Rejeitado",
          message: "Seu template foi rejeitado pelo Facebook.",
        };
      case "pending":
        return {
          icon: <Clock className="w-5 h-5 text-yellow-500" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          title: "Template Enviado",
          message: "Seu template foi enviado para aprovação do Facebook.",
        };
      case "expired":
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          title: "Template Expirado",
          message: "Seu template expirou e precisa ser renovado.",
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-gray-500" />,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          title: "Status do Template",
          message: "Status atualizado.",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>
            {config.title}
          </h3>
          <p className={`mt-1 text-sm ${config.textColor}`}>{config.message}</p>

          {rejectionReason && status === "rejected" && (
            <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
              <p className="text-xs text-red-700">
                <strong>Motivo da rejeição:</strong> {rejectionReason}
              </p>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            Template ID: {templateId}
          </div>
        </div>

        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateStatusNotification;
