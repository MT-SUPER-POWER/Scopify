import {
  AudioLines,
  Code2,
  Command,
  FastForward,
  Heart,
  Keyboard,
  ListMusic,
  Maximize2,
  MessageCircle,
  MonitorCog,
  PanelLeft,
  PlayCircle,
  Rewind,
  Search,
  Settings2,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";

interface ShortcutCommandIconProps {
  className?: string;
  commandId: string;
}

export function ShortcutCommandIcon({ className = "size-4", commandId }: ShortcutCommandIconProps) {
  if (commandId === "toggle-playback") return <PlayCircle className={className} />;
  if (commandId === "toggle-like") return <Heart className={className} />;
  if (commandId === "previous-track") return <SkipBack className={className} />;
  if (commandId === "next-track") return <SkipForward className={className} />;
  if (commandId === "increase-volume" || commandId === "decrease-volume") {
    return <Volume2 className={className} />;
  }
  if (commandId === "toggle-mute") return <VolumeX className={className} />;
  if (commandId === "seek-backward-5s" || commandId === "seek-backward-1s") {
    return <Rewind className={className} />;
  }
  if (commandId === "seek-forward-5s" || commandId === "seek-forward-1s") {
    return <FastForward className={className} />;
  }
  if (commandId === "open-search" || commandId === "focus-playlist-search") {
    return <Search className={className} />;
  }
  if (commandId === "toggle-lyric-stage") return <AudioLines className={className} />;
  if (commandId === "toggle-sidebar") return <PanelLeft className={className} />;
  if (commandId === "open-shortcut-settings") return <Settings2 className={className} />;
  if (commandId === "toggle-queue") return <ListMusic className={className} />;
  if (commandId === "toggle-audio-settings") return <SlidersHorizontal className={className} />;
  if (commandId === "toggle-desktop-controller") return <MonitorCog className={className} />;
  if (commandId === "show-shortcut-help") return <Keyboard className={className} />;
  if (commandId === "toggle-fullscreen") return <Maximize2 className={className} />;
  if (commandId === "toggle-developer-tools") return <Code2 className={className} />;
  if (commandId === "open-current-track-comments") return <MessageCircle className={className} />;
  return <Command className={className} />;
}
