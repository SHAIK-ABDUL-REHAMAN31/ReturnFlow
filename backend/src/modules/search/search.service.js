import { openSearchClient } from './opensearch-client.js';
import { returnsRepository } from '../returns/returns.repository.js';

export class SearchService {
  /**
   * Search returns across OpenSearch with seamless fallback to MongoDB.
   * Enforces hard server-side cap of 50 per page (§1.5).
   */
  async searchReturns(searchTerm, page = 1, size = 20) {
    const cappedSize = Math.min(Math.max(1, size), 50);

    // 1. Try OpenSearch cluster query first (§1.5)
    const openSearchResult = await openSearchClient.searchReturns(searchTerm, page, cappedSize);
    if (openSearchResult) {
      return {
        ...openSearchResult,
        source: 'opensearch',
      };
    }

    // 2. Fallback to MongoDB repository query if OpenSearch is offline
    const fallbackResult = await returnsRepository.list({
      search: searchTerm,
      page,
      limit: cappedSize,
    });

    return {
      items: fallbackResult.items,
      total: fallbackResult.total,
      page: fallbackResult.page,
      size: cappedSize,
      totalPages: fallbackResult.totalPages,
      source: 'database_fallback',
    };
  }
}

export const searchService = new SearchService();
