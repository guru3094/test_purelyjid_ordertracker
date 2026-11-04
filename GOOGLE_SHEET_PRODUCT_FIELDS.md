# Google Sheet product fields

Add these five columns to the `Orders` sheet after the existing `Sync Error` column:

| Column | Header | Input |
|---|---|---|
| O | Product Name/Order Details | Free text |
| P | Product Cost | Number |
| Q | Advance Paid | Number |
| R | Balance to be paid | Number |
| S | Product Category | Workshop, Resin Art, or Raw Materials |

For Product Category, configure Google Sheets data validation on column S using a dropdown with these exact values:

- Workshop
- Resin Art
- Raw Materials

Before deploying the application changes, run `database/migrations/013_add_product_fields_to_orders.sql` in the Supabase SQL Editor.
