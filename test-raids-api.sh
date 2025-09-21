#!/bin/bash

# API Testing Script for Raids and Raid Instances
# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to make API calls and show response
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4

    echo -e "${YELLOW}$method $endpoint${NC}"
    if [ -n "$data" ]; then
        echo -e "${YELLOW}Data: $data${NC}"
    fi

    if [ -n "$headers" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data")
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json")
        fi
    fi

    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
}

# Variables to store tokens and IDs
ADMIN_TOKEN=""
PLAYER_TOKEN=""
RAID_ID=""
RAID_INSTANCE_ID=""
USER_IDS=()

print_step "Starting API Tests for Raids and Raid Instances"

# 1. Login as Admin
print_step "1. Login as Admin"
admin_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lineage.com","password":"admin123456"}')

echo -e "${GREEN}Response:${NC}"
echo "$admin_response" | jq '.' 2>/dev/null || echo "$admin_response"
echo ""

ADMIN_TOKEN=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    print_success "Admin login successful"
    echo "Admin Token: $ADMIN_TOKEN"
else
    print_error "Admin login failed"
    exit 1
fi

# 2. Login as Player
print_step "2. Login as Player"
player_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"player@lineage.com","password":"player123456"}')

echo -e "${GREEN}Response:${NC}"
echo "$player_response" | jq '.' 2>/dev/null || echo "$player_response"
echo ""

PLAYER_TOKEN=$(echo "$player_response" | jq -r '.token' 2>/dev/null)

if [ "$PLAYER_TOKEN" != "null" ] && [ -n "$PLAYER_TOKEN" ]; then
    print_success "Player login successful"
    echo "Player Token: $PLAYER_TOKEN"
else
    print_error "Player login failed"
    exit 1
fi

# 3. Get all users (to get user IDs for raid instances)
print_step "3. Get Users for Raid Participants"
users_response=$(curl -s -X GET "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo -e "${GREEN}Response:${NC}"
echo "$users_response" | jq '.' 2>/dev/null || echo "$users_response"
echo ""

USER_IDS=($(echo "$users_response" | jq -r '.data[].id' 2>/dev/null))

if [ ${#USER_IDS[@]} -gt 0 ]; then
    print_success "Found ${#USER_IDS[@]} users"
    echo "User IDs: ${USER_IDS[@]}"
else
    print_error "No users found"
    exit 1
fi

echo ""
print_step "=== RAIDS API TESTS ==="

# 4. Create a new raid (Admin only)
print_step "4. Create New Raid"
raid_data='{
    "name": "Antharas Raid",
    "bossLevel": 85,
    "baseScore": 500
}'
raid_response=$(api_call "POST" "/raids" "$raid_data" "Authorization: Bearer $ADMIN_TOKEN")
RAID_ID=$(echo "$raid_response" | jq -r '.id' 2>/dev/null)

if [ "$RAID_ID" != "null" ] && [ -n "$RAID_ID" ]; then
    print_success "Raid created successfully"
    echo "Raid ID: $RAID_ID"
else
    print_error "Failed to create raid"
fi

# 5. Get all raids
print_step "5. Get All Raids"
api_call "GET" "/raids" "" "Authorization: Bearer $ADMIN_TOKEN"

# 6. Get active raids
print_step "6. Get Active Raids"
api_call "GET" "/raids/active" "" "Authorization: Bearer $ADMIN_TOKEN"

# 7. Get raid by ID
print_step "7. Get Raid by ID"
if [ -n "$RAID_ID" ]; then
    api_call "GET" "/raids/$RAID_ID" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID available"
fi

# 8. Update raid (Admin only)
print_step "8. Update Raid"
if [ -n "$RAID_ID" ]; then
    update_data='{
        "name": "Antharas Raid Updated",
        "bossLevel": 85,
        "baseScore": 600
    }'
    api_call "PUT" "/raids/$RAID_ID" "$update_data" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID available"
fi

# 9. Get raid stats
print_step "9. Get Raid Stats"
api_call "GET" "/raids/stats" "" "Authorization: Bearer $ADMIN_TOKEN"

echo ""
print_step "=== RAID INSTANCES API TESTS ==="

# 10. Create raid instance (Admin only)
print_step "10. Create Raid Instance"
if [ -n "$RAID_ID" ] && [ ${#USER_IDS[@]} -ge 2 ]; then
    # Use first 2 users as participants
    participant_ids=$(printf '"%s",' "${USER_IDS[@]:0:2}")
    participant_ids="[${participant_ids%,}]"

    instance_data="{
        \"raidId\": \"$RAID_ID\",
        \"participantIds\": $participant_ids,
        \"notes\": \"Test raid instance with 2 participants\"
    }"

    instance_response=$(api_call "POST" "/raid-instances" "$instance_data" "Authorization: Bearer $ADMIN_TOKEN")
    RAID_INSTANCE_ID=$(echo "$instance_response" | jq -r '.id' 2>/dev/null)

    if [ "$RAID_INSTANCE_ID" != "null" ] && [ -n "$RAID_INSTANCE_ID" ]; then
        print_success "Raid instance created successfully"
        echo "Raid Instance ID: $RAID_INSTANCE_ID"
    else
        print_error "Failed to create raid instance"
    fi
else
    print_warning "Skipping - no raid ID or insufficient users"
fi

# 11. Get all raid instances
print_step "11. Get All Raid Instances"
api_call "GET" "/raid-instances" "" "Authorization: Bearer $ADMIN_TOKEN"

# 12. Get recent raid instances
print_step "12. Get Recent Raid Instances"
api_call "GET" "/raid-instances/recent" "" "Authorization: Bearer $ADMIN_TOKEN"

# 13. Get raid instance by ID
print_step "13. Get Raid Instance by ID"
if [ -n "$RAID_INSTANCE_ID" ]; then
    api_call "GET" "/raid-instances/$RAID_INSTANCE_ID" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid instance ID available"
fi

# 14. Get raid instances stats
print_step "14. Get Raid Instances Stats"
api_call "GET" "/raid-instances/stats" "" "Authorization: Bearer $ADMIN_TOKEN"

# 15. Preview DKP calculation
print_step "15. Preview DKP Calculation"
if [ -n "$RAID_ID" ] && [ ${#USER_IDS[@]} -ge 2 ]; then
    participant_ids=$(printf '"%s",' "${USER_IDS[@]:0:2}")
    participant_ids="[${participant_ids%,}]"

    preview_data="{
        \"raidId\": \"$RAID_ID\",
        \"participantIds\": $participant_ids
    }"

    api_call "POST" "/raid-instances/preview-dkp" "$preview_data" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID or insufficient users"
fi

echo ""
print_step "=== PERMISSION TESTS ==="

# 16. Test player access to admin endpoints (should fail)
print_step "16. Test Player Access to Admin Endpoints (Should Fail)"

print_warning "Testing player access to create raid (should fail):"
api_call "POST" "/raids" "$raid_data" "Authorization: Bearer $PLAYER_TOKEN"

print_warning "Testing player access to create raid instance (should fail):"
if [ -n "$RAID_ID" ] && [ ${#USER_IDS[@]} -ge 2 ]; then
    participant_ids=$(printf '"%s",' "${USER_IDS[@]:0:2}")
    participant_ids="[${participant_ids%,}]"

    instance_data="{
        \"raidId\": \"$RAID_ID\",
        \"participantIds\": $participant_ids,
        \"notes\": \"Test from player - should fail\"
    }"

    api_call "POST" "/raid-instances" "$instance_data" "Authorization: Bearer $PLAYER_TOKEN"
fi

# 17. Test player access to read endpoints (should work)
print_step "17. Test Player Access to Read Endpoints (Should Work)"

print_success "Testing player access to get raids:"
api_call "GET" "/raids" "" "Authorization: Bearer $PLAYER_TOKEN"

print_success "Testing player access to get raid instances:"
api_call "GET" "/raid-instances" "" "Authorization: Bearer $PLAYER_TOKEN"

echo ""
print_step "=== CLEANUP TESTS ==="

# 18. Deactivate raid
print_step "18. Deactivate Raid"
if [ -n "$RAID_ID" ]; then
    api_call "PATCH" "/raids/$RAID_ID/deactivate" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID available"
fi

# 19. Activate raid
print_step "19. Activate Raid"
if [ -n "$RAID_ID" ]; then
    api_call "PATCH" "/raids/$RAID_ID/activate" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID available"
fi

# 20. Delete raid instance
print_step "20. Delete Raid Instance"
if [ -n "$RAID_INSTANCE_ID" ]; then
    api_call "DELETE" "/raid-instances/$RAID_INSTANCE_ID" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid instance ID available"
fi

# 21. Delete raid
print_step "21. Delete Raid"
if [ -n "$RAID_ID" ]; then
    api_call "DELETE" "/raids/$RAID_ID" "" "Authorization: Bearer $ADMIN_TOKEN"
else
    print_warning "Skipping - no raid ID available"
fi

print_step "API Tests Completed!"
print_success "All tests have been executed. Check the responses above for any errors."
