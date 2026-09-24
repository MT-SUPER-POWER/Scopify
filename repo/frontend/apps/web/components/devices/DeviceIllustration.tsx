import Image from "next/image";
import type { DeviceIllustrationProps } from "@/types/components/loginDevices";
import styles from "./LoginDevices.module.css";

export function DeviceIllustration({ kind, tone, hero = false }: DeviceIllustrationProps) {
  const asset =
    kind === "phone"
      ? "phone"
      : kind === "laptop"
        ? "laptop"
        : tone === "mint"
          ? "monitor"
          : "tower";
  return (
    <div className={styles.illustration} data-asset={asset} aria-hidden="true">
      <Image
        src={`/images/devices/${asset}.png`}
        alt=""
        width={1024}
        height={1024}
        sizes={hero ? "(max-width: 700px) 180px, 360px" : "(max-width: 700px) 120px, 240px"}
        priority={hero}
      />
    </div>
  );
}
