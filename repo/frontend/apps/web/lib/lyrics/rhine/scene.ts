import * as THREE from "three";
import { RHINE_LANES, RHINE_LIFT, RHINE_ROWS, RHINE_SHOWCASE_TIMING } from "@/constants/rhineBackground";
import type { RhineAudioSample, RhineSceneInput } from "@/types/rhineBackground";
import type { RhineCell, RhineShowcaseCard } from "@/types/rhineRuntime";
import { InstanceUpdates } from "./instanceUpdates";
import { RhineModel } from "./model";
import { idleWave, RhineEnvelope, smooth } from "./motion";
import { RhineRenderer } from "./renderer";
import { RhythmMotion, rhythmDisplacement } from "./rhythm";

export class RhineScene {
  private readonly cells: RhineCell[] = [];
  private readonly cards = new Map<string, RhineShowcaseCard>();
  private readonly envelope = new RhineEnvelope();
  private readonly rhythm = new RhythmMotion();
  private readonly matrixUpdates: InstanceUpdates;
  private readonly themeUpdates: InstanceUpdates;
  private readonly transform = new THREE.Matrix4();
  private readonly bounds = new THREE.Box3();
  private readonly frustum = new THREE.Frustum();
  private readonly projection = new THREE.Matrix4();
  private visible: RhineCell[] = [];
  private readonly heights = new Map<string, number>();
  private active: RhineCell;
  private seed: string;
  private time = 0;
  private themeAmount: number;
  private input: RhineSceneInput;

  constructor(readonly view: RhineRenderer, private readonly model: RhineModel, input: RhineSceneInput) {
    this.input = input; this.seed = input.seed; this.themeAmount = Number(input.dark);
    this.matrixUpdates = new InstanceUpdates(model.matrix);
    this.themeUpdates = new InstanceUpdates(model.themes);
    for (let lane = 0; lane < RHINE_LANES; lane++) {
      for (let row = 0; row < RHINE_ROWS; row++) {
        this.cells.push({ lane, row, key: `${lane}:${row}`,
          x: (lane - 4) * 5.2, z: (row - 23.5) * 0.62, screenX: 0.5 });
      }
    }
    this.active = this.cellForSeed(this.seed);
    this.view.scene.add(model.array);
    this.updateVisibility();
    this.updateField(0);
  }

  setInput(input: RhineSceneInput) {
    const previous = this.input;
    this.input = input;
    let dirty = this.view.setQuality(input.tuning.quality);
    const card = this.cards.get(this.active.key);
    if (card && input.seed === this.seed &&
      (input.track.title !== previous.track.title || input.track.coverUrl !== previous.track.coverUrl)) {
      this.model.setCardTrack(card.group, input.track);
      dirty = true;
    }
    // Theme changes can repaint a frozen pose; the animation and envelope stay untouched.
    if (input.frozen && input.dark !== previous.dark) {
      this.themeAmount = Number(input.dark); dirty = true;
    }
    return dirty;
  }

  private cellForSeed(seed: string) {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index++) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
    // Keep the current archive near the composition's centre; no camera jump on track changes.
    const row = 21 + ((hash >>> 0) % 6);
    const cell = this.cells.find((cell) => cell.lane === 4 && cell.row === row);
    if (!cell) throw new Error("Rhine archive centre cell is missing");
    return cell;
  }

  private showcase(cell: RhineCell) {
    // Rapid skips return earlier showcases from their current height.
    for (const card of this.cards.values()) {
      if (card.phase === "returning") continue;
      card.phase = "returning"; card.elapsed = 0; card.startLift = card.lift;
    }
    const group = this.model.createCard(this.input.track);
    this.cards.set(cell.key, { cell, group, lift: 0, startLift: 0, phase: "rising", elapsed: 0 });
    this.view.scene.add(group);
  }

  private updateShowcases(dt: number) {
    const timing = RHINE_SHOWCASE_TIMING;
    for (const [key, card] of this.cards) {
      card.elapsed += dt;
      if (card.phase === "rising") {
        card.lift = card.startLift + (RHINE_LIFT - card.startLift) * smooth(card.elapsed / timing.rising);
        if (card.elapsed >= timing.rising) {
          card.phase = "holding"; card.elapsed -= timing.rising;
        }
      }
      if (card.phase === "holding" && card.elapsed >= timing.holding) {
        card.phase = "returning"; card.elapsed -= timing.holding; card.startLift = card.lift;
      }
      if (card.phase === "returning") {
        card.lift = card.startLift * (1 - smooth(card.elapsed / timing.returning));
        if (card.elapsed >= timing.returning) {
          // Swap back to the instanced cassette at exactly the same breathing height.
          this.model.releaseCard(card.group); this.cards.delete(key);
        }
      }
    }
  }

  private updateVisibility() {
    this.projection.multiplyMatrices(this.view.camera.projectionMatrix, this.view.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection);
    this.visible = this.cells.filter((cell) => {
      this.bounds.min.set(cell.x - 2.8, -4.9, cell.z - 1.2);
      this.bounds.max.set(cell.x + 2.8, 5.2, cell.z + 1.2);
      const screen = new THREE.Vector3(cell.x, -0.9, cell.z).project(this.view.camera);
      cell.screenX = screen.x * 0.5 + 0.5;
      return this.frustum.intersectsBox(this.bounds);
    });
  }

  resize(width: number, height: number) {
    this.view.resize(width, height);
    this.updateVisibility();
    this.paint();
  }

  advance(dt: number, audio: RhineAudioSample) {
    if (this.input.frozen) return;
    // This is the only clock. Pause/hidden time never enters showcases, rhythm or smoothing.
    this.time += dt;
    if (this.seed !== this.input.seed) {
      const preferred = this.cellForSeed(this.input.seed);
      const next = !this.cards.has(preferred.key) ? preferred : this.cells.find((cell) =>
        cell.lane === 4 && cell.row >= 21 && cell.row <= 26 && !this.cards.has(cell.key));
      // Returning files retain their own song. If every slot is occupied, the
      // latest requested song waits for a slot while music and returns continue.
      if (next) {
        this.active = next;
        this.seed = this.input.seed;
        this.showcase(this.active);
      }
    }
    this.envelope.update(audio, this.input.tuning.musicEnabled, dt);
    this.themeAmount += (Number(this.input.dark) - this.themeAmount) * (1 - Math.exp(-dt * 5));
    this.updateShowcases(dt);
    this.updateField(dt);
    this.paint();
  }

  private updateField(dt: number) {
    const tuning = this.input.tuning;
    const frame = this.rhythm.update(this.envelope.bands, this.time, dt, tuning.rhythmStyle);
    // Cache heights even for culled cells, so resizing a paused scene retains its last pose.
    for (const cell of this.cells) {
      const breathing = tuning.breathingEnabled ? idleWave(cell.row, cell.lane, this.time) : 0;
      this.heights.set(cell.key, breathing + rhythmDisplacement(cell.row, cell.lane, this.time,
        this.envelope.bands, tuning.strength, frame, cell.screenX));
    }
  }

  paint() {
    let count = 0;
    for (const cell of this.visible) {
      if (this.cards.has(cell.key)) continue;
      this.transform.makeTranslation(cell.x, -4.6 + (this.heights.get(cell.key) ?? 0), cell.z);
      this.matrixUpdates.set(count * 16, this.transform.elements);
      this.themeUpdates.scalar(count, this.themeAmount);
      count++;
    }
    this.matrixUpdates.commit(); this.themeUpdates.commit();
    for (const instance of this.model.instances) instance.count = count;
    for (const card of this.cards.values()) {
      card.group.position.set(card.cell.x, -4.6 + (this.heights.get(card.cell.key) ?? 0) + card.lift, card.cell.z);
      const progress = smooth(card.lift / RHINE_LIFT);
      // Turn toward the reader only while a file is extracted. The resting array stays aligned.
      card.group.rotation.y = -0.28 * progress;
      this.model.appearance.apply(card.group, progress);
      this.model.appearance.setClarity(card.group, smooth((progress - 0.3) / 0.7));
      this.model.appearance.setTheme(card.group, this.themeAmount);
    }
    this.view.setTheme(this.themeAmount);
    this.view.draw();
  }

  dispose() {
    for (const card of this.cards.values()) this.model.releaseCard(card.group);
    this.cards.clear(); this.model.dispose(); this.view.dispose();
  }
}
