document.addEventListener('DOMContentLoaded', function () {

    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa2250Iqnyg358ogD1odZS3PzzWKzdNTPrmWdylXhQnNjcbfBbJtuV4pMMENNOPaO15kbXNEVi9vFJ/pub?gid=1064475752&single=true&output=csv';

    const container   = document.getElementById('ristoranti-container');
    const loadingEl   = document.getElementById('loading-state');
    const emptyEl     = document.getElementById('empty-state');
    const statsEl     = document.getElementById('stats-text');
    const sortSelect  = document.getElementById('sort-select');

    let ristoranti  = [];
    let tutteRighe  = [];

    // ── Carica CSV ──────────────────────────────────────────
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function (result) {
            tutteRighe = result.data.filter(r => r['Ristorante'] && r['Ristorante'].trim() !== '');
            ristoranti = raggruppaPerRistorante(tutteRighe);
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
                mappa[nome] = { nome: nome, recensioni: [], totaleVoti: 0, conteggioVoti: 0, ultimaData: null };
            }

            mappa[nome].recensioni.push(r);

            if (!isNaN(voto) && voto >= 1 && voto <= 5) {
                mappa[nome].totaleVoti += voto;
                mappa[nome].conteggioVoti++;
            }

            const dataRaw = r['Informazioni cronologiche'] || Object.values(r)[0] || '';
            const dataTs  = parseTimestamp(dataRaw);
            if (dataTs && (!mappa[nome].ultimaData || dataTs > mappa[nome].ultimaData)) {
                mappa[nome].ultimaData = dataTs;
            }
        });

        return Object.values(mappa).map(function (r) {
            r.media = r.conteggioVoti > 0 ? (r.totaleVoti / r.conteggioVoti) : 0;
            return r;
        });
    }

    // ── Ordina ───────────────────────────────────────────────
    function ordinaRistoranti(lista, criterio) {
        return [...lista].sort(function (a, b) {
            if (criterio === 'media')   return b.media - a.media;
            if (criterio === 'numero')  return b.recensioni.length - a.recensioni.length;
            if (criterio === 'nome')    return a.nome.localeCompare(b.nome, 'it');
            if (criterio === 'recente') return (b.ultimaData || 0) - (a.ultimaData || 0);
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

        if (lista.length === 0) { emptyEl.style.display = 'block'; return; }
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
        const stellePiene = Math.round(r.media);
        const stelleVuote = 5 - stellePiene;

        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        r.recensioni.forEach(function (rec) {
            const v = parseInt(rec['Valutazione']);
            if (v >= 1 && v <= 5) dist[v]++;
        });
        const maxDist = Math.max(...Object.values(dist), 1);

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

        const recensioniOrdinate = [...r.recensioni].sort(function (a, b) {
            const da = parseTimestamp(a['Informazioni cronologiche'] || Object.values(a)[0] || '');
            const db = parseTimestamp(b['Informazioni cronologiche'] || Object.values(b)[0] || '');
            return (db || 0) - (da || 0);
        });

        const recensioniHTML = recensioniOrdinate.map(function (rec) {
            const nome    = rec['Nome'] || 'Anonimo';
            const email   = (rec['Email Address'] || '').trim(); // chiave univoca
            const voto    = parseInt(rec['Valutazione']) || 0;
            const testo   = rec['Recensione'] || '';
            const dataRaw = rec['Informazioni cronologiche'] || Object.values(rec)[0] || '';
            const dataFmt = formatDate(dataRaw);
            const initials = getInitials(nome);
            const stelle  = '★'.repeat(Math.min(voto, 5));

            return `
                <div class="recensione-item">
                    <div class="recensione-top">
                        <div class="recensore-wrap">
                            <div class="avatar">${esc(initials)}</div>
                            <div class="recensore-info-text">
                                <span class="recensore-nome recensore-link"
                                      data-email="${esc(email)}"
                                      data-nome="${esc(nome)}">${esc(nome)}</span>
                                ${dataFmt ? `<span class="recensione-data">${esc(dataFmt)}</span>` : ''}
                            </div>
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
            <div class="recensioni-panel">${recensioniHTML}</div>`;

        const header = card.querySelector('.ristorante-header');
        const panel  = card.querySelector('.recensioni-panel');
        const toggle = card.querySelector('.toggle-btn');
        header.addEventListener('click', function () {
            const aperto = panel.classList.toggle('aperto');
            toggle.classList.toggle('aperto', aperto);
            header.setAttribute('aria-expanded', aperto);
        });

        card.querySelectorAll('.recensore-link').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                apriProfiloRecensore(
                    el.getAttribute('data-email'),
                    el.getAttribute('data-nome')
                );
            });
        });

        return card;
    }

    // ── Profilo recensore — raggruppato per email ────────────
    function apriProfiloRecensore(email, nomeFallback) {
        const sue = tutteRighe.filter(function (r) {
            const e = (r['Email Address'] || '').trim();
            // Se l'email è disponibile usa quella, altrimenti ricade sul nome
            return email ? e === email : (r['Nome'] || 'Anonimo') === nomeFallback;
        }).sort(function (a, b) {
            const da = parseTimestamp(a['Informazioni cronologiche'] || Object.values(a)[0] || '');
            const db = parseTimestamp(b['Informazioni cronologiche'] || Object.values(b)[0] || '');
            return (db || 0) - (da || 0);
        });

        // Nome da mostrare: il più recente non-vuoto
        const nomeDisplay = sue.map(r => r['Nome']).find(n => n && n.trim()) || nomeFallback || 'Anonimo';
        const initials    = getInitials(nomeDisplay);

        const voti = sue.map(r => parseInt(r['Valutazione'])).filter(v => !isNaN(v) && v >= 1 && v <= 5);
        const mediaPersonale = voti.length > 0 ? (voti.reduce((a, b) => a + b, 0) / voti.length) : 0;

        const recensioniHTML = sue.map(function (rec) {
            const voto    = parseInt(rec['Valutazione']) || 0;
            const testo   = rec['Recensione'] || '';
            const rist    = rec['Ristorante'] || '';
            const dataRaw = rec['Informazioni cronologiche'] || Object.values(rec)[0] || '';
            const dataFmt = formatDate(dataRaw);
            const stelle  = '★'.repeat(Math.min(voto, 5));
            const vuote   = '★'.repeat(5 - Math.min(voto, 5));

            return `
                <div class="recensione-item profilo-rec-item">
                    <div class="profilo-rec-header">
                        <span class="profilo-ristorante-nome">${esc(rist)}</span>
                        <div class="profilo-rec-meta">
                            ${stelle ? `<span class="recensione-stelle"><span style="color:var(--gold)">${stelle}</span><span style="color:var(--border)">${vuote}</span></span>` : ''}
                            ${dataFmt ? `<span class="recensione-data">${esc(dataFmt)}</span>` : ''}
                        </div>
                    </div>
                    ${testo ? `<p class="recensione-testo">"${esc(testo)}"</p>` : ''}
                </div>`;
        }).join('');

        const overlay = document.createElement('div');
        overlay.className = 'profilo-overlay';
        overlay.innerHTML = `
            <div class="profilo-modal">
                <button class="profilo-close" aria-label="Chiudi">✕</button>
                <div class="profilo-top">
                    <div class="profilo-avatar">${esc(initials)}</div>
                    <div class="profilo-info">
                        <h2 class="profilo-nome">${esc(nomeDisplay)}</h2>
                        <div class="profilo-stats">
                            <span>${sue.length} recension${sue.length === 1 ? 'e' : 'i'}</span>
                            ${mediaPersonale > 0 ? `<span class="meta-dot">·</span><span>media ${mediaPersonale.toFixed(1)} <span style="color:var(--gold)">★</span></span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="profilo-list">${recensioniHTML}</div>
            </div>`;

        document.body.appendChild(overlay);
        requestAnimationFrame(function () { overlay.classList.add('aperto'); });

        overlay.querySelector('.profilo-close').addEventListener('click', function () { chiudiProfilo(overlay); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) chiudiProfilo(overlay); });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') { chiudiProfilo(overlay); document.removeEventListener('keydown', escHandler); }
        });
    }

    function chiudiProfilo(overlay) {
        overlay.classList.remove('aperto');
        overlay.addEventListener('transitionend', function () { overlay.remove(); }, { once: true });
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

    function parseTimestamp(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        try {
            const datePart = dateStr.split(' ')[0];
            const [day, month, year] = datePart.split('/');
            const d = new Date(year, month - 1, day);
            return isNaN(d.getTime()) ? null : d.getTime();
        } catch (e) { return null; }
    }

    function formatDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return '';
        try {
            const datePart = dateStr.split(' ')[0];
            const [day, month, year] = datePart.split('/');
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) { return dateStr; }
    }
});