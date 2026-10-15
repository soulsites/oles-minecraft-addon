"""Erzeugt niedrige Feuer-Texturen: jedes 16x16-Frame wird auf halbe Höhe gestaucht und nach unten gesetzt.

Nutzung: python3 tools/low_fire.py <vanilla_resource_pack> <ziel_RP>
"""
import sys
from pathlib import Path
from PIL import Image


class LowFire:
    TEXTUREN = [
        "textures/flame_atlas.png",
        "textures/blocks/fire_0.png",
        "textures/blocks/fire_1.png",
        "textures/blocks/soul_fire_0.png",
        "textures/blocks/soul_fire_1.png",
    ]

    def __init__(self, quelle: Path, ziel: Path, faktor: float = 0.5):
        self.quelle = quelle
        self.ziel = ziel
        self.faktor = faktor

    def erzeugeAlle(self):
        for textur in self.TEXTUREN:
            zielDatei = self.ziel / textur
            zielDatei.parent.mkdir(parents=True, exist_ok=True)
            self.verkleinern(Image.open(self.quelle / textur).convert("RGBA")).save(zielDatei)
            print("Erstellt:", zielDatei)

    def verkleinern(self, bild: Image.Image) -> Image.Image:
        breite, hoehe = bild.size
        neu = Image.new("RGBA", bild.size, (0, 0, 0, 0))
        neueHoehe = max(1, round(breite * self.faktor))
        for oben in range(0, hoehe, breite):
            frame = bild.crop((0, oben, breite, oben + breite)).resize((breite, neueHoehe), Image.NEAREST)
            neu.paste(frame, (0, oben + breite - neueHoehe))
        return neu


if __name__ == "__main__":
    LowFire(Path(sys.argv[1]), Path(sys.argv[2])).erzeugeAlle()
