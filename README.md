# Payload Icon Picker

Payload plugin for adding an icon picker field to the admin UI. The field stores a string, while editors can search and choose from the icons you register in the plugin config.

## Installation

```bash
pnpm add @mvriu5/payload-icon-picker
```

Install the icon library you want to use in your project, for example:

```bash
pnpm add lucide-react
```

## Usage

Register all icons once in your Payload config, then use `iconField()` wherever a Payload text field should become an icon picker.

```ts
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import * as Icons from "lucide-react"
import { buildConfig } from "payload"
import { iconField, payloadIconPlugin } from "@mvriu5/payload-icon-picker"
import { lucideIconAdapter } from "@mvriu5/payload-icon-picker/adapters/lucide"

export default buildConfig({
    collections: [
        {
            slug: "posts",
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: true,
                },
                iconField({
                    name: "icon",
                    label: "Icon",
                }),
            ],
        },
    ],
    plugins: [
        payloadIconPlugin({
            icons: lucideIconAdapter(Icons),
        }),
    ],
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL,
        },
    }),
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET,
})
```

## Stored Value

`iconField()` creates a normal Payload `text` field. The selected icon is resolved to a string and stored in the database.

By default, the stored value is `icon.value ?? icon.name`. Adapters can prefix generated values so multiple icon libraries do not collide:

```ts
payloadIconPlugin({
    icons: lucideIconAdapter(Icons, {
        prefix: "lucide",
    }),
})
```

Selecting `ArrowRight` would store:

```txt
lucide:ArrowRight
```

You can still use `resolveIcon` if you need a custom final storage format.

### About `resolveIcon`

When using `payloadIconPlugin()`, `resolveIcon` runs during Payload config setup. The resolved string is passed to the admin field as each icon's final `value`.

That means normal `iconField()` usage does not require passing `resolveIcon` to the admin component manually.

The `resolveIcon` prop on `IconRenderer`, `IconField`, and `createIconResolver()` is primarily for direct component usage, tests, or advanced cases where you bypass `payloadIconPlugin()`. If you use a custom `resolveIcon` for stored values, pass the same resolver when rendering or resolving those values outside the Payload admin UI.

## Rendering Stored Icons

Use `IconRenderer` from the client export to render a stored icon string in your frontend.

```tsx
import * as Icons from "lucide-react"
import { IconRenderer } from "@mvriu5/payload-icon-picker/client"
import { lucideIconAdapter } from "@mvriu5/payload-icon-picker/adapters/lucide"

const icons = lucideIconAdapter(Icons)

export function PostIcon({ icon }: { icon?: string }) {
    return <IconRenderer value={icon} icons={icons} className="post-icon" />
}
```

The renderer supports React icon components and adapter-generated SVG metadata. SVG output is sanitized before rendering.

If you need full control over rendering, use `createIconResolver()` to turn a stored string back into the registered icon.

```tsx
import * as Icons from "lucide-react"
import { createIconResolver } from "@mvriu5/payload-icon-picker"
import { lucideIconAdapter } from "@mvriu5/payload-icon-picker/adapters/lucide"

const resolveStoredIcon = createIconResolver({
    icons: lucideIconAdapter(Icons),
})

const resolvedIcon = resolveStoredIcon("Home")
```

## Icon Inputs

Use an adapter for supported icon libraries. Adapters convert React icon exports to serializable SVG metadata for the Payload admin UI.

```ts
import * as Icons from "lucide-react"
import { lucideIconAdapter } from "@mvriu5/payload-icon-picker/adapters/lucide"

payloadIconPlugin({
    icons: lucideIconAdapter(Icons),
})
```

```ts
import * as TablerIcons from "@tabler/icons-react"
import { tablerIconAdapter } from "@mvriu5/payload-icon-picker/adapters/tabler"

payloadIconPlugin({
    icons: tablerIconAdapter(TablerIcons),
})
```

```ts
import * as SimpleIcons from "@icons-pack/react-simple-icons"
import { simpleIconsAdapter } from "@mvriu5/payload-icon-picker/adapters/simple-icons"

payloadIconPlugin({
    icons: simpleIconsAdapter(SimpleIcons),
})
```

```ts
import * as Heroicons from "@heroicons/react/24/outline"
import { heroiconsAdapter } from "@mvriu5/payload-icon-picker/adapters/heroicons"

payloadIconPlugin({
    icons: heroiconsAdapter(Heroicons),
})
```

```ts
import * as PhosphorIcons from "@phosphor-icons/react"
import { phosphorIconAdapter } from "@mvriu5/payload-icon-picker/adapters/phosphor"

payloadIconPlugin({
    icons: phosphorIconAdapter(PhosphorIcons, {
        weight: "regular",
    }),
})
```

```ts
import * as Hugeicons from "@hugeicons/core-free-icons"
import { hugeiconsIconAdapter } from "@mvriu5/payload-icon-picker/adapters/hugeicons"

payloadIconPlugin({
    icons: hugeiconsIconAdapter(Hugeicons),
})
```

Adapters support `prefix`, `include`, `exclude`, and optional label/value formatters:

When registering icons from more than one library, use a unique `prefix` for every adapter. Many icon libraries export generic names such as `Home`, `Search`, or `User`; prefixes keep stored values unique and make it clear which library an icon came from.

```ts
import * as SimpleIcons from "@icons-pack/react-simple-icons"
import * as TablerIcons from "@tabler/icons-react"
import { simpleIconsAdapter } from "@mvriu5/payload-icon-picker/adapters/simple-icons"
import { tablerIconAdapter } from "@mvriu5/payload-icon-picker/adapters/tabler"

payloadIconPlugin({
    icons: [
        ...tablerIconAdapter(TablerIcons, {
            label: ({ defaultLabel, prefix }) => `${prefix}:${defaultLabel.replace(/^Icon/, "")}`,
            prefix: "tabler",
        }),
        ...simpleIconsAdapter(SimpleIcons, {
            prefix: "si",
        }),
    ],
})
```

With `prefix`, the adapter keeps `name` as the original library export name and sets `value` to `prefix:name`, for example `tabler:IconHome`.

Without prefixes, duplicate icon values can collide. In development, the plugin warns when multiple registered icons resolve to the same stored value.

Or pass explicit icon metadata:

```ts
payloadIconPlugin({
    icons: [
        {
            Icon: Icons.Home,
            keywords: ["house", "start"],
            label: "Home",
            name: "Home",
            value: "home",
        },
    ],
})
```

## Field Options

`iconField()` accepts normal single-value Payload text field options, plus picker labels:

```ts
iconField({
    name: "icon",
    label: "Icon",
    required: true,
    placeholder: "Search icons",
    noResultsLabel: "No icons found",
    admin: {
        position: "sidebar",
    },
})
```

## Development

The dev Payload config in `dev/payload.config.ts` registers the plugin with `lucide-react`, which is installed as a development dependency.

```bash
pnpm dev
```

Generate the Payload import map after changing admin components:

```bash
pnpm generate:importmap
```

Build the package:

```bash
pnpm build
```
