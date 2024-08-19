import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';

export default function View(props: { model?: string; playing?: boolean }) {
  const domElement = useRef<HTMLDivElement | null>(null);
  const refs = useRef<{ model: AppModel | null }>({ model: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(mount, []);
  useEffect(load, [props.model]);

  function mount() {
    AppDefine.setModelDir('Haru');
    if (!document.head.querySelector('#live2dcubism')) {
      const script = document.createElement('script');
      script.id = 'live2dcubism';
      script.onload = () => requestAnimationFrame(setup);
      script.src = Live2DCubismCore;
      document.head.appendChild(script);
    } else {
      setup();
    }

    return unmount;

    async function setup() {
      if (
        !AppGLManager.getInstance() ||
        !AppDelegate.getInstance().initialize()
      ) {
        return;
      }

      window.addEventListener('resize', resize);

      if (AppGLManager.canvas && domElement.current) {
        domElement.current.appendChild(AppGLManager.canvas);
      }

      AppDelegate.getInstance().run();
      const manager = AppLive2DManager.getInstance();
      const model = manager.getModel(0);

      // Model is loaded
      await ready(model);

      refs.current.model = model;
      setIsLoading(false);
    }

    async function ready(model: AppModel) {
      if (!!model.getModel() && model._state === LoadStep.CompleteSetup) {
        return true;
      } else {
        await sleep(100);
        return ready(model);
      }
    }

    function sleep(millis: number) {
      return new Promise((resolve) => setTimeout(resolve, millis));
    }

    function unmount() {
      window.removeEventListener('resize', resize);
      AppDelegate.releaseInstance();
      AppLive2DManager.releaseInstance();
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (AppDefine.CanvasSize === 'auto') {
        AppDelegate.getInstance().onResize(width, height);
      }
    }
  }

  function load() {
    // TODO: Load Live2D Cubism Model
  }

  return (
    <div className={cn(styles.view)}>
      <div ref={domElement} />
      <div className={cn(styles.ui)}>
      </div>
      {isLoading && <div className={cn(styles.loading)}>Loading...</div>}
    </div>
  );
}
