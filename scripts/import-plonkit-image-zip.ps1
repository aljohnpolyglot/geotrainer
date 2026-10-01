param(
  [Parameter(Mandatory = $true)][string]$ZipPath,
  [string]$TargetRoot = (Join-Path $PSScriptRoot '..')
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $TargetRoot).Path
$zip = (Resolve-Path -LiteralPath $ZipPath).Path
if ((Test-Path -LiteralPath $zip -PathType Container) -and -not (Test-Path -LiteralPath (Join-Path $zip 'manifest.json'))) {
  $items = @(
    Get-ChildItem -LiteralPath $zip -Filter 'plonkit-images-*.zip' -File
    Get-ChildItem -LiteralPath $zip -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'manifest.json') }
  ) | Sort-Object Name
  if (-not $items.Count) { throw 'No Plonkit image ZIPs or capture folders found.' }
  foreach ($item in $items) {
    & $PSCommandPath -ZipPath $item.FullName -TargetRoot $root
  }
  return
}
$isCaptureFolder = Test-Path -LiteralPath $zip -PathType Container
$tempRoot = if ($isCaptureFolder) { $zip } else { Join-Path ([IO.Path]::GetTempPath()) ("plonkit-import-" + [guid]::NewGuid().ToString('N')) }
$imageDir = Join-Path $root 'public/meta-courses/images'
$reportPath = Join-Path $root 'scripts/meta-course-image-report.json'
$manifestPath = Join-Path $tempRoot 'manifest.json'
try {
  if (-not $isCaptureFolder) { Expand-Archive -LiteralPath $zip -DestinationPath $tempRoot }
  $archive = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ($archive.pageUrl -notmatch '^https://([a-z0-9-]+\.)*plonkit\.net/') { throw 'ZIP is not from a Plonkit page.' }
  if ($archive.entries -isnot [array]) { throw 'ZIP manifest has no entries.' }
  $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
  $remaining = [Collections.Generic.List[object]]::new()
  $remaining.AddRange([object[]]$report.missingImages)
  $imported = 0
  foreach ($entry in $archive.entries) {
    if (-not $entry.file -or -not $entry.url) { continue }
    if (($entry.file -notmatch '^images/[A-Za-z0-9._-]+\.(jpg|png|webp|gif|avif|img)$') -or ($entry.url -notmatch '^https://([a-z0-9-]+\.)*plonkit\.net/')) { throw "Invalid ZIP entry: $($entry.file)" }
    $missing = $remaining | Where-Object { $_.url -ceq $entry.url } | Select-Object -First 1
    if (-not $missing) { continue }
    $sha = [Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($entry.url))
    $sha.Dispose()
    $hash = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLowerInvariant()
    $source = Join-Path $tempRoot $entry.file
    $destination = Join-Path $imageDir "$hash.webp"
    if (-not (Test-Path -LiteralPath $destination)) {
      $temporaryOutput = "$destination.tmp.webp"
      try {
        & ffmpeg -y -hide_banner -loglevel error -i $source -vf "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease" -c:v libwebp -q:v 78 -compression_level 6 -frames:v 1 $temporaryOutput
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temporaryOutput) -or (Get-Item -LiteralPath $temporaryOutput).Length -eq 0) {
          throw "Could not convert $($entry.url) with ffmpeg"
        }
        Move-Item -LiteralPath $temporaryOutput -Destination $destination -Force
      } finally {
        Remove-Item -LiteralPath $temporaryOutput -Force -ErrorAction SilentlyContinue
      }
    }
    foreach ($reference in $missing.references) {
      if ($reference -notmatch '^([A-Z]{2})-') { continue }
      $coursePath = Join-Path $root ("public/meta-courses/{0}.json" -f $Matches[1])
      if (-not (Test-Path -LiteralPath $coursePath)) { continue }
      $course = Get-Content -LiteralPath $coursePath -Raw | ConvertFrom-Json
      $tip = $course.tips | Where-Object { $_.id -ceq $reference } | Select-Object -First 1
      if ($tip) { $tip | Add-Member -NotePropertyName image -NotePropertyValue "meta-courses/images/$hash.webp" -Force }
      $json = ConvertTo-Json -InputObject $course -Depth 100 -Compress
      $next = "$coursePath.tmp"
      [IO.File]::WriteAllText($next, $json, [Text.UTF8Encoding]::new($false))
      Move-Item -LiteralPath $next -Destination $coursePath -Force
    }
    [void]$remaining.Remove($missing)
    $imported++
  }
  $report.missingImages = @($remaining)
  $report.hostedImages = [int]$report.uniqueSourceImages - $remaining.Count
  $report.hostedBytes = (Get-ChildItem -LiteralPath $imageDir -Filter '*.webp' -File | Measure-Object -Property Length -Sum).Sum
  $report.generatedAt = [DateTime]::UtcNow.ToString('o')
  $reportJson = ConvertTo-Json -InputObject $report -Depth 100
  $reportTemp = "$reportPath.tmp"
  [IO.File]::WriteAllText($reportTemp, $reportJson, [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $reportTemp -Destination $reportPath -Force
  Write-Output "Imported $imported images; $($remaining.Count) remain unavailable."
} finally {
  $resolvedTemp = [IO.Path]::GetFullPath($tempRoot)
  $expectedPrefix = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  $resolvedParent = [IO.Path]::GetDirectoryName($resolvedTemp)
  if (-not $isCaptureFolder -and $resolvedParent.Equals($expectedPrefix.TrimEnd([IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($resolvedTemp) -match '^plonkit-import-[a-f0-9]{32}$') {
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
