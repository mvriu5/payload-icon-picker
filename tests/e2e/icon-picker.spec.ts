import { expect, test, type Page } from "@playwright/test"
import path from "path"
import { getPayload, type Payload } from "payload"
import { loadEnv } from "payload/node"

const E2E_EMAIL = "icon-picker-e2e@example.com"
const E2E_PASSWORD = "TestPassword123!"

let payload: Payload

test.beforeAll(async () => {
    loadEnv(path.resolve(process.cwd(), "dev"))
    process.env.PAYLOAD_SECRET ??= "test-secret"

    const { default: config } = await import("../../dev/payload.config.js")

    payload = await getPayload({ config })

    const existingUser = await payload.find({
        collection: "users",
        limit: 1,
        where: {
            email: {
                equals: E2E_EMAIL,
            },
        },
    })

    if (existingUser.docs[0]) {
        await payload.update({
            collection: "users",
            data: {
                password: E2E_PASSWORD,
            },
            id: existingUser.docs[0].id,
        })

        return
    }

    await payload.create({
        collection: "users",
        data: {
            email: E2E_EMAIL,
            password: E2E_PASSWORD,
        },
    })
})

test("selects and saves an icon in the Payload admin", async ({ page }) => {
    await login(page)

    const title = `Icon picker E2E ${Date.now()}`

    await page.goto("/admin/collections/posts/create")

    const titleInput = page.getByLabel(/^title/i).first()
    await expect(titleInput).toBeVisible()
    await titleInput.fill(title)

    const iconTrigger = page.locator(".payload-icon-picker__trigger").first()
    await expect(iconTrigger).toBeVisible()
    await iconTrigger.click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await page.getByLabel("Search icons").fill("tabler home")

    const homeOption = page.locator('.payload-icon-picker__option[title="tabler:Home"]').first()
    await expect(homeOption).toBeVisible()
    await homeOption.click()

    await expect(dialog).toBeHidden()
    await expect(iconTrigger).toContainText("tabler:")
    await expect(iconTrigger).toContainText("Home")

    const saveResponse = page.waitForResponse((response) => response.url().includes("/api/posts") && response.request().method() === "POST" && response.ok())
    await page.locator('button:has-text("Save"), button:has-text("Publish")').first().click()
    await saveResponse

    await expect
        .poll(async () => {
            const posts = await payload.find({
                collection: "posts",
                limit: 1,
                locale: "en",
                where: {
                    title: {
                        equals: title,
                    },
                },
            })

            return posts.docs[0]?.icon
        })
        .toBe("tabler:IconHome")
})

const login = async (page: Page) => {
    const response = await page.request.post("/api/users/login", {
        data: {
            email: E2E_EMAIL,
            password: E2E_PASSWORD,
        },
    })

    expect(response.ok()).toBe(true)
}
