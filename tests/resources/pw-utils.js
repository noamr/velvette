import { test, expect } from '@playwright/test';
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
            if (result === "error")
                continue;
            if (result === "done") {
                for (const {actual, expected} of expectations) {
                    expect(typeof actual).toEqual(typeof expected);
                    if (typeof expected === "string")
                        expect(actual).toEqual(expected);
                    else if (Array.isArray(expected)) {
                        expect(actual.length).toEqual(expected.length);
                        actual.forEach((v, i) => {
                            if (typeof v === "number")
                                expect(Math.abs(v - expected[i])).toBeLessThan(10);
                            else
                                expect(v).toEqual(expected[i]);
                        })
                    }
                }
                return;
            }
        }

        expect("this").toBe("not reached");
    });
}

