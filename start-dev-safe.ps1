# =============================================================
#  DEV ENVIRONMENT LAUNCHER
#  Starts: Canvas (Docker/WSL), Canvas Bulk Editor, FlowStateASL
#  Press CTRL+C to shut everything down cleanly
# =============================================================

# -----------------------------------------------
#  CONFIGURATION — update these paths if needed
# -----------------------------------------------
$CanvasBulkEditorPath = "C:\dev\Canvas-Bulk-Editor"
$FlowStateASLPath     = "C:\dev\FlowStateASL"   # <-- UPDATE THIS if different
$CursorExePath        = "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"

# -----------------------------------------------
#  HELPER: Clear a port by killing its process
# -----------------------------------------------
function Clear-Port {
    param([int]$Port)
    $matches = netstat -ano | findstr ":$Port" | findstr "LISTENING"
    if ($matches) {
        $pids = $matches | ForEach-Object {
            ($_ -split '\s+')[-1]
        } | Select-Object -Unique

        foreach ($p in $pids) {
            if ($p -and $p -ne '0') {
                try {
                    $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                    if ($proc) {
                        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                        Write-Host "  Cleared port $Port (was held by $($proc.ProcessName) PID $p)" -ForegroundColor Yellow
                    }
                } catch {}
            }
        }
        Start-Sleep -Seconds 2
    }
}

# -----------------------------------------------
#  HELPER: Print the live status dashboard
# -----------------------------------------------
function Show-Status {
    param(
        [string]$Docker,
        [string]$BulkEditor,
        [string]$FlowState,
        [string]$Cursor
    )
    $colors = @{ "RUNNING" = "Green"; "FAILED" = "Red"; "STARTING..." = "Yellow"; "PENDING" = "DarkGray"; "LAUNCHED" = "Green"; "NOT FOUND" = "Red" }

    Clear-Host
    Write-Host ""
    Write-Host "  ================================================" -ForegroundColor Cyan
    Write-Host "   DEV ENVIRONMENT STATUS" -ForegroundColor Cyan
    Write-Host "  ================================================" -ForegroundColor Cyan
    Write-Host ""

    $icon1 = if ($Docker -eq "RUNNING") { "[OK]" } elseif ($Docker -eq "FAILED") { "[!!]" } else { "[..]" }
    $icon2 = if ($BulkEditor -eq "RUNNING") { "[OK]" } elseif ($BulkEditor -eq "FAILED") { "[!!]" } else { "[..]" }
    $icon3 = if ($FlowState -eq "RUNNING") { "[OK]" } elseif ($FlowState -eq "FAILED") { "[!!]" } else { "[..]" }
    $icon4 = if ($Cursor -eq "LAUNCHED") { "[OK]" } elseif ($Cursor -eq "NOT FOUND") { "[!!]" } else { "[..]" }

    Write-Host ("  {0}  Canvas Server (Docker + DB)" -f $icon1) -NoNewline
    Write-Host ("  --> {0}" -f $Docker) -ForegroundColor ($colors[$Docker] ?? "White")

    Write-Host ("  {0}  Canvas Bulk Editor" -f $icon2) -NoNewline
    Write-Host ("           --> {0}" -f $BulkEditor) -ForegroundColor ($colors[$BulkEditor] ?? "White")

    Write-Host ("  {0}  FlowStateASL + CF Tunnel" -f $icon3) -NoNewline
    Write-Host ("    --> {0}" -f $FlowState) -ForegroundColor ($colors[$FlowState] ?? "White")

    Write-Host ("  {0}  Cursor IDE" -f $icon4) -NoNewline
    Write-Host ("                    --> {0}" -f $Cursor) -ForegroundColor ($colors[$Cursor] ?? "White")

    Write-Host ""
    Write-Host "  ================================================" -ForegroundColor Cyan

    if ($Docker -eq "RUNNING" -and $BulkEditor -eq "RUNNING" -and $FlowState -eq "RUNNING") {
        Write-Host "  All services up. Press CTRL+C to stop all." -ForegroundColor Green
    } else {
        Write-Host "  Starting services... please wait." -ForegroundColor Yellow
    }

    Write-Host "  ================================================" -ForegroundColor Cyan
    Write-Host ""
}

# -----------------------------------------------
#  TRACK BACKGROUND JOBS FOR CLEAN SHUTDOWN
# -----------------------------------------------
$script:Jobs = @()
$script:BulkEditorPID  = $null
$script:FlowStatePID   = $null

# -----------------------------------------------
#  CTRL+C SHUTDOWN HANDLER
# -----------------------------------------------
function Stop-AllServices {
    Write-Host ""
    Write-Host "  Shutting down all services..." -ForegroundColor Yellow
    Write-Host ""

    # Stop Docker via WSL
    Write-Host "  Stopping Canvas Docker containers..." -ForegroundColor Yellow
    wsl bash -c "cd ~/canvas && docker compose down" 2>$null
    Write-Host "  [OK] Docker containers stopped." -ForegroundColor Green

    # Kill Canvas Bulk Editor by port 3001 (adjust if different)
    Write-Host "  Stopping Canvas Bulk Editor..." -ForegroundColor Yellow
    Clear-Port -Port 3001
    Write-Host "  [OK] Canvas Bulk Editor stopped." -ForegroundColor Green

    # Kill FlowStateASL by port 3000
    Write-Host "  Stopping FlowStateASL..." -ForegroundColor Yellow
    Clear-Port -Port 3000
    Write-Host "  [OK] FlowStateASL stopped." -ForegroundColor Green

    # Clean up any background jobs
    foreach ($job in $script:Jobs) {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
    }

    Write-Host ""
    Write-Host "  All services stopped. Goodbye!" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Register CTRL+C trap
[console]::TreatControlCAsInput = $false
$null = Register-EngineEvent -SourceIdentifier ([System.Console]::CancelKeyPress) -Action {
    Stop-AllServices
} 2>$null

# Fallback trap for script termination
trap {
    Stop-AllServices
}

# -----------------------------------------------
#  STEP 0: Initial status
# -----------------------------------------------
Show-Status "PENDING" "PENDING" "PENDING" "PENDING"

# -----------------------------------------------
#  STEP 1: Canvas Server via WSL + Docker
# -----------------------------------------------
Write-Host "  [1/4] Starting Canvas Docker containers via WSL..." -ForegroundColor Cyan
Show-Status "STARTING..." "PENDING" "PENDING" "PENDING"

try {
    $dockerResult = wsl bash -c "cd ~/canvas && docker compose up -d" 2>&1
    $dockerSuccess = $LASTEXITCODE -eq 0

    if ($dockerSuccess) {
        Show-Status "RUNNING" "PENDING" "PENDING" "PENDING"
    } else {
        Show-Status "FAILED" "PENDING" "PENDING" "PENDING"
        Write-Host "  WARNING: Docker may not have started correctly. Continuing anyway..." -ForegroundColor Red
        Start-Sleep -Seconds 2
    }
} catch {
    Show-Status "FAILED" "PENDING" "PENDING" "PENDING"
    Write-Host "  WARNING: Could not reach WSL. Is it installed?" -ForegroundColor Red
    Start-Sleep -Seconds 2
}

# -----------------------------------------------
#  STEP 2: Canvas Bulk Editor
# -----------------------------------------------
Write-Host "  [2/4] Starting Canvas Bulk Editor..." -ForegroundColor Cyan
Show-Status "RUNNING" "STARTING..." "PENDING" "PENDING"

Clear-Port -Port 3001

if (Test-Path $CanvasBulkEditorPath) {
    $bulkEditorJob = Start-Process "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$CanvasBulkEditorPath'; if (-not (Test-Path 'node_modules')) { npm install }; npm run start"
    ) -PassThru
    $script:BulkEditorPID = $bulkEditorJob.Id
    Start-Sleep -Seconds 4
    Show-Status "RUNNING" "RUNNING" "PENDING" "PENDING"
} else {
    Write-Host "  WARNING: Canvas Bulk Editor path not found: $CanvasBulkEditorPath" -ForegroundColor Red
    Show-Status "RUNNING" "FAILED" "PENDING" "PENDING"
    Start-Sleep -Seconds 2
}

# -----------------------------------------------
#  STEP 3: FlowStateASL (npm run start:dev)
# -----------------------------------------------
Write-Host "  [3/4] Starting FlowStateASL + Cloudflare..." -ForegroundColor Cyan
Show-Status "RUNNING" "RUNNING" "STARTING..." "PENDING"

Clear-Port -Port 3000

if (Test-Path $FlowStateASLPath) {
    $flowStateJob = Start-Process "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$FlowStateASLPath'; npm run start:dev"
    ) -PassThru
    $script:FlowStatePID = $flowStateJob.Id
    Start-Sleep -Seconds 5
    Show-Status "RUNNING" "RUNNING" "RUNNING" "PENDING"
} else {
    Write-Host "  WARNING: FlowStateASL path not found: $FlowStateASLPath" -ForegroundColor Red
    Show-Status "RUNNING" "RUNNING" "FAILED" "PENDING"
    Start-Sleep -Seconds 2
}

# -----------------------------------------------
#  STEP 4: Open Cursor (or VS Code fallback)
# -----------------------------------------------
Write-Host "  [4/4] Launching Cursor IDE..." -ForegroundColor Cyan

$cursorPaths = @(
    "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
    "$env:LOCALAPPDATA\Programs\Cursor\Cursor.exe",
    "C:\Program Files\Cursor\Cursor.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\cursor\Cursor.exe"
)

$cursorFound = $false
foreach ($path in $cursorPaths) {
    if (Test-Path $path) {
        Start-Process $path -ArgumentList $FlowStateASLPath
        $cursorFound = $true
        break
    }
}

if ($cursorFound) {
    Show-Status "RUNNING" "RUNNING" "RUNNING" "LAUNCHED"
} else {
    Write-Host "  Cursor not found, trying VS Code..." -ForegroundColor Yellow
    try {
        code $FlowStateASLPath
        Show-Status "RUNNING" "RUNNING" "RUNNING" "LAUNCHED"
    } catch {
        Write-Host "  Neither Cursor nor VS Code found in PATH." -ForegroundColor Red
        Show-Status "RUNNING" "RUNNING" "RUNNING" "NOT FOUND"
    }
}

# -----------------------------------------------
#  DONE — Keep terminal alive, wait for CTRL+C
# -----------------------------------------------
Write-Host ""
Write-Host "  Dev environment is live. Press CTRL+C to stop all services." -ForegroundColor Green
Write-Host ""

# Keep the script running so CTRL+C can be caught
while ($true) {
    Start-Sleep -Seconds 5

    # Optional: re-check port health every 30s and refresh display
    # Uncomment below if you want a live heartbeat
    # Show-Status "RUNNING" "RUNNING" "RUNNING" "LAUNCHED"
}