/* ============================================================
   data.js — Capa de datos: caché en memoria + Firestore
   Estrategia: se lee la colección UNA vez y se mantiene en
   memoria. Cada cambio escribe SOLO el documento afectado
   (doc(id).set), no la colección completa.
   ============================================================ */

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout_firestore')), ms || 10000))
    ]);
}

async function loadFichas(opts) {
    const fuerza = opts && opts.force;
    if (App.fichas && !fuerza) return App.fichas;

    let desdeFirestore = false;
    try {
        const snap = await withTimeout(db_firestore.collection('fichas').get(), 10000);
        const fichas = [];
        snap.forEach(doc => fichas.push({ id: doc.id, ...doc.data() }));
        App.fichas = fichas;
        App.firestoreOk = true;
        desdeFirestore = true;
    } catch (e) {
        App.firestoreOk = false;
        if (!App.fichas) {
            try { App.fichas = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
            catch { App.fichas = []; }
        }
    }
    if (desdeFirestore) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(App.fichas)); } catch (e) { /* sin espacio */ }
    }
    return App.fichas;
}

function loadFichasSync() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}

async function persistCacheLocal() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(App.fichas)); } catch (e) { /* sin espacio */ }
}

async function guardarFicha(f) {
    App.fichas = App.fichas || [];
    const i = App.fichas.findIndex(x => x.id === f.id);
    if (i >= 0) App.fichas[i] = f;
    else App.fichas.push(f);
    await persistCacheLocal();
    try {
        await withTimeout(db_firestore.collection('fichas').doc(f.id).set(f), 10000);
        App.firestoreOk = true;
    } catch (e) {
        App.firestoreOk = false;
        console.warn('Sin conexión a Firestore, guardado local:', e);
    }
}

async function eliminarFichaSoft(id) {
    const f = (App.fichas || []).find(x => x.id === id);
    if (!f) return;
    f.fechaEliminacion = Date.now();
    await guardarFicha(f);
}

async function restaurarFicha(id) {
    const f = (App.fichas || []).find(x => x.id === id);
    if (!f) return;
    delete f.fechaEliminacion;
    await guardarFicha(f);
}

async function purgarFicha(id) {
    App.fichas = (App.fichas || []).filter(x => x.id !== id);
    await persistCacheLocal();
    try {
        await withTimeout(db_firestore.collection('fichas').doc(id).delete(), 10000);
        App.firestoreOk = true;
    } catch (e) {
        App.firestoreOk = false;
        console.warn('Sin conexión a Firestore:', e);
    }
}

async function getNextRegistroNum() {
    const fichas = await loadFichas();
    let max = 0;
    fichasVivas(fichas).forEach(f => {
        const n = parseInt(f.registroNum, 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
}

async function getNextCodigoSeguimiento() {
    const fichas = await loadFichas();
    const year = new Date().getFullYear();
    let max = 0;
    fichas.forEach(f => {
        const c = f.codigoSeguimiento || '';
        const m = /^(\d+)-SDC-(\d+)$/.exec(c);
        if (m && parseInt(m[2], 10) === year) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n) && n > max) max = n;
        }
    });
    return String(max + 1).padStart(2, '0') + '-SDC-' + year;
}

/* ---------- Filtros de estado ---------- */
function fichasVivas(lista) {
    return (lista || []).filter(f => !f.fechaEliminacion);
}
function fichasPapelera(lista) {
    return (lista || []).filter(f => !!f.fechaEliminacion);
}

/* ---------- Export / Import JSON ---------- */
function exportarJson() {
    const fichas = fichasVivas(App.fichas || []);
    const blob = new Blob([JSON.stringify(fichas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const f = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    a.href = url;
    a.download = `fichas_emergencia_${f}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados');
}

async function importarJson(file) {
    const texto = await file.text();
    let data;
    try { data = JSON.parse(texto); } catch { showToast('El archivo no es un JSON válido', 'error'); return; }
    if (!Array.isArray(data)) { showToast('El archivo no contiene una lista de informes', 'error'); return; }
    if (!confirm(`Esto reemplazará todos los informes actuales por ${data.length} informes del archivo. ¿Continuar?`)) return;

    App.fichas = data;
    await persistCacheLocal();
    try {
        const batch = db_firestore.batch();
        const snap = await withTimeout(db_firestore.collection('fichas').get(), 10000);
        const idsExistentes = new Set();
        snap.forEach(doc => idsExistentes.add(doc.id));
        data.forEach(f => {
            if (f.id) batch.set(db_firestore.collection('fichas').doc(f.id), f);
        });
        idsExistentes.forEach(id => {
            if (!data.some(f => f.id === id)) batch.delete(db_firestore.collection('fichas').doc(id));
        });
        await withTimeout(batch.commit(), 15000);
        App.firestoreOk = true;
    } catch (e) {
        App.firestoreOk = false;
        console.warn('Import sin conexión a Firestore:', e);
    }
    showToast(`${data.length} informes importados`);
    renderFichasList();
}
