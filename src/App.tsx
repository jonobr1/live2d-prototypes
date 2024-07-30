import ListView from './views/LiveView'
import DefaultLive2D from './views/DefaultLive2D';

const views = [{ name: 'Default Live2D Viewer', href: '/default-live2d' }];

/**
 * Router to handle app delegation
 */
export default function App() {
  let View = null;

  const { pathname } = window.location;

  if (pathname.includes('default-live2d')) {
    View = <DefaultLive2D />;
  } else {
    View = <ListView views={views} />;
  }
  return View;
}
