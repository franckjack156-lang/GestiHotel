import React from 'react';

export const InterventionCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="ml-4">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  </div>
);

export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 w-24 bg-white/30 rounded mb-2"></div>
            <div className="h-8 w-16 bg-white/30 rounded"></div>
          </div>
          <div className="h-10 w-10 bg-white/30 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
);

export const UserCardSkeleton = () => (
  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  </div>
);

// Composant générique
export const SkeletonLoader = ({ 
  type = 'card', 
  count = 3,
  className = ''
}) => {
  const components = {
    intervention: InterventionCardSkeleton,
    stats: DashboardStatsSkeleton,
    user: UserCardSkeleton
  };

  const Component = components[type] || InterventionCardSkeleton;

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
};

export default SkeletonLoader;