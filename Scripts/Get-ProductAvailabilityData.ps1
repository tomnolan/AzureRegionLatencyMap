<#
.SYNOPSIS
    Downloads Azure product availability by region and writes it as a pivot CSV.

.DESCRIPTION
    Fetches the "Products available by region" page from azure.microsoft.com,
    extracts the embedded dataset (a JavaScript array assigned to `const data`),
    and writes a pivot-table CSV where:

      - Each row is one OfferingName + ProductSkuName combination.
      - Columns after the first two are one per Azure region (sorted alphabetically).
      - Cell values are the availability status for that offering/sku in that region,
        or empty if not offered there.
      - Records with no ProductSkuName use "General" as the SKU label,
        and appear as the first row within their offering group.

    Availability status values observed in the source data:
      GA            - Generally Available
      Preview       - Public Preview
      Closing Down  - Being retired

.PARAMETER OutputPath
    Path to write the output CSV file. Defaults to ..\Data\productAvailability.csv
    relative to this script's location.

.NOTES
    Does not require Azure authentication.
    Requires PowerShell 5.1+ or PowerShell 7+.
#>
[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\Data\productAvailability.csv')
)

Set-StrictMode -Version Latest
$ErrorActionPreference  = 'Stop'
$InformationPreference  = 'Continue'

$pageUrl = 'https://azure.microsoft.com/en-us/explore/global-infrastructure/products-by-region/table'

# ── Fetch page ────────────────────────────────────────────────────────────────

Write-Information "Fetching product availability page..."
$response = Invoke-WebRequest -Uri $pageUrl -UseBasicParsing
$html = $response.Content
Write-Information "  Page size: $([math]::Round($html.Length / 1KB, 1)) KB"

# ── Extract embedded JSON array ───────────────────────────────────────────────
# The page embeds the dataset as:
#   const data =
#   [ ... ];
# We locate `const data =`, find the opening `[`, then find the matching `];`.

$markerIndex = $html.IndexOf('const data =')
if ($markerIndex -lt 0) {
    Write-Error "Could not find 'const data =' in the page. The page format may have changed."
    exit 1
}

$arrStart = $html.IndexOf('[', $markerIndex)
$arrEnd   = $html.IndexOf('];', $arrStart)

if ($arrStart -lt 0 -or $arrEnd -lt 0) {
    Write-Error "Could not locate the data array boundaries. The page format may have changed."
    exit 1
}

$jsonText = $html.Substring($arrStart, $arrEnd - $arrStart + 1)
Write-Information "  Extracted JSON array ($([math]::Round($jsonText.Length / 1KB, 1)) KB)"

# ── Parse ─────────────────────────────────────────────────────────────────────

$raw = $jsonText | ConvertFrom-Json
Write-Information "  Parsed $($raw.Count) records"

if ($raw.Count -eq 0) {
    Write-Error "Parsed zero records — the page format may have changed."
    exit 1
}

# ── Reshape into pivot map ────────────────────────────────────────────────────
# offeringMap: offering -> sku -> region -> status
# Records with no ProductSkuName are stored under "General".

$NO_SKU_KEY  = 'General'
$offeringMap = [System.Collections.Generic.Dictionary[string, object]]::new()
$allRegions  = [System.Collections.Generic.SortedSet[string]]::new()

foreach ($record in $raw) {
    $offering = $record.OfferingName
    $sku      = if ([string]::IsNullOrWhiteSpace($record.ProductSkuName)) { $NO_SKU_KEY } else { $record.ProductSkuName }
    $region   = $record.RegionName
    $status   = $record.CurrentState

    [void]$allRegions.Add($region)

    if (-not $offeringMap.ContainsKey($offering)) {
        $offeringMap[$offering] = [System.Collections.Generic.Dictionary[string, object]]::new()
    }
    if (-not $offeringMap[$offering].ContainsKey($sku)) {
        $offeringMap[$offering][$sku] = [System.Collections.Generic.Dictionary[string, string]]::new()
    }
    $offeringMap[$offering][$sku][$region] = $status
}

$offeringCount = $offeringMap.Count
$regionCount   = $allRegions.Count
$skuCount      = 0
foreach ($o in $offeringMap.Keys) { $skuCount += $offeringMap[$o].Count }

Write-Information "  Offerings: $offeringCount  SKU rows: $skuCount  Regions: $regionCount"

# ── Build pivot CSV ───────────────────────────────────────────────────────────
# Header: OfferingName, ProductSkuName, <region1>, <region2>, ...
# Rows sorted by OfferingName, then "General" first within each offering.

$regionList = @($allRegions)  # already sorted (SortedSet)
$rows = [System.Collections.Generic.List[string]]::new()
$rows.Add('OfferingName,ProductSkuName,' + ($regionList -join ','))

foreach ($offeringName in ($offeringMap.Keys | Sort-Object)) {
    $skuMap   = $offeringMap[$offeringName]
    $skuOrder = [System.Collections.Generic.List[string]]::new()
    if ($skuMap.ContainsKey($NO_SKU_KEY)) { $skuOrder.Add($NO_SKU_KEY) }
    foreach ($s in ($skuMap.Keys | Where-Object { $_ -ne $NO_SKU_KEY } | Sort-Object)) { $skuOrder.Add($s) }

    foreach ($skuName in $skuOrder) {
        $regionData = $skuMap[$skuName]
        $cells = foreach ($r in $regionList) {
            if ($regionData.ContainsKey($r)) { $regionData[$r] } else { '' }
        }
        $rows.Add("$offeringName,$skuName," + ($cells -join ','))
    }
}

# ── Write output ──────────────────────────────────────────────────────────────

$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Unix line endings, UTF-8 without BOM for minimal size
$csvText = $rows -join "`n"
[System.IO.File]::WriteAllText($OutputPath, $csvText, [System.Text.UTF8Encoding]::new($false))

$resolved = (Resolve-Path $OutputPath).Path
Write-Information ""
Write-Information "Written to:"
Write-Information "  $resolved"

# ── Return result object ──────────────────────────────────────────────────────

[PSCustomObject]@{
    RetrievedAt   = [datetime]::UtcNow
    OfferingCount = $offeringCount
    SkuCount      = $skuCount
    RegionCount   = $regionCount
}
