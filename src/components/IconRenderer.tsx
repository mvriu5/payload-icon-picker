import type { HTMLAttributes, ReactNode } from "react"
import React, { useMemo } from "react"

import { sanitizeSvg } from "../sanitizeSvg.js"
import type { IconFieldIcon, IconFieldIconRecord } from "../utils.js"
import { defaultResolveIcon, normalizeIcons } from "../utils.js"

export type IconRendererProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "dangerouslySetInnerHTML"> & {
    fallback?: ReactNode
    icons: IconFieldIcon[] | IconFieldIconRecord
    /**
     * Maps registered icons to the stored string. Pass this when your stored
     * values were produced with a custom `payloadIconPlugin({ resolveIcon })`.
     */
    resolveIcon?: (icon: IconFieldIcon) => string
    size?: number | string
    value?: null | string
}

export const IconRenderer: React.FC<IconRendererProps> = ({
    className,
    fallback = null,
    icons,
    resolveIcon = defaultResolveIcon,
    size = 24,
    title,
    value,
    ...props
}) => {
    const resolvedIcon = useMemo(() => {
        if (!value) {
            return undefined
        }

        return normalizeIcons(icons).find((icon) => resolveIcon(icon) === value)
    }, [icons, resolveIcon, value])

    if (!resolvedIcon) {
        return <>{fallback}</>
    }

    if (resolvedIcon.svg) {
        const sanitizedSvg = sanitizeSvg(resolvedIcon.svg)

        if (sanitizedSvg) {
            return (
                <span
                    aria-hidden={title ? undefined : true}
                    className={className}
                    dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
                    title={title}
                    {...props}
                />
            )
        }
    }

    const Icon = resolvedIcon.Icon ?? resolvedIcon.component

    if (Icon) {
        return (
            <span aria-hidden={title ? undefined : true} className={className} title={title} {...props}>
                <Icon aria-hidden focusable={false} size={size} />
            </span>
        )
    }

    return <>{fallback}</>
}
