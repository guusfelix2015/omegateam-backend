# 🏰 Lineage 2 Company Party Management API

## 📋 Visão Geral

Sistema completo de gerenciamento de Company Parties (CPs) para Lineage 2 com autenticação JWT e controle de acesso baseado em roles (ADMIN/PLAYER).

## 🚀 Servidor

- **URL Base**: `http://localhost:3000`
- **Documentação Swagger**: `http://localhost:3000/docs` (em desenvolvimento)
- **Health Check**: `http://localhost:3000/health`

## 🔐 Autenticação

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@lineage.com",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Usuários de Teste
- **Admin**: `admin@lineage.com` / `admin123`
- **Player**: `john.doe@example.com` / `user123`

## 👥 Company Parties API

### 📋 Listar Company Parties
```bash
GET /company-parties
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10)

**Resposta:**
```json
{
  "data": [
    {
      "id": "cmfet8zox0003ow1vechy4jh6",
      "name": "Brazilian Storm",
      "createdAt": "2025-09-11T02:49:59.986Z",
      "updatedAt": "2025-09-11T02:49:59.986Z",
      "playerCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 🔍 Buscar Company Party por ID
```bash
GET /company-parties/{id}
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": "cmfet8zox0003ow1vechy4jh6",
  "name": "Brazilian Storm",
  "createdAt": "2025-09-11T02:49:59.986Z",
  "updatedAt": "2025-09-11T02:49:59.986Z",
  "users": [
    {
      "id": "cmfet8zp10007ow1vnrq9ilfc",
      "userId": "cmfet8zoq0001ow1vhu1onbd1",
      "joinedAt": "2025-09-11T02:49:59.990Z",
      "user": {
        "id": "cmfet8zoq0001ow1vhu1onbd1",
        "email": "john.doe@example.com",
        "name": "John Doe",
        "nickname": "JohnDoe",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        "lvl": 45,
        "role": "PLAYER"
      }
    }
  ]
}
```

### ➕ Criar Company Party (ADMIN apenas)
```bash
POST /company-parties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dragon Knights"
}
```

**Resposta:**
```json
{
  "id": "cmfetgs7r00004dcf9j4pbydd",
  "name": "Dragon Knights",
  "createdAt": "2025-09-11T02:56:03.543Z",
  "updatedAt": "2025-09-11T02:56:03.543Z",
  "users": []
}
```

### ✏️ Atualizar Company Party (ADMIN apenas)
```bash
PUT /company-parties/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dragon Knights Elite"
}
```

### 🗑️ Deletar Company Party (ADMIN apenas)
```bash
DELETE /company-parties/{id}
Authorization: Bearer <token>
```

### 👤 Adicionar Player à Company Party (ADMIN apenas)
```bash
POST /company-parties/{id}/players
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "cmfet8zoq0001ow1vhu1onbd1"
}
```

**Resposta:**
```json
{
  "message": "Player added to Company Party successfully"
}
```

### ❌ Remover Player da Company Party (ADMIN apenas)
```bash
DELETE /company-parties/{id}/players/{playerId}
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Player removed from Company Party successfully"
}
```

## 👥 Users API

### 📋 Listar Usuários
```bash
GET /users
Authorization: Bearer <token>
```

### 🔍 Buscar Usuário por ID
```bash
GET /users/{id}
Authorization: Bearer <token>
```

**Resposta (inclui Company Parties do usuário):**
```json
{
  "id": "cmfet8zoq0001ow1vhu1onbd1",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "nickname": "JohnDoe",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  "isActive": true,
  "lvl": 45,
  "role": "PLAYER",
  "createdAt": "2025-09-11T02:49:59.967Z",
  "updatedAt": "2025-09-11T02:49:59.967Z",
  "companyParties": [
    {
      "id": "cmfet8zp10007ow1vnrq9ilfc",
      "companyPartyId": "cmfet8zox0003ow1vechy4jh6",
      "joinedAt": "2025-09-11T02:49:59.990Z",
      "companyParty": {
        "id": "cmfet8zox0003ow1vechy4jh6",
        "name": "Brazilian Storm",
        "createdAt": "2025-09-11T02:49:59.986Z",
        "updatedAt": "2025-09-11T02:49:59.986Z"
      }
    }
  ]
}
```

### ➕ Criar Usuário (ADMIN apenas)
```bash
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newplayer@example.com",
  "name": "New Player",
  "nickname": "NewPlayer",
  "password": "player123",
  "role": "PLAYER",
  "lvl": 1
}
```

### ✏️ Atualizar Usuário (ADMIN apenas)
```bash
PUT /users/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "lvl": 50
}
```

### 🗑️ Deletar Usuário (ADMIN apenas)
```bash
DELETE /users/{id}
Authorization: Bearer <token>
```

## 🔒 Controle de Acesso

### ADMIN (Administradores)
- ✅ Visualizar todas as Company Parties
- ✅ Criar, editar e deletar Company Parties
- ✅ Adicionar/remover players das Company Parties
- ✅ Gerenciar usuários (CRUD completo)

### PLAYER (Jogadores)
- ✅ Visualizar todas as Company Parties
- ✅ Visualizar informações de usuários
- ❌ Criar, editar ou deletar Company Parties
- ❌ Adicionar/remover players das Company Parties
- ❌ Gerenciar outros usuários

## 📊 Estrutura do Banco de Dados

### User
- `id`: String (CUID)
- `email`: String (único)
- `name`: String
- `nickname`: String
- `password`: String (hash)
- `avatar`: String (URL)
- `isActive`: Boolean
- `lvl`: Integer
- `role`: Enum (ADMIN, PLAYER)

### CompanyParty
- `id`: String (CUID)
- `name`: String (único)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### UserCompanyParty (Tabela de Junção)
- `id`: String (CUID)
- `userId`: String (FK)
- `companyPartyId`: String (FK)
- `joinedAt`: DateTime

## 🚨 Códigos de Erro

- `400`: Bad Request - Dados inválidos
- `401`: Unauthorized - Token inválido ou permissões insuficientes
- `404`: Not Found - Recurso não encontrado
- `409`: Conflict - Conflito (ex: nome já existe)
- `500`: Internal Server Error - Erro interno do servidor

## 🧪 Exemplos de Teste

### Teste Completo de Company Party
```bash
# 1. Login como Admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lineage.com","password":"admin123"}' | \
  jq -r '.token')

# 2. Criar Company Party
curl -X POST http://localhost:3000/company-parties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test CP"}'

# 3. Listar Company Parties
curl -X GET http://localhost:3000/company-parties \
  -H "Authorization: Bearer $TOKEN"

# 4. Adicionar player
curl -X POST http://localhost:3000/company-parties/{cp-id}/players \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"{user-id}"}'
```

## 🎯 Funcionalidades Implementadas

✅ **Sistema de Company Parties completo**
✅ **Relacionamento many-to-many entre Users e Company Parties**
✅ **Autenticação JWT com roles**
✅ **Controle de acesso baseado em roles**
✅ **Validação de dados com Zod**
✅ **Paginação nas listagens**
✅ **Documentação de API**
✅ **Seed data para testes**
✅ **Remoção do campo CP antigo do User model**
✅ **TypeScript type safety completa**

O sistema está totalmente funcional e pronto para uso! 🚀
