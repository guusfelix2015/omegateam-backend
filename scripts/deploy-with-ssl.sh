#!/bin/bash

# Script de deploy completo com SSL
# Execute este script no servidor para fazer deploy com SSL

set -e

DEPLOY_PATH="/var/www/lineage-cp-backend"
DOMAIN="api-prd.omegateam.com.br"

echo "🚀 Iniciando deploy com SSL..."

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ Erro: docker-compose.production.yml não encontrado!"
    echo "Execute este script no diretório do projeto."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando estrutura de diretórios..."
mkdir -p nginx/ssl
mkdir -p nginx/conf.d

# Verificar se os arquivos de configuração do Nginx existem
if [ ! -f "nginx/nginx.conf" ]; then
    echo "❌ Erro: nginx/nginx.conf não encontrado!"
    echo "Certifique-se de que os arquivos de configuração do Nginx estão presentes."
    exit 1
fi

if [ ! -f "nginx/conf.d/api.conf" ]; then
    echo "❌ Erro: nginx/conf.d/api.conf não encontrado!"
    echo "Certifique-se de que os arquivos de configuração do Nginx estão presentes."
    exit 1
fi

# Verificar se os certificados SSL existem
if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
    echo "🔐 Certificados SSL não encontrados. Gerando certificado auto-assinado..."
    
    # Gerar certificado auto-assinado
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "nginx/ssl/privkey.pem" \
        -out "nginx/ssl/fullchain.pem" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=OmegaTeam/CN=$DOMAIN"
    
    echo "✅ Certificado auto-assinado criado!"
    echo "⚠️  Para produção, configure Let's Encrypt depois do deploy."
fi

# Parar containers existentes
echo "⏹️  Parando containers existentes..."
docker-compose -f docker-compose.production.yml down || true

# Fazer pull das imagens
echo "📥 Baixando imagens..."
docker-compose -f docker-compose.production.yml pull

# Iniciar containers
echo "🔄 Iniciando containers..."
docker-compose -f docker-compose.production.yml up -d

# Aguardar containers ficarem prontos
echo "⏳ Aguardando containers ficarem prontos..."
sleep 30

# Verificar saúde dos containers
echo "🏥 Verificando saúde dos containers..."

# Verificar backend
echo "Verificando backend..."
for i in {1..10}; do
    if docker exec lineage-backend-prod curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ Backend está saudável!"
        break
    else
        if [ $i -eq 10 ]; then
            echo "❌ Backend não está respondendo após 10 tentativas"
            echo "Logs do backend:"
            docker logs lineage-backend-prod --tail 20
            exit 1
        fi
        echo "Tentativa $i/10 - Aguardando backend..."
        sleep 5
    fi
done

# Verificar nginx
echo "Verificando nginx..."
for i in {1..5}; do
    if docker exec lineage-nginx-prod nginx -t >/dev/null 2>&1; then
        echo "✅ Nginx está configurado corretamente!"
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ Nginx tem problemas de configuração"
            echo "Logs do nginx:"
            docker logs lineage-nginx-prod --tail 20
            exit 1
        fi
        echo "Tentativa $i/5 - Verificando nginx..."
        sleep 3
    fi
done

# Teste final
echo "🧪 Executando testes finais..."

# Teste HTTP (deve redirecionar para HTTPS)
echo "Testando redirecionamento HTTP -> HTTPS..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_RESPONSE" = "301" ]; then
    echo "✅ Redirecionamento HTTP -> HTTPS funcionando!"
else
    echo "⚠️  Redirecionamento HTTP retornou: $HTTP_RESPONSE"
fi

# Teste HTTPS
echo "Testando HTTPS..."
HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/health || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    echo "✅ HTTPS funcionando!"
else
    echo "❌ HTTPS retornou: $HTTPS_RESPONSE"
    echo "Logs do nginx:"
    docker logs lineage-nginx-prod --tail 10
fi

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📋 Resumo:"
echo "   • Backend: http://localhost:3000 (interno)"
echo "   • API HTTPS: https://$DOMAIN"
echo "   • API HTTP: http://$DOMAIN (redireciona para HTTPS)"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   • Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "   • Parar: docker-compose -f docker-compose.production.yml down"
echo ""
echo "🔐 Para configurar Let's Encrypt em produção:"
echo "   bash scripts/setup-ssl.sh letsencrypt"
