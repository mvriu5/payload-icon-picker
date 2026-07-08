import type { IconFieldIcon } from "../IconField.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type SimpleIconsAdapterOptions = IconAdapterOptions

export const simpleIconsAdapter = (icons: IconLibrary, options?: SimpleIconsAdapterOptions): IconFieldIcon[] => createSvgIconAdapter(icons, options)
