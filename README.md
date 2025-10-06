# WhatsApp Chat Application

Uma aplicação de chat moderna construída com Next.js, Firebase e integração com a API do WhatsApp Business, funcionando de forma similar ao WhatsApp Web.

> 🚀 **Novo no projeto?** Comece aqui: [START_HERE.md](START_HERE.md)

## 🚀 Tecnologias

- **Next.js 15** - Framework React para produção
- **TypeScript** - Tipagem estática
- **Firebase** - Backend as a Service
  - Authentication - Autenticação de usuários
  - Firestore - Banco de dados em tempo real
  - Storage - Armazenamento de mídia
- **WhatsApp Business API** - Integração com WhatsApp
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## ✨ Funcionalidades

- ✅ Autenticação de usuários (Email/Senha e Google)
- ✅ Mensagens em tempo real
- ✅ Integração com WhatsApp Business API
- ✅ Envio e recebimento de mensagens via WhatsApp
- ✅ Suporte a mídia (imagens, vídeos, áudio, documentos)
- ✅ Interface responsiva (mobile e desktop)
- ✅ Status de mensagens (enviada, entregue, lida)
- ✅ Indicador de online/offline
- ✅ Lista de conversas
- ✅ Upload de arquivos

## 📋 Pré-requisitos

1. **Node.js** 18+ instalado
2. **Conta Firebase** - [Criar conta](https://firebase.google.com/)
3. **WhatsApp Business API** - [Meta for Developers](https://developers.facebook.com/)

## 🔧 Configuração

### 1. Clone o projeto

```bash
git clone <seu-repositorio>
cd chat
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative os seguintes serviços:

   - **Authentication**: Habilite Email/Password e Google
   - **Firestore Database**: Crie em modo produção
   - **Storage**: Ative o serviço

4. Vá em Configurações do Projeto → Suas aplicações → Web
5. Copie as credenciais do Firebase

### 4. Configure a WhatsApp Business API

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie um app e adicione o produto WhatsApp
3. Configure um número de telefone de teste ou produção
4. Obtenha:
   - Phone Number ID
   - Access Token
   - Crie um Verify Token (pode ser qualquer string segura)

### 5. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=seu_verify_token_personalizado
```

### 6. Configure as regras do Firestore

No console do Firebase, vá em Firestore Database → Regras e configure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
    }

    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 7. Configure as regras do Storage

No console do Firebase, vá em Storage → Regras:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{chatId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Executando o projeto

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Produção

```bash
npm run build
npm start
```

## 🔗 Configurar Webhook do WhatsApp

1. Deploy sua aplicação (Vercel, Railway, etc.)
2. No painel do Meta for Developers:
   - Vá em WhatsApp → Configuration
   - Configure o Webhook URL: `https://seu-dominio.com/api/webhook`
   - Configure o Verify Token (mesmo do .env.local)
   - Subscreva nos eventos: `messages`

## 📱 Como usar

1. **Criar conta**: Registre-se com email/senha ou use Google
2. **Receber mensagens**: Quando alguém enviar mensagem para seu número do WhatsApp Business, ela aparecerá no chat
3. **Enviar mensagens**: Digite uma mensagem e clique em enviar
4. **Enviar mídia**: Clique no ícone de clipe e selecione um arquivo

## 📁 Estrutura do Projeto

```
chat/
├── app/
│   ├── api/
│   │   ├── send-message/    # Endpoint para enviar mensagens
│   │   ├── upload/          # Endpoint para upload de arquivos
│   │   └── webhook/         # Webhook do WhatsApp
│   ├── page.tsx             # Página principal
│   └── layout.tsx           # Layout base
├── components/
│   ├── AuthForm.tsx         # Formulário de autenticação
│   ├── ChatList.tsx         # Lista de conversas
│   ├── ChatWindow.tsx       # Janela de chat
│   ├── MessageBubble.tsx    # Bolha de mensagem
│   └── MessageInput.tsx     # Input de mensagem
├── hooks/
│   └── useAuth.ts           # Hook de autenticação
├── lib/
│   ├── firebase.ts          # Configuração do Firebase
│   ├── firestore.ts         # Funções do Firestore
│   ├── storage.ts           # Funções do Storage
│   └── whatsapp.ts          # Integração com WhatsApp API
├── types/
│   └── index.ts             # Definições de tipos
└── .env.local               # Variáveis de ambiente
```

## 🔒 Segurança

- Nunca compartilhe seu arquivo `.env.local`
- Mantenha suas chaves de API privadas
- Configure corretamente as regras do Firebase
- Use HTTPS em produção
- Implemente rate limiting nas APIs

## 🐛 Troubleshooting

### Erro de autenticação Firebase

- Verifique se as credenciais no `.env.local` estão corretas
- Certifique-se de que os métodos de autenticação estão habilitados no Firebase

### Mensagens do WhatsApp não chegam

- Verifique se o webhook está configurado corretamente
- Confirme que o Verify Token está correto
- Veja os logs do webhook no Meta for Developers

### Upload de arquivos falha

- Verifique as regras do Firebase Storage
- Confirme que o usuário está autenticado
- Verifique o tamanho máximo do arquivo

## 📝 Próximos passos

- [ ] Adicionar emojis picker
- [ ] Implementar gravação de áudio
- [ ] Adicionar chamadas de voz/vídeo
- [ ] Criar grupos de chat
- [ ] Adicionar notificações push
- [ ] Implementar busca de mensagens
- [ ] Adicionar temas (claro/escuro)
- [ ] Implementar backup de conversas

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no repositório.

---

Desenvolvido com ❤️ usando Next.js e Firebase
# webChat
