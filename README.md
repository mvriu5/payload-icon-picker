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
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import * as Icons from 'lucide-react'
import { buildConfig } from 'payload'
import { iconField, payloadIconPlugin } from '@mvriu5/payload-icon-picker'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        iconField({
          name: 'icon',
          label: 'Icon',
        }),
      ],
    },
  ],
  plugins: [
    payloadIconPlugin({
      icons: Icons,
      resolveIcon: ({ name }) => name,
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

By default, the stored value is `icon.value ?? icon.name`. Use `resolveIcon` to choose a different format:

```ts
payloadIconPlugin({
  icons: Icons,
  resolveIcon: ({ name }) => `lucide:${name}`,
})
```

Selecting `ArrowRight` would store:

```txt
lucide:ArrowRight
```

## Icon Inputs

You can pass a full icon library namespace:

```ts
import * as Icons from 'lucide-react'

payloadIconPlugin({
  icons: Icons,
})
```

Or pass explicit icon metadata:

```ts
payloadIconPlugin({
  icons: [
    {
      Icon: Icons.Home,
      keywords: ['house', 'start'],
      label: 'Home',
      name: 'Home',
      value: 'home',
    },
  ],
})
```

## Field Options

`iconField()` accepts normal single-value Payload text field options, plus picker labels:

```ts
iconField({
  name: 'icon',
  label: 'Icon',
  required: true,
  placeholder: 'Search icons',
  noResultsLabel: 'No icons found',
  admin: {
    position: 'sidebar',
  },
})
```

## Development

The dev Payload config in `dev/payload.config.ts` registers the plugin with a small local icon registry so the picker can be tested without installing another icon package.

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
