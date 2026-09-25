import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// Explicit allow-list of searchable fields (§4.8) - prevents injection & internal data exposure
const ALLOWED_SEARCH_FIELDS = ['returnNumber', 'orderNumber', 'customerName', 'customerEmail', 'reason', 'status', 'items.name', 'items.sku'];

export class OpenSearchClient {
  constructor() {
    this.endpoint = env.OPENSEARCH_ENDPOINT;
  }

  /**
   * Fixed template search query.
   * Search term is strictly passed as a value parameter, NEVER concatenated into query DSL string (§4.8).
   */
  async searchReturns(searchTerm, page = 1, size = 20) {
    // Hard server-side cap at 50 per page (§1.5)
    const cappedSize = Math.min(Math.max(1, size), 50);
    const from = (Math.max(1, page) - 1) * cappedSize;

    // Structured Query DSL template using parameterized value
    const queryDsl = {
      from,
      size: cappedSize,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: searchTerm, // Parameterized value
                fields: ALLOWED_SEARCH_FIELDS,
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      sort: [{ createdAt: { order: 'desc' } }],
    };

    try {
      if (!this.endpoint || this.endpoint.includes('localhost') || this.endpoint.includes('mock')) {
        // In local/mock mode without active OpenSearch cluster, return null so service falls back to MongoDB
        return null;
      }

      const res = await fetch(`${this.endpoint}/returns/_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryDsl),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'OpenSearch cluster returned non-2xx status, using DB fallback');
        return null;
      }

      const data = await res.json();
      const hits = data.hits?.hits || [];
      const total = typeof data.hits?.total === 'object' ? data.hits.total.value : (data.hits?.total || 0);

      return {
        items: hits.map((h) => ({ id: h._id, ...h._source })),
        total,
        page,
        size: cappedSize,
        totalPages: Math.ceil(total / cappedSize),
      };
    } catch (err) {
      logger.warn({ error: err.message }, 'OpenSearch query failed, falling back to database query');
      return null;
    }
  }

  /**
   * Index return document into OpenSearch.
   */
  async indexReturn(returnDoc) {
    if (!this.endpoint || this.endpoint.includes('localhost') || this.endpoint.includes('mock')) {
      return;
    }

    try {
      const doc = {
        returnNumber: returnDoc.returnNumber,
        orderNumber: returnDoc.orderNumber,
        customerName: returnDoc.customerName,
        customerEmail: returnDoc.customerEmail,
        status: returnDoc.status,
        reason: returnDoc.reason,
        refundAmount: returnDoc.refundAmount,
        items: returnDoc.items,
        createdAt: returnDoc.createdAt,
      };

      await fetch(`${this.endpoint}/returns/_doc/${returnDoc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch (err) {
      logger.warn({ returnId: returnDoc._id, error: err.message }, 'OpenSearch document indexing failed');
    }
  }
}

export const openSearchClient = new OpenSearchClient();
