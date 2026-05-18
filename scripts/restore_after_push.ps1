param()

# Restore original files from last backup created by prepare_for_push.ps1
$root = Resolve-Path "..\" -Relative -ErrorAction SilentlyContinue
if (-not $root) { $root = (Get-Location).Path }
$lastFile = Join-Path $root "scripts\last_backup.txt"
if (-not (Test-Path $lastFile)) { Write-Error "No last_backup.txt found. Cannot restore."; exit 1 }
$backup = Get-Content $lastFile -ErrorAction Stop
if (-not (Test-Path $backup)) { Write-Error "Backup folder $backup not found."; exit 1 }

# Copy all files from backup back to repo (preserving relative paths)
Get-ChildItem -Path $backup -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($backup.Length+1)
    $target = Join-Path $root $rel
    $targetDir = Split-Path $target -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    Copy-Item -Path $_.FullName -Destination $target -Force
    Write-Host "Restored: $rel"
}

Write-Host "Restore complete. You may remove the backup folder if desired: $backup"
Remove-Item -Path $lastFile -Force -ErrorAction SilentlyContinue
