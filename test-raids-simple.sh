#!/bin/bash

# Simple API Testing Script for Raids and Raid Instances
BASE_URL="http://localhost:3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
ADMIN_TOKEN=""
PLAYER_TOKEN=""
RAID_ID=""
RAID_INSTANCE_ID=""

print_step "Starting API Tests for Raids and Raid Instances"

# 1. Login as Admin
print_step "1. Login as Admin"
admin_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lineage.com","password":"admin123456"}')

echo "$admin_response" | jq '.'
ADMIN_TOKEN=$(echo "$admin_response" | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    print_success "Admin login successful"
else
    print_error "Admin login failed"
    exit 1
fi

# 2. Login as Player
print_step "2. Login as Player"
player_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"player@lineage.com","password":"player123456"}')

echo "$player_response" | jq '.'
PLAYER_TOKEN=$(echo "$player_response" | jq -r '.token')

if [ "$PLAYER_TOKEN" != "null" ] && [ -n "$PLAYER_TOKEN" ]; then
    print_success "Player login successful"
else
    print_error "Player login failed"
    exit 1
fi

# 3. Get Users
print_step "3. Get Users"
users_response=$(curl -s -X GET "$BASE_URL/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$users_response" | jq '.'
USER_IDS=($(echo "$users_response" | jq -r '.data[].id'))

if [ ${#USER_IDS[@]} -gt 0 ]; then
    print_success "Found ${#USER_IDS[@]} users"
    echo "User IDs: ${USER_IDS[@]}"
else
    print_error "No users found"
    exit 1
fi

echo ""
print_step "=== RAIDS API TESTS ==="

# 4. Create Raid
print_step "4. Create Raid"
raid_response=$(curl -s -X POST "$BASE_URL/raids" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "name": "Antharas Test Raid",
        "bossLevel": 85,
        "baseScore": 500
    }')

echo "$raid_response" | jq '.'
RAID_ID=$(echo "$raid_response" | jq -r '.id')

if [ "$RAID_ID" != "null" ] && [ -n "$RAID_ID" ]; then
    print_success "Raid created successfully - ID: $RAID_ID"
else
    print_error "Failed to create raid"
fi

# 5. Get All Raids
print_step "5. Get All Raids"
raids_response=$(curl -s -X GET "$BASE_URL/raids" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$raids_response" | jq '.'

# 6. Get Active Raids
print_step "6. Get Active Raids"
active_raids_response=$(curl -s -X GET "$BASE_URL/raids/active" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$active_raids_response" | jq '.'

# 7. Get Raid by ID
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ]; then
    print_step "7. Get Raid by ID"
    raid_by_id_response=$(curl -s -X GET "$BASE_URL/raids/$RAID_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$raid_by_id_response" | jq '.'
fi

# 8. Update Raid
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ]; then
    print_step "8. Update Raid"
    update_raid_response=$(curl -s -X PUT "$BASE_URL/raids/$RAID_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "name": "Antharas Test Raid Updated",
            "bossLevel": 85,
            "baseScore": 600
        }')
    
    echo "$update_raid_response" | jq '.'
fi

# 9. Get Raid Stats
print_step "9. Get Raid Stats"
raid_stats_response=$(curl -s -X GET "$BASE_URL/raids/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$raid_stats_response" | jq '.'

echo ""
print_step "=== RAID INSTANCES API TESTS ==="

# 10. Create Raid Instance
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ] && [ ${#USER_IDS[@]} -ge 2 ]; then
    print_step "10. Create Raid Instance"
    
    # Use first 2 users as participants
    participant_ids=$(printf '"%s",' "${USER_IDS[@]:0:2}")
    participant_ids="[${participant_ids%,}]"
    
    instance_response=$(curl -s -X POST "$BASE_URL/raid-instances" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"raidId\": \"$RAID_ID\",
            \"participantIds\": $participant_ids,
            \"notes\": \"Test raid instance with 2 participants\"
        }")
    
    echo "$instance_response" | jq '.'
    RAID_INSTANCE_ID=$(echo "$instance_response" | jq -r '.id')
    
    if [ "$RAID_INSTANCE_ID" != "null" ] && [ -n "$RAID_INSTANCE_ID" ]; then
        print_success "Raid instance created successfully - ID: $RAID_INSTANCE_ID"
    else
        print_error "Failed to create raid instance"
    fi
fi

# 11. Get All Raid Instances
print_step "11. Get All Raid Instances"
instances_response=$(curl -s -X GET "$BASE_URL/raid-instances" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$instances_response" | jq '.'

# 12. Get Recent Raid Instances
print_step "12. Get Recent Raid Instances"
recent_instances_response=$(curl -s -X GET "$BASE_URL/raid-instances/recent" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$recent_instances_response" | jq '.'

# 13. Get Raid Instance by ID
if [ -n "$RAID_INSTANCE_ID" ] && [ "$RAID_INSTANCE_ID" != "null" ]; then
    print_step "13. Get Raid Instance by ID"
    instance_by_id_response=$(curl -s -X GET "$BASE_URL/raid-instances/$RAID_INSTANCE_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$instance_by_id_response" | jq '.'
fi

# 14. Get Raid Instance Stats
print_step "14. Get Raid Instance Stats"
instance_stats_response=$(curl -s -X GET "$BASE_URL/raid-instances/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$instance_stats_response" | jq '.'

# 15. Preview DKP Calculation
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ] && [ ${#USER_IDS[@]} -ge 2 ]; then
    print_step "15. Preview DKP Calculation"
    
    participant_ids=$(printf '"%s",' "${USER_IDS[@]:0:2}")
    participant_ids="[${participant_ids%,}]"
    
    preview_response=$(curl -s -X POST "$BASE_URL/raid-instances/preview-dkp" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{
            \"raidId\": \"$RAID_ID\",
            \"participantIds\": $participant_ids
        }")
    
    echo "$preview_response" | jq '.'
fi

echo ""
print_step "=== PERMISSION TESTS ==="

# 16. Test Player Access (Should Fail)
print_step "16. Test Player Access to Admin Endpoints (Should Fail)"

echo "Testing player access to create raid:"
player_raid_response=$(curl -s -X POST "$BASE_URL/raids" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $PLAYER_TOKEN" \
    -d '{
        "name": "Player Raid Test",
        "bossLevel": 50,
        "baseScore": 300
    }')

echo "$player_raid_response" | jq '.'

# 17. Test Player Read Access (Should Work)
print_step "17. Test Player Read Access (Should Work)"

echo "Testing player access to get raids:"
player_raids_response=$(curl -s -X GET "$BASE_URL/raids" \
    -H "Authorization: Bearer $PLAYER_TOKEN")

echo "$player_raids_response" | jq '.'

echo ""
print_step "=== CLEANUP ==="

# 18. Deactivate Raid
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ]; then
    print_step "18. Deactivate Raid"
    deactivate_response=$(curl -s -X PATCH "$BASE_URL/raids/$RAID_ID/deactivate" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$deactivate_response" | jq '.'
fi

# 19. Activate Raid
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ]; then
    print_step "19. Activate Raid"
    activate_response=$(curl -s -X PATCH "$BASE_URL/raids/$RAID_ID/activate" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$activate_response" | jq '.'
fi

# 20. Delete Raid Instance
if [ -n "$RAID_INSTANCE_ID" ] && [ "$RAID_INSTANCE_ID" != "null" ]; then
    print_step "20. Delete Raid Instance"
    delete_instance_response=$(curl -s -X DELETE "$BASE_URL/raid-instances/$RAID_INSTANCE_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$delete_instance_response" | jq '.'
fi

# 21. Delete Raid
if [ -n "$RAID_ID" ] && [ "$RAID_ID" != "null" ]; then
    print_step "21. Delete Raid"
    delete_raid_response=$(curl -s -X DELETE "$BASE_URL/raids/$RAID_ID" \
        -H "Authorization: Bearer $ADMIN_TOKEN")
    
    echo "$delete_raid_response" | jq '.'
fi

print_step "API Tests Completed!"
print_success "All tests have been executed. Check the responses above for any errors."
