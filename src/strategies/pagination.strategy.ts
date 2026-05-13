import { FeatureFlagService } from '../services/feature-flag.service';
import { PAGINATION } from '../config/constants';

export interface PaginationStrategy {
  getLimit(): Promise<number>;
}

export class DynamicPaginationStrategy implements PaginationStrategy {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getLimit(): Promise<number> {
    const limit = await this.featureFlagService.getNumber('PAGINATION_LIMIT');
    return Math.max(PAGINATION.MIN_LIMIT, Math.min(PAGINATION.MAX_LIMIT, limit));
  }
}
