<#
.SYNOPSIS
    Refreshes both the regions and latency data files.

.DESCRIPTION
    Runs Get-RegionsData.ps1 and Get-LatencyData.ps1 in sequence, writing
    their output to the Data folder. Emits a summary object on completion.

.PARAMETER DataPath
    Path to the Data folder. Defaults to ..\Data relative to this script.
#>
[CmdletBinding()]
param(
    [string]$DataPath = (Join-Path $PSScriptRoot '..\Data')
)

Set-StrictMode -Version Latest
$ErrorActionPreference  = 'Stop'
$InformationPreference  = 'Continue'

$scriptsDir = $PSScriptRoot

# ── Regions ───────────────────────────────────────────────────────────────────

Write-Information "=== Updating regions data ==="
$regionsResult = & "$scriptsDir\Get-RegionsData.ps1" `
    -OutputPath (Join-Path $DataPath 'regions.json')

# ── Latency ───────────────────────────────────────────────────────────────────

Write-Information ""
Write-Information "=== Updating latency data ==="
$latencyResult = & "$scriptsDir\Get-LatencyData.ps1" `
    -OutputPath (Join-Path $DataPath 'latency.csv')

# ── Product Availability ─────────────────────────────────────────────────────

Write-Information ""
Write-Information "=== Updating product availability data ==="
$productsResult = & "$scriptsDir\Get-ProductAvailabilityData.ps1" `
    -OutputPath (Join-Path $DataPath 'productAvailability.csv')

# ── Summary ───────────────────────────────────────────────────────────────────

Write-Information ""
Write-Information "=== Updating Last Updated data ==="
$lastUpdated = [PSCustomObject]@{
    RegionsRetrievedAt      = $regionsResult.RetrievedAt
    LatencyRetrievedAt      = $latencyResult.RetrievedAt
    LatencyDatasetDate      = $latencyResult.DatasetDate
    ProductsRetrievedAt     = $productsResult.RetrievedAt
}
$lastUpdated | ConvertTo-Json | Set-Content (Join-Path $DataPath 'lastUpdated.json')
Write-Information ("Regions: {0}, Latency: {1} (Latency Source: {2}), Products: {3} ({4} products, {5} regions)" -f `
    $lastUpdated.RegionsRetrievedAt, `
    $lastUpdated.LatencyRetrievedAt, `
    $lastUpdated.LatencyDatasetDate, `
    $lastUpdated.ProductsRetrievedAt, `
    $productsResult.OfferingCount, `
    $productsResult.RegionCount)

Write-Information ""
Write-Information "=== Done ==="

