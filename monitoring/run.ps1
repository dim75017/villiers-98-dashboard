param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $MonitorArguments
)

$ErrorActionPreference = "Stop"
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

if ($nodeCommand) {
  $villiersNode = $nodeCommand.Source
} else {
  $searchRoot = $PSScriptRoot
  $bundledNode = $null
  while ($searchRoot) {
    $candidate = Join-Path $searchRoot ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    if (Test-Path -LiteralPath $candidate) {
      $bundledNode = $candidate
      break
    }
    $parent = Split-Path -Parent $searchRoot
    if (-not $parent -or $parent -eq $searchRoot) { break }
    $searchRoot = $parent
  }
  if (-not $bundledNode) {
    throw "Node.js est introuvable. Chargez les dépendances du workspace avant de lancer le moniteur."
  }
  $villiersNode = $bundledNode
}

& $villiersNode (Join-Path $PSScriptRoot "run.mjs") @MonitorArguments
exit $LASTEXITCODE
