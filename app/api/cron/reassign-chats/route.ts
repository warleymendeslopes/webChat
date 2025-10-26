import { markInactiveAttendantsAsOffline } from '@/lib/attendantStatus';
import { markExpiredChats, reassignInactiveChats } from '@/lib/chatDistribution';
import { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron Job para reatribuição automática de chats inativos
 * GET /api/cron/reassign-chats
 * 
 * Este endpoint deve ser executado periodicamente (ex: a cada 30 minutos)
 * via Vercel Cron Jobs ou outro serviço de agendamento
 * 
 * Configurar em vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reassign-chats",
 *     "schedule": "* /30 * * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting automatic chat reassignment cron job...');

    // Verificar token de autorização (segurança para cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    // Em produção, você deve validar o token
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      companies: 0,
      expiredChats: 0,
      reassignedChats: 0,
      offlineAttendants: 0,
      timestamp: new Date().toISOString(),
    };

    // Buscar todas as empresas ativas
    const companiesCollection = await getCollection('companies');
    const companies = await companiesCollection.find({ isActive: true }).toArray();

    console.log(`📊 Found ${companies.length} active companies`);

    for (const company of companies) {
      const companyId = company._id.toString();
      console.log(`\n🏢 Processing company: ${companyId} (${company.name})`);

      try {
        // 1. Marcar chats com janela de 24h expirada
        const expiredCount = await markExpiredChats(companyId);
        results.expiredChats += expiredCount;
        
        if (expiredCount > 0) {
          console.log(`  ⏰ Marked ${expiredCount} chats as expired (24h window)`);
        }

        // 2. Reatribuir chats inativos (sem resposta do atendente há mais de 24h)
        const reassignedCount = await reassignInactiveChats(companyId, 24);
        results.reassignedChats += reassignedCount;
        
        if (reassignedCount > 0) {
          console.log(`  🔄 Reassigned ${reassignedCount} inactive chats`);
        }

        // 3. Marcar atendentes inativos como offline (sem atividade há mais de 10 min)
        const offlineCount = await markInactiveAttendantsAsOffline(companyId, 10);
        results.offlineAttendants += offlineCount;
        
        if (offlineCount > 0) {
          console.log(`  🔴 Marked ${offlineCount} attendants as offline`);
        }

        results.companies++;
      } catch (companyError) {
        console.error(`❌ Error processing company ${companyId}:`, companyError);
        // Continuar com a próxima empresa mesmo se houver erro
      }
    }

    console.log('\n✅ Cron job completed successfully');
    console.log('📊 Results:', results);

    return NextResponse.json({
      success: true,
      message: 'Chat reassignment completed',
      results,
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Permitir POST também (para testes manuais)
export async function POST(request: NextRequest) {
  return GET(request);
}

