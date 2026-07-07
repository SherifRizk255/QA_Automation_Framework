# diagnose-node.ps1
# Shows every node.exe process with its full command line so you can
# identify which are Playwright test runners vs your dev tools (Angular
# CLI, VS Code extensions, etc.) before deciding whether to stop one.
#
# Usage:
#   npm run diagnose:node
#   -- or --
#   powershell -ExecutionPolicy Bypass -File scripts/diagnose-node.ps1

$nodes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    Select-Object ProcessId, @{Name='CommandLine'; Expression={$_.CommandLine}}

if ($nodes.Count -eq 0) {
    Write-Host "No node.exe processes found." -ForegroundColor Cyan
    exit 0
}

Write-Host "`nRunning node.exe processes ($($nodes.Count) total):`n" -ForegroundColor Yellow
$nodes | Format-Table -AutoSize -Wrap

Write-Host "To stop a specific process safely, use:" -ForegroundColor Gray
Write-Host "  Stop-Process -Id <ProcessId> -Force`n" -ForegroundColor Gray
