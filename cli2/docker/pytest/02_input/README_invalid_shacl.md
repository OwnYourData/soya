# invalid_shacl

Testet, dass `POST /api/v1/validate/Did` (soya-web-cli) ein SHACL-invalides
DID-Dokument als `isValid: false` erkennt.

**Wodurch ist das Testdokument invalid?**
Das Top-Level-`id` (`"DID:OYD:invalid id with spaces"`) verletzt bewusst das
Pattern-Constraint der Did-Struktur
(`sh:pattern: ^did:[a-z0-9]+:[a-zA-Z0-9.:\-_%]+$` — Großbuchstaben und
Leerzeichen sind nicht erlaubt). Erwartete Meldung:
"there must be one valid 'id' in a DID document".

**Historie:** Bis 2026-07-03 war das Dokument wegen der verificationMethod-
Cardinality `1..n` invalid. Diese wurde (beabsichtigt) auf `0..n` gelockert,
wodurch das Dokument valide wurde und der Test vorübergehend deaktiviert war.
Seit 2026-07-04 nutzt der Test stattdessen die Pattern-Verletzung — die ist
Teil der DID-Kernsyntax und deutlich änderungsstabiler.
