#!/bin/bash

# Script para configurar SSL para api-prd.omegateam.com.br
# Este script pode ser executado no servidor para configurar SSL

set -e

DOMAIN="api-prd.omegateam.com.br"
SSL_DIR="/var/www/lineage-cp-backend/nginx/ssl"
EMAIL="engcfelix@gmail.com"  # Substitua pelo seu email

echo "🔐 Configurando SSL para $DOMAIN..."

# Criar diretório SSL se não existir
mkdir -p "$SSL_DIR"

# Função para gerar certificado auto-assinado (para teste)
generate_self_signed() {
    echo "📝 Gerando certificado auto-assinado para teste..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=OmegaTeam/CN=$DOMAIN"

    echo "✅ Certificado auto-assinado criado!"
    echo "⚠️  ATENÇÃO: Este é um certificado auto-assinado para teste."
    echo "   Para produção, use Let's Encrypt com o comando: $0 letsencrypt"
}

# Função para configurar Let's Encrypt
setup_letsencrypt() {
    echo "🌐 Configurando Let's Encrypt para $DOMAIN..."

    # Verificar se certbot está instalado
    if ! command -v certbot &> /dev/null; then
        echo "📦 Instalando certbot..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi

    # Parar nginx temporariamente
    echo "⏸️  Parando nginx temporariamente..."
    docker stop lineage-nginx-prod 2>/dev/null || true

    # Gerar certificado
    echo "🔑 Gerando certificado Let's Encrypt..."
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    # Copiar certificados para o diretório do projeto
    echo "📋 Copiando certificados..."
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"

    # Configurar renovação automática
    echo "🔄 Configurando renovação automática..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker restart lineage-nginx-prod'") | crontab -

    echo "✅ Let's Encrypt configurado com sucesso!"
}

# Verificar argumentos
case "${1:-self-signed}" in
    "letsencrypt")
        setup_letsencrypt
        ;;
    "self-signed")
        generate_self_signed
        ;;
    *)
        echo "Uso: $0 [self-signed|letsencrypt]"
        echo ""
        echo "Opções:"
        echo "  self-signed  - Gera certificado auto-assinado para teste (padrão)"
        echo "  letsencrypt  - Configura certificado Let's Encrypt para produção"
        exit 1
        ;;
esac

echo ""
echo "🎉 SSL configurado! Agora você pode:"
echo "   1. Reiniciar os containers: docker-compose -f docker-compose.production.yml up -d"
echo "   2. Testar: curl -k https://$DOMAIN/health"
echo "   3. Verificar logs: docker logs lineage-nginx-prod"
