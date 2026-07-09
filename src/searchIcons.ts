import type { IconFieldIcon } from "./IconField.js"

type SearchableField = {
    tokens: string[]
    value: string
    weight: number
}

export const searchIcons = (icons: IconFieldIcon[], query: string): IconFieldIcon[] => {
    const normalizedQuery = normalizeSearchValue(query)
    const queryTokens = tokenizeSearchValue(query)

    if (!normalizedQuery || queryTokens.length === 0) {
        return icons
    }

    return icons
        .map((icon, index) => ({
            icon,
            index,
            score: scoreIconSearch(icon, normalizedQuery, queryTokens),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map(({ icon }) => icon)
}

export const tokenizeSearchValue = (value: string | undefined): string[] => {
    if (!value) return []

    const tokenizedValue = value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase()

    return tokenizedValue ? tokenizedValue.split(/\s+/) : []
}

const scoreIconSearch = (icon: IconFieldIcon, normalizedQuery: string, queryTokens: string[]): number => {
    const fields = getSearchableFields(icon)

    if (fields.length === 0) {
        return 0
    }

    let score = 0

    for (const queryToken of queryTokens) {
        const tokenScore = Math.max(...fields.map((field) => scoreQueryToken(field, queryToken)))
        if (tokenScore === 0) return 0

        score += tokenScore
    }

    const phraseScore = Math.max(...fields.map((field) => scoreQueryPhrase(field, normalizedQuery)))

    return score + phraseScore
}

const getSearchableFields = (icon: IconFieldIcon): SearchableField[] =>
    [
        createSearchableField(icon.label, 8),
        createSearchableField(icon.name, 7),
        createSearchableField(icon.value, 6),
        ...(icon.keywords ?? []).map((keyword) => createSearchableField(keyword, 4)),
    ].filter((field): field is SearchableField => Boolean(field))

const createSearchableField = (value: string | undefined, weight: number): SearchableField | undefined => {
    const tokens = tokenizeSearchValue(value)

    if (tokens.length === 0) return undefined

    return {
        tokens,
        value: tokens.join(" "),
        weight,
    }
}

const scoreQueryToken = (field: SearchableField, queryToken: string): number => {
    const tokenScores = field.tokens.map((token) => {
        if (token === queryToken) return 40
        if (token.startsWith(queryToken)) return 28
        if (token.includes(queryToken)) return 12

        return 0
    })

    return Math.max(...tokenScores) * field.weight
}

const scoreQueryPhrase = (field: SearchableField, normalizedQuery: string): number => {
    if (field.value === normalizedQuery) return 120 * field.weight
    if (field.value.startsWith(normalizedQuery)) return 72 * field.weight
    if (field.value.includes(normalizedQuery)) return 36 * field.weight

    return 0
}

const normalizeSearchValue = (value: string): string => tokenizeSearchValue(value).join(" ")
