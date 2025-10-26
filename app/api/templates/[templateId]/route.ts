import { getTemplateById, updateTemplate, updateTemplateStatus } from '@/lib/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Template Individual
 * GET /api/templates/[templateId] - Buscar template específico
 * PUT /api/templates/[templateId] - Atualizar template
 * DELETE /api/templates/[templateId] - Desativar template
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    const template = await getTemplateById(templateId);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const body = await request.json();

    // Verificar se template existe
    const existingTemplate = await getTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Ações específicas
    if (body.action) {
      switch (body.action) {
        case 'update_status':
          if (!body.status) {
            return NextResponse.json(
              { error: 'status is required' },
              { status: 400 }
            );
          }
          await updateTemplateStatus(templateId, body.status, {
            facebookTemplateId: body.facebookTemplateId,
            rejectionReason: body.rejectionReason,
          });
          break;

        case 'submit_to_facebook':
          // TODO: Implementar submissão para Facebook
          await updateTemplateStatus(templateId, 'pending');
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    } else {
      // Atualização genérica
      const { action, ...updates } = body;
      await updateTemplate(templateId, updates);
    }

    // Buscar template atualizado
    const updatedTemplate = await getTemplateById(templateId);

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;

    // Desativar ao invés de deletar
    await updateTemplate(templateId, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Template deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
