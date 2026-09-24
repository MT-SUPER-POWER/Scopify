"use client";
import { useState } from "react";
import type { DeviceAction, LoginDevice, LoginDeviceView } from "@/types/devices";
export function useDevicePresentation(devices: LoginDevice[]) {
  const [view, setView] = useState<LoginDeviceView>("all");
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [action, setAction] = useState<DeviceAction | null>(null);
  const selected = devices.find((d) => d.id === selectedId) ?? devices[0];
  const others = devices.filter((d) => !d.current);
  const activity = [...devices].sort((a, b) => (b.lastActiveTime ?? 0) - (a.lastActiveTime ?? 0));
  const visibleDevices = view === "activity" ? activity : expanded ? others : others.slice(0, 2);
  return {
    view,
    setView,
    expanded,
    setExpanded,
    selected,
    select: (d: LoginDevice) => setSelectedId(d.id),
    details: devices.find((d) => d.id === detailsId) ?? null,
    openDetails: (d: LoginDevice) => setDetailsId(d.id),
    closeDetails: () => setDetailsId(null),
    action,
    setAction,
    visibleDevices,
    hasMore: others.length > 2,
  };
}
