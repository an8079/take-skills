/**
 * Integration Tests Index
 *
 * Entry point for all integration tests.
 */

export { default as pipelineIntegrationTests } from './pipeline.test.ts';
export { default as artifactRegistryIntegrationTests } from './artifact-registry.test.ts';
export { default as phaseStateMachineIntegrationTests } from './phase-state-machine.test.ts';
export { default as approvalWorkflowIntegrationTests } from './approval-workflow.test.ts';
