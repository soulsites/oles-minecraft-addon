import { world } from "@minecraft/server";

/**
 * Zeigt Fehler im Chat an (am Handy gibt es kein Content-Log). Jeder Fehler wird nur einmal gemeldet.
 */
export class Diagnose {
    static gemeldet = new Set();

    static ausfuehren(modul, funktion) {
        try {
            funktion();
        } catch (fehler) {
            Diagnose.melden(modul, fehler);
        }
    }

    static melden(modul, fehler) {
        const text = `§c[PvP Addon] Fehler in ${modul}: ${fehler}`;
        if (Diagnose.gemeldet.has(text)) return;

        Diagnose.gemeldet.add(text);
        world.sendMessage(text);
    }
}
