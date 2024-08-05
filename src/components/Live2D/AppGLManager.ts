/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

export let canvas: HTMLCanvasElement = document.createElement('canvas');
export let gl: WebGL2RenderingContext | null = canvas.getContext('webgl2');
export let s_instance: AppGLManager | null = null;

/**
 * Cubism SDKのサンプルで使用するWebGLを管理するクラス
 */
export class AppGLManager {
  /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
  public static getInstance(): AppGLManager {
    if (s_instance == null) {
      s_instance = new AppGLManager();
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

  constructor() {
    // キャンバスの作成
    canvas = document.createElement('canvas');

    // glコンテキストを初期化
    gl = canvas.getContext('webgl2');

    if (!gl) {
      // gl初期化失敗
      alert('Cannot initialize WebGL. This browser does not support.');
      gl = null;

      document.body.innerHTML =
        'This browser does not support the <code>&lt;canvas&gt;</code> element.';
    }
  }

  /**
   * 解放する。
   */
  public release(): void {}

  public static get canvas(): HTMLCanvasElement {
    return canvas;
  }

  public static get gl(): WebGL2RenderingContext | null {
    return gl;
  }

}