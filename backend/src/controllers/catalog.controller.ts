import { Request, Response } from 'express';
import { z } from 'zod';
import { CatalogService } from '../services/catalog.service';

export class CatalogController {
  constructor(private readonly service: CatalogService) {}
  list = (_req: Request, res: Response) => res.json(this.service.list());
  save = (req: Request, res: Response) => {
    const body = z.object({ price: z.coerce.number().min(0) }).parse(req.body);
    res.json(this.service.save(req.params.code as 'ALIGNMENT' | 'BALANCING', body.price));
  };
}
