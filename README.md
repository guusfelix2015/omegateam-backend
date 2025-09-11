# Lineage CP Backend

Backend minimalista porém robusto com **Fastify + TypeScript**, containerizado com **Docker** e **Docker Compose**, pronto para dev/prod.

## 🚀 Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify
- **Linguagem**: TypeScript (strict)
- **ORM**: Prisma (PostgreSQL)
- **Validação**: Zod + zod-to-json-schema
- **Documentação**: fastify-swagger (OpenAPI 3) + Swagger UI
- **Segurança**: fastify-helmet, CORS, rate limiting
- **Containerização**: Docker + Docker Compose

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── app.ts                    # Configuração do Fastify
│   ├── server.ts                 # Bootstrap e graceful shutdown
│   ├── plugins/
│   │   ├── swagger.ts           # Documentação OpenAPI
│   │   ├── prisma.ts            # Cliente do banco
│   │   └── security.ts          # Helmet, CORS, rate limit
│   ├── routes/
│   │   ├── index.ts             # Health/ready/version/auth
│   │   └── users/
│   │       ├── users.schema.ts  # Schemas Zod
│   │       ├── users.controller.ts
│   │       └── users.routes.ts
│   ├── modules/
│   │   └── users/
│   │       ├── user.service.ts
│   │       └── user.repository.ts
│   ├── libs/
│   │   ├── env.ts               # Validação de env vars
│   │   ├── errors.ts            # Error handling
│   │   └── auth.ts              # Autenticação Bearer
│   └── types/
│       └── fastify.d.ts         # Type augmentations
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker/
│   ├── Dockerfile               # Multi-stage prod
│   └── Dockerfile.dev           # Dev com hot reload
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Configuração Rápida

### 1. Clonar e configurar

```bash
# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env conforme necessário
nano .env
```

### 2. Desenvolvimento com Docker

```bash
# Subir banco + backend em modo dev
docker compose --profile dev up -d

# Verificar logs
docker compose logs -f backend-dev

# Parar serviços
docker compose down
```

### 3. Desenvolvimento local

```bash
# Instalar dependências
npm install

# Subir apenas o banco
docker compose up postgres -d

# Executar migrações
npm run prisma:migrate

# Executar seeds
npm run prisma:seed

# Iniciar em modo dev
npm run dev
```

## 📋 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Hot reload com tsx
npm run build            # Build TypeScript
npm run start            # Executar build

# Qualidade de código
npm run lint             # ESLint
npm run lint:fix         # ESLint com correções
npm run format           # Prettier
npm run typecheck        # Verificação de tipos

# Banco de dados
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:migrate   # Executar migrações
npm run prisma:seed      # Executar seeds
npm run prisma:studio    # Interface visual do banco
npm run db:reset         # Reset completo do banco

# Testes
npm run test             # Executar testes
npm run test:ui          # Interface visual dos testes

# Docker
npm run docker:dev       # Subir ambiente dev
npm run docker:prod      # Subir ambiente prod
npm run docker:down      # Parar containers
```

## 🔗 Endpoints da API

### Sistema
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/health` | Health check | ❌ |
| GET | `/ready` | Readiness check (inclui DB) | ❌ |
| GET | `/version` | Informações da versão | ❌ |
| POST | `/auth/login` | Login demo | ❌ |

### Usuários
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/users` | Listar usuários (paginado) | ✅ |
| GET | `/users/:id` | Buscar usuário por ID | ✅ |
| POST | `/users` | Criar usuário | ❌ |
| PUT | `/users/:id` | Atualizar usuário | ✅ |
| DELETE | `/users/:id` | Deletar usuário | ✅ |

## 🔐 Autenticação

Sistema de autenticação Bearer token simples para demonstração:

### Credenciais de teste:
- **Admin**: `admin@lineage.com` / `admin123`
- **User**: `john.doe@example.com` / `user123`

### Como usar:

1. **Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lineage.com","password":"admin123"}'
```

2. **Usar token**:
```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📚 Documentação da API

Acesse a documentação interativa em:
- **Desenvolvimento**: http://localhost:3000/docs
- **Swagger JSON**: http://localhost:3000/docs/json

## 🐳 Docker

### Desenvolvimento
```bash
# Subir com hot reload
docker compose --profile dev up -d

# Logs em tempo real
docker compose logs -f backend-dev
```

### Produção
```bash
# Build e subir
docker compose --profile prod up -d

# Verificar status
docker compose ps
```

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test -- --watch

# Interface visual
npm run test:ui
```

## 🔧 Configuração de Ambiente

Principais variáveis do `.env`:

```bash
# Ambiente
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Banco
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Segurança
JWT_SECRET=your-secret-key
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Swagger
SWAGGER_ENABLED=true
SWAGGER_AUTH_REQUIRED=false

# Logs
LOG_LEVEL=info
```

## 🚀 Deploy

### Produção com Docker

1. **Configurar variáveis**:
```bash
cp .env.example .env.production
# Editar .env.production com valores de produção
```

2. **Deploy**:
```bash
docker compose --profile prod --env-file .env.production up -d
```

### Verificações de saúde

- **Health**: `GET /health` - Status básico
- **Ready**: `GET /ready` - Inclui conectividade do banco
- **Logs**: `docker compose logs backend-prod`

## 🛡️ Segurança

- ✅ Helmet para headers de segurança
- ✅ CORS configurável
- ✅ Rate limiting
- ✅ Validação de entrada com Zod
- ✅ Sanitização automática
- ✅ Error handling sem vazamento de stack traces
- ✅ Container não-root
- ✅ Variáveis de ambiente validadas

## 🔍 Troubleshooting

### Problemas comuns:

1. **Erro de conexão com banco**:
```bash
# Verificar se o PostgreSQL está rodando
docker compose ps postgres

# Verificar logs do banco
docker compose logs postgres
```

2. **Erro de migração**:
```bash
# Reset do banco
npm run db:reset

# Ou manualmente
npm run prisma:migrate
npm run prisma:seed
```

3. **Problemas de permissão no Docker**:
```bash
# Rebuild sem cache
docker compose build --no-cache backend-dev
```

## 📝 Desenvolvimento

### Adicionando novas rotas:

1. Criar schema em `src/routes/[module]/[module].schema.ts`
2. Implementar repository em `src/modules/[module]/[module].repository.ts`
3. Implementar service em `src/modules/[module]/[module].service.ts`
4. Implementar controller em `src/routes/[module]/[module].controller.ts`
5. Implementar routes em `src/routes/[module]/[module].routes.ts`
6. Registrar no `src/app.ts`

### Padrões de código:

- ✅ TypeScript strict
- ✅ ESLint + Prettier
- ✅ Funções pequenas e focadas
- ✅ Tratamento de erro consistente
- ✅ Tipos inferidos (evitar `any`)
- ✅ Nomes claros e descritivos

---

**Desenvolvido com ❤️ usando Fastify + TypeScript**
