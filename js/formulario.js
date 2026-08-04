/* ============================================================
   formulario.js — Asistente de creación/edición por pasos
   ============================================================ */

const TOTAL_STEPS = 8;

function initForm() {
    const stepper = $('#formSectionsNav');
    const secciones = [
        'Emergencia', 'Ubicación', 'Afectado', 'Diagnóstico',
        'Causas y medidas', 'Evidencia', 'Control documental', 'Revisar'
    ];
    stepper.innerHTML = secciones.map((s, i) =>
        `<button type="button" class="step-chip" data-step="${i + 1}"><span class="step-num">${i + 1}</span>${s}</button>`
    ).join('');
    $$('.step-chip').forEach(ch => {
        ch.addEventListener('click', () => irAPaso(parseInt(ch.dataset.step, 10)));
    });
}

async function showForm(ficha, esNuevoCaso) {
    App.formFicha = ficha;
    showView('form');

    if (esNuevoCaso) {
        $('#formTitle').textContent = 'Nuevo informe';
        const [reg, cod] = await Promise.all([getNextRegistroNum(), getNextCodigoSeguimiento()]);
        const ahora = Date.now();
        const nueva = {
            id: generateId(),
            semaforo: '',
            tipoEmergencia: '',
            registroNum: reg,
            sector: '',
            calle: '',
            fechaVisita: '',
            nombreAfectado: '',
            fono: '',
            rut: '',
            visitaCon: '',
            reporteConcluyente: '',
            descripcion: '',
            codigoSeguimiento: cod,
            sectorial: '',
            sectorialPersona: '',
            sectorialCorreo: '',
            sectorialTelefono: '',
            profesionalCargo: '',
            derivadoPor: '',
            prioridad: '',
            ubicacionGeo: '',
            fechaDerivacion: '',
            fechaEntrega: '',
            causas: [],
            peligrosidad: [],
            recomendaciones: [],
            imagenesAntes: [],
            imagenesDespues: [],
            imagenes: [],
            fechaCreacion: ahora,
            fechaModificacion: ahora
        };
        App.formFicha = nueva;
        fillForm(nueva);
    } else {
        $('#formTitle').textContent = `Editar informe #${ficha.registroNum}`;
        fillForm(ficha);
    }

    $('#formErrorBox').hidden = true;
    $('#formErrorBox').textContent = '';
    irAPaso(1);
    actualizarResumen();
}

function fillForm(f) {
    App.currentImagesAntes = (f.imagenesAntes || []).map(x => ({ ...x }));
    App.currentImagesDespues = (f.imagenesDespues || []).map(x => ({ ...x }));

    $('#informeId').value = f.id || '';
    $('#tipoEmergencia').value = f.tipoEmergencia || '';
    $('#registroNum').value = f.registroNum || '';
    $('#sector').value = f.sector || '';
    $('#calle').value = f.calle || '';
    $('#ubicacionGeo').value = f.ubicacionGeo || '';
    $('#fechaVisita').value = f.fechaVisita || '';
    $('#nombreAfectado').value = f.nombreAfectado || '';
    $('#fono').value = f.fono || '';
    $('#rut').value = f.rut || '';
    $('#visitaCon').value = f.visitaCon || '';
    $('#descripcion').value = f.descripcion || '';
    $('#codigoSeguimiento').value = f.codigoSeguimiento || '';
    $('#sectorialSelect').value = f.sectorial || '';
    $('#sectorialPersonaSelect').value = f.sectorialPersona || '';
    $('#sectorialContacto').value = f.sectorialCorreo || '';
    $('#profesionalCargo').value = f.profesionalCargo || '';
    $('#derivadoPor').value = f.derivadoPor || '';
    $('#prioridadSelect').value = f.prioridad || '';
    $('#fechaDerivacion').value = f.fechaDerivacion || '';
    $('#fechaEntrega').value = f.fechaEntrega || '';

    selectSemaforo(f.semaforo || '', true);

    const radios = $$('input[name="reporteConcluyente"]');
    radios.forEach(r => r.checked = r.value === (f.reporteConcluyente || ''));

    setDynamicList('#causasList', f.causas || []);
    setDynamicList('#peligrosidadList', f.peligrosidad || []);
    setDynamicList('#recomendacionesList', f.recomendaciones || []);

    if (f.sectorial) poblarPersonasForm();
    renderImagePreviews('antes');
    renderImagePreviews('despues');
    actualizarContactoForm();
}

function getFormData() {
    const f = App.formFicha || {};
    const s = $('#sector').value;
    const sector = SECTORES[s];
    return {
        ...f,
        id: f.id || generateId(),
        semaforo: $('#semaforoColor').value,
        tipoEmergencia: $('#tipoEmergencia').value.trim(),
        registroNum: parseInt($('#registroNum').value, 10) || f.registroNum || null,
        sector: s,
        calle: $('#calle').value.trim(),
        ubicacionGeo: $('#ubicacionGeo').value.trim(),
        fechaVisita: $('#fechaVisita').value,
        nombreAfectado: $('#nombreAfectado').value.trim(),
        fono: $('#fono').value.trim(),
        rut: $('#rut').value.trim(),
        visitaCon: $('#visitaCon').value.trim(),
        descripcion: $('#descripcion').value.trim(),
        codigoSeguimiento: $('#codigoSeguimiento').value,
        sectorial: s,
        sectorialPersona: $('#sectorialPersonaSelect').value,
        sectorialCorreo: sector ? (sector.find(p => p.nombre === $('#sectorialPersonaSelect').value) || {}).correo || '' : '',
        sectorialTelefono: sector ? (sector.find(p => p.nombre === $('#sectorialPersonaSelect').value) || {}).telefono || '' : '',
        profesionalCargo: $('#profesionalCargo').value,
        derivadoPor: $('#derivadoPor').value,
        prioridad: $('#prioridadSelect').value,
        fechaDerivacion: $('#fechaDerivacion').value,
        fechaEntrega: $('#fechaEntrega').value,
        reporteConcluyente: (document.querySelector('input[name="reporteConcluyente"]:checked') || {}).value || '',
        causas: getDynamicListValues('#causasList'),
        peligrosidad: getDynamicListValues('#peligrosidadList'),
        recomendaciones: getDynamicListValues('#recomendacionesList'),
        imagenesAntes: App.currentImagesAntes,
        imagenesDespues: App.currentImagesDespues,
        imagenes: App.currentImagesAntes.map(x => ({ ...x })),
        fechaModificacion: Date.now()
    };
}

/* ---------- Navegación de pasos ---------- */
function irAPaso(n) {
    App.currentStep = Math.min(Math.max(n, 1), TOTAL_STEPS);
    $$('.step').forEach(s => s.hidden = true);
    const paso = document.querySelector(`.step[data-step="${App.currentStep}"]`);
    if (paso) paso.hidden = false;
    $$('.step-chip').forEach(ch => {
        ch.classList.toggle('is-active', parseInt(ch.dataset.step, 10) === App.currentStep);
        const pasoN = parseInt(ch.dataset.step, 10);
        ch.classList.toggle('is-done', pasoN < App.currentStep);
    });
    const pct = Math.round((App.currentStep / TOTAL_STEPS) * 100);
    $('#formProgressBar').style.width = pct + '%';
    $('#formProgressLabel').textContent = `Paso ${App.currentStep} de ${TOTAL_STEPS}`;
    $('#btnStepBack').hidden = App.currentStep === 1;
    $('#btnStepNext').hidden = App.currentStep === TOTAL_STEPS;
    $('#btnSummarySave').hidden = App.currentStep !== TOTAL_STEPS;
    if (App.currentStep === TOTAL_STEPS) actualizarResumen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Semáforo ---------- */
function selectSemaforo(color, silencioso) {
    $('#semaforoColor').value = color || '';
    $$('.semaforo-btn').forEach(b => {
        b.classList.toggle('is-selected', b.dataset.color === color);
    });
    const rojo = color === 'rojo';
    $$('.rojo-only').forEach(el => el.hidden = !rojo);
    $('#recomendacionesField').hidden = rojo;
    const ayuda = SEMAFORO_AYUDAS[color];
    $('#semaforoAyuda').textContent = ayuda || '';
    if (color) {
        const radios = $$('input[name="reporteConcluyente"]');
        const mapa = {
            verde: 'HABITABLE',
            amarillo: 'HABITABLE CON TRABAJOS DE MITIGACION',
            rojo: 'INHABITABLE. EVACUAR, NO RECUPERABLE'
        };
        radios.forEach(r => r.checked = r.value === mapa[color]);
    }
    if (!silencioso) validarVivo('semaforo');
}

const SEMAFORO_AYUDAS = {
    verde: 'Riesgo bajo: la vivienda es habitable.',
    amarillo: 'Riesgo medio: habitable con trabajos de mitigación.',
    rojo: 'Riesgo alto: inhabitable, evacuar, no recuperable.'
};

/* ---------- Listas dinámicas (causas, peligrosidad, recomendaciones) ---------- */
function addDynamicItem(listEl, value) {
    value = (value || '').trim();
    if (!value) return;
    const li = document.createElement('li');
    li.className = 'chip';
    li.innerHTML = `<span>${escapeHtml(value)}</span><button type="button" class="chip-x" aria-label="Quitar">×</button>`;
    li.querySelector('.chip-x').addEventListener('click', () => li.remove());
    listEl.appendChild(li);
}

function setDynamicList(sel, arr) {
    const el = $(sel);
    el.innerHTML = '';
    (arr || []).forEach(v => addDynamicItem(el, v));
}

function getDynamicListValues(sel) {
    return Array.from($(sel).querySelectorAll('.chip span')).map(s => s.textContent);
}

function bindChipInputs() {
    const binds = [
        ['#causasInput', '#btnAddCausa', '#causasList'],
        ['#peligrosidadInput', '#btnAddPeligro', '#peligrosidadList'],
        ['#recomendacionesInput', '#btnAddRecomendacion', '#recomendacionesList']
    ];
    binds.forEach(([inputSel, btnSel, listSel]) => {
        const input = $(inputSel);
        const btn = $(btnSel);
        const list = $(listSel);
        const agregar = () => {
            addDynamicItem(list, input.value);
            input.value = '';
            input.focus();
        };
        btn.addEventListener('click', agregar);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); agregar(); }
        });
    });
}

/* ---------- Imágenes con compresión ---------- */
async function handleImageUpload(e, type) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Cada foto debe pesar menos de 5 MB', 'error');
            continue;
        }
        try {
            const dataUrl = await comprimirImagen(file);
            const item = { name: file.name, dataUrl };
            if (type === 'antes') App.currentImagesAntes.push(item);
            else App.currentImagesDespues.push(item);
        } catch (err) {
            showToast('No se pudo procesar la imagen', 'error');
        }
    }
    e.target.value = '';
    renderImagePreviews(type);
}

function comprimirImagen(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1280;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    const escala = MAX / Math.max(width, height);
                    width = Math.round(width * escala);
                    height = Math.round(height * escala);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews(type) {
    const arr = type === 'antes' ? App.currentImagesAntes : App.currentImagesDespues;
    const cont = $(type === 'antes' ? '#imagePreviewListAntes' : '#imagePreviewListDespues');
    cont.innerHTML = arr.map((img, i) => `
        <div class="img-item">
            <img src="${img.dataUrl}" alt="Foto ${i + 1}">
            <button type="button" class="img-x" data-type="${type}" data-i="${i}" aria-label="Quitar foto">×</button>
        </div>`).join('');
    $$(`.img-x[data-type="${type}"]`).forEach(b => {
        b.addEventListener('click', () => {
            const i = parseInt(b.dataset.i, 10);
            if (type === 'antes') App.currentImagesAntes.splice(i, 1);
            else App.currentImagesDespues.splice(i, 1);
            renderImagePreviews(type);
        });
    });
    updateStorageInfo(type);
}

function updateStorageInfo(type) {
    const arr = type === 'antes' ? App.currentImagesAntes : App.currentImagesDespues;
    const el = $(type === 'antes' ? '#storageInfoAntes' : '#storageInfoDespues');
    const total = arr.reduce((acc, x) => acc + (x.dataUrl ? Math.round(x.dataUrl.length * 0.75) : 0), 0);
    const mb = (total / (1024 * 1024)).toFixed(2);
    el.textContent = `${arr.length} foto(s) · ${mb} MB`;
    el.className = 'storage-info ' + (total > 4 * 1024 * 1024 ? 'warn' : total > 2 * 1024 * 1024 ? 'mid' : '');
}

/* ---------- Selects de personas ---------- */
function poblarPersonasForm() {
    const sector = SECTORES[$('#sector').value];
    const sel = $('#sectorialPersonaSelect');
    sel.innerHTML = '<option value="">Selecciona...</option>' + (sector ? sector.map(p =>
        `<option value="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</option>`).join('') : '');
    if (App.formFicha && App.formFicha.sectorialPersona) sel.value = App.formFicha.sectorialPersona;
}

function actualizarContactoForm() {
    const sector = SECTORES[$('#sector').value];
    const persona = sector ? sector.find(p => p.nombre === $('#sectorialPersonaSelect').value) : null;
    $('#sectorialContacto').value = persona ? `${persona.correo} · ${persona.telefono}` : '';
}

/* ---------- Resumen de verificación ---------- */
function actualizarResumen() {
    const f = getFormData();
    const fichas = fichasVivas(App.fichas || []).filter(x => x.id !== f.id);
    const res = validarFormularioCompleto(f, fichas);
    const cont = $('#saveSummaryList');
    if (!res.errores.length && !res.avisos.length) {
        cont.innerHTML = '<div class="summary-ok">Todo listo. Presiona <strong>Confirmar y guardar</strong>.</div>';
        $('#btnSummarySave').disabled = false;
        return;
    }
    const bloques = [];
    const agrupar = res.errores;
    if (agrupar.length) bloques.push({ titulo: 'Revisa estos puntos', items: agrupar, tipo: 'err' });
    if (res.avisos.length) bloques.push({ titulo: 'Avisos (puedes guardar igual)', items: res.avisos, tipo: 'warn' });
    cont.innerHTML = bloques.map(b => `
        <div class="summary-block ${b.tipo}">
            <h4>${b.titulo}</h4>
            <ul>${b.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}</ul>
        </div>`).join('');
    $('#btnSummarySave').disabled = res.errores.length > 0;
}

/* ---------- Guardado ---------- */
async function ejecutarGuardado() {
    const f = getFormData();
    await guardarFicha(f);
    showToast('Informe guardado');
    App.currentFichaId = f.id;
    renderFichasList();
    viewFicha(f.id);
}

function nuevaFichaVacia() {
    showForm(null, true);
}

/* ---------- Validación en vivo ---------- */
function validarVivo(campo) {
    const f = getFormData();
    const res = validarCampoVivo(campo, f[campo], {
        fechaEntrega: f.fechaEntrega,
        fechaDerivacion: f.fechaDerivacion
    });
    const cont = contenedorDeCampo(campo);
    if (!cont) return;
    cont.classList.remove('campo-ok', 'campo-error');
    const msg = cont.querySelector('.campo-msg');
    if (msg) msg.remove();
    if (res && res.estado === 'error') {
        cont.classList.add('campo-error');
        const p = document.createElement('small');
        p.className = 'campo-msg';
        p.textContent = res.mensaje;
        cont.appendChild(p);
    } else if (res && res.estado === 'ok') {
        cont.classList.add('campo-ok');
    }
}

function contenedorDeCampo(campo) {
    const el = $(`#${campo}`);
    return el ? el.closest('.field') : null;
}

function initValidacionVivo() {
    const campos = ['tipoEmergencia', 'sector', 'descripcion', 'calle', 'nombreAfectado',
                    'fono', 'rut', 'fechaVisita', 'fechaDerivacion', 'fechaEntrega'];
    campos.forEach(c => {
        const el = $(`#${c}`);
        if (!el) return;
        el.addEventListener('blur', () => validarVivo(c));
    });
    $('#fono').addEventListener('input', e => { e.target.value = mascaraFono(e.target.value); });
    $('#rut').addEventListener('input', e => { e.target.value = mascaraRut(e.target.value); });
}

function initFormListeners() {
    $('#btnStepNext').addEventListener('click', () => irAPaso(App.currentStep + 1));
    $('#btnStepBack').addEventListener('click', () => irAPaso(App.currentStep - 1));
    $('#btnCancel').addEventListener('click', () => { renderFichasList(); showView('lista'); });

    $$('.semaforo-btn').forEach(b => {
        b.addEventListener('click', () => selectSemaforo(b.dataset.color, false));
    });

    $('#btnSave').addEventListener('click', () => {
        actualizarResumen();
        irAPaso(TOTAL_STEPS);
    });

    $('#btnSummarySave').addEventListener('click', ejecutarGuardado);

    $('#btnUploadImageAntes').addEventListener('click', () => $('#imageUploadAntes').click());
    $('#btnUploadImageDespues').addEventListener('click', () => $('#imageUploadDespues').click());
    $('#imageUploadAntes').addEventListener('change', e => handleImageUpload(e, 'antes'));
    $('#imageUploadDespues').addEventListener('change', e => handleImageUpload(e, 'despues'));

    $('#sector').addEventListener('change', () => {
        poblarPersonasForm();
        if (!$('#ubicacionGeo').value) $('#ubicacionGeo').value = $('#sector').value;
        validarVivo('sector');
    });
    $('#sectorialPersonaSelect').addEventListener('change', actualizarContactoForm);

    $('#informeForm').addEventListener('submit', e => e.preventDefault());
}
