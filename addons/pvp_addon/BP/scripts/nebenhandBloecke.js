import { world, system, EquipmentSlot, BlockPermutation } from "@minecraft/server";

/**
 * Leere Haupthand + Block in der Nebenhand: Schleichen und auf einen Block tippen setzt den Nebenhand-Block.
 */
export class NebenhandBloecke {
    static COOLDOWN_TICKS = 4;
    static RICHTUNGEN = {
        Up: { x: 0, y: 1, z: 0 },
        Down: { x: 0, y: -1, z: 0 },
        North: { x: 0, y: 0, z: -1 },
        South: { x: 0, y: 0, z: 1 },
        East: { x: 1, y: 0, z: 0 },
        West: { x: -1, y: 0, z: 0 },
    };

    constructor() {
        this.letzteNutzung = new Map();
    }

    register() {
        world.beforeEvents.playerInteractWithBlock.subscribe((event) => this.onInteract(event));
    }

    onInteract(event) {
        const { player, block, blockFace } = event;
        if (!player.isSneaking || event.itemStack) return;
        if (!this.istBereit(player)) return;

        const offset = NebenhandBloecke.RICHTUNGEN[blockFace];
        if (!offset) return;

        const ziel = { x: block.location.x + offset.x, y: block.location.y + offset.y, z: block.location.z + offset.z };
        event.cancel = true;
        system.run(() => this.setzen(player, block.dimension, ziel));
    }

    setzen(spieler, dimension, ort) {
        const ausruestung = spieler.getComponent("minecraft:equippable");
        const item = ausruestung?.getEquipment(EquipmentSlot.Offhand);
        if (!item) return;

        const permutation = this.alsBlock(item.typeId);
        const zielBlock = dimension.getBlock(ort);
        if (!permutation || !zielBlock || !this.istFrei(zielBlock) || this.stehtImWeg(spieler, ort)) return;

        zielBlock.setPermutation(permutation);
        this.verbrauchen(spieler, ausruestung, item);
    }

    alsBlock(typeId) {
        try {
            return BlockPermutation.resolve(typeId);
        } catch {
            return undefined;
        }
    }

    istFrei(block) {
        return block.isAir || block.isLiquid;
    }

    stehtImWeg(spieler, ort) {
        const fuss = spieler.location;
        const x = Math.floor(fuss.x);
        const y = Math.floor(fuss.y);
        const z = Math.floor(fuss.z);
        return ort.x === x && ort.z === z && (ort.y === y || ort.y === y + 1);
    }

    verbrauchen(spieler, ausruestung, item) {
        if (this.istKreativ(spieler)) return;

        if (item.amount <= 1) {
            ausruestung.setEquipment(EquipmentSlot.Offhand, undefined);
            return;
        }
        item.amount -= 1;
        ausruestung.setEquipment(EquipmentSlot.Offhand, item);
    }

    istKreativ(spieler) {
        try {
            return spieler.getGameMode() === "creative";
        } catch {
            return false;
        }
    }

    istBereit(spieler) {
        const jetzt = system.currentTick;
        const zuletzt = this.letzteNutzung.get(spieler.id) ?? -Infinity;
        if (jetzt - zuletzt < NebenhandBloecke.COOLDOWN_TICKS) return false;

        this.letzteNutzung.set(spieler.id, jetzt);
        return true;
    }
}
