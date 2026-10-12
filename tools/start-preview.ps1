# 雙擊啟動器使用本機示範資料，不連線 Google。
$ErrorActionPreference = "Stop"
try { $host.UI.RawUI.WindowTitle = "AromaCraft Studio 本機示範預覽" } catch {}
Set-Location -LiteralPath $PSScriptRoot
$bundledNode = Join-Path $PSScriptRoot "..\runtime\node.exe"
if (Test-Path -LiteralPath $bundledNode) {
    $nodePath = $bundledNode
} else {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw "此預覽需要 Node.js 20 以上。請先安裝 Node.js 後再執行。" }
    $nodePath = $nodeCommand.Source
}
$rawVersion = (& $nodePath --version)
$majorVersion = [int]($rawVersion.TrimStart("v").Split(".")[0])
if ($majorVersion -lt 20) { throw "請更新至 Node.js 20 以上後再開啟預覽。" }
$htmlPath = Join-Path $PSScriptRoot "..\前端預覽.html"
Write-Host "AromaCraft 示範預覽伺服器已啟動：http://127.0.0.1:8765/" -ForegroundColor Green
Write-Host "請開啟瀏覽器操作；按 Ctrl+C 可停止伺服器。" -ForegroundColor Cyan
if (Test-Path -LiteralPath $htmlPath) {
    & $nodePath (Join-Path $PSScriptRoot "preview.cjs") $htmlPath
} else {
    & $nodePath (Join-Path $PSScriptRoot "preview.cjs")
}
