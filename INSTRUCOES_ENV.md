# 🔑 Instruções para Configurar Variáveis de Ambiente

## 📝 Passo a Passo

### 1️⃣ Copie o arquivo de exemplo

```bash
cp .env.example .env.local
```

### 2️⃣ Obter credenciais do Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique no seu projeto (ou crie um novo clicando em "Adicionar projeto")
3. Clique no ícone de **engrenagem ⚙️** > **Configurações do projeto**
4. Role até a seção **"Seus apps"**
5. Se não tiver um app web, clique no ícone **</>** para adicionar
6. Dê um nome (ex: "WhatsApp Chat Web") e clique em **"Registrar app"**
7. Copie as credenciais que aparecem:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxx",           // ← NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "seu-projeto.firebaseapp.com",        // ← NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "seu-projeto",                         // ← NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "seu-projeto.appspot.com",         // ← NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789012",                // ← NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789012:web:abcdef123456"          // ← NEXT_PUBLIC_FIREBASE_APP_ID
};
```

8. Cole cada valor no arquivo `.env.local`

### 3️⃣ Obter credenciais do WhatsApp Business

1. Acesse [Meta for Developers](https://developers.facebook.com)
2. Clique em **"Meus Apps"** > **"Criar App"**
3. Selecione tipo **"Negócios"**
4. Preencha os detalhes e crie o app
5. No dashboard do app, procure **"WhatsApp"** e clique em **"Configurar"**
6. Na página de **API Setup**, você verá:

   **Phone Number ID:**
   ```
   123456789012345  ← WHATSAPP_PHONE_NUMBER_ID
   ```

   **Temporary Access Token:**
   ```
   EAAGxxxxxxxxxxxxxxxxxxxxxx  ← WHATSAPP_ACCESS_TOKEN
   ```

7. Para o **Verify Token**, crie uma senha segura (ex: `meu_token_secreto_12345`)
   ```
   meu_token_secreto_12345  ← WHATSAPP_VERIFY_TOKEN
   ```

### 4️⃣ Preencher o arquivo .env.local

Edite o arquivo `.env.local` com suas credenciais:

```bash
# Abra o arquivo no VS Code
code .env.local

# Ou use nano
nano .env.local

# Ou vim
vim .env.local
```

Substitua todos os valores `your_*_here` pelas suas credenciais reais.

### 5️⃣ Verificar configuração

Execute o comando para verificar se tudo está correto:

```bash
npm run check-env
```

Você deve ver:
```
✅ Todas as variáveis de ambiente estão configuradas corretamente!
```

## 📋 Exemplo Completo de .env.local

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxK7J9mPqR3sT4uVwXyZ1aBcDeFgHiJkL
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meu-chat-whatsapp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meu-chat-whatsapp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meu-chat-whatsapp.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=meu_token_super_secreto_123456
```

## ⚠️ Avisos Importantes

1. **NUNCA** compartilhe seu arquivo `.env.local`
2. **NUNCA** faça commit do `.env.local` no Git (já está no .gitignore)
3. O **Access Token** temporário expira em 24 horas
4. Para produção, gere um token permanente no Meta for Developers

## 🔄 Próximos Passos

Depois de configurar o `.env.local`:

```bash
# 1. Verificar configuração
npm run check-env

# 2. Instalar dependências (se ainda não fez)
npm install

# 3. Executar em modo desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 🆘 Problemas Comuns

### "Firebase: Error (auth/invalid-api-key)"
✅ Verifique se copiou a API Key corretamente do Firebase Console

### "Webhook verification failed"
✅ Certifique-se de que o Verify Token está correto

### "Cannot find module"
✅ Execute `npm install` novamente

### Variáveis não carregam
✅ Reinicie o servidor: Ctrl+C e depois `npm run dev`

## 📚 Mais Ajuda

- Veja [SETUP.md](SETUP.md) para instruções detalhadas
- Veja [QUICKSTART.md](QUICKSTART.md) para guia rápido
- Execute `npm run check-env` para diagnóstico

---

**Dica**: Use um gerenciador de senhas para guardar suas credenciais com segurança! 🔐
