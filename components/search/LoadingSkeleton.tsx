export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div className="h-64 w-[40%] animate-pulse rounded-xl bg-white/5" />
        <div className="w-[60%] space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
