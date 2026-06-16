# Builds the React SPA and copies the output into the API's wwwroot (Windows/PowerShell).
# Invoked by the azd prepackage hook on Windows.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir "..")
$Frontend = Join-Path $Root "frontend"
$Wwwroot = Join-Path $Root "backend/LtlOrderManagement.Api/wwwroot"

Write-Host "==> Building React app in $Frontend"
Push-Location $Frontend
npm ci
npm run build
Pop-Location

Write-Host "==> Copying dist into $Wwwroot"
if (Test-Path $Wwwroot) { Remove-Item -Recurse -Force $Wwwroot }
New-Item -ItemType Directory -Force -Path $Wwwroot | Out-Null
Copy-Item -Recurse -Force (Join-Path $Frontend "dist/*") $Wwwroot

Write-Host "==> Frontend bundled into API wwwroot."
