# 🔧 Solução de Problemas - Webhook WhatsApp

## ❌ **Erro: "Não foi possível validar a URL de callback ou o token de verificação"**

Este erro indica que o WhatsApp não consegue validar o webhook. Vamos resolver passo a passo:

## 🔍 **Diagnóstico**

### **1. Verificar Variáveis de Ambiente**

```bash
# Verificar se as variáveis estão configuradas
echo $WHATSAPP_VERIFY_TOKEN
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID
```

### **2. Testar Webhook Localmente**

1. Acesse `/webhook-debug` no seu sistema
2. Clique em "Testar Webhook"
3. Verifique os logs no console

### **3. Verificar Logs do Servidor**

```bash
# Em desenvolvimento
npm run dev

# Verificar logs em tempo real
tail -f logs/webhook.log
```

## 🛠️ **Soluções**

### **Solução 1: Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
WHATSAPP_VERIFY_TOKEN=seu-token-aqui
WHATSAPP_ACCESS_TOKEN=seu-access-token-aqui
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id-aqui
```

**⚠️ Importante:** Reinicie o servidor após configurar as variáveis!

### **Solução 2: Verificar URL do Webhook**

1. **URL correta:** `https://seu-dominio.com/api/webhook`
2. **Método:** GET (para verificação)
3. **Parâmetros necessários:**
   - `hub.mode=subscribe`
   - `hub.verify_token=SEU_VERIFY_TOKEN`
   - `hub.challenge=CHALLENGE_CODE`

### **Solução 3: Testar Manualmente**

```bash
# Teste local
curl "http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test"

# Teste em produção
curl "https://seu-dominio.com/api/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=test"
```

### **Solução 4: Verificar HTTPS**

O WhatsApp **exige HTTPS** em produção. Certifique-se de que:

1. ✅ Seu domínio tem certificado SSL válido
2. ✅ A URL começa com `https://`
3. ✅ O certificado não está expirado

## 🔧 **Ferramentas de Debug**

### **1. Página de Debug**

- **URL:** `/webhook-debug`
- **Funcionalidade:** Testa o webhook localmente
- **Logs:** Mostra detalhes da verificação

### **2. Logs Melhorados**

O webhook agora tem logs detalhados:

```
=== WEBHOOK VERIFICATION DEBUG ===
Mode: subscribe
Token received: abc123
Token expected: abc123
Challenge: test-challenge
URL: https://seu-dominio.com/api/webhook
================================
```

### **3. Verificação de Status**

- ✅ **Token configurado:** Verifica se `WHATSAPP_VERIFY_TOKEN` existe
- ✅ **Modo correto:** Verifica se `hub.mode=subscribe`
- ✅ **Token match:** Compara tokens
- ✅ **Challenge:** Verifica se challenge foi fornecido

## 📋 **Checklist de Verificação**

### **Antes de Configurar no WhatsApp:**

- [ ] ✅ Servidor está online
- [ ] ✅ URL é acessível via HTTPS
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Webhook responde corretamente
- [ ] ✅ Logs mostram verificação bem-sucedida

### **No WhatsApp Business API:**

- [ ] ✅ URL: `https://seu-dominio.com/api/webhook`
- [ ] ✅ Verify Token: mesmo valor da variável `WHATSAPP_VERIFY_TOKEN`
- [ ] ✅ Método: GET (para verificação)
- [ ] ✅ Salvar configurações

## 🚨 **Problemas Comuns**

### **1. "Token mismatch"**

- **Causa:** Verify token não confere
- **Solução:** Verificar se `WHATSAPP_VERIFY_TOKEN` está correto

### **2. "Invalid mode"**

- **Causa:** Parâmetro `hub.mode` não é `subscribe`
- **Solução:** WhatsApp deve enviar `hub.mode=subscribe`

### **3. "No challenge"**

- **Causa:** Parâmetro `hub.challenge` não foi fornecido
- **Solução:** WhatsApp deve fornecer o challenge

### **4. "Verify token not configured"**

- **Causa:** Variável `WHATSAPP_VERIFY_TOKEN` não está definida
- **Solução:** Configurar a variável de ambiente

### **5. "URL inacessível"**

- **Causa:** Servidor offline ou URL incorreta
- **Solução:** Verificar se o servidor está online e acessível

## 🔄 **Processo de Configuração**

### **1. Configurar Variáveis**

```bash
# .env.local
WHATSAPP_VERIFY_TOKEN=meu-token-secreto-123
```

### **2. Reiniciar Servidor**

```bash
npm run dev
```

### **3. Testar Webhook**

- Acesse `/webhook-debug`
- Clique em "Testar Webhook"
- Verifique se retorna status 200

### **4. Configurar no WhatsApp**

- URL: `https://seu-dominio.com/api/webhook`
- Verify Token: `meu-token-secreto-123`
- Salvar

### **5. Verificar Logs**

```bash
# Verificar logs do servidor
# Deve aparecer: "✅ Webhook verified successfully"
```

## 📞 **Suporte**

Se ainda tiver problemas:

1. **Verifique os logs** do servidor
2. **Use a ferramenta de debug** em `/webhook-debug`
3. **Teste manualmente** com curl
4. **Verifique as variáveis** de ambiente
5. **Confirme que o servidor** está online

---

**Última atualização**: $(date)  
**Status**: ✅ Funcionando com debug melhorado
