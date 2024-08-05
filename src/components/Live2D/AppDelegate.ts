/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismFramework, Option } from '@live2d/framework/live2dcubismframework';

import * as AppDefine from './AppDefine';
import { AppLive2DManager } from './AppLive2DManager';
import { AppPal } from './AppPal';
import { AppTextureManager } from './AppTextureManager';
import { AppView } from './AppView';
import { canvas, gl } from './AppGLManager';

export let s_instance: AppDelegate | null = null;
export let frameBuffer: WebGLFramebuffer | null = null;

/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */
export class AppDelegate {
  /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
  public static getInstance(): AppDelegate {
    if (s_instance == null) {
      s_instance = new AppDelegate();
    }

    return s_instance;
  }

  /**
   * クラスのインスタンス（シングルトン）を解放する。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * APPに必要な物を初期化する。
   */
  public initialize(): boolean {
    // キャンバスを DOM に追加
    document.body.appendChild(canvas);

    if (AppDefine.CanvasSize === 'auto') {
      this._resizeCanvas(window.innerWidth, window.innerHeight);
    } else {
      canvas.width = AppDefine.CanvasSize.width;
      canvas.height = AppDefine.CanvasSize.height;
    }

    if (gl === null) {
      return false;
    }

    if (!frameBuffer) {
      frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    }

    // 透過設定
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const supportTouch: boolean = 'ontouchend' in canvas;

    if (supportTouch) {
      // タッチ関連コールバック関数登録
      canvas.addEventListener('touchstart', onTouchBegan, { passive: true });
      canvas.addEventListener('touchmove', onTouchMoved, { passive: true });
      canvas.addEventListener('touchend', onTouchEnded, { passive: true });
      canvas.addEventListener('touchcancel', onTouchCancel, { passive: true });
    } else {
      // マウス関連コールバック関数登録
      canvas.addEventListener('mousedown', onClickBegan, { passive: true });
      canvas.addEventListener('mousemove', onMouseMoved, { passive: true });
      canvas.addEventListener('mouseup', onClickEnded, { passive: true });
    }

    // AppViewの初期化
    this._view?.initialize();

    // Cubism SDKの初期化
    this.initializeCubism();

    return true;
  }

  /**
   * Resize canvas and re-initialize view.
   */
  public onResize(width: number, height: number): void {
    this._resizeCanvas(width, height);
    this._view?.initialize();
    // this._view?.initializeSprite();
  }

  /**
   * 解放する。
   */
  public release(): void {
    this._textureManager?.release();
    this._textureManager = null;

    this._view?.release();
    this._view = null;

    // リソースを解放
    AppLive2DManager.releaseInstance();

    // Cubism SDKの解放
    CubismFramework.dispose();
  }

  /**
   * 実行処理。
   */
  public run(): void {
    // メインループ
    const loop = (): void => {
      // インスタンスの有無の確認
      if (s_instance == null || gl === null) {
        return;
      }

      // 時間更新
      AppPal.updateTime();

      // 画面の初期化
      gl.clearColor(0.0, 0.0, 0.0, 0);

      // 深度テストを有効化
      gl.enable(gl.DEPTH_TEST);

      // 近くにある物体は、遠くにある物体を覆い隠す
      gl.depthFunc(gl.LEQUAL);

      // カラーバッファや深度バッファをクリアする
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.clearDepth(1.0);

      // 透過設定
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // 描画更新
      if (this._view) {
        this._view.render();
      }

      // ループのために再帰呼び出し
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * シェーダーを登録する。
   */
  public createShader(): WebGLProgram | null{

    if (gl === null) {
      return null;
    }

    // バーテックスシェーダーのコンパイル
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      AppPal.printMessage('failed to create vertexShader');
      return null;
    }

    const vertexShader: string =
      'precision mediump float;' +
      'attribute vec3 position;' +
      'attribute vec2 uv;' +
      'varying vec2 vuv;' +
      'void main(void)' +
      '{' +
      '   gl_Position = vec4(position, 1.0);' +
      '   vuv = uv;' +
      '}';

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);

    // フラグメントシェーダのコンパイル
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      AppPal.printMessage('failed to create fragmentShader');
      return null;
    }

    const fragmentShader: string =
      'precision mediump float;' +
      'varying vec2 vuv;' +
      'uniform sampler2D texture;' +
      'void main(void)' +
      '{' +
      '   gl_FragColor = texture2D(texture, vuv);' +
      '}';

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);

    // プログラムオブジェクトの作成
    const programId = gl.createProgram();
    if (programId === null) {
      AppPal.printMessage('failed to create WebGL program');
      return null;
    }

    gl.attachShader(programId, vertexShaderId);
    gl.attachShader(programId, fragmentShaderId);

    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);

    // リンク
    gl.linkProgram(programId);

    gl.useProgram(programId);

    return programId;
  }

  /**
   * View情報を取得する。
   */
  public getView(): AppView | null {
    return this._view;
  }

  public getTextureManager(): AppTextureManager | null {
    return this._textureManager;
  }

  /**
   * コンストラクタ
   */
  constructor() {
    this._captured = false;
    this._mouseX = 0.0;
    this._mouseY = 0.0;
    this._isEnd = false;

    this._cubismOption = new Option();
    this._view = new AppView();
    this._textureManager = new AppTextureManager();
  }

  /**
   * Cubism SDKの初期化
   */
  public initializeCubism(): void {
    // setup cubism
    this._cubismOption.logFunction = AppPal.printMessage;
    this._cubismOption.loggingLevel = AppDefine.CubismLoggingLevel;
    CubismFramework.startUp(this._cubismOption);

    // initialize cubism
    CubismFramework.initialize();

    // load model
    AppLive2DManager.getInstance();

    AppPal.updateTime();

    // this._view?.initializeSprite();
  }

  /**
   * Resize the canvas to fill the screen.
   */
  private _resizeCanvas(width: number, height: number): void {
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gl?.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  _cubismOption: Option; // Cubism SDK Option
  _view: AppView | null; // View情報
  _captured: boolean; // クリックしているか
  _mouseX: number; // マウスX座標
  _mouseY: number; // マウスY座標
  _isEnd: boolean; // APP終了しているか
  _textureManager: AppTextureManager | null; // テクスチャマネージャー
}

/**
 * クリックしたときに呼ばれる。
 */
function onClickBegan(e: MouseEvent): void {
  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }
  AppDelegate.getInstance()._captured = true;

  const posX: number = e.pageX;
  const posY: number = e.pageY;

  AppDelegate.getInstance()._view?.onTouchesBegan(posX, posY);
}

/**
 * マウスポインタが動いたら呼ばれる。
 */
function onMouseMoved(e: MouseEvent): void {
  if (!AppDelegate.getInstance()._captured) {
    return;
  }

  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  AppDelegate.getInstance()._view?.onTouchesMoved(posX, posY);
}

/**
 * クリックが終了したら呼ばれる。
 */
function onClickEnded(e: MouseEvent): void {
  AppDelegate.getInstance()._captured = false;
  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();
  const posX: number = e.clientX - rect.left;
  const posY: number = e.clientY - rect.top;

  AppDelegate.getInstance()._view?.onTouchesEnded(posX, posY);
}

/**
 * タッチしたときに呼ばれる。
 */
function onTouchBegan(e: TouchEvent): void {
  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  AppDelegate.getInstance()._captured = true;

  const posX = e.changedTouches[0].pageX;
  const posY = e.changedTouches[0].pageY;

  AppDelegate.getInstance()._view?.onTouchesBegan(posX, posY);
}

/**
 * スワイプすると呼ばれる。
 */
function onTouchMoved(e: TouchEvent): void {
  if (!AppDelegate.getInstance()._captured) {
    return;
  }

  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  AppDelegate.getInstance()._view?.onTouchesMoved(posX, posY);
}

/**
 * タッチが終了したら呼ばれる。
 */
function onTouchEnded(e: TouchEvent): void {
  AppDelegate.getInstance()._captured = false;

  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  AppDelegate.getInstance()._view?.onTouchesEnded(posX, posY);
}

/**
 * タッチがキャンセルされると呼ばれる。
 */
function onTouchCancel(e: TouchEvent): void {
  AppDelegate.getInstance()._captured = false;

  if (!AppDelegate.getInstance()._view) {
    AppPal.printMessage('view notfound');
    return;
  }

  const rect = (e.target as Element).getBoundingClientRect();

  const posX = e.changedTouches[0].clientX - rect.left;
  const posY = e.changedTouches[0].clientY - rect.top;

  AppDelegate.getInstance()._view?.onTouchesEnded(posX, posY);
}
