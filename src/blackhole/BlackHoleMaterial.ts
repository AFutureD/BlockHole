import { GLSL3, MathUtils, Matrix3, Matrix4, ShaderMaterial, type PerspectiveCamera } from 'three'
import fragmentShader from '../shaders/blackhole.frag.glsl'
import vertexShader from '../shaders/fullscreen.vert.glsl'
import type { Params, Quality } from '../params'
import { BLACKBODY_LOG_RANGE, createBlackbodyLUT } from './blackbodyLUT'

// 每步步长 = STEP_SCALE × r，越靠近黑洞越密
const QUALITY_DEFINES: Record<Quality, { MAX_STEPS: number; STEP_SCALE: string }> = {
  low: { MAX_STEPS: 128, STEP_SCALE: '0.12' },
  medium: { MAX_STEPS: 256, STEP_SCALE: '0.06' },
  high: { MAX_STEPS: 512, STEP_SCALE: '0.03' },
}

const rotation = new Matrix4()

export class BlackHoleMaterial extends ShaderMaterial {
  constructor(camera: PerspectiveCamera) {
    super({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        // 直接引用相机的矩阵对象，每帧自动跟随
        uCameraPos: { value: camera.position },
        uCameraWorld: { value: camera.matrixWorld },
        uProjInv: { value: camera.projectionMatrixInverse },
        uWorldToDisk: { value: new Matrix3() },
        uTime: { value: 0 },
        uDiskInner: { value: 3 },
        uDiskOuter: { value: 10 },
        uDiskTemp: { value: 10000 },
        uDiskOpacity: { value: 1 },
        uDiskBrightness: { value: 1 },
        uDoppler: { value: 1 },
        uGravRedshift: { value: 1 },
        uBeaming: { value: 1 },
        uFlux: { value: 1 },
        uTexture: { value: 1 },
        uStars: { value: 1 },
        uBlackbody: { value: createBlackbodyLUT() },
        uBlackbodyLogRange: { value: BLACKBODY_LOG_RANGE },
      },
    })
  }

  applyParams(p: Params): void {
    const u = this.uniforms
    u.uDiskInner.value = p.diskInner
    u.uDiskOuter.value = Math.max(p.diskOuter, p.diskInner + 0.5)
    u.uDiskTemp.value = p.diskTemp
    u.uDiskOpacity.value = p.diskOpacity
    u.uDiskBrightness.value = p.diskBrightness
    u.uDoppler.value = Number(p.doppler)
    u.uGravRedshift.value = Number(p.gravRedshift)
    u.uBeaming.value = Number(p.beaming)
    u.uFlux.value = Number(p.flux)
    u.uTexture.value = Number(p.texture)
    u.uStars.value = Number(p.stars)

    // 盘面绕默认视线轴（世界 z 轴）滚转
    rotation.makeRotationZ(-MathUtils.degToRad(p.diskRoll))
    ;(u.uWorldToDisk.value as Matrix3).setFromMatrix4(rotation)

    const defines = QUALITY_DEFINES[p.quality]
    if (this.defines.MAX_STEPS !== defines.MAX_STEPS) {
      this.defines = { ...defines }
      this.needsUpdate = true
    }
  }
}
