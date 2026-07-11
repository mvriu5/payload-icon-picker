import { afterEach, describe, expect, it, vi } from "vitest"
import type { Config } from "payload"

import { createIconResolver, iconField, payloadIconPlugin } from "../../src/index.js"

const SearchIcon = () => null
const HomeIcon = () => null

const createTestConfig = (config: Partial<Config>): Config => config as Config
const getIconFieldComponent = (field: unknown) =>
    (field as { admin?: { components?: { Field?: { clientProps?: { icons?: Array<{ name: string; svg?: string; value: string }> }; path?: string } } } }).admin
        ?.components?.Field

afterEach(() => {
    vi.restoreAllMocks()
})

describe("iconField", () => {
    it("creates a single-value text field marked for the icon picker", () => {
        const field = iconField({
            name: "icon",
            label: "Icon",
            placeholder: "Find icon",
            required: true,
        })

        expect(field).toMatchObject({
            hasMany: false,
            label: "Icon",
            name: "icon",
            required: true,
            type: "text",
        })
        expect(field.admin?.custom).toMatchObject({
            payloadIconPicker: {
                placeholder: "Find icon",
            },
        })
    })

    it("preserves existing admin options and custom metadata", () => {
        const field = iconField({
            admin: {
                custom: {
                    existing: true,
                },
                position: "sidebar",
            },
            name: "icon",
        })

        expect(field.admin?.position).toBe("sidebar")
        expect(field.admin?.custom).toMatchObject({
            existing: true,
            payloadIconPicker: {},
        })
    })

    it("stores per-field icon library and value filters in custom metadata", () => {
        const field = iconField({
            icons: ["si:SiGithub"],
            libraries: ["lucide"],
            name: "icon",
        })

        expect(field.admin?.custom).toMatchObject({
            payloadIconPicker: {
                icons: ["si:SiGithub"],
                libraries: ["lucide"],
            },
        })
    })
})

describe("payloadIconPlugin", () => {
    it("attaches the icon picker component to marked collection and nested global fields", () => {
        const config = payloadIconPlugin({
            icons: {
                Home: HomeIcon,
                Search: SearchIcon,
            },
            resolveIcon: ({ name }) => `lucide:${name}`,
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                name: "icon",
                            }),
                        ],
                    },
                ],
                globals: [
                    {
                        slug: "navigation",
                        fields: [
                            {
                                name: "items",
                                type: "array",
                                fields: [
                                    iconField({
                                        name: "icon",
                                    }),
                                ],
                            },
                        ],
                    },
                ],
            })
        )

        const postIconField = config.collections?.[0]?.fields[0]
        const navigationItemsField = config.globals?.[0]?.fields[0] as {
            fields: Array<{ admin?: { components?: { Field?: { clientProps?: { icons?: Array<{ value: string }> }; path?: string } } } }>
        }
        const navigationIconField = navigationItemsField.fields[0]
        const postIconFieldComponent = getIconFieldComponent(postIconField)

        expect(postIconFieldComponent).toMatchObject({
            path: "@mvriu5/payload-icon-picker/client#IconField",
        })
        expect(navigationIconField.admin?.components?.Field).toMatchObject({
            path: "@mvriu5/payload-icon-picker/client#IconField",
        })
        expect(postIconFieldComponent?.clientProps?.icons).toEqual([
            {
                name: "Home",
                value: "lucide:Home",
            },
            {
                name: "Search",
                value: "lucide:Search",
            },
        ])
    })

    it("sanitizes SVG metadata before passing icons to the admin client", () => {
        const config = payloadIconPlugin({
            icons: [
                {
                    name: "Unsafe",
                    svg: '<svg viewBox="0 0 24 24"><script>alert("xss")</script><path d="M1 1" /></svg>',
                },
            ],
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                name: "icon",
                            }),
                        ],
                    },
                ],
            })
        )

        expect(getIconFieldComponent(config.collections?.[0]?.fields[0])?.clientProps?.icons).toEqual([
            {
                name: "Unsafe",
                svg: undefined,
                value: "Unsafe",
            },
        ])
    })

    it("does not attach admin components when disabled", () => {
        const config = payloadIconPlugin({
            disabled: true,
            icons: {
                Home: HomeIcon,
            },
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                name: "icon",
                            }),
                        ],
                    },
                ],
            })
        )

        expect(config.collections?.[0]?.fields[0]?.admin?.components).toBeUndefined()
    })

    it("warns when registered icons resolve to duplicate values", () => {
        const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined)

        payloadIconPlugin({
            icons: [
                {
                    Icon: HomeIcon,
                    name: "Home",
                    value: "home",
                },
                {
                    Icon: SearchIcon,
                    name: "House",
                    value: "home",
                },
            ],
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                name: "icon",
                            }),
                        ],
                    },
                ],
            })
        )

        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining("Duplicate icon values detected"))
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('"home" used by "Home", "House"'))
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining("Use adapter prefixes to avoid collisions"))
    })

    it("limits an icon field to selected libraries and explicit icon values", () => {
        const config = payloadIconPlugin({
            icons: [
                {
                    Icon: HomeIcon,
                    name: "Home",
                    value: "lucide:Home",
                },
                {
                    Icon: SearchIcon,
                    name: "Search",
                    value: "tabler:IconSearch",
                },
                {
                    Icon: SearchIcon,
                    name: "SiGithub",
                    value: "si:SiGithub",
                },
            ],
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                icons: ["si:SiGithub"],
                                libraries: ["lucide"],
                                name: "icon",
                            }),
                        ],
                    },
                ],
            })
        )

        expect(getIconFieldComponent(config.collections?.[0]?.fields[0])?.clientProps?.icons).toEqual([
            {
                name: "Home",
                value: "lucide:Home",
            },
            {
                name: "SiGithub",
                value: "si:SiGithub",
            },
        ])
    })

    it("warns when field filters reference unknown icon values or libraries", () => {
        const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined)

        payloadIconPlugin({
            icons: [
                {
                    Icon: HomeIcon,
                    name: "Home",
                    value: "lucide:Home",
                },
            ],
        })(
            createTestConfig({
                collections: [
                    {
                        slug: "posts",
                        fields: [
                            iconField({
                                icons: ["si:SiGithub"],
                                libraries: ["tabler"],
                                name: "icon",
                            }),
                        ],
                    },
                ],
            })
        )

        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('iconField("icon") references unknown icon values: "si:SiGithub"'))
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('iconField("icon") references unknown icon libraries: "tabler"'))
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('iconField("icon") filter matched no icons'))
    })
})

describe("createIconResolver", () => {
    it("resolves stored strings back to registered icons", () => {
        const resolveIcon = createIconResolver({
            icons: {
                Home: HomeIcon,
                Search: SearchIcon,
            },
            resolveIcon: ({ name }) => `lucide:${name}`,
        })

        expect(resolveIcon("lucide:Home")).toMatchObject({
            Icon: HomeIcon,
            name: "Home",
            resolvedValue: "lucide:Home",
        })
        expect(resolveIcon("unknown")).toBeUndefined()
        expect(resolveIcon(undefined)).toBeUndefined()
    })

    it("uses explicit icon values by default", () => {
        const resolveIcon = createIconResolver({
            icons: [
                {
                    Icon: HomeIcon,
                    name: "Home",
                    value: "home",
                },
            ],
        })

        expect(resolveIcon("home")).toMatchObject({
            Icon: HomeIcon,
            name: "Home",
            resolvedValue: "home",
            value: "home",
        })
    })

    it("returns sanitized SVG metadata from resolved icons", () => {
        const resolveIcon = createIconResolver({
            icons: [
                {
                    name: "Unsafe",
                    svg: '<svg viewBox="0 0 24 24"><path d="M1 1" onload="alert(1)" /></svg>',
                    value: "unsafe",
                },
            ],
        })

        expect(resolveIcon("unsafe")).toMatchObject({
            name: "Unsafe",
            resolvedValue: "unsafe",
            svg: undefined,
            value: "unsafe",
        })
    })

    it("warns when duplicate values make stored icon resolution ambiguous", () => {
        const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined)

        const resolveIcon = createIconResolver({
            icons: [
                {
                    Icon: HomeIcon,
                    name: "Home",
                    value: "home",
                },
                {
                    Icon: SearchIcon,
                    name: "House",
                    value: "home",
                },
            ],
        })

        expect(resolveIcon("home")).toMatchObject({
            Icon: SearchIcon,
            name: "House",
        })
        expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining("Duplicate icon values detected"))
    })
})
