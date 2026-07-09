"use client"

import { FieldLabel, useField } from "@payloadcms/ui"
import type { TextFieldClientProps, Validate } from "payload"
import type { ElementType, ReactNode } from "react"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { VirtuosoGrid } from "react-virtuoso"

import { sanitizeSvg } from "./sanitizeSvg.js"

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
const SEARCH_DEBOUNCE_MS = 150
const ALL_LIBRARY_FILTER = "__all"

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
    const { custom = {}, description, readOnly } = field.admin ?? {}
    const { label, required } = field
    const iconsFromField = custom.icons as IconFieldProps["icons"] | undefined
    const resolvedIcons = useMemo(() => normalizeIcons(iconsFromProps ?? iconsFromField), [iconsFromField, iconsFromProps])

    const { disabled, errorMessage, formProcessing, setValue, showError, value } = useField<string>({
        potentiallyStalePath: path,
        validate: validate as Validate | undefined,
    })
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [activeLibrary, setActiveLibrary] = useState(ALL_LIBRARY_FILTER)
    const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
    const isDisabled = Boolean(disabled || readOnly || formProcessing)

    const selectedIcon = useMemo(() => resolvedIcons.find((icon) => resolveIcon(icon) === value), [resolvedIcons, resolveIcon, value])

    const iconLibraries = useMemo(() => {
        const libraries = new Set<string>()

        resolvedIcons.forEach((icon) => {
            const library = getIconLibrary(icon, resolveIcon)

            if (library) {
                libraries.add(library)
            }
        })

        return Array.from(libraries)
    }, [resolvedIcons, resolveIcon])

    const filteredIcons = useMemo(() => {
        const normalizedQuery = debouncedQuery.trim().toLowerCase()
        const libraryFilteredIcons =
            activeLibrary === ALL_LIBRARY_FILTER ? resolvedIcons : resolvedIcons.filter((icon) => getIconLibrary(icon, resolveIcon) === activeLibrary)

        if (!normalizedQuery) {
            return libraryFilteredIcons
        }

        return libraryFilteredIcons.filter((icon) => getIconSearchText(icon).includes(normalizedQuery))
    }, [activeLibrary, debouncedQuery, resolvedIcons, resolveIcon])

    const openDialog = useCallback(() => {
        if (isDisabled) return
        setIsDialogOpen(true)
    }, [isDisabled])

    const closeDialog = useCallback(() => {
        setIsDialogOpen(false)
        setQuery("")
        setActiveLibrary(ALL_LIBRARY_FILTER)
    }, [])

    useEffect(() => {
        if (!isDialogOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closeDialog()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [closeDialog, isDialogOpen])

    useEffect(() => {
        if (isDisabled && isDialogOpen) {
            closeDialog()
        }
    }, [closeDialog, isDisabled, isDialogOpen])

    return (
        <div className="field-type text payload-icon-picker">
            <FieldLabel label={label} path={path} required={required} />

            {description ? <div className="field-description">{description as ReactNode}</div> : null}

            <div style={{ display: "grid", gap: 8 }}>
                <button
                    aria-haspopup="dialog"
                    aria-expanded={isDialogOpen}
                    aria-disabled={isDisabled}
                    disabled={isDisabled}
                    onClick={openDialog}
                    style={{
                        alignItems: "center",
                        background: "var(--theme-input-bg)",
                        border: "1px solid var(--theme-elevation-150)",
                        borderRadius: 4,
                        color: isDisabled ? "var(--theme-elevation-500)" : "inherit",
                        cursor: isDisabled ? "not-allowed" : "pointer",
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
                        {selectedIcon ? <IconLabel icon={selectedIcon} resolveIcon={resolveIcon} /> : value || placeholder}
                    </span>
                    {value ? (
                        <span
                            onClick={(event) => {
                                event.stopPropagation()
                                if (isDisabled) {
                                    return
                                }

                                setValue("")
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    if (isDisabled) {
                                        return
                                    }

                                    setValue("")
                                }
                            }}
                            role="button"
                            tabIndex={isDisabled ? -1 : 0}
                            style={{
                                borderLeft: "1px solid var(--theme-elevation-150)",
                                color: "var(--theme-elevation-600)",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                paddingLeft: 10,
                            }}
                        >
                            Clear
                        </span>
                    ) : null}
                </button>

                {isDialogOpen ? (
                    <div
                        aria-modal="true"
                        onClick={closeDialog}
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
                        <style>
                            {`
                                .payload-icon-picker__virtual-grid {
                                    display: grid;
                                    gap: 8px;
                                    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
                                    padding-right: 2px;
                                }

                                .payload-icon-picker__virtual-grid-item {
                                    min-width: 0;
                                }
                            `}
                        </style>
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
                                <button onClick={closeDialog} type="button">
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

                            {iconLibraries.length > 1 ? (
                                <div
                                    aria-label="Filter icons by library"
                                    role="group"
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                    }}
                                >
                                    <LibraryFilterButton
                                        isActive={activeLibrary === ALL_LIBRARY_FILTER}
                                        label="All"
                                        onClick={() => setActiveLibrary(ALL_LIBRARY_FILTER)}
                                    />
                                    {iconLibraries.map((library) => (
                                        <LibraryFilterButton
                                            isActive={activeLibrary === library}
                                            key={library}
                                            label={library}
                                            onClick={() => setActiveLibrary(library)}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {filteredIcons.length > 0 ? (
                                <VirtuosoGrid
                                    aria-label="Icon options"
                                    className="payload-icon-picker__virtual-scroller"
                                    itemClassName="payload-icon-picker__virtual-grid-item"
                                    itemContent={(index) => {
                                        const icon = filteredIcons[index]

                                        if (!icon) {
                                            return null
                                        }

                                        const iconValue = resolveIcon(icon)
                                        const isSelected = iconValue === value

                                        return (
                                            <button
                                                aria-selected={isSelected}
                                                key={iconValue}
                                                onClick={() => {
                                                    if (isDisabled) {
                                                        return
                                                    }

                                                    setValue(iconValue)
                                                    closeDialog()
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
                                                    width: "100%",
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
                                                    <IconLabel icon={icon} resolveIcon={resolveIcon} />
                                                </span>
                                            </button>
                                        )
                                    }}
                                    listClassName="payload-icon-picker__virtual-grid"
                                    role="listbox"
                                    style={{
                                        height: "min(440px, calc(100vh - 260px))",
                                        minHeight: 220,
                                        overflowY: "auto",
                                    }}
                                    totalCount={filteredIcons.length}
                                />
                            ) : (
                                <div>{noResultsLabel}</div>
                            )}

                            {value ? (
                                <button
                                    onClick={() => {
                                        if (isDisabled) {
                                            return
                                        }

                                        setValue("")
                                        closeDialog()
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

const LibraryFilterButton = ({ isActive, label, onClick }: { isActive: boolean; label: string; onClick: () => void }) => (
    <button
        aria-pressed={isActive}
        onClick={onClick}
        style={{
            background: isActive ? "var(--theme-elevation-100)" : "transparent",
            border: `1px solid ${isActive ? "var(--theme-elevation-400)" : "var(--theme-elevation-150)"}`,
            borderRadius: 4,
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
            minHeight: 30,
            padding: "4px 10px",
        }}
        type="button"
    >
        {label}
    </button>
)

const useDebouncedValue = <Value,>(value: Value, delay: number): Value => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedValue(value), delay)

        return () => window.clearTimeout(timeout)
    }, [delay, value])

    return debouncedValue
}

const IconLabel = ({ icon, resolveIcon }: { icon: IconFieldIcon; resolveIcon: (icon: IconFieldIcon) => string }) => {
    const { name, prefix } = getIconLabelParts(icon, resolveIcon)

    if (!prefix) {
        return <>{name}</>
    }

    return (
        <>
            <span style={{ color: "var(--theme-elevation-600)" }}>{prefix}:</span>
            {name}
        </>
    )
}

const getIconLabelParts = (
    icon: IconFieldIcon,
    resolveIcon: (icon: IconFieldIcon) => string
): {
    name: string
    prefix?: string
} => {
    const label = icon.label ?? icon.name
    const labelParts = splitPrefixedValue(label)

    if (labelParts) {
        return labelParts
    }

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

const getIconLibrary = (icon: IconFieldIcon, resolveIcon: (icon: IconFieldIcon) => string): string | undefined => splitPrefixedValue(resolveIcon(icon))?.prefix

const splitPrefixedValue = (value: string): { name: string; prefix: string } | undefined => {
    const separatorIndex = value.indexOf(":")

    if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
        return undefined
    }

    return {
        name: value.slice(separatorIndex + 1),
        prefix: value.slice(0, separatorIndex),
    }
}

const IconPreview = ({ icon }: { icon: IconFieldIcon }) => {
    const PreviewIcon = icon.Icon ?? icon.component

    if (PreviewIcon) {
        return <PreviewIcon aria-hidden focusable={false} size={24} />
    }

    if (icon.svg) {
        const sanitizedSvg = sanitizeSvg(icon.svg)

        if (sanitizedSvg) {
            return <span aria-hidden dangerouslySetInnerHTML={{ __html: sanitizedSvg }} style={{ display: "inline-flex", lineHeight: 1 }} />
        }
    }

    return (
        <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>
            {icon.label?.charAt(0) ?? icon.name.charAt(0)}
        </span>
    )
}
