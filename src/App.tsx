import { useEffect, useState } from 'react';
import ListView from './views/ListView';

import DefaultLive2D from './views/DefaultLive2D';
import Live2DTextures from './views/Live2DTextures';
import Live2DExpressions from './views/Live2DExpressions';
import Live2DLipSyncing from './views/Live2DLipSyncing';

const views = [
  {
    name: 'Default Live2D Viewer',
    href: '#default-live2d',
    View: DefaultLive2D,
  },
  {
    name: 'Live2D Change Textures',
    href: '#live2d-textures',
    View: Live2DTextures,
  },
  {
    name: 'Live2D Change Expressions',
    href: '#live2d-expressions',
    View: Live2DExpressions,
  },
  {
    name: 'Live 2D Lip Syncing',
    href: '#live2d-lipsyncing',
    View: Live2DLipSyncing,
  }
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
