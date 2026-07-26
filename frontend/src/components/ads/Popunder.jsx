import { usePopunderInit } from './AdManager.jsx';

const POPUNDER_SRC = '';

export default function Popunder() {
  usePopunderInit(POPUNDER_SRC);
  return null;
}
