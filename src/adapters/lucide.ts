import type { IconFieldIcon } from "../utils.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type LucideIconAdapterOptions = IconAdapterOptions

export const lucideIconAdapter = (icons: IconLibrary, options?: LucideIconAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
