import { lazy, Suspense, useEffect, useState } from 'react';
import ListView from './views/ListView';

const DefaultLive2D = lazy(() => import('./views/DefaultLive2D'));
const Live2DTextures = lazy(() => import('./views/Live2DTextures'));
const Live2DExpressions = lazy(() => import('./views/Live2DExpressions'));
const Live2DLipSyncing = lazy(() => import('./views/DefaultLive2D'));
const TwoCharacters = lazy(() => import('./views/TwoCharacters'));
const AIChat = lazy(() => import('./views/AIChat'));

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
  {
    name: 'AI Chatbot',
    href: '#ai-chatbot',
    View: AIChat,
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
