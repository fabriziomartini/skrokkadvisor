document.addEventListener('DOMContentLoaded', function () {

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa2250Iqnyg358ogD1odZS3PzzWKzdNTPrmWdylXhQnNjcbfBbJtuV4pMMENNOPaO15kbXNEVi9vFJ/pub?gid=1064475752&single=true&output=csv';

    const container   = document.getElementById('ristoranti-container');
    const loadingEl   = document.getElementById('loading-state');
    const emptyEl     = document.getElementById('empty-state');
    const statsEl     = document.getElementById('stats-text');
    const sortSelect  = document.getElementById('sort-select');

    let ristoranti = []; // array di oggetti raggruppati

    // ── Carica CSV ──────────────────────────────────────────
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function (result) {
            const righe = result.data.filter(r => r['Ristorante'] && r['Ristorante'].trim() !== '');
            ristoranti = raggruppaPerRistorante(righe);
            loadingEl.style.display = 'none';
            renderRistoranti();
        },
        error: function () {
            loadingEl.innerHTML = '<p style="color:var(--muted)">Errore nel caricamento. Riprova più tardi.</p>';
        }
    });

    // ── Raggruppa recensioni per nome ristorante ─────────────
    function raggruppaPerRistorante(righe) {
        const mappa = {};

        righe.forEach(function (r) {
            const nome = r['Ristorante'].trim();
            const voto = parseInt(r['Valutazione']);

            if (!mappa[nome]) {
                mappa[nome] = { nome: nome, recensioni: [], totaleVoti: 0, conteggioVoti: 0 };
            }

            mappa[nome].recensioni.push(r);

            if (!isNaN(voto) && voto >= 1 && voto <= 5) {
                mappa[nome].totaleVoti += voto;
                mappa[nome].conteggioVoti++;
            }
        });

        return Object.values(mappa).map(function (r) {
            r.media = r.conteggioVoti > 0
                ? (r.totaleVoti / r.conteggioVoti)
                : 0;
            return r;
        });
    }

    // ── Ordina ───────────────────────────────────────────────
    function ordinaRistoranti(lista, criterio) {
        return [...lista].sort(function (a, b) {
            if (criterio === 'media')  return b.media - a.media;
            if (criterio === 'numero') return b.recensioni.length - a.recensioni.length;
            if (criterio === 'nome')   return a.nome.localeCompare(b.nome, 'it');
            return 0;
        });
    }

    // ── Render lista ristoranti ──────────────────────────────
    function renderRistoranti() {
        container.innerHTML = '';

        const criterio = sortSelect.value;
        const lista    = ordinaRistoranti(ristoranti, criterio);

        const totaleRecensioni = lista.reduce((acc, r) => acc + r.recensioni.length, 0);
        statsEl.textContent = `${lista.length} ristoran${lista.length === 1 ? 'te' : 'ti'} · ${totaleRecensioni} recension${totaleRecensioni === 1 ? 'e' : 'i'}`;

        if (lista.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }
        emptyEl.style.display = 'none';

        lista.forEach(function (r, index) {
            const card = creaCardRistorante(r, index + 1);
            card.style.animationDelay = `${index * 60}ms`;
            container.appendChild(card);
        });
    }

    // ── Crea card ristorante ─────────────────────────────────
    function creaCardRistorante(r, rank) {
        const card = document.createElement('div');
        card.className = 'ristorante-card';

        const mediaArrotondata = Math.round(r.media * 10) / 10;
        const stellePiene  = Math.round(r.media);
        const stelleVuote  = 5 - stellePiene;

        // Distribuzione stelle
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        r.recensioni.forEach(function (rec) {
            const v = parseInt(rec['Valutazione']);
            if (v >= 1 && v <= 5) dist[v]++;
        });
        const maxDist = Math.max(...Object.values(dist), 1);

        // Barre distribuzione
        let barreHTML = '';
        for (let s = 5; s >= 1; s--) {
            const pct = Math.round((dist[s] / maxDist) * 100);
            barreHTML += `
                <div class="rating-row">
                    <span class="rating-row-label">${'★'.repeat(s)}</span>
                    <div class="rating-bar-track">
                        <div class="rating-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <span class="rating-row-count">${dist[s]}</span>
                </div>`;
        }

        // Recensioni nel pannello
        const recensioniHTML = r.recensioni.map(function (rec) {
            const nome     = rec['Nome'] || 'Anonimo';
            const voto     = parseInt(rec['Valutazione']) || 0;
            const testo    = rec['Recensione'] || '';
            const initials = getInitials(nome);
            const stelle   = '★'.repeat(Math.min(voto, 5));

            return `
                <div class="recensione-item">
                    <div class="recensione-top">
                        <div class="recensore-wrap">
                            <div class="avatar">${esc(initials)}</div>
                            <span class="recensore-nome">${esc(nome)}</span>
                        </div>
                        ${stelle ? `<span class="recensione-stelle">${stelle}</span>` : ''}
                    </div>
                    ${testo ? `<p class="recensione-testo">"${esc(testo)}"</p>` : ''}
                </div>`;
        }).join('');

        card.innerHTML = `
            <div class="ristorante-header" role="button" aria-expanded="false">
                <div class="ristorante-rank">${rank}</div>
                <div class="ristorante-info">
                    <div class="ristorante-nome">${esc(r.nome)}</div>
                    <div class="ristorante-meta">
                        <div class="stelle-media">
                            <span class="stelle-icone">${'★'.repeat(stellePiene)}<span class="stelle-vuote">${'★'.repeat(stelleVuote)}</span></span>
                            <span class="media-numero">${mediaArrotondata.toFixed(1)}</span>
                        </div>
                        <span class="meta-dot">·</span>
                        <span class="numero-recensioni">${r.recensioni.length} recension${r.recensioni.length === 1 ? 'e' : 'i'}</span>
                    </div>
                </div>
                <button class="toggle-btn" aria-label="Espandi recensioni">▼</button>
            </div>
            <div class="rating-bar-wrap">${barreHTML}</div>
            <div class="recensioni-divider"></div>
            <div class="recensioni-panel">
                ${recensioniHTML}
            </div>`;

        // Toggle espandi/chiudi
        const header  = card.querySelector('.ristorante-header');
        const panel   = card.querySelector('.recensioni-panel');
        const toggle  = card.querySelector('.toggle-btn');

        header.addEventListener('click', function () {
            const aperto = panel.classList.toggle('aperto');
            toggle.classList.toggle('aperto', aperto);
            header.setAttribute('aria-expanded', aperto);
        });

        return card;
    }

    // ── Sort change ──────────────────────────────────────────
    sortSelect.addEventListener('change', renderRistoranti);

    // ── Utils ────────────────────────────────────────────────
    function getInitials(nome) {
        if (!nome) return '?';
        const parts = nome.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : nome.substring(0, 2).toUpperCase();
    }

    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
});