import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"
import { iconField, payloadIconPlugin } from "@mvriu5/payload-icon-picker"
import { icons as tablerIcons } from "@tabler/icons-react"
import { icons as lucideIcons } from "lucide-react"
import { lucideIconAdapter } from "../src/adapters/lucide.js"
import { tablerIconAdapter } from "../src/adapters/tabler.js"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
    process.env.ROOT_DIR = dirname
}

export default buildConfig({
    admin: {
        importMap: {
            baseDir: path.resolve(dirname),
        },
        user: "users",
    },
    localization: {
        defaultLocale: "en",
        fallback: true,
        locales: [
            {
                code: "en",
                label: "English",
            },
            {
                code: "de",
                label: "Deutsch",
            },
        ],
    },
    collections: [
        {
            slug: "users",
            auth: true,
            versions: true,
            fields: [],
        },
        {
            slug: "posts",
            admin: {
                defaultColumns: ["title", "status", "category", "featured", "publishedAt"],
                useAsTitle: "title",
            },
            versions: true,
            fields: [
                {
                    name: "title",
                    localized: true,
                    type: "text",
                    required: true,
                },
                iconField({
                    name: "icon",
                    label: "Icon",
                    admin: {
                        description: "Select an icon for this post.",
                    },
                }),
                {
                    name: "slug",
                    type: "text",
                    index: true,
                    unique: true,
                },
                {
                    name: "excerpt",
                    localized: true,
                    type: "textarea",
                },
                {
                    name: "content",
                    localized: true,
                    type: "richText",
                },
                {
                    name: "status",
                    type: "select",
                    defaultValue: "draft",
                    options: [
                        {
                            label: "Draft",
                            value: "draft",
                        },
                        {
                            label: "Published",
                            value: "published",
                        },
                        {
                            label: "Archived",
                            value: "archived",
                        },
                    ],
                },
                {
                    name: "category",
                    type: "radio",
                    defaultValue: "news",
                    options: [
                        {
                            label: "News",
                            value: "news",
                        },
                        {
                            label: "Guide",
                            value: "guide",
                        },
                        {
                            label: "Opinion",
                            value: "opinion",
                        },
                    ],
                },
                {
                    name: "featured",
                    type: "checkbox",
                    defaultValue: false,
                },
                {
                    name: "publishedAt",
                    type: "date",
                    admin: {
                        date: {
                            pickerAppearance: "dayAndTime",
                        },
                    },
                },
                {
                    name: "heroImage",
                    type: "upload",
                    relationTo: "media",
                },
                {
                    name: "tags",
                    type: "array",
                    fields: [
                        {
                            name: "label",
                            type: "text",
                            required: true,
                        },
                    ],
                },
                {
                    name: "seo",
                    type: "group",
                    localized: true,
                    fields: [
                        {
                            name: "title",
                            type: "text",
                        },
                        {
                            name: "description",
                            type: "textarea",
                        },
                    ],
                },
                {
                    name: "relatedPosts",
                    type: "relationship",
                    hasMany: true,
                    relationTo: "posts",
                },
                {
                    name: "metadata",
                    type: "json",
                },
            ],
        },
        {
            slug: "media",
            fields: [],
            versions: true,
            upload: {
                staticDir: path.resolve(dirname, "media"),
            },
        },
    ],
    globals: [
        {
            slug: "site-settings",
            label: "Site Settings",
            versions: true,
            fields: [
                {
                    name: "siteName",
                    localized: true,
                    type: "text",
                    required: true,
                },
                {
                    name: "defaultSeo",
                    type: "group",
                    localized: true,
                    fields: [
                        {
                            name: "title",
                            type: "text",
                        },
                        {
                            name: "description",
                            type: "textarea",
                        },
                    ],
                },
            ],
        },
        {
            slug: "navigation",
            label: "Navigation",
            versions: true,
            fields: [
                {
                    name: "items",
                    type: "array",
                    fields: [
                        {
                            name: "label",
                            localized: true,
                            type: "text",
                            required: true,
                        },
                        iconField({
                            name: "icon",
                            label: "Icon",
                        }),
                        {
                            name: "url",
                            type: "text",
                            required: true,
                        },
                    ],
                },
            ],
        },
    ],
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
    }),
    editor: lexicalEditor(),
    plugins: [
        payloadIconPlugin({
            icons: tablerIconAdapter(tablerIcons),
        }),
    ],
    secret: process.env.PAYLOAD_SECRET!,
    sharp,
    typescript: {
        outputFile: path.resolve(dirname, "payload-types.ts"),
    },
})
