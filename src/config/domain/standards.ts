const standardToneMap: Record<string, string> = {
  'VDA 6.3': 'vda63',
  'VDA 6.5': 'vda65',
  'ISO 9001': 'iso',
  'ISO 14001': 'iso',
  ASI: 'asi',
  EcoVadis: 'ecovadis',
  'IATF 16949': 'iatf',
}

export function getStandardToneKey(standard: string) {
  return standardToneMap[standard] ?? 'neutral'
}
