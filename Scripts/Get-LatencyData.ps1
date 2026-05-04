<#
.SYNOPSIS
    Downloads the Azure network latency data from the MicrosoftDocs GitHub repo
    and extracts the embedded CSV block to a local file.

.DESCRIPTION
    Fetches the raw markdown source of the Azure network latency statistics article,
    locates the ```csv ... ``` fenced code block, and writes its contents to
    Data/latency.csv (or a path you specify).

    The source article is:
    https://learn.microsoft.com/en-us/azure/networking/azure-network-latency

    The raw markdown source is:
    https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/refs/heads/main/articles/networking/azure-network-latency.md

.PARAMETER OutputPath
    Path to write the CSV file. Defaults to ..\Data\latency.csv relative to
    this script's location.

.PARAMETER ShowStats
    If specified, prints a summary of the rows and columns found in the CSV.
#>
[CmdletBinding()]
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\Data\latency.csv'),
    [switch]$ShowStats
)

Set-StrictMode -Version Latest
$ErrorActionPreference   = 'Stop'
$InformationPreference   = 'Continue'

$mdUrl = 'https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/refs/heads/main/articles/networking/azure-network-latency.md'

Write-Information "Fetching latency article from MicrosoftDocs..."
$md = (Invoke-WebRequest -Uri $mdUrl -UseBasicParsing).Content

# ── Locate the ```csv fenced block ────────────────────────────────────────────
# The block starts with a line that is exactly "```csv" and ends with "```"

$lines     = $md -split "`n"
$inBlock   = $false
$csvLines  = [System.Collections.Generic.List[string]]::new()

foreach ($line in $lines) {
    $trimmed = $line.TrimEnd()

    if (-not $inBlock) {
        if ($trimmed -match '^```csv\s*$') {
            $inBlock = $true
        }
        continue
    }

    if ($trimmed -match '^```\s*$') {
        break  # end of block
    }

    $csvLines.Add($trimmed)
}

if ($csvLines.Count -eq 0) {
    Write-Error "Could not find a ```csv code block in the markdown. The article format may have changed."
    exit 1
}

Write-Information "  Extracted $($csvLines.Count) lines from CSV block."

# ── Validate that the first line looks like a header row ──────────────────────

$header = $csvLines[0]
if ($header -notmatch '^Source,') {
    Write-Error "Unexpected CSV format — first line does not start with 'Source,':`n$header"
    exit 1
}

# ── Extract dataset date from surrounding prose ──────────────────────────────

$dateMatch = [regex]::Match($md, 'current dataset was taken on \*([^*]+)\*')
$datasetDate = if ($dateMatch.Success) { $dateMatch.Groups[1].Value.Trim() } else { $null }

# ── Write output ──────────────────────────────────────────────────────────────

$outputDir = Split-Path $OutputPath -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Join with Windows line endings for broad compatibility
($csvLines -join "`r`n") | Set-Content -Path $OutputPath -Encoding UTF8 -NoNewline

$resolved = (Resolve-Path $OutputPath).Path
Write-Information ""
Write-Information "Written to:"
Write-Information "  $resolved"

# ── Optional stats ────────────────────────────────────────────────────────────

if ($ShowStats) {
    $columns = ($header -split ',').Count - 1  # subtract the Source column
    $dataRows = $csvLines.Count - 1            # subtract the header row

    Write-Information ""
    Write-Information "CSV summary:"
    Write-Information "  Destination columns : $columns"
    Write-Information "  Source rows         : $dataRows"

    if ($datasetDate) {
        Write-Information "  Dataset date        : $datasetDate"
    }
}

# ── Return result object ───────────────────────────────────────────────────────

[PSCustomObject]@{
    RetrievedAt = [datetime]::Now
    DatasetDate = $datasetDate
}
