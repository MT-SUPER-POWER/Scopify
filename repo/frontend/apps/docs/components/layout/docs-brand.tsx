import Image from "next/image";

import scopifyLogo from "@/assets/logo.png";

export function DocsBrand() {
  return (
    <span role="img" aria-label="Scopify Docs" className="flex items-center gap-2 font-semibold">
      <Image src={scopifyLogo} alt="" width={26} height={26} priority className="size-6.5" />
      <span className="text-muted-foreground text-sm">Docs</span>
    </span>
  );
}
