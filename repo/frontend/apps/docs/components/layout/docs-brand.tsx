import Image from "next/image";

import scopifyLogo from "@/assets/logo.png";
import { ScopifyWordmark } from "@/components/layout/scopify-wordmark";

export function DocsBrand() {
  return (
    <span role="img" aria-label="Scopify Docs" className="flex items-center gap-2 font-semibold">
      <Image src={scopifyLogo} alt="" width={26} height={26} priority className="size-6.5" />
      <ScopifyWordmark className="w-24" />
      <span className="text-sm text-muted-foreground">Docs</span>
    </span>
  );
}
