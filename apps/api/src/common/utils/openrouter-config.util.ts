/**
 * OpenRouter Configuration Utility
 * Supports primary and fallback models for resilience
 */

export interface OpenRouterConfig {
  apiKey: string | null;
  primaryModel: string;
  fallbackModels: string[];
  allModels: string[];
  isConfigured: boolean;
  warnings: string[];
}

export class OpenRouterConfigUtil {
  // Default fallback chain for resilience
  private static readonly DEFAULT_MODELS = [
    'tngtech/deepseek-r1t2-chimera:free',
    'qwen/qwen3-4b:free',
    'qwen/qwen3-235b-a22b:free',
    'google/gemini-2.0-flash-exp:free',
  ];

  /**
   * Get full OpenRouter configuration with fallback support
   */
  static getConfig(): OpenRouterConfig {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelEnv = process.env.OPENROUTER_MODEL;
    const fallbackEnv = process.env.OPENROUTER_FALLBACK_MODELS;

    const warnings: string[] = [];
    const isConfigured = !!apiKey && apiKey.trim().length > 0;

    if (!isConfigured) {
      warnings.push('OPENROUTER_API_KEY is not set');
    }

    // Parse primary model
    const primaryModel = modelEnv || this.DEFAULT_MODELS[0];

    // Parse fallback models from environment or use defaults excluding primary
    let fallbackModels: string[] = [];
    if (fallbackEnv) {
      fallbackModels = fallbackEnv
        .split(',')
        .map(m => m.trim())
        .filter(m => m && m !== primaryModel);
    } else {
      fallbackModels = this.DEFAULT_MODELS.filter(m => m !== primaryModel);
    }

    const allModels = [primaryModel, ...fallbackModels];

    return {
      apiKey: isConfigured ? '***' + (apiKey?.slice(-8) || '') : null,
      primaryModel,
      fallbackModels,
      allModels,
      isConfigured,
      warnings,
    };
  }

  /**
   * Log configuration status with fallback chain
   */
  static logConfig(): void {
    const config = this.getConfig();
    console.log('='.repeat(60));
    console.log('🤖 OpenRouter (Multi-Model) Configuration Status');
    console.log('='.repeat(60));
    console.log(`✓ API Key configured: ${config.isConfigured ? 'YES' : 'NO'}`);
    console.log(`✓ API Key (masked): ${config.apiKey || 'NOT SET'}`);
    console.log(`✓ Primary Model: ${config.primaryModel}`);

    if (config.fallbackModels.length > 0) {
      console.log(`✓ Fallback Models (${config.fallbackModels.length}):`);
      config.fallbackModels.forEach((model, idx) => {
        console.log(`  ${idx + 1}. ${model}`);
      });
    }

    if (config.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      config.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }
    console.log('='.repeat(60));
  }

  /**
   * Get detailed error message for OpenRouter API failures
   */
  static getErrorMessage(error: any): string {
    if (error?.status === 429) {
      return (
        'OpenRouter API rate limit exceeded. ' +
        'Please wait a moment before retrying.'
      );
    }

    if (error?.status === 401 || error?.status === 403) {
      return (
        'OpenRouter API authentication failed. ' +
        'Please verify your OPENROUTER_API_KEY is correct. ' +
        'Get your API key at: https://openrouter.ai/keys'
      );
    }

    if (error?.status === 500) {
      return (
        'OpenRouter API server error. ' +
        'The service may be temporarily unavailable. Please try again later.'
      );
    }

    return (
      error?.message ||
      'OpenRouter API error. Please check your configuration.'
    );
  }
}
