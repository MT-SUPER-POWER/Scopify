"use client";

import { useUiStore } from "@/store/module/ui";
import { useEffect, useRef } from "react";

/** Focus and keyboard ownership for the active Folia modal layer. */
export function useFoliaModalFocus<T extends HTMLElement = HTMLElement>(
  active: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    const selector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]';
    const focusable = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>(selector) ?? []).filter(
        (element) => element.getClientRects().length > 0,
      );
    const frame = requestAnimationFrame(() => (focusable()[0] ?? ref.current)?.focus());
    const handleKey = (event: KeyboardEvent) => {
      if (useUiStore.getState().isSearchOpen) return;
      const layer = Number(ref.current?.dataset.foliaModalLayer ?? 0);
      const covered = Array.from(
        document.querySelectorAll<HTMLElement>("[data-folia-modal-layer]"),
      ).some(
        (element) =>
          Number(element.dataset.foliaModalLayer) > layer && element.getClientRects().length > 0,
      );
      if (
        covered ||
        event.defaultPrevented ||
        document.querySelector('[role="alertdialog"], [role="dialog"][data-state="open"]')
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first) {
        event.preventDefault();
        ref.current?.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first || !ref.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !ref.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKey);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [active]);
  return ref;
}
