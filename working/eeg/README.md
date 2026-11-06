# EEG_-Strukturen (CC-ADR 0021)

Quellen der SOyA-Strukturen für Energiegemeinschaften mit Präfix `EEG_`. Sie lösen die `TIDE_`-Strukturen ab; die `TIDE_`-Strukturen bleiben im Repository auflösbar und werden hier nicht verändert.

| Datei | Basis | Inhalt |
| --- | --- | --- |
| `EEG_MasterData.yml` | `TIDE_EEGstammdaten` (`z9eAqTCW…`, 13.09.2026) | unverändert, nur `meta.name` |
| `EEG_Member.yml` | `TIDE_EEGmember` (`zAaGpXFW…`, 11.09.2026) | unverändert, nur `meta.name` |
| `EEG_Infrastructure.yml` | `TIDE_Infrastructure` (`z3LGgFNd…`, 28.04.2026) | unverändert, nur `meta.name` |
| `EEG_TimeSeries.yml` | Form von `TIDE_ConsumptionCommunity` (`zCkZPfdk…`) | eine Zeitreihen-Struktur für alle Reihen: `data[]` mit `BQ` (≥ 0), `MM` (`L0`–`L4`, `E1`, `Sonstige`), `DTF`, `DTT` (Offset optional); neutrale Klassen- und Formularnamen; kein Rendering-Overlay |
| `EEG_SeriesReference.yml` | Nachfolger von `TIDE_Timeseries` (`z2nRmcZg…`) | Verweisobjekt einer Reihe: `name`, `collection_id`, `schema`, `ec_id`, `metering_point_id` (optional), `direction`, `share`, `obis`, `obis_subtrahend` (optional); Rendering „ZP …“ bzw. „EEG …“ |

Die Bedeutung einer Reihe (Richtung, Anteil, Quellserie) steht im Verweisobjekt, nicht im Strukturnamen.

## Prüfen

Aus diesem Verzeichnis, mit den Abhängigkeiten von `cli2`:

```
NODE_PATH=../../cli2/node_modules node test/run.js
bash test/compare-tide.sh
```

`test/run.js` erzeugt die Strukturen aus den YAML-Quellen und prüft die Beispiele in `examples/` wie `soya acquire <Name> | soya validate <Name>` (gültige und ungültige Fälle) sowie den `renderingLabel` von `EEG_SeriesReference` mit handlebars.js. `test/render.rb` rendert den Label wie der Pod (Gem `handlebars-engine`). `test/compare-tide.sh` vergleicht die drei unveränderten Strukturen mit ihrer TIDE_-Basis. `test/tide-snapshot.sh` hält Prüfsummen der TIDE_-Abrufe fest, um vor und nach dem Veröffentlichen zu belegen, dass sie gleich bleiben.

Die Beispiele verwenden erfundene Zählpunkt- und EEG-Kennungen.
