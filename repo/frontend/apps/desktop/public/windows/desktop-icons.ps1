param(
    [ValidateSet("Get", "Show", "Hide")]
    [string] $Action = "Get"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Complete-Operation {
    param(
        [bool] $Ok,
        [bool] $Supported,
        [AllowNull()]
        [object] $Visible,
        [bool] $Changed,
        [string] $Message,
        [IntPtr] $DefView = [IntPtr]::Zero,
        [IntPtr] $ListView = [IntPtr]::Zero
    )

    [pscustomobject]@{
        Changed = $Changed
        DefView = $DefView.ToInt64()
        ListView = $ListView.ToInt64()
        Message = $Message
        Ok = $Ok
        Supported = $Supported
        Visible = $Visible
    } | ConvertTo-Json -Compress

    if ($Ok) {
        exit 0
    }
    exit 2
}

$nativeSource = @"
using System;
using System.Runtime.InteropServices;

public static class ScopifyDesktopIconsNative
{
    private const uint WM_COMMAND = 0x0111;
    private const int TOGGLE_DESKTOP_ICONS_COMMAND = 0x7402;
    private const uint SMTO_ABORTIFHUNG = 0x0002;

    private delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindWindow(string className, string windowName);

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindWindowEx(
        IntPtr parent,
        IntPtr childAfter,
        string className,
        string windowName
    );

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsWindowVisible(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SendMessageTimeout(
        IntPtr hwnd,
        uint message,
        IntPtr wParam,
        IntPtr lParam,
        uint flags,
        uint timeout,
        out IntPtr result
    );

    public static IntPtr FindDesktopDefView()
    {
        IntPtr progman = FindWindow("Progman", null);
        if (progman != IntPtr.Zero)
        {
            IntPtr direct = FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);
            if (direct != IntPtr.Zero)
            {
                return direct;
            }
        }

        IntPtr found = IntPtr.Zero;
        EnumWindows(delegate(IntPtr topLevel, IntPtr unused)
        {
            IntPtr candidate = FindWindowEx(
                topLevel,
                IntPtr.Zero,
                "SHELLDLL_DefView",
                null
            );
            if (candidate == IntPtr.Zero)
            {
                return true;
            }

            found = candidate;
            return false;
        }, IntPtr.Zero);
        return found;
    }

    public static IntPtr FindDesktopListView(IntPtr defView)
    {
        if (defView == IntPtr.Zero)
        {
            return IntPtr.Zero;
        }
        return FindWindowEx(defView, IntPtr.Zero, "SysListView32", null);
    }

    public static bool ToggleDesktopIcons(IntPtr defView)
    {
        IntPtr ignored;
        IntPtr delivered = SendMessageTimeout(
            defView,
            WM_COMMAND,
            new IntPtr(TOGGLE_DESKTOP_ICONS_COMMAND),
            IntPtr.Zero,
            SMTO_ABORTIFHUNG,
            1000,
            out ignored
        );
        return delivered != IntPtr.Zero;
    }
}
"@

try {
    Add-Type -TypeDefinition $nativeSource -Language CSharp | Out-Null

    $defView = [ScopifyDesktopIconsNative]::FindDesktopDefView()
    if ($defView -eq [IntPtr]::Zero) {
        Complete-Operation `
            -Ok $false `
            -Supported $false `
            -Visible $null `
            -Changed $false `
            -Message "Explorer desktop view was not found."
    }

    $listView = [ScopifyDesktopIconsNative]::FindDesktopListView($defView)
    if ($listView -eq [IntPtr]::Zero) {
        Complete-Operation `
            -Ok $false `
            -Supported $false `
            -Visible $null `
            -Changed $false `
            -Message "Explorer desktop icon list was not found." `
            -DefView $defView
    }

    $currentVisible = [ScopifyDesktopIconsNative]::IsWindowVisible($listView)
    if ($Action -eq "Get") {
        Complete-Operation `
            -Ok $true `
            -Supported $true `
            -Visible ([bool] $currentVisible) `
            -Changed $false `
            -Message "Desktop icon visibility was read." `
            -DefView $defView `
            -ListView $listView
    }

    $requestedVisible = $Action -eq "Show"
    if ($currentVisible -eq $requestedVisible) {
        Complete-Operation `
            -Ok $true `
            -Supported $true `
            -Visible ([bool] $currentVisible) `
            -Changed $false `
            -Message "Desktop icon visibility already matched the requested state." `
            -DefView $defView `
            -ListView $listView
    }

    $delivered = [ScopifyDesktopIconsNative]::ToggleDesktopIcons($defView)
    if (-not $delivered) {
        Complete-Operation `
            -Ok $false `
            -Supported $true `
            -Visible ([bool] $currentVisible) `
            -Changed $false `
            -Message "Explorer did not accept the desktop icon visibility command." `
            -DefView $defView `
            -ListView $listView
    }

    $deadline = [DateTime]::UtcNow.AddMilliseconds(1500)
    do {
        Start-Sleep -Milliseconds 50
        $finalVisible = [ScopifyDesktopIconsNative]::IsWindowVisible($listView)
    } while ($finalVisible -ne $requestedVisible -and [DateTime]::UtcNow -lt $deadline)

    if ($finalVisible -ne $requestedVisible) {
        Complete-Operation `
            -Ok $false `
            -Supported $true `
            -Visible ([bool] $finalVisible) `
            -Changed ($finalVisible -ne $currentVisible) `
            -Message "Explorer did not reach the requested desktop icon visibility state." `
            -DefView $defView `
            -ListView $listView
    }

    Complete-Operation `
        -Ok $true `
        -Supported $true `
        -Visible ([bool] $finalVisible) `
        -Changed $true `
        -Message "Desktop icon visibility was updated." `
        -DefView $defView `
        -ListView $listView
} catch {
    Complete-Operation `
        -Ok $false `
        -Supported $false `
        -Visible $null `
        -Changed $false `
        -Message $_.Exception.Message
}
