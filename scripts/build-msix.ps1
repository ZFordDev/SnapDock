param(
  [Parameter(Mandatory = $true)]
  [string]$MakeAppxPath,

  [string]$SourceDirectory = "dist/win-unpacked",
  [string]$StagingDirectory = "dist/msix-staging",
  [string]$ValidationDirectory = "dist/msix-validation",
  [string]$PackageName = "ZFordDev.SnapDock",
  [string]$DisplayName = "SnapDock"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))

function Resolve-RepositoryPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $fullPath = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $Path))
  $rootPrefix = $repositoryRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

  if (-not $fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path must remain inside the repository: $Path"
  }

  return $fullPath
}

if (-not (Test-Path -LiteralPath $MakeAppxPath -PathType Leaf)) {
  throw "MakeAppx.exe was not found at '$MakeAppxPath'."
}

$sourcePath = Resolve-RepositoryPath $SourceDirectory
$stagingPath = Resolve-RepositoryPath $StagingDirectory
$validationPath = Resolve-RepositoryPath $ValidationDirectory
$manifestSource = Join-Path $repositoryRoot "packaging/windows-store/AppxManifest.xml"
$assetsSource = Join-Path $repositoryRoot "packaging/windows-store/Assets"
$packageJsonPath = Join-Path $repositoryRoot "package.json"

if (-not (Test-Path -LiteralPath (Join-Path $sourcePath "snapdock.exe") -PathType Leaf)) {
  throw "Store application payload is missing '$sourcePath\snapdock.exe'."
}

foreach ($requiredPath in @($manifestSource, $assetsSource, $packageJsonPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath)) {
    throw "Required MSIX input was not found: $requiredPath"
  }
}

$packageJson = Get-Content -Raw -LiteralPath $packageJsonPath | ConvertFrom-Json
if ($packageJson.version -notmatch '^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$') {
  throw "package.json version '$($packageJson.version)' cannot be converted to an MSIX version."
}

$msixVersion = "$($Matches[1]).$($Matches[2]).$($Matches[3]).0"
$outputPath = Resolve-RepositoryPath "dist/SnapDock-$($packageJson.version).msix"

foreach ($directory in @($stagingPath, $validationPath)) {
  if (Test-Path -LiteralPath $directory) {
    Remove-Item -LiteralPath $directory -Recurse -Force
  }
  New-Item -ItemType Directory -Path $directory | Out-Null
}

Copy-Item -Path (Join-Path $sourcePath "*") -Destination $stagingPath -Recurse -Force
Copy-Item -LiteralPath $manifestSource -Destination (Join-Path $stagingPath "AppxManifest.xml")
Copy-Item -LiteralPath $assetsSource -Destination (Join-Path $stagingPath "Assets") -Recurse

$stagedManifestPath = Join-Path $stagingPath "AppxManifest.xml"
[xml]$manifest = Get-Content -Raw -LiteralPath $stagedManifestPath
$manifest.Package.Identity.SetAttribute("Name", $PackageName)
$manifest.Package.Identity.SetAttribute("Version", $msixVersion)
$manifest.Package.Properties.DisplayName = $DisplayName
$manifest.Package.Applications.Application.VisualElements.SetAttribute("DisplayName", $DisplayName)
$manifest.Save($stagedManifestPath)

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

Write-Host "Packing SnapDock $msixVersion from '$stagingPath'."
& $MakeAppxPath pack /v /h SHA256 /d $stagingPath /p $outputPath /o
if ($LASTEXITCODE -ne 0) {
  throw "MakeAppx pack failed with exit code $LASTEXITCODE."
}

if (-not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
  throw "MakeAppx did not produce '$outputPath'."
}

Write-Host "Unpacking the MSIX to validate its contents."
& $MakeAppxPath unpack /v /p $outputPath /d $validationPath /o
if ($LASTEXITCODE -ne 0) {
  throw "MakeAppx unpack validation failed with exit code $LASTEXITCODE."
}

foreach ($relativePath in @(
  "AppxManifest.xml",
  "snapdock.exe",
  "Assets/StoreLogo.png",
  "Assets/Square44x44Logo.png",
  "Assets/Square150x150Logo.png"
)) {
  if (-not (Test-Path -LiteralPath (Join-Path $validationPath $relativePath) -PathType Leaf)) {
    throw "Validated MSIX is missing '$relativePath'."
  }
}

Write-Host "Created and validated '$outputPath'."
