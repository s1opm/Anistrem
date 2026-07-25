export default function AdSlot({ position = 'sidebar', className = '' }) {
  const sizes = {
    header: 'min-h-[90px] max-w-7xl mx-auto',
    sidebar: 'min-h-[250px] w-full max-w-[300px]',
    betweenVideos: 'min-h-[100px] w-full',
    belowPlayer: 'min-h-[100px] w-full',
    footer: 'min-h-[90px] max-w-7xl mx-auto',
  };

  return (
    <div className={`${sizes[position] || sizes.sidebar} ${className}`}>
      <div className="h-full bg-dark-800/30 border border-dashed border-dark-600/50 rounded-xl flex items-center justify-center text-dark-500 text-xs uppercase tracking-wider">
        Ad Slot ({position})
      </div>
    </div>
  );
}