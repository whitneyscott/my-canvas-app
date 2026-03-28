param(
  [int]$Port = 3002
)
$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Host "No process is listening on port $Port."
  exit 0
}
$procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $procIds) {
  try {
    $p = Get-Process -Id $procId -ErrorAction Stop
    Write-Host "Stopping PID $procId ($($p.ProcessName)) on port $Port"
    Stop-Process -Id $procId -Force -ErrorAction Stop
  } catch {
    Write-Host "Could not stop PID ${procId}: $_"
  }
}
