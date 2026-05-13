import { Request, Response } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';
import logger from '../utils/logger';

export class AdminController {
  constructor(private featureFlagService: FeatureFlagService) {}

  async getAllFlags(_req: Request, res: Response): Promise<void> {
    const flags = await this.featureFlagService.getAll();
    res.json({ data: flags });
  }

  async getFlag(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const flag = await this.featureFlagService.getByKey(key);

    if (!flag) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: `Feature flag '${key}' not found`, status: 404 },
      });
      return;
    }

    res.json({ data: flag });
  }

  async updateFlag(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const { value } = req.body;

    const existing = await this.featureFlagService.getByKey(key);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: `Feature flag '${key}' not found`, status: 404 },
      });
      return;
    }

    const flag = await this.featureFlagService.update(key, String(value));
    logger.info('Admin updated feature flag', { key, value: String(value) });
    res.json({ data: flag });
  }

  async createFlag(req: Request, res: Response): Promise<void> {
    const { key, value, type, description } = req.body;

    const existing = await this.featureFlagService.getByKey(key);
    if (existing) {
      res.status(409).json({
        error: { code: 'FLAG_EXISTS', message: `Feature flag '${key}' already exists`, status: 409 },
      });
      return;
    }

    const flag = await this.featureFlagService.create({ key, value: String(value), type, description });
    res.status(201).json({ data: flag });
  }
}
