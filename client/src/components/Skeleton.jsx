import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`bg-white/10 animate-pulse rounded-lg ${className}`} />
);

export const MovieCardSkeleton = () => (
  <div className="w-64 flex-shrink-0 glass-card p-4 space-y-4">
    <Skeleton className="aspect-[2/3] w-full" />
    <Skeleton className="h-6 w-3/4" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

export const HomeSkeleton = () => (
  <div className="pt-24 space-y-12 container mx-auto px-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="space-y-6">
        <Skeleton className="h-8 w-48 ml-4" />
        <div className="flex gap-6 overflow-x-hidden">
          {[1, 2, 3, 4, 5].map(j => (
            <MovieCardSkeleton key={j} />
          ))}
        </div>
      </div>
    ))}
  </div>
);
