#!/usr/bin/env tsx

/**
 * Script to validate OpenRouter API key
 *
 * Usage:
 *   npx tsx apps/api/scripts/validate-api-key.ts <model> <api-key>
 *
 * Example:
 *   npx tsx apps/api/scripts/validate-api-key.ts "google/gemini-2.0-flash-exp:free" "sk-or-v1-xxx"
 */

import axios from 'axios';

interface ValidationResult {
  success: boolean;
  model: string;
  apiKey: string;
  message: string;
  response?: any;
  error?: any;
}

/**
 * Validates an OpenRouter API key by making a test request
 */
async function validateApiKey(
  model: string,
  apiKey: string,
): Promise<ValidationResult> {
  const maskedKey = apiKey.length > 8
    ? `***${apiKey.slice(-8)}`
    : '***';

  console.log('\n🔍 Validating OpenRouter API Key...');
  console.log(`📦 Model: ${model}`);
  console.log(`🔑 API Key: ${maskedKey}`);
  console.log('');

  try {
    const startTime = Date.now();

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Respond with only the word "OK" if you can read this.',
          },
        ],
        temperature: 0,
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AIMAK API Key Validator',
        },
        timeout: 30000, // 30 seconds
      },
    );

    const duration = Date.now() - startTime;
    const content = response.data?.choices?.[0]?.message?.content;

    console.log('✅ SUCCESS! API Key is valid and working.');
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`💬 AI Response: "${content}"`);
    console.log('');
    console.log('📊 Full Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    return {
      success: true,
      model,
      apiKey: maskedKey,
      message: 'API key is valid and working',
      response: response.data,
    };
  } catch (error: any) {
    const duration = Date.now() - Date.now();

    console.error('❌ FAILED! API Key validation failed.');
    console.log('');

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const statusText = error.response?.statusText;
      const errorData = error.response?.data;

      console.error(`📛 HTTP Status: ${status} ${statusText}`);
      console.error(`💥 Error Details:`, errorData);

      let message = 'Unknown error';

      if (status === 401) {
        message = 'Invalid API key or unauthorized. Please check your OpenRouter API key.';
        console.error('\n💡 Tip: Get your API key from https://openrouter.ai/settings/keys');
      } else if (status === 402) {
        message = 'Payment required. Your OpenRouter account may need credits.';
        console.error('\n💡 Tip: Check your OpenRouter account balance');
      } else if (status === 429) {
        message = 'Rate limit exceeded. Please wait and try again.';
        console.error('\n💡 Tip: Free tier has rate limits. Consider upgrading or waiting.');
      } else if (status === 500 || status === 502 || status === 503) {
        message = 'OpenRouter service error. Please try again later.';
        console.error('\n💡 Tip: Check OpenRouter status at https://status.openrouter.ai');
      } else if (status === 400) {
        message = 'Bad request. The model name may be incorrect.';
        console.error('\n💡 Tip: Verify model name at https://openrouter.ai/models');
      }

      return {
        success: false,
        model,
        apiKey: maskedKey,
        message,
        error: {
          status,
          statusText,
          data: errorData,
        },
      };
    } else {
      console.error(`💥 Error:`, error.message);

      return {
        success: false,
        model,
        apiKey: maskedKey,
        message: error.message || 'Unknown error occurred',
        error: {
          message: error.message,
          stack: error.stack,
        },
      };
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Error: Missing required arguments\n');
    console.log('Usage:');
    console.log('  npx tsx apps/api/scripts/validate-api-key.ts <model> <api-key>\n');
    console.log('Example:');
    console.log('  npx tsx apps/api/scripts/validate-api-key.ts "google/gemini-2.0-flash-exp:free" "sk-or-v1-xxx"\n');
    process.exit(1);
  }

  const [model, apiKey] = args;

  if (!model || !apiKey) {
    console.error('❌ Error: Both model and API key must be provided\n');
    process.exit(1);
  }

  if (!apiKey.startsWith('sk-or-v1-')) {
    console.warn('⚠️  Warning: API key does not start with "sk-or-v1-". Are you sure this is an OpenRouter key?\n');
  }

  const result = await validateApiKey(model, apiKey);

  if (result.success) {
    console.log('\n✨ Validation Complete: API key is working!\n');
    process.exit(0);
  } else {
    console.log('\n💔 Validation Failed: API key is not working.\n');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { validateApiKey };
