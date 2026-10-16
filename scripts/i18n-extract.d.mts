export interface Found { file: string; line: number; key: string }
export function extractFromSource(file: string, text: string): Found[]
export function extractAll(root?: string): Found[]
