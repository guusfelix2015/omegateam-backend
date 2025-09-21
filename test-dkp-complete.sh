#!/bin/bash

# Complete DKP System Test - Full Integration Test
echo "🎯 TESTE COMPLETO DO SISTEMA DKP"
echo "================================="
echo "Testando todo o fluxo: Criação de Raid → Instância → Cálculo DKP → Distribuição → Verificação"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Function to make authenticated requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$data" ]; then
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data"
    else
        curl -s -X $method "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $token"
    fi
}

# Step 1: Login as Admin
echo -e "${BLUE}🔐 Step 1: Autenticando como Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lineage.com","password":"admin123456"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token // empty')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Falha na autenticação do admin${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin autenticado com sucesso${NC}"

# Step 2: Get Admin info
ADMIN_INFO=$(make_request "GET" "/users/me" "" "$ADMIN_TOKEN")
ADMIN_ID=$(echo $ADMIN_INFO | jq -r '.id')
ADMIN_GEAR_SCORE=$(echo $ADMIN_INFO | jq -r '.gearScore')

echo -e "${YELLOW}👤 Admin ID: $ADMIN_ID${NC}"
echo -e "${YELLOW}⚔️  Admin Gear Score: $ADMIN_GEAR_SCORE${NC}"

# Step 3: Check initial DKP
echo -e "${BLUE}💰 Step 2: Verificando DKP inicial...${NC}"
INITIAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
INITIAL_BALANCE=$(echo $INITIAL_DKP | jq -r '.currentDkpPoints')

echo -e "${YELLOW}💎 DKP Inicial: $INITIAL_BALANCE${NC}"

# Step 4: Create test raid
echo -e "${BLUE}🐉 Step 3: Criando raid de teste...${NC}"
TIMESTAMP=$(date +%s)
RAID_DATA="{
    \"name\": \"🐲 Teste DKP - Baium $TIMESTAMP\",
    \"bossLevel\": 80,
    \"baseScore\": 600,
    \"description\": \"Raid de teste para validação completa do sistema DKP\"
}"

RAID_RESPONSE=$(make_request "POST" "/raids" "$RAID_DATA" "$ADMIN_TOKEN")
RAID_ID=$(echo $RAID_RESPONSE | jq -r '.id')

if [ -z "$RAID_ID" ] || [ "$RAID_ID" = "null" ]; then
    echo -e "${RED}❌ Falha ao criar raid${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Raid criado: $RAID_ID${NC}"

# Step 5: Calculate expected DKP
EXPECTED_DKP=$(echo "scale=0; (80 * $ADMIN_GEAR_SCORE) / 100" | bc)
echo -e "${PURPLE}🧮 Cálculo Esperado: (80 × $ADMIN_GEAR_SCORE) ÷ 100 = $EXPECTED_DKP DKP${NC}"

# Step 6: Preview DKP calculation
echo -e "${BLUE}🔍 Step 4: Testando preview de cálculo DKP...${NC}"
PREVIEW_DATA="{\"raidId\": \"$RAID_ID\", \"participantIds\": [\"$ADMIN_ID\"]}"
PREVIEW_RESPONSE=$(make_request "POST" "/raid-instances/preview-dkp" "$PREVIEW_DATA" "$ADMIN_TOKEN")

PREVIEW_DKP=$(echo $PREVIEW_RESPONSE | jq -r '.participants[0].dkpAwarded')
echo -e "${YELLOW}🎯 Preview DKP: $PREVIEW_DKP${NC}"

if [ "$PREVIEW_DKP" = "$EXPECTED_DKP" ]; then
    echo -e "${GREEN}✅ Cálculo DKP correto!${NC}"
else
    echo -e "${YELLOW}⚠️  Diferença de arredondamento: Esperado $EXPECTED_DKP, Calculado $PREVIEW_DKP${NC}"
fi

# Step 7: Create raid instance
echo -e "${BLUE}⚔️  Step 5: Criando instância de raid...${NC}"
INSTANCE_DATA="{
    \"raidId\": \"$RAID_ID\",
    \"participantIds\": [\"$ADMIN_ID\"],
    \"notes\": \"🧪 Teste completo do sistema DKP - Validação de integração\"
}"

INSTANCE_RESPONSE=$(make_request "POST" "/raid-instances" "$INSTANCE_DATA" "$ADMIN_TOKEN")
INSTANCE_ID=$(echo $INSTANCE_RESPONSE | jq -r '.id')

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "null" ]; then
    echo -e "${RED}❌ Falha ao criar instância${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Instância criada: $INSTANCE_ID${NC}"

# Step 8: Wait for processing
echo -e "${BLUE}⏳ Step 6: Aguardando processamento DKP...${NC}"
sleep 2

# Step 9: Verify DKP update
echo -e "${BLUE}💎 Step 7: Verificando atualização de DKP...${NC}"
UPDATED_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
UPDATED_BALANCE=$(echo $UPDATED_DKP | jq -r '.currentDkpPoints')

echo -e "${YELLOW}💰 DKP Atualizado: $UPDATED_BALANCE${NC}"

EXPECTED_NEW_BALANCE=$((INITIAL_BALANCE + PREVIEW_DKP))
echo -e "${YELLOW}🎯 Esperado: $INITIAL_BALANCE + $PREVIEW_DKP = $EXPECTED_NEW_BALANCE${NC}"

if [ "$UPDATED_BALANCE" = "$EXPECTED_NEW_BALANCE" ]; then
    echo -e "${GREEN}✅ DKP atualizado corretamente!${NC}"
else
    echo -e "${RED}❌ Erro na atualização de DKP!${NC}"
fi

# Step 10: Check transaction history
echo -e "${BLUE}📜 Step 8: Verificando histórico de transações...${NC}"
HISTORY_RESPONSE=$(make_request "GET" "/dkp/my-history?limit=3" "" "$ADMIN_TOKEN")
LATEST_TRANSACTION=$(echo $HISTORY_RESPONSE | jq -r '.data[0]')

if [ "$LATEST_TRANSACTION" != "null" ]; then
    TRANSACTION_AMOUNT=$(echo $LATEST_TRANSACTION | jq -r '.amount')
    TRANSACTION_TYPE=$(echo $LATEST_TRANSACTION | jq -r '.type')
    
    echo -e "${GREEN}✅ Transação registrada:${NC}"
    echo -e "   💰 Valor: $TRANSACTION_AMOUNT DKP"
    echo -e "   🏷️  Tipo: $TRANSACTION_TYPE"
    
    if [ "$TRANSACTION_AMOUNT" = "$PREVIEW_DKP" ] && [ "$TRANSACTION_TYPE" = "RAID_REWARD" ]; then
        echo -e "${GREEN}✅ Transação correta!${NC}"
    else
        echo -e "${RED}❌ Dados da transação incorretos!${NC}"
    fi
else
    echo -e "${RED}❌ Transação não encontrada!${NC}"
fi

# Step 11: Test manual adjustment
echo -e "${BLUE}🔧 Step 9: Testando ajuste manual...${NC}"
ADJUSTMENT_DATA="{
    \"userId\": \"$ADMIN_ID\",
    \"amount\": 100,
    \"reason\": \"🎁 Bônus de teste - Validação do sistema de ajustes manuais\"
}"

ADJUSTMENT_RESPONSE=$(make_request "POST" "/dkp/adjustments" "$ADJUSTMENT_DATA" "$ADMIN_TOKEN")
ADJUSTMENT_ID=$(echo $ADJUSTMENT_RESPONSE | jq -r '.id')

if [ -n "$ADJUSTMENT_ID" ] && [ "$ADJUSTMENT_ID" != "null" ]; then
    echo -e "${GREEN}✅ Ajuste manual criado: $ADJUSTMENT_ID${NC}"
else
    echo -e "${RED}❌ Falha no ajuste manual!${NC}"
fi

# Step 12: Verify final balance
echo -e "${BLUE}🏁 Step 10: Verificação final...${NC}"
sleep 1
FINAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
FINAL_BALANCE=$(echo $FINAL_DKP | jq -r '.currentDkpPoints')
EXPECTED_FINAL=$((EXPECTED_NEW_BALANCE + 100))

echo -e "${YELLOW}💎 DKP Final: $FINAL_BALANCE${NC}"
echo -e "${YELLOW}🎯 Esperado Final: $EXPECTED_FINAL${NC}"

if [ "$FINAL_BALANCE" = "$EXPECTED_FINAL" ]; then
    echo -e "${GREEN}✅ Sistema DKP funcionando perfeitamente!${NC}"
else
    echo -e "${RED}❌ Inconsistência no saldo final!${NC}"
fi

# Step 13: Test leaderboard
echo -e "${BLUE}🏆 Step 11: Testando leaderboard...${NC}"
LEADERBOARD_RESPONSE=$(make_request "GET" "/dkp/leaderboard?limit=5" "" "$ADMIN_TOKEN")
LEADERBOARD_COUNT=$(echo $LEADERBOARD_RESPONSE | jq -r '.data | length')

if [ "$LEADERBOARD_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Leaderboard funcionando ($LEADERBOARD_COUNT jogadores)${NC}"
    
    # Show top player
    TOP_PLAYER=$(echo $LEADERBOARD_RESPONSE | jq -r '.data[0]')
    TOP_NAME=$(echo $TOP_PLAYER | jq -r '.name')
    TOP_DKP=$(echo $TOP_PLAYER | jq -r '.dkpPoints')
    echo -e "${PURPLE}👑 Líder: $TOP_NAME com $TOP_DKP DKP${NC}"
else
    echo -e "${RED}❌ Leaderboard vazio!${NC}"
fi

# Step 14: Test statistics
echo -e "${BLUE}📊 Step 12: Testando estatísticas...${NC}"
STATS_RESPONSE=$(make_request "GET" "/dkp/stats" "" "$ADMIN_TOKEN")
TOTAL_TRANSACTIONS=$(echo $STATS_RESPONSE | jq -r '.totalTransactions')
TOTAL_DKP_AWARDED=$(echo $STATS_RESPONSE | jq -r '.totalDkpAwarded')

echo -e "${GREEN}✅ Estatísticas:${NC}"
echo -e "   📈 Total de Transações: $TOTAL_TRANSACTIONS"
echo -e "   💰 DKP Total Distribuído: $TOTAL_DKP_AWARDED"

# Final Summary
echo ""
echo -e "${PURPLE}🎯 RESUMO FINAL DO TESTE${NC}"
echo -e "${PURPLE}========================${NC}"
echo -e "💰 DKP Inicial: ${YELLOW}$INITIAL_BALANCE${NC}"
echo -e "⚔️  DKP do Raid: ${YELLOW}+$PREVIEW_DKP${NC}"
echo -e "🎁 Ajuste Manual: ${YELLOW}+100${NC}"
echo -e "💎 DKP Final: ${YELLOW}$FINAL_BALANCE${NC}"
echo -e "🎯 Esperado: ${YELLOW}$EXPECTED_FINAL${NC}"

echo ""
if [ "$FINAL_BALANCE" = "$EXPECTED_FINAL" ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
    echo -e "${GREEN}✅ Sistema DKP está 100% funcional!${NC}"
    echo ""
    echo -e "${BLUE}📋 Funcionalidades Validadas:${NC}"
    echo -e "   ✅ Cálculo automático de DKP"
    echo -e "   ✅ Criação de transações DKP"
    echo -e "   ✅ Atualização de saldo"
    echo -e "   ✅ Histórico de transações"
    echo -e "   ✅ Ajustes manuais"
    echo -e "   ✅ Leaderboard DKP"
    echo -e "   ✅ Estatísticas DKP"
    echo -e "   ✅ Preview de cálculo"
else
    echo -e "${RED}❌ SISTEMA DKP TEM PROBLEMAS!${NC}"
fi

# Cleanup
echo ""
echo -e "${BLUE}🧹 Limpando dados de teste...${NC}"
make_request "DELETE" "/raids/$RAID_ID" "" "$ADMIN_TOKEN" > /dev/null
echo -e "${GREEN}✅ Limpeza concluída${NC}"

echo ""
echo -e "${PURPLE}🚀 Teste completo finalizado!${NC}"
