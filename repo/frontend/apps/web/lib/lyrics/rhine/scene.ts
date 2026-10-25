import * as THREE from "three";
import {
  RHINE_GLOW,
  RHINE_LANES,
  RHINE_LIFT,
  RHINE_RIDGE_GAIN,
  RHINE_ROWS,
  RHINE_SHOWCASE_TIMING,
} from "@/constants/rhineBackground";
import type { RhineAudioSample, RhineSceneInput } from "@/types/rhineBackground";
import type { RhineCell, RhineFieldPulse, RhineShowcaseCard } from "@/types/rhineRuntime";
import { RhineBeatField } from "./beatField";
import { InstanceUpdates } from "./instanceUpdates";
import { RhineModel } from "./model";
import {
  idleWave,
  laneFocus,
  RhineEnvelope,
  RIPPLE_LIFE,
  selectionRipple,
  settlingRidge,
  smooth,
  Spring,
} from "./motion";
import { RhineRenderer } from "./renderer";
import { RhythmMotion, rhythmDisplacement } from "./rhythm";
import { ThemeWave } from "./themeWave";

export class RhineScene {
  private readonly cells: RhineCell[] = [];
  private readonly cards = new Map<string, RhineShowcaseCard>();
  private readonly envelope = new RhineEnvelope();
  private readonly rhythm = new RhythmMotion();
  private readonly beat = new RhineBeatField();
  private beatWeight = 0;
  private readonly matrixUpdates: InstanceUpdates;
  private readonly themeUpdates: InstanceUpdates;
  private readonly transform = new THREE.Matrix4();
  private readonly bounds = new THREE.Box3();
  private readonly frustum = new THREE.Frustum();
  private readonly projection = new THREE.Matrix4();
  private visible: RhineCell[] = [];
  private readonly heights = new Map<string, number>();
  private readonly tilts = new Map<string, number>();
  private readonly pulses: RhineFieldPulse[] = [];
  private readonly themeWave: ThemeWave;
  private readonly ridgeRow: Spring;
  private ridgeAmount = 0;
  private ridgeAge = 0;
  private active: RhineCell;
  private seed: string;
  private time = 0;
  private input: RhineSceneInput;

  constructor(
    readonly view: RhineRenderer,
    private readonly model: RhineModel,
    input: RhineSceneInput,
  ) {
    this.input = input;
    this.seed = input.seed;
    this.themeWave = new ThemeWave(input.dark);
    this.matrixUpdates = new InstanceUpdates(model.matrix);
    this.themeUpdates = new InstanceUpdates(model.themes);
    for (let lane = 0; lane < RHINE_LANES; lane++) {
      for (let row = 0; row < RHINE_ROWS; row++) {
        this.cells.push({
          lane,
          row,
          key: `${lane}:${row}`,
          x: (lane - 4) * 5.2,
          z: (row - 23.5) * 0.62,
          screenX: 0.5,
        });
      }
    }
    this.active = this.cellForSeed(this.seed);
    this.ridgeRow = new Spring(this.active.row);
    this.view.scene.add(model.array);
    this.updateVisibility();
    this.updateField(0);
    this.warmUp();
  }

  /**
   * Draw one archive while the background is still loading and hidden, so every
   * shader variant it needs, including the transmission back face that
   * `renderer.compile()` skips, is built here rather than on the first song change.
   */
  private warmUp() {
    const card = this.model.createCard(this.input.track);
    const hidden: THREE.Object3D[] = [];
    card.traverse((child) => {
      if (child.visible) return;
      hidden.push(child);
      child.visible = true;
    });
    card.position.set(this.active.x, -4.6, this.active.z);
    this.view.scene.add(card);
    // Rising and fully lifted files interpolate clearcoat to and from zero,
    // which selects a different program; draw both ends.
    for (const progress of [0, 1]) {
      this.model.appearance.apply(card, progress);
      this.paint();
    }
    for (const child of hidden) child.visible = false;
    this.model.releaseCard(card);
  }

  setInput(input: RhineSceneInput) {
    const previous = this.input;
    this.input = input;
    let dirty = this.view.setQuality(input.tuning.quality);
    const card = this.cards.get(this.active.key);
    if (
      card &&
      input.seed === this.seed &&
      (input.track.title !== previous.track.title ||
        input.track.coverUrl !== previous.track.coverUrl)
    ) {
      this.model.setCardTrack(card.group, input.track);
      dirty = true;
    }
    // A frozen pose repaints theme changes at once; the sweep only plays on the scene clock.
    if (input.frozen && Number(input.dark) !== this.themeWave.target) {
      this.themeWave.set(input.dark, this.time, this.active, true);
      dirty = true;
    }
    return dirty;
  }

  private cellForSeed(seed: string) {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index++)
      hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
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
      card.phase = "returning";
      card.elapsed = 0;
      card.startLift = card.lift;
    }
    const group = this.model.createCard(this.input.track);
    this.cards.set(cell.key, { cell, group, lift: 0, startLift: 0, phase: "rising", elapsed: 0 });
    this.pulses.push({ row: cell.row, lane: cell.lane, time: this.time });
    this.view.scene.add(group);
  }

  private updateShowcases(dt: number) {
    const timing = RHINE_SHOWCASE_TIMING;
    for (const [key, card] of this.cards) {
      card.elapsed += dt;
      if (card.phase === "rising") {
        card.lift =
          card.startLift + (RHINE_LIFT - card.startLift) * smooth(card.elapsed / timing.rising);
        if (card.elapsed >= timing.rising) {
          card.phase = "holding";
          card.elapsed -= timing.rising;
        }
      }
      if (card.phase === "holding" && card.elapsed >= timing.holding) {
        card.phase = "returning";
        card.elapsed -= timing.holding;
        card.startLift = card.lift;
      }
      if (card.phase === "returning") {
        card.lift = card.startLift * (1 - smooth(card.elapsed / timing.returning));
        if (card.elapsed >= timing.returning) {
          // Swap back to the instanced cassette at exactly the same breathing height.
          this.model.releaseCard(card.group);
          this.cards.delete(key);
        }
      }
    }
  }

  private updateRidge(dt: number) {
    const raised = [...this.cards.values()].some((card) => card.phase !== "returning");
    if (raised && this.ridgeAmount === 0) {
      // A ridge rising from rest starts its own wavefront under the new archive.
      this.ridgeAge = 0;
      this.ridgeRow.value = this.active.row;
      this.ridgeRow.velocity = 0;
    }
    this.ridgeAge += dt;
    // Later skips glide the standing ridge along the lane instead of rebuilding it.
    this.ridgeRow.damp(this.active.row, 5, dt);
    this.ridgeAmount +=
      ((raised ? 1 : 0) - this.ridgeAmount) * (1 - Math.exp(-dt * (raised ? 6 : 2.6)));
    if (!raised && this.ridgeAmount < 0.001) this.ridgeAmount = 0;
    while (this.pulses.length && this.time - this.pulses[0].time > RIPPLE_LIFE) this.pulses.shift();
  }

  private updateVisibility() {
    this.projection.multiplyMatrices(
      this.view.camera.projectionMatrix,
      this.view.camera.matrixWorldInverse,
    );
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
      const next = !this.cards.has(preferred.key)
        ? preferred
        : this.cells.find(
            (cell) =>
              cell.lane === 4 && cell.row >= 21 && cell.row <= 26 && !this.cards.has(cell.key),
          );
      // Returning files retain their own song. If every slot is occupied, the
      // latest requested song waits for a slot while music and returns continue.
      if (next) {
        this.active = next;
        this.seed = this.input.seed;
        this.showcase(this.active);
      }
    }
    if (Number(this.input.dark) !== this.themeWave.target)
      this.themeWave.set(this.input.dark, this.time, this.active);
    this.envelope.update(audio, this.input.tuning.musicEnabled, dt);
    this.beat.update(
      this.input.tuning.musicEnabled ? audio.spectrum : undefined,
      this.time,
      dt,
      this.active,
    );
    this.updateShowcases(dt);
    this.updateRidge(dt);
    this.updateField(dt);
    this.paint();
  }

  private updateField(dt: number) {
    const tuning = this.input.tuning;
    const frame = this.rhythm.update(this.envelope.bands, this.time, dt, tuning.rhythmStyle);
    this.beatWeight = frame.style.beat;
    const beat = frame.style.beat * Math.min(2, Math.max(0, tuning.strength));
    const height = (cell: RhineCell, row: number) => {
      let value =
        (tuning.breathingEnabled ? idleWave(row, cell.lane, this.time) : 0) +
        rhythmDisplacement(
          row,
          cell.lane,
          this.time,
          this.envelope.bands,
          tuning.strength,
          frame,
          cell.screenX,
        );
      if (beat > 0.001) value += beat * this.beat.height(row, cell.lane, cell.screenX, this.time);
      if (this.ridgeAmount > 0)
        value +=
          this.ridgeAmount *
          RHINE_RIDGE_GAIN *
          settlingRidge(row - this.ridgeRow.value, this.ridgeAge) *
          laneFocus(cell.lane - this.active.lane);
      let ripple = 0;
      for (const pulse of this.pulses)
        ripple += selectionRipple(row - pulse.row, cell.lane - pulse.lane, this.time - pulse.time);
      return value + THREE.MathUtils.clamp(ripple, -0.6, 0.6);
    };
    // Cache heights even for culled cells, so resizing a paused scene retains its last pose.
    for (const cell of this.cells) {
      this.heights.set(cell.key, height(cell, cell.row));
      // Lean each file along the local slope so the field reads as one continuous surface.
      this.tilts.set(
        cell.key,
        (height(cell, cell.row + 0.5) - height(cell, cell.row - 0.5)) * 0.024,
      );
    }
  }

  paint() {
    this.themeWave.beginFrame();
    let count = 0;
    for (const cell of this.visible) {
      if (this.cards.has(cell.key)) continue;
      this.transform
        .makeRotationX(this.tilts.get(cell.key) ?? 0)
        .setPosition(cell.x, -4.6 + (this.heights.get(cell.key) ?? 0), cell.z);
      this.matrixUpdates.set(count * 16, this.transform.elements);
      this.themeUpdates.scalar(count, this.themeWave.sample(cell, this.time));
      count++;
    }
    this.matrixUpdates.commit();
    this.themeUpdates.commit();
    for (const instance of this.model.instances) instance.count = count;
    const theme = this.themeWave.background(this.time);
    const emission = THREE.MathUtils.lerp(RHINE_GLOW.emission[0], RHINE_GLOW.emission[1], theme);
    let glow = 0;
    let source: RhineShowcaseCard | undefined;
    for (const card of this.cards.values()) {
      card.group.position.set(
        card.cell.x,
        -4.6 + (this.heights.get(card.cell.key) ?? 0) + card.lift,
        card.cell.z,
      );
      const progress = smooth(card.lift / RHINE_LIFT);
      // Turn toward the reader only while a file is extracted. The resting array stays aligned.
      card.group.rotation.set(
        (this.tilts.get(card.cell.key) ?? 0) * (1 - smooth(card.lift / 0.4)),
        -0.28 * progress,
        0,
      );
      this.model.appearance.apply(card.group, progress);
      this.model.appearance.setClarity(card.group, smooth((progress - 0.3) / 0.7));
      this.model.appearance.setTheme(card.group, this.themeWave.sample(card.cell, this.time));
      this.model.appearance.setGlow(card.group, progress * emission);
      if (progress > glow) {
        glow = progress;
        source = card;
      }
    }
    // The highest extracted file is the lamp; returning copies hand it over as they sink.
    // Kicks flash it, and light the resting archive when nothing is extracted.
    const flash =
      this.beat.flash *
      this.beatWeight *
      THREE.MathUtils.lerp(RHINE_GLOW.flash[0], RHINE_GLOW.flash[1], theme);
    if (source) {
      const { x, y, z } = source.group.position;
      this.model.glow.rhineGlowPosition.value.set(x, y + 1.85, z);
    } else if (flash > 0.001) {
      const { x, z, key } = this.active;
      this.model.glow.rhineGlowPosition.value.set(x, -3.4 + (this.heights.get(key) ?? 0), z);
    }
    this.model.glow.rhineGlowStrength.value = Math.max(
      glow * THREE.MathUtils.lerp(RHINE_GLOW.spill[0], RHINE_GLOW.spill[1], theme),
      flash,
    );
    this.view.setTheme(theme);
    this.view.draw();
  }

  dispose() {
    for (const card of this.cards.values()) this.model.releaseCard(card.group);
    this.cards.clear();
    this.model.dispose();
    this.view.dispose();
  }
}
