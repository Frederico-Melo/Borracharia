import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ZodError } from 'zod';
import { DatabaseManager } from './lib/database';
import { AppError } from './lib/errors';
import { ProductRepository } from './repositories/product.repository';
import { SaleRepository } from './repositories/sale.repository';
import { CashRepository } from './repositories/cash.repository';
import { ServiceRepository } from './repositories/service.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { ProductService } from './services/product.service';
import { SaleService } from './services/sale.service';
import { CashService } from './services/cash.service';
import { CatalogService } from './services/catalog.service';
import { SettingsService } from './services/settings.service';
import { DashboardService } from './services/dashboard.service';
import { ReportService } from './services/report.service';
import { BackupService } from './services/backup.service';
import { ProductController } from './controllers/product.controller';
import { SaleController } from './controllers/sale.controller';
import { CashController } from './controllers/cash.controller';
import { CatalogController } from './controllers/catalog.controller';
import { SystemController } from './controllers/system.controller';
import { createRoutes } from './routes';

export type Backend = { app: express.Express; database: DatabaseManager; backups: BackupService };

export const createBackend = (options: { databasePath: string; migrationsPath: string; backupDir?: string }): Backend => {
  const database = new DatabaseManager(options.databasePath, options.migrationsPath);
  database.initialize();
  const productRepository = new ProductRepository(database);
  const saleRepository = new SaleRepository(database);
  const cashRepository = new CashRepository(database);
  const catalogRepository = new ServiceRepository(database);
  const settingsRepository = new SettingsRepository(database);
  const catalog = new CatalogService(catalogRepository);
  if (!catalogRepository.find('ALIGNMENT')) catalog.save('ALIGNMENT', 100);
  if (!catalogRepository.find('BALANCING')) catalog.save('BALANCING', 80);
  const settings = new SettingsService(settingsRepository);
  const backups = new BackupService(database, settings, options.backupDir || path.join(path.dirname(options.databasePath), 'backups'));
  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '220mb' }));
  app.use('/api', createRoutes({
    products: new ProductController(new ProductService(productRepository)),
    sales: new SaleController(new SaleService(database, saleRepository, productRepository, catalogRepository, cashRepository)),
    cash: new CashController(new CashService(cashRepository)),
    catalog: new CatalogController(catalog),
    system: new SystemController(new DashboardService(database), new ReportService(database), settings, backups),
  }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) return res.status(400).json({ message: 'Confira os campos informados.', details: error.flatten() });
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    console.error(error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno inesperado.' });
  });
  return { app, database, backups };
};
