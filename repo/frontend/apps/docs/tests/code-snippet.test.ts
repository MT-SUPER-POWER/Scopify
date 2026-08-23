import { expect, test } from "bun:test";

import { formatCodeSnippet } from "@/lib/format-code-snippet";

test("restores TSX indentation removed from MDX template attributes", async () => {
  const source = `import { Button } from "@scopify/ui/shadcn/components/button";

<div className="flex gap-2">
<Button>保存</Button>
<Button variant="outline">取消</Button>
</div>`;

  const formatted = await formatCodeSnippet(source, "tsx");

  expect(formatted).toContain("\n  <Button>保存</Button>");
  expect(formatted).toContain('\n  <Button variant="outline">取消</Button>');
  expect(formatted).toEndWith("</div>");
});
