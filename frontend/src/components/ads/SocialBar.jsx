import { useSocialBarInit } from './AdManager.jsx';

const SOCIAL_BAR_SRC = '';

export default function SocialBar({ className = '' }) {
  useSocialBarInit(SOCIAL_BAR_SRC);

  return (
    <div className={`social-bar-container ${className}`} id="social-bar-ad">
    </div>
  );
}
