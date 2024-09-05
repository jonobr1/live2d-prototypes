import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';
import Two from 'two.js';
import { Text } from 'two.js/src/text';

export default function View() {
  const domElement = useRef<HTMLDivElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const refs = useRef<{
    model: AppModel | null;
    two: Two | null;
    text: Text[];
    shouldFadeOut: boolean;
  }>({
    model: null,
    two: null,
    text: [],
    shouldFadeOut: false,
  });
  const [responding, setResponding] = useState<boolean>(false);

  useEffect(mount, []);

  function mount() {
    let two: Two;

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

        two = refs.current.two = new Two({
          type: Two.Types.canvas,
          fullscreen: true,
          autostart: true,
        }).appendTo(domElement.current);

        two.renderer.domElement.style.pointerEvents = 'none';
        refs.current.two.bind('update', update);
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
      if (two) {
        two.unbind('update', update);
        two.release(two.scene);
      }
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (AppDefine.CanvasSize === 'auto') {
        AppDelegate.getInstance().onResize(width, height);
      }
    }

    function update() {
      if (!two) {
        return;
      }
      const children = two.scene.children.slice(0);
      if (children.length <= 0) {
        refs.current.shouldFadeOut = false;
      }
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as Text;
        if (refs.current.shouldFadeOut) {
          child.opacity -= child.opacity * 0.07;
          if (child.opacity < 0.01) {
            child.opacity = 0;
            two.release(child);
            two.scene.remove(child);
          }
        } else {
          if (child.opacity > 0.9) {
            child.opacity = 1;
          } else {
            child.opacity += (1 - child.opacity) * 0.1;
          }
        }
      }
    }
  }

  async function send() {
    if (textarea.current) {
      setResponding(true);
      const value = textarea.current.value;
      textarea.current.value = '';
      refs.current.model?.setExpression('Sweating');
      const url =
        'https://us-central1-jono-fyi.cloudfunctions.net/live2d-open-ai-chat';
      const endpoint = `${url}?prompt=${encodeURIComponent(value)}`;
      try {
        const resp = await fetch(endpoint);
        const json = await resp.json();
        const message = json.response.content;
        setTimeout(() => play(message), 2000);
        refs.current.model?.setExpression('Star');
      } catch (e) {
        console.warn('Unable to query ChatGPT', e);
        refs.current.model?.setExpression('Sigh');
        setTimeout(() => {
          refs.current.model?.clearExpressions();
        }, 2000);
      }
    }
  }

  function play(str: string) {
    const two = refs.current.two;

    if (!two) {
      return;
    }

    const words = str.split(/\s+/i);
    let x = two.width / 8;
    let y = two.height / 4;
    let timeout = 0;

    words.forEach((word, i) => {
      const text = new Two.Text(word, x, y);

      text.size = 30;
      text.family = 'Arial, san-serif';
      text.alignment = 'left';
      text.opacity = 0;

      // Calculate next x, y position for text
      x += text.getBoundingClientRect(true).width + 10;
      if (x > two.width * 0.75) {
        x = two.width / 8;
        y += 40;
      }

      const length = Math.max(Math.min(word.length, 15), 3) / 15;

      setTimeout(() => {
        two.add(text);
        refs.current.model?.setExpression(`Key${word.at(0)?.toUpperCase()}`);
        if (i >= words.length - 1) {
          setTimeout(() => {
            refs.current.shouldFadeOut = true;
            setResponding(false);
            refs.current.model?.clearExpressions();
          }, 2000);
        }
      }, timeout);

      timeout += (Math.random() * length + length) * 250;

    });

  }

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
          ref={textarea}
          className={cn('grow', 'p-4', 'border-stone-300 border')}
          placeholder="Message かおりちゃん..."
        />
        <button
          className={cn('min-w-24', 'inline-block p-4', 'bg-stone-200')}
          onClick={send}
          disabled={responding}
        >
          Send
        </button>
      </div>
    </div>
  );
}
