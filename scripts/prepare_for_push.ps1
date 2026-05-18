param()

# Prepare repo for public push by backing up originals and replacing with .example files.
# Usage: .\scripts\prepare_for_push.ps1

$root = Resolve-Path "..\" -Relative -ErrorAction SilentlyContinue
if (-not $root) { $root = (Get-Location).Path }
$backup = Join-Path $root "scripts\backups\$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$targets = @(
    @{ orig = "src\Services\JobPosting\JobPosting.API\appsettings.json"; example = "src\Services\JobPosting\JobPosting.API\appsettings.example.json" },
    @{ orig = "src\Services\JobSearch\JobSearch.API\appsettings.json"; example = "src\Services\JobSearch\JobSearch.API\appsettings.example.json" },
    @{ orig = "src\Services\Notification\Notification.Worker\appsettings.json"; example = "src\Services\Notification\Notification.Worker\appsettings.example.json" },
    @{ orig = "src\ClientApp\.env"; example = "src\ClientApp\.env.example" },
    @{ orig = "docker-compose.yml"; example = "docker-compose.example.yml" }
)

foreach ($t in $targets) {
    $origPath = Join-Path $root $t.orig
    $examplePath = Join-Path $root $t.example
    if (Test-Path $origPath) {
        # create dest folder in backup preserving relative path
        $destDir = Join-Path $backup (Split-Path $t.orig -Parent)
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        Copy-Item -Path $origPath -Destination $destDir -Force
        Write-Host "Backed up $t.orig -> $destDir"
    }
    if (Test-Path $examplePath) {
        Copy-Item -Path $examplePath -Destination (Join-Path $root (Split-Path $t.orig -Parent)) -Force
        Write-Host "Replaced $t.orig with example: $t.example"
    } else {
        Write-Host "No example file for $t.orig (skipped replacing)"
    }
}

# Save last backup location for restore
$lastFile = Join-Path $root "scripts\last_backup.txt"
Set-Content -Path $lastFile -Value $backup -Force

Write-Host "\nPrepare complete. Backup stored at: $backup"
Write-Host "Run git status, then commit & push. After push run scripts\restore_after_push.ps1 to restore originals."
