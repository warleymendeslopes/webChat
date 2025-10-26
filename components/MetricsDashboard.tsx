"use client";

import {
  Activity,
  AlertCircle,
  Clock,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface MetricsDashboardProps {
  companyId: string;
}

interface Metrics {
  attendants: {
    total: number;
    available: number;
    busy: number;
    away: number;
    offline: number;
    averageLoad: number;
    loadDistribution: Array<{
      userId: string;
      activeChats: number;
      maxChats: number;
      utilization: number;
      status: string;
    }>;
  };
  chats: {
    total: number;
    active: number;
    resolved: number;
    queue: number;
    avgResponseTime: string;
  };
}

export default function MetricsDashboard({ companyId }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/admin/metrics?companyId=${companyId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch metrics");
        }

        const data = await response.json();
        setMetrics(data.metrics);
        setError(null);
      } catch (err) {
        console.error("Error fetching metrics:", err);
        setError("Erro ao carregar métricas");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <div className="flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error || "Erro ao carregar métricas"}</span>
        </div>
      </div>
    );
  }

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "green",
    trend,
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    trend?: "up" | "down" | "neutral";
  }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`text-${color}-600`} size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            <TrendingUp
              size={16}
              className={trend === "down" ? "rotate-180" : ""}
            />
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Users}
          title="Atendentes Disponíveis"
          value={metrics.attendants.available}
          subtitle={`${metrics.attendants.total} no total`}
          color="green"
        />

        <MetricCard
          icon={MessageSquare}
          title="Chats Ativos"
          value={metrics.chats.active}
          subtitle={`${metrics.chats.queue} na fila`}
          color="blue"
        />

        <MetricCard
          icon={Activity}
          title="Carga Média"
          value={`${metrics.attendants.averageLoad}%`}
          subtitle="Utilização dos atendentes"
          color="purple"
        />

        <MetricCard
          icon={Clock}
          title="Tempo Médio"
          value={metrics.chats.avgResponseTime}
          subtitle="De resposta"
          color="amber"
        />
      </div>

      {/* Status dos Atendentes */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Status dos Atendentes
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {metrics.attendants.available}
            </p>
            <p className="text-sm text-gray-600">Disponíveis</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {metrics.attendants.busy}
            </p>
            <p className="text-sm text-gray-600">Ocupados</p>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">
              {metrics.attendants.away}
            </p>
            <p className="text-sm text-gray-600">Ausentes</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {metrics.attendants.offline}
            </p>
            <p className="text-sm text-gray-600">Offline</p>
          </div>
        </div>

        {/* Distribuição de Carga */}
        <h4 className="text-md font-semibold text-gray-700 mb-3">
          Distribuição de Carga
        </h4>
        <div className="space-y-3">
          {metrics.attendants.loadDistribution.map((attendant, index) => (
            <div key={attendant.userId} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-32 text-sm text-gray-600">
                Atendente #{index + 1}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        attendant.utilization >= 80
                          ? "bg-red-500"
                          : attendant.utilization >= 50
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(attendant.utilization, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-12">
                    {Math.round(attendant.utilization)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {attendant.activeChats} / {attendant.maxChats} chats
                </p>
              </div>

              <div className="flex-shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    attendant.status === "available"
                      ? "bg-green-100 text-green-700"
                      : attendant.status === "busy"
                      ? "bg-red-100 text-red-700"
                      : attendant.status === "away"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {attendant.status === "available"
                    ? "Disponível"
                    : attendant.status === "busy"
                    ? "Ocupado"
                    : attendant.status === "away"
                    ? "Ausente"
                    : "Offline"}
                </span>
              </div>
            </div>
          ))}

          {metrics.attendants.loadDistribution.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhum atendente ativo no momento
            </p>
          )}
        </div>
      </div>

      {/* Resumo de Chats */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo de Chats
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.chats.total}
            </p>
          </div>

          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Ativos</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.chats.active}
            </p>
          </div>

          <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700 mb-1">Na Fila</p>
            <p className="text-2xl font-bold text-amber-600">
              {metrics.chats.queue}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Resolvidos</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.chats.resolved}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
