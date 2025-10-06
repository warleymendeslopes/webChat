# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-10-01

### Adicionado

#### Funcionalidades Principais

- ✅ Sistema de autenticação completo (Email/Senha e Google)
- ✅ Integração com WhatsApp Business API
- ✅ Mensagens em tempo real com Firebase Firestore
- ✅ Envio e recebimento de mensagens via WhatsApp
- ✅ Suporte a múltiplos tipos de mídia (imagens, vídeos, áudio, documentos)
- ✅ Upload de arquivos para Firebase Storage
- ✅ Interface responsiva (mobile e desktop)

#### Componentes UI

- `AuthForm` - Formulário de autenticação com suporte a múltiplos provedores
- `ChatList` - Lista de conversas em tempo real
- `ChatWindow` - Janela principal de chat
- `MessageBubble` - Bolhas de mensagem estilizadas
- `MessageInput` - Input de mensagens com suporte a mídia

#### API Routes

- `/api/webhook` - Webhook para receber mensagens do WhatsApp
- `/api/send-message` - Endpoint para enviar mensagens via WhatsApp
- `/api/upload` - Upload de arquivos para Firebase Storage

#### Funcionalidades de Mensagens

- Status de mensagens (enviada, entregue, lida)
- Indicador de online/offline
- Timestamp em todas as mensagens
- Suporte a mensagens de texto e mídia
- Sincronização em tempo real

#### Documentação

- README completo com instruções de uso
- SETUP.md - Guia detalhado de configuração
- DEPLOYMENT.md - Guias de deploy para múltiplas plataformas
- QUICKSTART.md - Guia de início rápido
- CONTRIBUTING.md - Guia de contribuição
- Configurações de regras do Firebase (Firestore e Storage)
- Definições de índices do Firestore

#### Infraestrutura

- Configuração TypeScript
- Integração com Tailwind CSS
- Configuração Next.js otimizada
- Gerenciamento de variáveis de ambiente
- Tratamento de erros robusto

### Tecnologias Utilizadas

- Next.js 15.5.4
- React 19
- TypeScript 5
- Firebase 11.2.0
- Tailwind CSS 4.0.0
- Lucide React (ícones)
- date-fns (manipulação de datas)
- Axios (requisições HTTP)

### Notas de Segurança

- Regras de segurança do Firestore configuradas
- Regras de segurança do Storage com limite de tamanho
- Autenticação obrigatória para todas as operações
- Variáveis de ambiente para credenciais sensíveis
- Validação de webhook do WhatsApp

### Conhecido Issues

- Webhook requer HTTPS em produção
- Access Token do WhatsApp expira (versão temporária)
- Necessário configurar domínio personalizado para produção

### Melhorias Futuras

- [ ] Picker de emojis
- [ ] Gravação de áudio
- [ ] Chamadas de voz/vídeo
- [ ] Grupos de chat
- [ ] Notificações push
- [ ] Busca de mensagens
- [ ] Tema escuro
- [ ] Backup de conversas
- [ ] Status/Stories
- [ ] Mensagens programadas
- [ ] Respostas rápidas
- [ ] Mensagens fixadas

## Como Contribuir

Para contribuir com este projeto, veja [CONTRIBUTING.md](CONTRIBUTING.md).

---

[1.0.0]: https://github.com/seu-usuario/whatsapp-chat/releases/tag/v1.0.0

