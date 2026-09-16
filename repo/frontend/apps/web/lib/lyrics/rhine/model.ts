import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RHINE_MODEL_URL } from "@/constants/rhineBackground";
import { CardAppearance } from "./appearance";
import { configureInternalOptics } from "./internalOptics";
import { themeMaterial } from "./themeMaterial";
import { RhineSongPlate } from "./songPlate";
import type { RhineArchiveTrack } from "@/types/rhineBackground";

const arraySurfaces = new Set([
  "Frosted_Polymer", "Ivory_Edges", "Titanium_Fasteners", "Index_Inlay", "Optical_Diffuser",
]);

// Material values and panel-height shading retain the original archive scene.
function prepareSurface(material: THREE.MeshPhysicalMaterial, name: string) {
  material.envMapIntensity = 0.6;
  switch (name) {
    case "Frosted_Polymer":
      material.color.set("#fffdfa");
      material.transmission = 0.9;
      material.thickness = 0.12;
      material.roughness = 0.21;
      material.ior = 1.46;
      material.attenuationColor.set("#eee6df");
      material.attenuationDistance = 2;
      break;
    case "Internal_Ceramic": material.color.set("#c7beb6"); material.roughness = 0.6; break;
    case "Printed_Label": material.color.set("#eae5dc"); break;
    case "Ivory_Edges":
      material.color.set("#eae8dc"); material.roughness = 0.27;
      material.transmission = 0.65; material.thickness = 0.04;
      break;
    case "Optical_Diffuser":
      material.color.set("#e2dad4"); material.transmission = 0; material.roughness = 0.7;
      break;
    case "Subsurface_Optics":
      material.color.set("#b9aba1"); material.roughness = 0.48; material.metalness = 0.05;
      break;
    case "Optical_Edges":
      material.color.set("#d4c7be"); material.transmission = 0;
      material.roughness = 0.26; material.metalness = 0.08;
      break;
  }
  configureInternalOptics(name, material);
}

function arraySurface(source: THREE.MeshPhysicalMaterial, name: string) {
  const material = source.clone();
  if (name === "Frosted_Polymer") {
    material.transmission = 0.78;
    material.transparent = false;
    material.color.set("#f3f1e7");
    material.roughness = 0.22;
    material.clearcoat = 0.3;
    material.clearcoatRoughness = 0.25;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = "varying float vPanelHeight;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>",
        "#include <begin_vertex>\nvPanelHeight = position.y / 3.7;");
      shader.fragmentShader = "varying float vPanelHeight;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb *= mix(vec3(.40,.30,.20), vec3(1.,.98,.94), smoothstep(.1,1.,vPanelHeight));");
    };
  }
  if (name === "Optical_Diffuser") material.color.set("#806447");
  if (name === "Ivory_Edges") {
    material.transmission = 0; material.color.set("#eeede2"); material.roughness = 0.3;
  }
  if (name === "Index_Inlay") { material.color.set("#e4d6c5"); material.metalness = 0.05; }
  return material;
}

export class RhineModel {
  readonly appearance = new CardAppearance();
  readonly array = new THREE.Group();
  readonly instances: THREE.InstancedMesh[] = [];
  readonly matrix: THREE.InstancedBufferAttribute;
  readonly themes: THREE.InstancedBufferAttribute;
  private readonly template = new THREE.Group();
  private readonly songPlates = new Map<THREE.Group, RhineSongPlate>();
  onArtworkReady?: () => void;

  constructor(source: THREE.Group, capacity: number) {
    this.matrix = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 16), 16)
      .setUsage(THREE.DynamicDrawUsage);
    this.themes = new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1)
      .setUsage(THREE.DynamicDrawUsage);
    source.updateMatrixWorld(true);
    source.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
      const original = object.material as THREE.MeshStandardMaterial;
      const name = original.name.replace(/\.\d+$/, "");
      if (name === "Carbon_Ink") return;
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      const material = original instanceof THREE.MeshPhysicalMaterial
        ? original.clone() : new THREE.MeshPhysicalMaterial();
      if (!(original instanceof THREE.MeshPhysicalMaterial)) {
        THREE.MeshStandardMaterial.prototype.copy.call(material, original);
        material.defines = { STANDARD: "", PHYSICAL: "" };
      }
      prepareSurface(material, name);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.surface = name;
      mesh.castShadow = name === "Optical_Diffuser";
      mesh.receiveShadow = true;
      this.template.add(mesh);
      if (!arraySurfaces.has(name)) {
        this.appearance.register(name, material);
        return;
      }
      const low = arraySurface(material, name);
      this.appearance.register(name, material, low);
      const instanceGeometry = geometry.clone();
      instanceGeometry.setAttribute("archiveTheme", this.themes);
      themeMaterial(low, name, true);
      const instance = new THREE.InstancedMesh(instanceGeometry, low, capacity);
      instance.instanceMatrix = this.matrix;
      instance.castShadow = mesh.castShadow;
      instance.receiveShadow = true;
      instance.frustumCulled = false;
      this.instances.push(instance);
      this.array.add(instance);
    });
  }

  createCard(track: RhineArchiveTrack) {
    const card = this.template.clone(true);
    // Keep the cassette shell and fittings; the song replaces the original
    // internal optics and printed database label.
    for (const child of [...card.children]) {
      if (!arraySurfaces.has(child.userData.surface)) card.remove(child);
    }
    this.appearance.prepare(card);
    // Add after theme preparation so artwork keeps its original colours in both themes.
    const plate = new RhineSongPlate(track, () => this.onArtworkReady?.());
    this.songPlates.set(card, plate);
    card.add(plate.mesh);
    return card;
  }

  setCardTrack(card: THREE.Group, track: RhineArchiveTrack) {
    this.songPlates.get(card)?.setTrack(track);
  }

  releaseCard(card: THREE.Group) {
    this.songPlates.get(card)?.dispose();
    this.songPlates.delete(card);
    this.appearance.dispose(card);
    for (const child of card.children) {
      if (child instanceof THREE.Mesh && !child.userData.surface) child.geometry.dispose();
    }
    card.removeFromParent();
  }

  dispose() {
    this.onArtworkReady = undefined;
    for (const card of [...this.songPlates.keys()]) this.releaseCard(card);
    for (const mesh of this.instances) { mesh.dispose(); mesh.geometry.dispose(); }
    for (const mesh of this.template.children) {
      if (mesh instanceof THREE.Mesh) mesh.geometry.dispose();
    }
    this.appearance.disposeSources();
    this.array.clear(); this.template.clear();
  }
}

export async function loadRhineModel(capacity: number, signal: AbortSignal) {
  const response = await fetch(RHINE_MODEL_URL, { signal });
  if (!response.ok) throw new Error(`Rhine model: HTTP ${response.status}`);
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "");
  try {
    signal.throwIfAborted();
    return new RhineModel(gltf.scene, capacity);
  } finally {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
  }
}
