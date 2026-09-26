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

Impara offre quattro scelte: Personalizzato, Meta, Esplora mappa e Mappa caricata. Per Mappa caricata, scegli un JSON di Map Maker con un elenco di luoghi o `customCoordinates`; ogni luogo richiede latitudine e longitudine valide. Il file deve essere inferiore a 20 MB. Precedente si trova prima di Rivela e diventa disponibile dopo aver visitato due luoghi. Avanti ripercorre prima i luoghi già visitati, poi ne sceglie uno nuovo. La X a destra nell’intestazione apre la scelta della modalità. La mappa resta su questo dispositivo; caricala anche sugli altri dispositivi. La variazione 0 mantiene la vista caricata; 100 cerca Street View entro 1 km e torna a un luogo originale se necessario. Il pulsante meno minimizza la scheda del luogo e ingrandisci la espande a tutto schermo.

### Scegliere una priorità di apprendimento

L’apprendimento con una mappa caricata etichetta l’avanzamento della fonte (per esempio **Fonte: 1/50**). Ogni voce viene segnata come completata dopo il controllo, quindi **Avanti** non può sceglierla di nuovo anche se una variazione vicina apre un altro panorama; anche le voci non funzionanti vengono saltate una sola volta. Alla fine **Avanti** scompare e rimane **Precedente**. Anche il Gioco evita di ripetere le voci della fonte. In Esplora mappa puoi cercare una città, regione o paese e scegliere un suggerimento dal catalogo integrato di GeoTrainer per ingrandire quella zona. I suggerimenti spostano solo la mappa di copertura; fai clic sulla copertura blu per aprire Street View. Il testo personale del Taccuino è limitato a 1000 caratteri per salvataggio e un contatore appare sotto l’editor.

La priorità cambia il modo in cui vengono scelte le **nuove località di Apprendimento personalizzato** dopo aver applicato raccolta, combinazione di paesi, ambiente, fonte delle immagini e filtro per interni. Non modifica Mappa caricata, Meta, Esplora mappa, Gioco o Ripasso.

- **Casuale** (predefinito) seleziona dal gruppo idoneo senza usare la cronologia. In Mondo riduce il peso dei territori molto piccoli, così non dominano. Usalo per ottenere varietà o visitare ampiamente la raccolta.
- **Luoghi familiari** sceglie come punto di partenza una località idonea già incontrata e cerca approssimativamente entro 1–12 km. Serve a imparare i dintorni e riconoscere viste vicine senza ripetere esattamente lo stesso panorama.
- **Minore esposizione** sceglie prima un paese idoneo mai visto o con meno incontri, riempie le regioni incluse ancora grigie in Copertura e poi punta alla maggiore lacuna geografica rimasta. Questo passaggio regionale vale anche per le raccolte di un solo paese; le regioni senza un punto locale utilizzabile tornano alla ricerca nell’intero paese.

Quando non esiste una cronologia idonea, Luoghi familiari e Minore esposizione iniziano dal gruppo selezionato come Casuale. In una ricerca con Minore esposizione e più paesi, GeoTrainer prova prima il paese grigio o meno visitato scelto e il relativo obiettivo regionale. Ogni ricerca senza un panorama valido, compreso un panorama fuori dal paese richiesto, avanza subito. Se fallisce un paese mai visto, vengono provati prima i paesi con copertura già confermata, dal meno al più visitato, e poi altri paesi sconosciuti; i pareggi vengono mescolati. L’ordine si ripete finché viene trovato un panorama o finché non esci. La copertura Street View e i filtri attivi determinano comunque se l’area scelta può fornire un panorama; se il punto esatto non è coperto, può essere usata una vista disponibile nelle vicinanze.

In Mondo con Minore esposizione, una scansione di copertura inclusa ignora i paesi i cui punti non hanno trovato panorami ufficiali navigabili. I gruppi mirati continuano a cercare in tutti i paesi selezionati.

Studio è un primo incontro senza voto. Scegli la raccolta intera, un paese obiettivo o un gruppo di paesi che confondi spesso; ogni paese appare come una pillola con bandiera rimovibile. Salvare un indizio crea automaticamente una scheda di Ripasso senza inventare un punteggio. Il luogo attuale resta aperto dopo il salvataggio; usa Avanti quando vuoi proseguire. Lo stato salvato viene ripristinato dopo il ricaricamento, quindi l’azione non ricompare.

Usa i menu separati **Regioni** e **Città** e rimuovi le selezioni dalle rispettive pillole. Le regioni sono raggruppate per paese e le città per regione. Senza regioni selezionate si usa il normale insieme nazionale. Senza città selezionate in una regione sono incluse tutte quelle disponibili; scegliere città limita solo quella regione. Rimuovere una regione elimina le sue città; rimuovere la sua ultima città ripristina tutte quelle disponibili. Dopo aver aggiunto i paesi, puoi aggiungere regioni e città come pillole separate. Le regioni sono in ordine alfabetico; le città sono ordinate per importanza in base alla popolazione per impostazione predefinita e possono essere ordinate alfabeticamente. **Tutte le città disponibili** usa i punti città inclusi nella regione; non copre l’intero confine amministrativo e non garantisce ogni strada o area rurale. Una nuova configurazione Impara dopo una sessione mirata ripristina World e l’elenco completo dei paesi; Riprendi mantiene la sessione salvata. Minore esposizione cerca prima nel punto scelto, poi amplia la ricerca locale. In modalità Mista, i tentativi successivi usano punti di copertura del paese mantenendo i filtri. La ricerca continua a ritmo moderato finché trova una corrispondenza o finché esci o modifichi la configurazione; la copertura nel punto esatto non è garantita.

I nomi delle regioni e delle città seguono la lingua dell’interfaccia quando è disponibile un nome localizzato. **Salva insieme geografico** scarica le scelte correnti di paesi, regioni e città come JSON senza coordinate Street View. **Carica JSON** e **URL JSON** accettano questo formato modificabile o un JSON di coordinate Map Maker; un insieme geografico torna a Personalizzato per la modifica, mentre le coordinate restano una fonte finita. Viene mostrato il nome del file o dell’URL. L’endpoint deve consentire l’accesso dal browser (CORS).

**Descrivi un insieme** invia una breve richiesta a Gemini e apre i paesi, le regioni e le città proposti in Personalizzato, dove puoi verificarli e modificarli. Puoi scrivere in qualsiasi lingua supportata e descrivere luoghi, paesaggi o confusioni comuni. È un suggerimento dell’IA, non una garanzia geografica.

## Modalità Gioco

Nelle impostazioni di gioco, scegli Luoghi generati o Mappa caricata. I round usano luoghi unici del file e il loro numero viene limitato ai luoghi disponibili.

Gioco usa lo stesso gruppo di paesi e misura il richiamo senza aiuti in 1–100 turni. Ogni risposta crea un nuovo tentativo e conserva la vista corrente per le anteprime.

## Ripasso e programmazione

La soluzione resta nascosta fino alla stima. Se un vecchio ID apre un panorama a più di 10 km dalla risposta salvata, Ripasso usa una vista valida vicino alle coordinate salvate oppure non apre la scheda. Dopo la risposta, il risultato mostra città, regione, strada, indirizzo completo e coordinate disponibili, come Rivela nello Studio. Riduci il risultato dall’angolo in alto a destra per studiare il panorama e usa Vedi risultato per riaprirlo. La pratica personalizzata lascia invariate le schede future; completare una scheda già in scadenza ne avanza la pianificazione anche dopo il ricaricamento.

### Personalizzare il ripasso

- **Nuove schede / giorno** limita le schede mai ripassate. **Ripassi massimi / giorno** limita l’intera coda pronta, comprese le schede nuove. I due limiti valgono insieme. Con 50 nuove e 500 ripassi massimi, 110 schede possono essere in scadenza ma solo 108 pronte se due nuove superano il limite. Home e Ripasso mostrano il numero realmente disponibile; aumentare il massimo totale non ignora il limite delle nuove schede.
- **Severità di valutazione** controlla il voto automatico: Principiante tollera più distanza, Bilanciato combina paese e precisione, Pro richiede un risultato più forte. Sono considerati paese, distanza, punteggio e tempo; non esistono pulsanti manuali Ancora/Difficile/Buono/Facile.
- **Aggiungi turni di gioco al ripasso** è separato dalla valutazione: un futuro turno crea una scheda se il punteggio è sotto la soglia scelta o se il paese è errato. Basta una delle condizioni attive; i nuovi profili iniziano dalla soglia attiva Difficile/Ancora (3.000 in Bilanciato).
- **Primo ripasso**, **passaggio di riapprendimento**, **primo intervallo eccellente** e **intervallo massimo** regolano prima scadenza, ritorno dopo un errore, attesa dopo un primo risultato eccellente e tetto delle schede mature.
- **Tempo massimo di risposta** influenza la fluidità della valutazione senza creare necessariamente un conto alla rovescia. **Ordine** sceglie le più vecchie prima o una coda casuale.
- **Ora di ripristino** e **fuso orario** definiscono il nuovo giorno e il rinnovo dei limiti. Il rilevamento automatico segue il dispositivo; disattivalo per scegliere il fuso. L’anteprima mostra il prossimo ripasso reale.
- **Varia vista di ripasso** conserva la stessa scheda e pianificazione, ma può cambiare direzione o usare un panorama vicino per schede mature. Zero conserva la vista originale; gli errori riducono la variazione e una ricerca fallita torna all’ancora senza duplicati.

Premi **Salva** per applicare. Severità e intervalli influenzano la pianificazione futura senza riscrivere i tentativi; limiti e ordine valgono al prossimo calcolo della coda.

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

In Impostazioni → Schermo → Mappe, **Palette colori della mappa** offre Automatico, Chiaro o Scuro. **Zoom della mappa dei risultati** offre Più vicino, Paese, Regione del paese o Mondo; Paese è il valore predefinito. Automatico segue l’aspetto dell’app; Chiaro o Scuro mantiene la scelta per le mappe stradali e del terreno. Le immagini satellitari conservano i propri colori. I confini nazionali sono visibili per impostazione predefinita e si possono nascondere; compaiono solo quando un confine è nell’area mostrata. Spessore e colore dei confini sono regolabili con un’anteprima dal vivo; i confini regionali sono disattivati per impostazione predefinita e si possono attivare separatamente.

Paesi, città e ambienti guidano la generazione senza garantire copertura completa. Le preferenze separano lingua di interfaccia, gioco e IA, oltre a ripasso, fuso orario, aspetto e aiuti della mappa. I nuovi profili usano 50 nuove schede e 500 ripassi al giorno. Effetti e musica ambientale sono facoltativi, iniziano disattivati e hanno volumi separati.

## Progressi e statistiche

I luoghi salvati in Studio sono fonti non valutate: contano come attività di Studio e nuove schede, non come tentativi «Nessuna risposta» o punteggi zero. Il ricaricamento riprende la visita corrente senza aggiungere un’altra riga.

Consulta luoghi, tentativi, coda, prestazioni, cronologia e tempo attivo in primo piano durante Studio, Gioco attivo e Ripasso attivo, inclusi gli spostamenti nei panorami e l’uso degli aiuti didattici. Prestazioni, Geografia, Progressi e Confusioni combinano i tentativi di Gioco e Ripasso; la casella IA riguarda solo il Gioco. Il tempo nascosto o chiuso non aumenta le nuove durate di risposta. Il tempo viene salvato cambiando sezione o tornando alla pagina iniziale; le sessioni senza visite né tentativi sono nascoste. Su uno schermo tattile, tieni premuta una barra di **Prossime scadenze** per vedere data e quantità. Indizi conosciuti somma voci personali, IA e Meta senza contare due volte l’immagine di una nota. Le partite assistite dall’IA sono incluse per impostazione predefinita e possono essere escluse. Il riepilogo separa media precedente e odierna. Luoghi nello stesso paese entro 50 metri condividono una scheda.

## Sincronizzazione cloud

L’account è facoltativo e l’allenamento locale funziona senza accesso. I progressi vengono salvati prima in questo browser e la sincronizzazione è manuale. Premi **Sincronizza ora** sul dispositivo con nuovi dati per scaricare, unire e caricare schede, tentativi e cronologia di Ripasso; poi fallo sugli altri dispositivi. Prevale la programmazione valutata più di recente e i record unici di ogni dispositivo vengono conservati. Accesso, salvataggio, ritorno all’app e uscita non trasferiscono dati automaticamente. Senza accesso, localhost e il sito pubblicato restano separati.

Le immagini private mancanti vengono memorizzate in questo browser durante la sincronizzazione manuale. Aprire Indizi, Note disponibili, Copertura o la cronologia usa la copia locale senza interrogare l’archivio cloud.

**Sincronizza e salva** offre anche **Esporta** e **Importa** senza accesso al cloud. L’esportazione scarica un file `.geotrainer` con l’intero database locale e le foto salvate su questo dispositivo. L’importazione convalida il file e unisce solo le informazioni mancanti o più recenti senza cancellare i progressi locali. Il file registra l’identificativo dell’account che lo ha esportato; un account diverso o l’assenza di accesso richiede conferma. Mantieni privato il file e trasferiscilo tramite Drive, OneDrive, USB o un altro luogo affidabile.

## Risoluzione dei problemi

1. Panorama vuoto — passa oltre; la copertura Street View può cambiare.
2. Controlli su uno schermo nero — prova Street View in Google Maps nello stesso browser. Se anche lì l’immagine è nera, apri GeoTrainer in una finestra privata senza estensioni, cambia l’impostazione dell’accelerazione grafica del browser e riavvialo. Aggiorna il browser e il driver grafico se necessario. Se il problema riguarda solo GeoTrainer, ricaricalo una volta e indica browser, dispositivo ed estensioni attive nella segnalazione.
3. Ripasso vuoto — gioca o salva un luogo da Studio e attendi la scadenza.
4. IA non disponibile — continua e riprova più tardi.
5. Progressi vecchi — verifica l’account e premi **Sincronizza ora** su ogni dispositivo, iniziando da quello con i nuovi dati.

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

Le immagini incollate, caricate o acquisite nel Taccuino possono essere ritagliate prima dell’analisi o del salvataggio. Usa il controllo di modifica in basso a destra nell’anteprima, trascina l’area o gli angoli e applica il ritaglio.

Dopo aver salvato una nota di testo o l’analisi di un indizio incollato, un avviso conferma che si trova nel Taccuino.

La **fotocamera a 360°** nell’area di lavoro copia quattro direzioni del panorama corrente come un’unica immagine. Una notifica mostra l’avanzamento e conferma se la copia è riuscita. L’immagine viene inviata direttamente agli appunti e non viene salvata in GeoTrainer.

Impara offre quattro percorsi. **Personalizzato** mantiene raccolte e ambienti. **Meta** apre lezioni guidate nel panorama e nell’orientamento registrati. **Esplora mappa** mostra la copertura Street View. I filtri in basso a sinistra scelgono immagini ufficiali, miste o dei collaboratori e copertura solo esterna o mista. In Meta e nella mappa, Rivela apre la normale scheda del luogo, dove Salva per il ripasso programma la futura prova di localizzazione. In Esplora mappa, fai clic sulla copertura blu nella mappa della scheda per passare a un altro panorama; la mappa della scheda mantiene zoom e posizione. Se Solo ufficiali non trova nulla, il messaggio indica di scegliere **Ufficiali + collaboratori** qui sotto; non cambia mai il filtro al posto tuo. Un pulsante con il globo in alto a sinistra nel panorama torna alla mappa mondiale senza occupare l’intestazione. Impara personalizzato e Gioco usano per impostazione predefinita immagini ufficiali Google; il selettore può mescolare panorami ufficiali e dei collaboratori oppure richiedere solo quelli dei collaboratori. **Consenti interni** è disattivato per impostazione predefinita in entrambe le configurazioni; quando è attivo, Google può restituire copertura Street View sia interna sia esterna. In **Impostazioni → Aspetto** puoi controllare nomi delle strade, data delle immagini, movimento del telefono, spostamento, tipo di mappa, gesti, luoghi cliccabili e colori GeoTrainer. Nomi delle strade e luoghi cliccabili sono disattivati per impostazione predefinita per evitare indizi accidentali.

La lampadina in alto a destra apre o chiude la spiegazione. Il consiglio iniziale può essere chiuso una volta o nascosto per sempre senza rimuovere lezioni. Un Meta appare in **I miei indizi** solo dopo averne salvato esplicitamente il luogo per il ripasso. Nel ripasso, prima della risposta compare solo l’immagine; il testo completo appare dopo e gli strumenti di apprendimento restano disponibili fino a quando scegli il ripasso successivo.

Il **Taccuino** salva un numero qualsiasi di note personali per panorama. Categoria e testo sono facoltativi; anche una voce vuota può salvare il luogo per il ripasso. Accetta inoltre immagini analizzate con Coach. Durante il ripasso puoi scrivere e salvare una nuova nota; l’analisi dell’immagine non rivela la risposta prima del tentativo. Le voci personali, IA e Meta aprono una vista dettagliata con Street View e un’immagine sovrapposta quando disponibile. Nel dettaglio di un indizio visivo salvato puoi aggiungere o modificare la nota, salvarla e aprire l’immagine a schermo intero. Le immagini identiche vengono unite solo quando anche la nota o la descrizione coincide o è vuota; testi significativi diversi restano separati. **Note disponibili** mostra un contatore e l’intera cronologia scorrevole; le nuove analisi del Coach entrano subito lì e non si riaprono come risultato attivo dopo il ricaricamento. I miei indizi filtra **Personali**, **Con assistenza IA** e **Lezioni Meta** e impagina 20 risultati corrispondenti alla volta; il testo rivelatore resta nascosto prima della risposta.

Ogni voce di Note disponibili ha un cestino discreto. Le voci con lo stesso testo normalizzato o la stessa immagine esatta vengono raggruppate automaticamente, mantenendo la versione più completa con immagine e descrizione.

Ogni salvataggio del Taccuino resta una voce indipendente, anche nello stesso panorama. Se una foto inviata non può essere caricata, la nota rimane visibile e viene contrassegnata per il recupero.

Un risultato basso torna automaticamente in fondo alla sessione di ripasso finché non viene superato. Ogni tentativo rimane separato.

Lo studio Meta contiene 359 lezioni ospitate localmente, normalizzate dalla cattura abbinata di OpenGuessr e da ulteriori esempi GeoMetas con coordinate Street View utilizzabili. Le spiegazioni Meta seguono la lingua dell’interfaccia nelle otto lingue supportate. Usare Coach IA o salvare una voce del Taccuino crea o riutilizza automaticamente la scheda di Ripasso; altrimenti la scheda del luogo rivelato mantiene Salva per il ripasso. **Note disponibili** contiene la cronologia personale e assistita dall’IA del panorama e dei nodi Street View dello stesso paese entro 50 metri, con analisi completa, ora esatta e schermata inviata quando presente; Meta resta sotto la propria lampadina. Coach attende la preferenza linguistica salvata e richiede ogni valore in linguaggio naturale nella lingua IA selezionata. Il testo personale e IA finalizzato conserva la lingua di creazione. Ripassare una scheda già in scadenza ne avanza la pianificazione anche dalla pratica personalizzata e persiste dopo il ricaricamento.

Meta seleziona solo le lezioni non completate. Nella configurazione, **Generale** continua con una lezione non completata casuale, mentre **Sfoglia** cerca nel catalogo tradotto e avvia la lezione scelta. Sfoglia può mostrare tutte le lezioni, quelle da fare o quelle completate; le righe completate sono visivamente contrassegnate e non possono essere riavviate. Dopo aver completato tutte le 359 lezioni, l’opzione in Impara viene disattivata e non è più selezionabile.

Una sessione Studio o Gioco incompleta viene conservata. Al rientro puoi scegliere **Riprendi**, **Inizia da capo** o **Indietro**. La copertura include una mappa di calore continua della **Padronanza**: molti ripassi riusciti e intervalli lunghi illuminano gradualmente paesi e luoghi, mentre gli errori riducono l’intensità. Un panorama aperto da Copertura offre Coach IA, Taccuino, Meta collegata e Note disponibili; il salvataggio crea o riutilizza la sua scheda di Ripasso. Gli indizi Meta dipendenti dalle immagini mostrano un avviso perché gli aggiornamenti di Street View possono renderli obsoleti.

In Copertura, trascina la mappa di calore per paese e usa la rotellina, il cursore o i pulsanti per cambiare zoom. Fai clic su un paese per aprire la sua mappa regionale con lo stesso livello. Le regioni vengono individuate dai dati salvati del luogo o da Google Maps all’apertura. Alcuni paesi non hanno una mappa regionale; i luoghi senza una regione identificabile restano senza colore.

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

La mappa del risultato mostra in blu tutti i tentativi precedenti con coordinate, in rosso quello di oggi e in verde la risposta. Il voto e la coda successiva vengono salvati prima di mostrare il risultato; dopo un esito positivo, ricaricare passa quindi alla scheda seguente.
