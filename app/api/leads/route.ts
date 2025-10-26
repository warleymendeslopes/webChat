import { countLeads, createLead, getLeadsWithFilters, getPopularTags } from '@/lib/leads';
import { LeadFilters } from '@/types/leads';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Leads
 * GET /api/leads?companyId=xxx - Listar leads com filtros
 * POST /api/leads - Criar lead manualmente
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

    // Parâmetros de paginação
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Construir filtros
    const filters: LeadFilters = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any;
    }

    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }

    if (searchParams.get('assignedTo')) {
      filters.assignedTo = searchParams.get('assignedTo')!;
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    if (searchParams.get('isFavorite')) {
      filters.isFavorite = searchParams.get('isFavorite') === 'true';
    }

    // Buscar leads
    const leads = await getLeadsWithFilters(companyId, filters, limit, skip);
    const total = await countLeads(companyId, filters);
    const popularTags = await getPopularTags(companyId);

    return NextResponse.json({
      success: true,
      leads,
      total,
      limit,
      skip,
      hasMore: (skip + limit) < total,
      popularTags,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      firestoreUserId,
      chatId,
      phoneNumber,
      name,
      email,
      assignedTo,
      tags = [],
      notes = '',
      source = 'manual',
      customFields = {},
      estimatedValue,
    } = body;

    if (!companyId || !phoneNumber || !name) {
      return NextResponse.json(
        { error: 'companyId, phoneNumber, and name are required' },
        { status: 400 }
      );
    }

    const leadId = await createLead({
      companyId,
      firestoreUserId: firestoreUserId || '',
      chatId: chatId || '',
      phoneNumber,
      name,
      email,
      status: 'new',
      stage: 'lead',
      tags,
      notes,
      source,
      customFields, // 🆕 Campos personalizados (produto, etc)
      estimatedValue, // 🆕 Valor estimado
      firstContactAt: new Date(),
      lastContactAt: new Date(),
      lastMessageFrom: 'customer',
      totalMessages: 0,
      totalInteractions: 0,
      assignedTo,
      isActive: true,
      isFavorite: false,
      hasWhatsApp: source === 'whatsapp', // True se veio do WhatsApp
    });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead created successfully',
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

