import { HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { OpenRouterConfigUtil } from './openrouter-config.util';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: AxiosError) => boolean;
  allowFallback?: boolean;
}

export class OpenRouterRetryUtil {
  /**
   * Execute an axios request with exponential backoff retry logic and model fallback
   */
  static async executeWithRetry<T = any>(
    requestConfig: AxiosRequestConfig,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 2000,
      maxDelay = 10000,
      shouldRetry = (error: AxiosError) => {
        const status = error.response?.status;
        // Retry on 429 (rate limit) and 5xx (server errors)
        return status === 429 || (status !== undefined && status >= 500);
      },
      allowFallback = true,
    } = options;

    // Get available models
    const config = OpenRouterConfigUtil.getConfig();
    const modelsToTry = [...config.allModels];

    // Extract current model from request if provided
    const requestBody = requestConfig.data ?
      (typeof requestConfig.data === 'string' ? JSON.parse(requestConfig.data) : requestConfig.data) :
      {};

    for (const model of modelsToTry) {
      const modelRequest = {
        ...requestConfig,
        data: {
          ...requestBody,
          model,
        },
      };

      let lastError: AxiosError | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await axios(modelRequest);

          // Log if fallback was used
          if (model !== config.primaryModel) {
            console.log(
              `[OpenRouter Fallback] Successfully switched to fallback model: ${model}`,
            );
          }

          return response.data;
        } catch (error) {
          if (!axios.isAxiosError(error)) {
            throw error;
          }

          lastError = error;
          const status = error.response?.status;

          // Check if we should retry with current model
          if (attempt < maxRetries && shouldRetry(error)) {
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

            console.log(
              `[OpenRouter Retry] Model "${model}" - Attempt ${attempt + 1}/${maxRetries + 1} failed with status ${status}. ` +
              `Retrying in ${delay}ms...`,
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // If this is the last model or error shouldn't be retried
          if (model === modelsToTry[modelsToTry.length - 1] || !shouldRetry(error)) {
            this.handleOpenRouterError(error);
          }

          // Try next fallback model
          if (allowFallback && model !== modelsToTry[modelsToTry.length - 1]) {
            const nextModel = modelsToTry[modelsToTry.indexOf(model) + 1];
            console.log(
              `[OpenRouter Fallback] Model "${model}" failed with status ${status}. ` +
              `Switching to fallback model: ${nextModel}`,
            );
            break; // Break inner loop to try next model
          }

          // No more models to try
          this.handleOpenRouterError(error);
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new HttpException(
      'All models exhausted',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  /**
   * Handle OpenRouter API errors and throw appropriate HTTP exceptions
   */
  private static handleOpenRouterError(error: AxiosError): never {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;

    console.error(
      `[OpenRouter Error] Status: ${statusCode}, Data:`,
      JSON.stringify(errorData, null, 2),
    );

    // Extract error message from OpenRouter response
    const openRouterMessage =
      errorData?.error?.message ||
      errorData?.message ||
      'Unknown error from OpenRouter API';

    if (statusCode === 400) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'Invalid request to AI service',
          error: 'Bad Request',
          details: openRouterMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (statusCode === 401) {
      throw new HttpException(
        {
          statusCode: 401,
          message:
            'Invalid API key. Please check OPENROUTER_API_KEY configuration.',
          error: 'Unauthorized',
          details: 'Get your API key at: https://openrouter.ai/keys',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (statusCode === 403) {
      throw new HttpException(
        {
          statusCode: 403,
          message: 'API key does not have permission for this operation',
          error: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (statusCode === 429) {
      // Extract rate limit details from headers
      const resetTime = error.response?.headers['x-ratelimit-reset'];
      const retryAfter = error.response?.headers['retry-after'];

      throw new HttpException(
        {
          statusCode: 429,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          details: openRouterMessage,
          retryAfter: retryAfter || null,
          resetTime: resetTime || null,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (statusCode && statusCode >= 500) {
      throw new HttpException(
        {
          statusCode: 503,
          message: 'AI service is temporarily unavailable. Please try again later.',
          error: 'Service Unavailable',
          details: openRouterMessage,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Network error or other unknown error
    if (!error.response) {
      throw new HttpException(
        {
          statusCode: 503,
          message: 'Unable to reach AI service. Please check your internet connection.',
          error: 'Service Unavailable',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Fallback for unknown errors
    throw new HttpException(
      {
        statusCode: 500,
        message: 'An unexpected error occurred with the AI service',
        error: 'Internal Server Error',
        details: openRouterMessage,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
