"""Packt jedes Add-on unter addons/ zu einer .mcaddon-Datei (Doppelklick = Import in Minecraft).

Die Version wird aus BP/manifest.json gelesen und automatisch in den Dateinamen
und den im Spiel angezeigten Paketnamen geschrieben (z. B. "randomizer_1.0.mcaddon").
"""
import json
import zipfile
from pathlib import Path


class AddonBuilder:
    PACK_ORDNER = {"BP": "BP", "RP": "RP"}

    def __init__(self, quelle: Path, zielOrdner: Path):
        self.quelle = quelle
        self.name = quelle.name
        self.version = self.leseVersion()
        self.ziel = zielOrdner / f"{self.name}_{self.version}.mcaddon"

    def leseVersion(self) -> str:
        manifest = json.loads((self.quelle / "BP" / "manifest.json").read_text())
        major, minor, patch = manifest["header"]["version"]
        return f"{major}.{minor}" + (f".{patch}" if patch else "")

    def build(self) -> Path:
        self.ziel.parent.mkdir(exist_ok=True)
        with zipfile.ZipFile(self.ziel, "w", zipfile.ZIP_DEFLATED) as zf:
            for ordner, suffix in self.PACK_ORDNER.items():
                pack = self.quelle / ordner
                if pack.is_dir():
                    self.addPack(zf, pack, f"{self.name}_{suffix}_{self.version}")
        return self.ziel

    def addPack(self, zf: zipfile.ZipFile, pack: Path, packname: str):
        for datei in sorted(pack.rglob("*")):
            if not datei.is_file():
                continue
            zielPfad = f"{packname}/{datei.relative_to(pack).as_posix()}"
            if datei.name == "manifest.json":
                zf.writestr(zielPfad, self.manifestMitVersion(datei))
            else:
                zf.write(datei, zielPfad)

    def manifestMitVersion(self, datei: Path) -> str:
        manifest = json.loads(datei.read_text())
        manifest["header"]["name"] += f" v{self.version}"
        return json.dumps(manifest, indent=2, ensure_ascii=False)


class Projekt:
    def __init__(self, root: Path):
        self.addons = root / "addons"
        self.dist = root / "dist"

    def buildAlle(self):
        for quelle in sorted(p for p in self.addons.iterdir() if p.is_dir()):
            print("Erstellt:", AddonBuilder(quelle, self.dist).build())


if __name__ == "__main__":
    Projekt(Path(__file__).parent).buildAlle()
