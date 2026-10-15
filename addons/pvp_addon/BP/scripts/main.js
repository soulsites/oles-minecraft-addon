import { RuestungsAnzeige } from "./ruestungsAnzeige.js";
import { AngelPerle } from "./angelPerle.js";

class PvpAddon {
    constructor() {
        this.module = [new RuestungsAnzeige(), new AngelPerle()];
    }

    start() {
        this.module.forEach((modul) => modul.register());
    }
}

new PvpAddon().start();
