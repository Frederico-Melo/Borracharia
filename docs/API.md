# API local

Base: `http://127.0.0.1:<porta>/api`. A porta é interna, aleatória e gerenciada pelo Electron.

| Método e rota | Descrição |
|---|---|
| `GET /dashboard` | Indicadores do painel inicial. |
| `GET/POST /products` | Lista ou cadastra pneus, rodas e bicos. |
| `GET/PUT/DELETE /products/:id` | Consulta, edita ou remove/arquiva produto. |
| `POST /products/:id/stock` | Entrada, saída ou ajuste de estoque. |
| `GET /products/:id/movements` | Histórico de estoque. |
| `GET/PUT /services/:code` | Consulta ou atualiza alinhamento/balanceamento. |
| `GET/POST /sales` | Histórico paginado (10 vendas por página) ou criação de venda transacional. |
| `GET/DELETE /sales/:id` | Detalhe completo ou exclusão com estorno de estoque e caixa. |
| `PATCH /sales/:id/notes` | Altera apenas as observações. |
| `GET/POST /cash` | Caixa e lançamento manual. |
| `DELETE /cash/:id` | Exclui somente um lançamento manual do caixa. |
| `GET /reports` | Indicadores e rankings por período. |
| `GET/PUT /settings` | Preferências locais. |
| `GET /backups/export` | Download de cópia consistente do banco. |
| `POST /backups/import` | Restaura backup validado. |

## Exemplo de venda

```json
{
  "vehiclePlate": "ABC1D23",
  "vehicleModel": "Onix 1.0",
  "paymentMethod": "PIX",
  "discountType": "PERCENT",
  "discountValue": 5,
  "items": [
    { "itemType": "PRODUCT", "productId": 1, "description": "Michelin Primacy 4 205/55 R16", "quantity": 2, "unitPrice": 690 },
    { "itemType": "SERVICE", "serviceCode": "ALIGNMENT", "description": "Alinhamento", "quantity": 1, "unitPrice": 100 },
    { "itemType": "LABOR", "description": "Troca de pastilhas", "quantity": 1, "unitPrice": 80 }
  ]
}
```
