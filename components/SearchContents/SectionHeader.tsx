"use client";

import React from "react";

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h2 className="text-2xl font-bold tracking-tight hover:underline cursor-pointer" onClick={onSeeAll}>{title}</h2>
      <button onClick={onSeeAll} className="text-sm font-bold text-zinc-400 hover:text-white hover:underline">
        See all
      </button>
    </div>
  );
}
