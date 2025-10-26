import { addTagToLead, getLeadById, removeTagFromLead, toggleFavorite, updateLead, updateLeadStatus } from '@/lib/leads';
import { LeadStatus } from '@/types/leads';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Lead Individual
 * GET /api/leads/[leadId] - Buscar lead específico
 * PUT /api/leads/[leadId] - Atualizar lead
 * DELETE /api/leads/[leadId] - Desativar lead
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    const lead = await getLeadById(leadId);

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;
    const body = await request.json();

    // Verificar se lead existe
    const existingLead = await getLeadById(leadId);
    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Ações específicas
    if (body.action) {
      switch (body.action) {
        case 'toggle_favorite':
          const newState = await toggleFavorite(leadId);
          return NextResponse.json({
            success: true,
            isFavorite: newState,
          });

        case 'add_tag':
          if (!body.tag) {
            return NextResponse.json(
              { error: 'tag is required' },
              { status: 400 }
            );
          }
          await addTagToLead(leadId, body.tag);
          break;

        case 'remove_tag':
          if (!body.tag) {
            return NextResponse.json(
              { error: 'tag is required' },
              { status: 400 }
            );
          }
          await removeTagFromLead(leadId, body.tag);
          break;
      }
    }

    // Atualização de status (com extras como valor, motivo)
    if (body.status) {
      await updateLeadStatus(leadId, body.status as LeadStatus, {
        closedValue: body.closedValue,
        lostReason: body.lostReason,
        lostReasonCategory: body.lostReasonCategory,
        notes: body.notes,
      });
    } else {
      // Atualização genérica
      const { action, ...updates } = body;
      await updateLead(leadId, updates);
    }

    // Buscar lead atualizado
    const updatedLead = await getLeadById(leadId);

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    // Desativar ao invés de deletar
    await updateLead(leadId, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Lead deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

