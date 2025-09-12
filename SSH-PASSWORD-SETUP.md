# 🔐 SSH com Usuário e Senha - Configuração

Este guia explica como configurar o deployment usando autenticação SSH com usuário e senha ao invés de chaves SSH.

## 📋 GitHub Secrets Necessários

### **Secrets Obrigatórios para SSH:**

1. **`SSH_USER`**
   - **Descrição**: Nome do usuário SSH
   - **Exemplo**: `root`, `ubuntu`, `deploy`, etc.

2. **`SSH_PASSWORD`**
   - **Descrição**: Senha do usuário SSH
   - **⚠️ Importante**: Use uma senha forte e segura

3. **`SERVER_HOST`**
   - **Descrição**: IP ou domínio do servidor
   - **Exemplo**: `192.168.1.100` ou `servidor.seudominio.com`

### **Secrets da Aplicação:**

4. **`DATABASE_URL`**
   - **Formato**: `postgresql://usuario:senha@host:porta/banco`
   - **Exemplo**: `postgresql://lineage_user:senha123@localhost:5432/lineage_db`

5. **`POSTGRES_DB`**
   - **Exemplo**: `lineage_db_prod`

6. **`POSTGRES_USER`**
   - **Exemplo**: `lineage_prod_user`

7. **`POSTGRES_PASSWORD`**
   - **Descrição**: Senha do banco PostgreSQL

8. **`JWT_SECRET`**
   - **Como gerar**: `openssl rand -base64 64`

9. **`CORS_ORIGIN`**
   - **Exemplo**: `https://seudominio.com`

### **Secrets Opcionais:**

10. **`LOG_LEVEL`** - `info` (padrão)
11. **`RATE_LIMIT_MAX`** - `100` (padrão)
12. **`RATE_LIMIT_WINDOW`** - `60000` (padrão)
13. **`SWAGGER_ENABLED`** - `false` (padrão)

## 🛠️ Configuração do Servidor

### 1. Preparar o Servidor

```bash
# Conectar ao servidor
ssh seu_usuario@ip_do_servidor

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Criar diretório de deployment
sudo mkdir -p /var/www/lineage-cp-backend
sudo chown $USER:$USER /var/www/lineage-cp-backend
```

### 2. Configurar SSH (se necessário)

```bash
# Editar configuração SSH (opcional)
sudo nano /etc/ssh/sshd_config

# Permitir autenticação por senha (se não estiver habilitada)
PasswordAuthentication yes

# Reiniciar SSH
sudo systemctl restart ssh
```

### 3. Configurar Firewall

```bash
# Permitir portas necessárias
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # Porta da aplicação
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

## 🔧 Como Adicionar os Secrets no GitHub

### 1. Acessar Configurações

1. Vá para seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral: **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. Adicionar Cada Secret

**Exemplo de configuração:**

```
SSH_USER = root
SSH_PASSWORD = sua_senha_super_segura_123
SERVER_HOST = 192.168.1.100
DATABASE_URL = postgresql://lineage_user:db_senha_123@localhost:5432/lineage_db_prod
POSTGRES_DB = lineage_db_prod
POSTGRES_USER = lineage_user
POSTGRES_PASSWORD = db_senha_123
JWT_SECRET = sua_chave_jwt_super_segura_gerada_com_openssl
CORS_ORIGIN = https://seudominio.com
```

## 🚀 Testando o Deployment

### 1. Fazer Push para Main

```bash
git add .
git commit -m "feat: configurar deployment com SSH password"
git push origin main
```

### 2. Acompanhar o GitHub Actions

1. Vá para a aba **Actions** no GitHub
2. Clique no workflow que está executando
3. Acompanhe os logs de cada step

### 3. Verificar se Funcionou

```bash
# Conectar ao servidor
ssh seu_usuario@ip_do_servidor

# Verificar containers
docker ps

# Verificar logs
docker logs lineage-backend-prod

# Testar aplicação
curl http://localhost:3000/health
```

## 🔒 Segurança

### ✅ Boas Práticas

1. **Use senhas fortes**: Pelo menos 16 caracteres com letras, números e símbolos
2. **Limite acesso SSH**: Configure fail2ban para proteger contra ataques
3. **Use HTTPS**: Configure SSL/TLS em produção
4. **Monitore logs**: Acompanhe tentativas de acesso
5. **Atualize regularmente**: Mantenha o sistema atualizado

### 🛡️ Configurações Adicionais de Segurança

```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar fail2ban para SSH
sudo nano /etc/fail2ban/jail.local
```

Adicione:
```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

```bash
# Reiniciar fail2ban
sudo systemctl restart fail2ban
```

## 🚨 Troubleshooting

### Erro: "Permission denied (publickey,password)"

```bash
# Verificar se autenticação por senha está habilitada
sudo grep "PasswordAuthentication" /etc/ssh/sshd_config

# Se não estiver, habilitar:
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### Erro: "Connection refused"

```bash
# Verificar se SSH está rodando
sudo systemctl status ssh

# Verificar firewall
sudo ufw status

# Verificar porta SSH
sudo netstat -tlnp | grep :22
```

### Erro: "Docker command not found"

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
```

### Erro: "Database connection failed"

```bash
# Verificar se o container do banco está rodando
docker ps | grep postgres

# Verificar logs do banco
docker logs lineage-postgres-prod

# Testar conexão
docker exec lineage-postgres-prod pg_isready
```

## 📞 Suporte

Se você encontrar problemas:

1. **Verifique os logs do GitHub Actions** para erros específicos
2. **Teste a conexão SSH manualmente** antes do deployment
3. **Confirme que todos os secrets estão configurados** corretamente
4. **Verifique se o servidor tem Docker instalado** e funcionando
5. **Confirme que as portas necessárias estão abertas** no firewall

A autenticação por senha é mais simples de configurar, mas certifique-se de usar senhas fortes e implementar medidas de segurança adequadas!
