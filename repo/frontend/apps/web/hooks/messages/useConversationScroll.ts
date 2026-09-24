"use client";

import { useLayoutEffect, useRef } from "react";
import type { ConversationScrollPosition, PrivateMessage } from "@/types/privateMessages";

export function useConversationScroll(messages: PrivateMessage[]) {
  const rootRef = useRef<HTMLDivElement>(null);
  const prepend = useRef<ConversationScrollPosition | null>(null);
  const follow = useRef(true);
  const previousFirst = useRef<string | undefined>(undefined);
  const previousLast = useRef<string | undefined>(undefined);
  const first = messages[0]?.id;
  const last = messages.at(-1);
  function viewport() {
    return rootRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
  }
  useLayoutEffect(() => {
    const element = viewport();
    if (!element) return;
    if (prepend.current && first !== previousFirst.current) {
      element.scrollTop = prepend.current.top + element.scrollHeight - prepend.current.height;
      prepend.current = null;
    } else if (last?.id !== previousLast.current && (follow.current || last?.own)) {
      element.scrollTop = element.scrollHeight;
    }
    previousFirst.current = first;
    previousLast.current = last?.id;
  }, [first, last?.id, last?.own]);
  return {
    rootRef,
    onScroll() {
      const element = viewport();
      if (element)
        follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
    },
    beforeLoadOlder() {
      const element = viewport();
      if (element) prepend.current = { height: element.scrollHeight, top: element.scrollTop };
    },
  };
}
