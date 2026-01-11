import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface AICompletionOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  content: string;
  provider: 'gemini' | 'openrouter';
  model: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  // Gemini configuration
  private readonly geminiApiKey: string | null;
  private readonly geminiModel: string;

  // OpenRouter configuration
  private readonly openrouterApiKey: string | null;
  private readonly openrouterModel: string;

  // Which provider to use
  private readonly preferredProvider: 'gemini' | 'openrouter' | 'auto';

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY?.trim() || null;
    this.geminiModel =
      process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    this.openrouterApiKey = process.env.OPENROUTER_API_KEY?.trim() || null;
    this.openrouterModel =
      process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';

    // Auto-detect provider based on available keys
    const providerEnv = process.env.AI_PROVIDER?.toLowerCase();
    if (providerEnv === 'gemini' || providerEnv === 'openrouter') {
      this.preferredProvider = providerEnv;
    } else {
      this.preferredProvider = 'auto';
    }

    this.logConfiguration();
  }

  private logConfiguration(): void {
    this.logger.log('');
    this.logger.log('=== AI Service Configuration ===');
    this.logger.log(`Gemini API Key: ${this.geminiApiKey ? 'SET' : 'NOT SET'}`);
    this.logger.log(`Gemini Model: ${this.geminiModel}`);
    this.logger.log(
      `OpenRouter API Key: ${this.openrouterApiKey ? 'SET' : 'NOT SET'}`,
    );
    this.logger.log(`OpenRouter Model: ${this.openrouterModel}`);
    this.logger.log(`Preferred Provider: ${this.preferredProvider}`);

    if (!this.geminiApiKey && !this.openrouterApiKey) {
      this.logger.error(
        'No AI API keys configured! Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      );
    }
    this.logger.log('================================');
    this.logger.log('');
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return !!(this.geminiApiKey || this.openrouterApiKey);
  }

  /**
   * Get the active provider
   */
  getActiveProvider(): 'gemini' | 'openrouter' | null {
    if (this.preferredProvider === 'gemini' && this.geminiApiKey) {
      return 'gemini';
    }
    if (this.preferredProvider === 'openrouter' && this.openrouterApiKey) {
      return 'openrouter';
    }
    // Auto mode: prefer Gemini if available
    if (this.geminiApiKey) return 'gemini';
    if (this.openrouterApiKey) return 'openrouter';
    return null;
  }

  /**
   * Generate AI completion using the configured provider
   */
  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const provider = this.getActiveProvider();

    if (!provider) {
      throw new Error(
        'No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY',
      );
    }

    if (provider === 'gemini') {
      return this.completeWithGemini(options);
    } else {
      return this.completeWithOpenRouter(options);
    }
  }

  /**
   * Generate completion using Google Gemini API
   */
  private async completeWithGemini(
    options: AICompletionOptions,
  ): Promise<AICompletionResult> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { prompt, systemPrompt, maxTokens = 2048, temperature = 0.7 } = options;

    // Build the request for Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    const contents: any[] = [];

    // Add system instruction if provided
    const systemInstruction = systemPrompt
      ? { parts: [{ text: systemPrompt }] }
      : undefined;

    // Add user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const requestBody: any = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    try {
      this.logger.debug(`Calling Gemini API with model: ${this.geminiModel}`);

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const content =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        throw new Error('Empty response from Gemini API');
      }

      return {
        content,
        provider: 'gemini',
        model: this.geminiModel,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        this.logger.error(`Gemini API error: ${errorMessage}`);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Generate completion using OpenRouter API
   */
  private async completeWithOpenRouter(
    options: AICompletionOptions,
  ): Promise<AICompletionResult> {
    if (!this.openrouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const { prompt, systemPrompt, maxTokens = 2048, temperature = 0.7 } = options;

    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    try {
      this.logger.debug(
        `Calling OpenRouter API with model: ${this.openrouterModel}`,
      );

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.openrouterModel,
          messages,
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
            'X-Title': process.env.APP_NAME || 'Smart CMS',
          },
          timeout: 60000,
        },
      );

      const content = response.data?.choices?.[0]?.message?.content || '';

      if (!content) {
        throw new Error('Empty response from OpenRouter API');
      }

      return {
        content,
        provider: 'openrouter',
        model: this.openrouterModel,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        this.logger.error(`OpenRouter API error: ${errorMessage}`);
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Parse JSON from AI response, handling markdown code blocks
   */
  parseJsonResponse<T>(content: string): T {
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }

    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    // Remove any leading/trailing whitespace
    jsonStr = jsonStr.trim();

    // Try to extract JSON object or array
    const jsonMatch = jsonStr.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    return JSON.parse(jsonStr);
  }
}
