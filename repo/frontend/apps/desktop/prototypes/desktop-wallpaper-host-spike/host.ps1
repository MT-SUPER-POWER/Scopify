param(
  [ValidateSet("Probe", "Attach")]
  [string]$Action = "Probe",

  [long]$Hwnd = 0,

  [int]$TargetLeft = 0,

  [int]$TargetTop = 0,

  [int]$TargetWidth = 0,

  [int]$TargetHeight = 0
)

$ErrorActionPreference = "Stop"

# PROTOTYPE: This deliberately exercises undocumented Explorer window topology.
# It is not a production host and must fail closed when the expected tree is absent.
$nativeSource = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class ScopifyDesktopWallpaperHostSpike
{
    private const int GWL_STYLE = -16;
    private const int GWL_EXSTYLE = -20;
    private const long WS_CAPTION = 0x00C00000L;
    private const long WS_CHILD = 0x40000000L;
    private const long WS_MAXIMIZEBOX = 0x00010000L;
    private const long WS_MINIMIZEBOX = 0x00020000L;
    private const long WS_POPUP = unchecked((long)0x80000000L);
    private const long WS_SYSMENU = 0x00080000L;
    private const long WS_THICKFRAME = 0x00040000L;
    private const long WS_EX_LAYERED = 0x00080000L;
    private const long WS_EX_NOREDIRECTIONBITMAP = 0x00200000L;
    private const uint LWA_ALPHA = 0x00000002;
    private const uint PRIVATE_SPAWN_WORKERW = 0x052C;
    private const uint SMTO_NORMAL = 0x0000;
    private const uint SMTO_ABORTIFHUNG = 0x0002;
    private const uint SWP_NOACTIVATE = 0x0010;
    private const uint SWP_FRAMECHANGED = 0x0020;

    public sealed class Result
    {
        public int ActualBottom;
        public int ActualClientBottom;
        public int ActualClientLeft;
        public int ActualClientRight;
        public int ActualClientTop;
        public int ActualLeft;
        public int ActualRight;
        public int ActualTop;
        public bool CoversRequestedBounds;
        public bool CoversRequestedClientBounds;
        public bool Ok;
        public string Mode;
        public string Message;
        public long Progman;
        public int RequestedBottom;
        public int RequestedLeft;
        public int RequestedRight;
        public int RequestedTop;
        public long WorkerW;
        public long DefView;
        public long RenderWindow;
        public int Win32Error;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }

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

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetParent(IntPtr child, IntPtr newParent);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr GetParent(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetClientRect(IntPtr hwnd, out RECT rect);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool ClientToScreen(IntPtr hwnd, ref POINT point);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool ScreenToClient(IntPtr hwnd, ref POINT point);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool IsWindow(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetWindowPos(
        IntPtr hwnd,
        IntPtr insertAfter,
        int x,
        int y,
        int width,
        int height,
        uint flags
    );

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool SetLayeredWindowAttributes(
        IntPtr hwnd,
        uint colorKey,
        byte alpha,
        uint flags
    );

    [DllImport("user32.dll", EntryPoint = "GetWindowLong", SetLastError = true)]
    private static extern int GetWindowLong32(IntPtr hwnd, int index);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr", SetLastError = true)]
    private static extern IntPtr GetWindowLongPtr64(IntPtr hwnd, int index);

    [DllImport("user32.dll", EntryPoint = "SetWindowLong", SetLastError = true)]
    private static extern int SetWindowLong32(IntPtr hwnd, int index, int value);

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr", SetLastError = true)]
    private static extern IntPtr SetWindowLongPtr64(IntPtr hwnd, int index, IntPtr value);

    private static long GetWindowStyle(IntPtr hwnd, int index)
    {
        return IntPtr.Size == 8
            ? GetWindowLongPtr64(hwnd, index).ToInt64()
            : GetWindowLong32(hwnd, index);
    }

    private static void SetWindowStyle(IntPtr hwnd, int index, long value)
    {
        if (IntPtr.Size == 8)
        {
            SetWindowLongPtr64(hwnd, index, new IntPtr(value));
        }
        else
        {
            SetWindowLong32(hwnd, index, unchecked((int)value));
        }
    }

    public static Result Probe()
    {
        IntPtr progman = FindWindow("Progman", null);
        if (progman == IntPtr.Zero)
        {
            return Failure("unsupported", "Progman was not found.", progman, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
        }

        IntPtr ignored;
        SendMessageTimeout(
            progman,
            PRIVATE_SPAWN_WORKERW,
            new IntPtr(0xD),
            new IntPtr(0x1),
            SMTO_NORMAL | SMTO_ABORTIFHUNG,
            1000,
            out ignored
        );

        bool raisedDesktop = (GetWindowStyle(progman, GWL_EXSTYLE) & WS_EX_NOREDIRECTIONBITMAP) != 0;
        IntPtr workerW = IntPtr.Zero;
        IntPtr defView = IntPtr.Zero;

        if (raisedDesktop)
        {
            defView = FindWindowEx(progman, IntPtr.Zero, "SHELLDLL_DefView", null);
            workerW = FindWindowEx(progman, IntPtr.Zero, "WorkerW", null);
        }
        else
        {
            EnumWindows(delegate(IntPtr topLevel, IntPtr unused)
            {
                IntPtr candidateDefView = FindWindowEx(
                    topLevel,
                    IntPtr.Zero,
                    "SHELLDLL_DefView",
                    null
                );
                if (candidateDefView == IntPtr.Zero)
                {
                    return true;
                }

                defView = candidateDefView;
                workerW = FindWindowEx(IntPtr.Zero, topLevel, "WorkerW", null);
                return workerW == IntPtr.Zero;
            }, IntPtr.Zero);
        }

        string mode = raisedDesktop ? "raised-desktop" : "classic-workerw";
        if (defView == IntPtr.Zero || workerW == IntPtr.Zero)
        {
            return Failure(
                mode,
                "The expected DefView/WorkerW desktop topology was not found.",
                progman,
                workerW,
                defView,
                IntPtr.Zero
            );
        }

        return new Result
        {
            Ok = true,
            Mode = mode,
            Message = "Desktop host topology detected.",
            Progman = progman.ToInt64(),
            WorkerW = workerW.ToInt64(),
            DefView = defView.ToInt64(),
            RenderWindow = 0,
            Win32Error = 0
        };
    }

    public static Result Attach(
        IntPtr renderWindow,
        int targetLeft,
        int targetTop,
        int targetWidth,
        int targetHeight
    )
    {
        Result host = Probe();
        host.RenderWindow = renderWindow.ToInt64();
        if (!host.Ok)
        {
            return host;
        }

        if (renderWindow == IntPtr.Zero || !IsWindow(renderWindow))
        {
            return Failure(
                host.Mode,
                "The Electron render HWND is invalid.",
                new IntPtr(host.Progman),
                new IntPtr(host.WorkerW),
                new IntPtr(host.DefView),
                renderWindow
            );
        }

        if (targetWidth <= 0 || targetHeight <= 0)
        {
            return Failure(
                host.Mode,
                "Attach requires positive target display dimensions.",
                new IntPtr(host.Progman),
                new IntPtr(host.WorkerW),
                new IntPtr(host.DefView),
                renderWindow
            );
        }

        host.RequestedLeft = targetLeft;
        host.RequestedTop = targetTop;
        host.RequestedRight = targetLeft + targetWidth;
        host.RequestedBottom = targetTop + targetHeight;

        long style = GetWindowStyle(renderWindow, GWL_STYLE);
        style =
            (style &
                ~(WS_POPUP |
                  WS_CAPTION |
                  WS_THICKFRAME |
                  WS_MINIMIZEBOX |
                  WS_MAXIMIZEBOX |
                  WS_SYSMENU)) |
            WS_CHILD;
        SetWindowStyle(renderWindow, GWL_STYLE, style);

        IntPtr targetParent;
        if (host.Mode == "raised-desktop")
        {
            long extendedStyle = GetWindowStyle(renderWindow, GWL_EXSTYLE) | WS_EX_LAYERED;
            SetWindowStyle(renderWindow, GWL_EXSTYLE, extendedStyle);
            SetLayeredWindowAttributes(renderWindow, 0, 255, LWA_ALPHA);
            targetParent = new IntPtr(host.Progman);
        }
        else
        {
            targetParent = new IntPtr(host.WorkerW);
        }

        POINT targetOrigin = new POINT { X = targetLeft, Y = targetTop };
        if (!ScreenToClient(targetParent, ref targetOrigin))
        {
            return Failure(
                host.Mode,
                "The target display origin could not be converted to desktop-host coordinates.",
                new IntPtr(host.Progman),
                new IntPtr(host.WorkerW),
                new IntPtr(host.DefView),
                renderWindow
            );
        }

        SetParent(renderWindow, targetParent);
        if (GetParent(renderWindow) != targetParent)
        {
            return Failure(
                host.Mode,
                "SetParent did not attach the render HWND to the expected desktop host.",
                new IntPtr(host.Progman),
                new IntPtr(host.WorkerW),
                new IntPtr(host.DefView),
                renderWindow
            );
        }

        IntPtr insertAfter =
            host.Mode == "raised-desktop" ? new IntPtr(host.DefView) : new IntPtr(1);
        bool positioned = SetWindowPos(
            renderWindow,
            insertAfter,
            targetOrigin.X,
            targetOrigin.Y,
            targetWidth,
            targetHeight,
            SWP_NOACTIVATE | SWP_FRAMECHANGED
        );
        if (!positioned)
        {
            return Failure(
                host.Mode,
                "The render HWND was attached but its desktop bounds and Z-order could not be set.",
                new IntPtr(host.Progman),
                new IntPtr(host.WorkerW),
                new IntPtr(host.DefView),
                renderWindow
            );
        }

        RECT actualRect;
        if (!GetWindowRect(renderWindow, out actualRect))
        {
            host.Ok = false;
            host.Message = "The attached Electron render HWND bounds could not be read.";
            host.Win32Error = Marshal.GetLastWin32Error();
            return host;
        }

        host.ActualLeft = actualRect.Left;
        host.ActualTop = actualRect.Top;
        host.ActualRight = actualRect.Right;
        host.ActualBottom = actualRect.Bottom;
        host.CoversRequestedBounds =
            actualRect.Left == host.RequestedLeft &&
            actualRect.Top == host.RequestedTop &&
            actualRect.Right == host.RequestedRight &&
            actualRect.Bottom == host.RequestedBottom;

        if (!host.CoversRequestedBounds)
        {
            host.Ok = false;
            host.Message = "The attached Electron render HWND no longer covers its requested display bounds.";
            host.Win32Error = 0;
            return host;
        }

        RECT clientRect;
        POINT clientTopLeft = new POINT { X = 0, Y = 0 };
        POINT clientBottomRight;
        if (!GetClientRect(renderWindow, out clientRect))
        {
            host.Ok = false;
            host.Message = "The attached Electron render client bounds could not be read.";
            host.Win32Error = Marshal.GetLastWin32Error();
            return host;
        }

        clientBottomRight = new POINT { X = clientRect.Right, Y = clientRect.Bottom };
        if (!ClientToScreen(renderWindow, ref clientTopLeft) ||
            !ClientToScreen(renderWindow, ref clientBottomRight))
        {
            host.Ok = false;
            host.Message = "The attached Electron render client origin could not be mapped to screen coordinates.";
            host.Win32Error = Marshal.GetLastWin32Error();
            return host;
        }

        host.ActualClientLeft = clientTopLeft.X;
        host.ActualClientTop = clientTopLeft.Y;
        host.ActualClientRight = clientBottomRight.X;
        host.ActualClientBottom = clientBottomRight.Y;
        host.CoversRequestedClientBounds =
            host.ActualClientLeft == host.RequestedLeft &&
            host.ActualClientTop == host.RequestedTop &&
            host.ActualClientRight == host.RequestedRight &&
            host.ActualClientBottom == host.RequestedBottom;

        if (!host.CoversRequestedClientBounds)
        {
            host.Ok = false;
            host.Message = "The attached Electron render client does not cover its requested display bounds.";
            host.Win32Error = 0;
            return host;
        }

        host.Message = "Electron render HWND attached to the desktop host.";
        host.Win32Error = 0;
        return host;
    }

    private static Result Failure(
        string mode,
        string message,
        IntPtr progman,
        IntPtr workerW,
        IntPtr defView,
        IntPtr renderWindow
    )
    {
        return new Result
        {
            Ok = false,
            Mode = mode,
            Message = message,
            Progman = progman.ToInt64(),
            WorkerW = workerW.ToInt64(),
            DefView = defView.ToInt64(),
            RenderWindow = renderWindow.ToInt64(),
            Win32Error = Marshal.GetLastWin32Error()
        };
    }
}
'@

Add-Type -TypeDefinition $nativeSource -Language CSharp

if ($Action -eq "Attach") {
  if ($Hwnd -le 0) {
    throw "Attach requires a positive -Hwnd value."
  }

  $result = [ScopifyDesktopWallpaperHostSpike]::Attach(
    [IntPtr]::new($Hwnd),
    $TargetLeft,
    $TargetTop,
    $TargetWidth,
    $TargetHeight
  )
} else {
  $result = [ScopifyDesktopWallpaperHostSpike]::Probe()
}

$result | ConvertTo-Json -Compress
if (-not $result.Ok) {
  exit 2
}
