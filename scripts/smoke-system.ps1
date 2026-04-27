param(
  [string]$BaseUrl = "https://wayesports.space"
)

$ErrorActionPreference = "Stop"

function Test-Endpoint {
  param(
    [string]$Name,
    [string]$Path
  )

  $url = "$BaseUrl$Path"
  try {
    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 20
    Write-Host "[OK] $Name -> $($response.StatusCode) $Path"
    return $true
  } catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if (-not $statusCode) { $statusCode = "ERR" }
    Write-Host "[FAIL] $Name -> $statusCode $Path"
    return $false
  }
}

$checks = @(
  @{ Name = "API Health"; Path = "/api/health" },
  @{ Name = "Tournaments"; Path = "/api/tournaments" },
  @{ Name = "Rankings"; Path = "/api/rankings/leaderboard" },
  @{ Name = "Intelligence Readiness"; Path = "/api/intelligence/readiness" },
  @{ Name = "News"; Path = "/api/news" },
  @{ Name = "Telegram Bot Health"; Path = "/telegram/health" }
)

$passed = 0
foreach ($check in $checks) {
  if (Test-Endpoint -Name $check.Name -Path $check.Path) {
    $passed++
  }
}

Write-Host ""
Write-Host "Smoke result: $passed / $($checks.Count) passed"
if ($passed -ne $checks.Count) {
  exit 1
}
exit 0
