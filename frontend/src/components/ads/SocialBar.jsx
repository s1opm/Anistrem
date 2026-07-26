import { useScriptOnce } from './AdManager.jsx';

export default function SocialBar({ className = '' }) {
  useScriptOnce('social-bar', 'https://pl30537909.effectivecpmnetwork.com/73/b3/48/73b348d9ffc81b642c75164c25296ad8.js');
  return <div className={className} />;
}
