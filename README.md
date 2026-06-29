# Poppate - native calendar fixed

## Fix applicati

- Ripristinato calendario nativo `input type="date"`.
- Rimosso calendario custom.
- I campi data sono veri input nativi visibili e cliccabili, non overlay nascosti.
- Rimossa la linea nera in basso: il toast nascosto ora è completamente fuori schermo e trasparente.
- Tolto il controllo `APP_ORIGIN` dagli endpoint per evitare falsi `Failed to fetch` da configurazione origine errata.
- Il giorno selezionato funziona anche se è fuori dalla settimana scelta: l'app carica sia il giorno selezionato sia l'intervallo settimana.

## Date

Gli input nativi mostrano la data secondo la lingua/locale del dispositivo. Su Android/iOS impostati in italiano, vengono visualizzate come `gg/mm/aaaa`.

## Failed to fetch / Backend non raggiungibile

In preview locale o sandbox è normale: non esistono `/api/feeds`, `/api/settings` e il binding D1.

Funziona dopo deploy Cloudflare Pages con:

- Functions attive
- D1 binding `DB`
- `schema.sql` eseguito

## Setup D1

```bash
npx wrangler d1 create poppate-db
npx wrangler d1 execute poppate-db --file=./schema.sql
```

Cloudflare Pages:

- Framework preset: None
- Build command: vuoto
- Output directory: `/`

D1 binding:

- Binding name: `DB`
- Database: `poppate-db`


## Date sempre in formato EU

Il calendario è nativo del dispositivo/browser, ma il valore mostrato nell'app non è quello interno del browser.
L'app mostra sempre le date in formato:

gg/mm/aaaa

Esempio: 29/06/2026
