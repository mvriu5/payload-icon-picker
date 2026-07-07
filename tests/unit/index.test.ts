import { describe, expect, it } from "vitest"

import { createIconResolver, iconField, payloadIconPlugin } from "../../src/index.js"

const SearchIcon = () => null
const HomeIcon = () => null

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
})

describe("payloadIconPlugin", () => {
    it("attaches the icon picker component to marked collection and nested global fields", () => {
        const config = payloadIconPlugin({
            icons: {
                Home: HomeIcon,
                Search: SearchIcon,
            },
            resolveIcon: ({ name }) => `lucide:${name}`,
        })({
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

        const postIconField = config.collections?.[0]?.fields[0]
        const navigationItemsField = config.globals?.[0]?.fields[0] as {
            fields: Array<{ admin?: { components?: { Field?: { clientProps?: { icons?: Array<{ value: string }> }; path?: string } } } }>
        }
        const navigationIconField = navigationItemsField.fields[0]

        expect(postIconField?.admin?.components?.Field).toMatchObject({
            path: "@mvriu5/payload-icon-picker/client#IconField",
        })
        expect(navigationIconField.admin?.components?.Field).toMatchObject({
            path: "@mvriu5/payload-icon-picker/client#IconField",
        })
        expect(postIconField?.admin?.components?.Field?.clientProps?.icons).toEqual([
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

    it("does not attach admin components when disabled", () => {
        const config = payloadIconPlugin({
            disabled: true,
            icons: {
                Home: HomeIcon,
            },
        })({
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

        expect(config.collections?.[0]?.fields[0]?.admin?.components).toBeUndefined()
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
})
