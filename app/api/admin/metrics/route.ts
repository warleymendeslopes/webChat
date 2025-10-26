import {
    countAttendantsByStatus,
    getAllAttendantStatuses,
    getAverageLoad
} from '@/lib/attendantStatus';
import { getUnassignedChats } from '@/lib/chatDistribution';
import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para métricas de distribuição e atendimento
 * GET /api/admin/metrics?companyId=xxx
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Buscar métricas em paralelo
    const [
      attendantStatuses,
      statusCounts,
      averageLoad,
      unassignedChats,
      totalChats,
      activeChats,
      resolvedChats,
    ] = await Promise.all([
      getAllAttendantStatuses(companyId),
      countAttendantsByStatus(companyId),
      getAverageLoad(companyId),
      getUnassignedChats(companyId),
      getCollection('chatAssignments').then(col =>
        col.countDocuments({ companyId })
      ),
      getCollection('chatAssignments').then(col =>
        col.countDocuments({ companyId, status: { $in: ['assigned', 'active'] } })
      ),
      getCollection('chatAssignments').then(col =>
        col.countDocuments({ companyId, status: 'resolved' })
      ),
    ]);

    // Calcular estatísticas adicionais
    const totalAttendants = attendantStatuses.length;
    const availableAttendants = statusCounts.available || 0;
    const busyAttendants = statusCounts.busy || 0;
    const queueSize = unassignedChats.length;
    
    // Calcular distribuição de carga por atendente
    const loadDistribution = attendantStatuses.map(status => ({
      userId: status.userId,
      activeChats: status.activeChats,
      maxChats: status.maxChats,
      utilization: status.maxChats > 0 ? (status.activeChats / status.maxChats) * 100 : 0,
      status: status.status,
    }));

    // Calcular tempo médio de resposta (exemplo - você pode implementar com dados reais)
    const avgResponseTime = '2.5 min'; // Placeholder

    return NextResponse.json({
      success: true,
      metrics: {
        // Métricas de Atendentes
        attendants: {
          total: totalAttendants,
          available: availableAttendants,
          busy: busyAttendants,
          away: statusCounts.away || 0,
          offline: statusCounts.offline || 0,
          averageLoad: Math.round(averageLoad * 100),
          loadDistribution,
        },
        
        // Métricas de Chats
        chats: {
          total: totalChats,
          active: activeChats,
          resolved: resolvedChats,
          queue: queueSize,
          avgResponseTime,
        },

        // Status detalhado dos atendentes
        attendantDetails: attendantStatuses,
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

