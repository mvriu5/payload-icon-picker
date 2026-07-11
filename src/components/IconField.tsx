"use client"

import { FieldLabel, useField } from "@payloadcms/ui"
import type { TextFieldClientProps, Validate } from "payload"
import type { ReactNode } from "react"
import React, { useCallback, useEffect, useMemo, useState } from "react"

import "./IconDialog.css"
import "./IconField.css"
import { IconDialog, IconLabel, IconPreview } from "./IconDialog.js"
import type { IconFieldIcon, IconFieldIconRecord } from "../utils.js"
import { defaultResolveIcon, normalizeIcons } from "../utils.js"

export type IconFieldProps = TextFieldClientProps & {
    icons?: IconFieldIcon[] | IconFieldIconRecord
    noResultsLabel?: string
    placeholder?: string
    /**
     * Primarily for direct component usage. With `payloadIconPlugin()`, icon
     * values are already resolved before they reach this component.
     */
    resolveIcon?: (icon: IconFieldIcon) => string
}

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
    const isDisabled = Boolean(disabled || readOnly || formProcessing)

    const selectedIcon = useMemo(() => resolvedIcons.find((icon) => resolveIcon(icon) === value), [resolvedIcons, resolveIcon, value])

    const openDialog = useCallback(() => {
        if (isDisabled) return
        setIsDialogOpen(true)
    }, [isDisabled])

    const closeDialog = useCallback(() => {
        setIsDialogOpen(false)
    }, [])

    const clearValue = useCallback(() => {
        if (isDisabled) return
        setValue("")
    }, [isDisabled, setValue])

    const selectIcon = useCallback(
        (iconValue: string) => {
            if (isDisabled) return
            setValue(iconValue)
            closeDialog()
        },
        [closeDialog, isDisabled, setValue]
    )

    useEffect(() => {
        if (isDisabled && isDialogOpen) {
            closeDialog()
        }
    }, [closeDialog, isDisabled, isDialogOpen])

    return (
        <div className="field-type text payload-icon-picker">
            <FieldLabel label={label} path={path} required={required} />

            {description && <div className="field-description">{description as ReactNode}</div>}

            <div className="payload-icon-picker__control">
                <button
                    aria-disabled={isDisabled}
                    aria-expanded={isDialogOpen}
                    aria-haspopup="dialog"
                    className="payload-icon-picker__trigger"
                    disabled={isDisabled}
                    onClick={openDialog}
                    type="button"
                >
                    {selectedIcon && <IconPreview icon={selectedIcon} />}
                    <span className={`payload-icon-picker__trigger-label${selectedIcon ? "" : " payload-icon-picker__trigger-label--placeholder"}`}>
                        {selectedIcon ? <IconLabel icon={selectedIcon} resolveIcon={resolveIcon} /> : value || placeholder}
                    </span>
                    {value && (
                        <span
                            aria-disabled={isDisabled}
                            className="payload-icon-picker__clear-inline"
                            onClick={(event) => {
                                event.stopPropagation()
                                clearValue()
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    clearValue()
                                }
                            }}
                            role="button"
                            tabIndex={isDisabled ? -1 : 0}
                        >
                            Clear
                        </span>
                    )}
                </button>

                {isDialogOpen && (
                    <IconDialog
                        icons={resolvedIcons}
                        isDisabled={isDisabled}
                        noResultsLabel={noResultsLabel}
                        onClear={() => {
                            clearValue()
                            closeDialog()
                        }}
                        onClose={closeDialog}
                        onSelect={selectIcon}
                        placeholder={placeholder}
                        resolveIcon={resolveIcon}
                        value={value}
                    />
                )}
            </div>

            {showError && errorMessage && <div className="field-error">{errorMessage}</div>}
        </div>
    )
}
