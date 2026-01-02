# Helper script to fix PowerShell execution policy
# Run this once in PowerShell (you may need to run it with bypass first)
# Usage: powershell -ExecutionPolicy Bypass -File .\fix-powershell-policy.ps1

Write-Host "Setting PowerShell execution policy to RemoteSigned for CurrentUser..." -ForegroundColor Cyan
Write-Host "This will allow local scripts to run without signing." -ForegroundColor Yellow
Write-Host ""

try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "✓ Execution policy set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current execution policy settings:" -ForegroundColor Cyan
    Get-ExecutionPolicy -List
    Write-Host ""
    Write-Host "You can now run npm commands in PowerShell!" -ForegroundColor Green
} catch {
    Write-Host "✗ Error setting execution policy: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to run PowerShell as Administrator, or try:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
}

