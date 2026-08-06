import { Request, Response } from 'express';
import { z } from 'zod';
import { saleSchema } from '../dtos/sale.dto';
import { SaleService } from '../services/sale.service';

export class SaleController {
  constructor(private readonly service: SaleService) {}
  list = (req: Request, res: Response) => res.json(this.service.list(req.query as any));
  get = (req: Request, res: Response) => res.json(this.service.get(Number(req.params.id)));
  create = (req: Request, res: Response) => res.status(201).json(this.service.create(saleSchema.parse(req.body)));
  notes = (req: Request, res: Response) => res.json(this.service.updateNotes(Number(req.params.id), z.object({ notes: z.string().trim().max(1000).nullable() }).parse(req.body).notes));
  remove = (req: Request, res: Response) => { this.service.remove(Number(req.params.id)); res.status(204).end(); };
}
