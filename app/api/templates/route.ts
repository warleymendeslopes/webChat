import { countTemplates, createTemplate, getTemplatesWithFilters } from '@/lib/templates';
import { TemplateFilters } from '@/types/templates';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Templates do Facebook
 * GET /api/templates?companyId=xxx - Listar templates com filtros
 * POST /api/templates - Criar template
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
    const filters: TemplateFilters = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any;
    }

    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!.split(',') as any;
    }

    if (searchParams.get('language')) {
      filters.language = searchParams.get('language')!.split(',');
    }

    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',');
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    if (searchParams.get('createdBy')) {
      filters.createdBy = searchParams.get('createdBy')!;
    }

    if (searchParams.get('isActive')) {
      filters.isActive = searchParams.get('isActive') === 'true';
    }

    // Buscar templates
    const templates = await getTemplatesWithFilters(companyId, filters, limit, skip);
    const total = await countTemplates(companyId, filters);

    return NextResponse.json({
      success: true,
      templates,
      total,
      limit,
      skip,
      hasMore: (skip + limit) < total,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
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
      name,
      category,
      language,
      components,
      buttons,
      description,
      tags = [],
      createdBy,
    } = body;

    if (!companyId || !name || !category || !language || !components) {
      return NextResponse.json(
        { error: 'companyId, name, category, language, and components are required' },
        { status: 400 }
      );
    }

    // Validar template
    const validation = validateTemplate({
      name,
      category,
      language,
      components,
      buttons,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Template validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const templateId = await createTemplate({
      companyId,
      name,
      category,
      language,
      components,
      buttons,
      status: 'draft',
      tags,
      description,
      isActive: true,
      createdBy,
      lastModifiedBy: createdBy,
    });

    return NextResponse.json({
      success: true,
      templateId,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Função de validação (importada do lib/templates)
function validateTemplate(template: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Nome do template é obrigatório');
  }

  if (!template.category) {
    errors.push('Categoria é obrigatória');
  }

  if (!template.language || template.language.trim().length === 0) {
    errors.push('Idioma é obrigatório');
  }

  if (!template.components || template.components.length === 0) {
    errors.push('Pelo menos um componente é obrigatório');
  }

  if (template.components) {
    const hasHeader = template.components.some((c: any) => c.type === 'HEADER');
    const hasBody = template.components.some((c: any) => c.type === 'BODY');
    
    if (!hasHeader) {
      errors.push('Template deve ter pelo menos um componente HEADER');
    }
    
    if (!hasBody) {
      errors.push('Template deve ter pelo menos um componente BODY');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
