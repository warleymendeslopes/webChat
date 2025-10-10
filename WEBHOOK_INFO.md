# 🔗 Informações do Webhook WhatsApp

## 📍 **URL do Webhook**

```
https://seu-dominio.com/api/webhook
```

## ⚙️ **Configuração no WhatsApp Business API**

### **1. URL do Webhook**

- **URL**: `https://seu-dominio.com/api/webhook`
- **Método**: POST
- **Content-Type**: application/json

### **2. Verificação do Webhook**

- **Método**: GET
- **Parâmetros**:
  - `hub.mode=subscribe`
  - `hub.verify_token=SEU_VERIFY_TOKEN`
  - `hub.challenge=CHALLENGE_CODE`

### **3. Variáveis de Ambiente Necessárias**

```bash
WHATSAPP_VERIFY_TOKEN=seu-verify-token-aqui
WHATSAPP_ACCESS_TOKEN=seu-access-token-aqui
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id-aqui
```

## 🔧 **Como Configurar**

### **1. No WhatsApp Business API**

1. Acesse o [Facebook Developers](https://developers.facebook.com/)
2. Vá para seu app do WhatsApp Business
3. Em "Webhooks", clique em "Configure"
4. Cole a URL: `https://seu-dominio.com/api/webhook`
5. Configure o Verify Token (use o mesmo valor da variável `WHATSAPP_VERIFY_TOKEN`)
6. Salve as configurações

### **2. Teste o Webhook**

1. Envie uma mensagem para o número do WhatsApp Business
2. Verifique se a mensagem aparece no chat
3. Verifique os logs do servidor para confirmar recebimento

## 📱 **Interface do Usuário**

### **Acesso à Página**

- **URL**: `/webhook-info`
- **Acesso**: Apenas para usuários admin
- **Funcionalidades**:
  - Exibe a URL do webhook
  - Botão para copiar a URL
  - Instruções de configuração
  - Status do webhook

### **Menu de Navegação**

- No header do chat, usuários admin veem um botão "Webhook"
- Clique no botão para acessar as informações
- Interface responsiva e intuitiva

## 🚀 **Funcionalidades do Webhook**

### **Recebimento de Mensagens**

- ✅ Recebe mensagens do WhatsApp
- ✅ Salva no Firebase Firestore
- ✅ Cria usuários automaticamente
- ✅ Cria conversas automaticamente
- ✅ Incrementa contador de não lidas

### **Resposta Automática (AI)**

- ✅ Verifica se AI está habilitada
- ✅ Gera resposta automática
- ✅ Envia resposta via WhatsApp API
- ✅ Salva log da resposta

### **Processamento**

- ✅ Validação de dados
- ✅ Normalização de números de telefone
- ✅ Tratamento de erros
- ✅ Logs detalhados

## 🔍 **Monitoramento**

### **Logs do Servidor**

```bash
# Verificar logs em tempo real
npm run dev

# Verificar logs de produção
pm2 logs
```

### **Verificação de Status**

- ✅ Webhook configurado
- ✅ Mensagens sendo recebidas
- ✅ Respostas sendo enviadas
- ✅ Dados sendo salvos

## 🛠️ **Troubleshooting**

### **Problemas Comuns**

1. **Webhook não recebe mensagens**

   - Verificar se a URL está correta
   - Verificar se o Verify Token está correto
   - Verificar se o servidor está online

2. **Erro 403 Forbidden**

   - Verificar se o Verify Token está configurado
   - Verificar se as variáveis de ambiente estão corretas

3. **Mensagens não aparecem no chat**
   - Verificar se o Firebase está configurado
   - Verificar se as permissões estão corretas
   - Verificar os logs do servidor

### **Comandos de Debug**

```bash
# Verificar variáveis de ambiente
echo $WHATSAPP_VERIFY_TOKEN
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID

# Testar webhook localmente
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

## 📊 **Status do Sistema**

- ✅ **Webhook**: Configurado e funcionando
- ✅ **Firebase**: Conectado e funcionando
- ✅ **MongoDB**: Conectado e funcionando
- ✅ **Autenticação**: Funcionando
- ✅ **Interface**: Responsiva e intuitiva

---

**Última atualização**: $(date)  
**Versão**: 1.0.0  
**Status**: ✅ Funcionando
