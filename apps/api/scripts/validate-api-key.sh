#!/bin/bash

# Script to validate OpenRouter API key
#
# Usage:
#   ./apps/api/scripts/validate-api-key.sh <model> <api-key>
#
# Example:
#   ./apps/api/scripts/validate-api-key.sh "x-ai/grok-4.1-fast:free" "sk-or-v1-xxx"

set -e

# Check arguments
if [ $# -lt 2 ]; then
    echo "❌ Error: Missing required arguments"
    echo ""
    echo "Usage:"
    echo "  ./apps/api/scripts/validate-api-key.sh <model> <api-key>"
    echo ""
    echo "Example:"
    echo "  ./apps/api/scripts/validate-api-key.sh \"x-ai/grok-4.1-fast:free\" \"sk-or-v1-xxx\""
    echo ""
    exit 1
fi

MODEL="$1"
API_KEY="$2"

# Mask API key for display
MASKED_KEY="***${API_KEY: -8}"

echo ""
echo "🔍 Validating OpenRouter API Key..."
echo "📦 Model: $MODEL"
echo "🔑 API Key: $MASKED_KEY"
echo ""

# Prepare request
START_TIME=$(date +%s%3N)

# Make API request (with -k to bypass SSL cert issues in some environments)
RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST \
  https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: http://localhost:3000" \
  -H "X-Title: AIMAK API Key Validator" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{
      \"role\": \"user\",
      \"content\": \"Respond with only the word 'OK' if you can read this.\"
    }],
    \"temperature\": 0,
    \"max_tokens\": 10
  }")

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

# Check status code
if [ "$HTTP_CODE" -eq 200 ]; then
    # Extract AI response
    AI_RESPONSE=$(echo "$RESPONSE_BODY" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"\(.*\)"/\1/')

    echo "✅ SUCCESS! API Key is valid and working."
    echo "⏱️  Response time: ${DURATION}ms"
    echo "💬 AI Response: \"$AI_RESPONSE\""
    echo ""
    echo "📊 Full Response Data:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo "✨ Validation Complete: API key is working!"
    echo ""
    exit 0
else
    echo "❌ FAILED! API Key validation failed."
    echo ""
    echo "📛 HTTP Status: $HTTP_CODE"
    echo "💥 Error Details:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""

    # Provide helpful tips based on error code
    case $HTTP_CODE in
        401)
            echo "💡 Tip: Invalid API key or unauthorized."
            echo "        Get your API key from https://openrouter.ai/settings/keys"
            ;;
        402)
            echo "💡 Tip: Payment required. Check your OpenRouter account balance."
            ;;
        429)
            echo "💡 Tip: Rate limit exceeded. Free tier has limits."
            echo "        Consider upgrading or waiting."
            ;;
        400)
            echo "💡 Tip: Bad request. Verify model name is correct."
            echo "        Check https://openrouter.ai/models"
            ;;
        500|502|503)
            echo "💡 Tip: OpenRouter service error. Try again later."
            echo "        Check https://status.openrouter.ai"
            ;;
    esac

    echo ""
    echo "💔 Validation Failed: API key is not working."
    echo ""
    exit 1
fi
