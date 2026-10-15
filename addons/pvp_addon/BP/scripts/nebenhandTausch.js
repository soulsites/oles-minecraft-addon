import { world, system, EquipmentSlot } from "@minecraft/server";

/**
 * 2x schnell schleichen = Item in der Haupthand mit der Nebenhand tauschen (geht mit jedem Item).
 */
export class NebenhandTausch {
    static MAX_ABSTAND_TICKS = 15;

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

        // Erst sicherstellen, dass das Item wirklich in der Nebenhand liegt – sonst nichts verändern
        if (haupthand && !this.inNebenhandLegen(spieler, ausruestung, haupthand)) {
            if (nebenhand) ausruestung.setEquipment(EquipmentSlot.Offhand, nebenhand);
            spieler.sendMessage("§cDieses Item kann nicht in die Nebenhand (verzaubert oder umbenannt).");
            return;
        }
        if (!haupthand) ausruestung.setEquipment(EquipmentSlot.Offhand, undefined);

        ausruestung.setEquipment(EquipmentSlot.Mainhand, nebenhand);
        spieler.playSound("armor.equip_generic");
    }

    inNebenhandLegen(spieler, ausruestung, item) {
        try {
            ausruestung.setEquipment(EquipmentSlot.Offhand, item);
        } catch {
            // Minecraft lehnt manche Items ab – dann per Befehl versuchen
        }
        if (this.liegtInNebenhand(ausruestung, item)) return true;
        if (!this.kannPerBefehl(item)) return false;

        try {
            const schaden = item.getComponent("minecraft:durability")?.damage ?? 0;
            spieler.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${item.typeId} ${item.amount} ${schaden}`);
        } catch {
            return false;
        }
        return this.liegtInNebenhand(ausruestung, item);
    }

    liegtInNebenhand(ausruestung, item) {
        const nebenhand = ausruestung.getEquipment(EquipmentSlot.Offhand);
        return nebenhand?.typeId === item.typeId && nebenhand.amount === item.amount;
    }

    // Der Befehl kennt keine Verzauberungen/Namen – solche Items nicht anfassen, damit nichts verloren geht
    kannPerBefehl(item) {
        if (item.nameTag) return false;
        try {
            const verzauberungen = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
            return verzauberungen.length === 0;
        } catch {
            return true;
        }
    }
}
