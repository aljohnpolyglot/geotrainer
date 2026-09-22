param(
  [int]$SeedsPerCountry = 3,
  [int]$Port = 4179,
  [int]$DebugPort = 9227
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$profile = Join-Path $env:TEMP "geotrainer-coverage-training-$PID"
$output = Join-Path $root 'src/data/streetViewCoverageTraining.json'
$server = $null
$chrome = $null

function Invoke-CdpExpression([string]$webSocketUrl, [string]$expression) {
  $socket = [Net.WebSockets.ClientWebSocket]::new()
  $null = $socket.ConnectAsync([Uri]$webSocketUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  try {
    $payload = @{ id = 1; method = 'Runtime.evaluate'; params = @{ expression = $expression; awaitPromise = $true; returnByValue = $true } } | ConvertTo-Json -Depth 6 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    $null = $socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    do {
      $stream = [IO.MemoryStream]::new()
      do {
        $buffer = [byte[]]::new(65536)
        $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
        $null = $stream.Write($buffer, 0, $received.Count)
      } until ($received.EndOfMessage)
      $message = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
    } until ($message.id -eq 1)
    if ($message.result.exceptionDetails) { throw $message.result.exceptionDetails.text }
    if ($null -eq $message.result.result.value) { throw "CDP returned no value: $($message | ConvertTo-Json -Depth 8 -Compress)" }
    return $message.result.result.value
  } finally {
    $socket.Dispose() | Out-Null
  }
}

try {
  New-Item -ItemType Directory -Path $profile | Out-Null

  $server = Start-Process -FilePath 'npx.cmd' -ArgumentList @('vite', '--host', '127.0.0.1', '--port', $Port) -WorkingDirectory $root -WindowStyle Hidden -PassThru
  for ($i = 0; $i -lt 40; $i++) {
    try { Invoke-WebRequest "http://127.0.0.1:$Port/" -UseBasicParsing | Out-Null; break } catch { Start-Sleep -Milliseconds 250 }
  }
  if ($i -eq 40) { throw 'Vite did not start.' }

  $chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  $chrome = Start-Process -FilePath $chromePath -ArgumentList @('--headless=new', "--remote-debugging-port=$DebugPort", "--user-data-dir=$profile", '--disable-gpu', "http://127.0.0.1:$Port/") -WindowStyle Hidden -PassThru
  for ($i = 0; $i -lt 40; $i++) {
    try { $target = (Invoke-RestMethod "http://127.0.0.1:$DebugPort/json").Where({ $_.type -eq 'page' -and $_.url.StartsWith("http://127.0.0.1:$Port/") }, 'First'); if ($target) { break } } catch {}
    Start-Sleep -Milliseconds 250
  }
  if (-not $target) { throw 'Chrome debugging target did not start.' }
  Start-Sleep -Seconds 3

  $expression = @"
(async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  for (let i = 0; i < 120 && !globalThis.google?.maps?.StreetViewService; i++) await sleep(250);
  if (!globalThis.google?.maps?.StreetViewService) throw new Error('Google Maps did not load');
  const catalog = await (await fetch('/src/data/countryCatalog.json')).json();
  const entries = Object.entries(catalog);
  const service = new google.maps.StreetViewService();
  const geocoder = new google.maps.Geocoder();
  const panorama = point => new Promise(resolve => service.getPanorama({ location: point, radius: 15000, preference: google.maps.StreetViewPreference.NEAREST, source: google.maps.StreetViewSource.GOOGLE }, (data, status) => resolve({ data, status })));
  let geocodeQueue = Promise.resolve();
  const countryAt = location => {
    const lookup = async () => {
      await sleep(125);
      return new Promise(resolve => geocoder.geocode({ location }, (results, status) => {
        const country = results?.flatMap(result => result.address_components || []).find(component => component.types.includes('country'));
        resolve({ code: country?.short_name?.toUpperCase() || null, status });
      }));
    };
    const queued = geocodeQueue.then(lookup, lookup);
    geocodeQueue = queued.then(() => undefined, () => undefined);
    return queued;
  };
  const train = async ([code, country]) => {
    let tested = 0;
    for (const point of country.samplePoints.slice(0, $SeedsPerCountry)) {
      tested++;
      const { data, status } = await panorama(point);
      if (status !== 'OK' && status !== 'ZERO_RESULTS') return { code, tested, reliable: false, error: status };
      if (!data?.location?.latLng || !/\bGoogle\b/i.test(data.copyright || '') || !data.links?.length) continue;
      const resolved = await countryAt(data.location.latLng);
      if (resolved.status !== 'OK') return { code, tested, reliable: false, error: resolved.status };
      if (resolved.code === code) return { code, tested, reliable: true };
    }
    return { code, tested, reliable: false };
  };
  const results = new Array(entries.length);
  let next = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (true) {
      const index = next++;
      if (index >= entries.length) return;
      results[index] = await train(entries[index]);
    }
  }));
  return results;
})()
"@
  $results = @(Invoke-CdpExpression $target.webSocketDebuggerUrl $expression)
  $errors = @($results | Where-Object error)
  if ($errors.Count) { throw "Street View training returned API errors: $($errors[0].error)" }
  $reliable = @($results | Where-Object reliable | ForEach-Object code | Sort-Object)
  if ($reliable.Count -lt 25) { throw "Only $($reliable.Count) of $($results.Count) countries passed; sample: $(($results | Select-Object -First 3 | ConvertTo-Json -Compress))" }
  [ordered]@{
    trainedAt = (Get-Date).ToString('yyyy-MM-dd')
    seedsPerCountry = $SeedsPerCountry
    reliableCountryCodes = $reliable
  } | ConvertTo-Json | Set-Content -Encoding utf8 $output
  Write-Output "Trained $($results.Count) countries: $($reliable.Count) reliable, $($results.Count - $reliable.Count) skipped."
} finally {
  if ($chrome -and -not $chrome.HasExited) { $chrome.Kill($true); $chrome.WaitForExit(5000) | Out-Null }
  if ($server -and -not $server.HasExited) { $server.Kill($true); $server.WaitForExit(5000) | Out-Null }
  if (Test-Path $profile) {
    $resolvedProfile = [IO.Path]::GetFullPath($profile)
    $resolvedTemp = [IO.Path]::GetFullPath($env:TEMP).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if ($resolvedProfile.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) { try { Remove-Item -LiteralPath $resolvedProfile -Recurse -Force } catch { Write-Warning "Temporary Chrome profile remains at $resolvedProfile" } }
  }
}
