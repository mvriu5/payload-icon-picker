import type { IconFieldIcon } from "../IconField.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type TablerIconAdapterOptions = IconAdapterOptions

export const tablerIconAdapter = (icons: IconLibrary, options?: TablerIconAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
