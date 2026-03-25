/**
 * Claude-Studio Orchestration System
 *
 * 多容器并行/串行执行 + DAG依赖图执行引擎
 *
 * @example
 * const orch = new Orchestrator();
 * orch.createNode({ id: 'analysis', type: 'analysis', executor: 'agent' });
 * orch.createNode({ id: 'backend', type: 'implementation', dependsOn: ['analysis'] });
 * orch.createNode({ id: 'frontend', type: 'implementation', dependsOn: ['analysis'] });
 * orch.createNode({ id: 'test', type: 'testing', dependsOn: ['backend', 'frontend'] });
 * await orch.execute('parallel'); // 或 'sequential', 'dag'
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type NodeType = 'analysis' | 'implementation' | 'testing' | 'review' | 'coordination';
export type ExecutorType = 'agent' | 'script' | 'command' | 'webhook';
export type ExecutionStrategy = 'parallel' | 'sequential' | 'dag' | 'wait_for_core';

export interface OrchestrationNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  dependsOn: string[];
  executor: ExecutorType;
  config: NodeConfig;
  result?: NodeResult;
  startTime?: Date;
  endTime?: Date;
}

export interface NodeConfig {
  command?: string;
  agent?: string;
  script?: string;
  webhook?: string;
  requirements?: string;
  context?: Record<string, unknown>;
  retry?: number;
  timeout?: number;
}

export interface NodeResult {
  success: boolean;
  output?: unknown;
  artifacts?: Artifact[];
  logs: string[];
  summary?: string;
  nextSteps?: string[];
  error?: string;
}

export interface Artifact {
  type: 'file' | 'commit' | 'directory' | 'package';
  path?: string;
  sha?: string;
  description?: string;
}

export interface OrchestrationGraph {
  id: string;
  name: string;
  nodes: Map<string, OrchestrationNode>;
  edges: Map<string, string[]>; // nodeId -> dependent nodeIds
  status: 'pending' | 'running' | 'completed' | 'failed';
  strategy: ExecutionStrategy;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface OrchestrationOptions {
  strategy?: ExecutionStrategy;
  onNodeStart?: (node: OrchestrationNode) => void;
  onNodeComplete?: (node: OrchestrationNode, result: NodeResult) => void;
  onNodeFail?: (node: OrchestrationNode, error: Error) => void;
  onProgress?: (progress: OrchestrationProgress) => void;
  maxParallel?: number;
  retryFailed?: boolean;
}

export interface OrchestrationProgress {
  total: number;
  completed: number;
  running: number;
  failed: number;
  pending: number;
  currentNode?: string;
}

// ============================================================================
// Core Orchestrator
// ============================================================================

export class Orchestrator extends EventEmitter {
  private graphs: Map<string, OrchestrationGraph> = new Map();
  private executingGraphs: Set<string> = new Set();
  private maxParallel: number;
  private retryFailed: boolean;

  constructor(maxParallel = 3, retryFailed = true) {
    super();
    this.maxParallel = maxParallel;
    this.retryFailed = retryFailed;
  }

  /**
   * Create a new orchestration graph
   */
  createGraph(name: string, strategy: ExecutionStrategy = 'dag'): OrchestrationGraph {
    const graph: OrchestrationGraph = {
      id: randomUUID(),
      name,
      nodes: new Map(),
      edges: new Map(),
      status: 'pending',
      strategy,
      createdAt: new Date(),
    };
    this.graphs.set(graph.id, graph);
    return graph;
  }

  /**
   * Add a node to a graph
   */
  createNode(
    graphId: string,
    options: {
      id: string;
      name: string;
      type: NodeType;
      dependsOn?: string[];
      executor?: ExecutorType;
      config?: NodeConfig;
    }
  ): OrchestrationNode | null {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const node: OrchestrationNode = {
      id: options.id,
      name: options.name,
      type: options.type,
      status: 'pending',
      dependsOn: options.dependsOn || [],
      executor: options.executor || 'agent',
      config: options.config || {},
    };

    graph.nodes.set(node.id, node);

    // Update edges (reverse dependency map)
    for (const depId of node.dependsOn) {
      if (!graph.edges.has(depId)) {
        graph.edges.set(depId, []);
      }
      graph.edges.get(depId)!.push(node.id);
    }

    return node;
  }

  /**
   * Remove a node from a graph
   */
  removeNode(graphId: string, nodeId: string): boolean {
    const graph = this.graphs.get(graphId);
    if (!graph) return false;

    const node = graph.nodes.get(nodeId);
    if (!node) return false;

    // Remove this node from dependencies
    for (const existingNode of graph.nodes.values()) {
      if (existingNode.dependsOn.includes(nodeId)) {
        existingNode.dependsOn = existingNode.dependsOn.filter((id) => id !== nodeId);
      }
    }

    // Remove edges to this node
    for (const dependents of graph.edges.values()) {
      const idx = dependents.indexOf(nodeId);
      if (idx !== -1) {
        dependents.splice(idx, 1);
      }
    }

    return graph.nodes.delete(nodeId);
  }

  /**
   * Get a node by ID
   */
  getNode(graphId: string, nodeId: string): OrchestrationNode | undefined {
    return this.graphs.get(graphId)?.nodes.get(nodeId);
  }

  /**
   * Get execution order based on dependencies (topological sort)
   */
  getExecutionOrder(graphId: string): string[][] {
    const graph = this.graphs.get(graphId);
    if (!graph) return [];

    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const node of graph.nodes.values()) {
      inDegree.set(node.id, node.dependsOn.length);
      adjacency.set(node.id, []);
    }

    // Build adjacency list (reversed: from dependency to dependent)
    for (const [nodeId, node] of graph.nodes) {
      for (const depId of node.dependsOn) {
        const adj = adjacency.get(depId);
        if (adj) adj.push(nodeId);
      }
    }

    // Find all nodes with no dependencies (level 0)
    const levels: string[][] = [];
    const visited = new Set<string>();

    while (visited.size < graph.nodes.size) {
      const level: string[] = [];

      for (const [nodeId, degree] of inDegree) {
        if (degree === 0 && !visited.has(nodeId)) {
          level.push(nodeId);
        }
      }

      if (level.length === 0) {
        // Circular dependency detected
        const remaining = [...graph.nodes.keys()].filter((id) => !visited.has(id));
        throw new Error(`Circular dependency detected among: ${remaining.join(', ')}`);
      }

      levels.push(level);

      // Mark as visited and reduce in-degree of dependents
      for (const nodeId of level) {
        visited.add(nodeId);
        for (const dependent of adjacency.get(nodeId) || []) {
          inDegree.set(dependent, inDegree.get(dependent)! - 1);
        }
      }
    }

    return levels;
  }

  /**
   * Check if a node's dependencies are satisfied
   */
  private areDependenciesMet(graphId: string, nodeId: string): boolean {
    const graph = this.graphs.get(graphId);
    if (!graph) return false;

    const node = graph.nodes.get(nodeId);
    if (!node) return false;

    for (const depId of node.dependsOn) {
      const dep = graph.nodes.get(depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    graphId: string,
    nodeId: string,
    options: OrchestrationOptions
  ): Promise<NodeResult> {
    const graph = this.graphs.get(graphId);
    const node = graph?.nodes.get(nodeId);

    if (!node || !graph) {
      return { success: false, logs: [], error: 'Node not found' };
    }

    node.status = 'running';
    node.startTime = new Date();

    this.emit('nodeStart', node);
    options.onNodeStart?.(node);

    const logs: string[] = [];

    try {
      // Execute based on executor type
      const result = await this.runExecutor(node, logs);

      node.result = result;
      node.status = result.success ? 'completed' : 'failed';
      node.endTime = new Date();

      if (result.success) {
        this.emit('nodeComplete', node, result);
        options.onNodeComplete?.(node, result);
      } else {
        this.emit('nodeFail', node, new Error(result.error));
        options.onNodeFail?.(node, new Error(result.error || 'Unknown error'));

        // Retry if enabled
        if (this.retryFailed && (node.config.retry || 0) > 0) {
          for (let i = 0; i < (node.config.retry || 0); i++) {
            logs.push(`Retry ${i + 1}/${node.config.retry}...`);
            const retryResult = await this.runExecutor(node, logs);
            if (retryResult.success) {
              node.result = retryResult;
              node.status = 'completed';
              node.endTime = new Date();
              options.onNodeComplete?.(node, retryResult);
              break;
            }
          }
        }
      }

      return node.result;
    } catch (error) {
      node.status = 'failed';
      node.endTime = new Date();
      node.result = {
        success: false,
        logs,
        error: error instanceof Error ? error.message : String(error),
      };

      this.emit('nodeFail', node, error as Error);
      options.onNodeFail?.(node, error as Error);

      return node.result;
    }
  }

  /**
   * Run the executor for a node
   */
  private async runExecutor(
    node: OrchestrationNode,
    logs: string[]
  ): Promise<NodeResult> {
    logs.push(`[${node.type}] Starting ${node.name} (${node.executor})`);

    switch (node.executor) {
      case 'agent':
        return this.runAgentExecutor(node, logs);
      case 'script':
        return this.runScriptExecutor(node, logs);
      case 'command':
        return this.runCommandExecutor(node, logs);
      case 'webhook':
        return this.runWebhookExecutor(node, logs);
      default:
        return { success: false, logs, error: `Unknown executor: ${node.executor}` };
    }
  }

  /**
   * Agent executor - delegates to Claude agent
   */
  private async runAgentExecutor(
    node: OrchestrationNode,
    logs: string[]
  ): Promise<NodeResult> {
    // Placeholder for agent execution
    // In real implementation, this would invoke the Claude agent system
    logs.push(`Agent: ${node.config.agent || 'default'}`);
    logs.push(`Requirements: ${node.config.requirements || 'N/A'}`);

    // Simulate execution
    await this.delay(100);

    return {
      success: true,
      logs,
      summary: `Completed ${node.name}`,
      artifacts: [],
    };
  }

  /**
   * Script executor - runs a local script
   */
  private async runScriptExecutor(
    node: OrchestrationNode,
    logs: string[]
  ): Promise<NodeResult> {
    if (!node.config.script) {
      return { success: false, logs, error: 'No script specified' };
    }

    logs.push(`Running script: ${node.config.script}`);

    // In real implementation, this would spawn a child process
    await this.delay(50);

    return {
      success: true,
      logs,
      summary: `Script ${node.config.script} completed`,
      artifacts: [],
    };
  }

  /**
   * Command executor - runs a shell command
   */
  private async runCommandExecutor(
    node: OrchestrationNode,
    logs: string[]
  ): Promise<NodeResult> {
    if (!node.config.command) {
      return { success: false, logs, error: 'No command specified' };
    }

    logs.push(`Executing: ${node.config.command}`);

    // In real implementation, this would use child_process
    await this.delay(50);

    return {
      success: true,
      logs,
      summary: `Command completed`,
      artifacts: [],
    };
  }

  /**
   * Webhook executor - calls external webhook
   */
  private async runWebhookExecutor(
    node: OrchestrationNode,
    logs: string[]
  ): Promise<NodeResult> {
    if (!node.config.webhook) {
      return { success: false, logs, error: 'No webhook URL specified' };
    }

    logs.push(`Calling webhook: ${node.config.webhook}`);

    // In real implementation, this would make HTTP request
    await this.delay(100);

    return {
      success: true,
      logs,
      summary: `Webhook response received`,
      artifacts: [],
    };
  }

  /**
   * Execute the graph with specified strategy
   */
  async execute(
    graphId: string,
    options: OrchestrationOptions = {}
  ): Promise<Map<string, NodeResult>> {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    if (this.executingGraphs.has(graphId)) {
      throw new Error(`Graph ${graphId} is already executing`);
    }

    this.executingGraphs.add(graphId);
    graph.status = 'running';
    graph.startedAt = new Date();

    const results = new Map<string, NodeResult>();

    try {
      switch (options.strategy || graph.strategy) {
        case 'parallel':
          await this.executeParallel(graphId, options, results);
          break;
        case 'sequential':
          await this.executeSequential(graphId, options, results);
          break;
        case 'dag':
        case 'wait_for_core':
          await this.executeDAG(graphId, options, results);
          break;
        default:
          throw new Error(`Unknown strategy: ${options.strategy}`);
      }

      // Determine overall status
      const hasFailed = [...graph.nodes.values()].some((n) => n.status === 'failed');
      graph.status = hasFailed ? 'failed' : 'completed';
    } finally {
      graph.completedAt = new Date();
      this.executingGraphs.delete(graphId);
    }

    return results;
  }

  /**
   * Parallel execution - all nodes at once (with dependency filtering)
   */
  private async executeParallel(
    graphId: string,
    options: OrchestrationOptions,
    results: Map<string, NodeResult>
  ): Promise<void> {
    const graph = this.graphs.get(graphId)!;
    const order = this.getExecutionOrder(graphId);

    // Execute each level in parallel
    for (const level of order) {
      const promises = level.map((nodeId) =>
        this.executeNode(graphId, nodeId, options).then((result) => {
          results.set(nodeId, result);
          this.reportProgress(graphId, options);
        })
      );

      await Promise.all(promises);
    }
  }

  /**
   * Sequential execution - one node at a time
   */
  private async executeSequential(
    graphId: string,
    options: OrchestrationOptions,
    results: Map<string, NodeResult>
  ): Promise<void> {
    const graph = this.graphs.get(graphId)!;
    const order = this.getExecutionOrder(graphId);

    for (const level of order) {
      for (const nodeId of level) {
        const result = await this.executeNode(graphId, nodeId, options);
        results.set(nodeId, result);
        this.reportProgress(graphId, options);

        if (!result.success && !this.retryFailed) {
          return; // Stop on first failure
        }
      }
    }
  }

  /**
   * DAG execution - respects dependencies, max parallel limit
   */
  private async executeDAG(
    graphId: string,
    options: OrchestrationOptions,
    results: Map<string, NodeResult>
  ): Promise<void> {
    const graph = this.graphs.get(graphId)!;
    const maxParallel = options.maxParallel || this.maxParallel;
    const running = new Set<string>();
    const completed = new Set<string>();

    while (completed.size < graph.nodes.size) {
      // Find nodes ready to execute
      const ready: string[] = [];

      for (const [nodeId, node] of graph.nodes) {
        if (completed.has(nodeId) || running.has(nodeId)) continue;
        if (node.status === 'skipped') {
          completed.add(nodeId);
          continue;
        }
        if (this.areDependenciesMet(graphId, nodeId)) {
          ready.push(nodeId);
        }
      }

      // Check for dead end (no ready nodes but not complete)
      if (ready.length === 0 && running.size === 0) {
        const pending = [...graph.nodes.values()]
          .filter((n) => !completed.has(n.id) && n.status !== 'skipped')
          .map((n) => n.id);
        throw new Error(`Deadlock detected. Pending nodes: ${pending.join(', ')}`);
      }

      // Execute ready nodes up to maxParallel limit
      const toExecute = ready.slice(0, maxParallel - running.size);

      for (const nodeId of toExecute) {
        running.add(nodeId);
      }

      if (running.size > 0) {
        const promises = [...running].map(async (nodeId) => {
          const result = await this.executeNode(graphId, nodeId, options);
          results.set(nodeId, result);
          running.delete(nodeId);
          completed.add(nodeId);
          this.reportProgress(graphId, options);
          return result;
        });

        await Promise.all(promises);
      }

      // Small delay to prevent busy waiting
      if (ready.length === 0 && running.size === 0) {
        await this.delay(10);
      }
    }
  }

  /**
   * Report progress
   */
  private reportProgress(graphId: string, options: OrchestrationOptions): void {
    const graph = this.graphs.get(graphId);
    if (!graph) return;

    const progress: OrchestrationProgress = {
      total: graph.nodes.size,
      completed: [...graph.nodes.values()].filter((n) => n.status === 'completed').length,
      running: [...graph.nodes.values()].filter((n) => n.status === 'running').length,
      failed: [...graph.nodes.values()].filter((n) => n.status === 'failed').length,
      pending: [...graph.nodes.values()].filter((n) => n.status === 'pending').length,
    };

    const runningNode = [...graph.nodes.values()].find((n) => n.status === 'running');
    if (runningNode) {
      progress.currentNode = runningNode.name;
    }

    this.emit('progress', progress);
    options.onProgress?.(progress);
  }

  /**
   * Get graph status
   */
  getGraphStatus(graphId: string): OrchestrationGraph | undefined {
    return this.graphs.get(graphId);
  }

  /**
   * List all graphs
   */
  listGraphs(): OrchestrationGraph[] {
    return [...this.graphs.values()];
  }

  /**
   * Cancel execution
   */
  cancel(graphId: string): boolean {
    const graph = this.graphs.get(graphId);
    if (!graph) return false;

    for (const node of graph.nodes.values()) {
      if (node.status === 'running') {
        node.status = 'pending'; // Would need actual cancellation mechanism
      }
    }

    this.executingGraphs.delete(graphId);
    graph.status = 'pending';
    return true;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// High-level API
// ============================================================================

export class SessionOrchestrator {
  private orchestrator: Orchestrator;

  constructor() {
    this.orchestrator = new Orchestrator();
  }

  /**
   * Create a full-stack development workflow
   */
  createFullStackWorkflow(repo: string, requirements: string): string {
    const graph = this.orchestrator.createGraph('fullstack', 'dag');

    // Analysis phase
    this.orchestrator.createNode(graph.id, {
      id: 'analysis',
      name: 'Architecture Analysis',
      type: 'analysis',
      executor: 'agent',
      config: { requirements: `Analyze and plan: ${requirements}` },
    });

    // Parallel implementation
    this.orchestrator.createNode(graph.id, {
      id: 'backend',
      name: 'Backend Implementation',
      type: 'implementation',
      dependsOn: ['analysis'],
      executor: 'agent',
      config: { requirements: 'Implement backend API' },
    });

    this.orchestrator.createNode(graph.id, {
      id: 'frontend',
      name: 'Frontend Implementation',
      type: 'implementation',
      dependsOn: ['analysis'],
      executor: 'agent',
      config: { requirements: 'Implement React frontend' },
    });

    this.orchestrator.createNode(graph.id, {
      id: 'auth',
      name: 'Authentication',
      type: 'implementation',
      dependsOn: ['analysis'],
      executor: 'agent',
      config: { requirements: 'Implement JWT authentication' },
    });

    // Testing phase
    this.orchestrator.createNode(graph.id, {
      id: 'test',
      name: 'Integration Testing',
      type: 'testing',
      dependsOn: ['backend', 'frontend', 'auth'],
      executor: 'agent',
      config: { requirements: 'Write comprehensive tests' },
    });

    return graph.id;
  }

  /**
   * Create a bug fix workflow
   */
  createBugFixWorkflow(repo: string, bugDescription: string): string {
    const graph = this.orchestrator.createGraph('bugfix', 'dag');

    this.orchestrator.createNode(graph.id, {
      id: 'analysis',
      name: 'Bug Analysis',
      type: 'analysis',
      executor: 'agent',
      config: { requirements: `Analyze bug: ${bugDescription}` },
    });

    this.orchestrator.createNode(graph.id, {
      id: 'fix',
      name: 'Fix Implementation',
      type: 'implementation',
      dependsOn: ['analysis'],
      executor: 'agent',
      config: { requirements: 'Implement the fix' },
    });

    this.orchestrator.createNode(graph.id, {
      id: 'test',
      name: 'Test the Fix',
      type: 'testing',
      dependsOn: ['fix'],
      executor: 'agent',
      config: { requirements: 'Verify bug is fixed' },
    });

    return graph.id;
  }

  /**
   * Execute workflow
   */
  async execute(graphId: string, options?: OrchestrationOptions) {
    return this.orchestrator.execute(graphId, options);
  }

  /**
   * Get orchestrator events
   */
  on(event: 'nodeStart' | 'nodeComplete' | 'nodeFail' | 'progress', handler: (...args: unknown[]) => void) {
    this.orchestrator.on(event, handler);
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main(args: string[]): Promise<void> {
  const command = args[0] || 'help';
  const orch = new Orchestrator();

  switch (command) {
    case 'create':
      const graphName = args[1] || 'workflow';
      const strategy = (args[2] || 'dag') as ExecutionStrategy;
      const graph = orch.createGraph(graphName, strategy);
      console.log(`Created graph: ${graph.id} (${graph.name})`);
      break;

    case 'list':
      const graphs = orch.listGraphs();
      console.log(`\nGraphs (${graphs.length}):`);
      for (const g of graphs) {
        console.log(`  ${g.id} - ${g.name} [${g.status}]`);
      }
      break;

    case 'execute':
      const graphId = args[1];
      if (!graphId) {
        console.error('Graph ID required');
        process.exit(1);
      }
      console.log(`Executing graph: ${graphId}`);
      const results = await orch.execute(graphId);
      console.log('\nResults:');
      for (const [nodeId, result] of results) {
        console.log(`  ${nodeId}: ${result.success ? 'OK' : 'FAILED'}`);
      }
      break;

    default:
      console.log(`
Claude-Studio Orchestration System

Usage:
  orchestration.ts create <name> [strategy]  Create a new graph
  orchestration.ts list                       List all graphs
  orchestration.ts execute <graphId>         Execute a graph

Strategies: parallel, sequential, dag, wait_for_core
      `);
  }
}

// Run if executed directly
if (require.main === module || process.argv[1]?.endsWith('orchestration.ts')) {
  main(process.argv.slice(2)).catch(console.error);
}

export default Orchestrator;
