import { Velvette, startViewTransition } from "./index.js";

Reflect.set(Velvette, "startViewTransition", startViewTransition);
Reflect.set(window, "Velvette", Velvette);