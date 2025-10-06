# 📑 Índice de Arquivos do Projeto

Referência rápida de todos os arquivos do projeto e suas funções.

## 📁 Estrutura Completa

```
chat/
├── 📱 app/                      # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── send-message/        # Envio de mensagens WhatsApp
│   │   │   └── route.ts
│   │   ├── upload/              # Upload de arquivos
│   │   │   └── route.ts
│   │   └── webhook/             # Webhook do WhatsApp
│   │       └── route.ts
│   ├── globals.css              # Estilos globais
│   ├── layout.tsx               # Layout raiz da aplicação
│   └── page.tsx                 # Página principal (chat)
│
├── 🎨 components/               # Componentes React
│   ├── AuthForm.tsx             # Formulário de autenticação
│   ├── ChatList.tsx             # Lista de conversas
│   ├── ChatWindow.tsx           # Janela de chat principal
│   ├── MessageBubble.tsx        # Bolha de mensagem individual
│   └── MessageInput.tsx         # Input de mensagens
│
├── 🔗 contexts/                 # React Contexts
│   └── AuthContext.tsx          # Contexto de autenticação
│
├── 🎣 hooks/                    # Custom Hooks
│   └── useAuth.ts               # Hook de autenticação
│
├── 📚 lib/                      # Bibliotecas e utilitários
│   ├── firebase.ts              # Configuração Firebase
│   ├── firestore.ts             # Operações Firestore
│   ├── storage.ts               # Upload de arquivos
│   └── whatsapp.ts              # Integração WhatsApp API
│
├── 🔧 scripts/                  # Scripts utilitários
│   └── check-env.js             # Verificar variáveis de ambiente
│
├── 📘 types/                    # Definições TypeScript
│   └── index.ts                 # Tipos e interfaces
│
├── 📄 Documentação              # Arquivos de documentação
│   ├── README.md                # Visão geral do projeto
│   ├── QUICKSTART.md            # Início rápido (15 min)
│   ├── SETUP.md                 # Setup detalhado
│   ├── DEPLOYMENT.md            # Guias de deploy
│   ├── CONTRIBUTING.md          # Como contribuir
│   ├── CHANGELOG.md             # Histórico de versões
│   ├── PROJECT_SUMMARY.md       # Sumário do projeto
│   └── FILE_INDEX.md            # Este arquivo
│
├── ⚙️ Configuração              # Arquivos de configuração
│   ├── .env.example             # Exemplo de variáveis de ambiente
│   ├── .gitignore               # Arquivos ignorados pelo Git
│   ├── firestore.indexes.json  # Índices do Firestore
│   ├── firestore.rules          # Regras de segurança Firestore
│   ├── storage.rules            # Regras de segurança Storage
│   ├── next.config.ts           # Configuração Next.js
│   ├── package.json             # Dependências npm
│   ├── postcss.config.mjs       # Configuração PostCSS
│   ├── tailwind.config.ts       # Configuração Tailwind CSS
│   └── tsconfig.json            # Configuração TypeScript
│
└── 📜 Outros
    └── LICENSE                  # Licença MIT
```

## 📝 Descrição Detalhada

### Componentes (components/)

#### `AuthForm.tsx`

- **Função**: Gerencia autenticação de usuários
- **Recursos**:
  - Login com email/senha
  - Login com Google
  - Criação de conta
  - Validação de formulários
  - Integração com Firebase Auth

#### `ChatList.tsx`

- **Função**: Exibe lista de conversas
- **Recursos**:
  - Atualização em tempo real
  - Ordenação por última mensagem
  - Contador de mensagens não lidas
  - Preview da última mensagem
  - Responsivo

#### `ChatWindow.tsx`

- **Função**: Janela principal de chat
- **Recursos**:
  - Exibição de mensagens
  - Scroll automático
  - Header com informações do contato
  - Botões de ação (chamada, vídeo)
  - Responsivo com botão de voltar mobile

#### `MessageBubble.tsx`

- **Função**: Exibe uma mensagem individual
- **Recursos**:
  - Diferenciação visual (enviada/recebida)
  - Suporte a texto e mídia
  - Status de mensagem (enviada, entregue, lida)
  - Timestamp formatado
  - Preview de mídia

#### `MessageInput.tsx`

- **Função**: Input para enviar mensagens
- **Recursos**:
  - Campo de texto
  - Botão de envio
  - Upload de arquivos (clipe)
  - Botão de emoji (placeholder)
  - Botão de áudio (placeholder)
  - Loading state

### API Routes (app/api/)

#### `webhook/route.ts`

- **Endpoints**:
  - `GET`: Verificação do webhook
  - `POST`: Recebimento de mensagens
- **Função**: Processa mensagens recebidas do WhatsApp

#### `send-message/route.ts`

- **Endpoint**: `POST`
- **Função**: Envia mensagens via WhatsApp API
- **Recursos**:
  - Envio de texto
  - Envio de mídia
  - Salva no Firestore
  - Atualiza status

#### `upload/route.ts`

- **Endpoint**: `POST`
- **Função**: Upload de arquivos para Firebase Storage
- **Recursos**:
  - Validação de tipo
  - Upload seguro
  - Retorna URL pública

### Bibliotecas (lib/)

#### `firebase.ts`

- **Exporta**: auth, db, storage, app
- **Função**: Inicializa e exporta instâncias Firebase

#### `firestore.ts`

- **Funções**:
  - `createUser()` - Criar usuário
  - `getUserByPhoneNumber()` - Buscar usuário
  - `updateUserStatus()` - Atualizar status
  - `createChat()` - Criar conversa
  - `findChatByParticipants()` - Buscar conversa
  - `sendMessage()` - Enviar mensagem
  - `subscribeToMessages()` - Listener de mensagens
  - `subscribeToChats()` - Listener de conversas

#### `whatsapp.ts`

- **Funções**:
  - `sendWhatsAppMessage()` - Enviar texto
  - `sendWhatsAppMedia()` - Enviar mídia
  - `markMessageAsRead()` - Marcar como lida

#### `storage.ts`

- **Funções**:
  - `uploadFile()` - Upload para Storage
  - `getMediaType()` - Detectar tipo de arquivo

### Tipos (types/)

#### `index.ts`

- **Interfaces**:
  - `User` - Dados do usuário
  - `Message` - Dados da mensagem
  - `Chat` - Dados da conversa
  - `WhatsAppMessage` - Payload do webhook

### Hooks (hooks/)

#### `useAuth.ts`

- **Retorna**: { user, loading }
- **Função**: Gerencia estado de autenticação
- **Recursos**:
  - Listener de auth state
  - Atualiza status online/offline

### Contextos (contexts/)

#### `AuthContext.tsx`

- **Provê**: AuthProvider, useAuthContext
- **Função**: Compartilha estado de autenticação
- **Recursos**: Similar ao useAuth com Provider

### Scripts (scripts/)

#### `check-env.js`

- **Comando**: `npm run check-env`
- **Função**: Verifica variáveis de ambiente
- **Recursos**:
  - Lista todas as variáveis
  - Identifica faltantes
  - Identifica placeholders
  - Dá feedback colorido

### Configuração

#### `.env.example`

- Template para variáveis de ambiente
- Contém todas as chaves necessárias

#### `firestore.rules`

- Regras de segurança do Firestore
- Controle de acesso granular

#### `storage.rules`

- Regras de segurança do Storage
- Limite de tamanho (10MB)

#### `firestore.indexes.json`

- Índices compostos para queries
- Otimização de performance

#### `next.config.ts`

- Configurações do Next.js
- Domínios permitidos para imagens
- React Strict Mode

#### `tsconfig.json`

- Configuração TypeScript
- Path aliases (@/\*)
- Strict mode

### Documentação

#### `README.md`

- Visão geral completa
- Funcionalidades
- Tecnologias
- Instruções básicas

#### `QUICKSTART.md`

- Guia rápido (15 min)
- 5 passos simples
- Para começar rapidamente

#### `SETUP.md`

- Guia detalhado passo a passo
- Configuração Firebase
- Configuração WhatsApp
- Troubleshooting

#### `DEPLOYMENT.md`

- Guias de deploy
- Múltiplas plataformas
- Vercel, Railway, AWS, etc.
- Custos estimados

#### `CONTRIBUTING.md`

- Como contribuir
- Convenções de código
- Processo de PR

#### `CHANGELOG.md`

- Histórico de versões
- Mudanças por versão
- Roadmap

#### `PROJECT_SUMMARY.md`

- Visão técnica completa
- Arquitetura
- Fluxos de dados
- Métricas

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento
npm run build            # Build para produção
npm start                # Iniciar servidor de produção
npm run lint             # Verificar código

# Utilitários
npm run check-env        # Verificar variáveis de ambiente
```

## 📊 Estatísticas do Projeto

- **Total de Componentes**: 5
- **API Routes**: 3
- **Bibliotecas**: 4
- **Tipos/Interfaces**: 4
- **Hooks**: 1
- **Arquivos de Documentação**: 8
- **Linhas de Código**: ~2500+

## 🔍 Busca Rápida

### Autenticação

- Componente: `components/AuthForm.tsx`
- Hook: `hooks/useAuth.ts`
- Contexto: `contexts/AuthContext.tsx`
- Config: `lib/firebase.ts`

### Mensagens

- Lista: `components/ChatList.tsx`
- Janela: `components/ChatWindow.tsx`
- Bolha: `components/MessageBubble.tsx`
- Input: `components/MessageInput.tsx`
- API: `app/api/send-message/route.ts`

### WhatsApp

- Webhook: `app/api/webhook/route.ts`
- Integração: `lib/whatsapp.ts`
- Tipos: `types/index.ts`

### Firebase

- Config: `lib/firebase.ts`
- Firestore: `lib/firestore.ts`
- Storage: `lib/storage.ts`
- Regras: `firestore.rules`, `storage.rules`

---

**Última atualização**: Outubro 2025  
**Versão do projeto**: 1.0.0

