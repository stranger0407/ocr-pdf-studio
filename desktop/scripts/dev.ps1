$ErrorActionPreference = "Stop"

$desktopDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$repoRoot = Resolve-Path (Join-Path $desktopDir "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"

if (-not (Test-Path $frontendDir)) {
  throw "Frontend directory not found: $frontendDir"
}

if (-not (Test-Path $backendDir)) {
  throw "Backend directory not found: $backendDir"
}

Push-Location $frontendDir
if (-not (Test-Path "node_modules")) {
  npm install
}
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $frontendDir
Pop-Location

$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $backendPython)) {
  Push-Location $backendDir
  python -m venv .venv
  Pop-Location
}

& $backendPython -m pip install -r (Join-Path $backendDir "requirements.txt")

Push-Location $desktopDir
$env:BACKEND_PYTHON = $backendPython
$env:ELECTRON_DEV_SERVER_URL = "http://localhost:5173"
if (-not (Test-Path "node_modules")) {
  npm install
}
npx electron .
Pop-Location