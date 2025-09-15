# 🔐 Configuração SSL para API

Este guia explica como configurar SSL/HTTPS para sua API usando Nginx como proxy reverso.

## 📋 Pré-requisitos

1. **Domínio configurado**: `api-prd.omegateam.com.br` deve apontar para o IP do seu servidor
2. **Portas abertas**: 80 (HTTP) e 443 (HTTPS) devem estar abertas no firewall
3. **Docker e Docker Compose** instalados no servidor

## 🚀 Deploy Rápido

### Opção 1: Deploy Automático (Recomendado)

```bash
# No servidor, navegue até o diretório do projeto
cd /var/www/lineage-cp-backend

# Execute o script de deploy com SSL
bash scripts/deploy-with-ssl.sh
```

Este script irá:
- Verificar e criar a estrutura necessária
- Gerar certificado auto-assinado (para teste)
- Configurar e iniciar todos os containers
- Executar testes de saúde

### Opção 2: Deploy Manual

```bash
# 1. Criar estrutura de diretórios
mkdir -p nginx/ssl nginx/conf.d

# 2. Gerar certificado auto-assinado (para teste)
bash scripts/setup-ssl.sh self-signed

# 3. Iniciar containers
docker-compose -f docker-compose.production.yml up -d

# 4. Verificar status
docker-compose -f docker-compose.production.yml ps
```

## 🌐 Configuração Let's Encrypt (Produção)

Para usar certificados SSL válidos em produção:

```bash
# 1. Parar containers
docker-compose -f docker-compose.production.yml down

# 2. Configurar Let's Encrypt
bash scripts/setup-ssl.sh letsencrypt

# 3. Reiniciar containers
docker-compose -f docker-compose.production.yml up -d
```

## 🧪 Testes

### Verificar se está funcionando:

```bash
# Teste HTTP (deve redirecionar para HTTPS)
curl -I http://api-prd.omegateam.com.br/health

# Teste HTTPS
curl -k https://api-prd.omegateam.com.br/health

# Teste do frontend (atualize o .env)
# VITE_API_URL=https://api-prd.omegateam.com.br
```

### Resposta esperada:
```json
{"status":"ok","timestamp":"2025-09-15T02:05:13.878Z","uptime":94983.099286138,"environment":"production"}
```

## 🔧 Estrutura dos Arquivos

```
backend/
├── docker-compose.production.yml  # Configuração com Nginx
├── nginx/
│   ├── nginx.conf                 # Configuração principal do Nginx
│   ├── conf.d/
│   │   └── api.conf              # Configuração do proxy reverso
│   └── ssl/
│       ├── fullchain.pem         # Certificado SSL
│       └── privkey.pem           # Chave privada SSL
└── scripts/
    ├── setup-ssl.sh              # Script para configurar SSL
    └── deploy-with-ssl.sh         # Script de deploy completo
```

## 🐛 Solução de Problemas

### Container nginx não inicia:
```bash
# Verificar logs
docker logs lineage-nginx-prod

# Verificar configuração
docker exec lineage-nginx-prod nginx -t
```

### Certificado SSL inválido:
```bash
# Regenerar certificado auto-assinado
bash scripts/setup-ssl.sh self-signed

# Ou configurar Let's Encrypt
bash scripts/setup-ssl.sh letsencrypt
```

### Backend não responde:
```bash
# Verificar logs do backend
docker logs lineage-backend-prod

# Verificar se o backend está rodando
docker exec lineage-backend-prod curl http://localhost:3000/health
```

### Erro de CORS:
Verifique se a variável `CORS_ORIGIN` está configurada corretamente nos secrets do GitHub:
```
CORS_ORIGIN=https://seu-frontend-domain.com
```

## 📊 Monitoramento

### Logs em tempo real:
```bash
# Todos os containers
docker-compose -f docker-compose.production.yml logs -f

# Apenas nginx
docker logs -f lineage-nginx-prod

# Apenas backend
docker logs -f lineage-backend-prod
```

### Status dos containers:
```bash
docker-compose -f docker-compose.production.yml ps
```

### Verificar certificados:
```bash
# Verificar validade do certificado
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Verificar se o certificado está sendo usado
echo | openssl s_client -connect api-prd.omegateam.com.br:443 2>/dev/null | openssl x509 -noout -dates
```

## 🔄 Renovação Automática (Let's Encrypt)

O script `setup-ssl.sh letsencrypt` configura renovação automática via cron:

```bash
# Verificar se o cron está configurado
crontab -l | grep certbot

# Testar renovação manualmente
certbot renew --dry-run
```

## 📝 Notas Importantes

1. **Certificado Auto-assinado**: Navegadores mostrarão aviso de segurança. Use apenas para teste.
2. **Let's Encrypt**: Certificados válidos e gratuitos. Renovação automática a cada 90 dias.
3. **Firewall**: Certifique-se de que as portas 80 e 443 estão abertas.
4. **DNS**: O domínio deve apontar para o IP do servidor antes de configurar Let's Encrypt.
5. **CORS**: Configure corretamente para permitir acesso do frontend.

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs dos containers
2. Teste a conectividade de rede
3. Verifique a configuração DNS
4. Confirme que as portas estão abertas
5. Verifique as variáveis de ambiente
