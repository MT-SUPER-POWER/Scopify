import Image from "next/image";

import scopifyLogo from "../../../../../../docs/img/logo.png";

export function DocsBrand() {
  return (
    <span className="flex items-center gap-2.5 font-semibold">
      <Image src={scopifyLogo} alt="" width={26} height={26} priority className="size-6.5" />
      <span>Scopify Docs</span>
    </span>
  );
}
