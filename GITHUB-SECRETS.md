# 🔐 GitHub Secrets Configuration

Este documento explica como configurar os GitHub Secrets necessários para o deployment automatizado da aplicação Lineage CP Backend.

## 📋 Secrets Obrigatórios

### 🔑 Autenticação SSH

1. **`SSH_PRIVATE_KEY`**
   - **Descrição**: Chave SSH privada para acesso ao servidor de produção
   - **Como obter**: 
     ```bash
     # Gerar nova chave SSH
     ssh-keygen -t rsa -b 4096 -C "deployment@yourdomain.com"
     
     # Copiar chave pública para o servidor
     ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@your-server.com
     
     # Copiar conteúdo da chave privada para o secret
     cat ~/.ssh/id_rsa
     ```

2. **`SSH_USER`**
   - **Descrição**: Nome do usuário SSH para conexão
   - **Valor**: `deploy` (ou o usuário que você criou no servidor)

3. **`SERVER_HOST`**
   - **Descrição**: IP ou domínio do servidor de produção
   - **Exemplo**: `192.168.1.100` ou `server.yourdomain.com`

### 🗄️ Configuração do Banco de Dados

4. **`DATABASE_URL`**
   - **Descrição**: URL completa de conexão com o banco PostgreSQL
   - **Formato**: `postgresql://username:password@host:port/database`
   - **Exemplo**: `postgresql://lineage_prod_user:secure_password@lineage-postgres-prod:5432/lineage_db_prod`

5. **`POSTGRES_DB`**
   - **Descrição**: Nome do banco de dados PostgreSQL
   - **Exemplo**: `lineage_db_prod`

6. **`POSTGRES_USER`**
   - **Descrição**: Nome do usuário do banco PostgreSQL
   - **Exemplo**: `lineage_prod_user`

7. **`POSTGRES_PASSWORD`**
   - **Descrição**: Senha do usuário do banco PostgreSQL
   - **Como gerar**: 
     ```bash
     # Gerar senha segura
     openssl rand -base64 32
     ```

### 🔒 Configuração de Segurança

8. **`JWT_SECRET`**
   - **Descrição**: Chave secreta para assinatura de tokens JWT
   - **Como gerar**:
     ```bash
     # Gerar JWT secret seguro
     openssl rand -base64 64
     ```

9. **`CORS_ORIGIN`**
   - **Descrição**: Domínios permitidos para CORS
   - **Exemplo**: `https://yourdomain.com` ou `https://app.yourdomain.com,https://admin.yourdomain.com`

## 📋 Secrets Opcionais

### 🔧 Configurações da Aplicação

10. **`LOG_LEVEL`** (opcional)
    - **Descrição**: Nível de log da aplicação
    - **Valores**: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
    - **Padrão**: `info`

11. **`RATE_LIMIT_MAX`** (opcional)
    - **Descrição**: Número máximo de requisições por janela de tempo
    - **Padrão**: `100`

12. **`RATE_LIMIT_WINDOW`** (opcional)
    - **Descrição**: Janela de tempo para rate limiting (em milissegundos)
    - **Padrão**: `60000` (1 minuto)

## 🛠️ Como Configurar os Secrets

### 1. Acessar as Configurações do Repositório

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

### 2. Adicionar Secrets

1. Clique em **New repository secret**
2. Digite o nome do secret (exatamente como listado acima)
3. Cole o valor do secret
4. Clique em **Add secret**

### 3. Verificar Configuração

Após adicionar todos os secrets, você deve ter pelo menos estes secrets obrigatórios:

```
✅ SSH_PRIVATE_KEY
✅ SSH_USER
✅ SERVER_HOST
✅ DATABASE_URL
✅ POSTGRES_DB
✅ POSTGRES_USER
✅ POSTGRES_PASSWORD
✅ JWT_SECRET
✅ CORS_ORIGIN
```

## 🔍 Exemplo de Configuração Completa

```bash
# Secrets Obrigatórios
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
SSH_USER=deploy
SERVER_HOST=192.168.1.100
DATABASE_URL=postgresql://lineage_prod_user:abc123xyz789@lineage-postgres-prod:5432/lineage_db_prod
POSTGRES_DB=lineage_db_prod
POSTGRES_USER=lineage_prod_user
POSTGRES_PASSWORD=abc123xyz789
JWT_SECRET=super-secure-jwt-secret-generated-with-openssl
CORS_ORIGIN=https://yourdomain.com

# Secrets Opcionais
LOG_LEVEL=info
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
```

## 🔒 Boas Práticas de Segurança

### ✅ Recomendações

1. **Use senhas fortes**: Gere senhas com pelo menos 32 caracteres
2. **Rotacione secrets regularmente**: Especialmente JWT_SECRET e senhas de banco
3. **Limite acesso**: Apenas usuários necessários devem ter acesso aos secrets
4. **Use HTTPS**: Sempre configure CORS_ORIGIN com HTTPS em produção
5. **Monitore logs**: Mantenha LOG_LEVEL em 'info' ou 'warn' em produção

### ❌ Evite

1. **Não commite secrets**: Nunca adicione secrets diretamente no código
2. **Não use valores padrão**: Sempre altere senhas e secrets padrão
3. **Não compartilhe secrets**: Use canais seguros para compartilhar informações sensíveis
4. **Não use secrets em desenvolvimento**: Use arquivos .env locais para desenvolvimento

## 🚨 Troubleshooting

### Erro: "Secret not found"
- Verifique se o nome do secret está exatamente igual ao esperado
- Secrets são case-sensitive

### Erro: "SSH connection failed"
- Verifique se SSH_PRIVATE_KEY está correto
- Confirme se a chave pública foi adicionada ao servidor
- Teste a conexão SSH manualmente

### Erro: "Database connection failed"
- Verifique se DATABASE_URL está no formato correto
- Confirme se POSTGRES_PASSWORD está correto
- Verifique se o banco de dados está rodando

### Erro: "JWT validation failed"
- Verifique se JWT_SECRET tem pelo menos 32 caracteres
- Confirme se o secret não tem espaços extras

## 📞 Suporte

Se você encontrar problemas com a configuração dos secrets:

1. Verifique os logs do GitHub Actions
2. Teste a conexão SSH manualmente
3. Valide a string de conexão do banco de dados
4. Confirme se todos os secrets obrigatórios estão configurados
