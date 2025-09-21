#!/bin/bash

# Test DKP System - Complete Flow Test
echo "🧪 Testing DKP System - Complete Flow"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
echo -e "${BLUE}Step 1: Authenticating as Admin...${NC}"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lineage.com","password":"admin123456"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.token // empty')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to authenticate as admin${NC}"
    echo "Response: $ADMIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Admin authenticated successfully${NC}"

# Step 2: Login as Player
echo -e "${BLUE}Step 2: Authenticating as Player...${NC}"
PLAYER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"player@lineage.com","password":"player123456"}')

PLAYER_TOKEN=$(echo $PLAYER_RESPONSE | jq -r '.token // empty')

if [ -z "$PLAYER_TOKEN" ] || [ "$PLAYER_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to authenticate as player${NC}"
    echo "Response: $PLAYER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Player authenticated successfully${NC}"

# Step 3: Get Player ID for testing
echo -e "${BLUE}Step 3: Getting player information...${NC}"
PLAYER_INFO_RESPONSE=$(make_request "GET" "/users/me" "" "$PLAYER_TOKEN")
PLAYER_ID=$(echo $PLAYER_INFO_RESPONSE | jq -r '.id // empty')
if [ -z "$PLAYER_ID" ] || [ "$PLAYER_ID" = "null" ]; then
    echo -e "${RED}❌ Failed to get player ID${NC}"
    echo "Player Info Response: $PLAYER_INFO_RESPONSE"
    exit 1
fi
echo -e "${YELLOW}Player ID: $PLAYER_ID${NC}"

# Step 4: Check initial DKP balance
echo -e "${BLUE}Step 4: Checking initial DKP balance...${NC}"
INITIAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$PLAYER_TOKEN")
echo -e "${YELLOW}Initial DKP Summary:${NC}"
echo $INITIAL_DKP | jq '.'

INITIAL_BALANCE=$(echo $INITIAL_DKP | jq -r '.currentDkpPoints // 0')
echo -e "${YELLOW}Initial DKP Balance: $INITIAL_BALANCE${NC}"

# Step 5: Create a test raid
echo -e "${BLUE}Step 5: Creating test raid...${NC}"
TIMESTAMP=$(date +%s)
RAID_DATA="{
    \"name\": \"DKP Test Raid - Ancient Dragon $TIMESTAMP\",
    \"bossLevel\": 85,
    \"baseScore\": 500,
    \"description\": \"Test raid for DKP calculation verification\"
}"

RAID_RESPONSE=$(make_request "POST" "/raids" "$RAID_DATA" "$ADMIN_TOKEN")
RAID_ID=$(echo $RAID_RESPONSE | jq -r '.id // empty')

if [ -z "$RAID_ID" ] || [ "$RAID_ID" = "null" ]; then
    echo -e "${RED}❌ Failed to create raid${NC}"
    echo "Response: $RAID_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Raid created successfully${NC}"
echo -e "${YELLOW}Raid ID: $RAID_ID${NC}"

# Step 6: Get player gear score for calculation verification
echo -e "${BLUE}Step 6: Getting player gear score...${NC}"
GEAR_SCORE=$(echo $PLAYER_INFO_RESPONSE | jq -r '.gearScore // 0')
echo -e "${YELLOW}Player Gear Score: $GEAR_SCORE${NC}"

# Calculate expected DKP: (Boss Level × Gear Score) ÷ 100
EXPECTED_DKP=$(echo "scale=0; (85 * $GEAR_SCORE) / 100" | bc)
echo -e "${YELLOW}Expected DKP Calculation: (85 × $GEAR_SCORE) ÷ 100 = $EXPECTED_DKP${NC}"

# Step 7: Preview DKP calculation
echo -e "${BLUE}Step 7: Testing DKP preview calculation...${NC}"
PREVIEW_DATA="{\"raidId\": \"$RAID_ID\", \"participantIds\": [\"$PLAYER_ID\"]}"
PREVIEW_RESPONSE=$(make_request "POST" "/raid-instances/preview-dkp" "$PREVIEW_DATA" "$ADMIN_TOKEN")

echo -e "${YELLOW}DKP Preview Response:${NC}"
echo $PREVIEW_RESPONSE | jq '.'

PREVIEW_DKP=$(echo $PREVIEW_RESPONSE | jq -r '.participants[0].dkpAwarded // 0')
echo -e "${YELLOW}Preview DKP for player: $PREVIEW_DKP${NC}"

# Verify calculation
if [ "$PREVIEW_DKP" = "$EXPECTED_DKP" ]; then
    echo -e "${GREEN}✅ DKP calculation is correct!${NC}"
else
    echo -e "${RED}❌ DKP calculation is incorrect!${NC}"
    echo -e "${RED}Expected: $EXPECTED_DKP, Got: $PREVIEW_DKP${NC}"
fi

# Step 8: Create raid instance with the player
echo -e "${BLUE}Step 8: Creating raid instance...${NC}"
INSTANCE_DATA="{
    \"raidId\": \"$RAID_ID\",
    \"participantIds\": [\"$PLAYER_ID\"],
    \"notes\": \"DKP system test - verifying automatic calculation and distribution\"
}"

INSTANCE_RESPONSE=$(make_request "POST" "/raid-instances" "$INSTANCE_DATA" "$ADMIN_TOKEN")
INSTANCE_ID=$(echo $INSTANCE_RESPONSE | jq -r '.id // empty')

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "null" ]; then
    echo -e "${RED}❌ Failed to create raid instance${NC}"
    echo "Response: $INSTANCE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Raid instance created successfully${NC}"
echo -e "${YELLOW}Instance ID: $INSTANCE_ID${NC}"

# Step 9: Wait a moment for transaction processing
echo -e "${BLUE}Step 8: Waiting for DKP transaction processing...${NC}"
sleep 2

# Step 10: Check updated DKP balance
echo -e "${BLUE}Step 9: Checking updated DKP balance...${NC}"
UPDATED_DKP=$(make_request "GET" "/dkp/my-summary" "" "$PLAYER_TOKEN")
echo -e "${YELLOW}Updated DKP Summary:${NC}"
echo $UPDATED_DKP | jq '.'

UPDATED_BALANCE=$(echo $UPDATED_DKP | jq -r '.currentDkpPoints // 0')
echo -e "${YELLOW}Updated DKP Balance: $UPDATED_BALANCE${NC}"

# Calculate expected new balance
EXPECTED_NEW_BALANCE=$((INITIAL_BALANCE + EXPECTED_DKP))
echo -e "${YELLOW}Expected New Balance: $INITIAL_BALANCE + $EXPECTED_DKP = $EXPECTED_NEW_BALANCE${NC}"

# Verify balance update
if [ "$UPDATED_BALANCE" = "$EXPECTED_NEW_BALANCE" ]; then
    echo -e "${GREEN}✅ DKP balance updated correctly!${NC}"
else
    echo -e "${RED}❌ DKP balance update failed!${NC}"
    echo -e "${RED}Expected: $EXPECTED_NEW_BALANCE, Got: $UPDATED_BALANCE${NC}"
fi

# Step 11: Check DKP transaction history
echo -e "${BLUE}Step 10: Checking DKP transaction history...${NC}"
HISTORY_RESPONSE=$(make_request "GET" "/dkp/my-history?limit=5" "" "$PLAYER_TOKEN")
echo -e "${YELLOW}Recent DKP Transactions:${NC}"
echo $HISTORY_RESPONSE | jq '.'

# Step 12: Verify transaction was created
LATEST_TRANSACTION=$(echo $HISTORY_RESPONSE | jq -r '.data[0] // empty')
if [ -n "$LATEST_TRANSACTION" ] && [ "$LATEST_TRANSACTION" != "null" ]; then
    TRANSACTION_AMOUNT=$(echo $LATEST_TRANSACTION | jq -r '.amount // 0')
    TRANSACTION_TYPE=$(echo $LATEST_TRANSACTION | jq -r '.type // ""')
    TRANSACTION_RAID_ID=$(echo $LATEST_TRANSACTION | jq -r '.raidInstance.id // ""')

    echo -e "${YELLOW}Latest Transaction:${NC}"
    echo -e "  Amount: $TRANSACTION_AMOUNT"
    echo -e "  Type: $TRANSACTION_TYPE"
    echo -e "  Raid Instance: $TRANSACTION_RAID_ID"

    if [ "$TRANSACTION_AMOUNT" = "$EXPECTED_DKP" ] && [ "$TRANSACTION_TYPE" = "RAID_REWARD" ] && [ "$TRANSACTION_RAID_ID" = "$INSTANCE_ID" ]; then
        echo -e "${GREEN}✅ DKP transaction created correctly!${NC}"
    else
        echo -e "${RED}❌ DKP transaction has incorrect data!${NC}"
    fi
else
    echo -e "${RED}❌ No DKP transaction found!${NC}"
fi

# Step 13: Test DKP leaderboard
echo -e "${BLUE}Step 11: Testing DKP leaderboard...${NC}"
LEADERBOARD_RESPONSE=$(make_request "GET" "/dkp/leaderboard?limit=10" "" "$PLAYER_TOKEN")
echo -e "${YELLOW}DKP Leaderboard:${NC}"
echo $LEADERBOARD_RESPONSE | jq '.'

# Step 14: Test DKP stats
echo -e "${BLUE}Step 12: Testing DKP statistics...${NC}"
STATS_RESPONSE=$(make_request "GET" "/dkp/stats" "" "$ADMIN_TOKEN")
echo -e "${YELLOW}DKP Statistics:${NC}"
echo $STATS_RESPONSE | jq '.'

# Step 15: Test manual DKP adjustment (Admin only)
echo -e "${BLUE}Step 13: Testing manual DKP adjustment...${NC}"
ADJUSTMENT_DATA="{
    \"userId\": \"$PLAYER_ID\",
    \"amount\": 50,
    \"reason\": \"Test manual adjustment - bonus for excellent performance\"
}"

ADJUSTMENT_RESPONSE=$(make_request "POST" "/dkp/adjustments" "$ADJUSTMENT_DATA" "$ADMIN_TOKEN")
echo -e "${YELLOW}Manual Adjustment Response:${NC}"
echo $ADJUSTMENT_RESPONSE | jq '.'

# Step 16: Verify manual adjustment
echo -e "${BLUE}Step 14: Verifying manual adjustment...${NC}"
sleep 1
FINAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$PLAYER_TOKEN")
FINAL_BALANCE=$(echo $FINAL_DKP | jq -r '.currentDkpPoints // 0')
EXPECTED_FINAL_BALANCE=$((EXPECTED_NEW_BALANCE + 50))

echo -e "${YELLOW}Final DKP Balance: $FINAL_BALANCE${NC}"
echo -e "${YELLOW}Expected Final Balance: $EXPECTED_FINAL_BALANCE${NC}"

if [ "$FINAL_BALANCE" = "$EXPECTED_FINAL_BALANCE" ]; then
    echo -e "${GREEN}✅ Manual DKP adjustment worked correctly!${NC}"
else
    echo -e "${RED}❌ Manual DKP adjustment failed!${NC}"
fi

# Summary
echo ""
echo "🎯 DKP SYSTEM TEST SUMMARY"
echo "=========================="
echo -e "Initial Balance: ${YELLOW}$INITIAL_BALANCE${NC}"
echo -e "Raid DKP Earned: ${YELLOW}$EXPECTED_DKP${NC}"
echo -e "Manual Adjustment: ${YELLOW}+50${NC}"
echo -e "Final Balance: ${YELLOW}$FINAL_BALANCE${NC}"
echo -e "Expected Final: ${YELLOW}$EXPECTED_FINAL_BALANCE${NC}"

if [ "$FINAL_BALANCE" = "$EXPECTED_FINAL_BALANCE" ]; then
    echo -e "${GREEN}🎉 ALL DKP SYSTEM TESTS PASSED!${NC}"
else
    echo -e "${RED}❌ DKP SYSTEM HAS ISSUES!${NC}"
fi

# Cleanup
echo -e "${BLUE}Cleaning up test data...${NC}"
make_request "DELETE" "/raids/$RAID_ID" "" "$ADMIN_TOKEN" > /dev/null
echo -e "${GREEN}✅ Cleanup completed${NC}"
