import { useEffect, useState } from 'react';
import ListView from './views/ListView';
import DefaultLive2D from './views/DefaultLive2D';

const views = [
  {
    name: 'Default Live2D Viewer',
    href: '#default-live2d',
    View: DefaultLive2D,
  },
];

/**
 * Router to handle app delegation
 */
export default function App() {
  const [hash, setHash] = useState<string>(window.location.hash);

  useEffect(mount, []);

  function mount() {
    window.addEventListener('hashchange', () => {
      setHash(window.location.hash);
    });
  }

  for (const vid in views) {
    const { href, View } = views[vid];
    if (hash.includes(href)) {
      return <View />;
    }
  }

  return <ListView views={views} />;
}
