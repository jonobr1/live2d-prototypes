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
import { Group, Tween, Easing } from '@tweenjs/tween.js';
import { MuteIcon, UnmuteIcon } from '@primer/octicons-react';

const VoiceParams = {
  ParamVoiceA: 239,
  ParamVoiceE: 240,
  ParamVoiceI: 241,
  ParamVoiceO: 242,
  ParamVoiceU: 243,
  ParamVoiceSilence: 244,
};

export default function View() {
  const domElement = useRef<HTMLDivElement | null>(null);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const refs = useRef<{
    model: AppModel | null;
    two: Two | null;
    text: Text[];
    shouldFadeOut: boolean;
    timeline: Group | null;
    audio: AudioContext | null;
    gain?: GainNode;
  }>({
    model: null,
    two: null,
    text: [],
    shouldFadeOut: false,
    timeline: new Group(),
    audio: new AudioContext(),
  });
  const [responding, setResponding] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(mount, []);

  function mount() {
    let two: Two;

    if (refs.current.audio) {
      refs.current.gain = refs.current.audio.createGain();
      refs.current.gain.gain.value = 0;
      refs.current.gain.connect(refs.current.audio.destination);
    }

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
      // 14: "ModeB_panel"
      // 15: "ModeB_arms"
      const cubismModel = model.getModel();

      cubismModel.setPartOpacityByIndex(12, 0);
      cubismModel.setPartOpacityByIndex(13, 0);
      cubismModel.setPartOpacityByIndex(14, 0);
      cubismModel.setPartOpacityByIndex(15, 0);

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
      refs.current.timeline?.update();
      if (refs.current.shouldFadeOut) {
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
          }
        }
      }
    }
  }

  async function send() {
    if (refs.current.audio && refs.current.audio.state === 'suspended') {
      setMuted((wasMuted) => {
        if (!wasMuted) {
          refs.current.audio?.resume();
        }
        return false;
      });
    }
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
    const { two, model, audio, gain } = refs.current;

    if (!two || !model || !audio || !gain) {
      return;
    }

    const cubismModel = model.getModel();
    const words = str.split(/\s+/i);

    let x = two.width / 8;
    let y = two.height / 4;
    let timeout = 0;

    gain.gain.value = 0;

    const osc = audio.createOscillator();
    osc.type = 'sine';
    osc.connect(gain);
    osc.start();

    words.forEach((word, i) => {
      const oy = y + 10;
      const ty = y;
      const text = new Two.Text(word, x, oy);

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
      const duration = (Math.random() * length + length) * 250;

      const lips: { tween: null | Tween; value: number } = {
        tween: null,
        value: 0,
      };

      const hasVowels = word.match(/[aeiou]/i);
      const vowel = (
        hasVowels === null
          ? 'ParamVoiceSilence'
          : `ParamVoice${hasVowels[0].toLocaleUpperCase()}`
      ) as keyof typeof VoiceParams;

      const index = VoiceParams[vowel];
      const defaultValue = cubismModel.getParameterDefaultValue(index);
      const min = cubismModel.getParameterMinimumValue(index);
      const max = cubismModel.getParameterMaximumValue(index) * 0.5;

      if (osc && refs.current.audio) {
        const now = refs.current.audio.currentTime;
        osc.frequency.setValueAtTime(
          Math.random() * 1000 + 250,
          now + timeout / 1000
        );
        gain.gain.setValueAtTime(0.2, now + timeout / 1000);
        gain.gain.linearRampToValueAtTime(
          0,
          now + Math.min(0.1, duration / 1000) + timeout / 1000
        );
      }

      lips.tween = new Tween(lips)
        .to({ value: 1 }, Math.min(350, duration))
        .easing(Easing.Sinusoidal.InOut)
        .onUpdate(() => {
          const v = Math.sin(lips.value * Math.PI) * (max - min) + min;
          cubismModel.loadParameters();
          cubismModel.setParameterValueByIndex(index, v);
          cubismModel.saveParameters();
        })
        .onComplete(() => {
          cubismModel.loadParameters();
          cubismModel.setParameterValueByIndex(index, defaultValue);
          cubismModel.saveParameters();
        })
        .delay(timeout)
        .start();

      const tween = new Tween(text)
        .to({ opacity: 1 }, 200)
        .easing(Easing.Elastic.Out)
        .onUpdate(() => {
          text.position.y = text.opacity * (ty - oy) + oy;
        })
        .delay(timeout)
        .start();

      refs.current.timeline?.add(tween, lips.tween);
      two.add(text);

      if (i === words.length - 1) {
        tween.onComplete(() => {
          setTimeout(() => {
            Object.values(VoiceParams).forEach((index) => {
              const value = cubismModel.getParameterDefaultValue(index);
              cubismModel.loadParameters();
              cubismModel.setParameterValueByIndex(index, value);
              cubismModel.saveParameters();
            });
            osc?.stop();
            refs.current.shouldFadeOut = true;
            setResponding(false);
            refs.current.model?.clearExpressions();
          }, 2000);
        });
      }

      timeout += duration;
      if (/[?!.]/gi.test(word)) {
        timeout += Math.random() * 500 + 500;
      }
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
        <button
          className={cn('inline-block p-4', 'bg-stone-200')}
          onClick={() => {
            setMuted((wasMuted) => {
              if (wasMuted) {
                if (
                  refs.current.audio &&
                  refs.current.audio.state === 'suspended'
                ) {
                  refs.current.audio.resume();
                }
              }
              return !wasMuted;
            });
          }}
        >
          {muted ? <MuteIcon size={20} /> : <UnmuteIcon size={20} />}
        </button>
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
