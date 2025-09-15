#!/bin/bash

# Script para debug do deploy
# Execute este script no servidor para diagnosticar problemas

set -e

DEPLOY_PATH="/var/www/lineage-cp-backend"
DOMAIN="api-prd.omegateam.com.br"

echo "🔍 Iniciando diagnóstico do deploy..."

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Erro: docker-compose.production.yml não encontrado!"
    echo "Execute este script no diretório: $DEPLOY_PATH"
    exit 1
fi

echo "📁 Diretório correto: $(pwd)"

# Verificar containers
echo ""
echo "🐳 Status dos containers:"
docker ps

echo ""
echo "🔍 Verificando saúde dos containers:"

# Backend
BACKEND_STATUS=$(docker inspect lineage-backend-prod --format='{{.State.Status}}' 2>/dev/null || echo "not found")
BACKEND_HEALTH=$(docker inspect lineage-backend-prod --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
echo "Backend Status: $BACKEND_STATUS"
echo "Backend Health: $BACKEND_HEALTH"

# Nginx
NGINX_STATUS=$(docker inspect lineage-nginx-prod --format='{{.State.Status}}' 2>/dev/null || echo "not found")
echo "Nginx Status: $NGINX_STATUS"

echo ""
echo "🔧 Testando configuração do nginx:"
if docker exec lineage-nginx-prod nginx -t 2>/dev/null; then
    echo "✅ Configuração do nginx está válida"
else
    echo "❌ Configuração do nginx tem problemas:"
    docker exec lineage-nginx-prod nginx -t 2>&1 || true
fi

echo ""
echo "🔐 Verificando certificados SSL:"
if [ -f "nginx/ssl/fullchain.pem" ] && [ -f "nginx/ssl/privkey.pem" ]; then
    echo "✅ Arquivos de certificado existem"
    echo "Certificado criado em: $(stat -c %y nginx/ssl/fullchain.pem)"
    
    # Verificar se o certificado é válido
    if openssl x509 -in nginx/ssl/fullchain.pem -text -noout >/dev/null 2>&1; then
        echo "✅ Certificado é válido"
        echo "Certificado para: $(openssl x509 -in nginx/ssl/fullchain.pem -subject -noout | sed 's/subject=//')"
        echo "Válido até: $(openssl x509 -in nginx/ssl/fullchain.pem -enddate -noout | sed 's/notAfter=//')"
    else
        echo "❌ Certificado é inválido"
    fi
else
    echo "❌ Certificados SSL não encontrados"
    echo "Gerando certificados..."
    bash scripts/setup-ssl.sh self-signed
fi

echo ""
echo "🌐 Testando conectividade:"

# Teste interno do backend
echo "Testando backend internamente..."
if docker exec lineage-backend-prod curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend responde internamente"
    docker exec lineage-backend-prod curl -s http://localhost:3000/health
else
    echo "❌ Backend não responde internamente"
fi

# Teste HTTP
echo ""
echo "Testando HTTP (porta 80)..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
echo "HTTP Response Code: $HTTP_RESPONSE"

if [ "$HTTP_RESPONSE" = "301" ]; then
    echo "✅ Redirecionamento HTTP -> HTTPS funcionando"
elif [ "$HTTP_RESPONSE" = "000" ]; then
    echo "❌ Nginx não está respondendo na porta 80"
else
    echo "⚠️  Resposta inesperada na porta 80"
fi

# Teste HTTPS
echo ""
echo "Testando HTTPS (porta 443)..."
if curl -k -f -s https://localhost/health >/dev/null 2>&1; then
    echo "✅ HTTPS funcionando!"
    echo "Resposta:"
    curl -k -s https://localhost/health
else
    echo "❌ HTTPS não está funcionando"
    HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/health 2>/dev/null || echo "000")
    echo "HTTPS Response Code: $HTTPS_RESPONSE"
fi

echo ""
echo "📋 Logs recentes:"
echo "--- Backend logs (últimas 10 linhas) ---"
docker logs lineage-backend-prod --tail 10

echo ""
echo "--- Nginx logs (últimas 10 linhas) ---"
docker logs lineage-nginx-prod --tail 10

echo ""
echo "🔍 Diagnóstico concluído!"
echo ""
echo "💡 Próximos passos:"
echo "1. Se HTTPS não funcionar, verifique os certificados SSL"
echo "2. Se backend não responder, verifique os logs do backend"
echo "3. Se nginx não responder, verifique a configuração do nginx"
echo ""
echo "🛠️  Comandos úteis:"
echo "   Reiniciar nginx: docker-compose -f docker-compose.production.yml restart nginx"
echo "   Regenerar SSL: bash scripts/setup-ssl.sh self-signed"
echo "   Ver logs: docker-compose -f docker-compose.production.yml logs -f"
