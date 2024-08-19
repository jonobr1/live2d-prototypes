import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';

import { AppDelegate } from '../components/Live2D/AppDelegate';
import * as AppDefine from '../components/Live2D/AppDefine';
import { AppGLManager } from '../components/Live2D/AppGLManager';
import { AppModel, LoadStep } from '../components/Live2D/AppModel';
import Live2DCubismCore from '@live2d/core/live2dcubismcore.js?url';

import styles from './DefaultLive2D.module.css';
import { AppLive2DManager } from '../components/Live2D/AppLive2DManager';

let PACK: number = 0;
const PACKS = [
  [
    'Type-H1.4096/Default/texture_00.png',
    'Type-H1.4096/Default/texture_01.png',
    'Type-H1.4096/Default/texture_02.png',
  ],
  [
    'Type-H1.4096/Preset0x/texture_00.png',
    'Type-H1.4096/Preset0x/texture_01.png',
    'Type-H1.4096/Preset0x/texture_02.png',
  ],
  [
    'Type-H1.4096/Preset1/texture_00.png',
    'Type-H1.4096/Preset1/texture_01.png',
    'Type-H1.4096/Preset1/texture_02.png',
  ],
  [
    'Type-H1.4096/Preset2/texture_00.png',
    'Type-H1.4096/Preset2/texture_01.png',
    'Type-H1.4096/Preset2/texture_02.png',
  ],
  [
    'Type-H1.4096/Preset3/texture_00.png',
    'Type-H1.4096/Preset3/texture_01.png',
    'Type-H1.4096/Preset3/texture_02.png',
  ],
  [
    'Type-H1.4096/Preset4/texture_00.png',
    'Type-H1.4096/Preset4/texture_01.png',
    'Type-H1.4096/Preset4/texture_02.png',
  ],
];

let PRESET = 0;
const PRESETS = ['Preset0x', 'Preset1', 'Preset2', 'Preset3', 'Preset4'];

export default function View(props: { model?: string; playing?: boolean }) {
  const domElement = useRef<HTMLDivElement | null>(null);
  const refs = useRef<{ model: AppModel | null }>({ model: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(mount, []);
  useEffect(load, [props.model]);

  function mount() {
    AppDefine.setModelDir('Type-H1');
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

    function keypress(e: KeyboardEvent) {
      if (!refs.current.model) {
        return;
      }

      // TODO: For some reason this is really slow
      const id = `Key${e.key.toUpperCase()}`;
      refs.current.model.setExpression(id);
    }

    function unmount() {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keypress', keypress);
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

  function change() {
    if (!refs.current.model) {
      return;
    }
    setIsLoading(true);
    // Swap out components with new textures
    const textureManager = AppDelegate.getInstance().getTextureManager();
    textureManager?.releaseTextures();
    PACK = (PACK + 1) % PACKS.length;
    refs.current.model
      .swapTextures(PACKS[PACK])
      .then(() => setIsLoading(false));

    const cubismModel = refs.current.model.getModel();
    cubismModel.loadParameters();
    // Params to mix up
    [
      ['ParamHairAhoge', 8],
      ['ParamHairAhogeAngle', 9],
      ['ParamHairAhogeSize', 10],
      // [['ParamHairFrontSideR', 11], ['ParamHairFrontSideL', 12 ]],
      // [['ParamHairFrontSideClipR', 13], ['ParamHairFrontSideClipL', 14 ]],
      // [['ParamHairFrontSideBranchR', 15], ['ParamHairFrontSideBranchL', 16 ]],
      // [['ParamHairFrontSideLengthR', 17], ['ParamHairFrontSideLengthL', 18 ]],
      // [['ParamHairPonytailR', 19], ['ParamHairPonytailL', 20 ]],
      // [['ParamHairPonytailLengthR', 21], ['ParamHairPonytailLengthL', 22 ]],
      ['ParamHairSide', 23],
      ['ParamHairSideBranch', 24],
      ['ParamHairSideLength', 25],
      ['ParamHairBack', 26],
      ['ParamHairBackLength', 27],
      ['ParamBrow', 28],
      ['ParamBrowAngle', 29],
      ['ParamThickness', 30],
      ['ParamEyeSize', 31],
      ['ParamEyelash', 32],
      ['ParamPupilPattern', 33],

      ['ParamCatEars', 36],
      ['ParamBearEars', 37],
      ['ParamBunnyrEars', 38],
      ['ParamAnimalEarsShape', 39],
      // [['ParamAnimalEarPositionR', 40], ['ParamAnimalEarPositionL', 41 ]],
      ['ParamHorn', 42],
      // [['ParamHornLengthR', 43], ['ParamHornLengthL', 44 ]],
      // [['ParamHornSizeR', 45], ['ParamHornSizeL', 46 ]],

      ['ParamNeck', 47],
      ['ParamTop', 48],
      ['ParamTie', 49],
      ['ParamCoat', 50],
      ['ParamCoatPin', 51],
      ['ParamCoatNametag', 52],
      ['ParamBottom', 53],
      ['ParamLegAcc_L', 54],
      ['ParamLegAcc_R', 55],
      ['ParamSock_L', 56],
      ['ParamSock_R', 57],
      ['ParamShoes', 58],
      ['ParamWings', 59],
      ['ParamWingSize', 60],
      // ['ParamTail', 61],
      // ['ParamTailAngle', 62],
      // ['ParamTailSize', 63],
    ].forEach((param) => {
      const index = parseInt(`${param[1]}`);
      const min = cubismModel.getParameterMinimumValue(index);
      const max = cubismModel.getParameterMaximumValue(index);
      let value = Math.random() * (max - min) + min;
      // Hack: Hide or show opacity based values
      if (min === 0 && max === 1) {
        value = Math.round(value);
      }
      cubismModel.setParameterValueByIndex(index, value);
    });
    cubismModel.saveParameters();
  }

  function nextPreset() {
    if (refs.current.model) {
      refs.current.model?.setExpression(PRESETS[PRESET]);
      PRESET = (PRESET + 1) % PRESETS.length;
    }
  }

  function express(id: string) {
    refs.current.model?.setExpression(id);
  }

  return (
    <div className={cn(styles.view)}>
      <div ref={domElement} />
      <div className={cn(styles.ui)}>
        <button onClick={change}>Change Skin</button>
        <button onClick={nextPreset}>Next Expression Preset</button>
        <button onClick={() => express('EyeDizzy')}>Dizzy</button>
        <button onClick={() => express('EyeDollar')}>Dollar</button>
        <button onClick={() => express('EyeTear')}>Tear</button>
        <button onClick={() => express('EyeHeart')}>Heart</button>
        <button onClick={() => express('EyeOO')}>OO</button>
        <button onClick={() => express('Glasses')}>Glasses</button>

        <button onClick={() => express('Question')}>Question</button>
        <button onClick={() => express('Sigh')}>Sigh</button>
        <button onClick={() => express('Star')}>Star</button>
        <button onClick={() => express('Sweating')}>Sweat</button>
        <span>Responds to keyboard events</span>
      </div>
      {isLoading && <div className={cn(styles.loading)}>Loading...</div>}
    </div>
  );
}
