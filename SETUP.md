# Guia de Configuração Passo a Passo

Este guia irá ajudá-lo a configurar completamente o aplicativo de chat do WhatsApp.

## 1. Configuração do Firebase

### 1.1 Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "whatsapp-chat")
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### 1.2 Configurar Authentication

1. No menu lateral, clique em "Authentication"
2. Clique em "Começar"
3. Ative os seguintes métodos:
   - **E-mail/senha**: Clique em "E-mail/senha" → Ativar → Salvar
   - **Google**: Clique em "Google" → Ativar → Salvar

### 1.3 Configurar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Selecione "Iniciar no modo de produção"
4. Escolha uma localização (ex: southamerica-east1)
5. Clique em "Ativar"

#### Configurar Regras do Firestore

1. Clique na aba "Regras"
2. Copie o conteúdo do arquivo `firestore.rules` deste projeto
3. Cole no editor e clique em "Publicar"

#### Criar Índices do Firestore

Os índices serão criados automaticamente quando necessário, ou você pode:

1. Clique na aba "Índices"
2. Use o arquivo `firestore.indexes.json` como referência

### 1.4 Configurar Storage

1. No menu lateral, clique em "Storage"
2. Clique em "Começar"
3. Clique em "Avançar" nas regras padrão
4. Escolha a mesma localização do Firestore
5. Clique em "Concluir"

#### Configurar Regras do Storage

1. Clique na aba "Regras"
2. Copie o conteúdo do arquivo `storage.rules` deste projeto
3. Cole no editor e clique em "Publicar"

### 1.5 Obter Credenciais do Firebase

1. Clique no ícone de engrenagem → "Configurações do projeto"
2. Role até "Seus apps"
3. Clique no ícone Web (</>)
4. Digite um nome para o app (ex: "WhatsApp Chat Web")
5. Não marque "Firebase Hosting"
6. Clique em "Registrar app"
7. Copie as credenciais que aparecem

## 2. Configuração da WhatsApp Business API

### 2.1 Criar App no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Clique em "Meus Apps" → "Criar App"
3. Selecione "Negócios" como tipo de app
4. Preencha os detalhes:
   - **Nome do app**: WhatsApp Chat API
   - **E-mail de contato**: seu e-mail
5. Clique em "Criar app"

### 2.2 Adicionar WhatsApp ao App

1. No painel do app, procure por "WhatsApp"
2. Clique em "Configurar" no card do WhatsApp
3. Você será direcionado para a página de configuração

### 2.3 Configurar Número de Teste

1. Na seção "API Setup", você verá:
   - **Phone Number ID** (guarde este valor)
   - **WhatsApp Business Account ID**
2. Clique em "Add phone number" para adicionar um número de teste
3. Um número de teste será fornecido automaticamente

### 2.4 Obter Access Token

1. Na mesma página "API Setup"
2. Você verá um "Temporary access token"
3. **IMPORTANTE**: Este token expira em 24 horas
4. Para produção, você precisará gerar um token permanente:
   - Vá em "Tools" → "Access Tokens"
   - Gere um token de sistema com as permissões:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`

### 2.5 Testar Envio de Mensagem

1. Na seção "API Setup", há uma área de teste
2. Adicione seu número pessoal do WhatsApp
3. Você receberá um código de verificação no WhatsApp
4. Digite o código para confirmar
5. Teste enviando uma mensagem de exemplo

### 2.6 Configurar Webhook

**NOTA**: Faça isso DEPOIS de fazer o deploy da aplicação

1. Na seção "Configuration" do WhatsApp
2. Clique em "Edit" no Webhook
3. Preencha:
   - **Callback URL**: `https://seu-dominio.com/api/webhook`
   - **Verify Token**: Crie uma string segura (ex: "meu_token_secreto_123")
4. Clique em "Verify and Save"
5. Subscreva nos campos de webhook:
   - Marque a caixa "messages"

## 3. Configuração Local do Projeto

### 3.1 Criar arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local`:

```env
# Firebase Configuration (copie do passo 1.5)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# WhatsApp Business API (copie do passo 2)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
```

### 3.2 Instalar Dependências

```bash
npm install
```

### 3.3 Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## 4. Deploy para Produção

### 4.1 Deploy na Vercel (Recomendado)

1. Instale a CLI da Vercel:

```bash
npm install -g vercel
```

2. Faça login:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

4. Configure as variáveis de ambiente na Vercel:

   - Acesse o dashboard da Vercel
   - Vá em Settings → Environment Variables
   - Adicione todas as variáveis do `.env.local`

5. Após o deploy, copie a URL do projeto

### 4.2 Configurar Webhook (Produção)

1. Volte ao Meta for Developers
2. WhatsApp → Configuration → Webhook
3. Atualize a Callback URL com sua URL de produção:
   - `https://seu-projeto.vercel.app/api/webhook`
4. Verifique que o webhook está funcionando enviando uma mensagem de teste

## 5. Testando a Aplicação

### 5.1 Criar Conta

1. Acesse a aplicação
2. Clique em "Criar uma conta"
3. Preencha os dados e registre-se

### 5.2 Receber Mensagens do WhatsApp

1. Envie uma mensagem para o número do WhatsApp Business
2. A mensagem deve aparecer no chat da aplicação

### 5.3 Enviar Mensagens

1. Na aplicação, selecione ou crie uma conversa
2. Digite uma mensagem e envie
3. A mensagem deve ser recebida no WhatsApp do destinatário

### 5.4 Enviar Mídia

1. Clique no ícone de clipe
2. Selecione uma imagem, vídeo ou documento
3. Aguarde o upload e envie
4. A mídia deve ser recebida no WhatsApp

## 6. Troubleshooting

### Erro: "Firebase: Error (auth/invalid-api-key)"

- Verifique se as credenciais do Firebase estão corretas no `.env.local`

### Webhook não recebe mensagens

- Certifique-se de que a URL do webhook está acessível publicamente
- Verifique se o Verify Token está correto
- Veja os logs no Meta for Developers

### Mensagens não são enviadas

- Verifique se o Access Token está válido
- Confirme que o Phone Number ID está correto
- Veja os logs da API na aplicação

### Upload de arquivos falha

- Verifique as regras do Firebase Storage
- Confirme que o usuário está autenticado
- Verifique o tamanho do arquivo (máx 10MB por padrão)

## 7. Próximos Passos

- Configure um domínio personalizado
- Adicione mais funcionalidades (grupos, chamadas, etc.)
- Implemente analytics
- Configure alertas de erro
- Adicione testes automatizados

## Suporte

Se tiver dúvidas ou problemas:

1. Verifique a documentação oficial:
   - [Firebase Docs](https://firebase.google.com/docs)
   - [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
2. Abra uma issue no repositório
3. Entre em contato com o desenvolvedor

---

Boa sorte com seu projeto! 🚀

