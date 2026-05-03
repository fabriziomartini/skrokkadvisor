document.addEventListener('DOMContentLoaded', function () {

    const googleFormCSVUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa2250Iqnyg358ogD1odZS3PzzWKzdNTPrmWdylXhQnNjcbfBbJtuV4pMMENNOPaO15kbXNEVi9vFJ/pub?gid=1064475752&single=true&output=csv';

    const recensioniContainer = document.getElementById('recensioni-container');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const statsBar = document.getElementById('recensioni-count');
    const filterButtons = document.querySelectorAll('.filter-tag');

    let allRecensioni = [];
    let filtroStelle = 0; // 0 = tutte

    // --- Carica recensioni dal CSV ---
    function caricaRecensioni() {
        Papa.parse(googleFormCSVUrl, {
            download: true,
            header: true,
            complete: function (result) {
                allRecensioni = result.data.filter(r => r['Ristorante'] && r['Ristorante'].trim() !== '');
                loadingState.style.display = 'none';
                mostraRecensioni(allRecensioni);
            },
            error: function () {
                loadingState.innerHTML = '<p style="color:#8A7A5A">Errore nel caricamento. Riprova più tardi.</p>';
            }
        });
    }

    // --- Genera iniziali per avatar ---
    function getInitials(nome) {
        if (!nome) return '?';
        const parts = nome.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return nome.substring(0, 2).toUpperCase();
    }

    // --- Genera stelle HTML ---
    function getStelle(valutazione) {
        const n = parseInt(valutazione);
        if (isNaN(n) || n < 1) return '';
        return '★'.repeat(Math.min(n, 5));
    }

    // --- Crea una card recensione ---
    function creaCard(recensione, index) {
        const nome = recensione['Nome'] || 'Anonimo';
        const ristorante = recensione['Ristorante'] || '—';
        const valutazione = parseInt(recensione['Valutazione']) || 0;
        const testo = recensione['Recensione'] || '';
        const stelle = getStelle(valutazione);
        const initials = getInitials(nome);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 60}ms`;

        card.innerHTML = `
            <div class="card-accent"></div>
            <div class="card-header">
                <div class="restaurant-name">${escapeHTML(ristorante)}</div>
                ${stelle ? `<div class="stars">${stelle}</div>` : ''}
            </div>
            <div class="reviewer-row">
                <div class="avatar">${escapeHTML(initials)}</div>
                <span class="reviewer-name">${escapeHTML(nome)}</span>
            </div>
            ${testo ? `<div class="card-divider"></div><p class="review-text">"${escapeHTML(testo)}"</p>` : ''}
        `;

        return card;
    }

    // --- Mostra recensioni (con filtro attivo) ---
    function mostraRecensioni(recensioni) {
        recensioniContainer.innerHTML = '';

        const filtered = filtroStelle === 0
            ? recensioni
            : recensioni.filter(r => parseInt(r['Valutazione']) === filtroStelle);

        // Aggiorna contatore
        statsBar.textContent = `${filtered.length} recension${filtered.length === 1 ? 'e' : 'i'}`;

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(function (recensione, index) {
            const card = creaCard(recensione, index);
            recensioniContainer.appendChild(card);
        });
    }

    // --- Filtri per stelle ---
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroStelle = parseInt(btn.dataset.stars) || 0;
            mostraRecensioni(allRecensioni);
        });
    });

    // --- Utility: escape HTML per sicurezza ---
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- Avvia ---
    caricaRecensioni();
});
