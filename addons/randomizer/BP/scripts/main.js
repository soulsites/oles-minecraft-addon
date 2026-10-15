import { world, system, ItemStack, ItemTypes } from "@minecraft/server";

/**
 * Zufallszahlen mit Seed – gleiche Seed = gleiche Vertauschung.
 */
class SeedZufall {
    constructor(seed) {
        this.zustand = seed >>> 0;
    }

    naechste() {
        this.zustand = (this.zustand + 0x6d2b79f5) >>> 0;
        let t = this.zustand;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Sattolo-Algorithmus: kein Element bleibt an seinem Platz (kein Block droppt sich selbst)
    mische(liste) {
        const kopie = [...liste];
        for (let i = kopie.length - 1; i > 0; i--) {
            const j = Math.floor(this.naechste() * i);
            [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
        }
        return kopie;
    }
}

/**
 * Baut die Vertauschung: jeder Block bekommt genau ein anderes Item/Block zugeordnet (1:1).
 */
class DropTabelle {
    static SEED_KEY = "ole:randomizer_seed";
    static VERBOTEN = [
        "air", "bedrock", "barrier", "command_block", "structure_", "jigsaw", "light_block",
        "border_block", "allow", "deny", "portal", "moving_block", "piston_arm", "unknown",
        "info_update", "reserved", "placeholder", "element_", "spawn_egg", "water", "lava", "fire", "debug", "npc"
    ];

    constructor() {
        this.zuordnung = null;
        this.drops = [];
    }

    get seed() {
        let seed = world.getDynamicProperty(DropTabelle.SEED_KEY);
        if (typeof seed !== "number") {
            seed = Math.floor(Math.random() * 2147483647);
            world.setDynamicProperty(DropTabelle.SEED_KEY, seed);
        }
        return seed;
    }

    getDrop(blockId) {
        if (!this.zuordnung) this.aufbauen();
        return this.zuordnung.get(blockId) ?? this.drops[this.hash(blockId) % this.drops.length];
    }

    // Alle Items (inkl. Blöcke) werden 1:1 vertauscht – Blöcke können so auch normale Items droppen
    aufbauen() {
        this.drops = ItemTypes.getAll()
            .map((typ) => typ.id)
            .filter((id) => this.istErlaubt(id))
            .sort();

        const gemischt = new SeedZufall(this.seed).mische(this.drops);
        this.zuordnung = new Map(this.drops.map((id, i) => [id, gemischt[i]]));
    }

    istErlaubt(id) {
        return !DropTabelle.VERBOTEN.some((wort) => id.includes(wort));
    }

    hash(text) {
        let h = 0;
        for (const zeichen of text) h = (Math.imul(h, 31) + zeichen.charCodeAt(0)) >>> 0;
        return h;
    }
}

/**
 * Fängt das Abbauen ab: Block wird entfernt und der vertauschte Block gedroppt.
 */
class BlockRandomizer {
    constructor(tabelle) {
        this.tabelle = tabelle;
    }

    register() {
        world.beforeEvents.playerBreakBlock.subscribe((event) => this.onBreak(event));
        world.afterEvents.playerSpawn.subscribe((event) => this.onSpawn(event));
    }

    onBreak(event) {
        const { player, block } = event;
        if (this.istKreativ(player)) return;

        const blockId = block.typeId;
        const ort = { ...block.location };
        const dimension = block.dimension;

        event.cancel = true;
        system.run(() => this.ersetzen(player, dimension, ort, blockId));
    }

    ersetzen(player, dimension, ort, blockId) {
        const block = dimension.getBlock(ort);
        if (!block || block.typeId !== blockId) return;

        const mitte = { x: ort.x + 0.5, y: ort.y + 0.5, z: ort.z + 0.5 };
        this.inhaltAusschuetten(block, dimension, mitte);
        block.setType("minecraft:air");

        try {
            dimension.spawnItem(new ItemStack(this.tabelle.getDrop(blockId), 1), mitte);
        } catch (fehler) {
            console.warn(`Randomizer: kein Drop für ${blockId}: ${fehler}`);
        }
        this.werkzeugAbnutzen(player);
    }

    inhaltAusschuetten(block, dimension, ort) {
        const container = block.getComponent("minecraft:inventory")?.container;
        if (!container) return;

        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) dimension.spawnItem(item, ort);
        }
        container.clearAll();
    }

    werkzeugAbnutzen(player) {
        const inventar = player.getComponent("minecraft:inventory")?.container;
        const slot = player.selectedSlotIndex ?? player.selectedSlot;
        const item = inventar?.getItem(slot);
        const haltbarkeit = item?.getComponent("minecraft:durability");
        if (!haltbarkeit) return;

        if (haltbarkeit.damage + 1 >= haltbarkeit.maxDurability) {
            inventar.setItem(slot, undefined);
            player.playSound("random.break");
            return;
        }
        haltbarkeit.damage += 1;
        inventar.setItem(slot, item);
    }

    istKreativ(player) {
        try {
            return player.getGameMode() === "creative";
        } catch {
            return false;
        }
    }

    onSpawn(event) {
        if (!event.initialSpawn) return;
        event.player.sendMessage("§d[Randomizer] §fAlle Blöcke droppen andere Blöcke oder Items – viel Glück!");
    }
}

new BlockRandomizer(new DropTabelle()).register();
