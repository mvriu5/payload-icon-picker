import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-virtuoso", () => ({
    VirtuosoGrid: ({ itemContent, role, totalCount }: { itemContent: (index: number) => React.ReactNode; role?: string; totalCount: number }) => (
        <div role={role}>{Array.from({ length: totalCount }, (_, index) => itemContent(index))}</div>
    ),
}))

import { IconDialog } from "../../src/components/IconDialog.js"

describe("IconDialog", () => {
    it("renders dialog labelling, description, and labelled icon options", () => {
        const html = renderToStaticMarkup(
            <IconDialog
                icons={[
                    {
                        label: "Home",
                        name: "Home",
                        value: "home",
                    },
                ]}
                isDisabled={false}
                noResultsLabel="No icons found"
                onClear={() => undefined}
                onClose={() => undefined}
                onSelect={() => undefined}
                placeholder="Search icons"
                resolveIcon={(icon) => icon.value ?? icon.name}
                value="home"
            />
        )

        expect(html).toContain('role="dialog"')
        expect(html).toContain('aria-modal="true"')
        expect(html).toContain("aria-labelledby=")
        expect(html).toContain("aria-describedby=")
        expect(html).toContain('aria-label="Close icon picker"')
        expect(html).toContain('aria-label="Search icons"')
        expect(html).toContain('aria-label="Select Home"')
        expect(html).toContain('aria-selected="true"')
    })
})
