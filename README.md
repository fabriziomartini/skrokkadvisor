# Skrokkadvisor

La guida definitiva alle cene scroccate: recensioni autentiche, esperienze vere, consigli dal campo.

🔗 [skrokkadvisor.it](https://fabriziomartini.github.io/skrokkadvisor/)

## Come funziona

Skrokkadvisor è una pagina statica che mostra le recensioni delle cene "scroccate", raggruppate per ristorante/ospite, con media voti, distribuzione delle valutazioni e possibilità di ordinamento.

- Le recensioni vengono raccolte tramite un [Google Form](https://forms.gle/H1vMaxYNfjZg5fGw5)
- Le risposte confluiscono in un Google Sheet pubblicato come CSV
- La pagina scarica il CSV a runtime (via [PapaParse](https://www.papaparse.com/)) e renderizza le card dei ristoranti direttamente nel browser, senza backend

## Struttura del progetto

```
index.html    Markup della pagina
styles.css    Stile e layout
script.js     Fetch/parsing del CSV, raggruppamento, ordinamento, rendering delle card
robots.txt    Direttive per i crawler
sitemap.xml   Sitemap per i motori di ricerca
```

## Sviluppo locale

Non ci sono dipendenze o build step: basta aprire `index.html` in un browser, oppure servire la cartella con un server statico qualsiasi, ad esempio:

```bash
python3 -m http.server
```

## Deploy

Il sito è pubblicato tramite GitHub Pages a partire dal branch `main`.
