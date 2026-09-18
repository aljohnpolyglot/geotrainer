# Se en plats. Förstå den. Känn igen den nästa gång.

GeoTrainer förvandlar dina Street View-möten och misstag till geografisk kunskap som sitter kvar. Utforska nya platser, gissa utan ledtrådar och repetera automatiskt det du har svårt för — precis när det är mest värdefullt att se det igen.

## Snabbstart

Börja med ett nytt panorama. Dina misstag bygger automatiskt repetitionskön.

## Aktiv återkallning

En plats kan kännas bekant; att ange var den ligger visar vad du faktiskt kan hämta ur minnet. Spel och Repetition kräver ett svar före facit och stärker därmed minnet.

## Använd eller glöm

Att känna igen är inte samma sak som att minnas. Ett portugisiskt landskap kan kännas bekant när du ser facit, men den verkliga frågan är om du kan identifiera Portugal utan hjälp en vecka senare. GeoTrainer testar aktiv återkallning och tar tillbaka platser som börjar blekna.

## Utspridd repetition

En svag gissning återkommer tidigare, ett säkert svar senare. Avstånd och poäng bestämmer automatiskt nästa repetition.

## Din träningscykel

1. Studera — Utforska obekanta panoraman och lär dig vilka synliga ledtrådar som spelar roll.
2. Spela — Gissa utan hjälp så att tränaren kan mäta vad du minns.
3. Repetera — Återvänd till svaga platser enligt schemat tills igenkänningen sitter.

## Så kompletterar GeoTrainer GeoGuessr

**GeoGuessr för spelet. GeoTrainer för minnet.** [GeoGuessr](https://www.geoguessr.com/) låter dig utforska, tävla och möta nya platser. GeoTrainer tar hand om det som händer mellan spelen: varje plats, misstag och sparad ledtråd kan bli del av en långsiktig träningsplan. Spela fler platser i GeoGuessr; förstå varför du missade dem och se dem igen tills kunskapen sitter i GeoTrainer.

## Lär

I anpassat lärande och spel erbjuder **Inomhusbilder** Endast utomhus (standard) eller Blandat: inne och ute. Google har ingen tillförlitlig sökning efter enbart inomhusbilder; blandat läge kan visa båda. Uppladdade kartor, Meta, Utforska karta och Repetition påverkas inte.

Lär har fyra val: Anpassat, Meta, Utforska karta och Uppladdad karta. Välj en JSON-fil från Map Maker med en lista över platser eller `customCoordinates`; varje plats behöver giltig latitud och longitud. Filen måste vara mindre än 10 MB. Nästa visar en annan plats och X i sidhuvudet öppnar valet av lärläge igen. Kartan stannar på den här enheten; ladda upp den igen på andra enheter.

Studera är ett första möte utan betyg. Välj hela samlingen, ett målland eller en grupp länder som du ofta blandar ihop; varje land visas som en borttagbar flaggbricka. När du sparar en ledtråd skapas automatiskt ett repetitionskort utan påhittad poäng. Det sparade läget återställs efter omladdning, så åtgärden visas inte igen.

## Spelläge

I spelinställningarna väljer du Genererade platser eller Uppladdad karta. Omgångarna använder platser från filen och kan upprepa dem om det finns fler omgångar än platser.

Spela använder samma landsmix och mäter fri återkallning i 1–100 rundor. Varje svar blir ett nytt försök och sparar den aktuella vyn för förhandsvisning.

## Repetition och schemaläggning

Svaret döljs tills du gissar. Anpassad extraträning lämnar framtida kort oförändrade; när ett redan förfallet kort slutförs flyttas datumet fram och består efter omladdning.

I **Inställningar → Repetition** kan du slå på **Variera repetitionsvy**. Kortet förblir samma repetitionskort med samma schema och framsteg, men GeoTrainer kan först ändra kamerans riktning och senare välja ett lämpligt panorama i samma närområde. Det tränar igenkänning av platsmiljön i stället för minnet av en enda skärmbild.

**Variationssvårighet** går från 0 till 100. Vid 0 används exakt originalvyn. 100 tillåter den största säkra variationen för tillräckligt mogna kort; det betyder inte maximalt avstånd vid varje repetition. Nya eller svaga kort stannar vid originalet eller mycket nära, medan mogna kort gradvis kan visas längre bort. Om du missar en mer varierad vy blir kommande vyer försiktigare utan att skapa ett nytt kort. Hittar GeoTrainer inget lämpligt panorama, eller misslyckas sökningen, används originalvyn automatiskt.

## AI-coach och ledtrådar

Spel använder samma lärverktygsrad som Studier: Anteckningsbok, antalet tillgängliga anteckningar i närheten och AI-coach när den är aktiverad i spelinställningen.

Coach väntar före analysen på det sparade AI-språket, avvisar tydligt flerspråkiga resultat och förklarar de synliga skälen för varje nytt kandidatland.

Analysera samlar automatiskt flera riktningar och använder den aktuella vyn som reserv. En uppskattning av region, stad eller exakt plats visas bara när flera starka synliga ledtrådar stöder den. Efter visat facit blir **Analysera** **Förklara**: coachen använder bara referenser för rätt land och säger öppet när bilden inte räckte för att identifiera det. Ledtrådar öppnar ett bibliotek med fullständig detaljvy, Street View och Google Maps-länkar; filtret visar antal per land, sorterar flest först och × rensar det.

### Ta skärmbild, klistra in och analysera

1. Rama in ledtråden och tryck **Print Screen** eller **Windows + Skift + S** för att kopiera en skärmbild.
2. Öppna **AI-coach → Kända ledtrådar**, välj ledtrådsrutan och tryck **Ctrl + V** (eller **Kommando + V** i macOS).
3. Kontrollera förhandsvisningen och välj **Analysera ledtråd**.
4. GeoTrainer sparar automatiskt bilden, beläggen och läranteckningen under **Ledtrådar**. Före en gissning i Repetition avslöjar analysen inte svaret.

När beskärningen har ett tydligt huvudobjekt i förgrunden analyserar coachen det först och använder omgivningen som stödjande eller motsägande sammanhang. Oläsliga detaljer förblir uttryckligen osäkra.

### Använd ett externt AI-svar i Anteckningsboken

1. Ta eller kopiera en bild av ledtråden.
2. Öppna Gemini eller en annan extern Google AI-tjänst och bifoga eller klistra in bilden.
3. Börja med: **”Du är en GeoGuessr-coach.”** Be den förklara synliga bevis, viktigaste förväxlingsländer och vilken ledtråd som skulle skilja dem åt.
4. Kopiera svaret och klistra in det i textfältet i **Anteckningsboken**.
5. Spara anteckningen för Repetition.

Anteckningsboken bevarar inklistrade rubriker, fetstil och punktlistor. Externa svar verifieras inte automatiskt, så håll oläsliga detaljer osäkra och kontrollera varje påstående mot det som faktiskt syns.

## Samlingar och inställningar

Under Inställningar → Visning → Kartor kan du välja **Kartans färgpalett**: Automatiskt, Ljust eller Mörkt. Automatiskt följer appens utseende; Ljust eller Mörkt behåller valet på väg- och terrängkartor. Satellitbilder behåller sina färger.

Länder, städer och miljöer styr genereringen utan att lova fullständig täckning. Inställningar skiljer gränssnitts-, spel- och AI-språk samt repetition, tidszon, utseende och karthjälp. Nya profiler får 50 nya kort och 500 repetitioner per dag. Ljudeffekter och bakgrundsmusik är valfria, börjar avstängda och har separata volymer.

## Framsteg och statistik

Sparade Studieplatser är obedömda källor: de räknas som Studieaktivitet och nya kort, inte som ”Ingen gissning”-försök eller nollpoäng. En omladdning återupptar det aktuella besöket utan att lägga till en ny rad.

Se platser, försök, kö, resultat, historik och aktiv tid i förgrunden under Studera, aktivt Spel och aktiv Repetition, inklusive tid när du rör dig i panoramat eller använder lärhjälpmedel. Tiden sparas när du byter avsnitt eller återgår till startsidan; sessioner utan besök eller försök döljs. Håll ned en stapel under **Kommande förfallna** på en pekskärm för att se datum och antal. Kända ledtrådar summerar personliga, AI- och Meta-poster utan att räkna en anteckningsbild två gånger. AI-assisterade spel ingår som standard men kan uteslutas. Sammanfattningen skiljer tidigare och dagens snitt. Platser i samma land inom 50 meter delar ett kort.

## Molnsynkronisering

Konto är valfritt och lokal träning fungerar utan inloggning. När du är inloggad synkroniseras framsteg samt inställningar för Repetition, språk, gränssnitt, ljud och spel; den senaste inställningen och den senast bedömda Repetitionen vinner. Molnet kontrolleras när varje skärm får fokus och uppdaterar den öppna appen utan omladdning eller byte av den aktiva arbetsytan. Utan inloggning förblir localhost och den publicerade webbplatsen separata.

## Felsökning

1. Tomt panorama — gå vidare; Street View-täckning kan ändras.
2. Kontroller ovanpå en svart skärm — testa Street View i Google Maps i samma webbläsare. Om bilden är svart även där öppnar du GeoTrainer i ett privat fönster utan tillägg, ändrar webbläsarens inställning för grafikacceleration och startar om den. Uppdatera webbläsaren och grafikdrivrutinen vid behov. Om bara GeoTrainer påverkas laddar du om sidan en gång och anger webbläsare, enhet och aktiva tillägg när du rapporterar problemet.
3. Tom repetitionskö — spela eller spara en studieplats och vänta tills den förfaller.
4. AI saknas — fortsätt träna och försök senare.
5. Gamla framsteg — kontrollera kontot och låt synkroniseringen bli klar.

## Förslag och felrapporter

Skicka förslag eller felrapporter till [mogatas.princealjohn.05082003@gmail.com](mailto:mogatas.princealjohn.05082003@gmail.com). Vid fel bör du ange webbläsare, enhet, vad du gjorde och bifoga en skärmbild när det är möjligt.

## Vanliga frågor

1. Behöver jag konto? — Nej, bara för synkronisering.
2. Påverkar Studera poängen? — Nej.
3. Kan jag betygsätta manuellt? — Nej, det geografiska resultatet avgör.
4. Flyttar extraträning kort? — Nej.
5. Visar Täckning alla platser? — Nej, bara besökta.

## Lärresurser

Kombinera vägmarkeringar, körsida, skriftsystem, stolpar, terräng, arkitektur, vegetation, kamerageneration och väder. Flera överensstämmande ledtrådar är starkare än en enda minnesvärd.

### Externa referenser

- [Plonk It](https://www.plonkit.net/) — strukturerade guider för länder, regioner, kartor och träning.
- [GeoHints](https://geohints.com/) — visuell katalog över kantstolpar, linjer, registreringsskyltar, vägmärken, stolpar, kameror och andra ledtrådar.
- [GeoMetas](https://geometas.com/) — kostnadsfria metaguider efter land, region och kategori, med dynamiska quiz.
- [Learnable Meta](https://learnablemeta.com/) — GeoGuessr-lärkartor, dokumentation och resurser för att skapa kartor.

## Lär, Meta och Anteckningsbok

**360°-kameran** i arbetsytan kopierar fyra riktningar från det aktuella panoramat som en enda bild. Bilden skickas direkt till urklipp och sparas inte i GeoTrainer.

Lär har tre vägar. **Anpassad** behåller samlingar och miljöer. **Meta** öppnar guidade lektioner vid sparad panorama och riktning. **Utforska karta** visar Street View-täckning. I Meta och kartan öppnar Avslöja det vanliga platskortet, där Spara för repetition schemalägger senare kartträning. Kartan använder Tillbaka till världskartan i stället för Nästa. Anpassat lärande och Spel använder officiella Google-bilder som standard; välj blandat för både officiella panoraman och bidragsgivarpanoraman eller välj endast bidragsgivare. **Tillåt inomhusmiljöer** är avstängt som standard i båda inställningarna; när det aktiveras kan Google visa Street View-täckning både inomhus och utomhus. Under **Inställningar → Visning** kan du styra gatunamn, bilddatum, telefonrörelse, förflyttning, karttyp, gester, klickbara platser och GeoTrainer-färger. Gatunamn och klickbara platser är avstängda som standard för att undvika oavsiktliga ledtrådar.

Glödlampan uppe till höger öppnar och stänger förklaringen. Förstarådet kan stängas en gång eller döljas permanent utan att lektioner tas bort. Ett Meta visas i **Mina ledtrådar** först när platsen uttryckligen sparas för repetition. Under repetition visas bara referensbilden före svaret; hela texten visas efteråt och lärverktygen förblir tillgängliga tills du väljer nästa repetition.

**Anteckningsboken** sparar valfritt antal personliga noteringar per panorama. Kategori och text är valfria; en tom post kan också spara platsen för repetition. Den tar även emot bilder som analyserats med Coach. Under repetition kan du skriva och spara en ny anteckning; bildanalysen avslöjar inte svaret före gissningen. Personliga, AI- och Meta-poster öppnas i detalj med Street View och en överlagrad bild när sådan finns. **Tillgängliga anteckningar** visar en räknare och hela den rullningsbara historiken; nya Coach-analyser hamnar där direkt och öppnas inte som aktivt Coach-resultat efter omladdning. Mina ledtrådar filtrerar **Personliga**, **AI-assisterade** och **Meta-lektioner** och visar 20 matchande poster per sida; avslöjande text förblir dold före svaret.

Varje sparning i Anteckningsboken förblir en egen post, även i samma panorama. Om ett inskickat foto inte kan läsas in ligger anteckningen kvar och markeras för återställning.

Ett svagt repetitionsresultat flyttas automatiskt till slutet av den aktuella sessionen tills du klarar det. Varje försök sparas separat.

Meta-studier innehåller 359 lokalt lagrade lektioner, normaliserade från den parade OpenGuessr-insamlingen och ytterligare GeoMetas-exempel med användbara Street View-koordinater. Meta-förklaringar följer gränssnittsspråket på alla åtta språk som stöds. När du använder AI Coach eller sparar en post i Anteckningsboken skapas eller återanvänds repetitionskortet automatiskt; annars finns Spara för repetition kvar på det avslöjade platskortet. **Tillgängliga anteckningar** innehåller personlig och AI-assisterad historik för panoramat och Street View-noder i samma land inom 50 meter, med fullständig analys, exakt tid och den inskickade skärmbilden när den finns; Meta ligger kvar under sin egen glödlampa. Coach väntar på den sparade språkinställningen och begär alla naturliga textvärden på det valda AI-språket. Slutlig personlig och AI-text behåller språket den skapades på. Repetition av ett redan förfallet kort flyttar schemat framåt även från anpassad träning och sparas efter omladdning.

Meta väljer bara oavslutade lektioner. När alla 359 är klara gråas alternativet i Lär dig ut och kan inte längre väljas.

En oavslutad Studie- eller Spelsession sparas. När du återvänder kan du välja **Återuppta**, **Starta nytt** eller **Tillbaka**. Täckningen har ett kontinuerligt värmelager för **Behärskning**: många lyckade repetitioner och långa intervall gör länder och platser gradvis ljusare, medan missar sänker intensiteten. Ett panorama som öppnas från Täckning har AI Coach, Anteckningsbok, länkad Meta och Tillgängliga anteckningar; en sparning skapar eller återanvänder dess repetitionskort. Bildberoende Meta-ledtrådar visar en varning eftersom Street View-uppdateringar kan göra dem inaktuella.

## AI-coachstilar och förklaringsdjup

Under **Inställningar → AI Coach** väljer du **Fråga alltid före analys** eller en föredragen stil. Fråga alltid visar stilväljaren vid varje analys; en föredragen stil går direkt till analysen. Förklaringsdjupet Kort, Normal eller Djup väljs separat och ändrar mängden relevant detalj, inte coachens metod. Adaptive och automatiska stilbyten finns inte.

- **⚡ Quick Guess** ger en snabb andra bedömning: troliga länder, relativa sannolikheter, de starkaste synliga ledtrådarna och en kort säkerhetsbedömning. Styrkan är hastighet under spel; svagheten är begränsad undervisning. Exempel: ”Irland 55 %, Storbritannien 25 % — stenmurar och smal Atlantnära landsväg; medelhög säkerhet.”
- **🎯 Meta Coach** behandlar pollare, stolpar, vägmarkeringar, skyltar, plåtar, Google-bil, täckning, arkitektur och landskapsmeta. Viktiga ledtrådar får ungefärlig nivå S–D, roll som landsidentifierare, regionidentifierare, eliminator, bekräftare eller känsla, samt tillförlitlighet och förväxlingar. Bäst för No Move; svagheten är att täckningsmeta kan ändras. Exempel: ”Stenmur — nivå B, regional/bekräftande, medelhög tillförlitlighet; inte unik för Irland.”
- **🚫 Elimination Coach** börjar med ”vad kan detta troligen inte vara?”, visar kandidatfältet, vad som talar emot länderna, vilka som återstår och den bästa ledtråden att leta efter. Den motverkar tidig låsning men använder ”mycket osannolikt” i stället för absoluta påståenden när regler har undantag. Exempel: ”Irland, Skottland och Wales återstår; gula diamantvarningar mot brittiska röda trianglar skiljer bäst.”
- **🌍 Deep Geography** följer **vad → funktion → orsak → mänsklig respons → synligt resultat → GeoGuessr-värde**. Den bygger långsiktig geografisk förståelse, men säger uttryckligen när en bild inte räcker för historia, ekonomi eller geologi. Exempel: ”Stenig mark hindrar odling → bönder röjer stenen → stenen blir boskapsgränser → upprepade stenmurar blir en regional ledtråd: fältet gav sitt eget staket.”
- **🧠 Memory Coach** gör sanna ledtrådar till korta minnesankare, orsakskedjor, kontrastpar, motledtrådar och frågor att återkalla senare. Den passar efter misstag och i intervallträning; förenklade regler får aldrig döljas som absoluta. Exempel: ”Minnesankare: Fältet gav sitt eget staket. Förväxling: Skottland. Motledtråd: varningsskyltarnas form.”
- **🏆 Pro Analyst** väger positiva och negativa bevis, motsägelser, ledtrådars oberoende, svaga känslointryck, förväxlingar, osäkerhet och informationsvinst. Den är bäst för avancerade jämna fall men långsammare och procentsiffrorna är bara AI-estimat. Exempel: ”Irland 48 %, Storbritannien 31 %; stenmurar måttliga, grönt gräs lågvärdigt; skyltar ger störst informationsvinst.”

Alla stilar börjar med samma synliga observationer. De skiljer direkt observerat från rimlig slutsats och spekulation. Oläsliga förkortningar, okända organisationer, grödor, historiska händelser, geologi, regler och industrier får inte uppfinnas eller driva landsgissningen. Varje kandidat ska förklara den konkreta synliga egenskapen, om den är landsnivå eller bara regional/stödjande, huvudförväxlingen, vad som skiljer den och vilken ytterligare ledtråd som skulle öka säkerheten. En regional bedömning visas bara när bilden faktiskt stöder den.
Under en aktiv repetition visar sidhuvudet aktuellt kort, antal återstående kort och att framstegen är sparade. Efter omladdning behålls antalet redan slutförda kort.
