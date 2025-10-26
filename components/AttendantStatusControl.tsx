"use client";

import { AttendantStatusType } from "@/types/admin";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface AttendantStatusControlProps {
  userId: string;
  companyId: string;
}

const statusOptions: {
  value: AttendantStatusType;
  label: string;
  color: string;
  dotColor: string;
}[] = [
  {
    value: "available",
    label: "Disponível",
    color: "text-green-700",
    dotColor: "bg-green-500",
  },
  {
    value: "busy",
    label: "Ocupado",
    color: "text-red-700",
    dotColor: "bg-red-500",
  },
  {
    value: "away",
    label: "Ausente",
    color: "text-amber-700",
    dotColor: "bg-amber-500",
  },
  {
    value: "offline",
    label: "Offline",
    color: "text-gray-700",
    dotColor: "bg-gray-500",
  },
];

export default function AttendantStatusControl({
  userId,
  companyId,
}: AttendantStatusControlProps) {
  const [currentStatus, setCurrentStatus] =
    useState<AttendantStatusType>("available");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Buscar status atual
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/attendant/status?userId=${userId}&companyId=${companyId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setCurrentStatus(data.status.status);
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      }
    };

    fetchStatus();
  }, [userId, companyId]);

  // Heartbeat - atualizar atividade a cada 2 minutos
  useEffect(() => {
    const heartbeat = async () => {
      try {
        await fetch("/api/attendant/status", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, companyId }),
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    // Heartbeat imediato
    heartbeat();

    // Heartbeat a cada 2 minutos
    const interval = setInterval(heartbeat, 120000);

    return () => clearInterval(interval);
  }, [userId, companyId]);

  // Atualizar status quando o componente for desmontado (usuário saiu)
  useEffect(() => {
    return () => {
      // Marcar como offline quando desmontar
      fetch("/api/attendant/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyId,
          status: "offline",
        }),
      }).catch(console.error);
    };
  }, [userId, companyId]);

  const handleStatusChange = async (newStatus: AttendantStatusType) => {
    setLoading(true);
    try {
      const response = await fetch("/api/attendant/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          companyId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        setIsOpen(false);
      } else {
        console.error("Failed to update status");
        alert("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  const currentOption =
    statusOptions.find((opt) => opt.value === currentStatus) ||
    statusOptions[0];

  return (
    <div className="relative">
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
        disabled={loading}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${currentOption.dotColor} animate-pulse`}
        />
        <span className="text-sm font-medium hidden sm:inline">
          {currentOption.label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-xs text-gray-500 font-medium">
                Status do Atendente
              </p>
            </div>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={loading}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between ${
                  currentStatus === option.value ? "bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${option.dotColor}`}
                  />
                  <span className={`text-sm ${option.color}`}>
                    {option.label}
                  </span>
                </div>
                {currentStatus === option.value && (
                  <Check size={16} className="text-green-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
