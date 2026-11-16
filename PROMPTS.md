## `2026/11/15-1200` — DevTools release notes and commit message

Summarize the complete current Git diff and every non-backup untracked file in a new subject-grouped `CHANGELOG.md` entry, add a user-facing DevTools release post to `/Users/ralph/Dropbox/Docs/cavalion.org/RELEASENOTES.md`, and return a matching grouped Git commit message with a lowercase `(categorized): summary` subject and verb-led bullets. This release combines the already documented lightweight Markdown Source toggle and focus-stable Alphaview tab styling; it introduces no additional runtime implementation.

## `2026/11/15` — Markdown-bronzichtbaarheid zonder navigatieherbouw

Voor [CVLN-20261025-1 - Editor-md render-performance](/Dropbox-cavalion/Issues/CVLN-20261025-1%20-%20Editor-md%20render-performance/) meldt de gebruiker dat het grote document `~/fs/Index/_star_/.md` traag is bij het tonen of verbergen van Source. De toggle verplaatst nu de bestaande top-level navigatie en ticks, zonder index- of menuherbouw; een blur door bronverberging forceert een pending previewrender niet langer onmiddellijk. De gewone inhoudsrender blijft de navigatie vernieuwen. De nieuwe toggletest, bestaande render-performancetest, overige devtools-tests, syntax- en diffcontroles slagen. De ongerelateerde Alphaview-exportmenutest faalt op de huidige werkboom (`Button.popup` tegenover `vcl/ui/PopupButton`); live acceptatie met het genoemde document is niet uitgevoerd.

## `2026/11/13` — Alphaview-tab blijft licht bij focus

Voor [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/) vraagt de gebruiker de rechtermarge tussen Terug en de tabs te halveren en de vrijgekomen 2 px links van Terug te gebruiken. De geselecteerde tab moet altijd de lichte achtergrond uit het eerste referentiebeeld behouden, ook met focus op de parent `Tabs` of de tab zelf. `Alphaview.js` zet de marges op links 4 px en rechts 2 px en geeft de geselecteerde tab onafhankelijk van focus de bestaande glassy-kleur `rgba(255,255,255,0.65)`. Bronsyntax, de gerichte filterbalktest en diffcontrole slagen; live browseracceptatie en build zijn niet uitgevoerd. Beide beelden zijn na expliciete toestemming eenmaal openbaar gearchiveerd en byte-identiek teruggelezen.

## `2026/11/13-1200` DevTools release notes and commit message

Summarize the complete current Git diff and every non-backup untracked file in a new subject-grouped `CHANGELOG.md` entry, add a user-facing DevTools release post to `/Users/ralph/Dropbox/Docs/cavalion.org/RELEASENOTES.md`, and return a matching grouped Git commit message with a lowercase `(categorized): summary` subject and verb-led bullets. This release aggregates the already documented Alphaview navigation, localization, cell inspection and export work, dropped shapefile handling and Markdown image navigation refinements; it introduces no additional runtime implementation.

<details>
<summary>Implementation details</summary>

- [CHANGELOG.md]() — adds the technical `2026/11/13` entry and explicitly covers every current untracked source and test file.
- [PROMPTS.md]() — records this release-documentation request once for repository-local provenance.
- `/Dropbox/Docs/cavalion.org/RELEASENOTES.md` — adds the user-facing DevTools release entry in the central document's established format.

Verification: scoped diff checks validate the edited repository documentation, and the release content is reconciled with `git status --short`, `git diff --stat`, the complete non-backup untracked-file list, implementation sources, tests and existing issue-backed repository notes. Per the release routine, no runtime tests, build, staging, commit, push, tag, publication or deployment are performed.

</details>

## `2026/11/13` — JSON-export gescheiden van CSV en gecombineerd menu

Voor [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/) is de al aanwezige ongecommitte JSON-export uit `Alphaview.csv.js` verplaatst naar de zelfstandige `Alphaview.json.js`. CSV en JSON dragen elk één actie en menukeuze bij aan de gedeelde exportpopup; `Alphaview.csv.json.js` registreert de gecombineerde URI `devtools/Alphaview.csv.json`. De basis gebruikt de werkelijke VCL-popupklassen en verbergt zijn knop zonder keuzes; beide exportspecialisaties activeren de bestaande Shift+Option+Cmd+S-actie. De gerichte regressie dekt gescheiden modules, gecombineerde keuzes, CSV-download en JSON-editor en -download. De Blocks-parser bevestigt de beide URI-klassen; syntax-, filterbalk-, dependency- en diffcontrole slagen. Live browseracceptatie en build zijn niet uitgevoerd. Root-namespace-alias en applicatiespecifieke subclassregistratie blijven buiten scope; bestaande `.csv`-aanroepen krijgen pas beide keuzes als hun aanroeper bewust `.csv.json` kiest. Overige ongecommitte wijzigingen blijven behouden.

## `2026/11/12` — Gedeelde Alphaview-navigatie en CSV-exportmenu

Voor [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/) toont de basis-Alphaview bij een verborgen filterbalk zonder opt-in Terug en Vernieuwen vóór de eerste gegevenstab, ook in Hover. Terug blijft zilverkleurig en disabled zonder geschiedenis; Vernieuwen volgt de bestaande actie en de zichtbaarheid van de barknop. Bij zichtbare balk verdwijnen beide tabknoppen. De basis heeft een gelokaliseerd exportmenu met Shift+Option+Cmd+S dat zonder keuzes verborgen en uitgeschakeld blijft; `Alphaview.csv.js` voegt één CSV-keuze toe en behoudt de bestaande exportlogica. De gerichte filterbalk-, export-, cel-, dependency- en Escapetests, syntax- en diffcontrole slagen. Browseracceptatie en build zijn niet uitgevoerd; de drie referentiebeelden zijn eenmaal openbaar gearchiveerd en na terugdownload byte-identiek gecontroleerd. De eerdere documentgebonden terugknop is verwante context in [VA-20261110-1-VO-Tabs-Document/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20261110-1-VO-Tabs-Document/:).

## `2026/11/12` — Alt/Option-dubbelklik inspecteert Alphaview-object

Voor [VA-20261110-1-VO-Tabs-Document/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20261110-1-VO-Tabs-Document/:) wacht de bestaande Alt/Option-celnavigatie 750 ms zodat een tweede klik haar kan annuleren. Alt/Option-dubbelklik op een objectcel inspecteert dezelfde uitgepakte waarde met `H.i` en navigeert niet; tabwissel annuleert een wachtende celklik. `alphaview-alt-cell.test.cjs` controleert enkelklik, dubbelklik, celwaarde en gewone dubbelklik; de bestaande filterbalktest, syntax- en diffcontrole slagen. Een herladen browserproef en build zijn niet uitgevoerd.

## `2026/11/12` — Terugknop bij verborgen Alphaview-filterbalk

Voor [VA-20261110-1-VO-Tabs-Document/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20261110-1-VO-Tabs-Document/:) gebruikt de gedeelde Alphaview bij opt-in een Terug-knop vóór de gegevenstabs wanneer de Filteren-bar verborgen is. De drie inzoomroutes behouden de barstand; de knop gebruikt de bestaande actie en blijft bij herbouw van de tabs beschikbaar. Zonder geschiedenis blijft de knop zichtbaar maar disabled en zilverkleurig, zodat de tabregel niet verspringt; bij een geopende bar verdwijnt hij. De actieve chevron erft ook bij hover de standaardkleur, de uitlijning blijft `text-bottom` en de tabaantallen tussen haakjes renderen op 70% van de tabtekstgrootte. Een wissel naar een andere gegevenstab herstelt altijd de toplijst, wist de drillgeschiedenis en geeft tijdelijke drilllijsten en hun databronnen vrij; de gebruiker verkoos dit boven geschiedenis per tab. De gerichte `alphaview-filter-bar.test.cjs`, bronsyntax en gerichte diffcontrole slagen; de gebruiker beoordeelde de CSS-uitlijning in de live weergave als goed, maar de definitieve bron is daarna niet afzonderlijk herladen en er is geen build uitgevoerd. Alle zeven beelden zijn met afzonderlijke toestemming eenmaal permanent gearchiveerd en na terugdownload byte-identiek geverifieerd.

## `2026/11/10` — Gedropte shapefiles met DBF en PRJ

Voor [VA-20261110-2-VO-GEO-shapefile/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20261110-2-VO-GEO-shapefile/:) behandelt DevTools een DBF-bestand als ruwe shapefile-bijlage in plaats van een SQLite-pakket. De SHP-route zoekt gelijknamige DBF- en PRJ-bestanden hoofdletterongevoelig, ook in een ZIP, en levert een geldige GeoJSON `FeatureCollection` met attributen en waar beschikbaar een EPSG-projectie. De gerichte drop-/ZIP-test, de bestaande redrop-test, bronsyntax en diffcontrole slagen. Een live proef met het bestand van de gebruiker staat open; geen build of serveruitrol voor dit onderwerp.

## `2026/11/02` Alphaview-teksten via locales

Controleer voor [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/) de volledige `src/cavalion-blocks/Alphaview.js` op vaste gebruikersgerichte teksten en laat zichtbare labels en statusformaten via Engelse en Nederlandse locales lopen. De bestaande codewijziging is nagezien; een aanvullende correctie normaliseert naamloze selecties vóór het tellen van dubbele namen. De gerichte test dekt Nederlandse statusregels, vertaalde selectienamen en naamconflicten. Alle twaalf devtools-tests, syntaxcontrole en gerichte diffcontrole slagen. Live browsercontrole staat nog open; op verzoek is geen build, commit, push of uitrol uitgevoerd.

## `2026/11/02` — Screenshotverwijzingen archiveren

Voor [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/) en [VA-20250316-1-Avallo-BRO-leveringen](/Dropbox-veldapps/Issues/VA-20250316-1-Avallo-BRO-leveringen/) verwijzen de bestaande schermafbeeldingen naar hun permanente GitHub-archiefkopie. De afbeeldingen zijn na upload op bereikbaarheid en identieke inhoud gecontroleerd; overige wijzigingen in deze repository blijven behouden.

## `2026/11/02-1010` Command-/ in door Markdown geopende Hover-Alphaview

Herstel voor [VA-20250316-1-Avallo-BRO-leveringen/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20250316-1-Avallo-BRO-leveringen/:) de Alphaview die vanuit Markdown via `Opdrachten.js` in een `Hover<>` wordt geïnstantieerd: Command-/ moet de filter-/navigatie-UI van de interne Alphaview tonen en focussen, niet proberen de host-Hover als Alphaview-root te muteren. De beginstand blijft contextafhankelijk: zichtbaar binnen `Hover<>` of `devtools/Workspace<>`, uitsluitend initieel verborgen buiten beide contexten.

<details>
<summary>Implementation details</summary>

- [src/cavalion-blocks/Alphaview.js]() laat `focus-q` altijd `this._owner` schakelen; `initializeFilterBar` gebruikt Hover of Workspace alleen om de initiële zichtbaarheid en focus te bepalen.
- [src/devtools/tests/alphaview-filter-bar.test.cjs]() verbiedt de Hover als mutatiedoel en dekt losse, Hover- en Workspace-hosting plus de bestaande focusgestuurde togglestanden.
- Syntaxcontrole, de gerichte regressietest, de volledige devtools-testsuite en diffcontrole slagen. Read-only inspectie van de open Avallo-issuepagina bevestigt de Markdown-geopende Alphaview met zichtbare lijst en ontbrekende balk in de oude instantie; de actieve tab is niet herladen. De screenshot is wegens ontbrekende toestemming voor externe openbaarmaking alleen lokaal in het governing issue bewaard.

</details>

## `2026/10/31` Afbeeldingen zichtbaar in Markdown-overzicht

Toon voor [CVLN-20261030-1 - Editor-md afbeeldingenoverzicht](/Dropbox-cavalion/Issues/CVLN-20261030-1%20-%20Editor-md%20afbeeldingenoverzicht/) de afbeeldingen zelf in de bestaande Hover, met labels en behoud van bronnavigatie. Relatieve afbeeldingspaden volgen de bestaande Markdown-preview. Bij een keuze schuift een zichtbare preview naar de juiste afbeelding, ook bij herhaalde bronnen; alle ingeklapte bovenliggende sectie- en mapniveaus worden daarbij van buiten naar binnen geopend. De broncursor beweegt mee zonder een verborgen editor te openen.

Verificatie: `node src/devtools/tests/markdown-images.test.cjs` en `node --check src/cavalion-blocks/MarkdownImages.js` slagen; de test dekt bovendien zichtbare en verborgen bron, zichtbare en verborgen preview, herhaalde afbeeldingen en meerdere ingeklapte bovenliggende niveaus; browseracceptatie is niet uitgevoerd. De meegeleverde screenshot is nog niet extern gearchiveerd.

## `2026/10/31-1308` DevTools release notes and commit message

Summarize the complete current Git diff and every non-backup untracked file in a new subject-grouped `CHANGELOG.md` entry, add a user-facing `-devtools` release post to `/Users/ralph/Dropbox/Docs/cavalion.org/RELEASENOTES.md`, and return a matching grouped Git commit message with a lowercase `(categorized): summary` subject and verb-led bullets. The release aggregates the already documented Alphaview interaction fixes, PouchDB attachment resources, Markdown image overview, regression tests and workspace update; it introduces no additional runtime implementation.

<details>
<summary>Implementation details</summary>

- [CHANGELOG.md]() — adds the technical `2026/10/31` entry and explicitly covers all current untracked source and test files.
- [PROMPTS.md]() — records this release-documentation request once for repository-local provenance.
- `/Dropbox/Docs/cavalion.org/RELEASENOTES.md` — adds the user-facing DevTools release entry in the central document's established format.

Verification: scoped diff checks validate the edited documentation, and the release content is reconciled with `git status --short`, `git diff --stat`, the complete non-backup untracked-file list, implementation sources, tests and existing repository notes. Per the release routine, no runtime tests, build, staging, commit, push, tag, publication or deployment are performed.

</details>

## `2026/10/30` Afbeeldingenoverzicht voor Markdown

Implementeer voor [CVLN-20261030-1 - Editor-md afbeeldingenoverzicht](/Dropbox-cavalion/Issues/CVLN-20261030-1%20-%20Editor-md%20afbeeldingenoverzicht/) een inschakelbare `Hover<>` met afbeeldingen uit de actieve Markdown-editor, bronpositienavigatie, contextmenu en Shift+Ctrl+Cmd+I. De view volgt wijzigingen en gebruikt de gevraagde standaardafmetingen ten opzichte van `#window`.

Verificatie: `markdown-images.test.cjs`, `markdown-render-performance.test.cjs`, `markdown-link-location.test.cjs`, `ace-lifecycle.test.cjs`, syntaxcontroles en gerichte diffcontrole slagen; daarnaast zijn inline, referentie-, HTML- en fenced-codevoorbeelden met de beschikbare Marked-lexer gecontroleerd. Een live proef bevestigt menu, actieve opmaak, beginpositie, navigatie en sluiten via de sneltoets. Permanente archivering van de contextmenuscreenshot staat open. `cavalion-pouch` is alleen als referentie onderzocht en niet inhoudelijk gewijzigd.

## `2026/10/29` — PouchDB-bijlagen als resources

Voor [VA-20261029-2-VO-Geografie-alle-meetpunten/](/Dropbox-veldapps/Issues/:/)[.md](/Dropbox-veldapps/Issues/VA-20261029-2-VO-Geografie-alle-meetpunten/:) registreert DevTools een aparte attachment-resource-URI en leest daarmee bijlagemetadata en bytes uit PouchDB. De gerichte providertest en syntaxcontrole slagen, evenals een bijlageophaling uit tijdelijke PouchDB met gesimuleerde IndexedDB; live browseracceptatie staat open. De twee screenshots zijn met toestemming permanent gearchiveerd en met HTTP 200 en identieke SHA-256-hash gecontroleerd.

## `2026/10/27-1055` Focusgestuurde Alpha View-filterbalk en compacte status

Corrigeer de actuele Alpha View-omgeving waarin Command-/ alleen het zoekveld focust en de balk nog niet correct verbergt of toont. Gewone embedded weergaven zoals GT Lab, waar `this.up("Hover<>:root")` vanaf Alpha View `null` oplevert, starten met verborgen filter-/navigatiebalk en een compacte live status rechtsonder in de zichtbare List. Command-/ toont en focust een verborgen balk, focust eerst een zichtbare maar nog niet gefocuste filterinvoer, en verbergt de balk pas wanneer die invoer al focus heeft; daarbij keert focus veilig terug naar de lijst. De eerste tab met uitsluitend het totaalaantal volgt dezelfde zichtbaarheid als de balk, terwijl de bestaande lettergrootte van dat aantal behouden blijft. Een developer-`Hover<>:root` start met zichtbare balk en filterfocus. Een live regressie waarbij List en ListBody verdwenen bleek veroorzaakt door `position:relative` op de interne VCL-Form, waardoor Form, List en ListBody 0×0 werden, plus een statuspil die als losse Form-sibling aan de tabhoek hing. Governing issue: [CVLN-20211007-1 - Alphaview](/Dropbox-cavalion/Issues/CVLN-20211007-1%20-%20Alphaview/).

<details>
<summary>Implementation details</summary>

- [src/cavalion-blocks/Alphaview.js]() bepaalt de begincontext tijdens load, laat de bestaande `focus-q`-actie focusgestuurd schakelen en koppelt de concrete `#bar`, `#compact-status` en gemarkeerde totaaltab aan één zichtbaarheidstoestand. De pil heeft `align: "none"`, wordt door de navigatieroutine aan de actieve List geparent en blijft daar absoluut rechtsonder; de VCL-root behoudt zijn oorspronkelijke absolute layout. Beide statuspresentaties delen één berekening, click-handler en updatepad.
- [src/devtools/tests/alphaview-filter-bar.test.cjs]() dekt de embedded `Hover<>:root === null`-context, developer-Hover, alle drie focus-/zichtbaarheidstoestanden, de meeschakelende totaaltab met ongewijzigde `<small>`-markup, zichtbare List en ListBody na iedere toggle, List-parenting, niet-deelnemen aan client alignment en live statusupdates.
- Syntaxcontrole, alle tests onder `src/devtools/tests/*.test.cjs` — inclusief `ace-lifecycle.test.cjs` via de aanwezige sibling `cavalion-vcl` — en repositorybrede diffcontrole slagen. Read-only inspectie van de open GT Lab-pagina bevestigde zowel de ontbrekende Hover/glassy-voorouder als de foutieve 0×0-afmetingen van Form, List en ListBody in de oude instantie. De source-served ontwikkelpagina vereist alleen een volledige Chrome hard reload (`Command-Shift-R`) om de gecachete blockfactory en bestaande Alpha View-instantie te vervangen; `app.js`/`lib.js` hoeven niet te worden gebouwd.

</details>

## `2026/10/26-2129` Escape mag Alphaview niet vernietigen

Herstel de gedeelde Alphaview-keyboardafhandeling zodat Escape de actieve filterinvoer nog mag wissen, maar nooit de Alphaview zelf vernietigt. Eén fysieke toetsdruk levert een `keydown` en `keyup`; behandel de filterreset daarom precies eenmaal en dek de volledige eventcyclus uitvoerbaar af.

<details>
<summary>Implementation details</summary>

- [src/cavalion-blocks/Alphaview.js]() verwijdert het verborgen dubbele-Escape-`destroy()`-pad en verwerkt de reset alleen tijdens `keydown`.
- [src/devtools/tests/alphaview-escape.test.cjs]() controleert filterreset, eventaantal en afwezigheid van lifecyclevernietiging.
- Syntaxcontrole, alle devtools-tests, legacy `js/minify` en diffcontrole slagen; live browseracceptatie blijft open.

</details>

<details>
<summary>Request and attachment</summary>

#### `2026/10/26-2129`

> In Tabs&lt;Document&gt; (meen ik) bestaat de bug dat wanneer er op Escape wordt gedrukt, de hele Alphaview verdwijnt. Fix dat ajb

![De Data-tab waarvan Alphaview na Escape zichtbaar moet blijven](https://raw.githubusercontent.com/relluf/screenshots/master/telegram/202611/20261102-task-CVLN-20211007-1_-_Alphaview-27d3f058ee68-codex-clipboard-72f6da2f-52d4-4ceb-be1a-1b2508e02be5.png)

</details>

## `2026/10/26-1916` Release notes and commit message for the current repository state

Summarize the complete current Git diff and every non-backup untracked file in a new, subject-grouped `CHANGELOG.md` entry that follows the repository's established file-reference style, then provide a matching grouped Git commit message whose lowercase subject uses `(categorized): summary` and whose bullets begin with active verbs. This is release aggregation across the already documented editor, Markdown, resource-provider, dropped-resource and Alphaview work; it introduces no additional runtime implementation or governing issue.

<details>
<summary>Implementation details</summary>

### Affected files

- [CHANGELOG.md]() — adds the `2026/10/26` release entry covering Markdown scheduling and source locations, remote resource monitoring and previous-version comparison, isolated dropped-resource generations, Alphaview dependency preloads, all regression tests and the remaining untracked development artifacts.
- [PROMPTS.md]() — records this release-documentation request once for repository-local provenance.

Verification: scoped `git diff --check -- CHANGELOG.md PROMPTS.md` validates the documentation changes; the entry is checked against `git status --short`, `git diff --stat`, the complete non-backup untracked-file list and the relevant source, tests and existing implementation notes. Repository-wide `git diff --check` still reports pre-existing trailing whitespace in `.md` and `src/devtools/Resources-node.js`. Runtime tests are not rerun because this request changes release/provenance documentation only.

</details>

## `2026/10/25-2035` `Editor<md>` renderperformance

Werk [CVLN-20261025-1 - Editor-md render-performance](/Dropbox-cavalion/Issues/CVLN-20261025-1%20-%20Editor-md%20render-performance/) uit: voorkom dat een pending previewrender midden in doorgaande toetsenbord- of cursornavigatie start, begrens de maximale staleness, meet parse-, DOM- en nabewerkingskosten afzonderlijk en implementeer alleen een lokale sectie-update wanneer de Markdown-context dat veilig maakt. Behoud previewscroll, actieve sectie, folds, cursorband, selectie en checkbox-/state-overlays; voeg regressiedekking en een representatieve grote benchmark toe en werk issue- en repositorydocumentatie bij.

<details>
<summary>Implementation details</summary>

### Affected files

- [src/devtools/MarkdownRenderScheduler.js]() — implementeert de 750-ms quiet period, 2,5-s maximum, interactie-uitstel en blur/expliciete flush.
- [src/devtools/MarkdownRenderSections.js]() — plant lokale top-level sectievervanging en forceert volledige fallback voor structurele of globale Markdown-context.
- [src/devtools/cavalion-md.js]() — instrumenteert parse, heading-index, DOM/layout en nabewerking, vervangt veilige secties lokaal en herstelt bestaande previewstate.
- [src/vcl-comps/Editor$/md.js]() — routeert Ace-wijzigingen naar de scheduler.
- [src/devtools/tests/markdown-render-performance.test.cjs]() — dekt quiet/max timing, cursoractiviteit na een edit, blur, veilige secties, structurele fallback en een gegenereerd document met 500 secties.
- [src/vcl-comps/Editor$/.md]() en [.md]() — leggen het duurzame contract, metingen, verificatie en resterende beperking vast.

Verificatie: alle tests onder `src/devtools/tests/*.test.cjs` en syntaxcontrole van de gewijzigde JavaScriptbestanden slagen; de issue-specifieke tracked hunks en nieuwe bestanden zijn vrij van whitespace-errors. In een volledig herladen lokale Cavalion-pagina mat het bestaande issue circa 41 ms voor een volledige render. Een fixture van 213.399 tekens en 480 previewsecties mat 245,5 ms warm en 1.848,4 ms koud met expliciete layoutmeting; de koude uitsplitsing was 450,1 ms parse, 191,8 ms index, 135,5 ms DOM/layout en 1.066,9 ms nabewerking. De browserrender behield 480 secties, checkboxen, cursorband en selectielaag zonder runtimefouten. De lokale route blijft bewust documentbreed parsen en bouwt de top-level navigatie nog documentbreed opnieuw op; de besparing zit in de live-DOMvervanging en sectielokale nabewerking.

</details>

<details>
<summary>Request</summary>

#### `2026/10/25-2035`

Diagnoseer en verbeter de responsiveness van `Editor<md>` bij grote documenten met een interactiebewuste, maximaal begrensde scheduler; meet de renderfasen, onderzoek en implementeer een veilige lokale sectie-update met volledige fallback, behoud alle editor- en previewstate, voeg regressietests toe en verifieer met representatieve grote Markdown-inhoud.

</details>

## `2026/10/21-0255` Sporadische Alphaview-modulefout

Onderzoek de sporadische RequireJS-exceptie tijdens het herstellen van geneste toetsingsdocumenten: `vcl/data/Array has not been loaded yet for context: _`, gevolgd door ontbrekende `blocks/Factory!Alphaview<...>`-varianten. De oorzaak was dat [Alphaview](src/cavalion-blocks/:.js) zes modules synchroon gebruikt, maar slechts drie daarvan in zijn `use`-preloadregel declareerde. Voeg `vcl/ui/List`, `vcl/data/Array` en `vcl/Control` aan die declaratie toe, zodat koude en lazy instantiatie niet meer afhankelijk zijn van toevallige eerdere views. Borg automatisch dat iedere statische synchrone `require(...)` van Alphaview vooraf gedeclareerd blijft.

<details>
<summary>Implementation details</summary>

### Affected files

- [src/cavalion-blocks/Alphaview.js]() — declareert alle tijdens evaluatie synchroon vereiste modules.
- [src/devtools/tests/alphaview-dependencies.test.cjs]() — vergelijkt de `use`-preloadlijst uitvoerbaar met iedere statische `require(...)`.
- [.md]() en [PROMPTS.md]() — documenteren oorzaak, cascade, verificatie en de niet-beschikbare screenshotroute.

Verificatie: `node src/devtools/tests/alphaview-dependencies.test.cjs`, `node --check src/devtools/tests/alphaview-dependencies.test.cjs`, legacy `js/minify` van Alphaview en `git diff --check` slagen. Een geïsoleerde volledige Chrome-reload van de lokale T13-documentroute bouwde de SIKB-facet, **Data**-tab en Alphaview-tabel correct op; het tijdelijke tabblad is daarna gesloten. De aangeleverde screenshot kon niet via de voorgeschreven Devbot-route worden gearchiveerd omdat die route niet callable beschikbaar was; er is geen lokale bijlage ingebed.

</details>

## `2026/10/20-1326` Herhaald droppen levert afzonderlijke resourceversies op

Maak herhaald slepen van hetzelfde gewijzigde bestand of dezelfde map vanuit Finder of Explorer betrouwbaar. Iedere drop- of file-pickerhandeling is nu een geïsoleerde generatie, zodat oude en nieuwe inhoud niet worden samengevoegd en een uit de nieuwe map verwijderde file niet stale aanwezig blijft. Gelijknamige top-level resources krijgen sessielokaal en deterministisch de zichtbare suffix ` (2)`, ` (3)` enzovoort, vóór een bestandsextensie, en een overeenkomstige unieke naamgebaseerde `dropped://`-URI. De oorspronkelijke naam en versie-informatie blijven als metadata beschikbaar. Nummering reset na een reload; Markdown-resolver- en linkcode zijn bewust niet gewijzigd.

<details>
<summary>Implementation details</summary>

### Affected files

- [src/devtools/Resources-ddh.js]() — isoleert vanaf [de generatieregistratie](src/devtools/Resources-ddh.js:222) iedere invoerhandeling, publiceert haar top-level resources onder unieke versienamen en draagt bron- en versiemetadata door in `list()` en `get()`.
- [src/devtools/tests/resources-ddh-redrop.test.cjs]() — dekt vanaf [de dubbele-maptest](src/devtools/tests/resources-ddh-redrop.test.cjs:66) de OS-drop, file-pickerroute, twee blijvend afzonderlijke inhoudsversies, afwezigheid van een verwijderd bestand en `test (2).js`-naamgeving.
- [.md]() — documenteert het gerealiseerde sessiecontract en de verificatie.
- [PROMPTS.md]() — registreert de opdracht en het resultaat.

Verificatie: alle tests onder `src/devtools/tests/*.test.cjs`, `node --check src/devtools/Resources-ddh.js` en `node --check src/devtools/tests/resources-ddh-redrop.test.cjs` slagen. Een live browserproef in Veldoffice valt buiten deze repositorywijziging.

</details>

<details>
<summary>Requests and attachments</summary>

#### `2026/10/20-1326`

Maak het mogelijk hetzelfde gewijzigde bestand of dezelfde map na sluiten opnieuw vanuit Finder of Explorer op de pagina te slepen. Voorkom stale Resources-inhoud en onderscheid opeenvolgende versies als eerste, tweede enzovoort. Resources hoeven bij het sluiten van de UI-node niet te worden verwijderd. Gebruik bij naamconflicten zichtbare suffixen als ` (2)` en ` (3)`, neem die vanzelf op in de unieke resource-URI, reset de nummering na reload en wijzig hiervoor geen Markdown-resolver- of linkcode.

</details>

## `2026/10/19-1648` Serverwijzigingen in de actieve editor detecteren

De generieke Editor bewaakt nu uitsluitend de zichtbare, geselecteerde tab: direct bij activering en daarna iedere vijf seconden vergelijkt hij een lichte, provider-specifieke serverrevision. Het onderzochte contract toont aan dat de filesystemserver een uit `mtime` afgeleide `revision` aanbiedt, PouchDB `_rev`, Dropbox `rev`, GitHub blob-`sha` en Google Drive versionmetadata; providers zonder lichte metadatafunctie vallen terug op de bestaande resource-read en filesystempolls omzeilen expliciet de HTTP-cache. Een afwijkende revision vraagt altijd via de applicatieconfirm om toestemming en waarschuwt bij lokale wijzigingen expliciet voor gegevensverlies. Weigeren behoudt de lokale inhoud en onderdrukt dezelfde melding totdat een nieuwere revision verschijnt. Requests en dialogen worden gecoalescet, timers stoppen bij de expliciete Form-deactivatie of destroy, succesvolle reloads en saves actualiseren de baseline en identieke fouten worden niet iedere vijf seconden opnieuw gelogd. De live fouten bleken lifecycle-integratieproblemen: `Editor<md>` vervangt `#ace.onLoad`, een tabwissel levert niet betrouwbaar een show/hide-event en een achtergrondvenster kan timers vertragen. Installatie gebeurt daarom op het editorformulier, start/stopt via `Form.onActivate/onDeactivate` én volgt browserfocus en `document.visibilityState`. Blur/hidden pauzeert; focus/visible controleert direct; de revisionrequest zelf is beschermd tegen vertraagde achtergrondtimers; gelijktijdige focus- en visibility-events worden samengevoegd en destroy verwijdert de listeners. Een verborgen Markdown-bronpaneel blijft zo correct bewaakt. Vlak vóór een bevestigde reload bewaart de tab één tijdelijke `previous known version`; alleen dan verschijnt `Diff with Previous Version`, dat via de bestaande `Hover<>`-infrastructuur twee read-only Ace-panelen naast elkaar opent met duidelijke revision-/tijdlabels, semantische markering en gekoppeld scrollen. Een volgende bevestigde reload vervangt de snapshot en tab-destroy ruimt hem op. Dit contentmechanisme wijzigt de bestaande `Open Revisions`-statehistorie niet. Naast de gerichte regressies is het filesystempad live in Chrome tegen tijdelijke fixturebestanden bewezen: lokaal typen gaf geen melding, een eigen save actualiseerde stil de baseline, een actieve externe wijziging meldde binnen de lopende vijfsecondencyclus, een inactieve tab bleef stil en heractivatie meldde binnen 396 ms. Een afzonderlijke native twee-windowproef doorliep daarna de volledige A-save → B-prompt/reload → B-save → A-prompt/reload-cyclus met directe melding na iedere voorgrondwissel. De source-runtime laadde aantoonbaar de actuele AMD-modules; een volledige paginareload was nodig om bestaande editorinstanties te vervangen, maar geen `app.js`/`lib.js`-rebuild. De fixturebestanden zijn na de proeven uit de repository naar `/private/tmp` verplaatst.

<details>
<summary>Implementation details</summary>

### Affected files

- [src/devtools/RemoteResourceMonitor.js]() — implementeert op [regel 37](src/devtools/RemoteResourceMonitor.js:37) requestdeduplicatie, revisionvergelijking, confirm/reload en foutcoalescing en beheert op [regel 69](src/devtools/RemoteResourceMonitor.js:69) activatie en timer-cleanup.
- [src/devtools/Resources.js]() — kiest op [regel 105](src/devtools/Resources.js:105) aantoonbare revisionvelden en routeert op [regel 121](src/devtools/Resources.js:121) lichte providerchecks met een compatibiliteitsfallback.
- [src/devtools/Resources-node.js](), [src/devtools/Resources-pouchdb.js](), [src/devtools/Resources-dropbox.js](), [src/devtools/Resources-gdrive.js]() en [src/devtools/Resources-gitrepo.js]() — leveren provider-specifieke metadatarevisions zonder standaard de bestandsinhoud te downloaden; de filesystemcheck gebruikt `cache: "no-store"`.
- [src/devtools/PreviousVersion.js]() — beheert op [regel 7](src/devtools/PreviousVersion.js:7) de ene tijdelijke contentsnapshot en bouwt op [regel 24](src/devtools/PreviousVersion.js:24) de strikt geordende previous/current-weergave.
- [src/cavalion-blocks/PreviousVersionDiff.js]() — realiseert vanaf [regel 20](src/cavalion-blocks/PreviousVersionDiff.js:20) de side-by-side Hover met twee read-only Ace-editors, wijzigingsmarkering en gesynchroniseerd scrollen.
- [src/vcl-comps/Editor.js]() — installeert de monitor op het editorformulier en koppelt hem aan Form- én browserdocument-lifecycle, onafhankelijk van specializer-Ace-hooks; reload en save werken tevens de remote baseline bij en een bevestigde reload bewaart de pre-reloadinhoud.
- [src/devtools/tests/remote-resource-monitor.test.cjs]() — dekt ongewijzigd, remote gewijzigd met bevestigen of weigeren, dirty lokaal, activatie, vijfsecondentimer, cleanup en requestdeduplicatie.
- [src/devtools/tests/editor-remote-monitor-integration.test.cjs]() — borgt installatie buiten `#ace.onLoad`, late activering, Form-deactivatie, blur/hidden-pauze, directe gecoalesceerde foregroundcheck, achtergrondguard, listenercleanup en cachevrije filesystemmetadata.
- [src/devtools/tests/previous-version.test.cjs]() — dekt snapshot lifecycle, menuvisibility, oud/nieuw-volgorde, herhaalde reloads, read-only side-by-sideweergave en cleanup.
- [src/devtools/tests/ace-lifecycle.test.cjs]() — houdt de bestaande geïsoleerde Ace-lifecycletest compatibel met de monitorintegratie.
- [README.md]() en [src/vcl-comps/Editor$/.md]() — documenteren het duurzame gedrag en de ontwerpkeuzes.
- [PROMPTS.md]() — registreert deze uitgevoerde prompt en verificatie.

Verificatie: `node src/devtools/tests/editor-remote-monitor-integration.test.cjs`, `node src/devtools/tests/remote-resource-monitor.test.cjs`, `node src/devtools/tests/previous-version.test.cjs`, `node src/devtools/tests/ace-lifecycle.test.cjs`, `node src/devtools/tests/markdown-link-location.test.cjs` en `node --check` voor de gewijzigde JavaScriptmodules slagen. De eerste tijdelijke Chrome-/filesystemfixture doorliep bovendien de vier gevraagde scenario's en is recoverable naar `/private/tmp/cavalion-devtools-remote-revision-fixture-20261019.txt` verplaatst. De tweede fixture bewees met native Chrome-voorgrondwissels de volledige A→B→A-cyclus en staat recoverable in `/private/tmp/cavalion-devtools-remote-revision-two-window-fixture-20261019.txt`.

</details>

<details>
<summary>Requests and attachments</summary>

#### `2026/10/19-1648`

Implementeer generieke serverwijzigingsdetectie voor uitsluitend de actieve DevTools-editortab: controleer onmiddellijk en iedere vijf seconden een bewezen lichte resourceversion, vraag altijd vóór reload, bescherm dirty lokale inhoud expliciet, dedupliceer requests en meldingen, ruim timers bij tabwissel of destroy op, actualiseer de revision na reload en save en voorkom foutspam. Onderzoek eerst de juiste laag en bestaande Resource- en dialoogcontracten, zorg dat onder meer een actieve `AGENTS.md` snel reageert, voeg controleerbare tests toe en werk de onderwerp-entry in `PROMPTS.md` bij met relevante codeplaatsen, verificatie en beperkingen.

#### `2026/10/19-1651` Previous known version en diff

Houd `Open Revisions` voor editor-/UI-state ongewijzigd. Bewaar vóór iedere bewust bevestigde remote reload uitsluitend in het geheugen de volledige huidige editorinhoud met revision als `previous known version`, vervang deze pas bij de volgende bevestigde reload en ruim hem op bij tab-destroy. Voeg alleen wanneer de snapshot bestaat een chevronmenuactie `Diff with Previous Version` toe. Onderzoek bestaande diffvoorzieningen en geef de voorkeur aan een side-by-sideweergave.

#### `2026/10/19-1651` Hover-UX

Open de side-by-side diff bij voorkeur niet-destructief in een bestaande `Hover<>`, met links previous en rechts current, duidelijke labels, leesbare/scrollbare inhoud en correcte cleanup. Val alleen bij aantoonbaar omvangrijke ontbrekende infrastructuur terug op een unified `.diff`-document.

#### `2026/10/19-1713` Live browserreproductie en lifecycleherstel

Reproduceer de ontbrekende poll en confirm end-to-end in de draaiende Cavalion DevTools met uitsluitend een nieuw geïsoleerd fixturebestand. Bewijs lokaal typen zonder melding, een eigen save met bijgewerkte baseline, actieve externe wijziging binnen vijf seconden en een wijziging tijdens inactiviteit met directe melding bij heractivatie. Controleer de werkelijk geladen module/build, runtime-start, revisionvergelijking, HTTP-cache en mtimegedrag, herstel de concrete integratieoorzaak, voeg waar haalbaar regressiedekking toe, werk dezelfde onderwerp-entry bij en ruim de fixture recoverable op zonder bestaande resources te wijzigen.

#### `2026/10/19-1728` Twee-windowfocus en achtergrondtimers

Reproduceer de scherpere A→B→A-volgorde met twee echte browservensters: na een save in A moet B vragen, waarna een save in B bij terugkeer naar A eveneens direct moet vragen. Behandel browserfocus en documentvisibility als primaire oorzaak: pauzeer op blur/hidden, controleer onmiddellijk en hervat op focus/visible, voeg een guard tegen vertraagde achtergrondtimers toe, dedupliceer samenvallende lifecycle-events en ruim listeners op. Controleer revisionnormalisatie nog wel, voeg regressiedekking voor de twee-windowsemantiek toe en gebruik uitsluitend een veilig tijdelijk fixturebestand.

</details>

## `2026/10/19-1513` Markdown-links openen bestanden op regel en kolom

De lokale Markdown-linkresolver ondersteunt nu de gangbare `pad/bestand.js:123`-vorm en optioneel `:regel:kolom`, zonder de bestaande description-substitutie voor `:`, `:.js`, VCL-wrappers, dynamische targets en numerieke padsegmenten te breken. De parser houdt bronpositie en resource-URI gescheiden; de bestaande workspace-openactie activeert een nieuwe of reeds geopende tab en Ace begrenst, centreert en focust de gevraagde positie nadat eventuele opgeslagen editorstate is hersteld. `%3A` is de expliciete spelling voor een letterlijke dubbele punt. De regressietest dekt parsergevallen, regels buiten het document, ongeldige posities en zowel ladende als bestaande editors.

<details>
<summary>Implementation details</summary>

### Affected files

- [src/devtools/MarkdownLinkLocation.js]() — parseert en formatteert lokale regel-/kolomsuffixen en beschermt letterlijke dubbele punten.
- [src/devtools/EditorPosition.js]() — draagt posities over naar Ace, begrenst ze en ondersteunt ladende en reeds geopende tabs.
- [src/devtools/cavalion-md.js]() — verwerkt locatiegegevens vóór description-substitutie en geeft ze los van de URI door.
- [src/vcl-comps/Workspace.js]() — routeert positiegegevens via de bestaande `#editor-needed`-actie.
- [src/vcl-comps/Editor.js]() — past een wachtende positie toe na resource- en state-loading.
- [src/devtools/tests/markdown-link-location.test.cjs]() — dekt grammatica en editorpositie-overdracht.
- [src/devtools/tests/ace-lifecycle.test.cjs]() — houdt de bestaande lifecycle-test compatibel met de positie-integratie.
- [README.md]() en [src/vcl-comps/Editor$/.md]() — documenteren de syntax en het gerealiseerde gedrag.

Verificatie: `node src/devtools/tests/markdown-link-location.test.cjs`, `node src/devtools/tests/ace-lifecycle.test.cjs` en syntaxcontroles met `node --check` slagen.

</details>

<details>
<summary>Requests and attachments</summary>

#### `2026/10/19-1511`

Onderzoek de huidige Markdown-linkgrammatica en ontwerp een leesbare, achterwaarts compatibele regel-/kolomnotatie. Behoud de custom description-substitutie, VCL-wrappers, relatieve en absolute targets, dynamische backtickevaluatie en open-file-integratie; maak de gangbare `pad/bestand.js:123`-vorm bij voorkeur canoniek en voer nog geen brede migratie uit zonder de risico's vast te leggen.

#### `2026/10/19-1512` Verduidelijking numerieke suffix

Herken uitsluitend een terminale onontsnapte `:<integer>` en eventueel `:<regel>:<kolom>` als locatie. `:.js` blijft description-substitutie en `:/<integer>` blijft substitutie met een letterlijk numeriek padsegment.

#### `2026/10/19-1513` Implementatie en navigatie

Implementeer de gekozen syntax volledig: open de passende bestaande of nieuwe editor, activeer de tab, spring naar het ééngebaseerde regelnummer, onthul of centreer de regel en plaats caret en focus daar. Houd de locatie buiten de resource-URI en voeg regressiedekking toe voor parser, overdracht, ongeldige of te hoge regels en reeds geopende bestanden.

</details>

### `2026/10/08-0814` — Laat Markdown-folders alleen via de chevron in- en uitklappen

> In devtools/Editor<md>:
> Maak het zo dat <li>-elementen die folders voorstellen, oftewel een link als content hebben die in een / eindigt, in/uitklapbaar zijn, net zoals de #-secties dat al zijn. De status dient ook gepersist te worden.
>
> Zorg ervoor dat het in/uitklappen van folders enkel werkt als daadwerkelijk op de chevron wordt geklikt, niet daarbuiten

### `2026/10/04-1133` — Oriënteer ticks aan de rechterkant naar binnen

> Aan de rechterkant van de pagina dienen de ticks andersom georienteerd te zijn

![Referentieafbeelding voor rechter tick-oriëntatie](https://raw.githubusercontent.com/relluf/screenshots/master/codex/202610/20261004-1133-cavalion-devtools-right-tick-orientation.png)

### `2026/10/03-1531` — Lijn in links-view uitlijnen met pointer

> Zorg ervoor dat de gele regel op dezelfde hoogte wordt getoond als de muispointer, indien mogelijk
>
> Laat links-view iets eerder verschijnen, 60% van de huidige delay ajb

![Referentieafbeelding voor uitlijning met pointer](https://raw.githubusercontent.com/relluf/screenshots/master/codex/202610/20261003-1531-cavalion-devtools-tick-pointer-alignment.png)

### `2026/10/01-2136` — Gebruik de taal van de prompt voor prompttitels

> Pas de desbetreffende AGENTS.md dusdanig aan, zodat de titels van de entries in PROMPTS.md in deze taal worden gezet als de prompt zelf. In het voorbeeld zoals in (afb1) zouden de titels dus in het Nederlands moeten zijn.

![Referentieafbeelding voor prompttalen](https://raw.githubusercontent.com/relluf/screenshots/master/codex/202610/20261001-2136-cavalion-devtools-prompt-title-language.png)

### `2026/10/01-2132` — Houd tick-hover doorlopend over de rail

> Laat de cursor altijd pointer zijn zolang deze boven de ticks (container) hovert, nu wisselt ie steeds, dat is onrustig. Of, beter, maak het zo dat er altijd een tick gehoverd (en dus gegroeid) wordt. Nu kan de pointer tussen de ticks inzitten alsof ie er niet over beweegt, maar dat voelt raar, dus laat geen echte ruimte tussen de ticks, alhoewel er visueel niets dient te veranderen

### `2026/10/01-2127` — Beperk tick-hovermarkering tot tekstkleur

> Terugkomend op het "geel oplichten" in "Als er wordt gehoverd over ticks terwijl links-view al zichtbaar is, laat dan het desbetreffende item in links-view in beeld scrollen en geel oplichten."
>
> Pas enkel de css-property color van het element aan, niet background of border

### `2026/10/01-2123` — Deel screenshotarchiefinstellingen met de Telegram-devbot

> Eigenlijk zou de telegram-devbot ook dezelfde instellingen moeten gebruiken, want het token verloopt regelmatig.
>
> Pas de desbetreffende AGENTS.md aan: Posts/Entries in PROMPTS.md moeten ook de tijd als -HHMM suffixen aan de datum

### `2026/10/01` — Configureer Codex-screenshotarchivering

> Ok, maak dat in orde, neem meteen de werkende gegevens over van de telegram-devbot ajb

### `2026/10/01` — Tick-hover markeert het bijbehorende links-viewitem

> Als er wordt gehoverd over ticks terwijl links-view al zichtbaar is, laat dan het desbetreffende item in links-view in beeld scrollen en geel oplichten.

![Referentieafbeelding voor tick-hover](https://raw.githubusercontent.com/relluf/screenshots/master/codex/202610/20261001-cavalion-devtools-tick-links-view.png)

### `2026/10/01` — Promptlogconventie

> Neem op in de AGENTS.md van ~/fs/Workspaces dat wanneer Codex een prompt uitvoert, dat er dan ook een nieuwe top-entry in een PROMPTS.md wordt geschreven. Er is maar 1 PROMPTS.md per repo, gelijk de CHANGELOG.md en README.md documenten.
>
> Hierin wordt de Codex prompt opgenomen, wellicht herschreven voor duidelijkheid indien verzocht. Als de prompt afbeeldingen bevat, dienen deze te worden geupload naar Github. De afbeeldingen dienen te worden geupload naar Github, net zoals de veldapps-telegram-devbot dat doet (zie /Users/ralph/fs/Workspaces/veldapps.com/veldapps-telegram-devbot).
