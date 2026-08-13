import { useRef, useState } from "react";

const MIN_COL = 60;

export function useColumnResize() {
  const [widths, setWidths] = useState({ title: 300, album: 200, date: 140, like: 80 });
  const refs = useRef(widths);

  const makeHandler = (
    leftKey: keyof typeof widths,
    rightKey: keyof typeof widths,
    leftMin = MIN_COL,
    rightMin = MIN_COL,
  ) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startLeft = refs.current[leftKey];
      const startRight = refs.current[rightKey];
      const total = startLeft + startRight;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const nextLeft = Math.min(Math.max(leftMin, startLeft + delta), total - rightMin);
        const nextRight = total - nextLeft;

        const newWidths = { ...refs.current, [leftKey]: nextLeft, [rightKey]: nextRight };
        refs.current = newWidths;
        setWidths(newWidths);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };
  };

  return { widths, makeHandler };
}
