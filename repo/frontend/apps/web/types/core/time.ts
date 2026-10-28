export interface TimeStore {
  bufferedTime: number;
  currentTime: number;
  setBufferedTime(time: number): void;
  setCurrentTime(time: number): void;
  setTotalTime(time: number): void;
  totalTime: number;
}
