#!/bin/bash

# Simple DKP Test - Using Admin User Only
echo "🧪 Testing DKP System - Simple Test with Admin"
echo "=============================================="

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

# Step 2: Get Admin user info
echo -e "${BLUE}Step 2: Getting admin user info...${NC}"
ADMIN_INFO=$(make_request "GET" "/users/me" "" "$ADMIN_TOKEN")
ADMIN_ID=$(echo $ADMIN_INFO | jq -r '.id // empty')
ADMIN_GEAR_SCORE=$(echo $ADMIN_INFO | jq -r '.gearScore // 0')

echo -e "${YELLOW}Admin ID: $ADMIN_ID${NC}"
echo -e "${YELLOW}Admin Gear Score: $ADMIN_GEAR_SCORE${NC}"

# Step 3: Check initial DKP balance
echo -e "${BLUE}Step 3: Checking initial DKP balance...${NC}"
INITIAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
echo -e "${YELLOW}Initial DKP Summary:${NC}"
echo $INITIAL_DKP | jq '.'

INITIAL_BALANCE=$(echo $INITIAL_DKP | jq -r '.currentDkpPoints // 0')
echo -e "${YELLOW}Initial DKP Balance: $INITIAL_BALANCE${NC}"

# Step 4: Create a test raid
echo -e "${BLUE}Step 4: Creating test raid...${NC}"
TIMESTAMP=$(date +%s)
RAID_DATA="{
    \"name\": \"DKP Test Raid - Dragon $TIMESTAMP\",
    \"bossLevel\": 75,
    \"baseScore\": 400,
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

# Calculate expected DKP: (Boss Level × Gear Score) ÷ 100
EXPECTED_DKP=$(echo "scale=0; (75 * $ADMIN_GEAR_SCORE) / 100" | bc)
echo -e "${YELLOW}Expected DKP Calculation: (75 × $ADMIN_GEAR_SCORE) ÷ 100 = $EXPECTED_DKP${NC}"

# Step 5: Preview DKP calculation
echo -e "${BLUE}Step 5: Testing DKP preview calculation...${NC}"
PREVIEW_DATA="{\"raidId\": \"$RAID_ID\", \"participantIds\": [\"$ADMIN_ID\"]}"
PREVIEW_RESPONSE=$(make_request "POST" "/raid-instances/preview-dkp" "$PREVIEW_DATA" "$ADMIN_TOKEN")

echo -e "${YELLOW}DKP Preview Response:${NC}"
echo $PREVIEW_RESPONSE | jq '.'

PREVIEW_DKP=$(echo $PREVIEW_RESPONSE | jq -r '.participants[0].dkpAwarded // 0')
echo -e "${YELLOW}Preview DKP for admin: $PREVIEW_DKP${NC}"

# Verify calculation
if [ "$PREVIEW_DKP" = "$EXPECTED_DKP" ]; then
    echo -e "${GREEN}✅ DKP calculation is correct!${NC}"
else
    echo -e "${RED}❌ DKP calculation is incorrect!${NC}"
    echo -e "${RED}Expected: $EXPECTED_DKP, Got: $PREVIEW_DKP${NC}"
fi

# Step 6: Create raid instance with admin as participant
echo -e "${BLUE}Step 6: Creating raid instance...${NC}"
INSTANCE_DATA="{
    \"raidId\": \"$RAID_ID\",
    \"participantIds\": [\"$ADMIN_ID\"],
    \"notes\": \"DKP system test - admin self-participation\"
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

# Step 7: Wait for transaction processing
echo -e "${BLUE}Step 7: Waiting for DKP transaction processing...${NC}"
sleep 2

# Step 8: Check updated DKP balance
echo -e "${BLUE}Step 8: Checking updated DKP balance...${NC}"
UPDATED_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
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

# Step 9: Check DKP transaction history
echo -e "${BLUE}Step 9: Checking DKP transaction history...${NC}"
HISTORY_RESPONSE=$(make_request "GET" "/dkp/my-history?limit=5" "" "$ADMIN_TOKEN")
echo -e "${YELLOW}Recent DKP Transactions:${NC}"
echo $HISTORY_RESPONSE | jq '.'

# Step 10: Test manual DKP adjustment
echo -e "${BLUE}Step 10: Testing manual DKP adjustment...${NC}"
ADJUSTMENT_DATA="{
    \"userId\": \"$ADMIN_ID\",
    \"amount\": 25,
    \"reason\": \"Test manual adjustment - bonus points\"
}"

ADJUSTMENT_RESPONSE=$(make_request "POST" "/dkp/adjustments" "$ADJUSTMENT_DATA" "$ADMIN_TOKEN")
echo -e "${YELLOW}Manual Adjustment Response:${NC}"
echo $ADJUSTMENT_RESPONSE | jq '.'

# Step 11: Verify manual adjustment
echo -e "${BLUE}Step 11: Verifying manual adjustment...${NC}"
sleep 1
FINAL_DKP=$(make_request "GET" "/dkp/my-summary" "" "$ADMIN_TOKEN")
FINAL_BALANCE=$(echo $FINAL_DKP | jq -r '.currentDkpPoints // 0')
EXPECTED_FINAL_BALANCE=$((EXPECTED_NEW_BALANCE + 25))

echo -e "${YELLOW}Final DKP Balance: $FINAL_BALANCE${NC}"
echo -e "${YELLOW}Expected Final Balance: $EXPECTED_FINAL_BALANCE${NC}"

if [ "$FINAL_BALANCE" = "$EXPECTED_FINAL_BALANCE" ]; then
    echo -e "${GREEN}✅ Manual DKP adjustment worked correctly!${NC}"
else
    echo -e "${RED}❌ Manual DKP adjustment failed!${NC}"
fi

# Step 12: Test DKP leaderboard
echo -e "${BLUE}Step 12: Testing DKP leaderboard...${NC}"
LEADERBOARD_RESPONSE=$(make_request "GET" "/dkp/leaderboard?limit=10" "" "$ADMIN_TOKEN")
echo -e "${YELLOW}DKP Leaderboard:${NC}"
echo $LEADERBOARD_RESPONSE | jq '.'

# Step 13: Test DKP stats
echo -e "${BLUE}Step 13: Testing DKP statistics...${NC}"
STATS_RESPONSE=$(make_request "GET" "/dkp/stats" "" "$ADMIN_TOKEN")
echo -e "${YELLOW}DKP Statistics:${NC}"
echo $STATS_RESPONSE | jq '.'

# Summary
echo ""
echo "🎯 DKP SYSTEM TEST SUMMARY"
echo "=========================="
echo -e "Initial Balance: ${YELLOW}$INITIAL_BALANCE${NC}"
echo -e "Raid DKP Earned: ${YELLOW}$EXPECTED_DKP${NC}"
echo -e "Manual Adjustment: ${YELLOW}+25${NC}"
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
