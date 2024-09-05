import { useEffect, useRef } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';

export default function View() {
  const domElement = useRef<HTMLDivElement | null>(null);
  const refs = useRef<{ model: AppModel | null }>({ model: null });

  useEffect(mount, []);

  function mount() {
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

      // 12: "ModeB_panel3"
      // 13: "ModeB_arms2"
      // 53: "arms"
      // 45: "functionkey"
      const cubismModel = model.getModel();

      cubismModel.setPartOpacityByIndex(12, 0);
      cubismModel.setPartOpacityByIndex(13, 0);
      cubismModel.setPartOpacityByIndex(53, 0);
      cubismModel.setPartOpacityByIndex(45, 0);

      // 116: "ParamKeyboardPosition"
      cubismModel.loadParameters();
      cubismModel.setParameterValueByIndex(116, 1);
      cubismModel.saveParameters();

      refs.current.model = model;
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

  function send() {}

  return (
    <div>
      <div ref={domElement} className={styles.view} />
      <div
        className={cn(
          'fixed bottom-4 left-4 right-4',
          'flex flex-nowrap flex-row',
          'items-center gap-4',
          'max-w-[800px] mx-auto'
        )}
      >
        <textarea
          className={cn('grow', 'p-4', 'border-stone-300 border')}
          placeholder="Message AI..."
        />
        <button
          className={cn('min-w-24', 'inline-block p-4', 'bg-stone-200')}
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}
