import { runtime } from "@/lib/runtime";

export async function toggleApplicationDeveloperTools() {
  return runtime.window.toggleDeveloperTools();
}
