import { core1 } from './en/core1'
import { core2 } from './en/core2'
import { core3 } from './en/core3'
import { core4 } from './en/core4'
import { core5 } from './en/core5'
import { core6 } from './en/core6'
import { core7 } from './en/core7'
import { extra } from './en/extra'

/**
 * Thai (source) -> English. Keys with {0}, {1} are patterns (see translate.ts).
 * Add an entry here whenever a Thai string is added to the app; `npm run i18n:list` shows every key and
 * src/i18n/coverage.test.ts fails when one is missing.
 */
export const EN: Record<string, string> = { ...core1, ...core2, ...core3, ...core4, ...core5, ...core6, ...core7, ...extra }
