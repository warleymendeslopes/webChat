# ➕ Cadastro Manual de Leads

## ✅ IMPLEMENTADO

Sistema completo para cadastrar leads manualmente, com todos os campos personalizados que você pediu!

---

## 🎯 ONDE CADASTRAR

### **Página de Leads:**

```
Menu → [Leads] → Botão [➕ Novo Lead]
```

**URL:** `/leads`

---

## 📝 CAMPOS DO FORMULÁRIO

### **1. Dados Básicos (Obrigatórios)**

#### **Nome Completo** ⭐

```
Ex: Maria Silva Santos
```

#### **Telefone (WhatsApp)** ⭐

```
Formatos aceitos:
- +55 31 98765-4321
- 5531987654321
- (31) 98765-4321
- 31987654321
```

**Validação automática:**

- Remove caracteres especiais
- Aceita 10-15 dígitos
- Salva apenas números

---

### **2. Contato (Opcional)**

#### **Email**

```
Ex: maria@email.com
```

---

### **3. Informações do Produto/Interesse** 🎯

#### **Produto/Serviço de Interesse**

```
Ex:
- Plano Premium Mensal
- Consultoria Empresarial
- Produto X - Modelo Y
- Pacote de Serviços
```

**Salvo em:** `customFields.productInterest`

#### **Valor Estimado (R$)**

```
Ex: 5000,00
```

**Validação:**

- Aceita apenas números e vírgula
- Converte para float
- Salvo em: `customFields.estimatedValue`

---

### **4. Tags (Classificação)**

**Tags Sugeridas (clique para ativar):**

- ⭐ VIP
- 🔥 Hot Lead
- ⏰ Urgente
- 💎 Premium
- 📞 Retornar
- 🎯 Prospecção

**Personalizável:**
Você pode adicionar mais tags diretamente no código!

---

### **5. Origem do Lead**

Selecione de onde veio:

- 📝 **Cadastro Manual** (padrão)
- 🌐 **Site/Formulário Web**
- 💬 **WhatsApp**
- 📊 **Importação**

---

### **6. Observações/Notas**

Campo livre para anotações:

```
Ex:
- Cliente indicado pelo João
- Interessado em pacote anual
- Orçamento de até R$ 10k
- Quer começar em Janeiro
```

---

## 💾 DADOS SALVOS NO MONGODB

```typescript
{
  // Básico
  name: "Maria Silva Santos",
  phoneNumber: "5531987654321",
  email: "maria@email.com",

  // Classificação
  status: "new",
  stage: "lead",
  tags: ["VIP", "Hot Lead"],

  // Origem
  source: "manual",

  // Metadata/Produto
  customFields: {
    productInterest: "Plano Premium Mensal",
    estimatedValue: 5000
  },

  // Notas
  notes: "Cliente indicado pelo João. Quer começar em Janeiro.",

  // Tracking
  firstContactAt: "2025-10-26T10:00:00Z",
  lastContactAt: "2025-10-26T10:00:00Z",
  totalMessages: 0,
  hasWhatsApp: false, // False para manual (ainda não conversou)

  // Sistema
  companyId: "...",
  isActive: true,
  isFavorite: false,
  createdAt: "2025-10-26T10:00:00Z",
}
```

---

## 🔄 FLUXO COMPLETO

### **Cadastro:**

```
1. Acesse /leads
2. Clique [➕ Novo Lead]
3. Preencha formulário:
   ├─ Nome: Maria Silva ✓
   ├─ Email: maria@email.com ✓
   ├─ Telefone: +55 31 98765-4321 ✓
   ├─ Produto: Plano Premium ✓
   ├─ Valor: 5000 ✓
   ├─ Tags: VIP, Hot Lead ✓
   ├─ Origem: Manual ✓
   └─ Notas: Cliente indicado... ✓
4. Clique [➕ Cadastrar Lead]
5. ✅ Lead criado com sucesso!
```

### **Após Cadastrar:**

**O lead aparece:**

- ✅ Na lista de leads (`/leads`)
- ✅ Com status "🆕 Novo"
- ✅ Pode ser filtrado
- ✅ Pode ser atualizado

### **Quando Cliente Mandar Mensagem:**

```
1. Cliente manda WhatsApp (mesmo número)
2. Sistema identifica lead existente
3. Vincula ao chat automaticamente
4. Atualiza hasWhatsApp: true
5. Começa rastreamento de interações
```

---

## 🎨 INTERFACE DO MODAL

```
┌─────────────────────────────────────────────┐
│ ➕ Cadastrar Novo Lead              [X]    │
├─────────────────────────────────────────────┤
│                                             │
│ 📋 DADOS BÁSICOS                            │
│ Nome Completo: [________________] *         │
│ Email:         [________________]           │
│ Telefone:      [________________] *         │
│                                             │
│ 🎯 INFORMAÇÕES DO PRODUTO/INTERESSE         │
│ Produto:       [________________]           │
│ Valor (R$):    [________________]           │
│                                             │
│ 🏷️ TAGS                                     │
│ [✓ VIP] [  Hot Lead] [✓ Urgente]          │
│ [  Premium] [  Retornar] [  Prospecção]    │
│                                             │
│ 📍 ORIGEM                                   │
│ [ Cadastro Manual ▼ ]                      │
│                                             │
│ 📝 OBSERVAÇÕES                              │
│ [_____________________________]            │
│ [_____________________________]            │
│                                             │
│         [Cancelar] [➕ Cadastrar Lead]     │
└─────────────────────────────────────────────┘
```

---

## 📊 CAMPOS CUSTOMFIELDS (METADATA)

### **Estrutura:**

```typescript
customFields: {
  productInterest: string,     // Produto de interesse
  estimatedValue: number,       // Valor estimado
  // Você pode adicionar mais campos:
  industry?: string,            // Setor/Indústria
  companySize?: string,         // Tamanho da empresa
  urgency?: 'low' | 'medium' | 'high',
  source_details?: string,      // Detalhes da origem
  referredBy?: string,          // Indicado por quem
  // ...qualquer outro campo!
}
```

### **Como Adicionar Mais Campos:**

No componente `NewLeadModal.tsx`, adicione:

```typescript
// No formData
const [formData, setFormData] = useState({
  // ... campos existentes
  industry: "", // 🆕 NOVO
  companySize: "", // 🆕 NOVO
});

// No formulário (JSX)
<div>
  <label>Setor/Indústria</label>
  <input
    value={formData.industry}
    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
  />
</div>;

// No handleSubmit
customFields.industry = formData.industry;
customFields.companySize = formData.companySize;
```

---

## 💡 CASOS DE USO

### **Caso 1: Prospecção Ativa**

```
Você ligou para um cliente potencial:
1. Cadastra manualmente
2. Produto: "Consultoria"
3. Tags: "Prospecção", "Retornar"
4. Notas: "Ligou dia 26/10, retornar dia 30/10"
5. Aguarda cliente entrar em contato via WhatsApp
6. Quando mandar msg, sistema vincula automaticamente
```

### **Caso 2: Indicação**

```
Cliente João indicou Maria:
1. Cadastra Maria manualmente
2. Produto: "Mesmo do João"
3. Tags: "VIP", "Indicação"
4. Notas: "Indicada pelo João (cliente #123)"
5. Valor estimado: 5000
```

### **Caso 3: Evento/Feira**

```
Coletou contatos em feira:
1. Cadastra cada um manualmente
2. Origem: "Manual"
3. Tags: "Feira 2025", "Hot Lead"
4. Produto: Nome do produto demonstrado
5. Importa vários leads
```

---

## 🚀 FLUXO APÓS CADASTRO

### **Lead Manual → Cliente Manda WhatsApp:**

```
1. Lead cadastrado manualmente
   - phoneNumber: 5531987654321
   - hasWhatsApp: false
   - status: "new"
   ↓
2. Cliente manda WhatsApp (mesmo número)
   ↓
3. Sistema identifica:
   - Já existe lead com esse número
   - Vincula ao chatId
   - Atualiza hasWhatsApp: true
   ↓
4. Histórico e dados preservados!
   - Tags mantidas
   - Notas mantidas
   - Produto de interesse disponível
   ↓
5. Atendente vê tudo no chat:
   - Status atual
   - Tags
   - Produto de interesse
   - Valor estimado
```

---

## 📊 VISUALIZAÇÃO DOS CUSTOM FIELDS

### **No Card do Lead (`/leads`):**

```typescript
// Futuro: Pode exibir customFields
{
  lead.customFields?.productInterest && (
    <p className="text-xs text-gray-600">
      🎯 Interesse: {lead.customFields.productInterest}
    </p>
  );
}

{
  lead.customFields?.estimatedValue && (
    <p className="text-xs text-purple-600">
      💰 Est: R$ {lead.customFields.estimatedValue}
    </p>
  );
}
```

---

## ✅ VALIDAÇÕES IMPLEMENTADAS

### **Nome:**

- ✅ Obrigatório
- ✅ Trim (remove espaços extras)

### **Telefone:**

- ✅ Obrigatório
- ✅ Remove formatação (só números)
- ✅ Valida comprimento (10-15 dígitos)
- ✅ Formato E.164

### **Email:**

- ✅ Opcional
- ✅ Validação de formato (HTML5)

### **Valor:**

- ✅ Opcional
- ✅ Aceita apenas números e vírgula
- ✅ Converte para float

---

## 🎯 DIFERENÇA: MANUAL vs AUTOMÁTICO

| Característica      | Lead Manual | Lead Automático (WhatsApp) |
| ------------------- | ----------- | -------------------------- |
| **Criação**         | Formulário  | Primeira mensagem          |
| **hasWhatsApp**     | `false`     | `true`                     |
| **chatId**          | Vazio       | Preenchido                 |
| **firestoreUserId** | Vazio       | Preenchido                 |
| **totalMessages**   | 0           | 1+                         |
| **customFields**    | Preenchido  | Vazio                      |

**Quando cliente mandar WhatsApp:**

- Leads são mesclados automaticamente!
- Dados manuais preservados
- Chat vinculado

---

## 📱 EXEMPLO COMPLETO

### **Formulário Preenchido:**

```
Nome Completo: Maria Silva Santos
Email: maria.silva@empresa.com
Telefone: +55 31 98765-4321

Produto de Interesse: Plano Premium Anual
Valor Estimado: 12000,00

Tags: [✓ VIP] [✓ Hot Lead] [✓ Premium]

Origem: [Cadastro Manual ▼]

Observações:
Cliente indicada pelo João.
Já conhece nossos produtos.
Quer fechar até fim do mês.
Orçamento aprovado de até R$ 15k.
```

### **Lead Criado (MongoDB):**

```json
{
  "_id": "...",
  "companyId": "...",
  "name": "Maria Silva Santos",
  "phoneNumber": "5531987654321",
  "email": "maria.silva@empresa.com",
  "status": "new",
  "stage": "lead",
  "tags": ["VIP", "Hot Lead", "Premium"],
  "source": "manual",
  "customFields": {
    "productInterest": "Plano Premium Anual",
    "estimatedValue": 12000
  },
  "notes": "Cliente indicada pelo João. Já conhece nossos produtos...",
  "firstContactAt": "2025-10-26T14:30:00Z",
  "hasWhatsApp": false,
  "isActive": true,
  "isFavorite": false
}
```

---

## 🔄 INTEGRAÇÃO COM WHATSAPP

### **Quando Maria mandar WhatsApp:**

```
1. Sistema recebe mensagem de 5531987654321
2. Busca lead existente por phoneNumber
3. ENCONTRA o lead manual!
4. Atualiza:
   - hasWhatsApp: true
   - chatId: [id do chat criado]
   - firestoreUserId: [id do user]
   - totalMessages: 1
5. Mantém:
   - customFields (produto)
   - tags (VIP, Hot Lead)
   - notes (indicação do João)
```

**Resultado:**

- ✅ Histórico preservado
- ✅ Dados enriquecidos
- ✅ Contexto completo para atendimento

---

## 💡 MELHORIAS FUTURAS (OPCIONAL)

### **1. Importação em Massa**

```typescript
// Upload de CSV/Excel
// Colunas: Nome, Telefone, Email, Produto, Valor, Tags

Exemplo CSV:
```

```csv
nome,telefone,email,produto,valor,tags
Maria Silva,5531987654321,maria@email.com,Plano Premium,5000,"VIP,Urgente"
João Santos,5511999887766,joao@email.com,Consultoria,3000,"Hot Lead"
```

### **2. Campos Personalizáveis**

Criar configuração por empresa:

```typescript
// MongoDB: leadFieldsConfig
{
  companyId: "...",
  customFields: [
    { name: "productInterest", label: "Produto", type: "text" },
    { name: "estimatedValue", label: "Valor", type: "number" },
    { name: "industry", label: "Setor", type: "select", options: [...] },
    { name: "urgency", label: "Urgência", type: "radio", options: [...] }
  ]
}
```

### **3. Validação de Duplicatas**

Antes de cadastrar, verificar se já existe:

```typescript
// Buscar por telefone
const existing = await getLeadByPhone(phoneNumber, companyId);

if (existing) {
  confirm("⚠️ Já existe lead com este telefone. Atualizar?");
  // Se sim, atualizar ao invés de criar
}
```

---

## 🎯 QUANDO USAR CADASTRO MANUAL

### ✅ **Bom para:**

- Prospecção ativa (ligações, visitas)
- Indicações de clientes
- Leads de eventos/feiras
- Contatos de networking
- Importação de base existente
- Enriquecer dados antes do contato

### ⚠️ **Não precisa para:**

- Clientes que já mandaram WhatsApp (cria automático)
- Chats ativos (já tem lead)

---

## 📊 ESTATÍSTICAS

### **Origem dos Leads:**

```
Dashboard pode mostrar:
- 📝 Manuais: 15
- 💬 WhatsApp: 85
- 🌐 Web: 10
- 📊 Import: 5
```

### **Conversão por Origem:**

```
- WhatsApp: 20% (mais quente)
- Manual: 15% (depende da prospecção)
- Web: 10% (mais frio)
```

---

## ✅ SISTEMA COMPLETO!

**O que você pode fazer:**

1. ✅ **Cadastrar leads manualmente**

   - Nome, email, telefone
   - Produto de interesse
   - Valor estimado
   - Tags personalizadas
   - Notas

2. ✅ **Cliente manda WhatsApp depois**

   - Sistema vincula automaticamente
   - Dados preservados
   - Histórico unificado

3. ✅ **Atendente vê tudo no chat**
   - Ações rápidas
   - Status e tags
   - Produto de interesse
   - Contexto completo

---

**Sistema CRM Multi-Atendente + Cadastro Manual Completo! 🎉**

**Pronto para cadastrar seus primeiros leads!** 💼
