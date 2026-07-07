import type { Config, Field, TextField } from "payload"

import type { IconFieldIcon, IconFieldIconRecord } from "./IconField.js"

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

type SerializableIcon = Omit<IconFieldIcon, "Icon" | "component"> & {
    svg?: string
}

const ICON_FIELD_MARKER = "payloadIconPicker"
const ICON_FIELD_COMPONENT = "@mvriu5/payload-icon-picker/client#IconField"

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
    const normalizedIcons = Array.isArray(icons)
        ? icons
        : Object.entries(icons).map(([name, icon]) => {
              if (isIconComponent(icon)) {
                  return {
                      Icon: icon,
                      name,
                  }
              }

              return {
                  name,
                  ...icon,
              }
          })

    return normalizedIcons.map(({ Icon, component, ...icon }) => ({
        ...icon,
        value: resolveIcon ? resolveIcon({ Icon, component, ...icon }) : (icon.value ?? icon.name),
    }))
}

const isIconComponent = (icon: IconFieldIcon | NonNullable<IconFieldIcon["Icon"]>): icon is NonNullable<IconFieldIcon["Icon"]> => {
    if (typeof icon === "function" || typeof icon === "string") {
        return true
    }

    return !("Icon" in icon || "component" in icon || "label" in icon || "value" in icon)
}
