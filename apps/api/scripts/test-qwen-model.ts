#!/usr/bin/env tsx

/**
 * Script to test Qwen model functionality
 *
 * Usage:
 *   npx tsx apps/api/scripts/test-qwen-model.ts <api-key> [model]
 *
 * Examples:
 *   npx tsx apps/api/scripts/test-qwen-model.ts "sk-or-v1-xxx"
 *   npx tsx apps/api/scripts/test-qwen-model.ts "sk-or-v1-xxx" "qwen/qwen3-4b:free"
 */

import axios from 'axios';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  message: string;
  response?: any;
  error?: any;
}

interface QwenTestConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

const DEFAULT_MODEL = 'qwen/qwen3-4b:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Makes a test request to OpenRouter with Qwen model
 */
async function makeQwenRequest(
  config: QwenTestConfig,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 100,
): Promise<any> {
  const response = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AIMAK Qwen Model Tester',
      },
      timeout: 30000,
    },
  );

  return response.data;
}

/**
 * Test 1: Basic connectivity and model availability
 */
async function testBasicConnectivity(
  config: QwenTestConfig,
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(config, [
      {
        role: 'user',
        content: 'Say "PONG" if you can read this.',
      },
    ]);

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';

    return {
      name: 'Basic Connectivity',
      success: true,
      duration,
      message: 'Model is accessible and responsive',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Basic Connectivity',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Test 2: Text generation and quality
 */
async function testTextGeneration(config: QwenTestConfig): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(config, [
      {
        role: 'user',
        content:
          'Write a short 1-2 sentence poem about the beauty of Kazakhstan.',
      },
    ]);

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';

    return {
      name: 'Text Generation',
      success: content.length > 20,
      duration,
      message: 'Model generated text successfully',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Text Generation',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Test 3: Language understanding and reasoning
 */
async function testLanguageUnderstanding(
  config: QwenTestConfig,
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(config, [
      {
        role: 'user',
        content:
          'What is the capital of Kazakhstan? Answer with only the city name.',
      },
    ]);

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';
    const success =
      content.toLowerCase().includes('astana') ||
      content.toLowerCase().includes('nur-sultan') ||
      content.toLowerCase().includes('nursultan');

    return {
      name: 'Language Understanding',
      success,
      duration,
      message: success ? 'Model answered correctly' : 'Model answer was unexpected',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Language Understanding',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Test 4: Multi-language support
 */
async function testMultiLanguage(config: QwenTestConfig): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(config, [
      {
        role: 'user',
        content: 'Translate "Hello, how are you?" to Russian.',
      },
    ]);

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';
    const success = content.toLowerCase().includes('привет') || content.toLowerCase().includes('как');

    return {
      name: 'Multi-Language Support',
      success,
      duration,
      message: success
        ? 'Model translated successfully'
        : 'Translation quality unclear',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Multi-Language Support',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Test 5: JSON output and structured data
 */
async function testStructuredOutput(
  config: QwenTestConfig,
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(
      config,
      [
        {
          role: 'user',
          content:
            'Return a JSON object with "name" and "country" fields for Almaty. Return ONLY the JSON.',
        },
      ],
      150,
    );

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';

    let success = false;
    try {
      JSON.parse(content);
      success = true;
    } catch {
      success = false;
    }

    return {
      name: 'Structured Output (JSON)',
      success,
      duration,
      message: success ? 'Model returned valid JSON' : 'JSON parsing failed',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Structured Output (JSON)',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Test 6: Token counting and length handling
 */
async function testTokenHandling(config: QwenTestConfig): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await makeQwenRequest(config, [
      {
        role: 'user',
        content:
          'List 5 major cities in Kazakhstan. Format as: 1. City\n2. City\nReturn ONLY the list.',
      },
    ]);

    const duration = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content || '';
    const success = content.split('\n').length >= 4;

    return {
      name: 'Token & Length Handling',
      success,
      duration,
      message: success
        ? 'Model handled length constraints properly'
        : 'Output length was unexpected',
      response: content,
    };
  } catch (error: any) {
    return {
      name: 'Token & Length Handling',
      success: false,
      duration: Date.now() - startTime,
      message: error.message,
      error,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests(config: QwenTestConfig): Promise<TestResult[]> {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 QWEN MODEL TEST SUITE');
  console.log('='.repeat(60));
  console.log(`📦 Model: ${config.model}`);
  console.log(`🔗 API: ${config.baseUrl}`);
  console.log('='.repeat(60) + '\n');

  const results: TestResult[] = [];

  // Test 1
  console.log('Test 1/6: Basic Connectivity...');
  const test1 = await testBasicConnectivity(config);
  results.push(test1);
  console.log(
    `${test1.success ? '✅' : '❌'} ${test1.name} (${test1.duration}ms)\n`,
  );

  if (!test1.success) {
    console.error('⚠️  Basic connectivity failed. Stopping tests.');
    return results;
  }

  // Test 2
  console.log('Test 2/6: Text Generation...');
  const test2 = await testTextGeneration(config);
  results.push(test2);
  console.log(
    `${test2.success ? '✅' : '❌'} ${test2.name} (${test2.duration}ms)`,
  );
  console.log(`   Response: "${test2.response}"\n`);

  // Test 3
  console.log('Test 3/6: Language Understanding...');
  const test3 = await testLanguageUnderstanding(config);
  results.push(test3);
  console.log(
    `${test3.success ? '✅' : '❌'} ${test3.name} (${test3.duration}ms)`,
  );
  console.log(`   Response: "${test3.response}"\n`);

  // Test 4
  console.log('Test 4/6: Multi-Language Support...');
  const test4 = await testMultiLanguage(config);
  results.push(test4);
  console.log(
    `${test4.success ? '✅' : '❌'} ${test4.name} (${test4.duration}ms)`,
  );
  console.log(`   Response: "${test4.response}"\n`);

  // Test 5
  console.log('Test 5/6: Structured Output (JSON)...');
  const test5 = await testStructuredOutput(config);
  results.push(test5);
  console.log(
    `${test5.success ? '✅' : '❌'} ${test5.name} (${test5.duration}ms)`,
  );
  console.log(`   Response: ${test5.response}\n`);

  // Test 6
  console.log('Test 6/6: Token & Length Handling...');
  const test6 = await testTokenHandling(config);
  results.push(test6);
  console.log(
    `${test6.success ? '✅' : '❌'} ${test6.name} (${test6.duration}ms)`,
  );
  console.log(`   Response:\n${test6.response}\n`);

  // Summary
  printSummary(results);

  return results;
}

/**
 * Print test summary
 */
function printSummary(results: TestResult[]): void {
  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / results.length,
  );

  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${percentage}%`);
  console.log(`⏱️  Average Response Time: ${avgDuration}ms`);
  console.log('='.repeat(60) + '\n');

  if (percentage === 100) {
    console.log('🎉 All tests passed! Qwen model is working perfectly.\n');
  } else if (percentage >= 80) {
    console.log('✨ Most tests passed. Model is functional.\n');
  } else if (percentage >= 50) {
    console.log('⚠️  Some tests failed. Check the details above.\n');
  } else {
    console.log('❌ Most tests failed. Check your API key and model name.\n');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Missing required API key argument\n');
    console.log('Usage:');
    console.log(
      '  npx tsx apps/api/scripts/test-qwen-model.ts <api-key> [model]\n',
    );
    console.log('Examples:');
    console.log(
      '  npx tsx apps/api/scripts/test-qwen-model.ts "sk-or-v1-xxx"\n',
    );
    console.log(
      '  npx tsx apps/api/scripts/test-qwen-model.ts "sk-or-v1-xxx" "qwen/qwen3-32b-128k:free"\n',
    );
    process.exit(1);
  }

  const apiKey = args[0];
  const model = args[1] || DEFAULT_MODEL;

  if (!apiKey.startsWith('sk-or-v1-')) {
    console.warn(
      '⚠️  Warning: API key does not start with "sk-or-v1-". Ensure this is a valid OpenRouter key.\n',
    );
  }

  const config: QwenTestConfig = {
    apiKey,
    model,
    baseUrl: OPENROUTER_BASE_URL,
  };

  try {
    const results = await runAllTests(config);

    const allPassed = results.every((r) => r.success);
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    console.error('💥 Unexpected error during testing:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests, QwenTestConfig };
