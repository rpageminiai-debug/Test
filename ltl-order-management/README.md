# LTL Order Management

A web rebuild of the **Single Order Management Form** (TruckMate / LTL freight workbook,
`1_Single_Order_Management_Form_v14.xlsm`). The Excel macro workbook is replaced by an
enterprise-grade stack:

- **Frontend:** React 18 + TypeScript (Vite)
- **Backend:** C# / ASP.NET Core 8 Web API + Entity Framework Core
- **Database:** Microsoft SQL Server (native fit for a TruckMate / Microsoft shop), with an
  in-memory provider fallback so the API runs with zero setup during development.

The field set, validation rules, and drop-down lists are transcribed directly from the
workbook so the mapping back to the original form is one-to-one.

## What was carried over from the workbook

| Workbook artifact | Where it lives now |
|---|---|
| **Database** sheet (70 columns) | `Order` entity / `OrderDto` — the canonical field set |
| **Config** sheet (required + conditional rules) | `OrderValidator.cs` (server) and `config/fieldConfig.ts` (client) |
| **Lists** sheet (drop-down options) | `Data/ReferenceData.cs`, served at `/api/reference-data` |
| **LTL ORDER MGMT FORM** sheet | `components/OrderForm.tsx` (sections: Header, Caller, Shipper, Consignee, Bill To, Pickup, Delivery, Freight Description, Equipment, Reference Numbers, Notes) |
| **SUBMITTED ORDERS / PARKED ORDERS** sheets | `components/OrdersList.tsx` + the list/filter API |
| Submit / Park / Update / Reset buttons | `OrdersController` actions + form toolbar |

### Validation rules (from the Config sheet)

- Most fields are **required** to *submit*. `Quote` and all `Bill To` fields are optional.
- **Conditional rules:** `Pickup Appt Date` / `Pickup Appt Time` are required only when
  `Pickup Appt Required = YES`; likewise for the delivery appointment fields
  (mirrors the workbook formulas `Form!I12="Yes"` and `Form!I22="Yes"`).
- **Park** deliberately bypasses validation so an agent can save a partially complete order
  (with an optional reason), exactly like the workbook's "park" flow.

## Project layout

```
ltl-order-management/
├── backend/LtlOrderManagement.Api/   # ASP.NET Core Web API
│   ├── Domain/                       # Order entity + OrderStatus enum
│   ├── Data/                         # EF Core DbContext + reference lists
│   ├── Dtos/                         # API contracts + entity<->dto mapping
│   ├── Validation/                   # OrderValidator (Config-sheet rules)
│   ├── Controllers/                  # Orders + ReferenceData endpoints
│   └── Program.cs
└── frontend/                         # React + TypeScript SPA (Vite)
    └── src/
        ├── api/        # typed fetch client
        ├── components/ # OrderForm, FormSection, Field, OrdersList
        ├── config/     # required/conditional field config
        ├── validation/ # client-side validator + labels
        └── types/      # Order/ReferenceData types
```

## Running it

### Backend (requires .NET 8 SDK)

```bash
cd backend/LtlOrderManagement.Api
dotnet run            # serves the API (Swagger UI in Development)
```

By default the API uses an **in-memory** database. To use SQL Server, set the connection
string and the relational provider is selected automatically:

```bash
dotnet run --ConnectionStrings:Default="Server=.;Database=LtlOrders;Trusted_Connection=True;TrustServerCertificate=True"
```

> The Vite dev proxy expects the API on `http://localhost:5080`. Run with
> `dotnet run --urls http://localhost:5080` (or adjust `vite.config.ts`).

### Frontend (requires Node 18+)

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

## API surface

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/reference-data` | Drop-down lists for the form |
| `GET` | `/api/orders?status=Submitted\|Parked` | List orders (optionally filtered) |
| `GET` | `/api/orders/{id}` | Fetch a single order |
| `POST` | `/api/orders/submit` | Validate + submit (assigns a Freight Bill #) |
| `POST` | `/api/orders/park` | Save a partial order with a reason (no validation) |
| `PUT` | `/api/orders/{id}` | Validate + update (status → Updated) |
| `DELETE` | `/api/orders/{id}` | Remove an order |

Failed validation returns **422** with a `{ message, errors[] }` body; the SPA maps those
errors back onto the matching fields.

## Notes & assumptions

- Drop-down values are taken verbatim from the Lists sheet. A few free-form workbook fields
  (e.g. `Dangerous goods`, `Heat Requirement`, `SLC`, equipment PTG/Inside/Dock/Pallet jack)
  are rendered as YES/NO selects for consistency; switch them to text inputs in
  `OrderForm.tsx` if free-form entry is preferred.
- The original `.xlsm` also contained peripheral sheets (Home, MISC) and VBA macros; only the
  order-management workflow was reproduced.
- The Freight Bill number format (`APPS#######`) is a placeholder — wire it to the real
  TruckMate numbering scheme as needed.
