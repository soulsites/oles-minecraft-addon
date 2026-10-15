import { RuestungsAnzeige } from "./ruestungsAnzeige.js";
import { NebenhandTausch } from "./nebenhandTausch.js";
import { NebenhandBloecke } from "./nebenhandBloecke.js";

class PvpAddon {
    constructor() {
        this.module = [new RuestungsAnzeige(), new NebenhandTausch(), new NebenhandBloecke()];
    }

    start() {
        this.module.forEach((modul) => modul.register());
    }
}

new PvpAddon().start();
