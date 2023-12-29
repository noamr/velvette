export async function observeViewTransition(viewTransition, names) {
    const startTime = performance.now();
    const log = [];
    const previousRects = new Map();
    const rectToString = r =>
        `${r.left},${r.top},${r.width}x${r.height}`;

    const output = (text, name = null, rect = {}) => {
        const key = name ? `${text}-${name}` : "";
        const str = rect ? rectToString(rect) : "";
        if (name && rect && previousRects.get(key) === str)
            return;
        log.push({
            timestamp: Math.round(performance.now() - startTime),
            text,
            name,
            ...(rect ? {x: rect.x, y: rect.y, width: rect.width, height: rect.height} : {})
        });
        if (rect && name)
            previousRects.set(key, str);
    }
    output("start");
    const select = name => Array.from(document.querySelectorAll("*")).find(el => getComputedStyle(el).viewTransitionName === name);

    const rectForPseudo = (pseudo) =>{
        const {transform, width, height} = getComputedStyle(document.documentElement, pseudo);
        const fakeElement = document.createElement("div");
        fakeElement.style.opacity = 0;
        fakeElement.style.transform = transform;
        fakeElement.style.height = height;
        fakeElement.style.width = width;
        fakeElement.style.position = "absolute";
        document.body.appendChild(fakeElement);
        const result = fakeElement.getBoundingClientRect();
        fakeElement.remove();
        return result;
    }
    for (const name of names) {
        const element = select(name);
        if (!element) {
            output("no-old", name);
            continue;
        }
        output("capture-old", name, element.getBoundingClientRect());
    }

    await viewTransition.updateCallbackDone;
    output("updated");
    for (const name of names) {
        const element = select(name);
        if (!element) {
            output("no-capture-new", name);
            continue;
        }
        output("capture-new", name, element.getBoundingClientRect());
    }


    let error = null;
    await viewTransition.ready.catch(e => {
        error = e;
    });
    output("ready");
    if (error)
        throw error;

    let animating = true;
    viewTransition.finished.then(() => { animating = false; });
    while (animating) {
        await new Promise(requestAnimationFrame);
        if (!animating)
            break;
        for (const name of names) {
            for (const p of ["group", "old", "new", "image-pair"]) {
                output(p, name, rectForPseudo(`view-transition-${p}(${name})`));
            }
        }
    }
    output("done");
    return log;
}

export function expect_equals(actual, expected) {
    let log_output = document.querySelector("output#log");
    if (!log_output) {
        log_output = document.createElement("output");
        log_output.id = "log";
        document.body.appendChild(log_output);
    }
    log_output.innerText = `${log_output.innerText}
    Actual: ${JSON.stringify(actual)}
    Expected: ${JSON.stringify(expected)}
    Result: ${JSON.stringify(actual) === JSON.stringify(expected) ? "OK" : "Fail"}
    `;
    if (window.expect_equals)
        window.expect_equals(actual, expected);
}

export async function testViewTransition(viewTransition, names, process, expected, done = true) {
    try {
        const result = viewTransition ? await observeViewTransition(viewTransition, names) : "no-transition";
        const actual = Array.isArray(result) ? process(result) : result;
        if (expected)
            expect_equals(actual, expected);
        if (done)
            test_done();
        return actual;
    } catch (e) {
        if (window.test_error) {
            test_error(e);
            console.error(e);
            return;
        }
    }
}

export function test_done() {
    if (window.test_done)
        window.test_done();
}