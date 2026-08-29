$foliaSourceRoot = [System.IO.Path]::GetFullPath("D:\\Github\\folia-major\\src")
$foliaVisualizerRoot = Join-Path $foliaSourceRoot "components\\visualizer"
$foliaSeedFiles = [System.Collections.Generic.List[string]]::new()
foreach ($foliaFile in [System.IO.Directory]::EnumerateFiles($foliaVisualizerRoot, "*", [System.IO.SearchOption]::AllDirectories)) {
  if ([System.IO.Path]::GetFileName($foliaFile) -in @("VisPlayground.tsx", "PreviewPlaceholder.ts")) {
    continue
  }
  $foliaSeedFiles.Add([System.IO.Path]::GetFullPath($foliaFile))
}
$foliaExtraSeeds = @(
  "components\\FloatingPlayerControls.tsx",
  "components\\ProgressBar.tsx",
  "hooks\\usePlayerChromeAutoHide.ts",
  "components\\app\\presentation\\buildAppStyle.ts",
  "components\\app\\presentation\\buildVisualizerTheme.ts"
)
foreach ($foliaSeed in $foliaExtraSeeds) {
  $foliaSeedFiles.Add([System.IO.Path]::GetFullPath((Join-Path $foliaSourceRoot $foliaSeed)))
}

$foliaQueue = [System.Collections.Generic.Queue[string]]::new()
$foliaSeen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$foliaExternal = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
$foliaMissing = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$foliaOutside = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($foliaSeedFile in $foliaSeedFiles) {
  if ($foliaSeen.Add($foliaSeedFile)) {
    $foliaQueue.Enqueue($foliaSeedFile)
  }
}

$foliaImportPattern = [regex]::new("(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['\""](?<spec>[^'\""]+)['\""]", [System.Text.RegularExpressions.RegexOptions]::Multiline)
$foliaSourceExtensions = @("", ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".glsl", ".vert", ".frag")
while ($foliaQueue.Count -gt 0) {
  $foliaCurrent = $foliaQueue.Dequeue()
  $foliaExtension = [System.IO.Path]::GetExtension($foliaCurrent).ToLowerInvariant()
  if ($foliaExtension -notin @(".ts", ".tsx", ".js", ".jsx")) {
    continue
  }
  $foliaText = [System.IO.File]::ReadAllText($foliaCurrent)
  foreach ($foliaMatch in $foliaImportPattern.Matches($foliaText)) {
    $foliaSpec = $foliaMatch.Groups["spec"].Value
    if (
      [System.IO.Path]::GetFileName($foliaCurrent) -eq "VisPlaygroundSettingsPanel.tsx" -and
      $foliaSpec -eq "../../stores/useSettingsUiStore"
    ) {
      continue
    }
    if (
      $foliaSpec -eq "../../../services/temperaLayerImages" -and
      $foliaCurrent.StartsWith($foliaVisualizerRoot, [System.StringComparison]::OrdinalIgnoreCase)
    ) {
      # Scopify owns the IndexedDB adapter for Tempera images at this host boundary.
      continue
    }
    if (-not $foliaSpec.StartsWith(".")) {
      $foliaPackage = $foliaSpec
      if ($foliaPackage.StartsWith("@")) {
        $foliaParts = $foliaPackage.Split("/")
        if ($foliaParts.Length -ge 2) {
          $foliaPackage = $foliaParts[0] + "/" + $foliaParts[1]
        }
      } else {
        $foliaPackage = $foliaPackage.Split("/")[0]
      }
      $null = $foliaExternal.Add($foliaPackage)
      continue
    }
    $foliaBase = [System.IO.Path]::GetFullPath((Join-Path ([System.IO.Path]::GetDirectoryName($foliaCurrent)) $foliaSpec))
    $foliaResolved = $null
    foreach ($foliaCandidateExtension in $foliaSourceExtensions) {
      $foliaCandidate = $foliaBase + $foliaCandidateExtension
      if ([System.IO.File]::Exists($foliaCandidate)) {
        $foliaResolved = $foliaCandidate
        break
      }
    }
    if ($null -eq $foliaResolved -and [System.IO.Directory]::Exists($foliaBase)) {
      foreach ($foliaCandidateExtension in $foliaSourceExtensions) {
        $foliaCandidate = Join-Path $foliaBase ("index" + $foliaCandidateExtension)
        if ([System.IO.File]::Exists($foliaCandidate)) {
          $foliaResolved = $foliaCandidate
          break
        }
      }
    }
    if ($null -eq $foliaResolved) {
      $foliaRelative = [System.IO.Path]::GetRelativePath($foliaSourceRoot, $foliaCurrent)
      $null = $foliaMissing.Add($foliaRelative + " -> " + $foliaSpec)
      continue
    }
    if ($foliaSeen.Add($foliaResolved)) {
      $foliaQueue.Enqueue($foliaResolved)
      if (-not $foliaResolved.StartsWith($foliaVisualizerRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $null = $foliaOutside.Add([System.IO.Path]::GetRelativePath($foliaSourceRoot, $foliaResolved))
      }
    }
  }
}

"TOTAL=" + $foliaSeen.Count
"RELATIVE_CLOSURE_OUTSIDE_VISUALIZER"
foreach ($foliaItem in $foliaOutside) {
  $foliaItem
}
"EXTERNAL_PACKAGES"
foreach ($foliaItem in $foliaExternal) {
  $foliaItem
}
"UNRESOLVED_RELATIVE_IMPORTS"
foreach ($foliaItem in $foliaMissing) {
  $foliaItem
}

$foliaRepoRoot = [System.IO.Path]::GetDirectoryName($foliaSourceRoot)
$foliaDestinationRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "src"))
foreach ($foliaSourceFile in $foliaSeen) {
  if ($foliaSourceFile.StartsWith($foliaSourceRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    $foliaRelativePath = [System.IO.Path]::GetRelativePath($foliaSourceRoot, $foliaSourceFile)
    $foliaDestinationFile = Join-Path $foliaDestinationRoot $foliaRelativePath
  } elseif ($foliaSourceFile.StartsWith($foliaRepoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    $foliaRelativePath = [System.IO.Path]::GetRelativePath($foliaRepoRoot, $foliaSourceFile)
    $foliaDestinationFile = Join-Path $PSScriptRoot $foliaRelativePath
  } else {
    throw "Refusing to copy Folia source outside the pinned repository: $foliaSourceFile"
  }

  $foliaDestinationDirectory = [System.IO.Path]::GetDirectoryName($foliaDestinationFile)
  [System.IO.Directory]::CreateDirectory($foliaDestinationDirectory) | Out-Null
  [System.IO.File]::Copy($foliaSourceFile, $foliaDestinationFile, $true)
}

[System.IO.File]::Copy(
  (Join-Path $foliaRepoRoot "LICENSE"),
  (Join-Path $PSScriptRoot "LICENSE"),
  $true
)
"COPIED=" + $foliaSeen.Count
