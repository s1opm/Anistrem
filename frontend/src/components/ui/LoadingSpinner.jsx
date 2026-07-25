export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };
  
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
        <div className={`${sizeClasses.lg} border-primary-500 border-t-transparent rounded-full animate-spin`} />
        {text && <p className="text-dark-400 text-sm">{text}</p>}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`${sizeClasses[size]} border-primary-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-dark-400 text-sm">{text}</p>}
    </div>
  );
}