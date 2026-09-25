import { searchService } from './search.service.js';

export class SearchController {
  async searchReturns(req, res, next) {
    try {
      const q = (req.query.q || '').toString().trim();
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const size = req.query.size ? parseInt(req.query.size, 10) : 20;

      const result = await searchService.searchReturns(q, page, size);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
