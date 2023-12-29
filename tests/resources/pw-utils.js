const { test, expect } = require('@playwright/test');
export function testInBrowser(name, label, params = {}) {
    const url = new URL(`http://localhost:3000/tests/resources/${name}.html`);
    for (const param in params)
        url.searchParams.set(param, params[param]);

    test(label, async ({page}) => {
        let resolve_test;
        let expectations = [];
        page.on("console", m => console[m.type()](m.text()));
        page.exposeFunction("expect_equals", (actual, expected) => {
            expectations.push({actual, expected});
        });
        page.on("popup", page => {
            page.on("console", m => console[m.type()](m.text(), m.location()));
        })

        page.exposeFunction("test_done", () => resolve_test("done"));
        page.exposeFunction("test_error", () => resolve_test("error"));
        page.on("error", e => console.error(e));
        for (let i = 0; i < 16; ++i) {
            expectations = [];
            const done = new Promise(resolve => {resolve_test = resolve});
            await page.goto(url.href);
            const result = await done;
            if (result === "done") {
                for (const {actual, expected} of expectations)
                    expect(actual).toEqual(expected);
                break;
            }
        }
    });
}

