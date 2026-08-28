<#
.SYNOPSIS
    Fetches Azure region data from the Azure CLI and annotates each region with a
    ReservedAccessRegion field sourced from the Microsoft docs.

.DESCRIPTION
    1. Runs `az account list-locations` to get the authoritative region list as JSON.
    2. Fetches the regions-list.md source from the MicrosoftDocs GitHub repo.
    3. Parses the markdown table to find regions prefixed with the reserved-access
       icon (icon-region-restricted.svg).
    4. Adds a ReservedAccessRegion boolean to each region object.
    5. Writes the result to Data/regions.json.

.PARAMETER OutputPath
    Path to write the output JSON file. Defaults to ..\Data\regions.json relative
    to this script's location.

.NOTES
    Requires the Azure CLI (az) to be installed and authenticated (`az login`).
    Run from PowerShell 5.1+ or PowerShell 7+.
#>
[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\Data\regions.json')
)

Set-StrictMode -Version Latest
$ErrorActionPreference   = 'Stop'
$InformationPreference   = 'Continue'

# ── 1. Get region list from Azure CLI ─────────────────────────────────────────

Write-Information "Fetching Azure region list from CLI..."

$azRaw = az account list-locations --output json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "az account list-locations failed.`n$azRaw"
    exit 1
}

$regions = $azRaw | ConvertFrom-Json
Write-Information "  Retrieved $($regions.Count) regions."

# ── 2. Fetch reserved-access region list from docs markdown ─────────────────

$mdUrl = 'https://raw.githubusercontent.com/MicrosoftDocs/reliability-docs/refs/heads/main/articles/reliability/regions-list.md'
Write-Information "Fetching regions list from MicrosoftDocs..."

$md = (Invoke-WebRequest -Uri $mdUrl -UseBasicParsing).Content

# ── 3. Isolate the "All" tab section of the table ─────────────────────────────

$allTabMarker = '#### [All](#tab/all)'
$allTabStart  = $md.IndexOf($allTabMarker)
if ($allTabStart -lt 0) {
    Write-Error "Could not locate the '[All]' tab section in the markdown."
    exit 1
}

# End at the next #### heading (the Americas tab or similar)
$allTabEnd = $md.IndexOf('#### [', $allTabStart + $allTabMarker.Length)
$allSection = if ($allTabEnd -gt 0) {
    $md.Substring($allTabStart, $allTabEnd - $allTabStart)
} else {
    $md.Substring($allTabStart)
}

# ── 4. Reconstruct multi-line-wrapped table rows ───────────────────────────────
# Each logical row starts with `|`. Continuation lines (word-wrapped cell content)
# do not start with `|` and are joined onto the previous row.

$lines      = $allSection -split "`n"
$rows       = [System.Collections.Generic.List[string]]::new()
$currentRow = $null

foreach ($line in $lines) {
    $trimmed = $line.TrimEnd()
    if ($trimmed -match '^\|') {
        if ($null -ne $currentRow) { $rows.Add($currentRow) }
        $currentRow = $trimmed
    } elseif ($null -ne $currentRow -and $trimmed.Length -gt 0) {
        $currentRow += ' ' + $trimmed
    }
}
if ($null -ne $currentRow) { $rows.Add($currentRow) }

# ── 5. Extract programmatic names of restricted regions ───────────────────────
# A restricted region row has `icon-region-restricted.svg` in its first cell.
# The programmatic name is the last non-empty pipe-delimited cell in the row.

$restrictedNames = [System.Collections.Generic.HashSet[string]]::new(
    [StringComparer]::OrdinalIgnoreCase
)

foreach ($row in $rows) {
    # Skip table separator rows (|---|---|...|)
    if ($row -match '^\|[\s\-:| ]+\|$') { continue }

    $cells = $row -split '\|'
    if ($cells.Count -lt 3) { continue }

    $firstCell = $cells[1]
    if ($firstCell -notmatch 'icon-region-restricted\.svg') { continue }

    # Programmatic name: last non-empty cell, must not itself be an image reference
    $progName = (
        $cells |
        Where-Object { $_.Trim() -ne '' } |
        Where-Object { $_ -notmatch 'icon-' -and $_ -notmatch ':::' } |
        Select-Object -Last 1
    )?.Trim()

    if ($progName) {
        [void]$restrictedNames.Add($progName)
    }
}

Write-Information "  Found $($restrictedNames.Count) reserved-access regions:"
$restrictedNames | Sort-Object | ForEach-Object { Write-Information "    $_" }

# ── 6. Annotate each region with ReservedAccessRegion ───────────────────────

$annotated = $regions | ForEach-Object {
    $_ | Add-Member `
        -NotePropertyName 'ReservedAccessRegion' `
        -NotePropertyValue ($restrictedNames.Contains($_.name)) `
        -PassThru
}

# ── 7. Write output JSON ───────────────────────────────────────────────────────

$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$newContent = $annotated | ConvertTo-Json -Depth 10
$skipped = $false

if (Test-Path $OutputPath) {
    $existing = Get-Content -Path $OutputPath -Raw -Encoding UTF8
    if ($existing -eq $newContent) {
        $skipped = $true
        Write-Information ""
        Write-Information "No changes detected — skipped writing:"
        Write-Information "  $((Resolve-Path $OutputPath).Path)"
    }
}

if (-not $skipped) {
    $newContent | Set-Content -Path $OutputPath -Encoding UTF8
    Write-Information ""
    Write-Information "Written $($annotated.Count) regions to:"
    Write-Information "  $((Resolve-Path $OutputPath).Path)"
}

# ── Return result object ───────────────────────────────────────────────────────

[PSCustomObject]@{
    RetrievedAt = [datetime]::Now
    Skipped     = $skipped
}
