import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";

export class RhineAOPass extends SSAOPass {
  dispose() {
    super.dispose();
    // Three 0.185's SSAOPass disposal omits its AO material and noise map.
    this.ssaoMaterial.dispose();
    this.noiseTexture.dispose();
  }
}
