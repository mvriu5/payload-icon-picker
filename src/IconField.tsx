"use client"

import { FieldLabel, useField } from "@payloadcms/ui"
import { icons as lucideIcons } from "lucide-react"
import type { TextFieldClientProps, Validate } from "payload"
import type { ElementType, ReactNode } from "react"
import React, { useMemo, useState } from "react"

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

export type IconFieldProps = TextFieldClientProps & {
    icons?: IconFieldIcon[] | IconFieldIconRecord
    noResultsLabel?: string
    placeholder?: string
    resolveIcon?: (icon: IconFieldIcon) => string
}

const defaultResolveIcon = (icon: IconFieldIcon): string => icon.value ?? icon.name

const normalizeIcons = (icons: IconFieldIcon[] | IconFieldIconRecord | undefined): IconFieldIcon[] => {
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

const getIconSearchText = (icon: IconFieldIcon): string => [icon.name, icon.label, icon.value, ...(icon.keywords ?? [])].filter(Boolean).join(" ").toLowerCase()

export const IconField: React.FC<IconFieldProps> = ({
    field,
    icons: iconsFromProps,
    noResultsLabel = "No icons found",
    path,
    placeholder = "Search icons",
    resolveIcon = defaultResolveIcon,
    validate,
}) => {
    const { custom = {}, description } = field.admin ?? {}
    const { label, required } = field
    const iconsFromField = custom.icons as IconFieldProps["icons"] | undefined
    const resolvedIcons = useMemo(() => normalizeIcons(iconsFromProps ?? iconsFromField), [iconsFromField, iconsFromProps])

    const { errorMessage, setValue, showError, value } = useField<string>({
        path,
        validate: validate as Validate | undefined,
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [query, setQuery] = useState("")

    const selectedIcon = useMemo(() => resolvedIcons.find((icon) => resolveIcon(icon) === value), [resolvedIcons, resolveIcon, value])

    const filteredIcons = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        if (!normalizedQuery) {
            return resolvedIcons
        }

        return resolvedIcons.filter((icon) => getIconSearchText(icon).includes(normalizedQuery))
    }, [query, resolvedIcons])

    return (
        <div className="field-type text payload-icon-picker">
            <FieldLabel label={label} path={path} required={required} />

            {description ? <div className="field-description">{description as ReactNode}</div> : null}

            <div style={{ display: "grid", gap: 8 }}>
                <button
                    aria-haspopup="dialog"
                    aria-expanded={isDialogOpen}
                    onClick={() => setIsDialogOpen(true)}
                    style={{
                        alignItems: "center",
                        background: "var(--theme-input-bg)",
                        border: "1px solid var(--theme-elevation-150)",
                        borderRadius: 4,
                        color: "inherit",
                        cursor: "pointer",
                        display: "flex",
                        font: "inherit",
                        gap: 10,
                        minHeight: 40,
                        padding: "8px 10px",
                        textAlign: "left",
                        width: "100%",
                    }}
                    type="button"
                >
                    {selectedIcon ? <IconPreview icon={selectedIcon} /> : null}
                    <span
                        style={{
                            color: selectedIcon ? "inherit" : "var(--theme-elevation-500)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {selectedIcon ? (selectedIcon.label ?? selectedIcon.name) : placeholder}
                    </span>
                    {value ? <code>{value}</code> : null}
                </button>

                {value ? (
                    <button onClick={() => setValue("")} style={{ justifySelf: "start" }} type="button">
                        Clear
                    </button>
                ) : null}

                {isDialogOpen ? (
                    <div
                        aria-modal="true"
                        onClick={() => setIsDialogOpen(false)}
                        role="dialog"
                        style={{
                            alignItems: "center",
                            background: "rgb(0 0 0 / 45%)",
                            display: "flex",
                            inset: 0,
                            justifyContent: "center",
                            padding: 24,
                            position: "fixed",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                background: "var(--theme-bg)",
                                border: "1px solid var(--theme-elevation-150)",
                                borderRadius: 4,
                                boxShadow: "0 20px 60px rgb(0 0 0 / 30%)",
                                display: "grid",
                                gap: 16,
                                maxHeight: "min(720px, calc(100vh - 48px))",
                                maxWidth: 760,
                                overflow: "hidden",
                                padding: 20,
                                width: "100%",
                            }}
                        >
                            <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
                                <h3 style={{ flex: 1, fontSize: 18, margin: 0 }}>Select icon</h3>
                                <button onClick={() => setIsDialogOpen(false)} type="button">
                                    Close
                                </button>
                            </div>

                            <input
                                autoFocus
                                aria-label="Search icons"
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={placeholder}
                                style={{
                                    border: "1px solid var(--theme-elevation-150)",
                                    borderRadius: 4,
                                    font: "inherit",
                                    padding: "8px 10px",
                                    width: "100%",
                                }}
                                type="search"
                                value={query}
                            />

                            <div
                                aria-label="Icon options"
                                role="listbox"
                                style={{
                                    display: "grid",
                                    gap: 8,
                                    gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))",
                                    minHeight: 160,
                                    overflow: "auto",
                                    paddingRight: 2,
                                }}
                            >
                                {filteredIcons.length > 0 ? (
                                    filteredIcons.map((icon) => {
                                        const iconValue = resolveIcon(icon)
                                        const isSelected = iconValue === value

                                        return (
                                            <button
                                                aria-selected={isSelected}
                                                key={iconValue}
                                                onClick={() => {
                                                    setValue(iconValue)
                                                    setIsDialogOpen(false)
                                                }}
                                                role="option"
                                                style={{
                                                    alignItems: "center",
                                                    background: isSelected ? "var(--theme-elevation-100)" : "transparent",
                                                    border: `1px solid ${isSelected ? "var(--theme-success-500)" : "var(--theme-elevation-150)"}`,
                                                    borderRadius: 4,
                                                    cursor: "pointer",
                                                    display: "grid",
                                                    gap: 6,
                                                    justifyItems: "center",
                                                    minHeight: 82,
                                                    padding: 8,
                                                }}
                                                title={icon.label ?? icon.name}
                                                type="button"
                                            >
                                                <IconPreview icon={icon} />
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        maxWidth: "100%",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {icon.label ?? icon.name}
                                                </span>
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div>{noResultsLabel}</div>
                                )}
                            </div>

                            {value ? (
                                <button
                                    onClick={() => {
                                        setValue("")
                                        setIsDialogOpen(false)
                                    }}
                                    style={{
                                        justifySelf: "start",
                                    }}
                                    type="button"
                                >
                                    Clear selection
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>

            {showError && errorMessage ? <div className="field-error">{errorMessage}</div> : null}
        </div>
    )
}

const IconPreview = ({ icon }: { icon: IconFieldIcon }) => {
    const PreviewIcon = icon.Icon ?? icon.component
    const LucideIcon = lucideIcons[icon.name as keyof typeof lucideIcons]

    if (PreviewIcon) {
        return <PreviewIcon aria-hidden focusable={false} size={24} />
    }

    if (LucideIcon) {
        return <LucideIcon aria-hidden focusable={false} size={24} />
    }

    if (icon.svg) {
        return <span aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} style={{ display: "inline-flex", lineHeight: 1 }} />
    }

    return (
        <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>
            {icon.label?.charAt(0) ?? icon.name.charAt(0)}
        </span>
    )
}
