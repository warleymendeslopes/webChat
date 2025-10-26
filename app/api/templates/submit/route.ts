import { createFacebookApiManager } from '@/lib/facebookApi';
import { createTemplateSubmission, getTemplateById, updateSubmissionStatus, updateTemplateStatus } from '@/lib/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API para Submissão de Templates ao Facebook
 * POST /api/templates/submit
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, companyId } = body;

    if (!templateId || !companyId) {
      return NextResponse.json(
        { error: 'templateId and companyId are required' },
        { status: 400 }
      );
    }

    // Buscar template
    const template = await getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Verificar se já foi submetido
    if (template.status === 'pending' || template.status === 'approved') {
      return NextResponse.json(
        { error: 'Template already submitted or approved' },
        { status: 400 }
      );
    }

    // Criar registro de submissão
    const submissionId = await createTemplateSubmission(templateId, companyId);

    // Atualizar status do template para pending
    await updateTemplateStatus(templateId, 'pending');

    // Submissão real para Facebook Graph API
    try {
      // Criar instância do Facebook API Manager
      const facebookApi = await createFacebookApiManager(companyId);
      
      if (!facebookApi) {
        await updateSubmissionStatus(submissionId, 'failed', 'Facebook API not configured');
        await updateTemplateStatus(templateId, 'draft');
        
        return NextResponse.json(
          { error: 'Facebook API not configured for this company' },
          { status: 400 }
        );
      }

      // Validar credenciais primeiro
      const validation = await facebookApi.validateCredentials();
      if (!validation.success) {
        await updateSubmissionStatus(submissionId, 'failed', validation.error || 'Invalid Facebook credentials');
        await updateTemplateStatus(templateId, 'draft');
        
        return NextResponse.json(
          { error: `Facebook credentials validation failed: ${validation.error}` },
          { status: 400 }
        );
      }

      // Submeter template para o Facebook
      const submission = await facebookApi.submitTemplate(template);
      
      if (!submission.success) {
        await updateSubmissionStatus(submissionId, 'failed', submission.error || 'Facebook submission failed');
        await updateTemplateStatus(templateId, 'draft');
        
        return NextResponse.json(
          { error: `Facebook submission failed: ${submission.error}` },
          { status: 500 }
        );
      }

      // Atualizar submissão com sucesso
      await updateSubmissionStatus(submissionId, 'completed');
      await updateTemplateStatus(templateId, 'pending', {
        facebookTemplateId: submission.facebookTemplateId,
      });

      console.log(`✅ Template ${templateId} submitted to Facebook successfully`);

      return NextResponse.json({
        success: true,
        submissionId,
        facebookSubmissionId: submission.facebookSubmissionId,
        facebookTemplateId: submission.facebookTemplateId,
        message: 'Template submitted to Facebook successfully',
      });
    } catch (error) {
      // Se falhar na submissão, atualizar status
      await updateSubmissionStatus(submissionId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      await updateTemplateStatus(templateId, 'draft');
      
      console.error('❌ Error submitting template to Facebook:', error);
      
      return NextResponse.json(
        { error: 'Failed to submit template to Facebook' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error submitting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
