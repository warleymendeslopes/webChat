import { getTemplateByFacebookId, updateTemplateStatus } from '@/lib/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para receber notificações do Facebook sobre templates
 * POST /api/templates/webhook
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Facebook template webhook received:', JSON.stringify(body, null, 2));

    // Verificar se é uma notificação de template
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      for (const entry of entries) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          if (change.field === 'message_templates') {
            await handleTemplateStatusChange(change.value);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error processing template webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Processa mudanças de status de templates
 */
async function handleTemplateStatusChange(changeData: any) {
  try {
    const { message_template_id, status, rejection_reason } = changeData;
    
    if (!message_template_id || !status) {
      console.log('⚠️ Missing template ID or status in webhook');
      return;
    }

    console.log(`📊 Template status update: ${message_template_id} -> ${status}`);
    
    // Mapear status do Facebook para nosso sistema
    let newStatus: 'approved' | 'rejected' | 'expired';
    
    switch (status) {
      case 'APPROVED':
        newStatus = 'approved';
        break;
      case 'REJECTED':
        newStatus = 'rejected';
        break;
      case 'EXPIRED':
        newStatus = 'expired';
        break;
      default:
        console.log(`⚠️ Unknown template status: ${status}`);
        return;
    }

    // Buscar template pelo facebookTemplateId
    console.log(`🔍 Searching for template with Facebook ID: ${message_template_id}`);
    
    const template = await getTemplateByFacebookId(message_template_id);
    
    if (!template) {
      console.log(`⚠️ Template not found with Facebook ID: ${message_template_id}`);
      return;
    }

    console.log(`📝 Found template: ${template.name} (${template._id})`);
    
    // Atualizar status do template
    await updateTemplateStatus(template._id!, newStatus, {
      rejectionReason: rejection_reason,
    });

    console.log(`✅ Template ${template.name} status updated to: ${newStatus}`);
    
    if (rejection_reason) {
      console.log(`❌ Rejection reason: ${rejection_reason}`);
    }
  } catch (error) {
    console.error('Error handling template status change:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verificação do webhook (Facebook requer)
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Template webhook verified');
    return new Response(challenge);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
