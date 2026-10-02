import GUI from 'lil-gui'
import { STAGE_LABELS, STAGE_PRESETS, type Params } from './params'

export function createGUI(params: Params, onChange: () => void): GUI {
  const gui = new GUI({ title: '黑洞参数' })

  gui
    .add(params, 'stage', STAGE_LABELS)
    .name('阶段预设')
    .onChange(() => {
      Object.assign(params, STAGE_PRESETS[params.stage])
      gui.controllersRecursive().forEach((c) => c.updateDisplay())
      // lil-gui 先调用 gui.onChange 再调用这里，那一次拿到的还是旧预设
      onChange()
    })

  const effects = gui.addFolder('物理效果')
  effects.add(params, 'doppler').name('多普勒频移')
  effects.add(params, 'gravRedshift').name('引力红移')
  effects.add(params, 'beaming').name('集束亮度 g⁴')
  effects.add(params, 'flux').name('Page–Thorne 通量')
  effects.add(params, 'texture').name('盘面纹理')
  effects.add(params, 'stars').name('背景星空')

  const disk = gui.addFolder('吸积盘')
  disk.add(params, 'diskInner', 3, 6, 0.05).name('内半径 (Rs)')
  disk.add(params, 'diskOuter', 4, 20, 0.1).name('外半径 (Rs)')
  disk.add(params, 'diskTemp', 2000, 20000, 100).name('温度 (K)')
  disk.add(params, 'diskOpacity', 0.05, 1, 0.01).name('不透明度')
  disk.add(params, 'diskBrightness', 0.1, 5, 0.05).name('亮度')
  disk.add(params, 'diskRoll', -45, 45, 1).name('滚转角 (°)')
  disk.add(params, 'rotationSpeed', 0, 20, 0.5).name('旋转速度')

  const quality = gui.addFolder('画质')
  quality.add(params, 'quality', { 低: 'low', 中: 'medium', 高: 'high' }).name('积分步数')
  quality.add(params, 'renderScale', 0.25, 1, 0.05).name('渲染比例')

  const post = gui.addFolder('后处理')
  post.add(params, 'bloom').name('Bloom')
  post.add(params, 'bloomStrength', 0, 2, 0.01).name('Bloom 强度')
  post.add(params, 'bloomRadius', 0, 1, 0.01).name('Bloom 半径')
  post.add(params, 'bloomThreshold', 0, 3, 0.01).name('Bloom 阈值')
  post.add(params, 'exposure', 0.1, 4, 0.01).name('曝光')
  post.add(params, 'toneMapping', ['ACES', 'AgX', 'Neutral']).name('色调映射')

  gui.onChange(onChange)
  return gui
}
