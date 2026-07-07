import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const fieldState = vi.hoisted(() => ({
    setValue: vi.fn(),
    value: "",
}))

vi.mock("@payloadcms/ui", () => ({
    FieldLabel: ({ label, path, required }: { label?: string; path?: string; required?: boolean }) => (
        <label htmlFor={path}>
            {label}
            {required ? " *" : ""}
        </label>
    ),
    useField: () => ({
        disabled: false,
        errorMessage: undefined,
        formInitializing: false,
        formProcessing: false,
        formSubmitted: false,
        path: "icon",
        setValue: fieldState.setValue,
        showError: false,
        value: fieldState.value,
    }),
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
        fieldState.value = ""
    })

    it("renders a picker input with placeholder when no icon is selected", () => {
        const html = renderToStaticMarkup(
            <IconField
                field={baseField}
                path="icon"
                placeholder="Search icons"
            />,
        )

        expect(html).toContain("Icon")
        expect(html).toContain("Search icons")
        expect(html).toContain('aria-haspopup="dialog"')
        expect(html).not.toContain("Clear")
        expect(html).not.toContain('role="dialog"')
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
            />,
        )

        expect(html).toContain("Home")
        expect(html).toContain("Clear")
        expect(html).not.toContain("<code>home</code>")
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
            />,
        )

        expect(html).toContain("Custom")
        expect(html).toContain("<svg viewBox")
        expect(html).toContain('d="M4 4h16v16H4z"')
    })
})
