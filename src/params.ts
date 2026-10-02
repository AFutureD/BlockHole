export type Quality = 'low' | 'medium' | 'high'
export type ToneMappingName = 'ACES' | 'AgX' | 'Neutral'
export type Stage = 'lensing' | 'shift' | 'beaming' | 'final'

export interface Effects {
  doppler: boolean
  gravRedshift: boolean
  beaming: boolean
  flux: boolean
  texture: boolean
  stars: boolean
  bloom: boolean
}

// 对应 Wolfram 文章里逐步加效果的几张对比图
export const STAGE_LABELS: Record<string, Stage> = {
  '① 仅光线弯曲': 'lensing',
  '② 加频移颜色': 'shift',
  '③ 加集束亮度': 'beaming',
  '④ 最终效果': 'final',
}

const OFF: Effects = {
  doppler: false,
  gravRedshift: false,
  beaming: false,
  flux: false,
  texture: false,
  stars: false,
  bloom: false,
}

export const STAGE_PRESETS: Record<Stage, Effects> = {
  lensing: OFF,
  shift: { ...OFF, doppler: true, gravRedshift: true },
  beaming: { ...OFF, doppler: true, gravRedshift: true, beaming: true },
  final: {
    doppler: true,
    gravRedshift: true,
    beaming: true,
    flux: true,
    texture: true,
    stars: true,
    bloom: true,
  },
}

// 长度单位 Rs。几何默认值取自仓库的连续盘版本：观察者 15 Rs，
// 盘 3–10 Rs，视线与盘面成 10°，画面滚转 15°。
export const CAMERA_DISTANCE = 15
export const CAMERA_ELEVATION_DEG = 10
export const CAMERA_FOV = 50

export const params = {
  stage: 'final' as Stage,
  ...STAGE_PRESETS.final,

  diskInner: 3,
  diskOuter: 10,
  // 仓库用 10000 K，但那样整个盘都偏蓝白，看不出频移；
  // 6500 K 时趋近侧约 9500 K（蓝白），远离侧约 3200 K（橙）
  diskTemp: 6500,
  diskOpacity: 1,
  diskBrightness: 0.6,
  diskRoll: 15,
  rotationSpeed: 4,

  quality: 'medium' as Quality,
  renderScale: 0.75,

  bloomStrength: 0.6,
  bloomRadius: 0.6,
  bloomThreshold: 1.0,
  exposure: 1.0,
  toneMapping: 'ACES' as ToneMappingName,
}

export type Params = typeof params
