# start-all.ps1
# Usage: Right-click -> Run with PowerShell, or from PowerShell: .\start-all.ps1
# This script opens two PowerShell windows: one runs the backend (server), the other runs the frontend (client).

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$server = Join-Path $root 'server'
$client = Join-Path $root 'client'

Write-Host "Repository root: $root"

# Start backend
if (Test-Path $server) {
    $serverCmd = @(
        "-NoExit",
        "-Command",
        "Set-Location -Path '$server'; `
            if (Test-Path package.json) { npm install } else { Write-Host 'No package.json in server folder' }; `
            if (-not (Test-Path '.env') -and (Test-Path '.env.example')) { Copy-Item -Path '.env.example' -Destination '.env' -ErrorAction SilentlyContinue; Write-Host '.env created from .env.example' }; `
            Write-Host 'Starting backend (npm run dev)...'; npm run dev"
    )
    Start-Process powershell -ArgumentList $serverCmd -WindowStyle Normal
    Write-Host "Started backend window for: $server"
} else {
    Write-Warning "Server folder not found at: $server"
}

# Start frontend
if (Test-Path $client) {
    $clientCmd = @(
        "-NoExit",
        "-Command",
        "Set-Location -Path '$client'; `
            if (Test-Path package.json) { npm install } else { Write-Host 'No package.json in client folder' }; `
            Write-Host 'Starting frontend (npm start)...'; npm start"
    )
    Start-Process powershell -ArgumentList $clientCmd -WindowStyle Normal
    Write-Host "Started frontend window for: $client"
} else {
    Write-Warning "Client folder not found at: $client"
}

Write-Host 'All start commands launched. Check the newly opened PowerShell windows for logs.'
