import type { NebbiaAquaUniforms } from "./nebbiaGlUtils";
import { NebbiaJellies } from "./nebbiaJellies";
import { NEBBIA_MAX_JELLIES, type NebbiaTuning } from "./types";

// 水族箱的运行时：推进水母，把水母和气泡的参数写进着色器每帧复用的一份 uniform。
type Rgb = [number, number, number];

export class NebbiaAquarium {
  private readonly jellies = new NebbiaJellies();
  private readonly out: NebbiaAquaUniforms = {
    jelly: new Float32Array(NEBBIA_MAX_JELLIES * 4),
    jellyColor: new Float32Array(NEBBIA_MAX_JELLIES * 4),
    count: 0,
    bubbles: 0,
  };

  setPalette(la: Rgb, lb: Rgb, lc: Rgb) {
    this.jellies.setPalette(la, lb, lc);
  }

  step(dt: number, time: number, aspect: number, tuning: NebbiaTuning): NebbiaAquaUniforms {
    this.jellies.step(this.out, dt, time, aspect, tuning);
    this.out.bubbles = tuning.bubbles;
    return this.out;
  }
}
