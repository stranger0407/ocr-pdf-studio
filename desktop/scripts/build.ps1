$ErrorActionPreference = "Stop"

$desktopDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$repoRoot = Resolve-Path (Join-Path $desktopDir "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"

Push-Location $frontendDir
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run build
Pop-Location

$backendPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $backendPython)) {
  Push-Location $backendDir
  python -m venv .venv
  Pop-Location
}

& $backendPython -m pip install -r (Join-Path $backendDir "requirements.txt")
& $backendPython -m pip install pyinstaller

Push-Location $backendDir
& $backendPython -m PyInstaller --noconfirm --clean ocr_backend.spec
Pop-Location

Push-Location $desktopDir
if (-not (Test-Path "node_modules")) {
  npm install
}
npm run dist
Pop-Location