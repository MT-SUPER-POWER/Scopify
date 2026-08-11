import { expect, test } from "bun:test";

const VIP_SIGN_MODAL_PATH = "components/VipSign/VipSignModal.tsx";

test("renders the Vip Sign modal through the document portal", async () => {
  const source = await Bun.file(VIP_SIGN_MODAL_PATH).text();

  expect(source).toContain("createPortal(");
  expect(source).toContain("document.body");
});
