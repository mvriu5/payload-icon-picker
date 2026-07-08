import type { IconFieldIcon } from "../IconField.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type LucideIconAdapterOptions = IconAdapterOptions

export const lucideIconAdapter = (icons: IconLibrary, options?: LucideIconAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
