export function HeroSkeleton() {
  return (
    <div className="relative h-[60vh] min-h-[400px] bg-dark-950 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="h-8 rounded w-1/3" style={{ backgroundColor: '#1b0f30' }} />
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: '#1b0f30' }} />
          <div className="h-12 rounded w-32" style={{ backgroundColor: '#1b0f30' }} />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: '#1b0f30' }} />
  );
}

export function VideoCardSkeleton({ layout = 'grid' }) {
  if (layout === 'horizontal') {
    return (
      <div className="flex gap-3 p-2 animate-pulse">
        <div className="w-48 aspect-video rounded-lg shrink-0" style={{ backgroundColor: '#1b0f30' }} />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#1b0f30' }} />
          <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#1b0f30' }} />
          <div className="h-3 rounded w-1/3" style={{ backgroundColor: '#1b0f30' }} />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl overflow-hidden animate-pulse border border-white/5">
      <div className="aspect-video" style={{ backgroundColor: '#1b0f30' }} />
      <div className="p-3 space-y-2 bg-dark-950">
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#1b0f30' }} />
        <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#1b0f30' }} />
        <div className="h-3 rounded w-1/3" style={{ backgroundColor: '#1b0f30' }} />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-dark-950 animate-pulse">
      <div className="relative h-[40vh] min-h-[300px]" style={{ backgroundColor: '#1b0f30' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="h-8 rounded w-1/3" style={{ backgroundColor: '#1b0f30' }} />
            <div className="h-4 rounded w-1/2" style={{ backgroundColor: '#1b0f30' }} />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-white/5" style={{ backgroundColor: '#1b0f30' }}>
              <div className="aspect-video" style={{ backgroundColor: '#1b0f30' }} />
              <div className="p-3 space-y-2 bg-dark-950">
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#1b0f30' }} />
                <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#1b0f30' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 8, layout = 'grid' }) {
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} layout={layout} />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-40 aspect-video rounded-lg shrink-0" style={{ backgroundColor: '#1b0f30' }} />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 rounded w-full" style={{ backgroundColor: '#1b0f30' }} />
            <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#1b0f30' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: '#1b0f30' }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      <div className="h-10 rounded" style={{ backgroundColor: '#1b0f30' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 rounded flex-1" style={{ backgroundColor: '#1b0f30' }} />
          ))}
        </div>
      ))}
    </div>
  );
}
