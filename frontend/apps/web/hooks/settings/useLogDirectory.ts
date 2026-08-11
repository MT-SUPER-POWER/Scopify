"use client";

import { useEffect, useState } from "react";
import { runtime } from "@/lib/runtime";

export function useLogDirectory() {
  const [logDirectory, setLogDirectory] = useState<string | null>();

  useEffect(() => {
    let isMounted = true;

    runtime.logging
      .getDirectory()
      .then((directory) => {
        if (isMounted) setLogDirectory(directory);
      })
      .catch(() => {
        if (isMounted) setLogDirectory(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return logDirectory;
}
