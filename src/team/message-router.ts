/**
 * Team Message Router - 团队消息路由
 */

import { writeFileSync, readFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';
import type { TeamMessage } from './types.js';
import { getTeamPaths, getWorkerPaths } from './paths.js';

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

/**
 * Send a direct message to a worker
 */
export function sendMessage(
  teamName: string,
  from: string,
  to: string,
  content: string,
  metadata?: Record<string, unknown>
): TeamMessage {
  const message: TeamMessage = {
    id: generateMessageId(),
    from,
    to,
    type: 'direct',
    content,
    timestamp: Date.now(),
    metadata,
  };

  const paths = getWorkerPaths(teamName, to);
  appendFileSync(paths.outbox, JSON.stringify(message) + '\n', 'utf-8');

  // Also write to inbox for the recipient
  const inboxContent = `# Message from ${from}\n\n${content}\n\n---\nSent: ${new Date(message.timestamp).toISOString()}\n`;
  appendFileSync(paths.inbox, inboxContent + '\n', 'utf-8');

  return message;
}

/**
 * Broadcast message to all workers
 */
export function broadcastMessage(
  teamName: string,
  from: string,
  content: string,
  metadata?: Record<string, unknown>
): TeamMessage[] {
  const paths = getTeamPaths(teamName);
  const workerDirs = existsSync(paths.workers)
    ? (require('fs').readdirSync(paths.workers) as string[])
    : [];

  const messages: TeamMessage[] = [];

  for (const worker of workerDirs) {
    if (worker !== from) {
      messages.push(sendMessage(teamName, from, worker, content, metadata));
    }
  }

  return messages;
}

/**
 * Send shutdown request to a worker
 */
export function sendShutdownRequest(
  teamName: string,
  from: string,
  to: string,
  reason?: string
): TeamMessage {
  const message: TeamMessage = {
    id: generateMessageId(),
    from,
    to,
    type: 'shutdown_request',
    content: reason || 'Shutdown requested',
    timestamp: Date.now(),
    metadata: { reason },
  };

  const paths = getWorkerPaths(teamName, to);
  const shutdownFile = join(paths.workers, to, 'shutdown-request.json');
  writeFileSync(shutdownFile, JSON.stringify(message, null, 2), 'utf-8');

  return message;
}

/**
 * Send shutdown response
 */
export function sendShutdownResponse(
  teamName: string,
  from: string,
  to: string,
  approved: boolean,
  requestId: string,
  reason?: string
): TeamMessage {
  const message: TeamMessage = {
    id: generateMessageId(),
    from,
    to,
    type: 'shutdown_response',
    content: approved ? 'Shutdown approved' : 'Shutdown rejected',
    timestamp: Date.now(),
    metadata: { requestId, approved, reason },
  };

  const paths = getWorkerPaths(teamName, to);
  writeFileSync(paths.shutdownAck, JSON.stringify(message, null, 2), 'utf-8');

  return message;
}

/**
 * Get messages for a worker (from inbox)
 */
export function getInboxMessages(teamName: string, workerName: string): string[] {
  const paths = getWorkerPaths(teamName, workerName);

  if (!existsSync(paths.inbox)) {
    return [];
  }

  try {
    const content = readFileSync(paths.inbox, 'utf-8');
    return content.split('\n---\n').filter((s) => s.trim());
  } catch {
    return [];
  }
}

/**
 * Clear worker's inbox
 */
export function clearInbox(teamName: string, workerName: string): void {
  const paths = getWorkerPaths(teamName, workerName);

  if (existsSync(paths.inbox)) {
    require('fs').unlinkSync(paths.inbox);
  }
}

/**
 * Get worker outbox messages
 */
export function getOutboxMessages(teamName: string, workerName: string): TeamMessage[] {
  const paths = getWorkerPaths(teamName, workerName);

  if (!existsSync(paths.outbox)) {
    return [];
  }

  try {
    const content = readFileSync(paths.outbox, 'utf-8');
    return content
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as TeamMessage);
  } catch {
    return [];
  }
}

/**
 * Append event to team's event log
 */
export function appendTeamEvent(
  teamName: string,
  event: {
    type: string;
    source: string;
    data?: Record<string, unknown>;
  }
): void {
  const paths = getTeamPaths(teamName);
  const eventLine = JSON.stringify({
    ...event,
    timestamp: Date.now(),
  });
  appendFileSync(paths.events, eventLine + '\n', 'utf-8');
}
