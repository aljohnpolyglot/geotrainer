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

Endast utomhus gäller tillsammans med bildkällan: Endast officiella söker också utomhusbilder. Välj uttryckligen Blandat: inne och ute om du vill tillåta inomhusmiljöer i nya platser i Spel eller Anpassat lärande.

Lär har fyra val: Anpassat, Meta, Utforska karta och Uppladdad karta. Välj en JSON-fil från Map Maker med en lista över platser eller `customCoordinates`; varje plats behöver giltig latitud och longitud. Filen måste vara mindre än 20 MB. Föregående finns före Visa och blir tillgänglig när du har besökt två platser. Nästa går framåt genom platserna i den här lärsessionen innan en ny plats väljs. X till höger i sidhuvudet öppnar valet av lärläge igen.

Panoramamenyn visar alla platser i JSON-filen så snart den första vyn öppnas, även platser som inte har besökts. Numren följer filens ordning även när Nästa blandar platserna. Välj ett nummer för att öppna platsen; en otillgänglig vy kan provas igen senare. Föregående och Nästa går genom öppnade vyer. Fortsätt återställer sessionens historik, och när en karta öppnas igen återställs tidigare sparade vyer om deras källposter kan verifieras. JSON-platser känns igen via källpunktens identitet i Lär och Spela även om Google öppnar ett annat panorama; exakta panorama-ID:n och platser i samma land inom 50 meter känns också igen från äldre sparningar. Ett befintligt kort behåller sitt schema. Kortet för den avslöjade platsen visar Spara för repetition bara om inget kort redan finns och bekräftar snabbt en ny sparning.

För uppladdad JSON i Lär är **Källans ordning** av som standard. Slå på den för att följa filens ordning; låt den vara av för att blanda platserna. Valet behålls när du återupptar en pausad lärsession.

Kartan stannar på den här enheten; ladda upp den igen på andra enheter. Platsvariation 0 behåller den uppladdade vyn; 100 söker Street View upp till 1 km bort och faller tillbaka till en ursprunglig plats om det behövs. Minus minimerar platskortet och maximera fyller skärmen.

Den gröna punkten på kartan över den visade platsen och resultatkartan visar Street View-kamerans riktning. Den vrids när du vrider vyn; sparade resultat använder den registrerade riktningen när den finns.

Medan du studerar eller spelar på en skapad plats kan GeoTrainer förbereda nästa lämpliga plats i bakgrunden. Nästa eller Fortsätt kan då öppna den snabbare. Street View-bilderna läses in först när du går vidare; ändrade inställningar eller en otillgänglig plats startar en ny sökning.

Under **Världen → Urval** väljer du **Världsmix** med prioriteten **Slumpmässigt** för att följa ländernas frekvens i ett urval av 215 platser från OpenGuessr-dueller. Urvalet omfattar 53 länder: USA förekom 31 gånger, Indien 14, Brasilien 12 och Australien 11. Det påverkar landsvalet för nya platser i anpassat Lär och Spela, men inte panoramakällan eller filtren. Läget efterliknar urvalet ungefär, inte spelets privata algoritm; tillgänglig Street View kan ändra utfallet.

Världsmix kombinerar ländernas frekvens i urvalet (70 %) med Naturlig viktning (30 %). Länder som saknas i duellerna kan därför fortfarande dyka upp. Naturlig är fortfarande standard.

### Välj prioritet för lärandet

Lärande med en uppladdad karta märker källans förlopp, till exempel **Källa: 1/50**. Varje post markeras som klar efter kontrollen, så **Nästa** kan inte välja den igen även om en närliggande variation öppnar ett annat panorama; trasiga poster kontrolleras också bara en gång. När källan är klar döljs **Nästa** och bara **Föregående** återstår. Spel upprepar inte heller källposter.

I Utforska karta kan du söka efter en stad, region eller ett land och välja ett förslag från GeoTrainers inbyggda katalog för att zooma dit. Förslagen flyttar bara täckningskartan; klicka på blå täckning för att öppna Street View. Personlig text i Anteckningsboken är begränsad till 1000 tecken per sparning och en räknare visas under redigeraren.

Du kan också klistra in en fullständig Google Maps-länk till Street View i sökfältet för att öppna panoramat i länkens riktning. Panoramat måste fortfarande vara tillgängligt och matcha bild- och utomhusfiltren.

Prioritet styr hur **nya platser i Anpassat lärande och genererade spelrundor** väljs efter samling, landsmix, miljö, bildkälla och inomhusfilter. Den påverkar inte uppladdade koordinatkartor, Meta, Utforska karta eller Repetition. Uppladdade geografiska pooler återgår till Anpassat, där prioriteten gäller för genererade platser.

- **Slumpmässigt** (standard) väljer ur det möjliga urvalet utan att använda din historik. I Världen tonas mycket små territorier ned så att de inte dominerar. Använd det för variation eller en bred rundtur i samlingen.
- **Bekanta platser** väljer en tidigare mött möjlig plats som utgångspunkt och söker ungefär 1–12 km runt den. Det tränar omgivningen och närliggande vyer i stället för att upprepa exakt samma panorama.
- **Minst erfarenhet** väljer först ett osynligt eller minst besökt möjligt land, fyller inkluderade regioner som fortfarande är grå i Täckning och siktar sedan på den största återstående geografiska luckan. Regionsteget gäller även samlingar med ett enda land; regioner utan en användbar lokal punkt faller tillbaka till den landsomfattande lucksökningen.

Om det inte finns någon möjlig historik börjar Bekanta platser och Minst erfarenhet från det valda urvalet som Slumpmässigt. Vid en sökning med Minst erfarenhet och flera länder provar GeoTrainer först det valda grå eller minst besökta landet och dess regionala mål. Varje sökning utan ett giltigt panorama, även när panoramat ligger utanför det begärda landet, går vidare direkt.

Om ett osynligt land misslyckas provas länder med redan bekräftad täckning från minst till mest erfarenhet före fler okända länder; lika alternativ blandas. Ordningen upprepas tills ett panorama hittas eller du lämnar vyn. Street View-täckning och aktiva filter avgör fortfarande om målområdet kan ge ett panorama, så en närliggande tillgänglig vy kan användas när den exakta platsen saknar täckning.

För Världen med Minst erfarenhet hoppar en inbyggd täckningskontroll över länder vars punkter inte gav något navigerbart officiellt panorama. Fokuserade landspooler söker fortfarande i alla valda länder.

Studera är ett första möte utan betyg. Välj hela samlingen, ett målland eller en grupp länder som du ofta blandar ihop; varje land visas som en borttagbar flaggbricka. När du sparar en ledtråd skapas automatiskt ett repetitionskort utan påhittad poäng. Den aktuella platsen förblir öppen efter sparandet; använd Nästa när du vill gå vidare. Det sparade läget återställs efter omladdning, så åtgärden visas inte igen.

Använd de separata listorna **Regioner** och **Städer** och ta bort val med deras brickor. Regioner grupperas efter land och städer efter region. Utan valda regioner används den vanliga poolen för hela landet. Utan valda städer i en region ingår alla tillgängliga städer; valda städer begränsar bara den regionen. Om du tar bort en region tas dess städer också bort; om du tar bort den sista staden återställs alla tillgängliga städer i regionen.

När du har lagt till länder kan du lägga till regioner och städer som egna brickor. Regioner visas alfabetiskt; städer sorteras som standard efter betydelse utifrån befolkning och kan även sorteras alfabetiskt. **Alla tillgängliga städer** använder de inkluderade stadspunkterna i regionen; valet täcker inte hela den administrativa gränsen och garanterar inte varje väg eller landsbygdsområde.

En ny Lär-inställning efter en fokuserad session återställer World och hela landslistan; Återuppta behåller den sparade sessionen. Minst exponering först söker först vid den valda punkten och utökar sedan sökningen lokalt. I Blandat använder nya försök landets täckningspunkter med filtren kvar. Sökningen fortsätter i lugn takt tills en matchning hittas eller du lämnar eller ändrar inställningen; täckning på den exakta målpunkten kan inte garanteras.

Namnen på regioner och städer följer gränssnittets språk när ett lokaliserat namn är tillgängligt. **Spara geografisk pool** hämtar de valda länderna, regionerna och städerna som JSON utan Street View-koordinater. **Ladda upp JSON** och **JSON-URL** tar emot detta redigerbara format eller koordinat-JSON från Map Maker; en geografisk pool återgår till Anpassat för redigering, medan koordinater förblir en ändlig källa. Fil- eller URL-namnet visas. Endpointen måste tillåta webbläsaråtkomst med CORS.

JSON URL i Lär och Spela accepterar även GitHub-fillänkar med /blob/; rå JSON läses in automatiskt. Direkta JSON-länkar fungerar fortfarande. När du läser in samma URL eller en fil med samma namn igen kan du fortsätta sparade framsteg i Lär eller börja om. Valet visar färdiga platser som x/totalt. Fortsätt behåller matchande platser när JSON ändras och öppnar den senast sparade vyn igen om den fortfarande finns i listan. Dessa framsteg stannar på den här enheten.

I **Ladda upp JSON** och **JSON-URL** kan du öppna **Sparade kartor** och se 10 kartor per sida. Varje rad visar ett läsbart namn, ursprungligt filnamn och framsteg i Lär. **Fortsätt** i Lär öppnar senast sparade panorama; **Använd karta** i Spela väljer kartan för ett nytt spel. Pennan ändrar bara namnet, inte platser eller framsteg. Namnet visas ovanför panoramaväljaren. Sökvägar och nedladdningssuffix som `(2).json` förenklas; ett namn i JSON-filen har företräde. De 30 senaste kartorna samt aktiva och pausade kartor sparas. Äldre kartor och deras källframsteg tas bort automatiskt, men försök och repetitionskort finns kvar. Importera en borttagen fil eller URL igen för att använda den.

Pooler för sportligor kontrollerar angiven säsong och division och väljer bara deltagande klubbars hemkommuner. Utan säsong används den aktuella; utan division används högsta divisionen. Klubbar i samma stad ger ett stadsval. En obekräftad lista eller saknade matchningar ger ett fel i stället för orelaterade städer; poolen gäller städer, inte exakta stadionpanoraman.

Spelinställningen har fyra källor: Anpassat, Ladda upp JSON, JSON-URL och Beskriv en pool. Klistra in en direkt HTTP- eller HTTPS-länk till JSON under JSON-URL och välj Ladda URL. Koordinatkartor behåller sina platser och begränsar antalet rundor; geografiska pooler öppnas i Anpassat för redigering.

För JSON-kartor står **Platsordning** på Blanda som standard; välj Källans ordning för att följa filens lista. **Hoppa över sedda platser** är på från början och hoppar över besökta eller sparade panoraman, även vyer i samma land inom 50 meter. Stäng av det för att ta med bekanta platser. Om inga lämpliga vyer finns kvar, välj en annan karta eller stäng av valet. Valen sparas med spelet. Om länken inte går att ladda eller JSON är ogiltigt kan du rätta länken eller ladda upp JSON-filen.

**Beskriv en pool** skickar en kort lärandebeskrivning till Gemini och öppnar de föreslagna länderna, regionerna, städerna, miljön, stadsnivån, urvalet, prioriteten, bildkällan och inomhustäckningen i Anpassat så att du kan kontrollera och redigera dem. Förfrågningar om jordbruk och stora naturområden väljer Landsbygd, arkitektur och stadsgator väljer Stad och förorter väljer Förort, om du inte anger något annat. Förfrågningar om sportligor använder unika hemstäder och tar bort namn som inte kan verifieras mot lokala stadsdata. Du kan skriva på valfritt språk som stöds och beskriva platser, landskap eller vanliga förväxlingar. Det är ett AI-förslag, inte en geografisk garanti.

Under skapandet visar knappen den aktuella fasen för länder, regioner eller städer.

## Spelläge

När du har bekräftat en gissning i spelläget kan resultatet visas innan det sparade fotot har laddats klart. Fotot kopplas till platsen för samma försök när det är klart; du kan fortsätta till nästa omgång.

Under **Tidsgräns per runda** i spelinställningarna väljer du Obegränsat, en förinställning eller Egen tid och anger 1–3600 sekunder. Valet sparas till nästa spel; en pausad runda fortsätter med återstående aktiv tid.

**Enstaka båtvyer** är på som standard i anpassat Lär och i Spel med genererade platser. Med Blandad miljö, Slumpmässig prioritet och Naturligt urval kan ett känt båtpanorama från Madagaskar eller Bermuda visas om landet ingår i urvalet. Reglerna för bildkälla och förflyttning gäller fortfarande; om vyn saknas fortsätter den vanliga platssökningen. Stäng av reglaget för att ta bort dessa extra kandidater. Valda regioner eller städer, uppladdade kartor, Meta och Repetition påverkas inte.

### Förflytta dig med tangentbordet

I en spel- eller repetitionsrunda där förflyttning är tillåten klickar du på en navigeringspil i Street View och håller sedan ned mellanslag för att fortsätta i den riktningen. Släpp tangenten för att stanna. Pilen måste ha fokus: om mellanslag aktiverar en annan knapp klickar du på pilen igen. Det är panoramats vanliga tangentbordsfunktion, utan separat hastighetsinställning. No Move och NMPZ tillåter inte förflyttning. I Lär går du vidare med N eller knappen Nästa; mellanslag är fritt för rörelse i Street View. Tangenten kan fortfarande fortsätta en avslutad runda om den knappen har fokus.

I spelinställningarna väljer du Genererade platser eller Uppladdad karta. Omgångarna använder filens platser utan att upprepa poster och begränsas till antalet tillgängliga platser.

Spela använder samma landsmix och mäter fri återkallning i 1–100 rundor. Efter svaret visar resultatet rätt land, tillgänglig stad, region och väg, fullständig adress, exakta koordinater, avstånd och poäng. Varje svar blir ett nytt försök och sparar den aktuella vyn för förhandsvisning. När tiden går ut i Spela skickas markören som finns på kartan automatiskt som svar, även utan bekräftelse. Om ingen markör finns registreras rundan utan gissning.

Med en mus förstoras gissningskartan automatiskt när du för pekaren över den i Spela och Repetera, och förminskas när du flyttar bort pekaren. Detta är på som standard; stäng av **Förstora gissningskartan när muspekaren förs över den** under **Inställningar → Visning → Kartor** för att bara använda knappen. Pekaren öppnar alltid en flytande karta, även om knappen är inställd på Helskärm. Använd knappen på pekskärmar. Om du flyttar eller ändrar storlek på den förstorade panelen förblir den öppen tills du återställer den; nålen och kartvyn behålls.

I Spel och Repetition förstorar knappen gissningskartan som en flytande panel som standard. Under **Inställningar → Visning → Kartor** kan du välja **Helskärm** för **Knapp för att förstora gissningskartan** om hela panelen, inklusive gissningskontrollerna, ska fylla den synliga skärmen. I båda lägena kan du dra panelen i rubriken, ändra storlek från en kant eller ett hörn och återställa den kompakta kartan. Kartan har också en separat helskärmsknapp för själva kartytan. Markören ligger kvar.

I Spel är Street View-täckning och vägnamn avstängda som standard på gissningskartan. Använd lager- och textknapparna i kartans rubrik för den aktuella kartan, eller **Inställningar → Visning → Kartor** för att spara standardvalen. Blå täckning visar allmän tillgänglighet men garanterar inte en panorama som matchar bild- eller inomhusfiltren. Samma kontroller finns i Repetition och på kartor över avslöjade platser, inklusive kortet för en sparad plats.

Ikonen **Spara platsen för repetition** bredvid **Fortsätt spela** låter dig även spara rätt besvarade platser. Den visas bara när den visade platsen saknar repetitionskort, inklusive platser i samma land inom 50 meter. Du kan också bläddra till och spara tidigare rundor. Ikonen försvinner efter sparandet och resultatet förblir öppet. Poäng och befintliga scheman ändras inte. Sparandet finns kvar efter omladdning och molnsynkronisering är fortfarande manuell. Om sparandet misslyckas kan du försöka igen. En kort bekräftelse visar att platsen har sparats för repetition.

## Repetition och schemaläggning

När närliggande försök från Lär och Spela delar ett kort använder Repetition spelrundans rörelseregel: Standard, No Move eller NMPZ. Det läget visas i det övre fältet. Efter svaret går det att förflytta sig, rotera och zooma i panoramat.

Gissningskartorna i Spel och Repetition har diskreta knappar för täckning och vägnamn. De finns även på avslöjade resultatkartor och kort för sparade platser. Standardinställningarna är av från början och sparas i Inställningar; knapparna ändrar bara den aktuella vyn. Zooma in för att se blåmarkerade vägar; guiden garanterar inte en panorama som matchar bild- eller inomhusfiltren.

Kartor över avslöjade platser har också en knapp för regiongränser bredvid vägnamnsknappen. Den ändrar bara den kartan; **Inställningar → Visning → Kartor → Regiongränser** anger standardvalet. Gränserna kommer från Google Maps och kan skilja sig från regionerna i Statistik → Platser.

På mobilen ligger Precisionsplats längst ner på den synliga skärmen så att du kan öppna gissningskartan utan att rulla. Under Repetition visas aktuellt kort, återstående kort och sparat förlopp i sidhuvudet. Resultatpanelen är kompakt och knappen för nästa repetition förblir nåbar när du rullar i detaljerna.

### Anpassa repetition

Det **dagliga minimumet för repetitioner** är ett framstegsmål: det börjar på 50 och ändras i Inställningar → Repetition. **Flytta oavslutade repetitioner till nästa dag** är på från början. Vid dagens slut flyttas kvarvarande kort till nästa repetitionsdag och senare förfallodagar flyttas lika många dagar. Om 100 kort förfaller och du gör 20, följer de andra 80 med till morgondagen. Korta återinlärningssteg behåller sin tid. Om du stänger av valet stoppas framtida flyttar, men tidigare flyttar återställs inte. Målet begränsar inte kön; betyg, försök och intervall sparas.

- **Nya kort / dag** begränsar kort som aldrig har repeterats. **Maximalt antal repetitioner / dag** begränsar hela kön, både nya och tidigare repeterade kort. Båda gränserna gäller samtidigt. Med 50 nya kort och högst 500 repetitioner kan 110 kort vara förfallna men bara 108 vara redo om två nya kort ligger över gränsen. Start och Repetition visar det antal som faktiskt kan göras; Repetition visar separat hur många som väntar bakom dagsgränserna. En högre totalgräns åsidosätter inte gränsen för nya kort.
- **Bedömningsnivå** styr den automatiska bedömningen: Nybörjare tolererar större avstånd, Balanserad väger land och precision, och Proffs kräver starkare resultat. Land, avstånd, poäng och svarstid används; inga manuella Igen/Svårt/Bra/Lätt-knappar visas.
- **Lägg till spelrundor för repetition** är skilt från bedömningen: en framtida spelrunda skapar ett kort om poängen ligger under den valda gränsen eller landet är fel. Ett aktiverat villkor räcker; nya profiler börjar vid den aktiva Svårt/Igen-gränsen (3 000 för Balanserad). När detta är markerat sparas rundor med fel land för repetition även över poänggränsen. De räknas fortfarande som felaktiga svar.
- **Första repetition av nytt kort** anger väntetiden före ett nytt kort blir förfallet. **Återinlärningssteg** anger hur snart ett misslyckat kort kan återkomma samma dag. **Första utmärkta intervall** ger ett mycket starkt första svar längre väntetid. **Maximalt intervall** sätter taket för mogna kort.
- **Maximal svarstid** påverkar bedömningen av hur flytande minnet var; det är inte automatiskt en synlig nedräkning. **Ordning** väljer äldst förfallna först eller slumpmässig kö.
- **Återställningstid** och **tidszon** bestämmer när en ny repetitionsdag och nya dagsgränser börjar. Automatisk tidszon följer enheten; stäng av den för att välja zon själv. Förhandsvisningen visar nästa verkliga repetitionstid.
**Tillbaka till start** är flaggan nere till vänster i Spela och Repetition när rörelse tillåts. Den återgår till rundans startpanorama och behåller blickriktningen. Vid varierad repetition återgår den till vyn som visades när kortet började. På mobilen ligger den större knappen ovanför gissningskontrollerna. Utan rörelse döljs den före svaret och blir tillgänglig efteråt för att utforska platsen. Pilen pekar mot starten relativt din blickriktning, och talet visar fågelvägen i meter, inte vägsträckan.

- **Variera repetitionsvy** behåller samma kort och schema men kan ändra riktning eller välja ett närliggande panorama för väl inlärda platser. Standard, Ingen rörelse och NMPZ har var sitt svårighetsreglage som börjar på 0; varje läge använder det sparade panoramat och den sparade kamerariktningen tills du höjer dess reglage under Inställningar → Repetition. Ett tidigare sparat gemensamt värde används för alla tre lägen vid uppgraderingen och kan sedan ändras separat. Svårighet 0 använder originalet. Svaga eller misslyckade kort hålls närmare originalet, och en misslyckad sökning faller tillbaka utan att skapa dubletter. Närliggande varianter använder bara officiella Google-bilder utomhus; om ingen passande vy finns behålls den sparade vyn.

Ett sparat panorama från en bidragsgivare som fortfarande är tillgängligt öppnas precis som det lärdes in, utan variation. Om det inte längre finns söker Repetition efter officiella Google-bilder utomhus inom 50 meter från den sparade platsen. Utan träff får kortet vänta på ett nytt försök i stället för att visa en annan vy.

Repetition kontrollerar panoramats ID, plats och status innan gissningskartan öppnas och svarstiden börjar räknas. Om bilden förblir svart kan tiden ändå gå; ladda om sidan för att försöka igen.

Välj **Spara** för att använda ändringarna. Bedömning och intervall påverkar framtida schemaläggning och skriver inte om gamla försök; gränser och köordning används vid nästa köberäkning.

Svaret döljs tills du gissar. Om ett gammalt panorama-ID öppnar en vy mer än 10 km från det sparade svaret använder Repetition en giltig vy nära de sparade koordinaterna eller öppnar inte kortet. Efter svaret visar resultatet tillgänglig stad, region, väg, fullständig adress och exakta koordinater, precis som Visa i Studera. Minimera resultatet uppe till höger för att studera panoramat och använd Visa resultat för att öppna det igen.

Slutförda Spel- och Repetitionsrundor låser upp förflyttning, panorering och zoomning under granskningen även om ursprungsrundan begränsade dem. Anpassad extraträning lämnar framtida kort oförändrade; när ett redan förfallet kort slutförs flyttas datumet fram och består efter omladdning.

I **Inställningar → Repetition** kan du ställa in separata variationsnivåer för Standard, Ingen rörelse och NMPZ. Kortet förblir samma repetitionskort med samma schema och framsteg, men GeoTrainer kan först ändra kamerans riktning och senare välja ett lämpligt panorama i samma närområde. Det tränar igenkänning av platsmiljön i stället för minnet av en enda skärmbild.

**Variationssvårighet** går från 0 till 100 och börjar på 0. Då öppnas det sparade panoramat med den sparade blickriktningen tills du väljer ett högre värde i Inställningar → Repetition. Redan sparade värden behålls. Vid 0 används exakt originalvyn. 100 tillåter den största säkra variationen för tillräckligt mogna kort; det betyder inte maximalt avstånd vid varje repetition. Nya eller svaga kort stannar vid originalet eller mycket nära, medan mogna kort gradvis kan visas längre bort. Om du missar en mer varierad vy blir kommande vyer försiktigare utan att skapa ett nytt kort. Hittar GeoTrainer inget lämpligt panorama, eller misslyckas sökningen, används originalvyn automatiskt.

Repetera sparar svaret, schemat, den återstående kön, statistiken för slutförda kort och resultatet innan det visas. När du öppnar samma webbplats i samma webbläsarprofil återställs din plats (till exempel kort 90 av 150), även ett öppet resultat. Fortsätt går till nästa kort utan att betygsätta igen. Spela sparar också aktiv tid under rundan, även utan tidsgräns; tid med stängd app räknas inte. Sparade framsteg finns kvar efter ett internetavbrott, men Street View behöver internet. Om ett panorama inte laddas kan du försöka öppna kortet igen. Synkronisering är fortfarande manuell. Rensade webbplatsdata eller en tillfällig webbläsarprofil kan ta bort lokala framsteg; behåll en portabel säkerhetskopia för återställning.

## AI-coach och ledtrådar

När uppskattningen för det ledande landet når 85 % söker coachen också en mer exakt plats. Två oberoende synliga ledtrådar kan stödja ett brett geografiskt område (som Mellanvästern) eller en namngiven region; en stad eller exakt plats kräver starkare bevis. En hög landsprocent avgör inte regionen på egen hand. Om bilden inte ger tillräckligt stöd visas ingen regional uppskattning.

Under **Inställningar → AI-coach** kan du välja Gemini, Anthropic eller en OpenAI-kompatibel leverantör, ange modell och klistra in din egen API-nyckel. Nyckeln är maskerad, finns bara i sidans minne och skickas via Coach-endpointen för varje analys; GeoTrainer sparar den inte. Välj **Glöm nyckeln** eller läs in sidan igen för att rensa den. Leverantören ansvarar för sina egna användningsgränser och avgifter. OpenAI-kompatibla webbadresser begränsas till offentliga leverantörer som stöds.

Kort, Normal och Djup anpassar också Gemini 2.5:s tankebudget och den synliga förklaringsnivån; Gemini 3-modeller använder motsvarande tankenivåer.

Spel låser AI-markeringen när du skickar svaret. Att analysera ett misstag efteråt, även med minimerat resultat eller medan svaret sparas, ändrar inte försöket. En återställd gammal analys räknas inte som ny AI-användning under den aktuella rundan.

Äldre Spela-markeringar rättas automatiskt när en vanlig anteckningsbild sparades under rundan utan registrerad AI-analys. Sparade AI-analyser av ledtrådar och 360° behåller sin AI-markering. Osäkra äldre poster ändras inte; poäng, svar, anteckningar och repetitionsscheman bevaras.

Spel använder samma lärverktygsrad som Studier: Anteckningsbok, antalet tillgängliga anteckningar i närheten och AI-coach när den är aktiverad i spelinställningen.

Coach väntar före analysen på det sparade AI-språket, avvisar tydligt flerspråkiga resultat och förklarar de synliga skälen för varje nytt kandidatland.

Analysera samlar automatiskt flera riktningar och använder den aktuella vyn som reserv. En uppskattning av region, stad eller exakt plats visas bara när flera starka synliga ledtrådar stöder den. Efter visat facit blir **Analysera** **Förklara**: coachen använder bara referenser för rätt land och säger öppet när bilden inte räckte för att identifiera det. I Spela och Repetition visar coachen **Analysera** utan det sparade svaret som sammanhang när resultatet är minimerat och **Förklara** när du visar resultatet igen. Ledtrådar öppnar ett bibliotek med fullständig detaljvy, Street View och Google Maps-länkar; filtret visar antal per land, sorterar flest först och × rensar det.

Under **Ledtrådar → Länder** kan du välja en kolumnrubrik för att sortera efter land, sparade ledtrådar, coachens genomsnittliga säkerhet eller senaste aktivitet. Välj rubriken igen för att vända ordningen. Länder med flest ledtrådar visas först.

Meta-lektioner som uttryckligen sparats från både nybörjarkursen och landskurserna visas under Mina ledtrådar med text, referensbild när den finns och exakt tid för sparandet.

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

Kartor öppnas snabbare igen under samma session i Lär, Spela, Repetition och platsresultat. När du placerar eller drar en markör ligger kartan kvar där du har ställt in den. När sidan laddas om kan kartbilder behöva hämtas igen; tidigare visade områden är inte garanterat tillgängliga offline.

Under Inställningar → Visning → Kartor kan du välja **Kartans färgpalett**: Automatiskt, Ljust eller Mörkt. **Zoom för resultatkarta** erbjuder Närmaste, Land, Landsregion eller Världen; Land är standard. Automatiskt följer appens utseende; Ljust använder Googles ursprungliga färger för väg- och terrängkartor, medan Mörkt behåller en mörk kartpalett även om appens tema ändras. Satellitbilder behåller sina färger. Landsgränser visas som standard och kan döljas; de syns bara när en gräns ligger i det visade kartområdet. Gränsernas bredd och färg kan justeras med en direkt förhandsvisning; regiongränser är avstängda som standard och kan aktiveras separat.

På en karta med visat svar kan du använda hårkorset för att zooma in till rätt plats, byggnaden för stadsnivå eller jordgloben för att återgå till landsnivå. Du kan fortsätta zooma och flytta kartan; inställningen styr bara den första vyn.

Länder, städer och miljöer styr genereringen utan att lova fullständig täckning. Inställningar skiljer gränssnitts-, spel- och AI-språk samt repetition, tidszon, utseende och karthjälp. Nya profiler får 50 nya kort och 500 repetitioner per dag. Ljudeffekter och bakgrundsmusik är valfria, börjar avstängda och har separata volymer. Med ljudeffekter på hörs signaler under de sista tio sekunderna i tidsbegränsat Spela och när tiden är slut. Musiken växlar från lugn i Lär till en mer pressande rytm i Spela och pausas när sidan döljs.

Wikipedia-språket väljs separat för platslänkar i avslöjade vyer i Lär, Spela och Repetera. Om en matchande artikel saknas på det valda språket söker appen på engelska Wikipedia. Om den saknas även där visas namnet utan länk. Befintliga profiler börjar med engelska. Vägnamn i avslöjade vyer länkar också till en matchande artikel när en sådan finns; annars visas de som vanlig text.

### Poängmål per land

Öppna Inställningar → Preferenser → Poängmål per land. Behåll standardgränsen för att behålla repetitionens nuvarande svårighetsnivå. Välj ett land i menyn, ange lägsta poäng av 5 000, välj Lägg till mål och sedan Spara. Pennan redigerar och × tar bort målet. Namn och tal följer gränssnittsspråket.

Fel land räknas alltid som ett träningsmisstag. Med rätt land misslyckas även poäng under gränsen; exakt gränsen uppfyller målet. Landets mål ersätter standardmålet, men striktare regler för bedömning och automatisk repetition gäller fortfarande. Utan eget mål behåller landet standarden och befintliga regler. Ändrad standard påverkar länder utan egna mål; återställ den för att återgå till repetitionens nuvarande svårighetsnivå.

I Spela och Repetera räknas en gissning i vattnet inom 25 km från svaret till rätt land om kartan inte hittar något land. Nära isolerade öar som Guam, Nordmarianerna och Julön rättas även en missvisande etikett från ett avlägset fastland. Avståndspoäng och poängmål gäller fortfarande; en gissning på ett annat lands mark är fortfarande fel.

I Repetera går ett svar i rätt land inom 25 km från dessa öar vidare med betyget Svårt även om poängen ligger under målet. Poängen och det sparade målet ändras inte; kortet kommer tillbaka tidigare för noggrannare träning.

Spel lägger automatiskt rundor under målet till Repetition. Öva misstag använder sparade mål även för äldre spel. Repetition och korrigering av misstag kräver ett nytt försök under gränsen. Sparade mål ändrar inte poäng, svar, statistik över igenkända länder, ursprungliga försök eller befintliga scheman; nya svar använder de uppdaterade målen. Stads- eller regiongränser kontrolleras inte.


## Framsteg och statistik

Startsidans antal panoraman, försök och aktiva tid hämtas från framsteg som sparats på den här enheten. Punkter visas medan uppgifterna läses in; kontot behöver inte synkroniseras för att visa dem.

Statistik och Täckning formaterar landsnamn, datum och tal med det valda gränssnittsspråket i stället för webbläsarens standardlokal. Landstabellens **Unika platser** räknar panoraman i samma land inom 50 meter som en plats, medan kartan och historiken behåller varje panorama och försök. En uppladdad karta markerar inte platser som sedda förrän de öppnas. Försök, rätt, fel, noggrannhet och poäng kombinerar Spel och Repetition.

Sparade Studieplatser är obedömda källor: de räknas som Studieaktivitet och nya kort, inte som ”Ingen gissning”-försök eller nollpoäng. En omladdning återupptar det aktuella besöket utan att lägga till en ny rad.

Se platser, försök, kö, resultat, historik och aktiv tid i förgrunden under Studera, aktivt Spel och aktiv Repetition, inklusive tid när du rör dig i panoramat eller använder lärhjälpmedel. Resultat, Geografi, Framsteg och Förväxlingar kombinerar försök från Spel och Repetition; AI-rutan påverkar bara Spel. Tid i en dold eller stängd flik ökar inte nya svarstider. Tiden sparas när du byter avsnitt eller återgår till startsidan; sessioner utan besök eller försök döljs.

Håll ned en stapel under **Kommande förfallna** på en pekskärm för att se datum och antal. Kända ledtrådar summerar personliga, AI- och Meta-poster utan att räkna en anteckningsbild två gånger. AI-assisterade spel ingår som standard men kan uteslutas. Sammanfattningen skiljer tidigare och dagens snitt. Platser i samma land inom 50 meter delar ett kort.

Under Statistik → Repetition visar **Jämna ut datum** en förhandsvisning av de kommande 30 dagarna. Håll muspekaren över, fokusera eller tryck på en stapel för att se exakt antal. När du bekräftar flyttas bara framtida kort inom en liten del av deras intervall. Kort som förfaller i dag och korta inlärningssteg ligger kvar. Tidigare svar och betyg påverkas inte. Reglaget för utjämning uppdaterar förhandsvisningen direkt: dra åt vänster för att behålla fler datum eller åt höger för att fylla lugnare dagar mer. Vid 0 % flyttas inga kort. Samma intervallgränser gäller alltid. Välj Återställ ursprungliga datum i samma förhandsvisning för att återföra berörda kort till sina sparade naturliga förfallodatum och bekräfta sedan. Kort som förfaller i dag flyttas inte.
 Aktiv tid i Repetition pausas när resultatet är öppet och fortsätter när du minimerar det eller går vidare. Coachen visar Analysera när resultatet är dolt och Förklara när det visas.

Välj en platsrad i Historik för att öppna det sparade panoramat med AI-coach, Anteckningsbok, Meta och Tillgängliga anteckningar. Tillbaka-knappen återgår till Historik. Den externa pilen öppnar fortfarande Google Maps; repetitionsknappen startar en betygsatt repetition. Att öppna en plats ändrar inte tidigare försök.

## Molnsynkronisering

Om molninloggning inte är tillgänglig döljer kontofönstret inloggningsfälten. Lokal träning och verktygen för att exportera och importera säkerhetskopior fungerar fortfarande.

Konto är valfritt och lokal träning fungerar utan inloggning. Framsteg sparas först i den här webbläsaren och synkroniseringen är manuell. Tryck på **Synkronisera nu** på enheten med nya data för att hämta, slå ihop och ladda upp kort, försök och repetitionshistorik; gör sedan samma sak på de andra enheterna. Det senast bedömda schemat vinner och unika poster från varje enhet bevaras. Inloggning, sparande, återgång till appen och avslut överför inget automatiskt. Utan inloggning förblir localhost och den publicerade webbplatsen separata.

Saknade privata ledtrådsbilder sparas i webbläsaren under manuell synkronisering. Ledtrådar, Tillgängliga anteckningar, Täckning och historik använder sedan den lokala kopian utan att kontakta molnlagringen.

Synkroniseringen använder mindre data utan att förlora sparade framsteg. Exporterade `.geotrainer`-filer komprimeras men innehåller fortfarande alla lokala poster och sparade bilder. Äldre filer kan också importeras.

**Synka och säkerhetskopiera** erbjuder även **Exportera** och **Importera** utan molnåtkomst. Export hämtar en `.geotrainer`-fil med hela den lokala databasen och sparade bilder på enheten. Import validerar filen och slår bara ihop saknad eller nyare information utan att radera lokala framsteg. Filen innehåller konto-ID:t som exporterade den; ett annat konto eller utloggat läge kräver bekräftelse. Håll filen privat och överför den via Drive, OneDrive, USB eller en annan betrodd plats.

## Felsökning

Om Repetition plötsligt inte visar några kort efter en krasch eller omladdning, kontrollera först att du öppnat samma webbplatsadress och webbläsarprofil. Radera inte webbplatsdata. Gå till **Synka och säkerhetskopiera → Importera** och välj din senaste `.geotrainer`-fil; den slås ihop med de framsteg som finns kvar på enheten. Om du manuellt synkroniserade senare arbete, använd **Synkronisera nu** för att hämta den molnkopian. Arbete efter den senaste exporten eller manuella synkroniseringen kanske inte går att återställa.

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

Meta-lektionerna använder externa källor: nybörjarkursens text bygger på [GeoMetas](https://geometas.com/), medan landskursernas text och bilder kommer från [Plonk It](https://www.plonkit.net/guide). GeoTrainer är fristående från dessa guider. Varje lektion visar sin källa; kontrollera originalet för uppdateringar eftersom Street View-täckning och visuella ledtrådar kan ändras. I nybörjarlektioner visas först ledtråden på bilden och därefter, om den finns, en jämförelse med ett annat land.

Referensinfografik för landskurser visas i själva lektionen och i den sparade Meta-detaljen, intill förklaringen. Om ett sparat Meta-panorama slutar fungera söker GeoTrainer efter officiell Street View utomhus inom 50 meter; en tillgänglig originalvy behålls även om den kommer från en bidragsgivare.

När du uttryckligen sparar en post i Anteckningsboken skapas eller återanvänds ett nytt repetitionskort även efter en spelrunda med hög poäng och rätt land. En sparad ledtråd kan lära ut en region, stad, väg eller annan detalj utöver landet.

Inklistrade, uppladdade och fångade bilder i Anteckningsboken kan beskäras före analys eller sparning. Använd redigeringsknappen nere till höger i förhandsvisningen, dra området eller dess hörn och använd beskärningen.

När en textanteckning eller analys av en inklistrad ledtråd sparas bekräftar en avisering att den finns i Anteckningsboken.

**360°-kameran** i arbetsytan kopierar fyra riktningar från det aktuella panoramat som en enda bild. Ett statusmeddelande visar förloppet och bekräftar om kopieringen lyckades. Bilden skickas direkt till urklipp och sparas inte i GeoTrainer.

Lär har fyra vägar. **Anpassad** behåller samlingar och miljöer. **Meta** öppnar guidade lektioner vid sparad panorama och riktning. **Utforska karta** visar Street View-täckning. Filtren längst ned till vänster väljer officiella, blandade eller bidragsgivarbilder och endast utomhus eller blandad täckning. I Meta och kartan öppnar Avslöja det vanliga platskortet, där Spara för repetition schemalägger senare kartträning.

I alla lärvägar visar det avslöjade platskortets karta blå Street View-täckning som standard. Klicka på ett täckt område för att öppna det i Utforska karta, eller använd lagerknappen för att dölja täckningen och stänga av valet i den här vyn. Det för inte en uppladdad karta eller Meta-lektion framåt. Kartan behåller zoom och position efter att du valt täckning. Om Endast officiella inte hittar något säger meddelandet att du kan välja **Officiella + bidragsgivare** nedan; filtret ändras aldrig automatiskt. Tillbakapilen uppe till vänster återgår till exakt det anpassade eller uppladdade panoramat, eller den Meta-lektion du kom från. Om Utforska karta öppnades direkt går globknappen tillbaka till världskartan.

Panoramat som öppnas via den blå täckningen visas direkt med platskortet synligt. Om du kom från en uppladdad JSON-karta går tillbaka-pilen uppe till vänster direkt till exakt samma källpanorama utan att ändra källförloppet; annars öppnar globknappen världskartan.

Anpassat lärande och Spel använder officiella Google-bilder som standard; välj blandat för både officiella panoraman och bidragsgivarpanoraman eller välj endast bidragsgivare. **Tillåt inomhusmiljöer** är avstängt som standard i båda inställningarna; när det aktiveras kan Google visa Street View-täckning både inomhus och utomhus. Under **Inställningar → Visning** kan du styra gatunamn, bilddatum, telefonrörelse, förflyttning, karttyp, gester, klickbara platser och GeoTrainer-färger. Gatunamn och klickbara platser är avstängda som standard för att undvika oavsiktliga ledtrådar.

Slå på gatunamn när du vill lära dig hur gator och vägar namnges på olika platser. Namnen kan också avslöja var du är, så stäng av dem igen när du vill gissa utan den ledtråden.

Glödlampan uppe till höger öppnar och stänger förklaringen. Förstarådet kan stängas en gång eller döljas permanent utan att lektioner tas bort. Ett Meta visas i **Mina ledtrådar** först när platsen uttryckligen sparas för repetition. I Repetition är Meta-panelen dold som standard; öppna den för att läsa hela innehållet.

I Meta-lärande ligger förklaringen till varje nytt panorama bakom glödlampan uppe till höger. Tryck på den när du vill se referensbilden och anteckningarna. Under Inställningar → Skärm → Meta kan du aktivera automatisk öppning för nya lektioner. I Repetition förblir Meta-panelen stängd tills du öppnar den.

Meta har en nybörjarkurs och 131 landskurser. Lektionerna öppnar en panoramavy riktad mot ledtråden. Om Google har ersatt panoramat kan en ny vy inom 50 meter öppnas med samma kamerariktning. Bilderna kan vara nyare. Lektioner utan tillgänglig panoramavy hoppas över utan att markeras som sedda. Om ingen spelbar lektion återstår återgår du till inställningarna för kursen. En lokal exempelbild visas när den finns.

Meta-panelen i Repetition är dold som standard; öppna den för att läsa hela innehållet. Nästa markerar lektionen som sedd även utan Spara för repetition. I nybörjarkursen öppnar Nästa en annan oavslutad lektion och Föregående går tillbaka till en tidigare besökt lektion, även efter omladdning. När inga återstår kommer du tillbaka till kursvalet. I landskurser går Nästa vidare inom landet; Föregående går tillbaka och räknaren visar 1/N.

Du kan söka efter länder och sortera alfabetiskt, efter antal lektioner eller efter förlopp. Starta nytt öppnar valet av lärväg medan Återuppta behåller den sparade lektionen. Meta används för att studera ledtrådar, utan loop med två gissningar eller automatisk Repetitionspost baserad på avstånd. Varje landslektion visar nu sin referensbild från den här webbplatsen.

De 29 GeoCoach-temakurserna innehåller 947 lektioner om skyltar, vägmarkeringar, bilar, språk och regionala ledtrådar. Förklaringar och länkar till valda panoramavyer finns lokalt i GeoTrainer, så lektionerna behöver inte GeoCoachs API under studierna. Varje lektion länkar till ursprungskartan och anger skaparen. Otillgängliga vyer hoppas över enligt samma Meta-regel. En laddningsplatshållare visas medan en Meta-referensbild hämtas.

När GeoCoach har ett ledtrådsfoto visas det i lektionen, lektionslistan och de sparade detaljerna. Lektioner utan källfoto visar fortfarande panorama och förklaring.

Nybörjar- och temakurserna har lokala miniatyrbilder, och namnet på den aktiva kursen visas i Lär-fältet. Välj en Meta-referensbild för att förstora den; stäng med X eller Escape. På kortet för en avslöjad plats länkar platsnamnet till Wikipedia när sökningen ger ett resultat; annars är namnet vanlig text och ett meddelande visas.

Välj Nybörjarkursen, ett tema eller ett land i kursväljaren; varje kurs visar slutförande i procent. Sök bland tema- och landskurser; landskurser kan sorteras efter namn, antal lektioner eller framsteg. **Börja lära** öppnar en oavslutad lektion i den valda kursen med hänsyn till sparade framsteg. **Bläddra bland Meta-lektioner** öppnar listan om du vill välja en viss lektion; sök i lektionstexten och filtrera mellan alla, oavslutade och slutförda. Välj vilken lektion som helst, även en slutförd, och öppna den med **Starta vald lektion**. Att öppna en slutförd lektion igen behåller dess status och schemalägger inget repetitionskort. Kurslektioner och förklaringar följer det valda gränssnittsspråket, oberoende av spel- och AI-språken.

**Anteckningsboken** sparar valfritt antal personliga noteringar per panorama. Kategori och text är valfria; en tom post kan också spara platsen för repetition. Den tar även emot bilder som analyserats med Coach. Under repetition kan du skriva och spara en ny anteckning; bildanalysen avslöjar inte svaret före gissningen. Personliga, AI- och Meta-poster öppnas i detalj med Street View och en överlagrad bild när sådan finns. I detaljvyn för en sparad bildledtråd kan du lägga till eller redigera anteckningstexten, spara den och öppna bilden i helskärm. Exakt samma bild slås bara ihop när anteckningen eller beskrivningen också är identisk eller tom; olika meningsfull text behåller separata poster. **Tillgängliga anteckningar** visar en räknare och hela den rullningsbara historiken; nya Coach-analyser hamnar där direkt och öppnas inte som aktivt Coach-resultat efter omladdning. Mina ledtrådar filtrerar **Personliga**, **AI-assisterade** och **Meta-lektioner** och visar 20 matchande poster per sida; avslöjande text förblir dold före svaret.

Varje post i Tillgängliga anteckningar har en diskret papperskorg. Poster med samma normaliserade text eller exakt samma bild slås ihop automatiskt, och den mest kompletta versionen med bild och beskrivning behålls.

Varje sparning i Anteckningsboken förblir en egen post, även i samma panorama. Om ett inskickat foto inte kan läsas in ligger anteckningen kvar och markeras för återställning.

Ett svagt repetitionsresultat flyttas automatiskt till slutet av den aktuella sessionen tills du klarar det, även efter att den aktiva sessionen laddats om. Varje försök sparas separat, och ett senare godkänt svar flyttar kortet framåt i stället för att lämna det omedelbart redo igen.

**Tillgängliga anteckningar** innehåller personlig och AI-assisterad historik för panoramat och Street View-noder i samma land inom 50 meter, med fullständig analys, exakt tid och den inskickade skärmbilden när den finns; Meta ligger kvar under sin egen glödlampa. Coach väntar på den sparade språkinställningen och begär alla naturliga textvärden på det valda AI-språket. Slutlig personlig och AI-text behåller språket den skapades på. Repetition av ett redan förfallet kort flyttar schemat framåt även från anpassad träning och sparas efter omladdning.


En oavslutad Studie- eller Spelsession sparas. När du återvänder kan du välja **Återuppta**, **Starta nytt** eller **Tillbaka**. Täckningen har ett kontinuerligt värmelager för **Behärskning**: många lyckade repetitioner och långa intervall gör länder och platser gradvis ljusare, medan missar sänker intensiteten. Ett panorama som öppnas från Täckning har AI Coach, Anteckningsbok, länkad Meta och Tillgängliga anteckningar; en sparning skapar eller återanvänder dess repetitionskort. Bildberoende Meta-ledtrådar visar en varning eftersom Street View-uppdateringar kan göra dem inaktuella.

I Täckning kan du dra ländernas värmekarta och zooma med mushjulet, reglaget eller knapparna. I exponeringslagret skiljer färgerna tydligare mellan låga antal möten, medan den övre referensen förblir fast. Klicka på ett land för att öppna dess regionkarta med samma lager. Regionerna bestäms utifrån sparade platsuppgifter eller via Google Maps när kartan öppnas. Sparade regionnamn och namn från Google matchas mot lokala översättningar, även ryska och svenska varianter. Vissa länder saknar regionkarta; platser vars region inte kan avgöras förblir ofärgade.

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

Resultatkartan håller det gröna svaret centrerat och zoomar ut tills dagens röda gissning och alla sparade tidigare gissningar med koordinater i blått syns. Den valda resultatzoomen är den närmaste tillåtna nivån.
