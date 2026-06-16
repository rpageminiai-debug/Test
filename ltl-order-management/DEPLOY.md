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

## Option 2 — Everything in GitHub Actions (no local tooling)

The workflow `.github/workflows/deploy-azure.yml` does the **whole thing** in CI: logs in to
Azure via OIDC, provisions the infra from `infra/main.bicep`, builds and publishes the app,
deploys it, and prints the live URL in the run summary. You install nothing locally — you
only authorize GitHub to deploy into your subscription **once**.

### 1. Create an Azure identity for GitHub (OIDC, no passwords stored)

Run these once (Azure Cloud Shell works), substituting your subscription id:

```bash
SUB=<your-subscription-id>
APP_ID=$(az ad app create --display-name "github-ltl-orders" --query appId -o tsv)
az ad sp create --id "$APP_ID"
az role assignment create --assignee "$APP_ID" --role Contributor --scope "/subscriptions/$SUB"

# Federate the credential to this repo + branch
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-ltl-orders",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:rpageminiai-debug/Test:ref:refs/heads/claude/clever-ptolemy-ukmatu",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app show --id "$APP_ID" --query appId -o tsv   # = AZURE_CLIENT_ID
az account show --query tenantId -o tsv               # = AZURE_TENANT_ID
```

> To also deploy from `main`, add a second federated credential with
> `"subject": "repo:rpageminiai-debug/Test:ref:refs/heads/main"`.

### 2. Add the GitHub secrets

Repo → **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
|---|---|---|
| Secret | `AZURE_CLIENT_ID` | the app id from step 1 |
| Secret | `AZURE_TENANT_ID` | your tenant id |
| Secret | `AZURE_SUBSCRIPTION_ID` | your subscription id |
| Secret | `SQL_ADMIN_PASSWORD` | a strong password for the Azure SQL admin |

Optional **variables** to override defaults: `AZURE_RESOURCE_GROUP` (`rg-ltl-orders`),
`AZURE_LOCATION` (`eastus`), `AZURE_ENV_NAME` (`ltl-prod`).

### 3. Run it

Push to the branch (or use **Actions → Deploy LTL Order Management to Azure → Run workflow**).
The run provisions everything and prints `✅ Deployed to https://app-….azurewebsites.net` in
its summary — that is your link. Re-runs are idempotent.

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
