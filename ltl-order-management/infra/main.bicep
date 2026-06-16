targetScope = 'resourceGroup'

@minLength(1)
@description('Name of the azd environment, used to derive resource names.')
param environmentName string

@minLength(1)
@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Azure SQL administrator login.')
param sqlAdminLogin string = 'ltladmin'

@secure()
@description('Azure SQL administrator password. Provided by azd (prompted) or a pipeline secret.')
param sqlAdminPassword string

@description('App Service plan SKU. B1 is a low-cost default; scale up for production load.')
param appServicePlanSku string = 'B1'

var resourceToken = toLower(uniqueString(subscription().id, resourceGroup().id, environmentName))
var tags = { 'azd-env-name': environmentName }

var planName = 'plan-${resourceToken}'
var webAppName = 'app-${resourceToken}'
var sqlServerName = 'sql-${resourceToken}'
var sqlDbName = 'LtlOrders'

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }

  resource db 'databases' = {
    name: sqlDbName
    location: location
    sku: {
      name: 'GP_S_Gen5_1'
      tier: 'GeneralPurpose'
    }
    properties: {
      autoPauseDelay: 60
      minCapacity: json('0.5')
    }
  }

  // Allow other Azure services (the App Service) to reach the SQL server.
  resource allowAzure 'firewallRules' = {
    name: 'AllowAllAzureIps'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
}

var sqlConnectionString = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDbName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  // The azd-service-name tag links this host to the "web" service in azure.yaml.
  tags: union(tags, { 'azd-service-name': 'web' })
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'ConnectionStrings__Default'
          value: sqlConnectionString
        }
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Production'
        }
      ]
    }
  }
}

output AZURE_LOCATION string = location
output WEB_URI string = 'https://${webApp.properties.defaultHostName}'
output SQL_SERVER_FQDN string = sqlServer.properties.fullyQualifiedDomainName
