import fs from 'node:fs';
import { Request, Response } from 'express';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard.service';
import { ReportService } from '../services/report.service';
import { SettingsService } from '../services/settings.service';
import { BackupService } from '../services/backup.service';

export class SystemController {
  constructor(private readonly dashboard: DashboardService, private readonly reports: ReportService, private readonly settings: SettingsService, private readonly backups: BackupService) {}
  dashboardData = (_req: Request, res: Response) => res.json(this.dashboard.get());
  reportsData = (req: Request, res: Response) => res.json(this.reports.get(req.query as any));
  getSettings = (_req: Request, res: Response) => res.json(this.settings.get());
  updateSettings = (req: Request, res: Response) => res.json(this.settings.update(z.object({ companyName: z.string().trim().min(1).max(80).optional(), defaultMinimumStock: z.coerce.number().int().min(0).optional(), automaticBackup: z.boolean().optional() }).parse(req.body)));
  exportBackup = (_req: Request, res: Response) => {
    const file = this.backups.exportTemporary();
    res.download(file, `backup-pneu-pro-${new Date().toISOString().slice(0, 10)}.db`, () => { if (fs.existsSync(file)) fs.rmSync(file); });
  };
  importBackup = (req: Request, res: Response) => { this.backups.importBase64(z.object({ data: z.string().min(1) }).parse(req.body).data); res.json({ ok: true }); };
}
