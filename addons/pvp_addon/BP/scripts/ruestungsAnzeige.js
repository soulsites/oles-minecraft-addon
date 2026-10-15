import { world, system, EquipmentSlot } from "@minecraft/server";
import { Diagnose } from "./diagnose.js";

/**
 * Zeigt die Haltbarkeit der getragenen Rüstung in der Actionbar (über der Hotbar) an.
 */
export class RuestungsAnzeige {
    static INTERVALL_TICKS = 10;
    static SLOTS = [
        { slot: EquipmentSlot.Head, name: "Helm" },
        { slot: EquipmentSlot.Chest, name: "Brust" },
        { slot: EquipmentSlot.Legs, name: "Hose" },
        { slot: EquipmentSlot.Feet, name: "Schuhe" },
    ];

    register() {
        system.runInterval(() => Diagnose.ausfuehren("Rüstungsanzeige", () => this.aktualisieren()), RuestungsAnzeige.INTERVALL_TICKS);
    }

    aktualisieren() {
        for (const spieler of world.getAllPlayers()) {
            const text = this.erstelleText(spieler);
            if (text) spieler.onScreenDisplay.setActionBar(text);
        }
    }

    erstelleText(spieler) {
        const ausruestung = spieler.getComponent("minecraft:equippable");
        if (!ausruestung) return "";

        return RuestungsAnzeige.SLOTS
            .map(({ slot, name }) => this.slotText(ausruestung.getEquipment(slot), name))
            .filter((teil) => teil)
            .join(" §8| ");
    }

    slotText(item, name) {
        const haltbarkeit = item?.getComponent("minecraft:durability");
        if (!haltbarkeit) return "";

        const rest = haltbarkeit.maxDurability - haltbarkeit.damage;
        const prozent = Math.round((rest / haltbarkeit.maxDurability) * 100);
        return `§f${name} ${this.farbe(prozent)}${rest}`;
    }

    farbe(prozent) {
        if (prozent > 50) return "§a";
        if (prozent > 20) return "§e";
        return "§c";
    }
}

