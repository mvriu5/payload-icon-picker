import type { IconFieldIcon } from "../utils.js"

type IconNode = Array<[string, Record<string, unknown>]>

type IconComponentWithRender = {
    displayName?: string
    render?: (
        props: Record<string, unknown>,
        ref: unknown
    ) => {
        props?: Record<string, unknown>
        type?: unknown
    }
}

type ReactLikeElement = {
    props?: Record<string, unknown>
    type?: unknown
}

export type IconAdapterOptions = {
    exclude?: string[]
    include?: string[]
    label?: (args: IconAdapterLabelArgs) => string
    prefix?: string
    renderProps?: Record<string, unknown>
    svgMode?: "fill" | "stroke"
    value?: (args: IconAdapterValueArgs) => string
    weight?: string
}

export type IconLibrary = Record<string, unknown>

type IconAdapterLabelArgs = {
    defaultLabel: string
    name: string
    prefix?: string
    value: string
}

type IconAdapterValueArgs = {
    name: string
    prefix?: string
}

export const createSvgIconAdapter = (icons: IconLibrary, options: IconAdapterOptions = {}): IconFieldIcon[] => {
    const include = new Set(options.include ?? [])
    const exclude = new Set(options.exclude ?? [])

    return Object.entries(icons).flatMap(([name, icon]) => {
        if (exclude.has(name) || (include.size > 0 && !include.has(name))) {
            return []
        }

        const iconNode = getIconNode(icon, options)

        if (!iconNode) {
            return []
        }

        const value = getValue(name, options)
        const defaultLabel = getLabel(name, icon)

        return [
            {
                label: getAdaptedLabel({
                    defaultLabel,
                    name,
                    options,
                    value,
                }),
                name,
                svg: iconNodeToSvg(iconNode, options.svgMode ?? "stroke"),
                value,
            },
        ]
    })
}

const getValue = (name: string, options: IconAdapterOptions): string => {
    if (options.value) {
        return options.value({
            name,
            prefix: options.prefix,
        })
    }

    return options.prefix ? `${options.prefix}:${name}` : name
}

const getAdaptedLabel = ({
    defaultLabel,
    name,
    options,
    value,
}: {
    defaultLabel: string
    name: string
    options: IconAdapterOptions
    value: string
}): string => {
    if (options.label) {
        return options.label({
            defaultLabel,
            name,
            prefix: options.prefix,
            value,
        })
    }

    return options.prefix ? `${options.prefix}:${defaultLabel}` : defaultLabel
}

const getIconNode = (icon: unknown, options: IconAdapterOptions): IconNode | undefined => {
    if (isIconNode(icon)) {
        return icon
    }

    if (!icon || typeof icon !== "object") {
        return undefined
    }

    const component = icon as IconComponentWithRender
    const rendered = component.render?.(options.renderProps ?? {}, null)
    const iconNode = rendered?.props?.iconNode

    if (isIconNode(iconNode)) {
        return iconNode
    }

    if (isIconNode(rendered?.props?.children)) {
        return rendered.props.children
    }

    const renderedIconNode = reactElementToIconNode(rendered)

    if (renderedIconNode) {
        return renderedIconNode
    }

    const weightedIconNode = getWeightedIconNode(rendered, options.weight)

    if (weightedIconNode) {
        return weightedIconNode
    }

    return undefined
}

const getLabel = (name: string, icon: unknown): string => {
    if (icon && typeof icon === "object" && "displayName" in icon && typeof icon.displayName === "string") {
        return icon.displayName
    }

    return name
}

const iconNodeToSvg = (iconNode: IconNode, svgMode: NonNullable<IconAdapterOptions["svgMode"]>): string => {
    const children = iconNode.map(([tag, attrs]) => `<${tag}${attrsToString(attrs)} />`).join("")

    if (svgMode === "fill") {
        return `<svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">${children}</svg>`
    }

    return `<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">${children}</svg>`
}

const getWeightedIconNode = (element: ReactLikeElement | undefined, weight = "regular"): IconNode | undefined => {
    const weights = element?.props?.weights

    if (!isIconWeightMap(weights)) {
        return undefined
    }

    return reactElementToIconNode(weights.get(weight))
}

const reactElementToIconNode = (element: ReactLikeElement | undefined): IconNode | undefined => reactChildrenToIconNode(element)

const reactChildrenToIconNode = (element: ReactLikeElement | undefined): IconNode | undefined => {
    if (!element) {
        return undefined
    }

    const children = Array.isArray(element.props?.children) ? element.props.children : [element.props?.children]
    const iconNode = children.flatMap((child): IconNode => {
        if (!isReactElement(child)) {
            return []
        }

        if (typeof child.type === "symbol") {
            return reactChildrenToIconNode(child) ?? []
        }

        if (typeof child.type !== "string") {
            return []
        }

        return [[child.type, child.props ?? {}]]
    })

    return iconNode.length > 0 ? iconNode : undefined
}

const attrsToString = (attrs: Record<string, unknown>): string => {
    const attrString = Object.entries(attrs)
        .filter(([key, value]) => key !== "children" && key !== "key" && key !== "ref" && value !== null && value !== undefined)
        .map(([key, value]) => ` ${toKebabCase(key)}="${escapeHtml(String(value))}"`)
        .join("")

    return attrString
}

const isIconNode = (value: unknown): value is IconNode =>
    Array.isArray(value) &&
    value.every((item) => {
        if (!Array.isArray(item) || item.length !== 2) {
            return false
        }

        const [tag, attrs] = item

        return typeof tag === "string" && Boolean(attrs) && typeof attrs === "object" && !Array.isArray(attrs)
    })

const isReactElement = (value: unknown): value is ReactLikeElement => value !== null && typeof value === "object" && "type" in value && "props" in value

const isIconWeightMap = (value: unknown): value is Map<string, ReactLikeElement> => value instanceof Map

const toKebabCase = (value: string): string => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
