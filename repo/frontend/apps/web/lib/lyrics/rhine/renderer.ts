import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { RHINE_QUALITY } from "@/constants/rhineBackground";
import type { RhineQuality } from "@/types/rhineBackground";
import { RhineAOPass } from "./ambientOcclusion";
import { themeEnvironment } from "./themeMaterial";

export class RhineRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(34, 16 / 9, 5, 300);
  readonly renderer: THREE.WebGLRenderer;
  private readonly aim = new THREE.Vector3(-1.091, -0.045, 0.481);
  private readonly key = new THREE.DirectionalLight("#fff7ed", 1.4);
  private readonly ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: "#d8c9b9", roughness: 0.95 }));
  private environment?: THREE.WebGLRenderTarget;
  private composer?: EffectComposer;
  private ao?: RhineAOPass;
  private smaa?: SMAAPass;
  private quality: RhineQuality = "original";
  private width = 1;
  private height = 1;
  private readonly pendingImages: HTMLImageElement[] = [];
  onAssetsReady?: () => void;
  private readonly imageReady = () => this.onAssetsReady?.();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  }

  initialize(quality: RhineQuality) {
    this.quality = quality;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.scene.background = new THREE.Color("#eae5e1");
    this.scene.fog = new THREE.Fog("#eae5e1", 145, 165);
    this.scene.environmentIntensity = 0.48;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    try { this.environment = pmrem.fromScene(room, 0.04); }
    finally { room.dispose(); pmrem.dispose(); }
    this.scene.environment = this.environment.texture;
    this.scene.add(new THREE.HemisphereLight("#fffaf5", "#b4a18c", 0.65));
    this.key.position.set(-6, 14, -5);
    this.key.castShadow = true;
    Object.assign(this.key.shadow.camera, { left: -16, right: 16, top: 15, bottom: -15, near: 0.1, far: 45 });
    this.key.shadow.camera.updateProjectionMatrix();
    this.key.shadow.normalBias = 0.035;
    this.key.shadow.bias = -0.0003;
    this.key.shadow.radius = 4;
    const fill = new THREE.DirectionalLight("#ffffff", 0.6);
    fill.position.set(7, 8, -10);
    this.scene.add(this.key, fill);
    this.ground.name = "archive-floor";
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -4.63;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    const yaw = THREE.MathUtils.degToRad(59), elevation = THREE.MathUtils.degToRad(19);
    this.camera.position.copy(this.aim).addScaledVector(new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(elevation), Math.sin(elevation), Math.cos(yaw) * Math.cos(elevation)), 140);
    this.camera.lookAt(this.aim);
    this.camera.updateMatrixWorld();
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.ao = new RhineAOPass(this.scene, this.camera, 1, 1, 32);
    this.ao.kernelRadius = 0.38; this.ao.minDistance = 0.001; this.ao.maxDistance = 0.09;
    this.composer.addPass(this.ao);
    this.smaa = new SMAAPass();
    this.composer.addPass(this.smaa);
    // Three 0.185 stores these textures under underscored names; @types/three
    // still declares the old fields. Read the runtime shape without trusting
    // that stale declaration. This readiness hook must not block the scene.
    for (const key of ["_areaTexture", "_searchTexture"]) {
      const texture: unknown = Reflect.get(this.smaa, key);
      if (!(texture instanceof THREE.Texture)) continue;
      if (texture.image instanceof HTMLImageElement && !texture.image.complete) {
        this.pendingImages.push(texture.image);
        texture.image.addEventListener("load", this.imageReady, { once: true });
      }
    }
    this.composer.addPass(new OutputPass());
    this.applyQuality();
  }

  setQuality(quality: RhineQuality) {
    if (quality === this.quality) return false;
    this.quality = quality;
    this.applyQuality();
    this.resize(this.width, this.height);
    return true;
  }

  private applyQuality() {
    const quality = RHINE_QUALITY[this.quality];
    this.renderer.transmissionResolutionScale = quality.transmissionScale;
    if (this.key.shadow.mapSize.x !== quality.shadows) {
      this.key.shadow.map?.dispose(); this.key.shadow.map = null;
      this.key.shadow.mapSize.setScalar(quality.shadows);
    }
    if (this.ao) this.ao.enabled = quality.ao > 0;
    if (this.smaa) this.smaa.enabled = quality.antialias;
    this.renderer.shadowMap.needsUpdate = true;
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    const quality = RHINE_QUALITY[this.quality];
    const ratio = Math.min(window.devicePixelRatio || 1, quality.pixelRatio);
    const budgetScale = Math.min(1, Math.sqrt(8_294_400 / (this.width * this.height * ratio * ratio * quality.scale ** 2)));
    const renderWidth = Math.max(1, Math.round(this.width * quality.scale * budgetScale));
    const renderHeight = Math.max(1, Math.round(this.height * quality.scale * budgetScale));
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(renderWidth, renderHeight, false);
    this.composer?.setPixelRatio(ratio);
    this.composer?.setSize(renderWidth, renderHeight);
    this.camera.aspect = this.width / this.height;
    const span = Math.max(9.4, 9.4 * (16 / 9) / this.camera.aspect);
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(span / (2 * 140)));
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.needsUpdate = true;
  }

  setTheme(amount: number) {
    themeEnvironment(this.scene, this.renderer, amount);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = 145 - 4 * amount;
      this.scene.fog.far = 165 - 9 * amount;
    }
  }

  draw() {
    this.renderer.shadowMap.needsUpdate = true;
    this.composer?.render(0);
  }

  dispose() {
    this.onAssetsReady = undefined;
    for (const image of this.pendingImages) image.removeEventListener("load", this.imageReady);
    for (const pass of this.composer?.passes ?? []) pass.dispose();
    this.composer?.dispose();
    this.environment?.dispose();
    this.key.shadow.dispose();
    this.ground.geometry.dispose(); this.ground.material.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }
}
