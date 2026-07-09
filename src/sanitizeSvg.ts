const allowedTags = new Set([
    "circle",
    "clipPath",
    "defs",
    "ellipse",
    "g",
    "line",
    "linearGradient",
    "mask",
    "path",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "stop",
    "svg",
])

const allowedAttributes = new Set([
    "aria-hidden",
    "clip-path",
    "clip-rule",
    "cx",
    "cy",
    "d",
    "fill",
    "fill-rule",
    "focusable",
    "height",
    "id",
    "mask",
    "offset",
    "opacity",
    "points",
    "r",
    "rx",
    "ry",
    "stroke",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "transform",
    "viewBox",
    "width",
    "x",
    "x1",
    "x2",
    "xlink:href",
    "xmlns",
    "xmlns:xlink",
    "y",
    "y1",
    "y2",
])

const dangerousPattern =
    /<\s*(?:script|foreignObject|iframe|object|embed|link|meta|base|style)\b|on[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']?\s*(?:javascript|data):/i
const tagPattern = /<\/?([a-zA-Z][\w:-]*)([^<>]*)>/g
const attributePattern = /([a-zA-Z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g

export const sanitizeSvg = (svg: string | undefined): string | undefined => {
    if (!svg) return undefined

    const trimmedSvg = svg.trim()
    if (!trimmedSvg.startsWith("<svg") || dangerousPattern.test(trimmedSvg)) return undefined

    let hasSvgTag = false
    const sanitizedSvg = trimmedSvg
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<\?[\s\S]*?\?>/g, "")
        .replace(/<!doctype[\s\S]*?>/gi, "")
        .replace(tagPattern, (tag, tagName: string, rawAttributes: string) => {
            const normalizedTagName = tagName.toLowerCase()
            const allowedTag = Array.from(allowedTags).find((allowed) => allowed.toLowerCase() === normalizedTagName)

            if (!allowedTag) return ""
            if (allowedTag === "svg") hasSvgTag = true

            if (tag.startsWith("</")) return `</${allowedTag}>`

            const attributes = sanitizeAttributes(rawAttributes)
            const selfClosing = tag.endsWith("/>") ? " /" : ""

            return `<${allowedTag}${attributes}${selfClosing}>`
        })

    if (!hasSvgTag || !sanitizedSvg.includes("</svg>")) return undefined

    return sanitizedSvg
}

const sanitizeAttributes = (rawAttributes: string): string => {
    const attributes: string[] = []

    for (const match of rawAttributes.matchAll(attributePattern)) {
        const [, name, rawValue] = match

        if (!name || !rawValue || !allowedAttributes.has(name)) continue

        const value = rawValue.replace(/^["']|["']$/g, "")

        if (isDangerousAttributeValue(value)) continue

        attributes.push(` ${name}="${escapeAttribute(value)}"`)
    }

    return attributes.join("")
}

const isDangerousAttributeValue = (value: string): boolean => /(?:javascript|data):/i.test(value)

const escapeAttribute = (value: string): string => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
