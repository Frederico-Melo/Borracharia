import { Request, Response } from 'express';
import { productSchema, stockMovementSchema } from '../dtos/product.dto';
import { ProductService } from '../services/product.service';

export class ProductController {
  constructor(private readonly service: ProductService) {}
  list = (req: Request, res: Response) => res.json(this.service.list(req.query as any));
  get = (req: Request, res: Response) => res.json(this.service.get(Number(req.params.id)));
  create = (req: Request, res: Response) => res.status(201).json(this.service.create(productSchema.parse(req.body)));
  update = (req: Request, res: Response) => res.json(this.service.update(Number(req.params.id), productSchema.parse(req.body)));
  remove = (req: Request, res: Response) => { this.service.remove(Number(req.params.id)); res.status(204).end(); };
  move = (req: Request, res: Response) => res.json(this.service.move(Number(req.params.id), stockMovementSchema.parse(req.body)));
  movements = (req: Request, res: Response) => res.json(this.service.movements(Number(req.params.id)));
}
