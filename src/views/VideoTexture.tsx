import { useEffect, useRef } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';

export default function View(props: { model?: string; playing?: boolean }) {
  const domElement = useRef<HTMLDivElement | null>(null);

  useEffect(mount, []);
  useEffect(load, [props.model]);

  function mount() {
    AppDefine.setModelDir('Decky_live2D_Model_Sitting-v1');
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

      await ready(model);

      console.log(model);
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
      // N.B: It's a singleton, so don't need to
      // dealloc everything.
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

  return <div className={cn(styles.view)} ref={domElement} />;
}
