import { describe, expect, it } from "vitest"

import { lucideIconAdapter } from "../../src/adapters/lucide.js"
import { tablerIconAdapter } from "../../src/adapters/tabler.js"

const createForwardRefIcon = (displayName: string, iconNode: Array<[string, Record<string, unknown>]>) => ({
    displayName,
    render: () => ({
        props: {
            iconNode,
        },
    }),
})

describe("lucideIconAdapter", () => {
    it("converts forwardRef icon nodes to serializable SVG icons", () => {
        const icons = lucideIconAdapter({
            Home: createForwardRefIcon("House", [["path", { d: "M3 10 12 3l9 7", key: "home" }]]),
            createLucideIcon: () => null,
        })

        expect(icons).toEqual([
            {
                label: "House",
                name: "Home",
                svg: '<svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M3 10 12 3l9 7" /></svg>',
                value: "Home",
            },
        ])
    })

    it("supports include and exclude filters", () => {
        const icons = lucideIconAdapter(
            {
                Home: createForwardRefIcon("Home", [["path", { d: "M1 1" }]]),
                Search: createForwardRefIcon("Search", [["circle", { cx: 12, cy: 12, r: 8 }]]),
            },
            {
                exclude: ["Search"],
                include: ["Home", "Search"],
            }
        )

        expect(icons.map((icon) => icon.name)).toEqual(["Home"])
    })

    it("can prefix labels and values while keeping raw icon names", () => {
        const icons = lucideIconAdapter(
            {
                Home: createForwardRefIcon("Home", [["path", { d: "M1 1" }]]),
            },
            {
                prefix: "lucide",
            }
        )

        expect(icons[0]).toMatchObject({
            label: "lucide:Home",
            name: "Home",
            value: "lucide:Home",
        })
    })
})

describe("tablerIconAdapter", () => {
    it("converts tabler-style rendered SVG elements to serializable SVG icons", () => {
        const icons = tablerIconAdapter({
            IconHome: {
                displayName: "IconHome",
                render: () => ({
                    props: {
                        children: [
                            undefined,
                            {
                                props: {
                                    d: "M5 12l7-7 7 7",
                                },
                                type: "path",
                            },
                            {
                                props: {
                                    d: "M5 12v7h14v-7",
                                },
                                type: "path",
                            },
                        ],
                    },
                    type: "svg",
                }),
            },
        })

        expect(icons[0]).toMatchObject({
            label: "IconHome",
            name: "IconHome",
            value: "IconHome",
        })
        expect(icons[0]?.svg).toContain('<path d="M5 12l7-7 7 7" />')
        expect(icons[0]?.svg).toContain('<path d="M5 12v7h14v-7" />')
    })

    it("supports custom label and value formatters", () => {
        const icons = tablerIconAdapter(
            {
                IconHome: {
                    displayName: "IconHome",
                    render: () => ({
                        props: {
                            children: [
                                {
                                    props: {
                                        d: "M5 12l7-7 7 7",
                                    },
                                    type: "path",
                                },
                            ],
                        },
                        type: "svg",
                    }),
                },
            },
            {
                label: ({ defaultLabel, prefix }) => `${prefix}:${defaultLabel.replace(/^Icon/, "")}`,
                prefix: "tabler",
                value: ({ name, prefix }) => `${prefix}:${name}`,
            }
        )

        expect(icons[0]).toMatchObject({
            label: "tabler:Home",
            name: "IconHome",
            value: "tabler:IconHome",
        })
    })
})
