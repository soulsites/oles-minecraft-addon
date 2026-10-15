"""Packt jedes Add-on unter addons/ zu einer .mcaddon-Datei (Doppelklick = Import in Minecraft)."""
import zipfile
from pathlib import Path


class AddonBuilder:
    PACK_ORDNER = {"BP": "BP", "RP": "RP"}

    def __init__(self, quelle: Path, zielOrdner: Path):
        self.quelle = quelle
        self.name = quelle.name
        self.ziel = zielOrdner / f"{self.name}.mcaddon"

    def build(self) -> Path:
        self.ziel.parent.mkdir(exist_ok=True)
        with zipfile.ZipFile(self.ziel, "w", zipfile.ZIP_DEFLATED) as zf:
            for ordner, suffix in self.PACK_ORDNER.items():
                pack = self.quelle / ordner
                if pack.is_dir():
                    self.addPack(zf, pack, f"{self.name}_{suffix}")
        return self.ziel

    def addPack(self, zf: zipfile.ZipFile, pack: Path, packname: str):
        for datei in sorted(pack.rglob("*")):
            if datei.is_file():
                zf.write(datei, f"{packname}/{datei.relative_to(pack).as_posix()}")


class Projekt:
    def __init__(self, root: Path):
        self.addons = root / "addons"
        self.dist = root / "dist"

    def buildAlle(self):
        for quelle in sorted(p for p in self.addons.iterdir() if p.is_dir()):
            print("Erstellt:", AddonBuilder(quelle, self.dist).build())


if __name__ == "__main__":
    Projekt(Path(__file__).parent).buildAlle()
