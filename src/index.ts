import type { Config, Field, TextField } from "payload"

import { sanitizeSvg } from "./sanitizeSvg.js"
import type { IconFieldIcon, IconFieldIconRecord } from "./utils.js"
import { normalizeIcons } from "./utils.js"

export type PayloadIconPluginConfig = {
    /**
     * Icons from the selected icon library. You can pass an array or a module namespace,
     * e.g. `import * as Icons from 'lucide-react'`.
     */
    icons: IconFieldIcon[] | IconFieldIconRecord
    /**
     * Disable only the admin picker behavior. The field remains a text field so stored
     * data and database schema stay stable.
     */
    disabled?: boolean
    /**
     * Maps a selected icon to the string that is stored in Payload.
     */
    resolveIcon?: (icon: IconFieldIcon) => string
}

export type IconFieldConfig = Omit<TextField, "admin" | "hasMany" | "maxRows" | "minRows" | "type"> & {
    admin?: TextField["admin"]
    noResultsLabel?: string
    placeholder?: string
}

export type ResolveIconFromStringConfig = {
    icons: IconFieldIcon[] | IconFieldIconRecord
    resolveIcon?: (icon: IconFieldIcon) => string
}

export type ResolvedIcon = IconFieldIcon & {
    resolvedValue: string
}

type SerializableIcon = Omit<IconFieldIcon, "Icon" | "component"> & {
    svg?: string
}

const ICON_FIELD_MARKER = "payloadIconPicker"
const ICON_FIELD_COMPONENT = "@mvriu5/payload-icon-picker/client#IconField"
const PACKAGE_NAME = "@mvriu5/payload-icon-picker"

export const iconField = ({ admin, noResultsLabel, placeholder, ...field }: IconFieldConfig): TextField =>
    ({
        ...field,
        hasMany: false,
        type: "text",
        admin: {
            ...admin,
            custom: {
                ...(admin?.custom ?? {}),
                [ICON_FIELD_MARKER]: {
                    noResultsLabel,
                    placeholder,
                },
            },
        },
    }) as TextField

export const payloadIconPlugin =
    (pluginOptions: PayloadIconPluginConfig) =>
    (config: Config): Config => {
        if (pluginOptions.disabled) {
            return config
        }

        const icons = normalizeIconsForClient(pluginOptions.icons, pluginOptions.resolveIcon)

        config.collections = config.collections?.map((collection) => ({
            ...collection,
            fields: withIconFields(collection.fields, icons),
        }))

        config.globals = config.globals?.map((global) => ({
            ...global,
            fields: withIconFields(global.fields, icons),
        }))

        return config
    }

export const createIconResolver = ({ icons, resolveIcon }: ResolveIconFromStringConfig) => {
    const iconMap = new Map<string, ResolvedIcon>()
    const normalizedIcons = normalizeIcons(icons)

    warnAboutDuplicateIconValues(normalizedIcons, (icon) => (resolveIcon ? resolveIcon(icon) : (icon.value ?? icon.name)))

    normalizedIcons.forEach((icon) => {
        const resolvedValue = resolveIcon ? resolveIcon(icon) : (icon.value ?? icon.name)

        iconMap.set(resolvedValue, {
            ...icon,
            resolvedValue,
            svg: sanitizeSvg(icon.svg),
        })
    })

    return (value: null | string | undefined): ResolvedIcon | undefined => {
        if (!value) {
            return undefined
        }

        return iconMap.get(value)
    }
}

const withIconFields = (fields: Field[] | undefined, icons: SerializableIcon[]): Field[] =>
    (fields ?? []).map((field) => {
        const fieldWithNestedFields = field as Field & {
            blocks?: Array<{ fields: Field[] }>
            fields?: Field[]
            tabs?: Array<{ fields: Field[] }>
        }

        if ("admin" in field && field.admin?.custom?.[ICON_FIELD_MARKER]) {
            const marker = field.admin.custom[ICON_FIELD_MARKER] as {
                noResultsLabel?: string
                placeholder?: string
            }

            const textField = field as TextField
            const admin = textField.admin

            return {
                ...textField,
                admin: {
                    ...admin,
                    components: {
                        ...(admin?.components ?? {}),
                        Field: {
                            clientProps: {
                                icons,
                                noResultsLabel: marker.noResultsLabel,
                                placeholder: marker.placeholder,
                            },
                            path: ICON_FIELD_COMPONENT,
                        },
                    },
                    custom: admin?.custom,
                },
            } as Field
        }

        if (fieldWithNestedFields.fields) {
            return {
                ...fieldWithNestedFields,
                fields: withIconFields(fieldWithNestedFields.fields, icons),
            } as Field
        }

        if (fieldWithNestedFields.tabs) {
            return {
                ...fieldWithNestedFields,
                tabs: fieldWithNestedFields.tabs.map((tab) => ({
                    ...tab,
                    fields: withIconFields(tab.fields, icons),
                })),
            } as Field
        }

        if (fieldWithNestedFields.blocks) {
            return {
                ...fieldWithNestedFields,
                blocks: fieldWithNestedFields.blocks.map((block) => ({
                    ...block,
                    fields: withIconFields(block.fields, icons),
                })),
            } as Field
        }

        return field
    })

const normalizeIconsForClient = (icons: IconFieldIcon[] | IconFieldIconRecord, resolveIcon?: (icon: IconFieldIcon) => string): SerializableIcon[] => {
    const normalizedIcons = normalizeIcons(icons)

    warnAboutDuplicateIconValues(normalizedIcons, (icon) => (resolveIcon ? resolveIcon(icon) : (icon.value ?? icon.name)))

    return normalizedIcons.map(({ Icon, component, ...icon }) => {
        const sanitizedSvg = sanitizeSvg(icon.svg)

        return {
            ...icon,
            svg: sanitizedSvg,
            value: resolveIcon ? resolveIcon({ Icon, component, ...icon }) : (icon.value ?? icon.name),
        }
    })
}

const warnAboutDuplicateIconValues = (icons: IconFieldIcon[], resolveValue: (icon: IconFieldIcon) => string): void => {
    if (isProduction()) return

    const iconsByValue = new Map<string, string[]>()

    icons.forEach((icon) => {
        const value = resolveValue(icon)
        const names = iconsByValue.get(value) ?? []

        names.push(icon.name)
        iconsByValue.set(value, names)
    })

    const duplicateMessages = Array.from(iconsByValue.entries())
        .filter(([, names]) => names.length > 1)
        .map(([value, names]) => `"${value}" used by ${names.map((name) => `"${name}"`).join(", ")}`)

    if (duplicateMessages.length === 0) {
        return
    }

    console.warn(
        `[${PACKAGE_NAME}] Duplicate icon values detected: ${duplicateMessages.join("; ")}. ` +
            "Icon values must be unique so stored values resolve predictably. Use adapter prefixes to avoid collisions."
    )
}

const isProduction = (): boolean => typeof process !== "undefined" && process.env.NODE_ENV === "production"
