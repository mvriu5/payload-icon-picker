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
     * Maps each registered icon to the final string stored in Payload.
     *
     * In normal `payloadIconPlugin()` + `iconField()` usage this runs during
     * Payload config setup. The resolved string is then passed to the admin
     * field as `icon.value`, so you do not need to also pass `resolveIcon` to
     * the admin component manually.
     */
    resolveIcon?: (icon: IconFieldIcon) => string
}

export type IconFieldConfig = Omit<TextField, "admin" | "hasMany" | "maxRows" | "minRows" | "type"> & {
    admin?: TextField["admin"]
    /**
     * Limit this field to icons whose final stored value uses one of these
     * prefixes. Example: `["lucide"]` matches `lucide:Home`.
     */
    libraries?: string[]
    noResultsLabel?: string
    /**
     * Limit this field to specific final stored icon values.
     * Example: `["lucide:Home", "si:SiGithub"]`.
     */
    icons?: string[]
    placeholder?: string
}

export type ResolveIconFromStringConfig = {
    icons: IconFieldIcon[] | IconFieldIconRecord
    /**
     * Maps registered icons to the stored string. Use the same resolver that
     * produced existing stored values when resolving icons outside the Payload
     * admin UI.
     */
    resolveIcon?: (icon: IconFieldIcon) => string
}

export type ResolvedIcon = IconFieldIcon & {
    resolvedValue: string
}

type SerializableIcon = Omit<IconFieldIcon, "Icon" | "component" | "value"> & {
    svg?: string
    value: string
}

type IconFieldMarker = {
    icons?: string[]
    libraries?: string[]
    noResultsLabel?: string
    placeholder?: string
}

const ICON_FIELD_MARKER = "payloadIconPicker"
const ICON_FIELD_COMPONENT = "@mvriu5/payload-icon-picker/client#IconField"
const PACKAGE_NAME = "@mvriu5/payload-icon-picker"

export const iconField = ({ admin, icons, libraries, noResultsLabel, placeholder, ...field }: IconFieldConfig): TextField =>
    ({
        ...field,
        hasMany: false,
        type: "text",
        admin: {
            ...admin,
            custom: {
                ...(admin?.custom ?? {}),
                [ICON_FIELD_MARKER]: {
                    icons,
                    libraries,
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
            const marker = field.admin.custom[ICON_FIELD_MARKER] as IconFieldMarker
            const fieldName = "name" in field && typeof field.name === "string" ? field.name : undefined
            const filteredIcons = filterIconsForField(icons, marker, fieldName)

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
                                icons: filteredIcons,
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

const filterIconsForField = (icons: SerializableIcon[], marker: IconFieldMarker, fieldName: string | undefined): SerializableIcon[] => {
    const allowedLibraries = new Set(marker.libraries ?? [])
    const allowedIconValues = new Set(marker.icons ?? [])

    if (allowedLibraries.size === 0 && allowedIconValues.size === 0) {
        return icons
    }

    const filteredIcons = icons.filter((icon) => {
        const library = getIconValueLibrary(icon.value)

        return allowedIconValues.has(icon.value) || (library ? allowedLibraries.has(library) : false)
    })

    warnAboutUnmatchedIconFieldFilters({
        allowedIconValues,
        allowedLibraries,
        fieldName,
        filteredIcons,
        icons,
    })

    return filteredIcons
}

const getIconValueLibrary = (value: string): string | undefined => {
    const separatorIndex = value.indexOf(":")

    if (separatorIndex <= 0) {
        return undefined
    }

    return value.slice(0, separatorIndex)
}

const warnAboutUnmatchedIconFieldFilters = ({
    allowedIconValues,
    allowedLibraries,
    fieldName,
    filteredIcons,
    icons,
}: {
    allowedIconValues: Set<string>
    allowedLibraries: Set<string>
    fieldName: string | undefined
    filteredIcons: SerializableIcon[]
    icons: SerializableIcon[]
}): void => {
    if (isProduction()) return

    const knownIconValues = new Set(icons.map((icon) => icon.value))
    const knownLibraries = new Set(icons.map((icon) => getIconValueLibrary(icon.value)).filter((library): library is string => Boolean(library)))
    const unknownIconValues = Array.from(allowedIconValues).filter((value) => !knownIconValues.has(value))
    const unknownLibraries = Array.from(allowedLibraries).filter((library) => !knownLibraries.has(library))
    const fieldLabel = fieldName ? `iconField("${fieldName}")` : "iconField()"

    if (unknownIconValues.length > 0) {
        console.warn(
            `[${PACKAGE_NAME}] ${fieldLabel} references unknown icon values: ${unknownIconValues.map((value) => `"${value}"`).join(", ")}. ` +
                "Make sure the matching icons are registered in payloadIconPlugin()."
        )
    }

    if (unknownLibraries.length > 0) {
        console.warn(
            `[${PACKAGE_NAME}] ${fieldLabel} references unknown icon libraries: ${unknownLibraries.map((library) => `"${library}"`).join(", ")}. ` +
                "Make sure the matching adapters use these prefixes in payloadIconPlugin()."
        )
    }

    if (filteredIcons.length === 0) {
        console.warn(`[${PACKAGE_NAME}] ${fieldLabel} filter matched no icons. The picker will render with an empty icon list.`)
    }
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
