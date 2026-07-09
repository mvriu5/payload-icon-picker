import type { IconFieldIcon } from "../utils.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type HeroiconsAdapterOptions = IconAdapterOptions

export const heroiconsAdapter = (icons: IconLibrary, options?: HeroiconsAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
