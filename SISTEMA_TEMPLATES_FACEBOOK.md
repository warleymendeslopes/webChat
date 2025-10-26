# Sistema de Templates do Facebook

## 📋 Visão Geral

O sistema de templates do Facebook permite que administradores criem, gerenciem e acompanhem templates de mensagens para WhatsApp Business API. O sistema integra com a Facebook Graph API para submissão automática e rastreamento de status de aprovação.

## 🚀 Funcionalidades

### ✅ Implementadas

1. **Criação de Templates**

   - Interface visual para criar templates
   - Suporte a componentes (HEADER, BODY, FOOTER)
   - Botões interativos (URL, Telefone, Resposta Rápida)
   - Validação de estrutura obrigatória
   - Preview em tempo real

2. **Gerenciamento de Templates**

   - Lista com filtros por status, categoria, idioma
   - Busca por nome e descrição
   - Estatísticas em tempo real
   - Ações rápidas (editar, excluir, enviar)

3. **Integração com Facebook**

   - Submissão automática para aprovação
   - Validação de credenciais
   - Rastreamento de status em tempo real
   - Webhook para notificações do Facebook

4. **Sistema de Notificações**

   - Notificações em tempo real de mudanças de status
   - Polling automático para verificar aprovações
   - Notificações visuais com detalhes de rejeição

5. **Controle de Acesso**
   - Apenas administradores podem gerenciar templates
   - Isolamento por empresa (companyId)

## 🏗️ Arquitetura

### Backend

```
lib/
├── templates.ts              # Lógica de negócio para templates
├── facebookApi.ts            # Integração com Facebook Graph API
└── mongodb.ts               # Conexão com MongoDB

app/api/templates/
├── route.ts                 # CRUD de templates
├── [templateId]/route.ts    # Operações individuais
├── stats/route.ts           # Estatísticas
├── submit/route.ts          # Submissão para Facebook
├── sync-status/route.ts     # Sincronização de status
└── webhook/route.ts         # Webhook do Facebook
```

### Frontend

```
components/
├── TemplateManager.tsx           # Gerenciador principal
├── NewTemplateModal.tsx         # Modal de criação
└── TemplateStatusNotification.tsx # Notificações

hooks/
└── useTemplateNotifications.ts   # Hook para notificações

app/admin/templates/
└── page.tsx                     # Página de templates
```

## 📊 Estrutura de Dados

### Template (MongoDB)

```typescript
interface FacebookTemplate {
  _id?: string;
  companyId: string;
  name: string;
  category: "marketing" | "utility" | "authentication";
  language: string; // pt_BR, en_US, etc.

  // Estrutura do template
  components: TemplateComponent[];
  buttons?: TemplateButton[];

  // Status e aprovação
  status: "draft" | "pending" | "approved" | "rejected" | "expired";
  facebookTemplateId?: string;
  rejectionReason?: string;

  // Metadados
  description?: string;
  tags: string[];
  isActive: boolean;

  // Datas
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  expiresAt?: Date;

  // Usuário responsável
  createdBy: string;
  lastModifiedBy: string;
}
```

### Componente de Template

```typescript
interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    footer_text?: string;
  };
}
```

### Botão de Template

```typescript
interface TemplateButton {
  type: "URL" | "PHONE_NUMBER" | "QUICK_REPLY";
  text: string;
  url?: string;
  phone_number?: string;
}
```

## 🔄 Fluxo de Aprovação

1. **Criação**: Admin cria template no sistema
2. **Validação**: Sistema valida estrutura obrigatória
3. **Submissão**: Template é enviado para Facebook Graph API
4. **Aprovação**: Facebook analisa e aprova/rejeita
5. **Notificação**: Sistema recebe webhook e notifica admin
6. **Uso**: Templates aprovados ficam disponíveis para uso

## 🛠️ Configuração

### 1. Variáveis de Ambiente

```env
# Facebook Graph API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# MongoDB
MONGODB_URI=mongodb://...

# Base URL (para webhooks)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Webhook do Facebook

Configure o webhook no Facebook Developer Console:

- **URL**: `https://yourdomain.com/api/templates/webhook`
- **Verify Token**: Use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`
- **Campos**: `message_templates`

### 3. Permissões do Facebook

O access token precisa das seguintes permissões:

- `whatsapp_business_messaging`
- `whatsapp_business_management`

## 📱 Interface do Usuário

### Página de Templates (`/admin/templates`)

- **Dashboard**: Estatísticas de templates por status
- **Filtros**: Status, categoria, idioma, busca
- **Lista**: Cards com informações e ações
- **Criação**: Modal com formulário completo
- **Notificações**: Alertas de mudanças de status

### Modal de Criação

- **Informações Básicas**: Nome, categoria, idioma
- **Componentes**: HEADER, BODY, FOOTER obrigatórios
- **Botões**: Opcionais, com validação
- **Preview**: Visualização em tempo real
- **Validação**: Verificação de estrutura obrigatória

## 🔧 APIs Disponíveis

### Templates

- `GET /api/templates` - Listar templates com filtros
- `POST /api/templates` - Criar novo template
- `GET /api/templates/[id]` - Buscar template específico
- `PUT /api/templates/[id]` - Atualizar template
- `DELETE /api/templates/[id]` - Desativar template

### Estatísticas

- `GET /api/templates/stats` - Estatísticas de templates

### Facebook Integration

- `POST /api/templates/submit` - Submeter para Facebook
- `POST /api/templates/sync-status` - Sincronizar status
- `POST /api/templates/webhook` - Webhook do Facebook

## 🚨 Tratamento de Erros

### Validação de Template

- Nome obrigatório
- Categoria obrigatória
- Idioma obrigatório
- Pelo menos um HEADER e um BODY
- Estrutura válida para Facebook

### Erros de Facebook API

- Credenciais inválidas
- Template malformado
- Limite de submissões excedido
- Erro de rede

### Notificações de Erro

- Alertas visuais para erros
- Logs detalhados no console
- Retry automático para falhas temporárias

## 📈 Monitoramento

### Logs

- Submissões de templates
- Respostas do Facebook
- Erros de validação
- Mudanças de status

### Métricas

- Total de templates
- Taxa de aprovação
- Tempo médio de aprovação
- Templates por categoria

## 🔒 Segurança

### Validação

- Estrutura obrigatória do template
- Sanitização de entrada
- Validação de credenciais Facebook

### Controle de Acesso

- Apenas administradores
- Isolamento por empresa
- Validação de permissões

### Dados Sensíveis

- Access tokens armazenados criptografados
- Logs sem informações sensíveis
- Webhook com verificação de token

## 🚀 Próximos Passos

### Melhorias Planejadas

1. **Templates Reutilizáveis**

   - Biblioteca de templates comuns
   - Importação/exportação
   - Versionamento

2. **Analytics Avançados**

   - Métricas de uso
   - Performance por template
   - Relatórios detalhados

3. **Automação**

   - Renovação automática
   - Alertas de expiração
   - Aprovação em lote

4. **Integração WhatsApp**
   - Uso direto de templates aprovados
   - Envio de mensagens template
   - Tracking de entregas

## 📚 Recursos Adicionais

- [Facebook Graph API - Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [WhatsApp Business API - Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Webhook do Facebook](https://developers.facebook.com/docs/graph-api/webhooks)

## 🐛 Troubleshooting

### Template não é aprovado

1. Verificar estrutura obrigatória
2. Validar conteúdo contra políticas do Facebook
3. Verificar exemplos fornecidos
4. Revisar categoria escolhida

### Webhook não funciona

1. Verificar URL do webhook
2. Confirmar verify token
3. Testar conectividade
4. Verificar logs do servidor

### Credenciais inválidas

1. Verificar access token
2. Confirmar phone number ID
3. Validar permissões
4. Testar conectividade

---

**Sistema desenvolvido para gerenciamento completo de templates do Facebook WhatsApp Business API** 🚀
