import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const fieldState = vi.hoisted(() => ({
    disabled: false,
    formProcessing: false,
    setValue: vi.fn(),
    useField: vi.fn(),
    value: "",
}))

vi.mock("@payloadcms/ui", () => ({
    FieldLabel: ({ label, path, required }: { label?: string; path?: string; required?: boolean }) => (
        <label htmlFor={path}>
            {label}
            {required ? " *" : ""}
        </label>
    ),
    useField: fieldState.useField,
}))

import { IconField } from "../../src/IconField.js"

const baseField = {
    admin: {},
    label: "Icon",
    name: "icon",
    type: "text" as const,
}

describe("IconField", () => {
    beforeEach(() => {
        fieldState.setValue.mockClear()
        fieldState.useField.mockReset()
        fieldState.useField.mockImplementation(() => ({
            disabled: fieldState.disabled,
            errorMessage: undefined,
            formInitializing: false,
            formProcessing: fieldState.formProcessing,
            formSubmitted: false,
            path: "icon",
            setValue: fieldState.setValue,
            showError: false,
            value: fieldState.value,
        }))
        fieldState.disabled = false
        fieldState.formProcessing = false
        fieldState.value = ""
    })

    it("renders a picker input with placeholder when no icon is selected", () => {
        const html = renderToStaticMarkup(<IconField field={baseField} path="icon" placeholder="Search icons" />)

        expect(html).toContain("Icon")
        expect(html).toContain("Search icons")
        expect(html).toContain('aria-haspopup="dialog"')
        expect(html).not.toContain("Clear")
        expect(html).not.toContain('role="dialog"')
        expect(fieldState.useField).toHaveBeenCalledWith({
            potentiallyStalePath: "icon",
            validate: undefined,
        })
    })

    it("shows the selected icon label in the input and clear action on the right", () => {
        fieldState.value = "home"

        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                icons={[
                    {
                        label: "Home",
                        name: "Home",
                        value: "home",
                    },
                ]}
                path="icon"
            />
        )

        expect(html).toContain("Home")
        expect(html).toContain("Clear")
        expect(html).not.toContain("<code>home</code>")
    })

    it("renders prefixed selected icon labels with a separated prefix", () => {
        fieldState.value = "tabler:IconHome"

        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                icons={[
                    {
                        label: "Home",
                        name: "IconHome",
                        value: "tabler:IconHome",
                    },
                ]}
                path="icon"
            />
        )

        expect(html).toContain("tabler:")
        expect(html).toContain("Home")
    })

    it("shows the stored string when it does not match a registered icon", () => {
        fieldState.value = "legacy-icon"

        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                icons={[
                    {
                        label: "Home",
                        name: "Home",
                        value: "home",
                    },
                ]}
                path="icon"
            />
        )

        expect(html).toContain("legacy-icon")
        expect(html).toContain("Clear")
    })

    it("renders SVG metadata for selected custom icons", () => {
        fieldState.value = "custom"

        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                icons={[
                    {
                        label: "Custom",
                        name: "Custom",
                        svg: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
                        value: "custom",
                    },
                ]}
                path="icon"
            />
        )

        expect(html).toContain("Custom")
        expect(html).toContain("<svg viewBox")
        expect(html).toContain('d="M4 4h16v16H4z"')
    })

    it("does not render unsafe SVG metadata for selected custom icons", () => {
        fieldState.value = "custom"

        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                icons={[
                    {
                        label: "Custom",
                        name: "Custom",
                        svg: '<svg viewBox="0 0 24 24"><script>alert("xss")</script><path d="M4 4h16v16H4z" /></svg>',
                        value: "custom",
                    },
                ]}
                path="icon"
            />
        )

        expect(html).toContain("Custom")
        expect(html).not.toContain("<script>")
        expect(html).not.toContain("alert")
        expect(html).not.toContain("<svg viewBox")
    })

    it("disables the picker while the field is disabled", () => {
        fieldState.disabled = true

        const html = renderToStaticMarkup(<IconField field={baseField} path="icon" />)

        expect(html).toContain("disabled")
        expect(html).toContain('aria-disabled="true"')
        expect(html).toContain("not-allowed")
    })

    it("disables the picker while the field is read-only", () => {
        const html = renderToStaticMarkup(
            <IconField
                field={{
                    ...baseField,
                    admin: {
                        readOnly: true,
                    },
                }}
                path="icon"
            />
        )

        expect(html).toContain("disabled")
        expect(html).toContain('aria-disabled="true"')
    })

    it("disables the picker while the form is processing", () => {
        fieldState.formProcessing = true

        const html = renderToStaticMarkup(<IconField field={baseField} path="icon" />)

        expect(html).toContain("disabled")
        expect(html).toContain('aria-disabled="true"')
    })
})
