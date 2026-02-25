param(
  [string]$BaseUrl = "https://wayesports.duckdns.org",
  [Parameter(Mandatory = $true)][string]$Token
)

$ErrorActionPreference = "Stop"

function Invoke-AdminCheck {
  param(
    [string]$Name,
    [string]$Path
  )

  $url = "$BaseUrl$Path"
  try {
    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 20 -Headers @{
      Authorization = "Bearer $Token"
    }
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
  @{ Name = "Admin Stats"; Path = "/api/admin/stats" },
  @{ Name = "Ops Metrics"; Path = "/api/admin/ops/metrics" },
  @{ Name = "Ops Queue"; Path = "/api/admin/ops/queue" },
  @{ Name = "Ops Backups"; Path = "/api/admin/ops/backups" },
  @{ Name = "Ops Audit Timeline"; Path = "/api/admin/ops/audit-timeline?hours=24&bucketMinutes=60" },
  @{ Name = "Ops Top Errors"; Path = "/api/admin/ops/errors-top?hours=24&limit=5" }
)

$passed = 0
foreach ($check in $checks) {
  if (Invoke-AdminCheck -Name $check.Name -Path $check.Path) {
    $passed++
  }
}

Write-Host ""
Write-Host "Admin smoke result: $passed / $($checks.Count) passed"
if ($passed -ne $checks.Count) {
  exit 1
}
exit 0
