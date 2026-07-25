import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-8xl sm:text-9xl font-display font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-dark-400 text-lg mb-10 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 gradient-bg text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 active:scale-95"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
