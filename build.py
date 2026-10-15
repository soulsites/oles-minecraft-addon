"""Packt BP + RP zu einer .mcaddon-Datei (Doppelklick = Import in Minecraft)."""
import zipfile
from pathlib import Path


class AddonBuilder:
    def __init__(self, root: Path, name: str):
        self.root = root
        self.ziel = root / "dist" / f"{name}.mcaddon"
        self.packs = {"BP": f"{name}_BP", "RP": f"{name}_RP"}

    def build(self) -> Path:
        self.ziel.parent.mkdir(exist_ok=True)
        with zipfile.ZipFile(self.ziel, "w", zipfile.ZIP_DEFLATED) as zf:
            for ordner, packname in self.packs.items():
                self.addPack(zf, self.root / ordner, packname)
        return self.ziel

    def addPack(self, zf: zipfile.ZipFile, quelle: Path, packname: str):
        for datei in sorted(quelle.rglob("*")):
            if datei.is_file():
                zf.write(datei, f"{packname}/{datei.relative_to(quelle).as_posix()}")


if __name__ == "__main__":
    print("Erstellt:", AddonBuilder(Path(__file__).parent, "oles_addon").build())
