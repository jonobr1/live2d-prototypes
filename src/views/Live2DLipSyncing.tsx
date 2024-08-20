import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';

const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
const pcmData = new Float32Array(analyser.fftSize);

let sourceNode: MediaStreamAudioSourceNode | undefined;

export default function View(props: { model?: string; playing?: boolean }) {
  const domElement = useRef<HTMLDivElement | null>(null);
  const refs = useRef<{ model: AppModel | null, isAnalyzing: boolean }>({
    model: null,
    isAnalyzing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLipSyncing, setIsLipSyncing] = useState(false);
  const [rms, setRMS] = useState(0);

  useEffect(mount, []);
  useEffect(load, [props.model]);
  useEffect(() => {
    refs.current.isAnalyzing = isLipSyncing;
    if (isLipSyncing) {
      enable();
    } else {
      disable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLipSyncing]);

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

      model._lipsync = false;
      model.onUpdate(analyze);

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

  function toggleLipSync() {
    ctx.resume();
    setIsLipSyncing(!isLipSyncing);
  }

  function analyze() {
    if (!refs.current.isAnalyzing) {
      return;
    }

    analyser.getFloatTimeDomainData(pcmData);

    let sumSquares = 0.0;
    for (const amplitude of pcmData) {
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.pow(Math.sqrt(sumSquares / pcmData.length), 0.75);
    setRMS(rms);
    if (refs.current.model) {
      const model = refs.current.model;
      const cubismModel = model.getModel();
      for (let i = 0; i < model._lipSyncIds.getSize(); ++i) {
        const id = model._lipSyncIds.at(i);
        const index = cubismModel.getParameterIndex(id);
        const min = cubismModel.getParameterMinimumValue(index);
        const max = cubismModel.getParameterMaximumValue(index);
        cubismModel.addParameterValueById(id, (max - min) * rms + min, 0.8);
      }
    }
  }

  function enable() {
    try {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          sourceNode = ctx.createMediaStreamSource(stream);
          sourceNode.connect(analyser);
          analyze();
        })
        .catch(() => {
          alert('Unable to activate microphone on device.');
        });
    } catch (err) {
      alert('Unable to activate microphone on device.');
    }
  }

  function disable() {
    if (sourceNode) {
      sourceNode.mediaStream.getTracks().forEach((track) => track.stop());
      sourceNode.disconnect(analyser);
    }
  }

  return (
    <div className={cn(styles.view)}>
      <div ref={domElement} />
      <div className={cn(styles.ui)}>
        <button onClick={toggleLipSync}>
          {isLipSyncing ? 'Stop Lip Syncing' : 'Start Lip Syncing'}
        </button>
        <input
          type="range"
          disabled
          min="0"
          max="100"
          value={Math.round(100 * rms)}
        />
      </div>
      {isLoading && <div className={cn(styles.loading)}>Loading...</div>}
    </div>
  );
}
