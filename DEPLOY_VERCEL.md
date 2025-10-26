# 🚀 Deploy na Vercel - Configuração Final

## ✅ **ALTERAÇÕES PARA COMPATIBILIDADE COM PLANO HOBBY**

### **O que foi removido:**

- ❌ `vercel.json` com cron automático (não compatível com plano gratuito)

### **O que foi adicionado:**

- ✅ **Botão manual de redistribuição** no dashboard de métricas
- ✅ Funcionalidade completa sem dependência de cron

---

## 🎛️ **REDISTRIBUIÇÃO MANUAL**

### **Como usar:**

1. Acesse o painel admin: `/admin`
2. Vá na aba **"Métricas"**
3. No topo da página, clique em **"Redistribuir Chats"**

### **O que o botão faz:**

- ⏰ Marca chats com janela de 24h expirada
- 🔄 Redistribui chats inativos (>24h sem resposta do atendente)
- 🔴 Marca atendentes inativos como offline (>10min sem atividade)

### **Quando executar:**

- Início/fim do dia
- Quando perceber chats "travados"
- Após atendentes saírem sem fazer logout
- Sempre que quiser reorganizar

---

## 📦 **DEPLOY NA VERCEL**

### **Passo 1: Preparar Repositório**

```bash
# Commit as alterações
git add .
git commit -m "Sistema multi-atendente pronto para Vercel Hobby"
git push
```

### **Passo 2: Deploy**

1. Acesse: https://vercel.com/
2. Clique em **"New Project"**
3. Importe seu repositório
4. Configure as **Variáveis de Ambiente:**

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=webChat

# WhatsApp (opcional)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

# Cron Secret (para executar manualmente)
CRON_SECRET=seu_token_secreto
```

5. Clique em **"Deploy"**

### **Passo 3: Configurar WhatsApp Webhook**

Após o deploy:

1. Copie a URL da Vercel: `https://seu-app.vercel.app`
2. No Meta for Developers:
   - WhatsApp → Configuration
   - Webhook URL: `https://seu-app.vercel.app/api/webhook`
   - Verify Token: (mesmo do `.env`)
   - Subscribe: `messages`

---

## 🎯 **FUNCIONALIDADES ATIVAS**

### ✅ **O que funciona SEM cron:**

- ✅ Distribuição automática de novos chats
- ✅ Sistema de janela de 24h
- ✅ Status de atendentes em tempo real
- ✅ Badges de atribuição (Meu/Fila/Outro)
- ✅ Dashboard de métricas
- ✅ Controle manual de redistribuição
- ✅ AI auto-reply (se configurado)
- ✅ Multi-tenant (múltiplas empresas)

### 🟡 **O que fica manual:**

- 🔘 Redistribuição de chats inativos (via botão)
- 🔘 Marcação de atendentes offline (via botão)
- 🔘 Limpeza de chats expirados (via botão)

---

## 💡 **QUANDO FAZER UPGRADE PARA PRO?**

Considere upgrade quando:

- Tiver **5+ atendentes** simultâneos
- Precisar de redistribuição **automática** frequente
- Quiser **garantir** SLA de resposta
- Tiver **alto volume** de chats (>100/dia)

**Custo:** $20/mês + functions usage

---

## 🔧 **MELHORIAS FUTURAS (OPCIONAL)**

Se quiser automatizar sem o cron da Vercel:

### **Opção A: GitHub Actions (Grátis)**

```yaml
# .github/workflows/reassign-chats.yml
name: Reassign Chats
on:
  schedule:
    - cron: "*/30 * * * *"
jobs:
  reassign:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://seu-app.vercel.app/api/cron/reassign-chats \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### **Opção B: Serviço Externo (EasyCron, etc)**

- Configure para chamar seu endpoint a cada 30min
- Grátis até 100 execuções/mês

---

## ✅ **CHECKLIST DE DEPLOY**

- [x] `vercel.json` removido
- [x] Botão manual adicionado no dashboard
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Repository enviado para GitHub
- [ ] Deploy realizado na Vercel
- [ ] Webhook configurado no Meta/WhatsApp
- [ ] Primeiro login testado
- [ ] Sistema multi-atendente testado

---

**Pronto para deploy! 🚀**

**Próximo passo:** Configure as variáveis de ambiente na Vercel e faça o deploy!
