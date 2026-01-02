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
Purpose: Before implementing AccommodationService with Prisma

Files backed up:
$(($itemsToBackup | ForEach-Object { "  - $_" }) -join "`n")

To restore:
1. Copy files from this backup directory back to project root
2. Restore any deleted files from this backup
"@

$backupInfo | Out-File -FilePath "$backupDir\BACKUP_INFO.txt" -Encoding UTF8

Write-Host "`nBackup complete: $backupDir" -ForegroundColor Green
Write-Host "Backup info saved to: $backupDir\BACKUP_INFO.txt" -ForegroundColor Cyan

