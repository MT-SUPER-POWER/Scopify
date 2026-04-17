import { usePlayerStore } from "@/store";
import { useTimeStore } from "@/store/module/time";

class AudioManager {
  private static instance: AudioManager;
  public audio: HTMLAudioElement | null = null;
  private lastStoreWrite = 0;
  private hasRestoredProgress = false;
  private initialized = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    this.audio = new Audio();
    this.audio.preload = "auto";

    // 1. 初始化音量
    const playerState = usePlayerStore.getState();
    this.audio.volume = Math.max(0, Math.min(1, playerState.volume / 100));

    // ✨ 修复重点 1：页面初次加载时，主动读取持久化的 URL 给 audio 引擎
    if (playerState.currentSongUrl) {
      this.audio.src = playerState.currentSongUrl;
      this.hasRestoredProgress = false;
      this.audio.load();
    }

    this.bindAudioEvents();
    this.bindStoreSubscriptions();
    this.bindWindowEvents();
  }

  // 监听订阅的状态，实现 zustand 控制 audio
  private bindStoreSubscriptions() {
    let prevUrl = usePlayerStore.getState().currentSongUrl;
    let prevIsPlaying = usePlayerStore.getState().isPlaying;
    let prevVolume = usePlayerStore.getState().volume;

    usePlayerStore.subscribe((state) => {
      if (state.currentSongUrl !== prevUrl) {
        prevUrl = state.currentSongUrl;
        if (this.audio && state.currentSongUrl) {
          this.audio.src = state.currentSongUrl;
          // ✨ 切歌时重置保险栓，以便触发新的 loadedmetadata 恢复 0 进度
          this.hasRestoredProgress = false;
          this.audio.load();
          usePlayerStore.getState().fetchCurrentLyric();
        }
      }

      if (state.isPlaying !== prevIsPlaying) {
        prevIsPlaying = state.isPlaying;
        if (this.audio?.src) {
          if (state.isPlaying) {
            this.audio.play().catch((err) => {
              console.warn("Play interrupted or not allowed:", err);
              usePlayerStore.getState().setIsPlaying(false);
            });
          } else {
            this.audio.pause();
          }
        }
      }

      if (state.volume !== prevVolume) {
        prevVolume = state.volume;
        if (this.audio) {
          this.audio.volume = Math.max(0, Math.min(1, state.volume / 100));
        }
      }
    });
  }

  private bindAudioEvents() {
    if (!this.audio) return;

    this.audio.addEventListener("ended", () => {
      usePlayerStore.getState().playNext();
    });

    // ✨ 修正 1：loadedmetadata 现在只做一件事，就是安全的拿总时长
    this.audio.addEventListener("loadedmetadata", () => {
      const audio = this.audio!;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        window.dispatchEvent(new CustomEvent("player-duration", { detail: audio.duration * 1000 }));
        useTimeStore.getState().setTotalTime(audio.duration * 1000);
      }
    });

    this.audio.addEventListener("progress", () => {
      const audio = this.audio!;
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        useTimeStore.getState().setBufferedTime(bufferedEnd * 1000);
      }
    });

    this.audio.addEventListener("timeupdate", () => {
      const audio = this.audio!;
      if (audio.paused) return;

      const currentTimeMs = audio.currentTime * 1000;
      const now = Date.now();

      window.dispatchEvent(new CustomEvent("player-time", { detail: currentTimeMs }));

      if (now - this.lastStoreWrite > 3000) {
        useTimeStore.getState().setCurrentTime(currentTimeMs);
        this.lastStoreWrite = now;
      }
    });

    // ✨ 修正 2：将恢复进度的逻辑挪到 canplay。这里有实际的数据，跳转才能生效。
    this.audio.addEventListener("canplay", () => {
      const audio = this.audio!;

      // 恢复断点进度
      if (!this.hasRestoredProgress) {
        const persistedTime = useTimeStore.getState().currentTime;
        if (persistedTime > 0) {
          const restoreSeconds = persistedTime / 1000;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = Math.min(restoreSeconds, audio.duration - 1);
          } else {
            audio.currentTime = restoreSeconds;
          }
        }
        // 拉上保险栓，防止后续因为网络缓冲等原因重复触发拉回
        this.hasRestoredProgress = true;
      }

      // 处理自动播放
      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch((err) => {
          console.warn("Auto-play blocked or interrupted:", err);
          usePlayerStore.getState().setIsPlaying(false);
        });
      }
    });
  }

  private bindWindowEvents() {
    window.addEventListener("player-seek", (e: Event) => {
      const newTimeMs = (e as CustomEvent<number>).detail;
      if (this.audio) {
        this.audio.currentTime = newTimeMs / 1000;
      }
      useTimeStore.getState().setCurrentTime(newTimeMs);
    });
  }
}

export const audioManager = AudioManager.getInstance();
