import React from 'react';

const Skeleton = ({
  variant = 'text', // text, circle, rect
  width = 'w-full',
  height = 'h-4',
  className = ''
}) => {
  const baseClass = 'animate-shimmer rounded bg-slate-200 dark:bg-slate-800';
  
  const variants = {
    text: 'h-3 rounded',
    circle: 'rounded-full',
    rect: 'rounded-xl'
  };

  const style = {
    width: width.startsWith('w-') ? undefined : width,
    height: height.startsWith('h-') ? undefined : height
  };

  const customClasses = `${width.startsWith('w-') ? width : ''} ${height.startsWith('h-') ? height : ''}`;

  return (
    <div
      className={`${baseClass} ${variants[variant]} ${customClasses} ${className}`}
      style={style}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton width="w-48" height="h-8" />
        <Skeleton width="w-32" height="h-4" />
      </div>
      <Skeleton width="w-24" height="h-10" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      <Skeleton variant="rect" height="h-28" />
      <Skeleton variant="rect" height="h-28" />
      <Skeleton variant="rect" height="h-28" />
      <Skeleton variant="rect" height="h-28" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton variant="rect" className="col-span-2" height="h-80" />
      <Skeleton variant="rect" height="h-80" />
    </div>
  </div>
);

export default Skeleton;
