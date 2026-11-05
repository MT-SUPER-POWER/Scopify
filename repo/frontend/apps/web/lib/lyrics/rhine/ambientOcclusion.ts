import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";

export class RhineAOPass extends SSAOPass {
  /**
   * Occlusion is low-frequency and gets blurred anyway, so its buffers (normals with depth, the occlusion and
   * the blur target, all half-float: 28 bytes per pixel in total) are kept at half the size in each direction.
   * That is a quarter of their memory and of the normal pass's fill cost; the occlusion is sampled back up
   * when it is composited over the full-size picture.
   */
  setSize(width: number, height: number) {
    super.setSize(Math.max(1, Math.ceil(width / 2)), Math.max(1, Math.ceil(height / 2)));
  }

  dispose() {
    super.dispose();
    // Three 0.185's SSAOPass disposal omits its AO material and noise map.
    this.ssaoMaterial.dispose();
    this.noiseTexture.dispose();
  }
}
