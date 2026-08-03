/* ============================================================
   lista.js — Lista de informes, búsqueda, filtros y papelera
   ============================================================ */

async function renderFichasList() {
    const fichas = await loadFichas();
    const vivas = fichasVivas(fichas);
    const cont = $('#informesList');

    let lista = vivas.slice();
    const filtro = App.currentFilter;
    if (filtro === 'hoy') lista = lista.filter(f => esDeHoy(f.fechaCreacion));
    else if (filtro !== 'all') lista = lista.filter(f => (f.semaforo || '').toLowerCase() === filtro);

    const q = (App.currentSearch || '').trim().toLowerCase();
    if (q) {
        lista = lista.filter(f =>
            String(f.sector || '').toLowerCase().includes(q) ||
            String(f.calle || '').toLowerCase().includes(q) ||
            String(f.nombreAfectado || '').toLowerCase().includes(q) ||
            String(f.tipoEmergencia || '').toLowerCase().includes(q) ||
            String(f.registroNum || '').includes(q)
        );
    }

    lista.sort((a, b) => (b.fechaCreacion || 0) - (a.fechaCreacion || 0));

    $('#emptyMsg').hidden = lista.length > 0;

    cont.innerHTML = lista.map(f => {
        const sem = (f.semaforo || '').toLowerCase();
        const estado = estadoControl(f);
        return `
        <article class="ficha-card" data-id="${escapeHtml(f.id)}" tabindex="0" role="button" aria-label="Ver informe ${f.registroNum}">
            <div class="ficha-spine spine-${sem || 'none'}"></div>
            <div class="ficha-body">
                <div class="ficha-top">
                    <span class="mono reg-num">#${escapeHtml(String(f.registroNum || ''))}</span>
                    <span class="estado-pill estado-${estado.clase}">${estado.label}</span>
                </div>
                <h3>${escapeHtml(f.tipoEmergencia || 'Sin tipo')}</h3>
                <p class="ficha-meta">
                    ${f.sector ? `<span class="ficha-sector">${escapeHtml(f.sector)}</span>` : ''}
                    ${f.calle ? `<span>${escapeHtml(f.calle)}</span>` : ''}
                </p>
                ${f.fechaVisita ? `<p class="ficha-fecha">Visita: ${escapeHtml(f.fechaVisita)}</p>` : ''}
                ${(f.imagenesAntes || []).length ? `<p class="ficha-fecha">${f.imagenesAntes.length} foto(s)</p>` : ''}
            </div>
            <div class="ficha-disc disc-${sem || 'none'}" aria-hidden="true"></div>
        </article>`;
    }).join('');

    $$('.ficha-card').forEach(card => {
        const abrir = () => viewFicha(card.dataset.id);
        card.addEventListener('click', abrir);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
        });
    });
}

async function mostrarPapelera() {
    const fichas = await loadFichas();
    const pap = fichasPapelera(fichas);
    const cont = $('#papeleraList');
    $('#papeleraEmpty').hidden = pap.length > 0;

    cont.innerHTML = pap.map(f => `
        <article class="ficha-card papelera-card" data-id="${escapeHtml(f.id)}">
            <div class="ficha-body">
                <div class="ficha-top">
                    <span class="mono reg-num">#${escapeHtml(String(f.registroNum || ''))}</span>
                    <span class="muted-text">Borrado ${fechasHora(f.fechaEliminacion)}</span>
                </div>
                <h3>${escapeHtml(f.tipoEmergencia || 'Sin tipo')}</h3>
                <p class="ficha-meta">${f.sector ? escapeHtml(f.sector) : ''} ${f.calle ? '· ' + escapeHtml(f.calle) : ''}</p>
                <div class="papelera-actions">
                    <button class="btn btn-ghost btn-sm" data-restore="${escapeHtml(f.id)}">Restaurar</button>
                    <button class="btn btn-danger btn-sm" data-purge="${escapeHtml(f.id)}">Eliminar definitivamente</button>
                </div>
            </div>
        </article>`).join('');

    $$('[data-restore]').forEach(b => {
        b.addEventListener('click', async () => {
            await restaurarFicha(b.dataset.restore);
            showToast('Informe restaurado');
            actualizarPapeleraCount();
            mostrarPapelera();
            renderFichasList();
        });
    });
    $$('[data-purge]').forEach(b => {
        b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar definitivamente este informe? Esta acción no se puede deshacer.')) return;
            await purgarFicha(b.dataset.purge);
            showToast('Informe eliminado definitivamente');
            actualizarPapeleraCount();
            mostrarPapelera();
        });
    });
}

async function actualizarPapeleraCount() {
    const fichas = await loadFichas();
    const n = fichasPapelera(fichas).length;
    const badge = $('#papeleraCount');
    badge.hidden = n === 0;
    badge.textContent = n;
}

/* ---------- Estado de control documental ---------- */
const CONTROL_REQUERIDOS = [
    { campo: 'sectorialPersona', label: 'Persona encargada de la sectorial' },
    { campo: 'profesionalCargo', label: 'Profesional a cargo' },
    { campo: 'derivadoPor', label: 'Derivado por' },
    { campo: 'prioridad', label: 'Prioridad' },
    { campo: 'fechaDerivacion', label: 'Fecha de derivación' },
    { campo: 'fechaVisita', label: 'Fecha de visita' },
    { campo: 'fechaEntrega', label: 'Fecha de entrega' },
    { campo: 'ubicacionGeo', label: 'Ubicación' },
    { campo: 'codigoSeguimiento', label: 'Código de seguimiento' }
];
const ESTADO_LABELS = { pendiente: 'Pendiente', listo: 'Listo', generado: 'Generado' };

function getFaltantesControl(f) {
    return CONTROL_REQUERIDOS.filter(c => !f[c.campo]);
}

function estadoControl(f) {
    if (f.fechaEliminacion) return { clase: 'papelera', label: 'Papelera' };
    if (f.fechaGeneracion) return { clase: 'generado', label: 'Generado' };
    return getFaltantesControl(f).length ? { clase: 'pendiente', label: 'Pendiente' } : { clase: 'listo', label: 'Listo' };
}
