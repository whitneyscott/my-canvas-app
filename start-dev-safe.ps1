# PowerShell script to safely start NestJS dev server
# This script kills any process using port 3000 before starting the server

Write-Host "Checking for processes using port 3000..." -ForegroundColor Yellow

# Find processes using port 3000
$portProcesses = netstat -ano | findstr :3000 | findstr LISTENING

if ($portProcesses) {
    Write-Host "Found process(es) using port 3000. Terminating..." -ForegroundColor Yellow
    
    # Extract PIDs from netstat output
    $pids = $portProcesses | ForEach-Object {
        $parts = $_ -split '\s+'
        $parts[-1]  # Last part is the PID
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne '0') {
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Killing process $pid ($($process.ProcessName))..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "Could not kill process $pid: $_" -ForegroundColor Red
            }
        }
    }
    
    # Wait a moment for the port to be released
    Start-Sleep -Seconds 2
    Write-Host "Port 3000 should now be free." -ForegroundColor Green
} else {
    Write-Host "Port 3000 is free." -ForegroundColor Green
}

Write-Host "Starting NestJS development server..." -ForegroundColor Cyan
npm run start:dev






















