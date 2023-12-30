// @ts-check
import {Velvette} from "../../../src/index.js";

function render() {
    document.documentElement.dataset.url = location.pathname;
}

render();

const velvette = new Velvette({
    routes: {
        "home": "/app/",
        "playlist": "/app/playlist",
        "song": "/app/song/:song_id",
        "settings": "/app/settings"
    }, rules: [
        {between: ["home", "playlist"], class: "slide"},
        {between: ["playlist", "song"], class: "expand"},
        {with: "settings", class: "pop-settings"}
    ], captures: {
        ":root.vt-route-playlist li#song$(song_id) a": "song",
        ":root.vt-route-song h1": "song",
        ":root.pop-settings section#settings": "settings"
    }
})

//const velvette = new Velvette();
window.navigation.addEventListener("navigate", e => {
    const navEvent = /** @type {NavigateEvent} */(e);
    velvette.intercept(navEvent, {
        async handler() {
            render();
        }
    });
});