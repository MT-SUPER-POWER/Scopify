param(
  [ValidateSet("Probe", "Apply", "Restore")]
  [string]$Action = "Probe",

  [string]$ImagePath = "",

  [string]$JournalPath = ""
)

$ErrorActionPreference = "Stop"

# PROTOTYPE: supported Windows static-wallpaper API used only as a Shell/Mica fallback.
# It deliberately refuses slideshow or multi-monitor state until restoration is lossless.
$nativeSource = @'
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class ScopifySystemWallpaperSpike
{
    private const int S_FALSE = 1;
    private const uint SPI_SETDESKWALLPAPER = 0x0014;
    private const uint SPIF_UPDATEINIFILE = 0x0001;
    private const uint SPIF_SENDCHANGE = 0x0002;
    private static readonly Guid DesktopWallpaperClsid =
        new Guid("C2CF3110-460E-4FC1-B9D0-8A1C0C9CC4BD");

    public enum WallpaperPosition
    {
        Center = 0,
        Tile = 1,
        Stretch = 2,
        Fit = 3,
        Fill = 4,
        Span = 5
    }

    public sealed class MonitorState
    {
        public int Index;
        public string MonitorId;
        public string WallpaperPath;
    }

    public sealed class WallpaperState
    {
        public uint BackgroundColor;
        public bool HasCompositeState;
        public MonitorState[] Monitors;
        public WallpaperPosition Position;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [ComImport]
    [Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface IDesktopWallpaper
    {
        [PreserveSig]
        int SetWallpaper(
            [MarshalAs(UnmanagedType.LPWStr)] string monitorId,
            [MarshalAs(UnmanagedType.LPWStr)] string wallpaper
        );

        [PreserveSig]
        int GetWallpaper(
            [MarshalAs(UnmanagedType.LPWStr)] string monitorId,
            out IntPtr wallpaper
        );

        [PreserveSig]
        int GetMonitorDevicePathAt(uint monitorIndex, out IntPtr monitorId);

        [PreserveSig]
        int GetMonitorDevicePathCount(out uint count);

        [PreserveSig]
        int GetMonitorRECT(
            [MarshalAs(UnmanagedType.LPWStr)] string monitorId,
            out RECT displayRect
        );

        [PreserveSig]
        int SetBackgroundColor(uint color);

        [PreserveSig]
        int GetBackgroundColor(out uint color);

        [PreserveSig]
        int SetPosition(WallpaperPosition position);

        [PreserveSig]
        int GetPosition(out WallpaperPosition position);
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SystemParametersInfoW(
        uint action,
        uint parameter,
        string value,
        uint flags
    );

    public static WallpaperState Probe()
    {
        IDesktopWallpaper desktop = CreateDesktopWallpaper();
        try
        {
            uint count;
            ThrowIfFailed(desktop.GetMonitorDevicePathCount(out count));
            var monitors = new List<MonitorState>();
            for (uint index = 0; index < count; index++)
            {
                string monitorId = ReadAllocatedString(
                    delegate(out IntPtr value)
                    {
                        return desktop.GetMonitorDevicePathAt(index, out value);
                    },
                    false
                );
                monitors.Add(new MonitorState
                {
                    Index = checked((int)index),
                    MonitorId = monitorId,
                    WallpaperPath = ReadWallpaper(desktop, monitorId, false)
                });
            }

            WallpaperPosition position;
            uint backgroundColor;
            ThrowIfFailed(desktop.GetPosition(out position));
            ThrowIfFailed(desktop.GetBackgroundColor(out backgroundColor));

            IntPtr globalPath;
            int globalResult = desktop.GetWallpaper(null, out globalPath);
            if (globalPath != IntPtr.Zero)
            {
                Marshal.FreeCoTaskMem(globalPath);
            }
            ThrowIfFailed(globalResult);

            return new WallpaperState
            {
                BackgroundColor = backgroundColor,
                HasCompositeState = globalResult == S_FALSE,
                Monitors = monitors.ToArray(),
                Position = position
            };
        }
        finally
        {
            Marshal.FinalReleaseComObject(desktop);
        }
    }

    public static void SetBackgroundColor(uint color)
    {
        WithDesktopWallpaper(delegate(IDesktopWallpaper desktop)
        {
            ThrowIfFailed(desktop.SetBackgroundColor(color));
        });
    }

    public static void SetPosition(int position)
    {
        WithDesktopWallpaper(delegate(IDesktopWallpaper desktop)
        {
            ThrowIfFailed(desktop.SetPosition((WallpaperPosition)position));
        });
    }

    public static void SetWallpaperGlobal(string wallpaperPath)
    {
        string path = String.IsNullOrWhiteSpace(wallpaperPath) ? null : wallpaperPath;
        bool updated = SystemParametersInfoW(
            SPI_SETDESKWALLPAPER,
            0,
            path,
            SPIF_UPDATEINIFILE | SPIF_SENDCHANGE
        );
        if (!updated)
        {
            throw new Win32Exception(Marshal.GetLastWin32Error());
        }
    }

    public static void SetWallpaper(string monitorId, string wallpaperPath)
    {
        WithDesktopWallpaper(delegate(IDesktopWallpaper desktop)
        {
            string path = String.IsNullOrWhiteSpace(wallpaperPath) ? null : wallpaperPath;
            ThrowIfFailed(desktop.SetWallpaper(monitorId, path));
        });
    }

    private delegate int AllocatedStringCall(out IntPtr value);

    private static IDesktopWallpaper CreateDesktopWallpaper()
    {
        Type type = Type.GetTypeFromCLSID(DesktopWallpaperClsid, true);
        return (IDesktopWallpaper)Activator.CreateInstance(type);
    }

    private static string ReadAllocatedString(AllocatedStringCall call, bool allowSFalse)
    {
        IntPtr value;
        int result = call(out value);
        try
        {
            if (result == S_FALSE && allowSFalse)
            {
                return String.Empty;
            }
            ThrowIfFailed(result);
            return value == IntPtr.Zero ? String.Empty : Marshal.PtrToStringUni(value);
        }
        finally
        {
            if (value != IntPtr.Zero)
            {
                Marshal.FreeCoTaskMem(value);
            }
        }
    }

    private static string ReadWallpaper(
        IDesktopWallpaper desktop,
        string monitorId,
        bool allowSFalse
    )
    {
        return ReadAllocatedString(
            delegate(out IntPtr value)
            {
                return desktop.GetWallpaper(monitorId, out value);
            },
            allowSFalse
        );
    }

    private static void ThrowIfFailed(int result)
    {
        if (result < 0)
        {
            Marshal.ThrowExceptionForHR(result);
        }
    }

    private static void WithDesktopWallpaper(Action<IDesktopWallpaper> action)
    {
        IDesktopWallpaper desktop = CreateDesktopWallpaper();
        try
        {
            action(desktop);
        }
        finally
        {
            Marshal.FinalReleaseComObject(desktop);
        }
    }
}
'@

Add-Type -TypeDefinition $nativeSource -Language CSharp

function Get-FullPath([string]$Path, [string]$Label) {
  if ([string]::IsNullOrWhiteSpace($Path)) {
    throw "$Label is required for action $Action."
  }
  return [IO.Path]::GetFullPath($Path)
}

function Write-Journal([string]$Path, [object]$Journal) {
  $directory = [IO.Path]::GetDirectoryName($Path)
  [IO.Directory]::CreateDirectory($directory) | Out-Null
  $temporaryPath = "$Path.tmp"
  $json = $Journal | ConvertTo-Json -Depth 8
  [IO.File]::WriteAllText($temporaryPath, $json, [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $temporaryPath -Destination $Path -Force
}

function Remove-Journal([string]$Path) {
  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    Remove-Item -LiteralPath $Path -Force
  }
}

function Remove-JournalArtifacts([string]$Path, [object]$Journal) {
  $journalDirectory = [IO.Path]::GetDirectoryName($Path)
  foreach ($monitor in $Journal.OriginalState.Monitors) {
    $backupPath = [string]$monitor.BackupPath
    if ([string]::IsNullOrWhiteSpace($backupPath)) {
      continue
    }

    $resolvedBackupPath = [IO.Path]::GetFullPath($backupPath)
    $expectedPrefix = $journalDirectory.TrimEnd([IO.Path]::DirectorySeparatorChar) +
      [IO.Path]::DirectorySeparatorChar
    if ($resolvedBackupPath.StartsWith($expectedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $resolvedBackupPath -Force -ErrorAction SilentlyContinue
    }
  }
  Remove-Journal $Path
}

try {
  if ($Action -eq "Probe") {
    $result = [ordered]@{
      Action = $Action
      Ok = $true
      State = [ScopifySystemWallpaperSpike]::Probe()
    }
  } elseif ($Action -eq "Apply") {
    $resolvedImagePath = Get-FullPath $ImagePath "ImagePath"
    $resolvedJournalPath = Get-FullPath $JournalPath "JournalPath"
    if (-not (Test-Path -LiteralPath $resolvedImagePath -PathType Leaf)) {
      throw "ImagePath does not identify an existing file: $resolvedImagePath"
    }
    if (Test-Path -LiteralPath $resolvedJournalPath) {
      throw "A system-wallpaper recovery journal already exists: $resolvedJournalPath"
    }

    $originalState = [ScopifySystemWallpaperSpike]::Probe()
    if ($originalState.Monitors.Count -ne 1) {
      throw "The system-wallpaper spike currently supports exactly one monitor."
    }
    if ($originalState.HasCompositeState) {
      throw "The current wallpaper uses a slideshow or non-uniform multi-monitor state."
    }

    $journalDirectory = [IO.Path]::GetDirectoryName($resolvedJournalPath)
    [IO.Directory]::CreateDirectory($journalDirectory) | Out-Null
    $journalMonitors = @()
    foreach ($monitor in $originalState.Monitors) {
      $originalWallpaperPath = [string]$monitor.WallpaperPath
      $backupPath = ""
      if (-not [string]::IsNullOrWhiteSpace($originalWallpaperPath)) {
        $backupSourcePath = $originalWallpaperPath
        if (-not (Test-Path -LiteralPath $backupSourcePath -PathType Leaf)) {
          $backupSourcePath = Join-Path $env:APPDATA "Microsoft\Windows\Themes\TranscodedWallpaper"
        }
        if (-not (Test-Path -LiteralPath $backupSourcePath -PathType Leaf)) {
          throw "The original Windows wallpaper cannot be backed up safely."
        }

        $extension = [IO.Path]::GetExtension($backupSourcePath)
        if ([string]::IsNullOrWhiteSpace($extension)) {
          $extension = ".jpg"
        }
        $backupPath = Join-Path $journalDirectory "original-wallpaper-$($monitor.Index)$extension"
        Copy-Item -LiteralPath $backupSourcePath -Destination $backupPath -Force
      }
      $journalMonitors += [ordered]@{
        BackupPath = $backupPath
        Index = $monitor.Index
        MonitorId = $monitor.MonitorId
        WallpaperPath = $originalWallpaperPath
      }
    }

    $journal = [ordered]@{
      AppliedImagePath = $resolvedImagePath
      OriginalState = [ordered]@{
        BackgroundColor = $originalState.BackgroundColor
        HasCompositeState = $originalState.HasCompositeState
        Monitors = $journalMonitors
        Position = $originalState.Position
      }
      Version = 1
    }
    Write-Journal $resolvedJournalPath $journal

    [ScopifySystemWallpaperSpike]::SetPosition(4)
    [ScopifySystemWallpaperSpike]::SetWallpaper($null, $resolvedImagePath)
    $applied = $false
    $appliedState = $null
    for ($attempt = 0; $attempt -lt 20 -and -not $applied; $attempt++) {
      $appliedState = [ScopifySystemWallpaperSpike]::Probe()
      $applied = [StringComparer]::OrdinalIgnoreCase.Equals(
        $appliedState.Monitors[0].WallpaperPath,
        $resolvedImagePath
      )
      if (-not $applied) {
        Start-Sleep -Milliseconds 100
      }
    }
    if (-not $applied) {
      throw "Windows did not report the generated image as the active wallpaper."
    }

    $result = [ordered]@{
      Action = $Action
      Applied = $true
      ImagePath = $resolvedImagePath
      JournalPath = $resolvedJournalPath
      Ok = $true
      State = $appliedState
    }
  } else {
    $resolvedJournalPath = Get-FullPath $JournalPath "JournalPath"
    if (-not (Test-Path -LiteralPath $resolvedJournalPath -PathType Leaf)) {
      $result = [ordered]@{
        Action = $Action
        Message = "No recovery journal exists."
        Ok = $true
        Restored = $false
      }
    } else {
      $journal = Get-Content -Raw -Encoding UTF8 -LiteralPath $resolvedJournalPath | ConvertFrom-Json
      if ($journal.Version -ne 1) {
        throw "Unsupported system-wallpaper journal version: $($journal.Version)"
      }

      $currentState = [ScopifySystemWallpaperSpike]::Probe()
      $ownsCurrentWallpaper =
        $currentState.Monitors.Count -eq 1 -and
        [StringComparer]::OrdinalIgnoreCase.Equals(
          $currentState.Monitors[0].WallpaperPath,
          [string]$journal.AppliedImagePath
        )

      if (-not $ownsCurrentWallpaper) {
        Remove-JournalArtifacts $resolvedJournalPath $journal
        $result = [ordered]@{
          Action = $Action
          Message = "The user changed the Windows wallpaper after the spike applied its image."
          Ok = $true
          Restored = $false
          SkippedUserChange = $true
        }
      } else {
        $originalMonitor = $journal.OriginalState.Monitors[0]
        $originalPath = [string]$originalMonitor.WallpaperPath
        $backupPath = [string]$originalMonitor.BackupPath
        $restorePath = $originalPath
        if (
          -not [string]::IsNullOrWhiteSpace($restorePath) -and
          -not (Test-Path -LiteralPath $restorePath -PathType Leaf)
        ) {
          $restorePath = $backupPath
        }
        if (
          -not [string]::IsNullOrWhiteSpace($restorePath) -and
          -not (Test-Path -LiteralPath $restorePath -PathType Leaf)
        ) {
          throw "Neither the original wallpaper nor its recovery backup exists."
        }

        [ScopifySystemWallpaperSpike]::SetWallpaperGlobal($restorePath)
        [ScopifySystemWallpaperSpike]::SetPosition([int]$journal.OriginalState.Position)
        [ScopifySystemWallpaperSpike]::SetBackgroundColor(
          [uint32]$journal.OriginalState.BackgroundColor
        )
        Remove-JournalArtifacts $resolvedJournalPath $journal
        $result = [ordered]@{
          Action = $Action
          Ok = $true
          Restored = $true
          State = [ScopifySystemWallpaperSpike]::Probe()
        }
      }
    }
  }
} catch {
  $result = [ordered]@{
    Action = $Action
    Error = $_.Exception.Message
    Ok = $false
  }
}

$result | ConvertTo-Json -Depth 8 -Compress
if (-not $result.Ok) {
  exit 2
}
