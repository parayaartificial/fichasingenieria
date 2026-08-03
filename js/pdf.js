/* ============================================================
   pdf.js — Vista de ficha, render del informe y exportación PDF
   ============================================================ */

async function viewFicha(id) {
    const fichas = await loadFichas();
    const f = fichas.find(x => x.id === id);
    if (!f) return;
    App.currentFichaId = id;
    showView('ficha');

    const estado = estadoControl(f);
    $('#vistaEstado').innerHTML = `<span class="estado-pill estado-${estado.clase}">${estado.label}</span>`;

    renderPdfContent(f);
    if (App.currentView === 'lista') renderFichasList();
}

async function volverALista() {
    await renderFichasList();
    showView('lista');
}

async function editarFichaActual() {
    const fichas = await loadFichas();
    const f = fichas.find(x => x.id === App.currentFichaId);
    if (f) showForm(f, false);
}

async function duplicarFichaActual() {
    const fichas = await loadFichas();
    const f = fichas.find(x => x.id === App.currentFichaId);
    if (!f) return;
    const copia = { ...f, id: generateId(), registroNum: null, fechaCreacion: Date.now(), fechaModificacion: Date.now() };
    delete copia.fechaGeneracion;
    delete copia.fechaEliminacion;
    await guardarFicha(copia);
    showToast('Informe duplicado');
    renderFichasList();
    showForm(copia, false);
}

async function borrarFichaActual() {
    if (!confirm('¿Mover este informe a la papelera?')) return;
    await eliminarFichaSoft(App.currentFichaId);
    showToast('Informe movido a la papelera');
    actualizarPapeleraCount();
    volverALista();
}

/* ---------- Render del informe (vista previa = PDF) ---------- */
function renderPdfContent(f) {
    const sem = (f.semaforo || '').toLowerCase();
    const semLabel = sem ? sem.charAt(0).toUpperCase() + sem.slice(1) : '';
    const fichasCampos = (titulo, arr) => (arr && arr.length) ? `
        <div class="pdf-sec">
            <h4>${titulo}</h4>
            <ul class="pdf-list">${arr.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>` : '';

    const fotos = (titulo, arr) => (arr && arr.length) ? `
        <div class="pdf-sec">
            <h4>${titulo}</h4>
            <div class="pdf-fotos">${arr.map(im => `<img src="${im.dataUrl}" alt="${escapeHtml(im.name || 'foto')}">`).join('')}</div>
        </div>` : '';

    const filaControl = (label, valor) => valor ? `
        <div class="pdf-fila"><span>${label}</span><strong>${escapeHtml(String(valor))}</strong></div>` : '';

    const rojo = sem === 'rojo';
    const reporte = f.reporteConcluyente || '';

    $('#pdfContent').innerHTML = `
        <div class="pdf-sheet">
            <header class="pdf-header">
                <div class="pdf-brand">
                    <img src="Logo.png" alt="" class="pdf-logo">
                    <div>
                        <h2>Informe Visita Emergencia</h2>
                        <p>Dirección de Ingeniería Municipal de Concepción</p>
                    </div>
                </div>
                <div class="pdf-semaforo">
                    <span class="pdf-disc disc-${sem || 'none'}"></span>
                    <span>${semLabel || ''}</span>
                </div>
            </header>

            <div class="pdf-grid">
                <div class="pdf-sec">
                    <h4>Datos de la emergencia</h4>
                    <div class="pdf-fila"><span>N° de registro</span><strong class="mono">${escapeHtml(String(f.registroNum || ''))}</strong></div>
                    <div class="pdf-fila"><span>Tipo</span><strong>${escapeHtml(f.tipoEmergencia || '')}</strong></div>
                    <div class="pdf-fila"><span>Fecha de visita</span><strong>${escapeHtml(f.fechaVisita || '')}</strong></div>
                </div>
                <div class="pdf-sec">
                    <h4>Control documental</h4>
                    ${filaControl('Código de seguimiento', f.codigoSeguimiento)}
                    ${filaControl('Sectorial', f.sectorial)}
                    ${filaControl('Persona encargada', f.sectorialPersona)}
                    ${filaControl('Profesional a cargo', f.profesionalCargo)}
                    ${filaControl('Derivado por', f.derivadoPor)}
                    ${filaControl('Prioridad', f.prioridad ? f.prioridad.charAt(0).toUpperCase() + f.prioridad.slice(1) : '')}
                    ${filaControl('Fecha derivación', f.fechaDerivacion)}
                    ${filaControl('Fecha entrega', f.fechaEntrega)}
                    ${filaControl('Ubicación', f.ubicacionGeo)}
                </div>
            </div>

            <div class="pdf-sec">
                <h4>Ubicación</h4>
                <div class="pdf-fila"><span>Sector</span><strong>${escapeHtml(f.sector || '')}</strong></div>
                <div class="pdf-fila"><span>Calle</span><strong>${escapeHtml(f.calle || '')}</strong></div>
                ${f.ubicacionGeo ? `<div class="pdf-fila"><span>Mapa</span><strong>${mapsUrl(f.ubicacionGeo)}</strong></div>` : ''}
            </div>

            <div class="pdf-sec">
                <h4>Datos personales</h4>
                <div class="pdf-fila"><span>Nombre afectado</span><strong>${escapeHtml(f.nombreAfectado || '')}</strong></div>
                <div class="pdf-fila"><span>Teléfono</span><strong>${escapeHtml(f.fono || '')}</strong></div>
                ${rojo ? `
                <div class="pdf-fila"><span>RUT</span><strong>${escapeHtml(f.rut || '')}</strong></div>
                <div class="pdf-fila"><span>Visita realizada con</span><strong>${escapeHtml(f.visitaCon || '')}</strong></div>` : ''}
            </div>

            <div class="pdf-sec">
                <h4>Reporte concluyente</h4>
                <div class="pdf-checks">
                    <label><input type="checkbox" ${reporte === 'HABITABLE' ? 'checked' : ''} disabled> Habitable</label>
                    <label><input type="checkbox" ${reporte === 'HABITABLE CON TRABAJOS DE MITIGACION' ? 'checked' : ''} disabled> Habitable con trabajos de mitigación</label>
                    <label><input type="checkbox" ${reporte === 'INHABITABLE. EVACUAR, NO RECUPERABLE' ? 'checked' : ''} disabled> Inhabitable, evacuar, no recuperable</label>
                </div>
                ${f.conclusion ? `<p class="pdf-text">${escapeHtml(f.conclusion)}</p>` : ''}
            </div>

            <div class="pdf-sec">
                <h4>Descripción</h4>
                <p class="pdf-text">${escapeHtml(f.descripcion || '')}</p>
            </div>

            ${fichasCampos('Causas', f.causas)}
            ${fichasCampos('Peligrosidad', f.peligrosidad)}
            ${!rojo ? fichasCampos('Recomendaciones', f.recomendaciones) : ''}
            ${fotos('Evidencia fotográfica (antes)', f.imagenesAntes)}
            ${fotos('Evidencia fotográfica (después)', f.imagenesDespues)}

            <div class="pdf-sec">
                <h4>Firmas</h4>
                <div class="pdf-firmas">
                    <div class="pdf-firma">
                        <div class="firma-linea"></div>
                        <strong>${escapeHtml(f.sectorialPersona || '')}</strong>
                        <span>Sectorial · ${escapeHtml(f.sectorial || '')}</span>
                        ${f.sectorialCorreo ? `<span class="mono">${escapeHtml(f.sectorialCorreo)}</span>` : ''}
                    </div>
                    <div class="pdf-firma">
                        <div class="firma-linea"></div>
                        <strong>${escapeHtml(f.profesionalCargo || '')}</strong>
                        <span>Profesional a cargo</span>
                    </div>
                    <div class="pdf-firma">
                        <div class="firma-linea"></div>
                        <strong>${escapeHtml(f.derivadoPor || '')}</strong>
                        <span>Profesional en terreno</span>
                    </div>
                </div>
            </div>
        </div>`;
}

function mapsUrl(ubicacion) {
    if (!ubicacion) return '';
    if (/^https?:\/\//i.test(ubicacion)) {
        return `<a href="${ubicacion}" target="_blank" rel="noopener">${escapeHtml(ubicacion)}</a>`;
    }
    return escapeHtml(ubicacion);
}

/* ---------- Export PDF ---------- */
function generatePdfFilename() {
    const fichas = fichasVivas(App.fichas || []);
    const d = new Date();
    const hoy = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    let correlativo = 1;
    fichas.forEach(f => {
        const m = /^Informe_Emergencia_\d{8}(\d{2})\.pdf$/.exec(f.pdfFilename || '');
        if (m) {
            const n = parseInt(m[1], 10);
            if (f.fechaCreacion && esDeHoy(f.fechaCreacion) && n >= correlativo) correlativo = n + 1;
        }
    });
    return `Informe_Emergencia_${hoy}${String(correlativo).padStart(2, '0')}.pdf`;
}

async function exportPdf() {
    const f = (App.fichas || []).find(x => x.id === App.currentFichaId);
    if (!f) return;
    const faltantes = getFaltantesControl(f);
    if (faltantes.length) {
        showToast('Faltan datos de control documental para generar el PDF', 'error');
        return;
    }
    if (typeof html2pdf === 'undefined') {
        showToast('La librería de PDF no cargó. Revisa tu conexión a internet.', 'error');
        return;
    }
    const el = $('#pdfContent');
    if (!el || !el.innerHTML) { showToast('No hay contenido para exportar', 'error'); return; }

    const opt = {
        margin: [10, 10, 10, 10],
        filename: generatePdfFilename(),
        image: { type: 'jpeg', quality: 0.8 },
        html2canvas: { scale: 1.5, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    showToast('Generando PDF...');
    await html2pdf().set(opt).from(el).save();
    f.fechaGeneracion = Date.now();
    await guardarFicha(f);
    renderFichasList();
    if (App.currentView === 'ficha') viewFicha(f.id);
    showToast('PDF generado');
}
