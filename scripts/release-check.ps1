param(
  [string]$BaseUrl = "https://wayesports.duckdns.org",
  [string]$AdminToken = ""
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "== $Name =="
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed"
  }
}

try {
  Run-Step -Name "System smoke" -Action {
    powershell -ExecutionPolicy Bypass -File "scripts/smoke-system.ps1" -BaseUrl $BaseUrl
  }

  if ($AdminToken -and $AdminToken.Trim().Length -gt 0) {
    Run-Step -Name "Admin smoke" -Action {
      powershell -ExecutionPolicy Bypass -File "scripts/smoke-admin.ps1" -BaseUrl $BaseUrl -Token $AdminToken
    }
  } else {
    Write-Host ""
    Write-Host "Admin smoke skipped (no AdminToken provided)."
  }

  Write-Host ""
  Write-Host "Release check passed."
  exit 0
} catch {
  Write-Host ""
  Write-Host "Release check failed: $($_.Exception.Message)"
  exit 1
}
