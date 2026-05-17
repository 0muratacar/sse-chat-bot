import { injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { Tier } from '@prisma/client';
import { FeatureFlagService } from '../services/feature-flag.service';
import { UserRepository } from '../repositories/user.repository';
import { t } from '../i18n';
import logger from '../utils/logger';

@injectable()
export class AdminController {
  constructor(
    private featureFlagService: FeatureFlagService,
    private userRepository: UserRepository
  ) {}

  async getAllFlags(_req: Request, res: Response): Promise<void> {
    const flags = await this.featureFlagService.getAll();
    res.json({ data: flags });
  }

  async getFlag(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const flag = await this.featureFlagService.getByKey(key);

    if (!flag) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
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
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
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
        error: { code: 'FLAG_EXISTS', message: t('FLAG_EXISTS', req.lang), status: 409 },
      });
      return;
    }

    const flag = await this.featureFlagService.create({ key, value: String(value), type, description });
    res.status(201).json({ data: flag });
  }

  async deleteFlag(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;

    const existing = await this.featureFlagService.getByKey(key);
    if (!existing) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    await this.featureFlagService.delete(key);
    logger.info('Admin deleted feature flag', { key });
    res.status(204).send();
  }

  async getTierOverrides(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;

    const flag = await this.featureFlagService.getByKey(key);
    if (!flag) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    const overrides = await this.featureFlagService.getTierOverrides(key);
    res.json({ data: overrides });
  }

  async setTierOverride(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const tier = req.params.tier as Tier;
    const { value } = req.body;

    const flag = await this.featureFlagService.getByKey(key);
    if (!flag) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    const override = await this.featureFlagService.setTierOverride(key, tier, String(value));
    logger.info('Admin set tier override', { key, tier, value: String(value) });
    res.json({ data: override });
  }

  async deleteTierOverride(req: Request, res: Response): Promise<void> {
    const key = req.params.key as string;
    const tier = req.params.tier as Tier;

    const flag = await this.featureFlagService.getByKey(key);
    if (!flag) {
      res.status(404).json({
        error: { code: 'FLAG_NOT_FOUND', message: t('FLAG_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    try {
      await this.featureFlagService.deleteTierOverride(key, tier);
      logger.info('Admin deleted tier override', { key, tier });
      res.status(204).send();
    } catch {
      res.status(404).json({
        error: { code: 'TIER_OVERRIDE_NOT_FOUND', message: t('TIER_OVERRIDE_NOT_FOUND', req.lang), status: 404 },
      });
    }
  }

  async getUsers(_req: Request, res: Response): Promise<void> {
    const users = await this.userRepository.findAll();
    res.json({ data: users });
  }

  async updateUserTier(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as string;
    const { tier } = req.body;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: t('USER_NOT_FOUND', req.lang), status: 404 },
      });
      return;
    }

    const updated = await this.userRepository.updateTier(userId, tier as Tier);
    logger.info('Admin updated user tier', { userId, tier });
    res.json({ data: { id: updated.id, email: updated.email, tier: updated.tier } });
  }
}
