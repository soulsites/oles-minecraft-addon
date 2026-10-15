import { world, system } from "@minecraft/server";

/**
 * Angel-Perle: Angel in der Hand + Schleichen drücken = Ender-Perle aus dem Inventar werfen.
 * Die Angel bleibt in der Hand, ein ausgeworfener Schwimmer bleibt draußen.
 */
export class AngelPerle {
    static ANGEL = "minecraft:fishing_rod";
    static PERLE = "minecraft:ender_pearl";
    static COOLDOWN_TICKS = 20;
    static WURF_STAERKE = 1.5;
    static AUFPRALL_SCHADEN = 5;

    constructor() {
        this.warSchleichend = new Map();
        this.letzterWurf = new Map();
        this.fliegendePerlen = [];
    }

    register() {
        system.runInterval(() => this.tick(), 1);
    }

    tick() {
        for (const spieler of world.getAllPlayers()) {
            const schleicht = spieler.isSneaking;
            const neuGedrueckt = schleicht && !this.warSchleichend.get(spieler.id);
            this.warSchleichend.set(spieler.id, schleicht);

            if (neuGedrueckt && this.haeltAngel(spieler)) this.werfen(spieler);
        }
        this.perlenVerfolgen();
    }

    haeltAngel(spieler) {
        const inventar = spieler.getComponent("minecraft:inventory")?.container;
        const slot = spieler.selectedSlotIndex ?? spieler.selectedSlot;
        return inventar?.getItem(slot)?.typeId === AngelPerle.ANGEL;
    }

    werfen(spieler) {
        if (!this.istBereit(spieler)) return;

        const kreativ = this.istKreativ(spieler);
        if (!kreativ && !this.perleVerbrauchen(spieler)) {
            spieler.onScreenDisplay.setActionBar("§cKeine Ender-Perle im Inventar!");
            return;
        }

        const blick = spieler.getViewDirection();
        const kopf = spieler.getHeadLocation();
        const start = { x: kopf.x + blick.x * 0.5, y: kopf.y + blick.y * 0.5, z: kopf.z + blick.z * 0.5 };
        const tempo = { x: blick.x * AngelPerle.WURF_STAERKE, y: blick.y * AngelPerle.WURF_STAERKE, z: blick.z * AngelPerle.WURF_STAERKE };

        const perle = spieler.dimension.spawnEntity(AngelPerle.PERLE, start);
        this.abschiessen(perle, spieler, tempo);
        spieler.dimension.playSound("random.bow", start);
        this.letzterWurf.set(spieler.id, system.currentTick);
    }

    // Normal: Perle gehört dem Spieler -> Minecraft teleportiert selbst.
    // Fallback: Perle selbst verfolgen und beim Aufprall teleportieren.
    abschiessen(perle, spieler, tempo) {
        const projektil = perle.getComponent("minecraft:projectile");
        if (projektil) {
            try {
                projektil.owner = spieler;
                projektil.shoot(tempo);
                return;
            } catch {
                // weiter mit Fallback
            }
        }
        perle.applyImpulse(tempo);
        this.fliegendePerlen.push({ perle, spieler, ort: perle.location });
    }

    perlenVerfolgen() {
        this.fliegendePerlen = this.fliegendePerlen.filter((eintrag) => {
            if (this.istGueltig(eintrag.perle)) {
                eintrag.ort = eintrag.perle.location;
                return true;
            }
            this.teleportieren(eintrag);
            return false;
        });
    }

    teleportieren({ spieler, ort }) {
        if (!this.istGueltig(spieler)) return;
        spieler.teleport(ort, { dimension: spieler.dimension });
        if (!this.istKreativ(spieler)) spieler.applyDamage(AngelPerle.AUFPRALL_SCHADEN);
    }

    perleVerbrauchen(spieler) {
        const inventar = spieler.getComponent("minecraft:inventory")?.container;
        if (!inventar) return false;

        for (let i = 0; i < inventar.size; i++) {
            const item = inventar.getItem(i);
            if (item?.typeId !== AngelPerle.PERLE) continue;

            if (item.amount <= 1) {
                inventar.setItem(i, undefined);
            } else {
                item.amount -= 1;
                inventar.setItem(i, item);
            }
            return true;
        }
        return false;
    }

    istBereit(spieler) {
        const zuletzt = this.letzterWurf.get(spieler.id) ?? -Infinity;
        return system.currentTick - zuletzt >= AngelPerle.COOLDOWN_TICKS;
    }

    istGueltig(entity) {
        return typeof entity.isValid === "function" ? entity.isValid() : entity.isValid;
    }

    istKreativ(spieler) {
        try {
            return spieler.getGameMode() === "creative";
        } catch {
            return false;
        }
    }
}
