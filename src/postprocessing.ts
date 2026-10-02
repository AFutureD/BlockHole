import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  NeutralToneMapping,
  Vector2,
  type Camera,
  type Scene,
  type ToneMapping,
  type WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { Params, ToneMappingName } from './params'

const TONE_MAPPINGS: Record<ToneMappingName, ToneMapping> = {
  ACES: ACESFilmicToneMapping,
  AgX: AgXToneMapping,
  Neutral: NeutralToneMapping,
}

export interface PostProcessing {
  composer: EffectComposer
  applyParams(p: Params): void
}

// RenderPass → UnrealBloomPass → OutputPass。
// EffectComposer 的缓冲默认是 HalfFloat；色调映射和 sRGB 转换由 OutputPass 完成。
export function createPostProcessing(renderer: WebGLRenderer, scene: Scene, camera: Camera): PostProcessing {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 1, 0.5, 1)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  return {
    composer,
    applyParams(p) {
      bloom.enabled = p.bloom
      bloom.strength = p.bloomStrength
      bloom.radius = p.bloomRadius
      bloom.threshold = p.bloomThreshold
      renderer.toneMapping = TONE_MAPPINGS[p.toneMapping]
      renderer.toneMappingExposure = p.exposure
    },
  }
}
