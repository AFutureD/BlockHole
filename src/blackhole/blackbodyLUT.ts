import {
  ClampToEdgeWrapping,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  Vector2,
} from 'three'

export const BLACKBODY_T_MIN = 1000
export const BLACKBODY_T_MAX = 40000
export const BLACKBODY_LOG_RANGE = new Vector2(Math.log(BLACKBODY_T_MIN), Math.log(BLACKBODY_T_MAX))

const SIZE = 256

// CIE 1931 配色函数的分段高斯拟合（Wyman, Sloan & Shirley 2013），波长单位 nm
function lobe(lambda: number, mu: number, sigma1: number, sigma2: number): number {
  const t = (lambda - mu) / (lambda < mu ? sigma1 : sigma2)
  return Math.exp(-0.5 * t * t)
}

function cieXYZ(lambda: number): [number, number, number] {
  const x =
    1.056 * lobe(lambda, 599.8, 37.9, 31.0) +
    0.362 * lobe(lambda, 442.0, 16.0, 26.7) -
    0.065 * lobe(lambda, 501.1, 20.4, 26.2)
  const y = 0.821 * lobe(lambda, 568.8, 46.9, 40.5) + 0.286 * lobe(lambda, 530.9, 16.3, 31.1)
  const z = 1.217 * lobe(lambda, 437.0, 11.8, 36.0) + 0.681 * lobe(lambda, 459.0, 26.0, 13.8)
  return [x, y, z]
}

// Planck 谱，只保留与波长、温度有关的部分；hc/k = 1.4388e7 nm·K
function planck(lambda: number, temp: number): number {
  return 1 / (Math.pow(lambda * 1e-3, 5) * Math.expm1(1.4388e7 / (lambda * temp)))
}

/** 色温 → 线性 sRGB 色度，最大通道归一化为 1 */
export function blackbodyChroma(temp: number): [number, number, number] {
  let X = 0
  let Y = 0
  let Z = 0
  for (let lambda = 380; lambda <= 780; lambda += 5) {
    const b = planck(lambda, temp)
    const [x, y, z] = cieXYZ(lambda)
    X += b * x
    Y += b * y
    Z += b * z
  }
  const r = Math.max(3.2406 * X - 1.5372 * Y - 0.4986 * Z, 0)
  const g = Math.max(-0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0)
  const b = Math.max(0.0557 * X - 0.204 * Y + 1.057 * Z, 0)
  const max = Math.max(r, g, b)
  return [r / max, g / max, b / max]
}

/** 1D 黑体颜色表，沿 u 方向按 log(T) 均匀分布 */
export function createBlackbodyLUT(): DataTexture {
  const data = new Uint16Array(SIZE * 4)
  for (let i = 0; i < SIZE; i++) {
    const u = (i + 0.5) / SIZE
    const logT = BLACKBODY_LOG_RANGE.x + u * (BLACKBODY_LOG_RANGE.y - BLACKBODY_LOG_RANGE.x)
    const [r, g, b] = blackbodyChroma(Math.exp(logT))
    data[i * 4 + 0] = DataUtils.toHalfFloat(r)
    data[i * 4 + 1] = DataUtils.toHalfFloat(g)
    data[i * 4 + 2] = DataUtils.toHalfFloat(b)
    data[i * 4 + 3] = DataUtils.toHalfFloat(1)
  }
  const texture = new DataTexture(data, SIZE, 1, RGBAFormat, HalfFloatType)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}
