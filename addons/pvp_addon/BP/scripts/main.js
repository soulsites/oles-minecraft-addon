import { RuestungsAnzeige } from "./ruestungsAnzeige.js";

class PvpAddon {
    constructor() {
        this.module = [new RuestungsAnzeige()];
    }

    start() {
        this.module.forEach((modul) => modul.register());
    }
}

new PvpAddon().start();
