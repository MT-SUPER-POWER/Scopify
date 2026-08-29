import { expect, test } from "bun:test";

import { setAudioElementOutputDevice } from "@/lib/player/audioOutput";
import { useAudioOutputStore } from "@/store/module/audioOutput";

test("applies an audio output device through setSinkId", async () => {
  let selected = "";
  const audio = {
    setSinkId: async (deviceId: string) => {
      selected = deviceId;
    },
  } as unknown as HTMLAudioElement;

  await setAudioElementOutputDevice(audio, "headphones");
  expect(selected).toBe("headphones");
});

test("rejects output selection when setSinkId is unavailable", async () => {
  const audio = {} as HTMLAudioElement;
  await expect(setAudioElementOutputDevice(audio, "headphones")).rejects.toThrow(
    "Audio output selection is not supported",
  );
});

test("persists independent preferred input and output device identities", () => {
  const store = useAudioOutputStore.getState();
  store.setSelectedInputDeviceId("microphone-1");
  store.setSelectedDeviceId("speakers-1");

  expect(useAudioOutputStore.getState()).toMatchObject({
    selectedInputDeviceId: "microphone-1",
    selectedDeviceId: "speakers-1",
  });

  useAudioOutputStore.setState({ selectedInputDeviceId: "", selectedDeviceId: "" });
});
