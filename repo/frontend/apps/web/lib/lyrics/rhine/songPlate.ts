import * as THREE from "three";
import type { RhineArchiveTrack } from "@/types/rhineBackground";

const WIDTH = 1536;
const HEIGHT = 1104;
const COVER_SIZE = 944;
const TITLE_X = 1060;
const TITLE_WIDTH = WIDTH - TITLE_X - 60;
const FONT_STACK = '"Segoe UI", "Microsoft YaHei", Arial, sans-serif';

function wrapTitle(context: CanvasRenderingContext2D, title: string) {
  const lines: string[] = [];
  let line = "";
  for (const character of Array.from(title)) {
    if (line && context.measureText(line + character).width > TITLE_WIDTH) {
      const space = line.lastIndexOf(" ");
      if (space > 0) {
        lines.push(line.slice(0, space));
        line = line.slice(space + 1);
      } else {
        lines.push(line);
        line = "";
      }
    }
    line += character;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/** A song's printed insert. It owns its image request and never borrows another card's cover. */
export class RhineSongPlate {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly canvas = document.createElement("canvas");
  private readonly texture: THREE.CanvasTexture;
  private track: RhineArchiveTrack = { title: "", coverUrl: null };
  private image: HTMLImageElement | null = null;
  private imageReady = false;
  private disposed = false;

  constructor(track: RhineArchiveTrack, private readonly onReady: () => void) {
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.55, 4.55 * HEIGHT / WIDTH),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    this.mesh.name = "song-insert";
    this.mesh.position.set(0, 1.86, 0.275);
    this.mesh.renderOrder = 30;
    this.setTrack(track);
  }

  setTrack(track: RhineArchiveTrack) {
    if (this.disposed) return;
    const coverChanged = this.track.coverUrl !== track.coverUrl;
    this.track = { ...track };
    if (coverChanged) {
      this.cancelImage();
      if (track.coverUrl) {
        const image = new Image();
        this.image = image;
        image.crossOrigin = "anonymous";
        image.decoding = "async";
        image.onload = () => {
          if (this.disposed || this.image !== image) return;
          this.imageReady = image.naturalWidth > 0 && image.naturalHeight > 0;
          this.draw();
          this.onReady();
        };
        image.onerror = () => {
          if (this.disposed || this.image !== image) return;
          // Missing artwork leaves the song title usable and never fails the scene.
          this.cancelImage();
        };
        image.src = track.coverUrl;
      }
    }
    this.draw();
  }

  private draw() {
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#eeede4";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#dcded3";
    context.fillRect(64, 80, COVER_SIZE, COVER_SIZE);

    if (this.imageReady && this.image) {
      const scale = Math.min(COVER_SIZE / this.image.naturalWidth, COVER_SIZE / this.image.naturalHeight);
      const width = this.image.naturalWidth * scale;
      const height = this.image.naturalHeight * scale;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(this.image, 64 + (COVER_SIZE - width) / 2, 80 + (COVER_SIZE - height) / 2, width, height);
    } else {
      context.strokeStyle = "#aeb4a7";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(64 + COVER_SIZE / 2, HEIGHT / 2, 220, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.arc(64 + COVER_SIZE / 2, HEIGHT / 2, 36, 0, Math.PI * 2);
      context.stroke();
    }

    const title = this.track.title.replace(/\s+/g, " ").trim();
    let fontSize = 92;
    let lines: string[];
    do {
      context.font = `600 ${fontSize}px ${FONT_STACK}`;
      lines = wrapTitle(context, title);
      if (lines.length * fontSize * 1.35 <= 860 || fontSize <= 52) break;
      fontSize -= 4;
    } while (fontSize >= 52);

    const lineHeight = fontSize * 1.35;
    const maxLines = Math.floor(860 / lineHeight);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last && context.measureText(`${last}…`).width > TITLE_WIDTH) last = Array.from(last).slice(0, -1).join("");
      lines[maxLines - 1] = `${last}…`;
    }
    const top = (HEIGHT - lines.length * lineHeight) / 2;
    context.fillStyle = "#aa8150";
    context.fillRect(TITLE_X, Math.max(56, top - 40), 70, 6);
    context.fillStyle = "#252d29";
    context.textBaseline = "top";
    lines.forEach((line, index) => context.fillText(line, TITLE_X, top + index * lineHeight));
    this.texture.needsUpdate = true;
  }

  private cancelImage() {
    if (this.image) {
      this.image.onload = null;
      this.image.onerror = null;
      this.image.removeAttribute("src");
    }
    this.image = null;
    this.imageReady = false;
  }

  dispose() {
    this.disposed = true;
    this.cancelImage();
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}
