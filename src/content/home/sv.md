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

I anpassat lärande, spel och panoramaval i Utforska karta erbjuder **Inomhusbilder** Endast utomhus (standard) eller Blandat: inne och ute. Google har ingen tillförlitlig sökning efter enbart inomhusbilder; blandat läge kan visa båda. Uppladdade kartor, Meta och Repetition påverkas inte.

Lär har fyra val: Anpassat, Meta, Utforska karta och Uppladdad karta. Välj en JSON-fil från Map Maker med en lista över platser eller `customCoordinates`; varje plats behöver giltig latitud och longitud. Filen måste vara mindre än 10 MB. Föregående finns före Visa och blir tillgänglig när du har besökt två platser. Nästa går framåt genom platserna i den här lärsessionen innan en ny plats väljs. X till höger i sidhuvudet öppnar valet av lärläge igen. Kartan stannar på den här enheten; ladda upp den igen på andra enheter. Platsvariation 0 behåller den uppladdade vyn; 100 söker Street View upp till 1 km bort och faller tillbaka till en ursprunglig plats om det behövs. Minus minimerar platskortet och maximera fyller skärmen.

### Välj prioritet för lärandet

Lärande med en uppladdad karta märker källans förlopp, till exempel **Källa: 1/50**. Varje post markeras som klar efter kontrollen, så **Nästa** kan inte välja den igen även om en närliggande variation öppnar ett annat panorama; trasiga poster kontrolleras också bara en gång. När källan är klar döljs **Nästa** och bara **Föregående** återstår. Spel upprepar inte heller källposter. I Utforska karta kan du söka efter en stad, region eller ett land och välja ett förslag från GeoTrainers inbyggda katalog för att zooma dit. Förslagen flyttar bara täckningskartan; klicka på blå täckning för att öppna Street View. Personlig text i Anteckningsboken är begränsad till 1000 tecken per sparning och en räknare visas under redigeraren.

Prioritet styr hur **nya platser i Anpassat lärande** väljs efter samling, landsmix, miljö, bildkälla och inomhusfilter. Det påverkar inte Uppladdad karta, Meta, Utforska karta, Spel eller Repetition.

- **Slumpmässigt** (standard) väljer ur det möjliga urvalet utan att använda din historik. I Världen tonas mycket små territorier ned så att de inte dominerar. Använd det för variation eller en bred rundtur i samlingen.
- **Bekanta platser** väljer en tidigare mött möjlig plats som utgångspunkt och söker ungefär 1–12 km runt den. Det tränar omgivningen och närliggande vyer i stället för att upprepa exakt samma panorama.
- **Minst erfarenhet** väljer först ett osynligt eller minst besökt möjligt land, fyller inkluderade regioner som fortfarande är grå i Täckning och siktar sedan på den största återstående geografiska luckan. Regionsteget gäller även samlingar med ett enda land; regioner utan en användbar lokal punkt faller tillbaka till den landsomfattande lucksökningen.

Om det inte finns någon möjlig historik börjar Bekanta platser och Minst erfarenhet från det valda urvalet som Slumpmässigt. Vid en sökning med Minst erfarenhet och flera länder provar GeoTrainer först det valda grå eller minst besökta landet och dess regionala mål. Varje sökning utan ett giltigt panorama, även när panoramat ligger utanför det begärda landet, går vidare direkt. Om ett osynligt land misslyckas provas länder med redan bekräftad täckning från minst till mest erfarenhet före fler okända länder; lika alternativ blandas. Ordningen upprepas tills ett panorama hittas eller du lämnar vyn. Street View-täckning och aktiva filter avgör fortfarande om målområdet kan ge ett panorama, så en närliggande tillgänglig vy kan användas när den exakta platsen saknar täckning.

För Världen med Minst erfarenhet hoppar en inbyggd täckningskontroll över länder vars punkter inte gav något navigerbart officiellt panorama. Fokuserade landspooler söker fortfarande i alla valda länder.

Studera är ett första möte utan betyg. Välj hela samlingen, ett målland eller en grupp länder som du ofta blandar ihop; varje land visas som en borttagbar flaggbricka. När du sparar en ledtråd skapas automatiskt ett repetitionskort utan påhittad poäng. Den aktuella platsen förblir öppen efter sparandet; använd Nästa när du vill gå vidare. Det sparade läget återställs efter omladdning, så åtgärden visas inte igen.

Använd de separata listorna **Regioner** och **Städer** och ta bort val med deras brickor. Regioner grupperas efter land och städer efter region. Utan valda regioner används den vanliga poolen för hela landet. Utan valda städer i en region ingår alla tillgängliga städer; valda städer begränsar bara den regionen. Om du tar bort en region tas dess städer också bort; om du tar bort den sista staden återställs alla tillgängliga städer i regionen. När du har lagt till länder kan du lägga till regioner och städer som egna brickor. Regioner visas alfabetiskt; städer sorteras som standard efter betydelse utifrån befolkning och kan även sorteras alfabetiskt. **Alla tillgängliga städer** använder de inkluderade stadspunkterna i regionen; valet täcker inte hela den administrativa gränsen och garanterar inte varje väg eller landsbygdsområde. En ny Lär-inställning efter en fokuserad session återställer World och hela landslistan; Återuppta behåller den sparade sessionen. Minst exponering först söker först vid den valda punkten och utökar sedan sökningen lokalt. I Blandat använder nya försök landets täckningspunkter med filtren kvar. Sökningen fortsätter i lugn takt tills en matchning hittas eller du lämnar eller ändrar inställningen; täckning på den exakta målpunkten kan inte garanteras.

Namnen på regioner och städer följer gränssnittets språk när ett lokaliserat namn är tillgängligt. **Spara geografisk pool** hämtar de valda länderna, regionerna och städerna som JSON utan Street View-koordinater. **Ladda upp JSON** och **JSON-URL** tar emot detta redigerbara format eller koordinat-JSON från Map Maker; en geografisk pool återgår till Anpassat för redigering, medan koordinater förblir en ändlig källa. Fil- eller URL-namnet visas. Endpointen måste tillåta webbläsaråtkomst med CORS.

**Beskriv en pool** skickar en kort lärandebeskrivning till Gemini och öppnar de föreslagna länderna, regionerna och städerna i Anpassat så att du kan kontrollera och redigera dem. Du kan skriva på valfritt språk som stöds och beskriva platser, landskap eller vanliga förväxlingar. Det är ett AI-förslag, inte en geografisk garanti.

## Spelläge

I spelinställningarna väljer du Genererade platser eller Uppladdad karta. Omgångarna använder platser från filen och kan upprepa dem om det finns fler omgångar än platser.

Spela använder samma landsmix och mäter fri återkallning i 1–100 rundor. Varje svar blir ett nytt försök och sparar den aktuella vyn för förhandsvisning.

## Repetition och schemaläggning

På mobilen ligger Precisionsplats längst ner på den synliga skärmen så att du kan öppna gissningskartan utan att rulla. Under Repetition visas aktuellt kort, återstående kort och sparat förlopp i sidhuvudet. Resultatpanelen är kompakt och knappen för nästa repetition förblir nåbar när du rullar i detaljerna.

### Anpassa repetition

- **Nya kort / dag** begränsar kort som aldrig har repeterats. **Maximalt antal repetitioner / dag** begränsar hela kön, både nya och tidigare repeterade kort. Båda gränserna gäller samtidigt. Med 50 nya kort och högst 500 repetitioner kan 110 kort vara förfallna men bara 108 vara redo om två nya kort ligger över gränsen. Start och Repetition visar det antal som faktiskt kan göras; Repetition visar separat hur många som väntar bakom dagsgränserna. En högre totalgräns åsidosätter inte gränsen för nya kort.
- **Bedömningsnivå** styr den automatiska bedömningen: Nybörjare tolererar större avstånd, Balanserad väger land och precision, och Proffs kräver starkare resultat. Land, avstånd, poäng och svarstid används; inga manuella Igen/Svårt/Bra/Lätt-knappar visas.
- **Lägg till spelrundor för repetition** är skilt från bedömningen: en framtida spelrunda skapar ett kort om poängen ligger under den valda gränsen eller landet är fel. Ett aktiverat villkor räcker; nya profiler börjar vid den aktiva Svårt/Igen-gränsen (3 000 för Balanserad).
- **Första repetition av nytt kort** anger väntetiden före ett nytt kort blir förfallet. **Återinlärningssteg** anger hur snart ett misslyckat kort kan återkomma samma dag. **Första utmärkta intervall** ger ett mycket starkt första svar längre väntetid. **Maximalt intervall** sätter taket för mogna kort.
- **Maximal svarstid** påverkar bedömningen av hur flytande minnet var; det är inte automatiskt en synlig nedräkning. **Ordning** väljer äldst förfallna först eller slumpmässig kö.
- **Återställningstid** och **tidszon** bestämmer när en ny repetitionsdag och nya dagsgränser börjar. Automatisk tidszon följer enheten; stäng av den för att välja zon själv. Förhandsvisningen visar nästa verkliga repetitionstid.
- **Variera repetitionsvy** behåller samma kort och schema men kan ändra riktning eller välja ett närliggande panorama för väl inlärda platser. Svårighet 0 använder originalet. Svaga eller misslyckade kort hålls närmare originalet, och en misslyckad sökning faller tillbaka utan att skapa dubletter.

Välj **Spara** för att använda ändringarna. Bedömning och intervall påverkar framtida schemaläggning och skriver inte om gamla försök; gränser och köordning används vid nästa köberäkning.

Svaret döljs tills du gissar. Om ett gammalt panorama-ID öppnar en vy mer än 10 km från det sparade svaret använder Repetition en giltig vy nära de sparade koordinaterna eller öppnar inte kortet. Efter svaret visar resultatet tillgänglig stad, region, väg, fullständig adress och exakta koordinater, precis som Visa i Studera. Minimera resultatet uppe till höger för att studera panoramat och använd Visa resultat för att öppna det igen. Anpassad extraträning lämnar framtida kort oförändrade; när ett redan förfallet kort slutförs flyttas datumet fram och består efter omladdning.

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

Under Inställningar → Visning → Kartor kan du välja **Kartans färgpalett**: Automatiskt, Ljust eller Mörkt. **Zoom för resultatkarta** erbjuder Närmaste, Land, Landsregion eller Världen; Land är standard. Automatiskt följer appens utseende; Ljust eller Mörkt behåller valet på väg- och terrängkartor. Satellitbilder behåller sina färger. Landsgränser visas som standard och kan döljas; de syns bara när en gräns ligger i det visade kartområdet. Gränsernas bredd och färg kan justeras med en direkt förhandsvisning; regiongränser är avstängda som standard och kan aktiveras separat.

Länder, städer och miljöer styr genereringen utan att lova fullständig täckning. Inställningar skiljer gränssnitts-, spel- och AI-språk samt repetition, tidszon, utseende och karthjälp. Nya profiler får 50 nya kort och 500 repetitioner per dag. Ljudeffekter och bakgrundsmusik är valfria, börjar avstängda och har separata volymer.

## Framsteg och statistik

Sparade Studieplatser är obedömda källor: de räknas som Studieaktivitet och nya kort, inte som ”Ingen gissning”-försök eller nollpoäng. En omladdning återupptar det aktuella besöket utan att lägga till en ny rad.

Se platser, försök, kö, resultat, historik och aktiv tid i förgrunden under Studera, aktivt Spel och aktiv Repetition, inklusive tid när du rör dig i panoramat eller använder lärhjälpmedel. Resultat, Geografi, Framsteg och Förväxlingar kombinerar försök från Spel och Repetition; AI-rutan påverkar bara Spel. Tid i en dold eller stängd flik ökar inte nya svarstider. Tiden sparas när du byter avsnitt eller återgår till startsidan; sessioner utan besök eller försök döljs. Håll ned en stapel under **Kommande förfallna** på en pekskärm för att se datum och antal. Kända ledtrådar summerar personliga, AI- och Meta-poster utan att räkna en anteckningsbild två gånger. AI-assisterade spel ingår som standard men kan uteslutas. Sammanfattningen skiljer tidigare och dagens snitt. Platser i samma land inom 50 meter delar ett kort.

## Molnsynkronisering

Konto är valfritt och lokal träning fungerar utan inloggning. Framsteg sparas först i den här webbläsaren och synkroniseringen är manuell. Tryck på **Synkronisera nu** på enheten med nya data för att hämta, slå ihop och ladda upp kort, försök och repetitionshistorik; gör sedan samma sak på de andra enheterna. Det senast bedömda schemat vinner och unika poster från varje enhet bevaras. Inloggning, sparande, återgång till appen och avslut överför inget automatiskt. Utan inloggning förblir localhost och den publicerade webbplatsen separata.

Saknade privata ledtrådsbilder sparas i webbläsaren under manuell synkronisering. Ledtrådar, Tillgängliga anteckningar, Täckning och historik använder sedan den lokala kopian utan att kontakta molnlagringen.

**Synka och säkerhetskopiera** erbjuder även **Exportera** och **Importera** utan molnåtkomst. Export hämtar en `.geotrainer`-fil med hela den lokala databasen och sparade bilder på enheten. Import validerar filen och slår bara ihop saknad eller nyare information utan att radera lokala framsteg. Filen innehåller konto-ID:t som exporterade den; ett annat konto eller utloggat läge kräver bekräftelse. Håll filen privat och överför den via Drive, OneDrive, USB eller en annan betrodd plats.

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

Inklistrade, uppladdade och fångade bilder i Anteckningsboken kan beskäras före analys eller sparning. Använd redigeringsknappen nere till höger i förhandsvisningen, dra området eller dess hörn och använd beskärningen.

När en textanteckning eller analys av en inklistrad ledtråd sparas bekräftar en avisering att den finns i Anteckningsboken.

**360°-kameran** i arbetsytan kopierar fyra riktningar från det aktuella panoramat som en enda bild. Ett statusmeddelande visar förloppet och bekräftar om kopieringen lyckades. Bilden skickas direkt till urklipp och sparas inte i GeoTrainer.

Lär har fyra vägar. **Anpassad** behåller samlingar och miljöer. **Meta** öppnar guidade lektioner vid sparad panorama och riktning. **Utforska karta** visar Street View-täckning. Filtren längst ned till vänster väljer officiella, blandade eller bidragsgivarbilder och endast utomhus eller blandad täckning. I Meta och kartan öppnar Avslöja det vanliga platskortet, där Spara för repetition schemalägger senare kartträning. I Utforska karta kan du klicka på blå täckning i kortets karta för att flytta till ett annat panorama; kortets karta behåller zoom och position. Om Endast officiella inte hittar något säger meddelandet att du kan välja **Officiella + bidragsgivare** nedan; filtret ändras aldrig automatiskt. En globknapp uppe till vänster i panoramat går tillbaka till världskartan utan att ta plats i sidhuvudet. Anpassat lärande och Spel använder officiella Google-bilder som standard; välj blandat för både officiella panoraman och bidragsgivarpanoraman eller välj endast bidragsgivare. **Tillåt inomhusmiljöer** är avstängt som standard i båda inställningarna; när det aktiveras kan Google visa Street View-täckning både inomhus och utomhus. Under **Inställningar → Visning** kan du styra gatunamn, bilddatum, telefonrörelse, förflyttning, karttyp, gester, klickbara platser och GeoTrainer-färger. Gatunamn och klickbara platser är avstängda som standard för att undvika oavsiktliga ledtrådar.

Glödlampan uppe till höger öppnar och stänger förklaringen. Förstarådet kan stängas en gång eller döljas permanent utan att lektioner tas bort. Ett Meta visas i **Mina ledtrådar** först när platsen uttryckligen sparas för repetition. Under repetition visas bara referensbilden före svaret; hela texten visas efteråt och lärverktygen förblir tillgängliga tills du väljer nästa repetition.

**Anteckningsboken** sparar valfritt antal personliga noteringar per panorama. Kategori och text är valfria; en tom post kan också spara platsen för repetition. Den tar även emot bilder som analyserats med Coach. Under repetition kan du skriva och spara en ny anteckning; bildanalysen avslöjar inte svaret före gissningen. Personliga, AI- och Meta-poster öppnas i detalj med Street View och en överlagrad bild när sådan finns. I detaljvyn för en sparad bildledtråd kan du lägga till eller redigera anteckningstexten, spara den och öppna bilden i helskärm. Exakt samma bild slås bara ihop när anteckningen eller beskrivningen också är identisk eller tom; olika meningsfull text behåller separata poster. **Tillgängliga anteckningar** visar en räknare och hela den rullningsbara historiken; nya Coach-analyser hamnar där direkt och öppnas inte som aktivt Coach-resultat efter omladdning. Mina ledtrådar filtrerar **Personliga**, **AI-assisterade** och **Meta-lektioner** och visar 20 matchande poster per sida; avslöjande text förblir dold före svaret.

Varje post i Tillgängliga anteckningar har en diskret papperskorg. Poster med samma normaliserade text eller exakt samma bild slås ihop automatiskt, och den mest kompletta versionen med bild och beskrivning behålls.

Varje sparning i Anteckningsboken förblir en egen post, även i samma panorama. Om ett inskickat foto inte kan läsas in ligger anteckningen kvar och markeras för återställning.

Ett svagt repetitionsresultat flyttas automatiskt till slutet av den aktuella sessionen tills du klarar det. Varje försök sparas separat.

Meta-studier innehåller 359 lokalt lagrade lektioner, normaliserade från den parade OpenGuessr-insamlingen och ytterligare GeoMetas-exempel med användbara Street View-koordinater. Meta-förklaringar följer gränssnittsspråket på alla åtta språk som stöds. När du använder AI Coach eller sparar en post i Anteckningsboken skapas eller återanvänds repetitionskortet automatiskt; annars finns Spara för repetition kvar på det avslöjade platskortet. **Tillgängliga anteckningar** innehåller personlig och AI-assisterad historik för panoramat och Street View-noder i samma land inom 50 meter, med fullständig analys, exakt tid och den inskickade skärmbilden när den finns; Meta ligger kvar under sin egen glödlampa. Coach väntar på den sparade språkinställningen och begär alla naturliga textvärden på det valda AI-språket. Slutlig personlig och AI-text behåller språket den skapades på. Repetition av ett redan förfallet kort flyttar schemat framåt även från anpassad träning och sparas efter omladdning.

Meta väljer bara oavslutade lektioner. När alla 359 är klara gråas alternativet i Lär dig ut och kan inte längre väljas.

En oavslutad Studie- eller Spelsession sparas. När du återvänder kan du välja **Återuppta**, **Starta nytt** eller **Tillbaka**. Täckningen har ett kontinuerligt värmelager för **Behärskning**: många lyckade repetitioner och långa intervall gör länder och platser gradvis ljusare, medan missar sänker intensiteten. Ett panorama som öppnas från Täckning har AI Coach, Anteckningsbok, länkad Meta och Tillgängliga anteckningar; en sparning skapar eller återanvänder dess repetitionskort. Bildberoende Meta-ledtrådar visar en varning eftersom Street View-uppdateringar kan göra dem inaktuella.

I Täckning kan du dra ländernas värmekarta och zooma med mushjulet, reglaget eller knapparna. Klicka på ett land för att öppna dess regionkarta med samma lager. Regionerna bestäms utifrån sparade platsuppgifter eller via Google Maps när kartan öppnas. Vissa länder saknar regionkarta; platser vars region inte kan avgöras förblir ofärgade.

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

Resultatkartan håller det gröna svaret centrerat och zoomar ut tills dagens röda gissning och alla sparade tidigare gissningar med koordinater i blått syns. Den valda resultatzoomen är den närmaste tillåtna nivån. Betyget och nästa kö sparas innan resultatet visas, så en omladdning efter ett godkänt svar fortsätter till nästa kort.
