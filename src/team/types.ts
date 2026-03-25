/**
 * Team Types - 团队协作类型定义
 */

export type TeamPipelinePhase =
  | 'team-plan'
  | 'team-exec'
  | 'team-verify'
  | 'team-fix'
  | 'complete'
  | 'failed'
  | 'cancelled';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export interface TeamConfig {
  name: string;
  createdAt: number;
  phase: TeamPipelinePhase;
  iteration: number;
  maxIterations: number;
  workers: Record<string, WorkerInfo>;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
}

export interface WorkerInfo {
  name: string;
  role: TeamRole;
  model: 'haiku' | 'sonnet' | 'opus';
  status: 'idle' | 'active' | 'done' | 'failed';
  lastHeartbeat: number;
  currentTaskId?: string;
}

export type TeamRole =
  | 'team-lead'      // 监督者 - 协调整个团队
  | 'analyst'         // 分析师 - 分析需求和架构
  | 'executor'        // 干活的 - 执行具体任务
  | 'verifier'        // 验证者 - 检查结果
  | 'critic'          // 批评者 - 挑战方案
  | 'coordinator';    // 协调者 - 任务分发

export interface TeamTask {
  id: string;
  subject: string;
  description: string;
  status: TaskStatus;
  owner?: string;
  blockedBy: string[];
  blocks: string[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface TeamState {
  schema_version: number;
  mode: 'team';
  active: boolean;
  session_id: string;
  project_path: string;
  phase: TeamPipelinePhase;
  phase_history: Array<{
    phase: TeamPipelinePhase;
    entered_at: number;
    exited_at?: number;
  }>;
  iteration: number;
  max_iterations: number;
  artifacts: {
    plan_path?: string;
    prd_path?: string;
    verify_report_path?: string;
  };
  execution: {
    workers_total: number;
    workers_active: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_failed: number;
  };
  fix_loop: {
    attempt: number;
    max_attempts: number;
    last_failure_reason?: string;
  };
  started_at: number;
  updated_at: number;
  completed_at?: number;
}

export interface TeamMessage {
  id: string;
  from: string;
  to: string;
  type: 'direct' | 'broadcast' | 'shutdown_request' | 'shutdown_response';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SharedMemory {
  team_name: string;
  data: Record<string, unknown>;
  updated_at: number;
  updated_by: string;
}
