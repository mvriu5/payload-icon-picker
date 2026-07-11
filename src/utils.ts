import type { ElementType } from "react"

type IconComponent = ElementType<{
    "aria-hidden"?: boolean
    className?: string
    focusable?: boolean
    size?: number | string
}>

export type IconFieldIcon = {
    Icon?: IconComponent
    component?: IconComponent
    keywords?: string[]
    label?: string
    name: string
    svg?: string
    value?: string
}

export type IconFieldIconRecord = Record<string, IconComponent> | Record<string, IconFieldIcon>

export const defaultResolveIcon = (icon: IconFieldIcon): string => icon.value ?? icon.name

export const normalizeIcons = (icons: IconFieldIcon[] | IconFieldIconRecord | undefined): IconFieldIcon[] => {
    if (!icons) {
        return []
    }

    if (Array.isArray(icons)) {
        return icons
    }

    return Object.entries(icons).map(([name, icon]) => {
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
}

const isIconComponent = (icon: IconComponent | IconFieldIcon): icon is IconComponent => {
    if (typeof icon === "function" || typeof icon === "string") {
        return true
    }

    return !("Icon" in icon || "component" in icon || "label" in icon || "value" in icon)
}

export const getIconLabelParts = (
    icon: IconFieldIcon,
    resolveIcon: (icon: IconFieldIcon) => string
): {
    name: string
    prefix?: string
} => {
    const label = icon.label ?? icon.name

    const labelParts = splitPrefixedValue(label)
    if (labelParts) return labelParts

    const valueParts = splitPrefixedValue(resolveIcon(icon))

    if (valueParts) {
        return {
            name: label,
            prefix: valueParts.prefix,
        }
    }

    return {
        name: label,
    }
}

export const getIconLibrary = (icon: IconFieldIcon, resolveIcon: (icon: IconFieldIcon) => string): string | undefined =>
    splitPrefixedValue(resolveIcon(icon))?.prefix

const splitPrefixedValue = (value: string): { name: string; prefix: string } | undefined => {
    const separatorIndex = value.indexOf(":")
    if (separatorIndex <= 0 || separatorIndex === value.length - 1) return undefined

    return {
        name: value.slice(separatorIndex + 1),
        prefix: value.slice(0, separatorIndex),
    }
}
