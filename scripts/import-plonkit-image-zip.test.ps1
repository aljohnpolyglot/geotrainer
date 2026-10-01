$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'import-plonkit-image-zip.ps1'
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'ffmpeg is required for this smoke test.' }
$tempBase = Join-Path ([IO.Path]::GetTempPath()) ("plonkit-import-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tempBase | Out-Null
$imageUrl = 'https://www.plonkit.net/images/test.png'
$badImageUrl = 'https://www.plonkit.net/images/not-listed.png'
$png = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=')

function Write-Utf8Json($Path, $Value) {
  [IO.File]::WriteAllText($Path, (ConvertTo-Json -InputObject $Value -Depth 30), [Text.UTF8Encoding]::new($false))
}

function New-Fixture($Name, $MissingUrl) {
  $base = Join-Path $tempBase $Name
  $null = New-Item -ItemType Directory -Path (Join-Path $base 'public/meta-courses/images') -Force
  $null = New-Item -ItemType Directory -Path (Join-Path $base 'scripts') -Force
  Write-Utf8Json (Join-Path $base 'public/meta-courses/US.json') @{ code = 'US'; tips = @(@{ id = 'US-abc'; text = 'test' }) }
  Write-Utf8Json (Join-Path $base 'scripts/meta-course-image-report.json') @{
    generatedAt = 'test'; uniqueSourceImages = 1; hostedImages = 0; hostedBytes = 0
    missingImages = @(@{ url = $MissingUrl; references = @('US-abc'); error = 'missing' })
  }
  return $base
}

function New-Zip($Name, $ManifestText, $IncludeImage) {
  $source = Join-Path $tempBase "$Name-source"
  $null = New-Item -ItemType Directory -Path $source -Force
  if ($IncludeImage) {
    $imageDir = Join-Path $source 'images'
    $null = New-Item -ItemType Directory -Path $imageDir -Force
    [IO.File]::WriteAllBytes((Join-Path $imageDir '001-abc.png'), $png)
  }
  [IO.File]::WriteAllText((Join-Path $source 'manifest.json'), $ManifestText, [Text.UTF8Encoding]::new($false))
  $zip = Join-Path $tempBase "$Name.zip"
  Compress-Archive -Path (Join-Path $source '*') -DestinationPath $zip -Force
  return $zip
}

try {
  $matchingRoot = New-Fixture 'matching' $imageUrl
  $matchingManifest = ConvertTo-Json -InputObject @{
    pageUrl = 'https://www.plonkit.net/guide'
    entries = @(@{ id = 'abc'; url = $imageUrl; file = 'images/001-abc.png'; mimeType = 'image/png' })
  } -Depth 10
  $matchingZip = New-Zip 'matching' $matchingManifest $true
  & $scriptPath -ZipPath $matchingZip -TargetRoot $matchingRoot | Out-Null
  $course = Get-Content -LiteralPath (Join-Path $matchingRoot 'public/meta-courses/US.json') -Raw | ConvertFrom-Json
  $sha = [Security.Cryptography.SHA256]::Create()
  $hash = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($imageUrl))).Replace('-', '').ToLowerInvariant()
  $sha.Dispose()
  if ($course.tips[0].image -ne 'meta-courses/images/' + $hash + '.webp') { throw 'Matching image did not update its course tip.' }
  if (-not (Get-ChildItem -LiteralPath (Join-Path $matchingRoot 'public/meta-courses/images') -Filter '*.webp' -File)) { throw 'Matching image did not produce a WebP asset.' }
  $report = Get-Content -LiteralPath (Join-Path $matchingRoot 'scripts/meta-course-image-report.json') -Raw | ConvertFrom-Json
  if ($report.missingImages.Count -ne 0 -or $report.hostedImages -ne 1) { throw 'Matching image did not update the report.' }

  $unmatchedRoot = New-Fixture 'unmatched' $imageUrl
  $unmatchedManifest = ConvertTo-Json -InputObject @{
    pageUrl = 'https://www.plonkit.net/botswana'
    entries = @(@{ id = 'abc'; url = $badImageUrl; file = 'images/001-abc.png'; mimeType = 'image/png' })
  } -Depth 10
  $unmatchedZip = New-Zip 'unmatched' $unmatchedManifest $true
  & $scriptPath -ZipPath $unmatchedZip -TargetRoot $unmatchedRoot | Out-Null
  $course = Get-Content -LiteralPath (Join-Path $unmatchedRoot 'public/meta-courses/US.json') -Raw | ConvertFrom-Json
  if ($course.tips[0].image -or (Get-ChildItem -LiteralPath (Join-Path $unmatchedRoot 'public/meta-courses/images') -File).Count) { throw 'Unmatched image unexpectedly changed course assets.' }

  $malformedRoot = New-Fixture 'malformed' $imageUrl
  $malformedZip = New-Zip 'malformed' '{not json' $false
  $threw = $false
  try { & $scriptPath -ZipPath $malformedZip -TargetRoot $malformedRoot | Out-Null } catch { $threw = $true }
  if (-not $threw) { throw 'Malformed manifest was accepted.' }
  $report = Get-Content -LiteralPath (Join-Path $malformedRoot 'scripts/meta-course-image-report.json') -Raw | ConvertFrom-Json
  if ($report.missingImages.Count -ne 1) { throw 'Malformed import unexpectedly changed the report.' }

  $folderRoot = New-Fixture 'folder' $imageUrl
  $zipFolder = Join-Path $tempBase 'batch-zips'
  $null = New-Item -ItemType Directory -Path $zipFolder -Force
  Copy-Item -LiteralPath $matchingZip -Destination (Join-Path $zipFolder 'plonkit-images-0001-0001.zip')
  & $scriptPath -ZipPath $zipFolder -TargetRoot $folderRoot | Out-Null
  $folderReport = Get-Content -LiteralPath (Join-Path $folderRoot 'scripts/meta-course-image-report.json') -Raw | ConvertFrom-Json
  if ($folderReport.hostedImages -ne 1) { throw 'ZIP folder import did not update the course.' }

  $captureRoot = New-Fixture 'capture' $imageUrl
  $captureFolder = Join-Path $tempBase 'browser-captures/botswana'
  $null = New-Item -ItemType Directory -Path (Join-Path $captureFolder 'images') -Force
  [IO.File]::WriteAllBytes((Join-Path $captureFolder 'images/US-abc.png'), $png)
  [IO.File]::WriteAllText((Join-Path $captureFolder 'manifest.json'), ($matchingManifest.Replace('images/001-abc.png', 'images/US-abc.png')), [Text.UTF8Encoding]::new($false))
  & $scriptPath -ZipPath (Split-Path -Parent $captureFolder) -TargetRoot $captureRoot | Out-Null
  $captureReport = Get-Content -LiteralPath (Join-Path $captureRoot 'scripts/meta-course-image-report.json') -Raw | ConvertFrom-Json
  if ($captureReport.hostedImages -ne 1) { throw 'Browser capture folder import did not update the course.' }

  Write-Output 'PASS: matching, unmatched, malformed, ZIP folder, and browser capture imports.'
} finally {
  $resolvedTemp = [IO.Path]::GetFullPath($tempBase)
  $expectedParent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
  if ([IO.Path]::GetDirectoryName($resolvedTemp).Equals($expectedParent, [StringComparison]::OrdinalIgnoreCase) -and [IO.Path]::GetFileName($resolvedTemp) -match '^plonkit-import-test-[a-f0-9]{32}$') {
    Remove-Item -LiteralPath $resolvedTemp -Recurse -Force
  }
}
