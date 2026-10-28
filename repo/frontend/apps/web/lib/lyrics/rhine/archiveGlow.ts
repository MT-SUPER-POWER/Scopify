import * as THREE from "three";
import { RHINE_GLOW } from "@/constants/rhineBackground";
import type { RhineGlowUniforms } from "@/types/lyrics/rhine/runtime";

export function createGlowUniforms(): RhineGlowUniforms {
  return {
    rhineGlowPosition: { value: new THREE.Vector3() },
    rhineGlowStrength: { value: 0 },
    rhineGlowColor: { value: new THREE.Color(RHINE_GLOW.color) },
  };
}

/**
 * Rhine Music Database bakes the extracted file's light into its neighbours.
 * Evaluate a comparable falloff per fragment instead: strongest along the
 * file's own lane, a little into the adjacent lanes, and never on the lamp
 * itself, which a real light inside the shell would blow out.
 */
export function glowMaterial(material: THREE.Material, uniforms: RhineGlowUniforms) {
  const before = material.onBeforeCompile;
  const cache = material.customProgramCacheKey.bind(material)();
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "varying vec3 vRhineWorld;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vec4 rhineWorld = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
rhineWorld = instanceMatrix * rhineWorld;
#endif
vRhineWorld = (modelMatrix * rhineWorld).xyz;`,
      );
    shader.fragmentShader =
      "uniform vec3 rhineGlowPosition; uniform float rhineGlowStrength; uniform vec3 rhineGlowColor; varying vec3 vRhineWorld;\n" +
      shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `vec3 rhineGlowOffset = (vRhineWorld - rhineGlowPosition) / vec3(4.2, 3.0, 3.6);
outgoingLight += rhineGlowColor * diffuseColor.rgb * rhineGlowStrength * exp(-dot(rhineGlowOffset, rhineGlowOffset));
#include <opaque_fragment>`,
      );
  };
  material.customProgramCacheKey = () => `${cache}-rhine-glow`;
}
