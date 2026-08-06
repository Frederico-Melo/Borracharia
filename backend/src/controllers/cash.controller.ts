import { Request, Response } from 'express';
import { cashEntrySchema } from '../dtos/cash.dto';
import { CashService } from '../services/cash.service';

export class CashController {
  constructor(private readonly service: CashService) {}
  list = (req: Request, res: Response) => res.json(this.service.list(req.query as any));
  create = (req: Request, res: Response) => { this.service.create(cashEntrySchema.parse(req.body)); res.status(201).json({ ok: true }); };
}
