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
