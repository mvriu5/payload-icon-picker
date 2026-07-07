import type { IconFieldIcon } from "../IconField.js"

type IconNode = Array<[string, Record<string, unknown>]>

type IconComponentWithRender = {
    displayName?: string
    render?: (props: Record<string, unknown>, ref: unknown) => {
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
}

export type IconLibrary = Record<string, unknown>

export const createSvgIconAdapter = (icons: IconLibrary, options: IconAdapterOptions = {}): IconFieldIcon[] => {
    const include = new Set(options.include ?? [])
    const exclude = new Set(options.exclude ?? [])

    return Object.entries(icons).flatMap(([name, icon]) => {
        if (exclude.has(name) || (include.size > 0 && !include.has(name))) {
            return []
        }

        const iconNode = getIconNode(icon)

        if (!iconNode) {
            return []
        }

        return [
            {
                label: getLabel(name, icon),
                name,
                svg: iconNodeToSvg(iconNode),
                value: name,
            },
        ]
    })
}

const getIconNode = (icon: unknown): IconNode | undefined => {
    if (!icon || typeof icon !== "object") {
        return undefined
    }

    const component = icon as IconComponentWithRender
    const rendered = component.render?.({}, null)
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

    return undefined
}

const getLabel = (name: string, icon: unknown): string => {
    if (icon && typeof icon === "object" && "displayName" in icon && typeof icon.displayName === "string") {
        return icon.displayName
    }

    return name
}

const iconNodeToSvg = (iconNode: IconNode): string => {
    const children = iconNode.map(([tag, attrs]) => `<${tag}${attrsToString(attrs)} />`).join("")

    return `<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">${children}</svg>`
}

const reactElementToIconNode = (element: ReactLikeElement | undefined): IconNode | undefined => {
    if (!element || element.type !== "svg") {
        return undefined
    }

    const children = Array.isArray(element.props?.children) ? element.props.children : [element.props?.children]
    const iconNode = children
        .filter(isReactElement)
        .map((child): [string, Record<string, unknown>] => [String(child.type), child.props ?? {}])
        .filter(([tag]) => tag !== "undefined")

    return iconNode.length > 0 ? iconNode : undefined
}

const attrsToString = (attrs: Record<string, unknown>): string => {
    const attrString = Object.entries(attrs)
        .filter(([key, value]) => key !== "key" && value !== null && value !== undefined)
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

const isReactElement = (value: unknown): value is ReactLikeElement =>
    value !== null && typeof value === "object" && "type" in value && "props" in value

const toKebabCase = (value: string): string => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

const escapeHtml = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("\"", "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
