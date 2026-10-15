import { world, system } from "@minecraft/server";
import { Diagnose } from "./diagnose.js";
import { RuestungsAnzeige } from "./ruestungsAnzeige.js";
import { AngelPerle } from "./angelPerle.js";

class PvpAddon {
    static VERSION = "1.6";

    constructor() {
        this.module = [new RuestungsAnzeige(), new AngelPerle()];
    }

    start() {
        this.module.forEach((modul) => Diagnose.ausfuehren(modul.constructor.name, () => modul.register()));
        world.afterEvents.playerSpawn.subscribe((event) => {
            if (event.initialSpawn) this.begruessen(event.player);
        });
        system.run(() => world.getAllPlayers().forEach((spieler) => this.begruessen(spieler)));
    }

    begruessen(spieler) {
        spieler.sendMessage(`§a[PvP Addon v${PvpAddon.VERSION}] geladen §7– Angel in der Hand + Schleichen = Perle`);
    }
}

new PvpAddon().start();
