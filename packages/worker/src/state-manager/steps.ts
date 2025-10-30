import { getImageOccurrence } from '@appium/opencv'
import type { Anchor } from '../anchors/anchor.type'
import { findLoop } from '../img-proccesing/findloop'
import { loadBuffer } from '../img-proccesing/memo-img'
import { share } from '../share/shate'
import { log } from '../utils/log'
import { wait } from '../utils/utils'
import type { StateManager } from './state-manager'

type Step =
  | {
      step: 'find'
      data: { anchor: Anchor }
    }
  | {
      step: 'click'
      data: { anchor?: Anchor; x?: number; y?: number }
    }
  | {
      step: 'write'
      data: { text: string }
    }
  | {
      step: 'share'
      data: { setCode: (code: string) => void }
    }
  | {
      step: 'wait'
      data: { amount: number }
    }
  | {
      step: 'clickOccurrence'
      data: { anchor: Anchor }
    }
  | {
      step: 'deleteAllText'
    }
  | {
      step: 'swipe'
      data: { x1: number; y1: number; x2: number; y2: number; duration: number }
    }

type Steps = Step[]

export async function runSteps(steps: Steps, stateManager: StateManager) {
  for (const step of steps) {
    switch (step.step) {
      case 'find':
        await find(step, stateManager)
        break
      case 'click':
        if (step.data.x && step.data.y) {
          await stateManager.ldPlayer.click(step.data.x, step.data.y)
        }
        if (step.data.anchor) {
          await find(step, stateManager)
          await stateManager.ldPlayer.clickAnchor(step.data.anchor)
        }
        break
      case 'write':
        await stateManager.ldPlayer.writeText(step.data.text)
        break
      case 'share': {
        const shareRet = await share(stateManager.ldPlayer.name, stateManager)
        step.data.setCode(shareRet.code)
        break
      }
      case 'wait': {
        await wait(step.data.amount)
        break
      }
      case 'clickOccurrence': {
        await clickOccurrence(step, stateManager)
        break
      }
      case 'deleteAllText': {
        await stateManager.ldPlayer.deleteAllText()
        break
      }
      case 'swipe': {
        await stateManager.ldPlayer.swipe(
          step.data.x1,
          step.data.y1,
          step.data.x2,
          step.data.y2,
          step.data.duration
        )
        break
      }
      default: {
        throw new Error(`Unknown step: ${JSON.stringify(step)}`)
      }
    }
    await wait(500)
  }
}

async function clickOccurrence(step: Step, stateManager: StateManager) {
  if (step.step !== 'clickOccurrence') return
  if (!stateManager.currentImg) return console.error('clickOccurrence: no image')
  if (typeof stateManager.currentImg === 'string')
    return console.error(`clickOccurrence: img is string: ${stateManager.currentImg}`)

  await stateManager.takeScreenshot()

  const anchor = step.data.anchor
  const partialImage = await loadBuffer(anchor.img)
  if (!partialImage)
    return console.error(`clickOccurrence: no partial image: ${step.data.anchor.img}`)

  try {
    const { rect, score } = await getImageOccurrence(stateManager.currentImg, partialImage, {
      threshold: 0.85,
    })

    if (rect) {
      const x = rect.x + rect.width / 2
      const y = rect.y + rect.height / 2
      await stateManager.ldPlayer.click(x, y)
    }

    log.info({ score, rect }, `clickOccurrence: score: ${score}, rect: ${JSON.stringify(rect)}`)
  } catch (_error) {
    console.error(`clickOccurrence: dont find element: ${step.data.anchor.img}`)
  }
}

async function find(step: Step, stateManager: StateManager) {
  if (step.step !== 'find') return
  const findedEllement = await findLoop(step.data.anchor, stateManager)
  if (findedEllement.error) {
    throw new Error(`name: ${stateManager.ldPlayer.name}, anchor: ${step.data.anchor.img}`)
  }
  return
}
