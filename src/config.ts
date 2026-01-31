export const config: Config = {
  spells: {
    type: 'insert',
    ids: []
  }
}

export interface Config {
  spells: ExportConfig
}

export interface ExportConfig {
  type: 'insert' | 'update'
  ids: number[]
}
