import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { IconRenderer } from "../../src/components/IconRenderer.js"

const HomeIcon = ({ size }: { "aria-hidden"?: boolean; focusable?: boolean; size?: number | string }) => (
    <svg data-size={size} viewBox="0 0 24 24">
        <path d="M3 12 12 3l9 9" />
    </svg>
)

describe("IconRenderer", () => {
    it("renders registered React icon components from a stored value", () => {
        const html = renderToStaticMarkup(
            <IconRenderer
                className="post-icon"
                icons={[
                    {
                        Icon: HomeIcon,
                        name: "Home",
                        value: "home",
                    },
                ]}
                size={18}
                value="home"
            />
        )

        expect(html).toContain('class="post-icon"')
        expect(html).toContain('data-size="18"')
        expect(html).toContain('aria-hidden="true"')
    })

    it("renders sanitized SVG icon metadata", () => {
        const html = renderToStaticMarkup(
            <IconRenderer
                icons={[
                    {
                        name: "Custom",
                        svg: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
                        value: "custom",
                    },
                ]}
                value="custom"
            />
        )

        expect(html).toContain("<svg viewBox")
        expect(html).toContain('d="M4 4h16v16H4z"')
    })

    it("prefers sanitized SVG metadata over a React icon component", () => {
        const html = renderToStaticMarkup(
            <IconRenderer
                icons={[
                    {
                        Icon: HomeIcon,
                        name: "Custom",
                        svg: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>',
                        value: "custom",
                    },
                ]}
                value="custom"
            />
        )

        expect(html).toContain('d="M4 4h16v16H4z"')
        expect(html).not.toContain("data-size")
    })

    it("falls back to a React icon component when SVG metadata is invalid", () => {
        const html = renderToStaticMarkup(
            <IconRenderer
                icons={[
                    {
                        Icon: HomeIcon,
                        name: "Unsafe",
                        svg: '<svg><script>alert("xss")</script></svg>',
                        value: "unsafe",
                    },
                ]}
                size={18}
                value="unsafe"
            />
        )

        expect(html).toContain('data-size="18"')
        expect(html).not.toContain("<script>")
    })

    it("does not render unsafe SVG icon metadata", () => {
        const html = renderToStaticMarkup(
            <IconRenderer
                fallback={<span>Missing</span>}
                icons={[
                    {
                        name: "Unsafe",
                        svg: '<svg viewBox="0 0 24 24"><script>alert("xss")</script><path d="M4 4h16v16H4z" /></svg>',
                        value: "unsafe",
                    },
                ]}
                value="unsafe"
            />
        )

        expect(html).toContain("Missing")
        expect(html).not.toContain("<script>")
        expect(html).not.toContain("alert")
    })

    it("renders fallback when the stored value is unknown", () => {
        const html = renderToStaticMarkup(<IconRenderer fallback={<span>Fallback</span>} icons={{ Home: HomeIcon }} value="missing" />)

        expect(html).toContain("Fallback")
    })

    it("supports custom value resolution", () => {
        const html = renderToStaticMarkup(<IconRenderer icons={{ Home: HomeIcon }} resolveIcon={({ name }) => `lucide:${name}`} value="lucide:Home" />)

        expect(html).toContain("<svg")
    })
})
