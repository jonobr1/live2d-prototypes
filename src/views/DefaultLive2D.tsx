'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(mount, []);
  useEffect(load, [props.model]);

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
      window.addEventListener('keypress', keypress);

      if (AppGLManager.canvas && domElement.current) {
        domElement.current.appendChild(AppGLManager.canvas);
      }

      AppDelegate.getInstance().run();
      const manager = AppLive2DManager.getInstance();
      const model = manager.getModel(0);

      await ready(model);

      // 12: "ModeB_panel3"
      // 13: "ModeB_arms2"
      // 53: "arms"
      const cubismModel = model.getModel();

      cubismModel.setPartOpacityByIndex(12, 0);
      cubismModel.setPartOpacityByIndex(13, 0);
      cubismModel.setPartOpacityByIndex(53, 0);

      // 116: "ParamKeyboardPosition"
      cubismModel.setParameterValueByIndex(116, 0.5);

      refs.current.model = model;
    }

    async function ready(model: AppModel) {
      if (model._state === LoadStep.CompleteSetup) {
        return true;
      } else {
        await sleep(100);
        ready(model);
      }
    }

    function sleep(millis: number) {
      return new Promise((resolve) => setTimeout(resolve, millis));
    }

    function keypress(e: KeyboardEvent) {
      if (!refs.current.model) {
        return;
      }

      const id = `Param${e.key.toUpperCase()}`;
      const { ids } = refs.current.model.getModel().getModel().parameters;
      const index = ids.indexOf(id);

      if (index > 0) {
        const value = refs.current.model.getModel().getParameterMaximumValue(index);
        refs.current.model.getModel().setParameterValueByIndex(index, value);
      }
    }

    function unmount() {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keypress', keypress);
      AppDelegate.releaseInstance();
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
