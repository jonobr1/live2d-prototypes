import { lazy, Suspense, useEffect, useState } from 'react';
import ListView from './views/ListView';

const DefaultLive2D = lazy(() =>
  import('./views/DefaultLive2D').then((module) => ({
    default: module.default,
  }))
);
const Live2DTextures = lazy(() =>
  import('./views/Live2DTextures').then((module) => ({
    default: module.default,
  }))
);
const Live2DExpressions = lazy(() =>
  import('./views/Live2DExpressions').then((module) => ({
    default: module.default,
  }))
);
const Live2DLipSyncing = lazy(() =>
  import('./views/DefaultLive2D').then((module) => ({
    default: module.default,
  }))
);
const TwoCharacters = lazy(() =>
  import('./views/TwoCharacters').then((module) => ({
    default: module.default,
  }))
);

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
  },
  {
    name: '2 Models',
    href: '#live2d-2-characters',
    View: TwoCharacters,
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
      return (
        <Suspense>
          <View />
        </Suspense>
      );
    }
  }

  return <ListView views={views} />;
}
