import type { IconFieldIcon } from "../IconField.js"

import { createSvgIconAdapter } from "./utils.js"
import type { IconAdapterOptions, IconLibrary } from "./utils.js"

export type PhosphorIconWeight = "bold" | "duotone" | "fill" | "light" | "regular" | "thin"

export type PhosphorIconAdapterOptions = Omit<IconAdapterOptions, "weight"> & {
    weight?: PhosphorIconWeight
}

export const phosphorIconAdapter = (icons: IconLibrary, options?: PhosphorIconAdapterOptions): IconFieldIcon[] =>
    createSvgIconAdapter(icons, {
        label:
            options?.label ??
            (({ name, prefix }) => {
                return prefix ? `${prefix}:${name}` : name
            }),
        ...options,
    })
