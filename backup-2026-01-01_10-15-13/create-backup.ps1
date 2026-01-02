# Create timestamped backup
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup-$timestamp"

Write-Host "Creating backup: $backupDir" -ForegroundColor Green

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Get all items including hidden files, excluding only node_modules, dist, and existing backups
$itemsToBackup = Get-ChildItem -Path . -Force | Where-Object {
    $_.Name -notlike "node_modules" -and
    $_.Name -notlike "dist" -and
    $_.Name -notlike "backup-*" -and
    $_.Name -ne ".git"
}

# Copy each item
foreach ($item in $itemsToBackup) {
    Write-Host "  Copying $($item.Name)..." -ForegroundColor Yellow
    Copy-Item -Path $item.FullName -Destination $backupDir -Recurse -Force
}

# Create backup info file
$backupInfo = @"
Backup created: $timestamp
Purpose: Outstanding stable version - All spreadsheet selection features working

Current state:
- Shift+Click for range selection: Working
- Shift+Arrow keys: Working (works even when editing)
- Ctrl+D with ranges: Working (respects selection boundaries, doesn't overwrite filled cells)
- Ctrl+Shift+Arrow (all directions): Working (selects to last empty cell before next filled cell)
- Cell data persists when converting to input: Working
- Ctrl+A: Select all cells - Working
- Ctrl+Spacebar / Cmd+Spacebar: Select entire column - Working
- Shift+Spacebar: Select entire row - Working
- handleDirectionalFill: Versatile copy function supporting all directions
- Updated getEndOfContiguousData logic: Stops at last empty cell before filled cell
- All keyboard shortcuts have Mac equivalents (Cmd instead of Ctrl)

To restore:
1. Copy files from this backup directory back to project root
2. Restore any deleted files from this backup
"@

$backupInfo | Out-File -FilePath "$backupDir\BACKUP_INFO.txt" -Encoding UTF8

Write-Host "`nBackup complete: $backupDir" -ForegroundColor Green
Write-Host "Backup info saved to: $backupDir\BACKUP_INFO.txt" -ForegroundColor Cyan

