export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div className="w-[40%] h-64 rounded-xl bg-white/5 animate-pulse" />
        <div className="w-[60%] space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-md bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
