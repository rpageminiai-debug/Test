# Deploying to Azure

The app is configured to run as a **single Azure App Service** (Linux, .NET 8) that serves
both the ASP.NET Core API and the React SPA from one origin, backed by an **Azure SQL
Database**. Because they share an origin there is no CORS or API-base-URL wiring to manage.

```
                ┌─────────────────────────────────────────┐
   Browser ───► │  Azure App Service (DOTNETCORE|8.0)       │
                │   ├─ /api/*    → ASP.NET Core controllers │
                │   └─ /*        → React SPA (wwwroot)       │
                └───────────────┬───────────────────────────┘
                                │  ConnectionStrings__Default
                                ▼
                        Azure SQL Database (LtlOrders)
```

> **What you provide:** an Azure subscription and a login. Everything else (resource
> provisioning + build + deploy) is scripted. Nothing here was deployed from the build
> sandbox because it has no Azure credentials — these are the commands to run on your side.

---

## Option 1 — Azure Developer CLI (recommended, one command)

Prerequisites: [azd](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd),
the .NET 8 SDK, and Node 20+.

```bash
cd ltl-order-management
azd auth login
azd up
```

`azd up` will:
1. Prompt for an environment name, Azure region, and the **SQL admin password**
   (set `SQL_ADMIN_PASSWORD`; optionally `SQL_ADMIN_LOGIN`, default `ltladmin`).
2. Provision the resources in `infra/main.bicep` (App Service plan + App Service + Azure SQL).
3. Run the `prepackage` hook (`scripts/build-frontend.sh`) to build the React app into the
   API's `wwwroot`.
4. Publish and deploy the .NET app.

When it finishes, azd prints the site URL (the Bicep `WEB_URI` output) — that is your link.

To tear everything down: `azd down`.

---

## Option 2 — Provision once, then deploy via GitHub Actions

Use this if you want pushes to the branch to deploy automatically.

### 1. Provision infrastructure

```bash
az group create --name rg-ltl-orders --location eastus

az deployment group create \
  --resource-group rg-ltl-orders \
  --template-file ltl-order-management/infra/main.bicep \
  --parameters environmentName=ltl-prod sqlAdminPassword='<STRONG_PASSWORD>'
```

Note the App Service name from the output (`app-xxxxxxxx`).

### 2. Wire up the workflow

The workflow at `.github/workflows/deploy-azure.yml` deploys on push to
`claude/clever-ptolemy-ukmatu` or `main`. Configure in the repo:

| Type | Name | Value |
|---|---|---|
| Variable | `AZURE_WEBAPP_NAME` | the App Service name from step 1 |
| Secret | `AZURE_WEBAPP_PUBLISH_PROFILE` | download from the App Service → *Get publish profile* |

```bash
az webapp deployment list-publishing-profiles \
  --name <app-xxxxxxxx> --resource-group rg-ltl-orders --xml
```

Paste that XML into the `AZURE_WEBAPP_PUBLISH_PROFILE` secret. Push a commit (or run the
workflow manually) and it builds + deploys.

---

## Configuration reference

| Setting | Where | Purpose |
|---|---|---|
| `ConnectionStrings__Default` | App Service app setting (set by Bicep) | SQL connection string; when present the API uses SQL Server, otherwise an in-memory store. |
| `ASPNETCORE_ENVIRONMENT` | App Service app setting | `Production` in Azure (disables Swagger UI). |
| SQL SKU | `infra/main.bicep` (`GP_S_Gen5_1`, serverless, auto-pause) | Low-cost default; raise for production load. |
| App Service SKU | `appServicePlanSku` param (`B1`) | Scale up/out for production. |

## Notes

- The database schema is created automatically on first run (`EnsureCreated`). For schema
  evolution over time, switch to EF Core migrations.
- The serverless SQL tier auto-pauses after 1 hour idle; the first request after a pause
  incurs a short cold-start.
- Costs are billed to your subscription while resources exist — run `azd down` (or delete the
  resource group) when you no longer need the demo.
