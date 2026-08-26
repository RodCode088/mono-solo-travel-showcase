param(
  [string]$SourceRoot = "assets/mono_experience_by_cuanto",
  [string]$OutputRoot = "assets/mono_experience_by_cuanto_optimized",
  [int]$MaxDimension = 1600,
  [int]$Quality = 78
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "../..")
$sourcePath = Resolve-Path (Join-Path $repoRoot $SourceRoot)
$outputPath = Join-Path $repoRoot $OutputRoot

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" } |
  Select-Object -First 1

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  [long]$Quality
)

function Set-ImageOrientation {
  param([System.Drawing.Image]$Image)

  $orientationId = 274
  if ($Image.PropertyIdList -notcontains $orientationId) {
    return
  }

  $orientation = $Image.GetPropertyItem($orientationId).Value[0]
  switch ($orientation) {
    2 { $Image.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
    3 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
    4 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
    5 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
    6 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
    7 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
    8 { $Image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
  }

  try {
    $Image.RemovePropertyItem($orientationId)
  } catch {
    # Some images expose orientation as read-only; saving still works.
  }
}

$extensions = @(".jpg", ".jpeg", ".png", ".jfif")
$files = Get-ChildItem -LiteralPath $sourcePath -Recurse -File |
  Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }

$writtenTargets = @{}
$sourceBytes = 0L
$outputBytes = 0L
$converted = 0

foreach ($file in $files) {
  $sourceBytes += $file.Length
  $relativePath = $file.FullName.Substring($sourcePath.Path.Length).TrimStart("\", "/")
  $relativeDir = Split-Path $relativePath -Parent
  $targetDir = if ($relativeDir) { Join-Path $outputPath $relativeDir } else { $outputPath }
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
  $targetPath = Join-Path $targetDir "$baseName.jpg"
  $targetKey = $targetPath.ToLowerInvariant()
  $suffix = 2
  while ($writtenTargets.ContainsKey($targetKey)) {
    $targetPath = Join-Path $targetDir "$baseName-$suffix.jpg"
    $targetKey = $targetPath.ToLowerInvariant()
    $suffix += 1
  }
  $writtenTargets[$targetKey] = $true

  $image = $null
  $bitmap = $null
  $graphics = $null
  try {
    $image = [System.Drawing.Image]::FromFile($file.FullName)
    Set-ImageOrientation -Image $image

    $largestSide = [Math]::Max($image.Width, $image.Height)
    $scale = if ($largestSide -gt $MaxDimension) { $MaxDimension / $largestSide } else { 1 }
    $width = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))

    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $bitmap.SetResolution(72, 72)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.DrawImage($image, 0, 0, $width, $height)

    $bitmap.Save($targetPath, $jpegCodec, $encoderParams)
    $outputBytes += (Get-Item -LiteralPath $targetPath).Length
    $converted += 1
  } finally {
    if ($graphics) { $graphics.Dispose() }
    if ($bitmap) { $bitmap.Dispose() }
    if ($image) { $image.Dispose() }
  }
}

$savedBytes = $sourceBytes - $outputBytes
$sourceMb = [Math]::Round($sourceBytes / 1MB, 1)
$outputMb = [Math]::Round($outputBytes / 1MB, 1)
$savedMb = [Math]::Round($savedBytes / 1MB, 1)

Write-Host "Optimized $converted images."
Write-Host "Source: $sourceMb MB"
Write-Host "Output: $outputMb MB"
Write-Host "Saved: $savedMb MB"
Write-Host "Output folder: $OutputRoot"
