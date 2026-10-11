# 雙擊啟動器使用本機示範資料，不連線 Google。
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$bundledNode = Join-Path $PSScriptRoot '..\runtime\node.exe'
if (Test-Path -LiteralPath $bundledNode) {
    $nodePath = $bundledNode
} else {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw '此預覽需要 Node.js 20 以上。安裝後重新開啟「啟動預覽.cmd」。' }
    $nodePath = $nodeCommand.Source
}
$majorVersion = [int]((& $nodePath --version).TrimStart('v').Split('.')[0])
if ($majorVersion -lt 20) { throw '請更新至 Node.js 20 以上後再開啟預覽。' }
$htmlPath = Join-Path $PSScriptRoot '..\前端預覽.html'
Write-Host '請開啟 http://127.0.0.1:8765/；按 Ctrl+C 結束預覽。'
if (Test-Path -LiteralPath $htmlPath) {
    & $nodePath (Join-Path $PSScriptRoot 'preview.cjs') $htmlPath
} else {
    & $nodePath (Join-Path $PSScriptRoot 'preview.cjs')
}
