# cleanup-drivers.ps1
# Emergency helper — kills orphaned WebDriver binaries ONLY.
# Run this manually when a previous test run left driver processes behind.
#
# Safe to run: does NOT kill chrome.exe, node.exe, msedge.exe, or any
# process that could be your real browser or development tools.
#
# Usage:
#   npm run cleanup:drivers
#   -- or --
#   powershell -ExecutionPolicy Bypass -File scripts/cleanup-drivers.ps1

$drivers = @('chromedriver.exe', 'msedgedriver.exe', 'geckodriver.exe')
$killed = @()
$notFound = @()

foreach ($driver in $drivers) {
    $procs = Get-Process -Name ($driver -replace '\.exe$', '') -ErrorAction SilentlyContinue
    if ($procs) {
        $procs | Stop-Process -Force
        $killed += "$driver ($($procs.Count) process(es))"
    } else {
        $notFound += $driver
    }
}

if ($killed.Count -gt 0) {
    Write-Host "Stopped: $($killed -join ', ')" -ForegroundColor Green
} else {
    Write-Host "No orphaned WebDriver processes found." -ForegroundColor Cyan
}

if ($notFound.Count -gt 0) {
    Write-Host "Not running: $($notFound -join ', ')" -ForegroundColor Gray
}
