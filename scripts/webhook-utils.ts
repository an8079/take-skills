/**
 * Webhook Framework for claude-studio
 * 通用 Webhook 验证和路由框架
 */

import crypto from 'crypto';
import type { Request, Response } from 'express';

// ============================================================================
// Types
// ============================================================================

export interface BaseWebhookPayload {
  id: string;
  timestamp: string;
  event: string;
  source: string;
  data: unknown;
}

export interface WebhookContext {
  provider: string;
  authenticated: boolean;
  metadata: Record<string, unknown>;
}

export interface WebhookHandlerResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

export interface WebhookProvider<T extends BaseWebhookPayload = BaseWebhookPayload> {
  name: string;
  verifySignature(req: WebhookRequest, secret: string): Promise<boolean>;
  parsePayload(req: WebhookRequest): Promise<T>;
  getEventType(payload: T): string;
  getEventDescription(payload: T): string;
}

export interface WebhookEventHandler<T extends BaseWebhookPayload = BaseWebhookPayload> {
  event: string | RegExp;
  priority?: number;
  handle(payload: T, context: WebhookContext): Promise<WebhookHandlerResponse>;
  canHandle?(payload: T, context: WebhookContext): boolean;
}

export interface WebhookRequest {
  headers: Record<string, any>;
  body: any;
  rawBody?: string;
}

export interface ProcessorOptions {
  provider: string;
  secret?: string;
  skipSignatureVerification?: boolean;
}

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * Verify HMAC-SHA256 signature (GitHub style)
 * @param req - Webhook request
 * @param secret - Webhook secret
 * @param signatureHeader - Signature header value (x-hub-signature-256)
 */
export function verifyHmacSha256(
  req: WebhookRequest,
  secret: string,
  signatureHeader: string
): boolean {
  if (!signatureHeader) return false;

  const payload = req.rawBody ?? JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  const expected = 'sha256=' + hmac.update(payload).digest('hex');

  if (signatureHeader.length !== expected.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

/**
 * Verify Bearer Token
 * @param req - Webhook request
 * @param token - Expected token
 */
export function verifyBearerToken(
  req: WebhookRequest,
  token: string
): boolean {
  const auth = req.headers.authorization;
  return auth === `Bearer ${token}`;
}

// ============================================================================
// WebhookRegistry
// ============================================================================

/**
 * Registry for managing webhook providers and their event handlers
 */
export class WebhookRegistry {
  private providers = new Map<string, WebhookProvider>();
  private handlers = new Map<string, WebhookEventHandler[]>();

  /**
   * Register a webhook provider
   */
  registerProvider(provider: WebhookProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`[WebhookRegistry] Provider ${provider.name} already registered, overwriting`);
    }
    this.providers.set(provider.name, provider);
    console.log(`[WebhookRegistry] Registered provider: ${provider.name}`);
  }

  /**
   * Register an event handler for a specific provider
   */
  registerHandler(providerName: string, handler: WebhookEventHandler): void {
    const key = providerName.toLowerCase();
    const handlers = this.handlers.get(key) ?? [];

    handlers.push(handler);
    handlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    this.handlers.set(key, handlers);

    const eventPattern = handler.event instanceof RegExp
      ? handler.event.toString()
      : handler.event;
    console.log(
      `[WebhookRegistry] Registered handler for ${providerName}: ${eventPattern} (priority: ${handler.priority ?? 0})`
    );
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): WebhookProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): WebhookProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get handlers for a specific provider and event
   */
  getHandlers(providerName: string, event: string): WebhookEventHandler[] {
    const key = providerName.toLowerCase();
    const allHandlers = this.handlers.get(key) ?? [];

    return allHandlers.filter(handler => matchesEvent(handler.event, event));
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.providers.clear();
    this.handlers.clear();
    console.log('[WebhookRegistry] Cleared all registrations');
  }

  /**
   * Get handler count for a provider
   */
  getHandlerCount(providerName?: string): number {
    if (providerName) {
      const key = providerName.toLowerCase();
      return this.handlers.get(key)?.length ?? 0;
    }

    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }
}

// ============================================================================
// Event Matching
// ============================================================================

/**
 * Check if an event matches a pattern
 */
function matchesEvent(pattern: string | RegExp, event: string): boolean {
  if (typeof pattern === 'string') {
    // Exact match
    if (pattern === event) return true;

    // Wildcard match (e.g., "issues.*")
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return event.startsWith(prefix);
    }

    return false;
  }

  // RegExp match
  return pattern.test(event);
}

// ============================================================================
// WebhookProcessor
// ============================================================================

/**
 * Processes incoming webhook requests
 */
export class WebhookProcessor {
  constructor(private registry: WebhookRegistry) {}

  /**
   * Process an incoming webhook request
   */
  async processWebhook(
    req: WebhookRequest,
    res: Response,
    options: ProcessorOptions
  ): Promise<void> {
    const { provider: providerName, secret, skipSignatureVerification } = options;

    try {
      // Get provider
      const provider = this.registry.getProvider(providerName);
      if (!provider) {
        console.error(`[WebhookProcessor] Provider not found: ${providerName}`);
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      // Verify signature
      if (!skipSignatureVerification && secret) {
        const isValid = await provider.verifySignature(req, secret);
        if (!isValid) {
          console.warn(`[WebhookProcessor] Invalid signature for ${providerName}`);
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
      }

      // Parse payload
      const payload = await provider.parsePayload(req);
      const eventType = provider.getEventType(payload);
      const eventDescription = provider.getEventDescription(payload);

      console.log(
        `[WebhookProcessor] Processing webhook: ${eventDescription} (${eventType})`
      );

      // Create context
      const context: WebhookContext = {
        provider: providerName,
        authenticated: true,
        metadata: {
          eventType,
          payloadId: payload.id,
          timestamp: payload.timestamp
        }
      };

      // Get handlers
      const handlers = this.registry.getHandlers(providerName, eventType);

      if (handlers.length === 0) {
        console.log(`[WebhookProcessor] No handlers for event: ${eventType}`);
        res.status(200).json({
          message: 'Webhook received but no handlers registered',
          event: eventType
        });
        return;
      }

      // Execute handlers
      const results = await this.executeHandlers(handlers, payload, context);

      const hasErrors = results.some(r => !r.success);
      const statusCode = hasErrors ? 207 : 200;

      res.status(statusCode).json({
        message: 'Webhook processed',
        event: eventType,
        handlerCount: handlers.length,
        results
      });
    } catch (error) {
      console.error(`[WebhookProcessor] Error processing webhook:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Execute handlers for a webhook event
   */
  private async executeHandlers(
    handlers: WebhookEventHandler[],
    payload: BaseWebhookPayload,
    context: WebhookContext
  ): Promise<WebhookHandlerResponse[]> {
    const results: WebhookHandlerResponse[] = [];

    for (const handler of handlers) {
      try {
        if (handler.canHandle && !handler.canHandle(payload, context)) {
          continue;
        }

        const result = await handler.handle(payload, context);
        results.push(result);

        console.log(
          `[WebhookProcessor] Handler executed: ${result.success ? 'success' : 'failed'}`
        );
      } catch (error) {
        console.error(`[WebhookProcessor] Handler execution failed:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Handler execution failed'
        });
      }
    }

    return results;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract event type from GitHub webhook headers
 */
export function getGitHubEventType(req: WebhookRequest): string {
  return req.headers['x-github-event'] as string;
}

/**
 * Extract delivery ID from GitHub webhook headers
 */
export function getGitHubDeliveryId(req: WebhookRequest): string {
  return req.headers['x-github-delivery'] as string;
}

/**
 * Normalize GitHub event with action (e.g., "issues.opened")
 */
export function normalizeGitHubEvent(event: string, action?: string): string {
  if (!action) return event;
  return `${event}.${action}`;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  WebhookRegistry,
  WebhookProcessor,
  verifyHmacSha256,
  verifyBearerToken
};
