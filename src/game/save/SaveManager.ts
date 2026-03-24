import type { RunSaveData, MetaProgressData } from '@t/save.types'

const RUN_KEY = 'pokeslyer_run'
const META_KEY = 'pokeslyer_meta'
const SAVE_VERSION = 1

export class SaveManager {
  saveRun(data: RunSaveData): void {
    localStorage.setItem(RUN_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }))
  }

  loadRun(): RunSaveData | null {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RunSaveData
  }

  clearRun(): void {
    localStorage.removeItem(RUN_KEY)
  }

  saveMeta(data: MetaProgressData): void {
    localStorage.setItem(META_KEY, JSON.stringify(data))
  }

  loadMeta(): MetaProgressData {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return { regressPoints: 0, unlockedLegacies: [], unlockedRareCards: [], playHistory: [] }
    return JSON.parse(raw) as MetaProgressData
  }
}
