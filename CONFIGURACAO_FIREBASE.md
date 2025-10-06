# ⚠️ IMPORTANTE: Tipo de Credenciais do Firebase

## 🔴 O que você compartilhou (Service Account)

Você compartilhou credenciais de **Service Account (Admin SDK)**:
- ❌ NÃO use em aplicações web client-side
- ❌ NÃO exponha publicamente
- ❌ Essas chaves têm acesso TOTAL ao seu Firebase
- ✅ Use apenas em servidores backend seguros

## ✅ O que você precisa (Web SDK)

Para este projeto Next.js, você precisa das credenciais **Web SDK**:
- ✅ Seguras para usar no navegador
- ✅ Têm permissões limitadas
- ✅ Começam com `NEXT_PUBLIC_*`

---

## 📝 Como obter as credenciais corretas

### Passo 1: Acesse o Firebase Console

1. Vá em: https://console.firebase.google.com
2. Selecione seu projeto: **flutter-c7071**

### Passo 2: Configure um Web App

1. Clique no ícone de **engrenagem ⚙️** (Configurações do projeto)
2. Role até **"Seus apps"**
3. Procure por um app Web (ícone `</>`)
   - Se não tiver, clique no ícone `</>` para criar

### Passo 3: Copie as credenciais Web

Você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",              // Esta é a chave correta!
  authDomain: "flutter-c7071.firebaseapp.com",
  projectId: "flutter-c7071",       // ✅ Já temos este
  storageBucket: "flutter-c7071.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:..."
};
```

### Passo 4: Adicione no .env.local

Use essas credenciais no seu `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flutter-c7071.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flutter-c7071
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flutter-c7071.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

---

## 🔒 Segurança

### ⚠️ Credenciais que você compartilhou

As credenciais de Service Account que você mostrou:
- Contêm uma `private_key` (chave privada)
- Têm acesso completo ao Firebase
- **DEVEM** ser mantidas em segredo
- **NUNCA** devem ir para o Git ou código client-side

### ✅ Ações recomendadas

1. **URGENTE**: Revogue a Service Account que você expôs
   - Firebase Console → Configurações → Contas de serviço
   - Delete ou regenere a chave

2. Use apenas credenciais Web SDK no .env.local

3. Mantenha credenciais de Service Account apenas em:
   - Servidores backend seguros
   - Variáveis de ambiente do servidor
   - Nunca no código fonte

---

## 🚀 Comando Rápido

Execute este comando para criar seu .env.local:

```bash
cat > .env.local << 'ENVFILE'
# ========================================
# FIREBASE WEB SDK CONFIGURATION
# ========================================
# Obtenha em: https://console.firebase.google.com
# Projeto: flutter-c7071
# Vá em: ⚙️ > Seus apps > Web App

# Substitua os valores abaixo pelas suas credenciais WEB
NEXT_PUBLIC_FIREBASE_API_KEY=cole_sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flutter-c7071.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flutter-c7071
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flutter-c7071.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=cole_seu_sender_id_aqui
NEXT_PUBLIC_FIREBASE_APP_ID=cole_seu_app_id_aqui

# ========================================
# WHATSAPP BUSINESS API CONFIGURATION
# ========================================
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
WHATSAPP_ACCESS_TOKEN=seu_access_token
WHATSAPP_VERIFY_TOKEN=crie_uma_senha_segura
ENVFILE
```

---

## 📸 Onde encontrar cada valor

### No Firebase Console (console.firebase.google.com):

1. **API Key**: Configurações → Seus apps → Web → apiKey
2. **Auth Domain**: Sempre será `[projeto].firebaseapp.com`
3. **Project ID**: `flutter-c7071` (já sabemos!)
4. **Storage Bucket**: `[projeto].appspot.com`
5. **Messaging Sender ID**: Configurações → Seus apps → Web
6. **App ID**: Configurações → Seus apps → Web

---

## ✅ Checklist

- [ ] Acessei o Firebase Console
- [ ] Encontrei ou criei um Web App
- [ ] Copiei a apiKey (começa com AIzaSy...)
- [ ] Copiei o messagingSenderId
- [ ] Copiei o appId (formato: 1:...:web:...)
- [ ] Colei tudo no .env.local
- [ ] Executei: npm run check-env
- [ ] Revoquei a Service Account que foi exposta

---

**Precisa de ajuda?** 
- Leia: INSTRUCOES_ENV.md
- Execute: npm run check-env
