import React, { useEffect, useMemo, useState } from "react"
import { VirtuosoGrid } from "react-virtuoso"

import "./IconDialog.css"
import { sanitizeSvg } from "../sanitizeSvg.js"
import { searchIcons } from "../searchIcons.js"
import type { IconFieldIcon } from "../utils.js"
import { getIconLabelParts, getIconLibrary } from "../utils.js"

type IconDialogProps = {
    icons: IconFieldIcon[]
    isDisabled: boolean
    noResultsLabel: string
    onClear: () => void
    onClose: () => void
    onSelect: (value: string) => void
    placeholder: string
    resolveIcon: (icon: IconFieldIcon) => string
    value?: string
}

const SEARCH_DEBOUNCE_MS = 150
const ALL_LIBRARY_FILTER = "__all"

export const IconDialog: React.FC<IconDialogProps> = ({ icons, isDisabled, noResultsLabel, onClear, onClose, onSelect, placeholder, resolveIcon, value }) => {
    const [query, setQuery] = useState("")
    const [activeLibrary, setActiveLibrary] = useState(ALL_LIBRARY_FILTER)
    const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)

    const iconLibraries = useMemo(() => {
        const libraries = new Set<string>()

        icons.forEach((icon) => {
            const library = getIconLibrary(icon, resolveIcon)

            if (library) {
                libraries.add(library)
            }
        })

        return Array.from(libraries)
    }, [icons, resolveIcon])

    const filteredIcons = useMemo(() => {
        const normalizedQuery = debouncedQuery.trim().toLowerCase()
        const libraryFilteredIcons = activeLibrary === ALL_LIBRARY_FILTER ? icons : icons.filter((icon) => getIconLibrary(icon, resolveIcon) === activeLibrary)

        if (!normalizedQuery) {
            return libraryFilteredIcons
        }

        return searchIcons(libraryFilteredIcons, normalizedQuery)
    }, [activeLibrary, debouncedQuery, icons, resolveIcon])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                onClose()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onClose])

    return (
        <div aria-modal="true" className="payload-icon-picker__overlay" onClick={onClose} role="dialog">
            <div className="payload-icon-picker__dialog" onClick={(event) => event.stopPropagation()}>
                <div className="payload-icon-picker__dialog-header">
                    <h3 className="payload-icon-picker__dialog-title">Select icon</h3>
                    <button onClick={onClose} type="button">
                        Close
                    </button>
                </div>

                <input
                    autoFocus
                    aria-label="Search icons"
                    className="payload-icon-picker__search"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={placeholder}
                    type="search"
                    value={query}
                />

                {iconLibraries.length > 1 && (
                    <div aria-label="Filter icons by library" className="payload-icon-picker__library-filter" role="group">
                        <LibraryFilterButton isActive={activeLibrary === ALL_LIBRARY_FILTER} label="All" onClick={() => setActiveLibrary(ALL_LIBRARY_FILTER)} />
                        {iconLibraries.map((library) => (
                            <LibraryFilterButton isActive={activeLibrary === library} key={library} label={library} onClick={() => setActiveLibrary(library)} />
                        ))}
                    </div>
                )}

                {filteredIcons.length > 0 ? (
                    <VirtuosoGrid
                        aria-label="Icon options"
                        className="payload-icon-picker__virtual-scroller"
                        itemClassName="payload-icon-picker__virtual-grid-item"
                        itemContent={(index) => {
                            const icon = filteredIcons[index]
                            if (!icon) return null

                            const iconValue = resolveIcon(icon)
                            const isSelected = iconValue === value

                            return (
                                <button
                                    aria-selected={isSelected}
                                    className="payload-icon-picker__option"
                                    key={iconValue}
                                    onClick={() => {
                                        if (isDisabled) return
                                        onSelect(iconValue)
                                    }}
                                    role="option"
                                    title={icon.label ?? icon.name}
                                    type="button"
                                >
                                    <IconPreview icon={icon} />
                                    <span className="payload-icon-picker__option-label">
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

                {value && (
                    <button
                        className="payload-icon-picker__clear-selection"
                        onClick={() => {
                            if (isDisabled) {
                                return
                            }

                            onClear()
                        }}
                        type="button"
                    >
                        Clear selection
                    </button>
                )}
            </div>
        </div>
    )
}

const LibraryFilterButton = ({ isActive, label, onClick }: { isActive: boolean; label: string; onClick: () => void }) => (
    <button aria-pressed={isActive} className="payload-icon-picker__library-filter-button" onClick={onClick} type="button">
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

export const IconLabel = ({ icon, resolveIcon }: { icon: IconFieldIcon; resolveIcon: (icon: IconFieldIcon) => string }) => {
    const { name, prefix } = getIconLabelParts(icon, resolveIcon)

    if (!prefix) {
        return <>{name}</>
    }

    return (
        <>
            <span className="payload-icon-picker__prefix">{prefix}:</span>
            {name}
        </>
    )
}

export const IconPreview = ({ icon }: { icon: IconFieldIcon }) => {
    const PreviewIcon = icon.Icon ?? icon.component

    if (PreviewIcon) {
        return <PreviewIcon aria-hidden focusable={false} size={24} />
    }

    if (icon.svg) {
        const sanitizedSvg = sanitizeSvg(icon.svg)

        if (sanitizedSvg) {
            return <span aria-hidden className="payload-icon-picker__preview" dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
        }
    }

    return (
        <span aria-hidden className="payload-icon-picker__fallback-preview">
            {icon.label?.charAt(0) ?? icon.name.charAt(0)}
        </span>
    )
}
