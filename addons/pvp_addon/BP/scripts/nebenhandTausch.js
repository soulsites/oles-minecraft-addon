import { world, system, EquipmentSlot } from "@minecraft/server";

/**
 * 2x schnell schleichen = Item in der Haupthand mit der Nebenhand tauschen (geht mit jedem Item).
 */
export class NebenhandTausch {
    static MAX_ABSTAND_TICKS = 8;

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

        if (jetzt - zuletzt <= NebenhandTausch.MAX_ABSTAND_TICKS) {
            this.letzterDruck.delete(spieler.id);
            this.tauschen(spieler);
            return;
        }
        this.letzterDruck.set(spieler.id, jetzt);
    }

    tauschen(spieler) {
        const ausruestung = spieler.getComponent("minecraft:equippable");
        if (!ausruestung) return;

        const haupthand = ausruestung.getEquipment(EquipmentSlot.Mainhand);
        const nebenhand = ausruestung.getEquipment(EquipmentSlot.Offhand);
        if (!haupthand && !nebenhand) return;

        ausruestung.setEquipment(EquipmentSlot.Mainhand, nebenhand);
        ausruestung.setEquipment(EquipmentSlot.Offhand, haupthand);
        spieler.playSound("armor.equip_generic");
    }
}
