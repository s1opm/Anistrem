import Banner160x600 from './Banner160x600.jsx';
import Banner160x300 from './Banner160x300.jsx';

export default function SidebarBanner({ className = '', style = {}, lazyLoad = true }) {
  return (
    <div className={`space-y-6 ${className}`} style={style}>
      <Banner160x600 lazyLoad={lazyLoad} />
      <Banner160x300 lazyLoad={lazyLoad} />
    </div>
  );
}
