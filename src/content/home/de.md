# GeoTrainer-Handbuch

GeoTrainer macht aus Street View gezieltes Geografietraining. Lerne unbekannte Orte kennen, prüfe dein Erinnern ohne Hilfe und wiederhole schwierige Panoramen nach einem an deine Ergebnisse angepassten Zeitplan.

Dieses Handbuch erklärt Lernprinzipien, alle Trainingsmodi, Wiederholungsplanung, Statistik, KI-Hinweise, Synchronisierung und Problemlösung.

## Einführung

GeoTrainer behandelt jedes Panorama als wiederverwendbaren Lernort. Derselbe Ort kann als unbewerteter Lernbesuch, unabhängiger Spielversuch und geplante Wiederholung erscheinen, ohne frühere Ergebnisse zu überschreiben.

### Wofür GeoTrainer gedacht ist

- Länder, Regionen, Städte und Landschaften sicherer erkennen.
- Straßenmarkierungen, Fahrseite, Schriften, Masten, Gelände, Vegetation, Architektur und Kameramerkmale einordnen.
- Fehler automatisch in nützliche spätere Wiederholungen verwandeln.
- Nur tatsächlich besuchte Orte als persönliche Abdeckung zählen.

### Grenzen

Länder- und Stadtdaten sind Ausgangspunkte für die Panoramasuche, kein vollständiger Atlas. KI-Analysen sind Lernhilfen und keine sichere Antwortquelle. Abdeckung zeigt ausschließlich deine Begegnungen.

## Lernhintergrund

### Aktives Erinnern

Ein Ort kann vertraut wirken, obwohl du ihn nicht benennen kannst. Aktives Erinnern verlangt eine Entscheidung vor der Lösung. Das Abrufen stärkt die Erinnerung und zeigt Unsicherheit, die beim passiven Betrachten verborgen bleibt.

Spiel und Wiederholung sind echte Abrufprüfungen: Hinweise sammeln, mehrere Erklärungen abwägen und erst danach einen Ort setzen.

### Nutzen oder vergessen

Einmal gesehene Hinweise verblassen schnell. Alles gleich oft zu wiederholen verschwendet Zeit; schwierige Orte gar nicht zu wiederholen lässt sie verschwinden. GeoTrainer konzentriert die Arbeit auf unsichere Erinnerungen.

### Verteilte Wiederholung

Ein schwaches Ergebnis kommt früher zurück, ein starkes später. Mit jeder sicheren Wiederholung wächst der Abstand. GeoTrainer bewertet automatisch anhand von Land, Entfernung, Punktzahl, Antwortzeit und Strengegrad; manuelle Noten gibt es nicht.

## Schnellstart

### Erste Sitzung

1. Öffne Lernen und untersuche einige neue Panoramen.
2. Entscheide dich innerlich für einen Ort, bevor du Aufdecken nutzt.
3. Speichere einen nützlichen Ort bei Bedarf für die Wiederholung.
4. Spiele eine kurze Runde ohne externe Hilfe.
5. Öffne Wiederholung, sobald Orte fällig sind.

### Tägliche Routine

Erledige zuerst fällige Wiederholungen und spiele danach eine kleine Zahl neuer Runden. Nutze Lernen für langsame Erkundung. Regelmäßige kurze Sitzungen sind wirksamer als eine seltene sehr lange Sitzung.

## Grundbegriffe

### Orte und Versuche

Ein Ort ist möglichst an seine Panorama-ID gebunden. Jeder abgegebene Tipp in Spiel oder Wiederholung erzeugt einen neuen Versuch. Frühere Versuche bleiben unverändert, damit der Verlauf echte Verbesserung zeigt.

### Wiederholungskarten

Spiel-Fehler können automatisch eine Karte anlegen. Lernen erstellt mit Für Wiederholung speichern eine unbewertete Quellkarte; sie erscheint als neue Karte, nicht als Versuch ohne Tipp oder mit falschem Land. Wiederholungsantworten ergänzen neue Versuche und ändern nur den Zeitplan der Karte.

### Kartenstatus

- Neu — gespeichert, aber noch nicht wiederholt.
- Lernen — neu eingeführt und in kurzen Abständen aktiv.
- Erneut lernen — nach einer schwachen Wiederholung wieder in kurzen Abständen.
- Jung — etabliert, aber mit weniger als 21 Tagen Intervall.
- Reif — mindestens 21 Tage Intervall.

### Sammlungen

Sammlungen begrenzen die Länder der Panoramasuche. Eigene Sammlungen speichern eine wiederverwendbare Länderauswahl, ohne Orte oder Verlauf zu duplizieren.

## Wie GeoTrainer GeoGuessr ergänzt

[GeoGuessr](https://www.geoguessr.com/) eignet sich besonders für Entdeckung, vielfältige Karten, Solo-Herausforderungen, Mehrspieler und Wettbewerb. GeoTrainer konzentriert sich auf die Zeit zwischen diesen Spielen: Begegnungen und Fehler werden zu einem dauerhaften Lernplan.

Ein Ergebnis zeigt, wie eine Runde lief. GeoTrainer nimmt schwache Orte mit in unbewertetes Lernen, unveränderte Versuchsverläufe, automatische verteilte Wiederholung, gezielte Länderverwechslungen, gespeicherte Hinweise und persönliche Abdeckung. Nutze GeoGuessr zum Erkunden und Messen mit anderen; nutze GeoTrainer, um Fehler zu zerlegen, Verwechslungen zu üben und Wissen zu festigen. Es ist eine Ergänzung, kein Ersatz.

## Lernmodus

Für benutzerdefiniertes Lernen und Spielen gibt es bei **Innenaufnahmen** Nur draußen (Standard) oder Gemischt: drinnen und draußen. Google bietet keine verlässliche Suche nur nach Innenaufnahmen; Gemischt kann beides zeigen. Hochgeladene Karten, Meta, Karte erkunden und Wiederholung bleiben unverändert.

Lernen bietet vier Wege: Benutzerdefiniert, Meta, Karte erkunden und Hochgeladene Karte. Für eine hochgeladene Karte wähle eine Map-Maker-JSON-Datei mit einer Ortsliste oder `customCoordinates`; jeder Ort braucht gültige Breiten- und Längengrade. Die Datei muss kleiner als 10 MB sein. Zurück steht vor Anzeigen und ist nach dem zweiten besuchten Ort verfügbar. Weiter geht zuerst durch bereits besuchte Orte voran und wählt danach einen neuen Ort. Das X rechts im Kopfbereich öffnet die Auswahl des Lernmodus. Die Karte bleibt auf diesem Gerät; lade sie auf anderen Geräten erneut hoch. Ortsvariation 0 behält die hochgeladene Ansicht; 100 sucht Street View bis zu 1 km entfernt und fällt bei Bedarf auf einen ursprünglichen Ort zurück. Minus minimiert die Ortskarte, Maximieren füllt den Bildschirm.

### Lernpriorität wählen

Das Lernen mit hochgeladener Karte kennzeichnet den Quellenfortschritt (zum Beispiel **Quelle: 1/50**). Jeder Eintrag wird nach der Prüfung als erledigt markiert, sodass **Weiter** ihn auch dann nicht erneut auswählt, wenn eine nahe Variation ein anderes Panorama öffnet; fehlerhafte Einträge werden ebenfalls nur einmal geprüft. Am Ende verschwindet **Weiter**, sodass nur **Zurück** bleibt. Auch im Spiel werden Quelleneinträge nicht wiederholt. In Karte erkunden kannst du nach Stadt, Region oder Land suchen und einen Vorschlag aus dem integrierten GeoTrainer-Katalog wählen, um dorthin zu zoomen. Vorschläge bewegen nur die Abdeckungskarte; klicke auf die blaue Abdeckung, um Street View zu öffnen. Persönlicher Notizbuchtext ist pro Speicherung auf 1.000 Zeichen begrenzt; unter dem Editor steht ein Zähler.

Die Priorität bestimmt, wie **neue Orte im benutzerdefinierten Lernen** ausgewählt werden, nachdem Sammlung, Ländermischung, Umgebung, Bildquelle und Innenraumfilter angewendet wurden. Sie verändert Hochgeladene Karte, Meta, Karte erkunden, Spiel und Wiederholung nicht.

- **Zufällig** (Standard) wählt aus dem geeigneten Pool ohne deinen Verlauf. In Welt verringert es das Gewicht sehr kleiner Gebiete, damit sie nicht dominieren. Nutze es für Abwechslung oder eine breite Tour durch die Sammlung.
- **Vertraute Orte** nimmt einen bereits besuchten geeigneten Ort als Ausgangspunkt und sucht ungefähr 1–12 km darum herum. So lernst du die Umgebung und erkennst nahe Ansichten, ohne dasselbe Panorama genau zu wiederholen.
- **Wenigste Erfahrung** wählt zuerst ein ungesehenes oder am seltensten besuchtes geeignetes Land, füllt enthaltene Regionen, die in Abdeckung noch grau sind, und zielt danach auf die größte verbleibende geografische Lücke. Dieser regionale Schritt gilt auch für Sammlungen mit nur einem Land; Regionen ohne nutzbaren lokalen Ausgangspunkt fallen auf die landesweite Lückensuche zurück.

Wenn kein geeigneter Verlauf vorhanden ist, beginnen Vertraute Orte und Wenigste Erfahrung wie Zufällig im gewählten Pool. Bei einer Suche mit Wenigste Erfahrung und mehreren Ländern versucht GeoTrainer zuerst das gewählte graue oder am wenigsten besuchte Land und dessen regionales Ziel. Jede erfolglose Suche, auch bei einem Panorama außerhalb des angeforderten Landes, geht sofort weiter. Scheitert ein ungesehenes Land, folgen Länder mit bereits bestätigter Abdeckung von der geringsten bis zur höchsten Erfahrung, bevor weitere unbekannte Länder versucht werden; Gleichstände werden gemischt. Die Reihenfolge wiederholt sich, bis ein Panorama gefunden wird oder du die Ansicht verlässt. Street-View-Abdeckung und aktive Filter bestimmen weiterhin, ob das Zielgebiet ein Panorama liefern kann; fehlt am exakten Punkt die Abdeckung, kann eine nahe verfügbare Ansicht verwendet werden.

Bei Welt mit Wenigste Erfahrung überspringt eine integrierte Abdeckungsprüfung Länder, deren Punkte kein navigierbares offizielles Panorama fanden. Fokussierte Länderpools durchsuchen weiterhin alle ausgewählten Länder.

Lernen ist eine unbewertete erste Begegnung für Beobachtung und neue Hinweisarten ohne Punktedruck. Nach dem Speichern für die Wiederholung bleibt das aktuelle Panorama geöffnet; mit Weiter wechselst du ausdrücklich zum nächsten Ort.

### Lernen einrichten

Wähle eine ganze Sammlung, ein einzelnes Zielland oder einen Ländermix für typische Verwechslungen. Jedes gewählte Land erscheint als Flaggen-Pille und kann einzeln entfernt werden.

Verwende die getrennten Auswahllisten **Regionen** und **Städte** und entferne Auswahlen über ihre Pillen. Regionen sind nach Land und Städte nach Region gruppiert. Ohne ausgewählte Region gilt der normale landesweite Pool. Ohne ausgewählte Stadt einer Region sind alle verfügbaren Städte enthalten; einzelne Städte grenzen nur diese Region ein. Das Entfernen einer Region entfernt ihre Städte; das Entfernen ihrer letzten Stadt stellt alle verfügbaren Städte wieder her. Nach dem Hinzufügen von Ländern kannst du Regionen und Städte als eigene Pillen hinzufügen. Regionen sind alphabetisch sortiert; Städte werden standardmäßig nach Bedeutung anhand der Einwohnerzahl sortiert und können alphabetisch angezeigt werden. **Alle verfügbaren Städte** verwendet die enthaltenen Stadtpunkte einer Region; dies deckt nicht das gesamte Verwaltungsgebiet ab und garantiert nicht jede Straße oder ländliche Gegend. Eine neue Lernkonfiguration nach einer gezielten Sitzung stellt World und die vollständige Länderliste wieder her; Fortsetzen behält die gespeicherte Sitzung. Geringste Erfahrung zuerst sucht zunächst am gewählten Punkt und erweitert dann lokal. Bei Gemischt nutzen weitere Versuche Abdeckungspunkte des Landes unter Beibehaltung der Filter. Die Suche läuft in angemessenem Tempo weiter, bis sie einen Treffer findet oder du die Ansicht verlässt beziehungsweise die Einstellungen änderst; Abdeckung am exakten Zielpunkt ist nicht garantiert.

Regions- und Städtenamen folgen der Sprache der Benutzeroberfläche, sofern ein lokalisierter Name verfügbar ist. **Geografischen Pool speichern** lädt die aktuellen Länder-, Regionen- und Städteauswahlen als JSON ohne Street-View-Koordinaten herunter. **JSON hochladen** und **JSON-URL** akzeptieren dieses bearbeitbare Format oder Map-Maker-Koordinaten; ein geografischer Pool kehrt zum bearbeitbaren Modus Benutzerdefiniert zurück, Koordinaten bleiben eine endliche Quelle. Der Datei- oder URL-Name wird angezeigt. Der Endpoint muss Browserzugriff per CORS erlauben.

**Pool beschreiben** sendet eine kurze Lernanfrage an Gemini und öffnet die vorgeschlagenen Länder, Regionen und Städte unter Benutzerdefiniert zur Prüfung und Bearbeitung. Du kannst in jeder unterstützten Sprache Orte, Landschaftsthemen oder häufige Verwechslungen beschreiben. Das Ergebnis ist ein KI-Vorschlag, keine geografische Garantie.

### Ein Panorama untersuchen

1. Betrachte zuerst die ganze Szene.
2. Trenne Beobachtung und Schlussfolgerung.
3. Bilde eine kurze Kandidatenliste aus mehreren passenden Hinweisen.
4. Decke den Ort erst nach einer eigenen Entscheidung auf.
5. Wechsle zum nächsten Ort oder speichere ihn für Wiederholung.

### Aufdecken

Aufdecken zeigt genaue Ortsdaten. Vorher bleiben Antwortinformationen verborgen. Erneutes Ausblenden verwandelt den Besuch nicht in einen bewerteten Versuch.

### Für Wiederholung speichern

Die Aktion erzeugt genau eine wiederverwendbare Quellkarte. Sie erfindet keinen Tipp, keine Entfernung, keine Punktzahl und keine Note. Nach einem Neuladen bleibt der Ort als gespeichert erkannt und die Aktion erscheint nicht erneut.

### Umgebung und Auswahl

Gemischt, Städtisch, Vorstädtisch und Ländlich steuern die gewünschte Umgebung. Die Stadtstufe verstärkt die Nähe zum Zentrum. Natürlich folgt eher der verfügbaren Verteilung; Ausgewogen verteilt Übung gleichmäßiger über die gewählten Länder.

Diese Werte steuern die Suche, garantieren aber wegen begrenzter Street-View-Abdeckung kein exaktes Ergebnis.

## Spielmodus

Wähle in den Spieleinstellungen Generierte Orte oder Hochgeladene Karte. Die Runden verwenden Orte aus der Datei und können sie wiederholen, wenn es mehr Runden als Orte gibt.

### Spieleinstellungen

- 1 bis 100 Runden.
- Länder-Sammlung und Umgebung; Beliebige Umgebung entfernt den Filter, alternativ kann die Suche auf Stadt, Vorstadt oder Land begrenzt werden.
- Optionaler Ländermix für ein Zielland oder häufig verwechselte Länder.
- Natürliche oder ausgewogene Auswahl.
- Optionales Zeitlimit und Kompass.
- KI-Coach pro Spiel ein- oder ausschalten.

### Bewegungsregeln

- Standard — bewegen, drehen und zoomen.
- No Move — drehen und zoomen, aber den Startpunkt nicht verlassen.
- NMPZ — weder bewegen noch drehen noch zoomen.

Bewegliche Spiele lehnen isolierte Panoramen ab. Dadurch kann die Suche länger dauern.

### Tipp und Ergebnis

Setze die Markierung auf der Karte und sende sie ab. Das Ergebnis zeigt tatsächlichen Ort, Entfernung, Punktzahl und Kontext. Jede Runde bleibt als eigener Versuch im Verlauf.

Beim Absenden speichert GeoTrainer die aktuelle Street-View-Ansicht für spätere Abdeckungs- und Verlaufs-Vorschauen.

### Gespeicherte Spiele

Beendete und unterbrochene Spiele erscheinen unter Frühere Spiele. Zusammenfassungen erhalten Reihenfolge, Regeln, Zeiten, Orte und Punkte. Fehlertraining erstellt neue Korrekturversuche, ohne das Spiel umzuschreiben.

## Wiederholungsmodus

### Vor der Antwort

Das Panorama erscheint ohne Lösung, frühere Antwort, Punktzahl oder andere verräterische Metadaten. Löst Google eine alte Panorama-ID mehr als 10 km vom gespeicherten Ziel entfernt auf, verwendet die Wiederholung stattdessen ein gültiges Panorama nahe den gespeicherten Koordinaten oder öffnet die Karte nicht. Du musst zuerst selbst tippen.

### Nach der Antwort

Das Ergebnis vergleicht deinen aktuellen Tipp mit dem echten Ort und kann ältere Versuche zeigen. Es zeigt außerdem verfügbare Stadt-, Regions-, Straßen- und Adressangaben sowie die genauen Koordinaten – wie Aufdecken im Lernen. Minimiere das Ergebnis oben rechts, um das Panorama zu untersuchen, und öffne es mit Ergebnis ansehen wieder. Die neue Antwort wird als eigener Wiederholungsversuch gespeichert. Coach, Meta, gespeicherte Hinweise, Notizbuch und verfügbare Notizen bleiben zugänglich, bis du die nächste Wiederholung auswählst.

Die Ergebniskarte hält die Lösung grün in der Mitte und zoomt so weit heraus, dass der heutige Tipp in Rot und alle gespeicherten früheren Tipps mit Koordinaten in Blau sichtbar bleiben. Der gewählte Ergebniszoom ist dabei die engste erlaubte Ansicht. Bewertung und nächste Warteschlange werden vor dem Ergebnis gespeichert; nach einem bestandenen Ergebnis lädt die Seite daher mit der nächsten Karte weiter.

### Automatische Bewertung

Land, Entfernung, Punktzahl, Antwortzeit und Strengegrad ergeben intern die nächste Planung. Es gibt keine Schaltflächen für manuelle Noten.

### Warteschlange abschließen

GeoTrainer zeigt die ausgewählten fälligen Karten, bis die Sitzung leer ist. Karten im erneuten Lernen können nach ihrer Minuteneinstellung noch am selben Tag zurückkehren. Werden fällige Karten zurückgehalten, meldet die Ansicht das erreichte Tageslimit, statt alle Wiederholungen als abgeschlossen zu bezeichnen.

## Planung und Einstellungen

### Wiederholung anpassen

- **Neue Karten / Tag** begrenzt Karten, die noch nie wiederholt wurden. **Maximale Wiederholungen / Tag** begrenzt die gesamte bereite Warteschlange einschließlich neuer Karten. Beide Grenzen gelten gleichzeitig. Bei 50 neuen Karten und maximal 500 Wiederholungen können 110 Karten fällig, aber nur 108 bereit sein, wenn zwei neue Karten die Grenze überschreiten. Start und Wiederholung zeigen die tatsächlich verfügbare Zahl; eine höhere Gesamtgrenze umgeht die Grenze für neue Karten nicht.
- **Bewertungsstrenge** steuert die automatische Bewertung: Anfänger toleriert größere Abstände, Ausgewogen verbindet Land und Genauigkeit, Profi verlangt ein stärkeres Ergebnis. Land, Entfernung, Punktzahl und Antwortzeit fließen ein; manuelle Nochmal/Schwer/Gut/Leicht-Schaltflächen gibt es nicht.
- **Spielrunden zur Wiederholung hinzufügen** ist von der Bewertung getrennt: Eine künftige Spielrunde erstellt eine Karte, wenn ihre Punktzahl unter dem gewählten Grenzwert liegt oder das Land falsch ist. Eine aktivierte Bedingung genügt; neue Profile beginnen am aktiven Schwer/Nochmal-Grenzwert (3.000 bei Ausgewogen).
- **Erste Wiederholung**, **Wiederlernschritt**, **erstes Exzellent-Intervall** und **maximales Intervall** steuern erste Fälligkeit, Rückkehr nach einem Fehler, Wartezeit nach einem ausgezeichneten ersten Ergebnis und die Obergrenze reifer Karten.
- **Maximale Antwortzeit** beeinflusst die Bewertung der Abrufflüssigkeit, ohne zwingend einen Countdown zu erzeugen. **Reihenfolge** wählt älteste Fälligkeit zuerst oder eine zufällige Warteschlange.
- **Rücksetzzeit** und **Zeitzone** bestimmen den Beginn des neuen Wiederholungstags und die Erneuerung der Grenzen. Automatische Erkennung folgt dem Gerät; schalte sie aus, um die Zone selbst zu wählen. Die Vorschau zeigt die tatsächliche nächste Wiederholung.
- **Wiederholungsansicht variieren** behält dieselbe Karte und Planung, kann bei reifen Karten aber Blickrichtung oder nahes Panorama ändern. Null nutzt die Originalansicht; Fehler verringern die Variation und eine fehlgeschlagene Suche fällt ohne Dublette auf den Anker zurück.

Wähle **Speichern**, um Änderungen anzuwenden. Strenge und Intervalle beeinflussen künftige Planung, ohne gespeicherte Versuche umzuschreiben; Grenzen und Reihenfolge gelten bei der nächsten Berechnung der Warteschlange.

Unter Einstellungen → Anzeige → Karten bietet die **Kartenfarbpalette** Automatisch, Hell oder Dunkel. **Zoom der Ergebniskarte** bietet Nah, Land, Landesregion oder Welt; Land ist der Standard. Automatisch folgt dem App-Design; Hell oder Dunkel behält die gewählte Farbe für Straßen- und Geländekarten bei. Satellitenbilder behalten ihre Farben. Ländergrenzen sind standardmäßig sichtbar und können ausgeschaltet werden; sie erscheinen nur, wenn eine Grenze im sichtbaren Kartenausschnitt liegt. Breite und Farbe der Grenzen lassen sich mit einer Live-Vorschau anpassen; Regionsgrenzen sind standardmäßig aus und können separat aktiviert werden.

### Strengegrad

- Anfänger belohnt Ländererkennung und toleriert größere Entfernung.
- Ausgewogen verbindet Länderwissen und regionale Genauigkeit.
- Profi verlangt bessere Punktgenauigkeit.

Eine Änderung wirkt auf künftige Bewertungen und schreibt alte Versuche nicht um.

### Tageslimits

Neue Karten pro Tag begrenzt erstmals fällige Orte. Maximale Wiederholungen pro Tag begrenzt die gesamte Tageslast. Neue Profile starten mit 50 neuen Karten und 500 Wiederholungen pro Tag; gespeicherte Werte bleiben erhalten. Orte im selben Land innerhalb von 50 Metern teilen eine Karte – auch bei Speichern, Notizbuch, Coach und Spiel.

### Intervalle

Erste Wiederholung bestimmt die anfängliche Verzögerung. Erneutes Lernen legt die Minuten nach einem schwachen Ergebnis fest. Einfaches erstes Intervall belohnt eine außergewöhnlich starke erste Antwort. Maximales Intervall begrenzt sehr lange Abstände.

### Antwortzeit, Reihenfolge und Tageswechsel

Maximale Antwortsekunden unterscheiden flüssiges Erinnern von langem Suchen. Älteste fällige priorisiert lange wartende Karten; Zufällig mischt die Auswahl. Rücksetzzeit und die per Auswahlfeld oder automatisch erkannte Zeitzone definieren den Beginn eines neuen Wiederholungstags. Die Einstellungen zeigen die tatsächlich nächste geplante Wiederholung mit Ortszeit und verbleibender Dauer.

## Benutzerdefinierte Übung

Zusätzliche Übung kann nach schwachen Ländern, letzten Fehlern, ungesehenen Orten, Punktbereichen oder Fälligkeit gefiltert werden.

### Planungsregel

Benutzerdefinierte Übung lässt zukünftige Karten unverändert. Wird eine bereits fällige Karte abgeschlossen, rückt ihr Zeitplan weiter und bleibt nach dem Neuladen nicht fällig.

### Fehlerkorrektur

Nach einem Spiel öffnet Fehler üben die Wiederholung und wiederholt schwache Runden, bis sie gelöst werden. Die Aktion erscheint nur, wenn für das gespeicherte Spiel noch geeignete Versuchsdaten vorhanden sind. Jeder schwache Spielort bleibt eine neue Wiederholungskarte; Korrekturversuche werden separat gespeichert und verändern die ursprünglichen Spieldaten nie.

## KI-Coach

Der KI-Coach untersucht sichtbare geografische Hinweise. Er funktioniert auch für Gäste ohne Konto.

Vor dem Aufdecken kann eine Analyse mit hoher Sicherheit nach der Länderrangliste eine Region, Stadt, ein Viertel, eine Sehenswürdigkeit oder einen genauen Ort unter „Am wahrscheinlichsten in“ nennen, aber nur wenn mehrere starke sichtbare Hinweise diesen genaueren Ort stützen. Bei allgemeinen Szenen bleibt diese Schätzung verborgen.

Spiel verwendet dieselbe Lernleiste wie Lernen: Notizbuch, die Anzahl naher verfügbarer Notizen und – falls in der Spieleinrichtung aktiviert – KI-Coach.

Coach wartet vor der Analyse auf die gespeicherte KI-Sprache, lokalisiert die Namen der Kandidatenländer, verwirft deutlich gemischtsprachige Ergebnisse und wiederholt vage Begründungen, die ohne unterscheidbares sichtbares Merkmal nur behaupten, eine Szene sei für ein Land stimmig, ähnlich, häufig oder typisch.

### Analysieren

Analysieren bewertet die aktuelle Ansicht: Straßengestaltung, Schrift, Infrastruktur, Gelände, Vegetation, Architektur, Wetter und erkennbare Bildmerkmale.

Die Analyse prüft automatisch mehrere Blickrichtungen und nutzt die aktuelle Ansicht als Ersatz, wenn Rundum-Bilder nicht verfügbar sind. Beim Bewegen am selben Ort und nach dem Aufdecken bleiben frühere Beobachtungen erhalten.

### Screenshot einfügen und analysieren

1. Richte den sichtbaren Hinweis aus und drücke **Druck** oder **Windows + Umschalt + S**, um einen Screenshot zu kopieren.
2. Öffne **KI-Coach → Bekannte Hinweise**, wähle das Hinweisfeld und drücke **Strg + V** (unter macOS **Befehl + V**).
3. Prüfe die Vorschau und wähle **Hinweis analysieren**.
4. GeoTrainer speichert Bild, Belege und Lernnotiz automatisch unter **Hinweise**. Vor einem Tipp in der Wiederholung bleibt die Analyse lösungssicher.

Hat der Ausschnitt ein klares Vordergrundmotiv, untersucht der Coach dieses zuerst und nutzt die Umgebung als stützenden oder widersprechenden Kontext. Unlesbare Details bleiben ausdrücklich unsicher.

### Eine externe KI-Antwort im Notizbuch verwenden

1. Erfasse oder kopiere das Hinweisbild.
2. Öffne Gemini oder eine andere externe Google-KI-Oberfläche und füge das Bild ein.
3. Beginne mit: **„Du bist ein GeoGuessr-Coach.“** Bitte um sichtbare Belege, Hauptverwechslungen und den Hinweis, der sie unterscheiden würde.
4. Kopiere die Antwort und füge sie in das Textfeld des **Notizbuchs** ein.
5. Speichere die Notiz für die Wiederholung.

Das Notizbuch bewahrt eingefügte Überschriften, Fettdruck und Aufzählungen. Externe Antworten werden nicht automatisch geprüft; halte Unlesbares unsicher und gleiche jede Aussage mit dem tatsächlich Sichtbaren ab.

### Schutz vor Lösungen

Vor einem Tipp erhält der Coach keine Antwortmetadaten. Eine Regions-, Stadt- oder genaue Ortsschätzung erscheint nur bei mehreren starken sichtbaren Hinweisen. Nach Aufdecken oder Abgabe wird **Analysieren** zu **Erklären**; der Coach nutzt nur Hinweise zum richtigen Land und sagt offen, wenn das Bild allein nicht ausreichte.

### Zuverlässigkeit

Behandle jede Aussage als Hypothese. Mehrere unabhängige Hinweise sind stärker als ein auffälliger Einzelhinweis. Ein Ausfall des Coachs blockiert keinen Trainingsmodus.

## Gespeicherte Hinweise

### Gute Notizen

- Sichtbares Merkmal genau beschreiben.
- Erklären, warum es einen Ort unterstützt.
- Typische Verwechslungen und Grenzen notieren.
- Sicherheit an die Belegstärke anpassen.

Gespeicherte Hinweise lassen sich vollständig öffnen und löschen. Der Länderfilter zeigt Hinweiszahlen und ist nach den meisten Hinweisen sortiert; × hebt den Filter auf. Zurück aus einem Detail führt direkt zur Bibliothek. Die Detailansicht enthält gespeichertes Bild, interaktives Street View, Länderwahrscheinlichkeiten, Belege, Grenzen, Widersprüche und nächste Prüfschritte. Ortslinks öffnen das Panorama in Google Maps. Das Löschen entfernt weder Panorama noch Besuche oder Versuche.

## Sammlungen und Ortsauswahl

### Integrierte Sammlungen

Integrierte Sammlungen bieten breite Ländergruppen. Länder- und Stadtdaten steuern nur die Suche und zählen nicht als persönliche Abdeckung.

### Eigene Sammlungen

Erstelle eine Sammlung für wiederholtes Training einer eigenen Länderauswahl. Änderungen wirken auf künftige Panoramen, während alte Spiele und Versuche erhalten bleiben.

### Verfügbarkeit

Street-View-Abdeckung ändert sich. Panoramen können verschwinden, ersetzt werden oder falsche Metadaten liefern. GeoTrainer prüft Kandidaten und versucht es erneut, kann aber nicht jede Anfrage garantieren.

## Sprache und Darstellung

### Sprache

Oberflächensprache, geografische Spielbezeichnungen und KI-Antwortsprache sind unabhängig. Unterstützt werden Englisch, Spanisch, Portugiesisch, Französisch, Deutsch, Italienisch, Russisch und Schwedisch.

### Darstellung

Helles oder dunkles Farbschema, Kompass-Sichtbarkeit und Kompassstil verändern nur die Anzeige. Optionale Klangeffekte und Ambient-Musik starten ausgeschaltet, speichern getrennte Lautstärken und beginnen erst nach einer Interaktion. Sie beeinflussen weder Punkte noch Planung.

### Einstellungen ändern

Öffne Einstellungen über das Zahnradsymbol. Beginne mit Ausgewogen und ändere jeweils nur eine Einstellungsgruppe, damit du ihre Auswirkung erkennen kannst.

## Fortschritt und Statistik

Gespeicherte Lernorte sind unbewertete Quellen: Sie erscheinen als Lernaktivität und neue Wiederholungskarten, nicht als „Kein Tipp“-Versuche oder Nullpunkte. Beim Neuladen wird der aktuelle Lernbesuch fortgesetzt, statt eine weitere Zeile anzulegen.

### Fortschritt

Fortschritt fasst heutige und gesamte Orte, Versuche, fällige Wiederholungen und aktive Vordergrundzeit in Lernen, laufendem Spiel und laufender Wiederholung zusammen—einschließlich Bewegung im Panorama und Nutzung der Lernhilfen. Die aktive Zeit wird beim Bereichswechsel oder bei der Rückkehr zur Startseite gespeichert; Sitzungen ohne Lernbesuch, Spiel- oder Wiederholungsversuch werden ausgeblendet. Halte auf einem Touchscreen einen Balken unter **Künftig fällig** gedrückt, um Datum und Anzahl zu sehen. Bekannte Hinweise auf der Startseite entspricht Meine Hinweise: persönliche, KI-unterstützte und ausdrücklich gespeicherte Meta-Einträge zählen, ein Notizbuchbild nicht doppelt. Es ist eine Arbeits- und Gewohnheitsansicht, keine einzelne Meisterschaftsnote.

### Leistung

Leistung, Geografie, Fortschritt und Verwechslungen kombinieren kanonische Spiel- und Wiederholungsversuche im gewählten Zeitraum; das KI-Kontrollkästchen betrifft nur das Spiel. Verdeckte oder geschlossene Zeit erhöht neue Antwortzeiten nicht. Ländergenauigkeit, Durchschnittspunktzahl, schwache Länder und Verwechslungen sind über längere Zeit aussagekräftiger als an einem einzelnen Tag.

Der Verbesserungsverlauf zeigt zuerst die neuesten 10 Einträge. Sitzungen und alle Verlauf-Tabs zeigen ebenfalls 10 Einträge pro Seite. Mit Zurück und Weiter unter jeder Liste erreichst du ältere Ergebnisse; ein anderer Tab oder Filter springt auf Seite eins zurück.

### KI-unterstützte Runden

Spielversuche mit KI-Unterstützung sind standardmäßig einbezogen. Entferne das Häkchen für eine rein nicht unterstützte Ansicht. Wiederholungszusammenfassungen vergleichen den früheren mit dem heutigen Durchschnitt und nennen verbessert, gleich oder schlechter; der 12-Wochen-Kalender färbt Tage nach Aktivität.

### Daten sinnvoll lesen

Eine schlechte Sitzung bedeutet keinen dauerhaften Rückschritt. Suche nach wiederkehrenden Verwechslungen, konstant schwachen Punkten oder wachsendem Rückstand, bevor du dein Training änderst.

## Abdeckung und Verlauf

### Abdeckungskarte

Die Karte zeigt nur Panoramen, denen du in Lernen, Spiel oder Wiederholung begegnet bist. Ebenen können Begegnungen, Genauigkeit, Durchschnitt, Schwäche, fällige Wiederholungen oder Meisterschaft hervorheben. Eine detaillierte SVG-Länder-Heatmap überträgt dieselbe Ebene auf Länderflächen; ihre warme, blaue, grüne oder violette Palette lässt sich unabhängig von den Daten wählen. Du kannst die Heatmap ziehen und mit Mausrad, Schieberegler oder Tasten zoomen. Ein Klick auf ein Land öffnet die regionale Heatmap mit derselben Ebene. Regionen werden anhand gespeicherter Ortsangaben oder beim Öffnen über Google Maps zugeordnet. Für manche Länder fehlen regionale Kartendaten; Orte ohne eindeutige Region bleiben ungefärbt. In der Begegnungsebene zeigt das Darüberfahren die genaue Anzahl. Die neutrale Farbe bedeutet je nach Ebene „noch nicht begegnet“, „keine gewerteten Versuche“ oder „kein Wiederholungsverlauf“—nicht fehlende Google-Maps-Abdeckung.

Einmal geöffnete Ergebnis-, Erkundungs-, Abdeckungs- und Statistikkarten bleiben beim Ausblenden ihres Fensters oder Reiters geladen und öffnen dadurch ohne erneute Karteninitialisierung. Kartenkacheln verwenden den Browser- und Google-Maps-Cache; GeoTrainer speichert Karten- oder Street-View-Bilder nicht lokal.

Gespeicherte Lernorte und abgegebene Spieltipps behalten die aktuelle Ansicht als Vorschau. Ein geöffnetes Abdeckungspanorama bietet KI-Coach, Notizbuch, verknüpfte Meta und verfügbare Notizen; Speichern erstellt oder verwendet seine Wiederholungskarte. In Länder-, Kategorie- und Sammlungsmenüs kannst du die Anfangsbuchstaben tippen, um direkt zu einer Option zu springen.

### Ländertabelle

Sortiere Gesehen, Gespielt, Wiederholt, Richtig, Falsch, Durchschnitt, Bestes, Zuletzt gesehen und bekannte Hinweise, um Lücken zu finden.

### Verlauf

Der Verlauf filtert Besuche, Spielversuche, Wiederholungsversuche und gespeicherte Spiele. Jeder Tab zeigt 10 Einträge pro Seite und springt nach Filteränderungen auf die erste Seite zurück. Wenn Google das Original entfernt hat, kann ein markierter Koordinaten-Ersatz in der Nähe geöffnet werden.

## Cloud-Synchronisierung

Ein Konto ist optional. Lokales Training funktioniert ohne Anmeldung.

### Anmeldung

Öffne den Kontoeintrag auf der Startseite und nutze Google oder E-Mail. Die Anmeldung identifiziert dein Konto; Fortschritt wird erst mit **Jetzt synchronisieren** übertragen.

### Synchronisierte Daten

Fortschritt wird zuerst in diesem Browser gespeichert und die Cloud-Synchronisierung ist manuell. Drücke **Jetzt synchronisieren** zuerst auf dem Gerät mit neuen Daten, um Karten, Versuche und den Wiederholungsverlauf herunterzuladen, zusammenzuführen und hochzuladen; synchronisiere danach die anderen Geräte. Der zuletzt bewertete Zeitplan gewinnt, während eindeutige Datensätze aller Geräte erhalten bleiben. Anmeldung, Speichern, Rückkehr zur App und Verlassen übertragen nichts automatisch. Ohne Anmeldung bleiben localhost und die bereitgestellte Website getrennt.

Fehlende private Hinweisbilder werden bei der manuellen Synchronisierung in diesem Browser gespeichert. Hinweise, Verfügbare Notizen, Abdeckung und Verlauf verwenden danach diese lokale Kopie, ohne den Cloud-Speicher abzufragen.

**Synchronisieren & sichern** bietet außerdem **Exportieren** und **Importieren** ohne Cloud-Zugriff. Der Export lädt eine `.geotrainer`-Datei mit der vollständigen lokalen Datenbank und den auf diesem Gerät gespeicherten Fotos herunter. Der Import prüft die Datei und führt nur fehlende oder neuere Informationen zusammen, ohne lokalen Fortschritt zu löschen. Die Datei enthält die Kennung des exportierenden Kontos; bei einem anderen Konto oder ohne Anmeldung ist eine Bestätigung erforderlich. Bewahre die Datei privat auf und übertrage sie über Drive, OneDrive, USB oder einen anderen vertrauenswürdigen Ort.

### Offline arbeiten und abmelden

Lokal vorhandene Daten bleiben offline nutzbar. Neue Panoramen, Geocodierung, KI und Cloud warten gegebenenfalls auf eine Verbindung. Abmelden beendet die Synchronisierung, löscht aber keine lokalen Daten.

## Daten und Wiederherstellung

### Lokaler Fortschritt

Der Verlauf liegt im Browser. Löschen von Websitedaten, privates Surfen oder Geräteverlust kann lokale Daten entfernen. Nutze Cloud-Synchronisierung, wenn dir der Verlauf wichtig ist.

### Kompatibilität

Ältere Spiele und optionale Felder erhalten sichere Standardwerte. Gespeicherte Spiele behalten die Regeln und Rundendaten ihrer ursprünglichen Sitzung.

### Unveränderlicher Verlauf

Wiederholung und Korrektur erzeugen neue Versuche. Ein späterer Erfolg repariert einen früheren Fehler nicht durch Überschreiben.

## Bedienung und Barrierefreiheit

### Tastatur und Anzeige

Leertaste unterstützt den angezeigten Lernablauf. Vollbild reduziert Ablenkung. Karten- und Panoramaelemente folgen ihren unterstützten Tastatur- und Touchgesten, soweit die Spielregel sie erlaubt.

### Barrierefreiheit

Bedienelemente sind per Tastatur erreichbar, Fokus bleibt sichtbar, reduzierte Bewegung wird respektiert und Ergebnisse werden nicht nur über Farbe vermittelt. Browser-Zoom kann die Lesbarkeit erhöhen.

## Fehlerbehebung

### Panorama leer oder nicht verfügbar

Gehe zum nächsten Ort. In Wiederholung oder Verlauf kann ein markierter Ersatz anhand der Koordinaten angeboten werden.

### Street-View-Bedienelemente vor einem schwarzen Bild

Wenn Kompass, Pfeile oder Google-Schriftzug erscheinen, die Panoramaaufnahme aber vollständig schwarz bleibt, teste Street View in Google Maps im selben Browser. Ist sie dort ebenfalls schwarz, öffne GeoTrainer in einem privaten Fenster ohne Erweiterungen, schalte die Grafikbeschleunigung des Browsers um und starte ihn neu. Aktualisiere bei Bedarf Browser und Grafiktreiber. Funktioniert Google Maps, aber GeoTrainer bleibt schwarz, lade GeoTrainer einmal neu und nenne bei der Problemmeldung Browser, Gerät und aktivierte Erweiterungen.

### Ortssuche dauert lange

Sehr kleine Sammlungen, strenge Umgebungsfilter und Beweglichkeitsprüfung reduzieren gültige Kandidaten. Wähle eine breitere Sammlung oder Gemischt.

### Wiederholungswarteschlange ist leer

Spiele weitere Runden, speichere einen Lernort oder warte bis zur Fälligkeit. Prüfe Tageslimits, Rücksetzzeit und Zeitzone.

### Warteschlange ist zu groß

Erledige fällige Wiederholungen vor neuen Orten. Senke Neue Karten pro Tag und arbeite den Rückstand in kleinen täglichen Sitzungen ab.

### KI-Coach ist nicht verfügbar

Trainiere normal weiter und versuche es später erneut. Prüfe die Verbindung oder nutze die aktuelle Ansicht statt 360°. Der Fehler verändert keine Versuche oder Zeitpläne.

### Fortschritt wirkt veraltet

Prüfe das verbundene Konto und drücke auf jedem Gerät **Jetzt synchronisieren**, beginnend mit dem Gerät mit neuen Daten. Ein anderes Konto besitzt einen anderen Cloud-Verlauf.

### Google-Anmeldung schlägt fehl

Kehre zurück und versuche es erneut. Fehler zu Anbieter oder Weiterleitungsadresse müssen in der bereitgestellten Anmeldung korrigiert werden; nutze solange E-Mail, wenn verfügbar.

## Vorschläge und Fehlermeldungen

Sende Vorschläge oder Fehlermeldungen per E-Mail an [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Gib bei Fehlern möglichst Browser, Gerät, den letzten Arbeitsschritt und einen Screenshot an.

## Häufige Fragen

### Brauche ich ein Konto?

Nein. Konto und Anmeldung sind nur für Cloud-Synchronisierung nötig.

### Beeinflusst Lernen meine Punktzahl?

Nein. Lernen ist unbewertet, und Für Wiederholung speichern erfindet kein Ergebnis.

### Kann ich Wiederholungen manuell bewerten?

Nein. Die Planung folgt dem geografischen Ergebnis.

### Verschiebt zusätzliche Übung eine fällige Karte?

Nein. Zukünftige Karten bleiben unverändert; eine bereits fällige Karte wird nach dem Abschluss normal weitergeplant.

### Warum erscheint dasselbe Land erneut?

Die Auswahl verhindert unmittelbare Panorama-Duplikate, nicht jede Länderwiederholung. Verschiedene Umgebungen desselben Landes sind beabsichtigtes Training.

### Zeigt Abdeckung alle unterstützten Orte?

Nein. Sie zeigt nur deine tatsächlich besuchten Panoramen.

### Kennt der KI-Coach vor meinem Tipp die Antwort?

Nein. Vor einer Spiel- oder Wiederholungsantwort werden keine Lösungsdaten übergeben. Im Lernmodus entsteht Antwortkontext erst nach Aufdecken.

## Lernressourcen

### Beweisketten bilden

Beginne breit und werde schrittweise genauer. Kombiniere Fahrseite, Schrift, Straßendesign, Gelände, Vegetation, Infrastruktur, Architektur, Klima und Bildmerkmale.

### Widersprüche notieren

Halte fest, wenn Hinweise nicht zusammenpassen. Ein falscher Tipp mit klar erkannter Ursache ist oft lehrreicher als ein zufällig richtiger Tipp.

### Verständnis vor Etiketten

Lerne, warum ein Hinweis regional variiert, wo er unzuverlässig wird und womit er verwechselt werden kann. So lässt sich Wissen auf unbekannte Panoramen übertragen.

### Empfohlene Reihenfolge

1. Eine Hinweisart im Lernmodus verstehen.
2. Sie in einem kurzen Spiel ohne Coach prüfen.
3. Schwache Orte bei Fälligkeit wiederholen.
4. Statistik erst nach genügend Versuchen auf Muster prüfen.

### Externe Nachschlagewerke

- [Plonk It](https://www.plonkit.net/) — strukturierte Länderleitfäden von der grundlegenden Erkennung über regionale Hinweise bis zu Übungen, Karten und weiterführenden Quellen.
- [GeoHints](https://geohints.com/) — durchsuchbarer Bildkatalog für Leitpfosten, Straßenlinien, Kennzeichen, Schilder, Strommasten, Kameragenerationen, Fahrseite, Landschaften und weitere Hinweisarten.
- [GeoMetas](https://geometas.com/) — kostenlose Länder- und Regionallektionen nach Hinweisart mit dynamischen Quizzen zum aktiven Erinnern.
- [Learnable Meta](https://learnablemeta.com/) — GeoGuessr-Lernkarten sowie Dokumentation und Ressourcen zur Kartenerstellung.

Externe Leitfäden sind Community-Quellen. Kombiniere mehrere Hinweise und rechne mit veralteten Bildern, regionalen Ausnahmen und Änderungen in Street View.

## Lernen, Meta und Notizbuch

Eingefügte, hochgeladene oder aufgenommene Notizbuchbilder können vor Analyse oder Speichern zugeschnitten werden. Öffne unten rechts in der Vorschau die Bearbeitung, verschiebe den Ausschnitt oder seine Eckpunkte und wende ihn an.

Nach dem Speichern einer Textnotiz oder der Analyse eines eingefügten Hinweises bestätigt eine Meldung, dass sie im Notizbuch liegt.

Die **360°-Kamera** im Arbeitsbereich kopiert vier Richtungen des aktuellen Panoramas als ein Bild. Eine Statusmeldung zeigt den Fortschritt und bestätigt, ob das Kopieren erfolgreich war. Das Bild wird direkt in die Zwischenablage gelegt und nicht in GeoTrainer gespeichert.

Lernen bietet vier Wege. **Benutzerdefiniert** behält Sammlungen und Umgebungen. **Meta** öffnet geführte Lektionen am gespeicherten Panorama und Blickwinkel. **Karte erkunden** zeigt die Street-View-Abdeckung. Die Filter unten links wählen offizielle, gemischte oder beigesteuerte Bilder sowie reine Außen- oder gemischte Abdeckung. In Meta und der Karte öffnet Aufdecken die normale Ortskarte; dort plant Für Wiederholung speichern die spätere Ortungsübung. In Karte erkunden führt ein Klick auf die blaue Abdeckung in der eingebetteten Karte zu einem anderen Panorama; die Karte behält dabei Zoom und Position. Wenn Nur offiziell nichts findet, weist die Meldung auf **Offiziell + Beiträge** unten hin; sie ändert den Filter nie selbst. Eine Globus-Schaltfläche oben links im Panorama kehrt zur Weltkarte zurück, ohne den Kopfbereich zu belegen. Aufdecken und Weiter bleiben auch im Vollbild am unteren Rand des sichtbaren Bereichs; mobile Lernwerkzeuge stehen seitlich unter den Kartensteuerungen. Benutzerdefiniertes Lernen und Spiel verwenden standardmäßig offizielle Google-Bilder; die Auswahl kann offizielle und beigesteuerte Panoramen mischen oder nur beigesteuerte Panoramen anfordern. **Innenräume zulassen** ist in beiden Einstellungen standardmäßig ausgeschaltet; aktiviert kann Google Street-View-Abdeckung im Innen- und Außenbereich liefern. Unter **Einstellungen → Anzeige** lassen sich Straßennamen, Aufnahmedatum, Telefonbewegung, Bewegung, Kartentyp, Gesten, anklickbare Orte und GeoTrainer-Farben steuern. Straßennamen und anklickbare Orte sind standardmäßig aus, damit keine unbeabsichtigten Hinweise erscheinen.

Die Glühbirne oben rechts öffnet und schließt die Erklärung. Der erste Hinweis kann einmalig oder dauerhaft geschlossen werden, ohne Lektionen zu entfernen. Ein Meta erscheint erst nach dem ausdrücklichen Speichern zur Wiederholung unter **Meine Hinweise**. In der Wiederholung bleibt Meta vor und nach dem Tipp vollständig zugänglich.

Das **Notizbuch** speichert beliebig viele persönliche Notizen pro Panorama. Kategorie und Text sind optional; auch ein leerer Eintrag kann den Ort zur Wiederholung speichern. Referenzbilder lassen sich außerdem einfügen oder hochladen und mit Coach analysieren. Persönliche, KI-unterstützte und Meta-Einträge öffnen eine Detailansicht mit Street View und, falls vorhanden, einem eingeblendeten Bild. In der Detailansicht eines gespeicherten Bildhinweises kannst du seine Notiz hinzufügen oder bearbeiten, speichern und das Bild im Vollbild öffnen. Identische Bilder werden nur zusammengeführt, wenn Notiz oder Beschreibung ebenfalls identisch oder leer sind; unterschiedliche aussagekräftige Texte bleiben getrennt. **Verfügbare Notizen** zeigt mit Zähler den vollständigen Verlauf des Panoramas und gleichländiger Street-View-Knoten im Umkreis von 50 Metern in einem einzigen durchgehenden Scrollbereich; neue Coach-Analysen erscheinen dort sofort und werden nach dem Neuladen nicht wieder als aktives Coach-Ergebnis geöffnet. Meine Hinweise filtert **Persönlich**, **KI-unterstützt** und **Meta-Lektionen** und zeigt passende Einträge seitenweise zu je 20. Während der Wiederholung bleiben Notiztext, Analysen, Kandidaten und Wahrscheinlichkeiten vor und nach dem Tipp sichtbar.

Jeder Eintrag unter Verfügbare Notizen hat eine zurückhaltende Papierkorb-Aktion. Einträge mit demselben normalisierten Text oder exakt demselben Bild werden automatisch zusammengeführt; die vollständigste Version mit Bild und Beschreibung bleibt erhalten.

Jeder Speichervorgang im Notizbuch bleibt ein eigener Eintrag, auch im selben Panorama. Kann ein eingereichtes Foto nicht geladen werden, bleibt die Notiz sichtbar und wird zur Wiederherstellung markiert.

Jede abgeschlossene Coach-Analyse wird erst nach erfolgreichem Schreiben in Verfügbare Notizen und Meine Hinweise übernommen, auch reine Textanalysen ohne Bild. Gleichzeitig abgeschlossene Analysen werden nacheinander gespeichert, damit kein Eintrag einen anderen überschreibt.

Ein schwaches Wiederholungsergebnis kehrt automatisch ans Ende der aktuellen Sitzung zurück, bis es bestanden wird. Jeder Versuch bleibt ein eigener Eintrag.

Meta-Lernen enthält 359 lokal gehostete Lektionen, normalisiert aus der gekoppelten OpenGuessr-Aufzeichnung und zusätzlichen GeoMetas-Beispielen mit nutzbaren Street-View-Koordinaten. Meta-Erklärungen folgen der Oberflächensprache in allen acht unterstützten Sprachen. Die Nutzung von KI-Coach oder das Speichern eines Notizbuch-Eintrags erstellt oder verwendet automatisch die Wiederholungskarte; andernfalls bleibt Für Wiederholung speichern auf der aufgedeckten Ortskarte sichtbar. **Verfügbare Notizen** enthält nur persönliche und KI-unterstützte Verläufe mit vollständiger Analyse, genauer Uhrzeit und dem eingereichten Bild, falls vorhanden; Meta bleibt unter der eigenen Glühbirne. Coach wartet auf die gespeicherte Spracheinstellung und fordert alle natürlichsprachigen Antwortwerte in der gewählten KI-Sprache an. Fertige persönliche und KI-Texte behalten ihre Erstellungssprache. Das Wiederholen einer bereits fälligen Karte verschiebt ihren Plan auch aus einer benutzerdefinierten Übung heraus und bleibt nach dem Neuladen gespeichert.

Meta-Lernen wählt nur noch nicht abgeschlossene Lektionen. In der Einrichtung setzt **Allgemein** mit einer zufälligen offenen Lektion fort, während **Durchsuchen** den übersetzten Katalog durchsucht und die gewählte Lektion startet. Durchsuchen kann alle, offene oder erledigte Lektionen anzeigen; erledigte Zeilen sind sichtbar markiert und lassen sich nicht erneut starten. Nach allen 359 Lektionen ist die Option im Lernmenü ausgegraut und nicht mehr auswählbar.

Eine unfertige Lern- oder Spielsitzung bleibt erhalten. Beim nächsten Öffnen stehen **Fortsetzen**, **Neu starten** und **Zurück** zur Wahl. Die Kartenabdeckung enthält eine kontinuierliche **Beherrschung**-Heatmap; viele erfolgreiche Wiederholungen und lange Intervalle hellen Länder und einzelne Orte langsam auf, während Fehler die Intensität senken. Bildabhängige Meta-Hinweise tragen eine Warnung, weil Street-View-Aktualisierungen sie veralten lassen können.

## KI-Coach-Stile und Erklärungstiefe

Unter **Einstellungen → KI-Coach** wählst du **Vor jeder Analyse fragen** oder einen bevorzugten Stil. Kurz, Normal oder Tief ist unabhängig und ändert die Detailmenge, nicht die Methode. Adaptive und automatische Stilwechsel gibt es nicht.

- **⚡ Quick Guess:** wahrscheinliche Länder, relative Einschätzung, stärkste sichtbare Hinweise und Sicherheit. Schnell im Spiel, aber mit weniger Lerneffekt.
- **🎯 Meta Coach:** bewertet Masten, Leitpfosten, Linien, Kennzeichen, Schilder, Google-Auto und Abdeckung nach Stufe S–D, Rolle, Zuverlässigkeit und Verwechslungen. Ideal für No Move; manche Metas ändern sich.
- **🚫 Elimination Coach:** zeigt Kandidatenfeld, Gegenbeweise, plausible Länder und den besten Trennhinweis. Verhindert frühe Festlegung und sagt bei Ausnahmen nicht vorschnell „unmöglich“.
- **🌍 Deep Geography:** folgt Was → Funktion → Ursache → menschliche Reaktion → sichtbares Ergebnis → GeoGuessr-Wert. Baut kausales Verständnis auf, kennzeichnet aber unbelegte historische, wirtschaftliche oder geologische Erklärungen.
- **🧠 Memory Coach:** erstellt wahrheitsgemäße Merksätze, Ursache-Wirkungs-Ketten, Kontrastpaare, Gegenhinweise und Abruffragen. Fördert Erinnerung, ohne Vereinfachungen zu absoluten Regeln zu machen.
- **🏆 Pro Analyst:** gewichtet positive und negative Belege, Widersprüche, Unabhängigkeit, schwache Hinweise, Unsicherheit und Informationsgewinn. Gut für knappe Fälle; Prozentwerte bleiben KI-Schätzungen.

Alle Stile beginnen mit denselben sichtbaren Beobachtungen und trennen Beobachtung, Schlussfolgerung und Spekulation. Jeder Kandidat erklärt das konkrete Merkmal, nationale oder regionale Reichweite, Hauptverwechslung, Trennhinweis und den nächsten Hinweis mit größtem Sicherheitsgewinn. Abkürzungen, Organisationen, Pflanzen, Geschichte, Geologie, Branchen und Regeln werden nicht erfunden.
Während einer aktiven Wiederholung zeigt die Kopfzeile die aktuelle Karte, die verbleibenden Karten und den gespeicherten Fortschritt. Nach dem Neuladen bleibt die Zahl der bereits abgeschlossenen Karten erhalten.
