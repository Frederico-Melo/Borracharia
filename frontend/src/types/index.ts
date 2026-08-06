export type ProductType = 'TIRE' | 'WHEEL' | 'VALVE';
export type StockLocation = 'PAINT_STOCK' | 'STOCK' | 'STORE';
export type PaymentMethod = 'CASH' | 'PIX' | 'CARD' | 'OTHER';
export type Product = {
  id: number; type: ProductType; brand?: string | null; model?: string | null; name?: string | null;
  tireWidth?: string | null; tireHeight?: string | null; rim?: string | null; tireCondition?: 'NOVO' | 'REMODELADO' | null;
  boltPattern?: string | null; wheelWidth?: string | null; valveType?: string | null;
  stockLocation: StockLocation;
  purchasePrice: number; salePrice: number; quantity: number; minimumQuantity: number; lowStock: boolean;
};
export type CatalogService = { code: 'ALIGNMENT' | 'BALANCING'; name: string; price: number };
export type SaleItem = { id: number; itemType: 'PRODUCT' | 'SERVICE' | 'LABOR'; productId?: number | null; serviceCode?: string | null; description: string; quantity: number; unitPrice: number; unitCost: number; total: number };
export type Sale = { id: number; saleNumber: string; vehiclePlate?: string | null; vehicleModel?: string | null; subtotal: number; discountType?: 'FIXED' | 'PERCENT' | null; discountValue: number; discount: number; total: number; profit: number; paymentMethod: PaymentMethod; notes?: string | null; soldAt: string; items: SaleItem[] };
export type CashEntry = { id: number; saleId?: number | null; entryType: 'IN' | 'OUT'; category: 'SALE' | 'EXPENSE' | 'PURCHASE' | 'OTHER'; description: string; amount: number; occurredOn: string };
export type Dashboard = { todaySales: number; todayCount: number; monthSales: number; monthProfit: number; lowStock: Product[]; recentSales: Array<{ id: number; saleNumber: string; vehiclePlate?: string; vehicleModel?: string; total: number; paymentMethod: PaymentMethod; soldAt: string }> };
export type Settings = { companyName: string; defaultMinimumStock: number; automaticBackup: boolean; hideCostInInventory: boolean };
