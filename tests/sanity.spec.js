const { test, expect } = require('@playwright/test');

test("The local server infra works", async ({page}) => {
    await page.goto("http://localhost:3000/tests/resources/sanity.html");
    const body = await page.$("body");
    const content = await body.textContent();
    expect(content.trim()).toBe("OK");
});
