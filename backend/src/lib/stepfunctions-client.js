import { StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { sfnClient } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

class StepFunctionsService {
  /**
   * Orchestrates the label-generation sub-flow via AWS Step Functions (§1.6).
   * Visual state machine: ValidateReturn -> GenerateLabel -> UploadToS3 -> UpdateStatus -> Notify.
   *
   * @param {string} returnId
   * @param {string} returnNumber
   * @param {object} metadata
   * @returns {Promise<{ executionArn: string, startDate: Date }>}
   */
  async startLabelGenerationExecution(returnId, returnNumber, metadata = {}) {
    const inputPayload = {
      returnId,
      returnNumber,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // AWS Step Functions execution names must be <= 80 characters, alphanumeric, hyphens or underscores
    const safeReturnNumber = (returnNumber || 'RET').replace(/[^a-zA-Z0-9-_]/g, '');
    const executionName = `rf-label-${safeReturnNumber}-${Date.now()}`.slice(0, 80);

    const params = {
      stateMachineArn: env.STEP_FUNCTIONS_LABEL_ARN,
      name: executionName,
      input: JSON.stringify(inputPayload),
    };

    try {
      const command = new StartExecutionCommand(params);
      const response = await sfnClient.send(command);

      logger.info(
        { executionArn: response.executionArn, returnNumber },
        'Started Step Functions label-generation execution'
      );

      return {
        executionArn: response.executionArn,
        startDate: response.startDate || new Date(),
      };
    } catch (err) {
      logger.warn(
        { error: err.message, returnNumber },
        'Step Functions execution start failed (falling back or local mode)'
      );

      // Return graceful fallback response so business workflow continues
      return {
        executionArn: `arn:aws:states:${env.AWS_REGION}:local:execution:mock-${executionName}`,
        startDate: new Date(),
        fallback: true,
      };
    }
  }

  /**
   * Queries execution status for polling or visualizer (§1.6)
   */
  async getExecutionStatus(executionArn) {
    if (!executionArn || executionArn.includes(':local:')) {
      return { status: 'SUCCEEDED', output: null };
    }

    try {
      const command = new DescribeExecutionCommand({ executionArn });
      const response = await sfnClient.send(command);
      return {
        status: response.status,
        startDate: response.startDate,
        stopDate: response.stopDate,
        output: response.output ? JSON.parse(response.output) : null,
      };
    } catch (err) {
      logger.warn({ executionArn, error: err.message }, 'Failed to describe Step Functions execution');
      return { status: 'UNKNOWN' };
    }
  }
}

export const stepFunctionsService = new StepFunctionsService();
