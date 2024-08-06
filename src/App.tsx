import { useEffect, useState } from 'react';
import ListView from './views/ListView';
import DefaultLive2D from './views/DefaultLive2D';

const views = [{ name: 'Default Live2D Viewer', href: '#default-live2d' }];

/**
 * Router to handle app delegation
 */
export default function App() {
  let View = null;

  const [hash, setHash] = useState<string>(window.location.hash);

  useEffect(mount, []);

  function mount() {
    window.addEventListener('hashchange', () => {
      setHash(window.location.hash);
    });
  }

  if (hash.includes('default-live2d')) {
    View = <DefaultLive2D />;
  } else {
    View = <ListView views={views} />;
  }
  return View;
}
