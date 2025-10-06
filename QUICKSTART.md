# 🚀 Início Rápido

Quer começar rapidamente? Siga estes passos!

## 1️⃣ Clonar e Instalar (2 minutos)

```bash
git clone seu-repositorio
cd chat
npm install
```

## 2️⃣ Configurar Firebase (5 minutos)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto
3. Ative:
   - **Authentication** (Email/Password e Google)
   - **Firestore Database**
   - **Storage**
4. Copie as credenciais

## 3️⃣ Configurar WhatsApp (5 minutos)

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um app
3. Adicione produto WhatsApp
4. Obtenha:
   - Phone Number ID
   - Access Token

## 4️⃣ Configurar .env.local (2 minutos)

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais.

## 5️⃣ Executar (1 minuto)

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## ✅ Pronto!

Você agora tem:

- ✅ Aplicação rodando localmente
- ✅ Autenticação funcionando
- ✅ Firebase configurado

## 📝 Próximos Passos

1. **Testar localmente:**

   - Crie uma conta
   - Navegue pela interface

2. **Configurar Webhook (opcional para dev):**

   - Use [ngrok](https://ngrok.com) para expor localhost
   - Configure webhook no Meta for Developers

3. **Deploy (quando pronto):**
   - Siga o guia em [DEPLOYMENT.md](DEPLOYMENT.md)

## 🆘 Problemas?

- **Erro de build?** → Verifique versão do Node.js (18+)
- **Firebase não conecta?** → Verifique credenciais no `.env.local`
- **Mais ajuda?** → Veja [SETUP.md](SETUP.md) para guia detalhado

## 📚 Documentação

- [README.md](README.md) - Visão geral completa
- [SETUP.md](SETUP.md) - Configuração detalhada passo a passo
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guias de deploy
- [CONTRIBUTING.md](CONTRIBUTING.md) - Como contribuir

---

Bom desenvolvimento! 🎉

