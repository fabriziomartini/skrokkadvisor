document.addEventListener('DOMContentLoaded', function () {
    // URL del tuo modulo Google Forms
    const googleFormCSVUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa2250Iqnyg358ogD1odZS3PzzWKzdNTPrmWdylXhQnNjcbfBbJtuV4pMMENNOPaO15kbXNEVi9vFJ/pub?gid=1064475752&single=true&output=csv';

    // Container per le recensioni
    const recensioniContainer = document.getElementById('recensioni-container');

    // Funzione per caricare e visualizzare le recensioni
    function caricaRecensioni() {
        Papa.parse(googleFormCSVUrl, {
            download: true,
            header: true,
            complete: function (result) {
                const recensioni = result.data;
                mostraRecensioni(recensioni);
            }
        });
    }

    // Funzione per mostrare le recensioni nel container
    function mostraRecensioni(recensioni) {
        recensioniContainer.innerHTML = '';

        recensioni.forEach(function (recensione) {
            console.log(recensione);

            const valutazione = parseInt(recensione['Valutazione']);
            let stelleHTML = '';

            if (!isNaN(valutazione)) {
                // Mostra il numero corretto di stelle in base alla valutazione
                for (let i = 1; i <= valutazione; i++) {
                    stelleHTML += '★'; // Carattere stella unicode
                }
            }
        const nomeRecensore = recensione['Nome'];
        const nomeHTML = nomeRecensore ? `<p><strong>Nome:</strong> ${nomeRecensore}</p>` : '';
            const recensioneHTML = `
                <div class="recensione">
                    ${nomeHTML}
                    <p><strong>Nome del ristorante:</strong> ${recensione['Ristorante']}</p>
                    <p><strong>Valutazione:</strong>  ${stelleHTML}</p>
                    <p><strong>Recensione:</strong> ${recensione['Recensione']}</p>
                    <hr>
                </div>
            `;

            recensioniContainer.innerHTML += recensioneHTML;
        });
    }

    // Carica le recensioni al caricamento della pagina
    caricaRecensioni();
});
