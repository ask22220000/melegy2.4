#!/bin/bash

# Quick Security Verification Script
# Run this after implementing security changes

echo "🔐 Melegy Security Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Test 1: Middleware exists
echo -n "✓ Checking middleware.ts... "
if [ -f "middleware.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 2: Security modules exist
echo -n "✓ Checking secure-api-keys.ts... "
if [ -f "lib/server/secure-api-keys.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

echo -n "✓ Checking security-utils.ts... "
if [ -f "lib/server/security-utils.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

echo -n "✓ Checking api-wrapper.ts... "
if [ -f "lib/server/api-wrapper.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

echo -n "✓ Checking secure-logger.ts... "
if [ -f "lib/server/secure-logger.ts" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 3: Documentation exists
echo -n "✓ Checking SECURITY documentation... "
if [ -f "SECURITY_README.md" ] && [ -f "SECURITY_SUMMARY.md" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 4: Scripts exist
echo -n "✓ Checking security-audit script... "
if [ -f "scripts/security-audit.js" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 5: .env.example exists
echo -n "✓ Checking .env.example template... "
if [ -f ".env.example" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 6: Source maps disabled in config
echo -n "✓ Checking source maps disabled... "
if grep -q "productionBrowserSourceMaps: false" next.config.mjs; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 7: .gitignore protection
echo -n "✓ Checking .gitignore has .env.local... "
if grep -q ".env.local" .gitignore; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAIL++))
fi

# Test 8: No process.env in components
echo -n "✓ Checking no process.env in components... "
FOUND=$(grep -r "process\.env" components/ 2>/dev/null | wc -l)
if [ "$FOUND" -eq 0 ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}WARNING${NC} (Found $FOUND references)"
    ((FAIL++))
fi

echo ""
echo "================================"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm run security-audit"
    echo "2. npm run build"
    echo "3. npm run start"
    exit 0
else
    echo -e "${RED}⚠️ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi
