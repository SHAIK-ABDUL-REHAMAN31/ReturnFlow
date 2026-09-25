import { env } from '../config/env.js';

/**
 * CloudWatch Embedded Metric Format (EMF) Logger (§2 Phase 2 & Phase 5).
 * Outputs structured JSON logs compliant with AWS CloudWatch EMF specification.
 * CloudWatch automatically extracts custom metrics without running a daemon or extra SDK calls.
 * Zero external dependencies.
 */
class CloudWatchMetrics {
  constructor() {
    this.namespace = 'ReturnFlow/Platform';
    this.serviceName = 'returnflow-api';
  }

  /**
   * Emits an EMF formatted log line to stdout.
   */
  emit(metricName, value, unit = 'Count', dimensions = {}) {
    const timestamp = Date.now();
    const dimensionKeys = Object.keys(dimensions);

    const emfPayload = {
      _aws: {
        Timestamp: timestamp,
        CloudWatchMetrics: [
          {
            Namespace: this.namespace,
            Dimensions: dimensionKeys.length > 0 ? [dimensionKeys] : [['Environment', 'Service']],
            Metrics: [
              {
                Name: metricName,
                Unit: unit,
              },
            ],
          },
        ],
      },
      Environment: env.NODE_ENV,
      Service: this.serviceName,
      ...dimensions,
      [metricName]: value,
    };

    if (env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(emfPayload));
    }
  }

  recordReturnCreated(reason, refundAmount) {
    this.emit('ReturnsCreated', 1, 'Count', { Reason: reason });
    if (refundAmount > 0) {
      this.emit('RefundEstimatedValue', refundAmount, 'None', { Reason: reason });
    }
  }

  recordReturnApproved() {
    this.emit('ReturnsApproved', 1, 'Count');
  }

  recordReturnReceived() {
    this.emit('ReturnsReceived', 1, 'Count');
  }

  recordRefundCompleted(amount) {
    this.emit('RefundsCompleted', 1, 'Count');
    this.emit('RefundsCompletedValue', amount, 'None');
  }

  recordCarrierEvent(event, carrier) {
    this.emit('CarrierEventsReceived', 1, 'Count', { Event: event, Carrier: carrier });
  }
}

export const metrics = new CloudWatchMetrics();
