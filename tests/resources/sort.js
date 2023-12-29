import { observeViewTransition } from "./test-utils.js";
/*import { Velvette } from "../src/velvette";

const velvette = new Velvette({
    parts: [
        {
            selector: ".box",
            name: "#"   
        }
    ]
});
*/
const main = document.querySelector("main");
for (const box of main.querySelectorAll(".box")) {
    box.addEventListener("click", () => {
        const transition = document.startViewTransition(() => {
            main.classList.toggle("green");
            main.classList.toggle("yellow");
        });
        observeViewTransition(transition, ["yellow", "green"]);
    });
}
