# 21-similar

Testet `soya similar` gegen das Live-Repo: Person-Selbstabgleich muss mit
Score 1 an erster Stelle stehen, Einträge müssen `schema` (auflösbare
Struktur-DRI), `name` und `similarity` enthalten.

**Historie:** `POST /api/soya/similar` hatte drei Fehler (alle beim Umzug
`repository/` → `repo2/` entstanden, gefixt & deployed 2026-07-04):

1. Helper `getAttributes` fehlte → NameError → HTTP 500
   (Fix: `repo2/app/helpers/soya_helper.rb`)
2. Gem `string-similarity` fehlte → `rescue 0` machte alle Scores zu 0
   (Fix: `repo2/Gemfile.extend`; die `rescue`-Stellen loggen seither)
3. `schema` enthielt die interne Record-DRI (Spalte `dri`, per
   `GET /<dri>` NICHT auflösbar) statt der Struktur-DRI (`soya_dri`);
   außerdem erschien dieselbe Struktur mehrfach (Versions-Records)
   (Fix: `soya_controller.rb#similar` — liefert `schema` = soya_dri,
   zusätzlich `name`, dedupliziert pro Struktur)
