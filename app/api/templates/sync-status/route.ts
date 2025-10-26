import { createFacebookApiManager } from '@/lib/facebookApi';
import { getTemplatesWithFilters, updateTemplateStatus } from '@/lib/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para Sincronizar Status de Templates
 * POST /api/templates/sync-status
 * Sincroniza status de templates pendentes com o Facebook
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Buscar templates pendentes
    const pendingTemplates = await getTemplatesWithFilters(companyId, {
      status: ['pending'],
    }, 100, 0);

    if (pendingTemplates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending templates to sync',
        synced: 0,
      });
    }

    // Criar instância do Facebook API Manager
    const facebookApi = await createFacebookApiManager(companyId);
    
    if (!facebookApi) {
      return NextResponse.json(
        { error: 'Facebook API not configured for this company' },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    const results = [];

    // Sincronizar cada template pendente
    for (const template of pendingTemplates) {
      if (!template.facebookTemplateId) {
        console.log(`⚠️ Template ${template._id} has no Facebook ID, skipping`);
        continue;
      }

      try {
        console.log(`🔄 Syncing template ${template._id} (Facebook ID: ${template.facebookTemplateId})`);
        
        const statusResponse = await facebookApi.getTemplateStatus(template.facebookTemplateId);
        
        if (!statusResponse.success) {
          console.error(`❌ Failed to get status for template ${template._id}:`, statusResponse.error);
          results.push({
            templateId: template._id,
            status: 'error',
            error: statusResponse.error,
          });
          continue;
        }

        const facebookStatus = statusResponse.data?.status;
        if (!facebookStatus) {
          console.log(`⚠️ No status found for template ${template._id}`);
          continue;
        }

        // Mapear status do Facebook para nosso sistema
        let newStatus: 'approved' | 'rejected' | 'expired' | 'pending';
        
        switch (facebookStatus) {
          case 'APPROVED':
            newStatus = 'approved';
            break;
          case 'REJECTED':
            newStatus = 'rejected';
            break;
          case 'EXPIRED':
            newStatus = 'expired';
            break;
          case 'PENDING':
            newStatus = 'pending';
            break;
          default:
            console.log(`⚠️ Unknown Facebook status for template ${template._id}: ${facebookStatus}`);
            continue;
        }

        // Atualizar status do template
        await updateTemplateStatus(template._id!, newStatus, {
          rejectionReason: statusResponse.data?.rejection_reason,
        });

        console.log(`✅ Template ${template._id} status updated to: ${newStatus}`);
        
        results.push({
          templateId: template._id,
          status: 'synced',
          newStatus,
          facebookStatus,
        });

        syncedCount++;

      } catch (error) {
        console.error(`❌ Error syncing template ${template._id}:`, error);
        results.push({
          templateId: template._id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} templates`,
      synced: syncedCount,
      total: pendingTemplates.length,
      results,
    });
  } catch (error) {
    console.error('Error syncing template status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
