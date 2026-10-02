param(
  [Parameter(Mandatory = $true)][string]$ZipPath,
  [string]$TargetRoot
)
$ErrorActionPreference = 'Stop'
if (-not $TargetRoot) { $TargetRoot = Join-Path $PSScriptRoot '..' }
$root = (Resolve-Path -LiteralPath $TargetRoot).Path
$inputPath = (Resolve-Path -LiteralPath $ZipPath).Path

if ((Test-Path -LiteralPath $inputPath -PathType Container) -and -not (Test-Path -LiteralPath (Join-Path $inputPath 'manifest.json'))) {
  $captureFolders = @(Get-ChildItem -LiteralPath $inputPath -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'manifest.json') })
  $zips = @(Get-ChildItem -LiteralPath $inputPath -Filter 'plonkit-images-*.zip' -File)
  if (-not $captureFolders.Count -and -not $zips.Count) { throw 'No Plonkit image ZIPs or capture folders found.' }
  if ($captureFolders.Count) {
    & node (Join-Path $PSScriptRoot 'import-plonkit-captures.mjs') $inputPath $root
    if ($LASTEXITCODE -ne 0) { throw 'Plonkit capture import failed.' }
  }
  foreach ($zip in $zips) { & $PSCommandPath -ZipPath $zip.FullName -TargetRoot $root }
  return
}

if (Test-Path -LiteralPath $inputPath -PathType Container) {
  & node (Join-Path $PSScriptRoot 'import-plonkit-captures.mjs') $inputPath $root
  if ($LASTEXITCODE -ne 0) { throw 'Plonkit capture import failed.' }
  return
}

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("plonkit-import-" + [guid]::NewGuid().ToString('N'))
try {
  Expand-Archive -LiteralPath $inputPath -DestinationPath $tempRoot
  & node (Join-Path $PSScriptRoot 'import-plonkit-captures.mjs') $tempRoot $root
  if ($LASTEXITCODE -ne 0) { throw 'Plonkit ZIP import failed.' }
} finally {
  $resolvedTemp = [IO.Path]::GetFullPath($tempRoot)
  $expectedParent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
  if ([IO.Path]::GetDirectoryName($resolvedTemp).Equals($expectedParent, [StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($resolvedTemp) -match '^plonkit-import-[a-f0-9]{32}$') {
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
