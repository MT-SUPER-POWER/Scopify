"use client";

import { useState } from "react";
import { CURRENT_DEVICE_PREVIEW, OTHER_DEVICE_PREVIEWS } from "@/constants/loginDevices";
import type { LoginDeviceView, LoginDevicePreview } from "@/types/components/loginDevices";

export function useDevicePreview() {
  const [view, setView] = useState<LoginDeviceView>("all");
  const [expanded, setExpanded] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(CURRENT_DEVICE_PREVIEW);
  const [detailsDevice, setDetailsDevice] = useState<LoginDevicePreview | null>(null);
  return {
    view,
    setView,
    expanded,
    setExpanded,
    selectedDevice,
    setSelectedDevice,
    detailsDevice,
    setDetailsDevice,
    visibleDevices:
      view === "activity"
        ? [CURRENT_DEVICE_PREVIEW, ...OTHER_DEVICE_PREVIEWS]
        : expanded
          ? OTHER_DEVICE_PREVIEWS
          : OTHER_DEVICE_PREVIEWS.slice(0, 2),
  };
}
