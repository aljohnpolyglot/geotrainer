# Impara un luogo. Ricordalo. Conservalo.

GeoTrainer trasforma la pratica con Street View in memoria geografica duratura. Incontra luoghi, mettiti alla prova senza indizi e torna sui punti deboli al momento più utile.

## Avvio rapido

Inizia con un nuovo panorama. Gli errori creano automaticamente la coda di ripasso.

## Richiamo attivo

Un luogo può sembrare familiare; dire dove si trova dimostra cosa sai recuperare. Gioco e Ripasso chiedono una risposta prima di mostrare la soluzione, rafforzando il ricordo e rivelando l’incertezza.

## Usalo o perdilo

Gli indizi geografici svaniscono quando li vedi una sola volta. GeoTrainer conserva ogni tentativo e ripropone i luoghi difficili senza ripetere tutto allo stesso modo.

## Ripetizione dilazionata

Un tentativo debole torna prima, una risposta solida più tardi. Distanza e punteggio determinano automaticamente il prossimo ripasso.

## Il tuo ciclo di allenamento

1. Studia — Esplora panorami sconosciuti e impara quali indizi visibili contano.
2. Gioca — Fai un tentativo senza aiuti per misurare ciò che ricordi.
3. Ripassa — Torna sui luoghi deboli secondo il programma finché li riconosci stabilmente.

## Come GeoTrainer completa GeoGuessr

[GeoGuessr](https://www.geoguessr.com/) eccelle nell’esplorazione, nella varietà delle mappe, nelle sfide in singolo, nel multigiocatore e nella competizione. GeoTrainer si concentra sul tempo tra le partite: trasforma incontri ed errori in un piano duraturo con studio senza voto, cronologia dei tentativi, ripetizione dilazionata automatica, gruppi di paesi confondibili e indizi salvati. Usa GeoGuessr per esplorare e competere; usa GeoTrainer per capire gli errori, allenare le confusioni e consolidare ciò che impari. È un complemento, non un sostituto.

## Modalità Studio

Nello Studio personalizzato e nel Gioco, **Copertura interna** offre Solo esterni (predefinito) o Misto: interni ed esterni. Google non offre una ricerca affidabile dei soli interni; il modo misto può mostrare entrambi. Mappe caricate, Meta, Esplora mappa e Ripasso non cambiano.

Impara offre quattro scelte: Personalizzato, Meta, Esplora mappa e Mappa caricata. Per Mappa caricata, scegli un JSON di Map Maker con un elenco di luoghi o `customCoordinates`; ogni luogo richiede latitudine e longitudine valide. Il file deve essere inferiore a 10 MB. Precedente si trova prima di Rivela e diventa disponibile dopo aver visitato due luoghi. Avanti ripercorre prima i luoghi già visitati, poi ne sceglie uno nuovo. La X a destra nell’intestazione apre la scelta della modalità. La mappa resta su questo dispositivo; caricala anche sugli altri dispositivi.

Studio è un primo incontro senza voto. Scegli la raccolta intera, un paese obiettivo o un gruppo di paesi che confondi spesso; ogni paese appare come una pillola con bandiera rimovibile. Salvare un indizio crea automaticamente una scheda di Ripasso senza inventare un punteggio. Lo stato salvato viene ripristinato dopo il ricaricamento, quindi l’azione non ricompare.

## Modalità Gioco

Nelle impostazioni di gioco, scegli Luoghi generati o Mappa caricata. I round usano i luoghi del file e possono ripeterli se i round sono più numerosi.

Gioco usa lo stesso gruppo di paesi e misura il richiamo senza aiuti in 1–100 turni. Ogni risposta crea un nuovo tentativo e conserva la vista corrente per le anteprime.

## Ripasso e programmazione

La soluzione resta nascosta fino alla stima. La pratica personalizzata lascia invariate le schede future; completare una scheda già in scadenza ne avanza la pianificazione anche dopo il ricaricamento.

## Coach IA e indizi

Gioco usa la stessa barra di apprendimento di Studio: Taccuino, conteggio delle note disponibili nelle vicinanze e Coach IA quando è attivato nella configurazione della partita.

Coach attende la lingua IA salvata prima dell’analisi, rifiuta i risultati chiaramente multilingue e spiega gli indizi visibili dietro ogni nuovo paese candidato.

Analizza raccoglie automaticamente più direzioni e usa la vista corrente come alternativa. Mostra una stima di regione, città o luogo esatto solo quando più indizi visivi forti la sostengono. Dopo la rivelazione, **Analizza** diventa **Spiega**: usa solo i riferimenti del paese corretto e ammette quando l’immagine non bastava a identificarlo. Indizi apre una libreria con dettaglio completo, Street View e link Google Maps; il filtro mostra il totale per paese, ordina dal maggiore al minore e × lo cancella.

### Catturare, incollare e analizzare un indizio

1. Inquadra l’indizio e premi **Stamp** o **Windows + Maiusc + S** per copiare uno screenshot.
2. Apri **Coach IA → Indizi conosciuti**, seleziona il riquadro dell’indizio e premi **Ctrl + V** (o **Comando + V** su macOS).
3. Controlla l’anteprima e scegli **Analizza indizio**.
4. GeoTrainer salva automaticamente immagine, prove e nota di apprendimento in **Indizi**. Prima della risposta in Ripasso, l’analisi non svela la soluzione.

Se il ritaglio mostra un soggetto principale evidente in primo piano, il Coach analizza prima quello e usa l’ambiente come contesto di supporto o contraddizione. I dettagli illeggibili restano esplicitamente incerti.

### Usare una risposta IA esterna nel Taccuino

1. Cattura o copia l’immagine dell’indizio.
2. Apri Gemini o un’altra interfaccia IA esterna di Google e allega o incolla l’immagine.
3. Inizia con: **«Sei un coach di GeoGuessr.»** Chiedi di spiegare le prove visibili, i principali paesi confondibili e l’indizio che li distinguerebbe.
4. Copia la risposta e incollala nel campo di testo del **Taccuino**.
5. Salva la nota per il Ripasso.

Il Taccuino conserva titoli, grassetto ed elenchi puntati incollati. Le risposte esterne non vengono verificate automaticamente: mantieni incerti i dettagli illeggibili e confronta ogni affermazione con ciò che è davvero visibile.

## Raccolte e preferenze

In Impostazioni → Schermo → Mappe, **Palette colori della mappa** offre Automatico, Chiaro o Scuro. Automatico segue l’aspetto dell’app; Chiaro o Scuro mantiene la scelta per le mappe stradali e del terreno. Le immagini satellitari conservano i propri colori. I confini nazionali sono visibili per impostazione predefinita e si possono nascondere; compaiono solo quando un confine è nell’area mostrata.

Paesi, città e ambienti guidano la generazione senza garantire copertura completa. Le preferenze separano lingua di interfaccia, gioco e IA, oltre a ripasso, fuso orario, aspetto e aiuti della mappa. I nuovi profili usano 50 nuove schede e 500 ripassi al giorno. Effetti e musica ambientale sono facoltativi, iniziano disattivati e hanno volumi separati.

## Progressi e statistiche

I luoghi salvati in Studio sono fonti non valutate: contano come attività di Studio e nuove schede, non come tentativi «Nessuna risposta» o punteggi zero. Il ricaricamento riprende la visita corrente senza aggiungere un’altra riga.

Consulta luoghi, tentativi, coda, prestazioni, cronologia e tempo attivo in primo piano durante Studio, Gioco attivo e Ripasso attivo, inclusi gli spostamenti nei panorami e l’uso degli aiuti didattici. Il tempo viene salvato cambiando sezione o tornando alla pagina iniziale; le sessioni senza visite né tentativi sono nascoste. Su uno schermo tattile, tieni premuta una barra di **Prossime scadenze** per vedere data e quantità. Indizi conosciuti somma voci personali, IA e Meta senza contare due volte l’immagine di una nota. Le partite assistite dall’IA sono incluse per impostazione predefinita e possono essere escluse. Il riepilogo separa media precedente e odierna. Luoghi nello stesso paese entro 50 metri condividono una scheda.

## Sincronizzazione cloud

L’account è facoltativo e l’allenamento locale funziona senza accesso. Se collegato, la sincronizzazione include progressi e preferenze di Ripasso, lingua, interfaccia, audio e gioco; prevalgono l’impostazione più recente e il Ripasso valutato per ultimo. Il cloud viene ricontrollato quando ogni schermata torna attiva e aggiorna l’app aperta senza ricaricare né sostituire lo spazio di lavoro attivo. Senza accesso, localhost e il sito pubblicato restano separati.

## Risoluzione dei problemi

1. Panorama vuoto — passa oltre; la copertura Street View può cambiare.
2. Controlli su uno schermo nero — prova Street View in Google Maps nello stesso browser. Se anche lì l’immagine è nera, apri GeoTrainer in una finestra privata senza estensioni, cambia l’impostazione dell’accelerazione grafica del browser e riavvialo. Aggiorna il browser e il driver grafico se necessario. Se il problema riguarda solo GeoTrainer, ricaricalo una volta e indica browser, dispositivo ed estensioni attive nella segnalazione.
3. Ripasso vuoto — gioca o salva un luogo da Studio e attendi la scadenza.
4. IA non disponibile — continua e riprova più tardi.
5. Progressi vecchi — verifica l’account e attendi la sincronizzazione.

## Suggerimenti e segnalazioni di bug

Invia suggerimenti o segnalazioni di bug a [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Per un bug, indica browser, dispositivo, cosa stavi facendo e allega una schermata quando possibile.

## Domande frequenti

1. Serve un account? — No, solo per sincronizzare.
2. Studio cambia il punteggio? — No.
3. Posso valutare manualmente? — No, decide il risultato geografico.
4. La pratica extra rinvia le schede? — No; quelle future non cambiano e quelle già in scadenza avanzano una volta completate.
5. Copertura mostra ogni luogo? — No, solo quelli visitati.

## Risorse di apprendimento

Combina segnaletica orizzontale, lato di guida, alfabeti, pali, rilievo, architettura, vegetazione, generazione della fotocamera e meteo. Più indizi concordi valgono più di uno solo.

### Riferimenti esterni

- [Plonk It](https://www.plonkit.net/) — guide strutturate per paesi, regioni, mappe ed esercizi.
- [GeoHints](https://geohints.com/) — catalogo visivo di delineatori, linee, targhe, segnali, pali, fotocamere e altri indizi.
- [GeoMetas](https://geometas.com/) — lezioni gratuite sui meta per paese, regione e categoria, con quiz dinamici.
- [Learnable Meta](https://learnablemeta.com/) — mappe didattiche per GeoGuessr, documentazione e risorse per creare mappe.

## Impara, Meta e Taccuino

La **fotocamera a 360°** nell’area di lavoro copia quattro direzioni del panorama corrente come un’unica immagine. L’immagine viene inviata direttamente agli appunti e non viene salvata in GeoTrainer.

Impara offre tre percorsi. **Personalizzato** mantiene raccolte e ambienti. **Meta** apre lezioni guidate nel panorama e nell’orientamento registrati. **Esplora mappa** mostra la copertura Street View. In Meta e nella mappa, Rivela apre la normale scheda del luogo, dove Salva per il ripasso programma la futura prova di localizzazione. La mappa usa Torna alla mappa mondiale al posto di Avanti. Impara personalizzato e Gioco usano per impostazione predefinita immagini ufficiali Google; il selettore può mescolare panorami ufficiali e dei collaboratori oppure richiedere solo quelli dei collaboratori. **Consenti interni** è disattivato per impostazione predefinita in entrambe le configurazioni; quando è attivo, Google può restituire copertura Street View sia interna sia esterna. In **Impostazioni → Aspetto** puoi controllare nomi delle strade, data delle immagini, movimento del telefono, spostamento, tipo di mappa, gesti, luoghi cliccabili e colori GeoTrainer. Nomi delle strade e luoghi cliccabili sono disattivati per impostazione predefinita per evitare indizi accidentali.

La lampadina in alto a destra apre o chiude la spiegazione. Il consiglio iniziale può essere chiuso una volta o nascosto per sempre senza rimuovere lezioni. Un Meta appare in **I miei indizi** solo dopo averne salvato esplicitamente il luogo per il ripasso. Nel ripasso, prima della risposta compare solo l’immagine; il testo completo appare dopo e gli strumenti di apprendimento restano disponibili fino a quando scegli il ripasso successivo.

Il **Taccuino** salva un numero qualsiasi di note personali per panorama. Categoria e testo sono facoltativi; anche una voce vuota può salvare il luogo per il ripasso. Accetta inoltre immagini analizzate con Coach. Durante il ripasso puoi scrivere e salvare una nuova nota; l’analisi dell’immagine non rivela la risposta prima del tentativo. Le voci personali, IA e Meta aprono una vista dettagliata con Street View e un’immagine sovrapposta quando disponibile. **Note disponibili** mostra un contatore e l’intera cronologia scorrevole; le nuove analisi del Coach entrano subito lì e non si riaprono come risultato attivo dopo il ricaricamento. I miei indizi filtra **Personali**, **Con assistenza IA** e **Lezioni Meta** e impagina 20 risultati corrispondenti alla volta; il testo rivelatore resta nascosto prima della risposta.

Ogni salvataggio del Taccuino resta una voce indipendente, anche nello stesso panorama. Se una foto inviata non può essere caricata, la nota rimane visibile e viene contrassegnata per il recupero.

Un risultato basso torna automaticamente in fondo alla sessione di ripasso finché non viene superato. Ogni tentativo rimane separato.

Lo studio Meta contiene 359 lezioni ospitate localmente, normalizzate dalla cattura abbinata di OpenGuessr e da ulteriori esempi GeoMetas con coordinate Street View utilizzabili. Le spiegazioni Meta seguono la lingua dell’interfaccia nelle otto lingue supportate. Usare Coach IA o salvare una voce del Taccuino crea o riutilizza automaticamente la scheda di Ripasso; altrimenti la scheda del luogo rivelato mantiene Salva per il ripasso. **Note disponibili** contiene la cronologia personale e assistita dall’IA del panorama e dei nodi Street View dello stesso paese entro 50 metri, con analisi completa, ora esatta e schermata inviata quando presente; Meta resta sotto la propria lampadina. Coach attende la preferenza linguistica salvata e richiede ogni valore in linguaggio naturale nella lingua IA selezionata. Il testo personale e IA finalizzato conserva la lingua di creazione. Ripassare una scheda già in scadenza ne avanza la pianificazione anche dalla pratica personalizzata e persiste dopo il ricaricamento.

Meta seleziona solo le lezioni non completate. Dopo aver completato tutte le 359 lezioni, l’opzione in Impara viene disattivata e non è più selezionabile.

Una sessione Studio o Gioco incompleta viene conservata. Al rientro puoi scegliere **Riprendi**, **Inizia da capo** o **Indietro**. La copertura include una mappa di calore continua della **Padronanza**: molti ripassi riusciti e intervalli lunghi illuminano gradualmente paesi e luoghi, mentre gli errori riducono l’intensità. Un panorama aperto da Copertura offre Coach IA, Taccuino, Meta collegata e Note disponibili; il salvataggio crea o riutilizza la sua scheda di Ripasso. Gli indizi Meta dipendenti dalle immagini mostrano un avviso perché gli aggiornamenti di Street View possono renderli obsoleti.

## Stili e profondità del Coach IA

In **Impostazioni → Coach IA** scegli **Chiedi sempre prima dell’analisi** o uno stile preferito. La profondità Breve, Normale o Profonda è indipendente e cambia il dettaglio, non il metodo. Non esistono Adaptive o cambi automatici.

- **⚡ Quick Guess:** paesi probabili, probabilità relativa, indizi visibili più forti e confidenza. Rapido durante il gioco, ma meno didattico.
- **🎯 Meta Coach:** valuta pali, delineatori, linee, targhe, segnali, auto Google e copertura per livello S–D, ruolo, affidabilità e confusori. Ideale per No Move, anche se alcune meta cambiano.
- **🚫 Elimination Coach:** mostra candidati, prove contrarie, opzioni plausibili e il miglior indizio discriminante. Riduce l’ancoraggio ed evita “impossibile” quando esistono eccezioni.
- **🌍 Deep Geography:** segue cosa → funzione → causa → risposta umana → risultato visibile → valore GeoGuessr. Costruisce intuizione causale, ma segnala quando l’immagine non sostiene storia, economia o geologia.
- **🧠 Memory Coach:** crea ancore vere, catene causa-effetto, contrasti, controindizi e domande di richiamo. Migliora la memoria senza trasformare semplificazioni in assoluti.
- **🏆 Pro Analyst:** pesa prove positive e negative, contraddizioni, indipendenza, indizi deboli, incertezza e guadagno informativo. Utile nei casi ravvicinati; le percentuali restano stime IA.

Tutti partono dalle stesse osservazioni e separano osservato, inferito e speculativo. Ogni candidato spiega la caratteristica concreta, il valore nazionale o regionale, il confusore principale, cosa li separa e l’indizio che aumenterebbe di più la confidenza. Sigle, organizzazioni, colture, storia, geologia, industrie e regole non vengono inventate.
Durante un Ripasso attivo, l’intestazione mostra la scheda corrente, quelle rimanenti e che i progressi sono salvati. Dopo il ricaricamento resta corretto il numero delle schede già completate.
