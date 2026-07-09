import { describe, expect, it } from "vitest"

import { searchIcons, tokenizeSearchValue } from "../../src/searchIcons.js"

describe("tokenizeSearchValue", () => {
    it("splits camel case, prefixes, and punctuation into searchable tokens", () => {
        expect(tokenizeSearchValue("tabler:IconArrowRight")).toEqual(["tabler", "icon", "arrow", "right"])
        expect(tokenizeSearchValue("SiGitHub")).toEqual(["si", "git", "hub"])
        expect(tokenizeSearchValue("arrow-right_2")).toEqual(["arrow", "right", "2"])
    })
})

describe("searchIcons", () => {
    it("matches camel-cased icon names with spaced queries", () => {
        const results = searchIcons(
            [
                {
                    name: "IconArrowLeft",
                },
                {
                    name: "IconArrowRight",
                },
            ],
            "arrow right"
        )

        expect(results.map((icon) => icon.name)).toEqual(["IconArrowRight"])
    })

    it("matches prefixed stored values without requiring the icon prefix", () => {
        const results = searchIcons(
            [
                {
                    label: "Home",
                    name: "IconHome",
                    value: "tabler:IconHome",
                },
            ],
            "tabler home"
        )

        expect(results.map((icon) => icon.name)).toEqual(["IconHome"])
    })

    it("uses keywords as searchable aliases", () => {
        const results = searchIcons(
            [
                {
                    keywords: ["remove", "delete"],
                    name: "Trash",
                },
                {
                    name: "Archive",
                },
            ],
            "delete"
        )

        expect(results.map((icon) => icon.name)).toEqual(["Trash"])
    })

    it("ranks stronger label and name matches before weaker keyword matches", () => {
        const results = searchIcons(
            [
                {
                    keywords: ["home"],
                    name: "House",
                },
                {
                    label: "Home",
                    name: "IconHome",
                },
            ],
            "home"
        )

        expect(results.map((icon) => icon.name)).toEqual(["IconHome", "House"])
    })
})
