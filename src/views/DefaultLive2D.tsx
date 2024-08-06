'use client';

import { useEffect, useRef } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';

export default function View(props: { model?: string; playing?: boolean }) {
  const domElement = useRef<HTMLDivElement | null>(null);

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

    function setup() {
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
    }

    function unmount() {
      // N.B: It's a singleton, so don't need to
      // dealloc everything.
      // AppDelegate.releaseInstance();
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
