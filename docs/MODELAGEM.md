# Modelo de dados

```mermaid
erDiagram
  PRODUCTS ||--o{ STOCK_MOVEMENTS : possui
  PRODUCTS o|--o{ SALE_ITEMS : vendido_em
  SALES ||--|{ SALE_ITEMS : contem
  SALES o|--o| CASH_ENTRIES : gera
  SERVICE_CATALOG o|--o{ SALE_ITEMS : referencia
```

| Tabela | Finalidade |
|---|---|
| `products` | Pneus, rodas e bicos; campos específicos por tipo, localização do pneu, preços, saldo e estoque mínimo. |
| `stock_movements` | Auditoria de estoque inicial, entrada, saída, ajuste e venda. |
| `service_catalog` | Somente alinhamento e balanceamento, com preço editável. |
| `sales` | Cabeçalho da venda: veículo, desconto, pagamento, totais, lucro e observação. |
| `sale_items` | Produtos, serviços tabelados, mão de obra e peças avulsas; guarda preço/custo histórico. |
| `cash_entries` | Entradas de venda e saídas/entradas manuais. |
| `settings` | Nome da empresa, mínimo padrão, preferência de backup e opção de ocultar custos nas listagens. |
| `schema_migrations` | Controle das migrations aplicadas. |

## Cálculos

- `subtotal = Σ item.quantidade × item.preço_unitário`
- `total = subtotal − desconto`
- `custo = Σ (produto ou peça avulsa).quantidade × custo_unitário histórico`
- `lucro = total − custo`

O desconto é aplicado ao lucro da venda. Como não há custo direto cadastrado para alinhamento, balanceamento e mão de obra, esses itens entram com custo zero. Cada peça avulsa registra seu próprio custo no momento da venda e não gera movimentação de estoque.
