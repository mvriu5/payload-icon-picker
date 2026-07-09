import type { IconFieldIcon } from "../utils.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type HugeiconsIconAdapterOptions = IconAdapterOptions

export const hugeiconsIconAdapter = (icons: IconLibrary, options?: HugeiconsIconAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
