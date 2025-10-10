# 🏗️ Nova Arquitetura do Sistema

## 📋 Visão Geral

O sistema agora está separado em duas partes principais:

- **MongoDB**: Dados administrativos (usuários, empresas, permissões)
- **Firebase**: Autenticação e conversas (chats, mensagens)

## 🗄️ Estrutura de Dados

### **MongoDB** (Dados Administrativos)

```
📦 Collections:
├── users (usuários do sistema)
│   ├── _id, firebaseAuthUid, email, name
│   ├── role: 'admin' | 'attendant'
│   ├── companyId, isActive
│   └── createdAt, updatedAt
├── companies (empresas)
│   ├── _id, name, settings
│   ├── adminUsers[], attendantUsers[]
│   └── businessHours, features
└── whatsapp_configs, ai_configs (configurações)
```

### **Firebase** (Autenticação e Conversas)

```
📦 Collections:
├── auth (Firebase Authentication)
├── conversations (conversas do chat)
├── messages (mensagens)
└── media (arquivos/mídia)
```

## 🔧 Como Funciona

### **1. Autenticação**

- Usuário faz login via Firebase Auth
- Sistema verifica se usuário existe no MongoDB
- Se não existir, cria automaticamente (primeiro usuário = admin)
- Retorna dados do usuário + permissões

### **2. Permissões**

- **Admin**: Acesso total ao sistema
- **Attendant**: Acesso limitado às conversas
- Validação em tempo real

### **3. Dados**

- **Usuários/empresas**: MongoDB
- **Conversas/mensagens**: Firebase
- **Autenticação**: Firebase Auth

## 🚀 Início Rápido

1. **Configure as variáveis de ambiente**:

   ```bash
   MONGODB_URI=your_mongodb_uri
   MONGODB_DB=your_database_name
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project
   ```

2. **Execute o sistema**:

   ```bash
   npm run dev
   ```

3. **Faça login**: O primeiro usuário será automaticamente criado como admin

## 📁 Arquivos Principais

- `lib/mongodb-users.ts` - Gerenciamento de usuários
- `lib/auth-service.ts` - Serviço de autenticação
- `contexts/AuthContext.tsx` - Contexto de autenticação
- `hooks/useAuth.ts` - Hook de autenticação
- `app/api/admin/users/route.ts` - API de usuários

## ✅ Benefícios

1. **Separação clara** entre dados administrativos e conversas
2. **Sistema de permissões robusto**
3. **Criação automática** de usuários
4. **Escalabilidade** para múltiplas empresas
5. **Manutenibilidade** do código

---

**Status**: ✅ Implementado e funcionando  
**Versão**: 1.0.0
