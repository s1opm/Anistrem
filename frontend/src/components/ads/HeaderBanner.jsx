import Banner728x90 from './Banner728x90.jsx';
import Banner320x50 from './Banner320x50.jsx';

export default function HeaderBanner({ className = '', style = {}, lazyLoad = false }) {
  return (
    <div className={`w-full ${className}`} style={style}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="hidden sm:block">
          <Banner728x90 lazyLoad={lazyLoad} />
        </div>
        <div className="block sm:hidden">
          <Banner320x50 lazyLoad={lazyLoad} />
        </div>
      </div>
    </div>
  );
}
