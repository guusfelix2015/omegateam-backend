#!/bin/bash

# Script para formatar o arquivo atual com Prettier
# Uso: ./format-current.sh <caminho-do-arquivo>

if [ $# -eq 0 ]; then
    echo "Uso: $0 <caminho-do-arquivo>"
    exit 1
fi

FILE_PATH="$1"

if [ ! -f "$FILE_PATH" ]; then
    echo "Arquivo não encontrado: $FILE_PATH"
    exit 1
fi

echo "Formatando arquivo: $FILE_PATH"
npx prettier --write "$FILE_PATH"
echo "Arquivo formatado com sucesso!"
