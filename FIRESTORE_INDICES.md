# 🔍 Guia de Índices do Firestore

## O que são Índices?

Índices são estruturas que tornam as queries do Firestore muito mais rápidas. Sem eles, o Firestore teria que ler TODOS os documentos para encontrar o que você quer.

## Por que preciso criar índices?

Quando você faz queries complexas (como buscar + ordenar ao mesmo tempo), o Firestore precisa de índices compostos.

## 🚨 Erro Comum

```
The query requires an index. You can create it here: https://...
```

**Isso é NORMAL!** Não é um erro de código, é só o Firestore pedindo para você criar um índice.

---

## 📋 Índices Necessários para Este Projeto

### 1. Índice para Chats (OBRIGATÓRIO)

**Coleção**: `chats`

**Campos**:

- `participants` (Array-contains)
- `lastMessageTimestamp` (Descending)

**Como criar**:

1. Quando ver o erro no console, copie o link que aparece
2. Cole no navegador
3. O Firebase abrirá com o índice já configurado
4. Clique em "Create Index"
5. Aguarde 2-5 minutos

**Link direto para seu projeto**:

```
https://console.firebase.google.com/project/flutter-c7071/firestore/indexes
```

---

### 2. Índice para Messages (OPCIONAL)

**Coleção**: `messages`

**Campos**:

- `chatId` (Ascending)
- `timestamp` (Ascending)

**Como criar**:

1. Acesse: https://console.firebase.google.com/project/flutter-c7071/firestore/indexes
2. Clique em "Create Index"
3. Preencha:
   - Collection: `messages`
   - Field: `chatId` - Ascending
   - Field: `timestamp` - Ascending
4. Clique em "Create"

---

## 🎯 Como Criar Índices (Passo a Passo)

### Método 1: Usar o Link do Erro (MAIS FÁCIL)

1. Rode sua aplicação: `npm run dev`
2. Abra o console do navegador (F12)
3. Quando aparecer o erro de índice, você verá um link
4. **Copie o link completo**
5. Cole no navegador
6. Clique em "Create Index"
7. Aguarde a criação

### Método 2: Criar Manualmente

1. Acesse o Firebase Console

   ```
   https://console.firebase.google.com/project/flutter-c7071/firestore/indexes
   ```

2. Clique em **"Create Index"** ou **"Criar índice"**

3. Preencha os campos:

   - **Collection ID**: `chats`
   - Clique em "Add field"
   - **Field 1**: `participants` - **Array-contains**
   - Clique em "Add field"
   - **Field 2**: `lastMessageTimestamp` - **Descending**

4. Clique em **"Create"**

5. Aguarde a criação (status mudará de "Building" para "Enabled")

---

## ⏱️ Quanto tempo leva?

- **Banco vazio**: 2-5 minutos
- **Com poucos documentos**: 5-10 minutos
- **Com muitos documentos**: 10-30 minutos

Você pode ver o progresso na página de índices.

---

## 🔍 Como Verificar se o Índice Está Pronto

1. Vá em: https://console.firebase.google.com/project/flutter-c7071/firestore/indexes

2. Procure pelo índice `chats`

3. Status:
   - 🟡 **Building** (Construindo) - Aguarde
   - 🟢 **Enabled** (Ativado) - Pronto para usar!
   - 🔴 **Error** - Algo deu errado, tente criar novamente

---

## 📊 Índices Recomendados para Produção

Para otimizar sua aplicação, crie estes índices:

### ✅ Obrigatórios (a aplicação precisa)

1. **chats** (participants + lastMessageTimestamp)
2. **messages** (chatId + timestamp)

### 💡 Opcionais (melhoram performance)

3. **users** (phoneNumber)
4. **messages** (senderId + timestamp)
5. **chats** (participants + createdAt)

---

## 🐛 Troubleshooting

### Erro persiste depois de criar o índice

**Solução**:

1. Aguarde 5 minutos
2. Limpe o cache do navegador (Ctrl+Shift+Del)
3. Recarregue a página (Ctrl+F5)
4. Verifique se o índice está "Enabled" no console

### Índice fica em "Building" por muito tempo

**Solução**:

1. Aguarde até 30 minutos
2. Se ainda estiver building, tente deletar e criar novamente
3. Verifique se você tem quota disponível no Firebase

### Link do erro não funciona

**Solução**:

1. Use o Método 2 (criar manualmente)
2. Copie os campos exatos do erro
3. Crie manualmente no Firebase Console

---

## 📝 Arquivo firestore.indexes.json

O arquivo `firestore.indexes.json` na raiz do projeto contém a **definição** dos índices.

**⚠️ IMPORTANTE**: Este arquivo é apenas para referência e deploy via CLI. Ele NÃO cria os índices automaticamente.

Para criar índices, você DEVE:

1. Usar o link do erro, OU
2. Criar manualmente no Firebase Console, OU
3. Fazer deploy via Firebase CLI: `firebase deploy --only firestore:indexes`

---

## 🚀 Deploy de Índices via CLI (Avançado)

Se você usa Firebase CLI:

```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init firestore

# Deploy dos índices
firebase deploy --only firestore:indexes
```

Isso criará automaticamente todos os índices definidos em `firestore.indexes.json`.

---

## 📚 Documentação Oficial

- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/index-overview#composite_indexes)

---

## ✅ Checklist

Marque conforme você cria os índices:

- [ ] Índice criado para `chats` (participants + lastMessageTimestamp)
- [ ] Índice criado para `messages` (chatId + timestamp)
- [ ] Aguardei a criação (status = Enabled)
- [ ] Recarreguei a aplicação
- [ ] Erro de índice não aparece mais

---

**Dica**: Sempre que você adicionar novas queries complexas no futuro, o Firestore vai pedir novos índices. É só seguir o mesmo processo! 🎯

