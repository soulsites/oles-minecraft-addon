import { world, system } from "@minecraft/server";

/**
 * Zauberstab: Rechtsklick schlägt einen Blitz dort ein, wo der Spieler hinschaut.
 */
class Zauberstab {
    static ITEM_ID = "ole:zauberstab";
    static MAX_DISTANZ = 60;
    static COOLDOWN_TICKS = 20; // 1 Sekunde

    constructor() {
        this.letzteNutzung = new Map();
    }

    register() {
        world.afterEvents.itemUse.subscribe((event) => this.onItemUse(event));
    }

    onItemUse(event) {
        if (event.itemStack?.typeId !== Zauberstab.ITEM_ID) return;

        const spieler = event.source;
        if (!this.istBereit(spieler)) return;

        const treffer = spieler.getBlockFromViewDirection({ maxDistance: Zauberstab.MAX_DISTANZ });
        if (!treffer) {
            spieler.sendMessage("§7Zu weit weg!");
            return;
        }

        const ziel = treffer.block.location;
        spieler.dimension.spawnEntity("minecraft:lightning_bolt", { x: ziel.x + 0.5, y: ziel.y + 1, z: ziel.z + 0.5 });
    }

    istBereit(spieler) {
        const jetzt = system.currentTick;
        const zuletzt = this.letzteNutzung.get(spieler.id) ?? -Infinity;
        if (jetzt - zuletzt < Zauberstab.COOLDOWN_TICKS) return false;

        this.letzteNutzung.set(spieler.id, jetzt);
        return true;
    }
}

/**
 * Begrüßt Spieler beim ersten Betreten der Welt.
 */
class Begruessung {
    register() {
        world.afterEvents.playerSpawn.subscribe((event) => this.onSpawn(event));
    }

    onSpawn(event) {
        if (!event.initialSpawn) return;
        event.player.sendMessage("§6Willkommen in Oles Welt! §fTipp: §a/give @s ole:zauberstab");
    }
}

class OlesAddon {
    constructor() {
        this.module = [new Zauberstab(), new Begruessung()];
    }

    start() {
        this.module.forEach((modul) => modul.register());
    }
}

new OlesAddon().start();
