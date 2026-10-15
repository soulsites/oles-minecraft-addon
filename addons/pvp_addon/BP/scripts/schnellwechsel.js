import { world, system } from "@minecraft/server";

/**
 * "Dritte Hand": 2x schnell schleichen tauscht das Item in der Hand mit dem Taschen-Platz
 * (erster Inventarplatz über der Hotbar). Das Item liegt danach normal in der Hand – voll benutzbar.
 */
export class Schnellwechsel {
    static MAX_ABSTAND_TICKS = 15;
    static TASCHEN_SLOT = 9;

    constructor() {
        this.warSchleichend = new Map();
        this.letzterDruck = new Map();
    }

    register() {
        system.runInterval(() => this.pruefen(), 1);
    }

    pruefen() {
        for (const spieler of world.getAllPlayers()) {
            const schleicht = spieler.isSneaking;
            const neuGedrueckt = schleicht && !this.warSchleichend.get(spieler.id);
            this.warSchleichend.set(spieler.id, schleicht);

            if (neuGedrueckt) this.onSchleichDruck(spieler);
        }
    }

    onSchleichDruck(spieler) {
        const jetzt = system.currentTick;
        const zuletzt = this.letzterDruck.get(spieler.id) ?? -Infinity;

        if (jetzt - zuletzt <= Schnellwechsel.MAX_ABSTAND_TICKS) {
            this.letzterDruck.delete(spieler.id);
            this.tauschen(spieler);
            return;
        }
        this.letzterDruck.set(spieler.id, jetzt);
    }

    tauschen(spieler) {
        const inventar = spieler.getComponent("minecraft:inventory")?.container;
        const handSlot = spieler.selectedSlotIndex ?? spieler.selectedSlot;
        if (!inventar || handSlot === undefined) return;

        if (!inventar.getItem(handSlot) && !inventar.getItem(Schnellwechsel.TASCHEN_SLOT)) return;

        inventar.swapItems(handSlot, Schnellwechsel.TASCHEN_SLOT, inventar);
        spieler.playSound("armor.equip_generic");

        const neu = inventar.getItem(handSlot);
        spieler.onScreenDisplay.setActionBar(`§bDritte Hand: §f${neu ? this.anzeigeName(neu) : "leer"}`);
    }

    anzeigeName(item) {
        return item.nameTag ?? item.typeId.replace("minecraft:", "").replaceAll("_", " ");
    }
}
