/* ============================================================
   dashboard.js — Panel general con KPIs y distribución
   ============================================================ */

async function renderDashboard() {
    const fichas = await loadFichas();
    const vivas = fichasVivas(fichas);

    const contar = color => vivas.filter(f => (f.semaforo || '').toLowerCase() === color).length;
    const verde = contar('verde'), amarillo = contar('amarillo'), rojo = contar('rojo');
    const total = vivas.length;

    const hoy = vivas.filter(f => esDeHoy(f.fechaCreacion)).length;
    const generados = vivas.filter(f => !!f.fechaGeneracion).length;

    const pct = c => total ? Math.round((c / total) * 100) : 0;

    const ordenadas = vivas.slice().sort((a, b) => (b.fechaCreacion || 0) - (a.fechaCreacion || 0)).slice(0, 5);

    const ultimos = ordenadas.length ? `
        <div class="card">
            <h3>Últimos informes</h3>
            <div class="ultimos-list">
                ${ordenadas.map(f => `
                    <button class="ultimo-item" data-id="${escapeHtml(f.id)}">
                        <span class="disc disc-mini disc-${escapeHtml((f.semaforo || '').toLowerCase() || 'none')}"></span>
                        <span class="ultimo-txt">
                            <strong>#${escapeHtml(String(f.registroNum || ''))} · ${escapeHtml(f.tipoEmergencia || 'Sin tipo')}</strong>
                            <small>${escapeHtml(f.sector || '')} ${f.calle ? '· ' + escapeHtml(f.calle) : ''}</small>
                        </span>
                        <span class="muted-text mono">${fechas(f.fechaCreacion)}</span>
                    </button>`).join('')}
            </div>
        </div>` : '';

    const empty = !total ? `
        <div class="card empty-dash">
            <div class="empty-disc">&#127959;</div>
            <h3>Empieza a registrar informes</h3>
            <p>Presiona <strong>+ Nuevo informe</strong> y sigue los pasos del formulario.</p>
        </div>` : '';

    $('#dashboardContainer').innerHTML = `
        <div class="kpi-grid">
            <div class="kpi">
                <span class="kpi-num">${total}</span>
                <span class="kpi-label">Informes totales</span>
            </div>
            <div class="kpi">
                <span class="kpi-num kpi-verde">${verde}</span>
                <span class="kpi-label">Verde · riesgo bajo</span>
            </div>
            <div class="kpi">
                <span class="kpi-num kpi-amarillo">${amarillo}</span>
                <span class="kpi-label">Amarillo · riesgo medio</span>
            </div>
            <div class="kpi">
                <span class="kpi-num kpi-rojo">${rojo}</span>
                <span class="kpi-label">Rojo · riesgo alto</span>
            </div>
            <div class="kpi kpi-sub">
                <span class="kpi-num">${hoy}</span>
                <span class="kpi-label">Creados hoy</span>
            </div>
            <div class="kpi kpi-sub">
                <span class="kpi-num">${generados}</span>
                <span class="kpi-label">Con informe PDF</span>
            </div>
        </div>
        <div class="dash-grid">
            ${total ? `
            <div class="card donut-card">
                <h3>Distribución por riesgo</h3>
                <div class="donut-wrap">
                    <svg class="donut" viewBox="0 0 120 120" role="img" aria-label="Distribución por nivel de riesgo">
                        <circle class="donut-track" cx="60" cy="60" r="48" />
                        <circle class="donut-seg donut-verde" cx="60" cy="60" r="48"
                            stroke-dasharray="${pct(verde)} 100" stroke-dashoffset="25" />
                        <circle class="donut-seg donut-amarillo" cx="60" cy="60" r="48"
                            stroke-dasharray="${pct(amarillo)} 100" stroke-dashoffset="${25 - pct(verde)}" />
                        <circle class="donut-seg donut-rojo" cx="60" cy="60" r="48"
                            stroke-dasharray="${pct(rojo)} 100" stroke-dashoffset="${25 - pct(verde) - pct(amarillo)}" />
                    </svg>
                    <div class="donut-center"><strong>${total}</strong><small>total</small></div>
                </div>
                <div class="donut-legend">
                    <span><i class="dot dot-verde"></i>Verde ${pct(verde)}%</span>
                    <span><i class="dot dot-amarillo"></i>Amarillo ${pct(amarillo)}%</span>
                    <span><i class="dot dot-rojo"></i>Rojo ${pct(rojo)}%</span>
                </div>
            </div>` : ''}
            ${ultimos}
        </div>
        ${empty}`;

    $$('.ultimo-item').forEach(b => {
        b.addEventListener('click', () => viewFicha(b.dataset.id));
    });
}
