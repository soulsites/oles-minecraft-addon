import { RuestungsAnzeige } from "./ruestungsAnzeige.js";
import { Schnellwechsel } from "./schnellwechsel.js";

class PvpAddon {
    constructor() {
        this.module = [new RuestungsAnzeige(), new Schnellwechsel()];
    }

    start() {
        this.module.forEach((modul) => modul.register());
    }
}

new PvpAddon().start();
