// ============================================
// VALIDACION DE INFORMACION - Reglas, máscaras
// y verificaciones reutilizables.
// ============================================

// ---------- MÁSCARAS Y FORMATOS ----------

// Formatea un RUT mientras se escribe: 12345678K -> 12.345.678-K
function mascaraRut(valor) {
    let v = String(valor || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (v.length <= 1) return v;
    const cuerpo = v.slice(0, -1).slice(-8);
    const dv = v.slice(-1);
    return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

// Formatea un teléfono chileno: 987654321 -> +56 9 8765 4321
function mascaraFono(valor) {
    let v = String(valor || '').replace(/[^0-9+]/g, '');
    if (v.startsWith('+56')) v = v.slice(3);
    v = v.replace(/^0+/, '');
    const d = v.replace(/[^0-9]/g, '').slice(0, 9);
    if (!d) return '';
    if (d.length <= 1) return d;
    if (d.length <= 5) return '9 ' + d.slice(1);
    return '9 ' + d.slice(1, 5) + ' ' + d.slice(5);
}

// ---------- VALIDADORES ----------

// Valida RUT chileno con dígito verificador.
// Acepta "12.345.678-9", "12345678-9", "12345678K".
function validarRut(rut) {
    const limpio = String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (limpio.length < 2 || limpio.length > 9) return false;
    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    let suma = 0;
    let multiplicador = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i], 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const resto = 11 - (suma % 11);
    const dvEsperado = resto === 11 ? '0' : (resto === 10 ? 'K' : String(resto));
    return dv === dvEsperado;
}

// Valida teléfono móvil chileno (9 dígitos, opcional +56 / 0).
function validarTelefonoCl(fono) {
    const limpio = String(fono || '').replace(/[^0-9]/g, '');
    if (!limpio) return true;
    const d = limpio.startsWith('56') ? limpio.slice(2) : limpio;
    return /^9\d{8}$/.test(d);
}

function esFechaValida(fechaStr) {
    if (!fechaStr) return true;
    const f = new Date(fechaStr + 'T00:00:00');
    return !isNaN(f.getTime());
}

function fechaNoFutura(fechaStr) {
    if (!fechaStr) return true;
    const f = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return f <= hoy;
}

function fechaAnteriorOIgual(a, b) {
    if (!a || !b) return true;
    return new Date(a + 'T00:00:00').getTime() <= new Date(b + 'T00:00:00').getTime();
}

// ---------- NORMALIZACIÓN ----------

function normalizarTexto(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
}

function capitalizarNombre(s) {
    return normalizarTexto(s).replace(/\b\w/g, c => c.toUpperCase());
}

// ---------- VALIDACIÓN DEL FORMULARIO ----------
// Devuelve { errores: [{campo, label, seccion, msg}], avisos: [{campo, label, seccion, msg}] }

const SECCION_POR_CAMPO = {
    semaforo: 'Tipo de Informe',
    tipoEmergencia: 'Datos de la Emergencia',
    registroNum: 'Datos de la Emergencia',
    sector: 'Ubicación',
    calle: 'Ubicación',
    fechaVisita: 'Ubicación',
    nombreAfectado: 'Datos Personales',
    fono: 'Datos Personales',
    rut: 'Datos Personales',
    visitaCon: 'Datos Personales',
    reporteConcluyente: 'Reporte Concluyente',
    sectorialSelect: 'Control Documental',
    sectorial: 'Control Documental',
    sectorialPersonaSelect: 'Control Documental',
    sectorialPersona: 'Control Documental',
    profesionalCargo: 'Control Documental',
    derivadoPor: 'Control Documental',
    prioridadSelect: 'Control Documental',
    prioridad: 'Control Documental',
    ubicacionGeo: 'Control Documental',
    fechaDerivacion: 'Control Documental',
    fechaEntrega: 'Control Documental',
    descripcion: 'Descripción de la Emergencia',
    causas: 'Causas Estimadas',
    peligrosidad: 'Condición de Peligrosidad',
    recomendaciones: 'Recomendaciones Post Emergencia',
    imagenesAntes: 'Evidencia Fotográfica - Antes',
    imagenesDespues: 'Evidencia Fotográfica - Después'
};

function conSeccion(item) {
    item.seccion = SECCION_POR_CAMPO[item.campo] || 'Formulario';
    return item;
}

function validarFormularioCompleto(ficha, fichasExistentes) {
    const errores = [];
    const avisos = [];

    // Obligatorios para guardar
    if (!ficha.semaforo) {
        errores.push(conSeccion({ campo: 'semaforo', label: 'Tipo de Informe (Semáforo)', msg: 'Debe elegir un color de semáforo.' }));
    }
    if (!ficha.sector) {
        errores.push(conSeccion({ campo: 'sector', label: 'Sector', msg: 'Debe indicar el sector donde ocurrió la emergencia.' }));
    }

    // Formato de texto
    if (ficha.tipoEmergencia && ficha.tipoEmergencia.length < 3) {
        errores.push(conSeccion({ campo: 'tipoEmergencia', label: 'Tipo de Emergencia', msg: 'El tipo de emergencia es muy corto (mínimo 3 caracteres).' }));
    }
    if (ficha.descripcion && ficha.descripcion.length < 10) {
        errores.push(conSeccion({ campo: 'descripcion', label: 'Descripción de la Emergencia', msg: 'La descripción es muy corta. Cuente qué ocurrió en al menos 10 caracteres.' }));
    }

    // RUT
    if (ficha.rut) {
        if (!validarRut(ficha.rut)) {
            errores.push(conSeccion({ campo: 'rut', label: 'RUT', msg: 'El RUT no es válido. Formato esperado: 12.345.678-9.' }));
        }
    }

    // Teléfono
    if (ficha.fono && !validarTelefonoCl(ficha.fono)) {
        errores.push(conSeccion({ campo: 'fono', label: 'Fono', msg: 'El teléfono debe tener 9 dígitos (Ej: 9 8765 4321).' }));
    }

    // Fechas
    if (!esFechaValida(ficha.fechaVisita)) {
        errores.push(conSeccion({ campo: 'fechaVisita', label: 'Fecha de Visita', msg: 'La fecha de visita no es válida.' }));
    } else if (!fechaNoFutura(ficha.fechaVisita)) {
        errores.push(conSeccion({ campo: 'fechaVisita', label: 'Fecha de Visita', msg: 'La fecha de visita no puede ser futura.' }));
    }
    if (!esFechaValida(ficha.fechaDerivacion)) {
        errores.push(conSeccion({ campo: 'fechaDerivacion', label: 'Fecha de Derivación', msg: 'La fecha de derivación no es válida.' }));
    }
    if (!esFechaValida(ficha.fechaEntrega)) {
        errores.push(conSeccion({ campo: 'fechaEntrega', label: 'Fecha de Entrega', msg: 'La fecha de entrega no es válida.' }));
    }
    if (ficha.fechaDerivacion && ficha.fechaEntrega && !fechaAnteriorOIgual(ficha.fechaDerivacion, ficha.fechaEntrega)) {
        errores.push(conSeccion({ campo: 'fechaEntrega', label: 'Fecha de Entrega', msg: 'La fecha de entrega no puede ser anterior a la fecha de derivación.' }));
    }
    if (!ficha.fechaDerivacion || !ficha.fechaEntrega) {
        avisos.push(conSeccion({ campo: 'fechaDerivacion', label: 'Control Documental', msg: 'Faltan fechas del control documental (derivación y entrega).' }));
    }

    // Pendientes del control documental (aviso, no bloquea el guardado)
    getFaltantesControl(ficha).forEach(falt => {
        avisos.push(conSeccion({ campo: falt.campo, label: 'Control Documental', msg: 'Pendiente: ' + falt.label + '.' }));
    });

    // Posible duplicado
    if (ficha.sector && ficha.calle && ficha.fechaVisita && Array.isArray(fichasExistentes)) {
        const duplicado = fichasExistentes.find(f =>
            f.id !== ficha.id &&
            normalizarTexto(f.sector) === normalizarTexto(ficha.sector) &&
            normalizarTexto(f.calle) === normalizarTexto(ficha.calle) &&
            f.fechaVisita === ficha.fechaVisita
        );
        if (duplicado) {
            avisos.push(conSeccion({ campo: 'sector', label: 'Posible duplicado', msg: 'Ya existe un informe con el mismo sector, calle y fecha de visita (N° ' + (duplicado.registroNum || '-') + ').' }));
        }
    }

    return { errores: errores, avisos: avisos };
}

// Validación en vivo de un campo individual.
// Devuelve { estado: 'ok' | 'error' | 'pendiente' | 'vacio', mensaje }
function validarCampoVivo(campo, valor, contexto) {
    contexto = contexto || {};
    const valorStr = String(valor || '').trim();
    const esRequerido = CAMPOS_REQUERIDOS_GUARDAR.some(r => r.campo === campo);
    const campoBase = campo.replace(/Select$/, '');

    if (!valorStr) {
        if (esRequerido) return { estado: 'pendiente', mensaje: 'Campo obligatorio pendiente.' };
        return { estado: 'vacio', mensaje: null };
    }

    switch (campoBase) {
        case 'semaforo':
            return { estado: 'ok', mensaje: null };
        case 'sector':
            return { estado: 'ok', mensaje: null };
        case 'tipoEmergencia':
            return valorStr.length >= 3
                ? { estado: 'ok', mensaje: null }
                : { estado: 'error', mensaje: 'Mínimo 3 caracteres.' };
        case 'descripcion':
            return valorStr.length >= 10
                ? { estado: 'ok', mensaje: null }
                : { estado: 'error', mensaje: 'Mínimo 10 caracteres.' };
        case 'rut':
            return validarRut(valorStr)
                ? { estado: 'ok', mensaje: null }
                : { estado: 'error', mensaje: 'RUT inválido. Formato: 12.345.678-9.' };
        case 'fono':
            return validarTelefonoCl(valorStr)
                ? { estado: 'ok', mensaje: null }
                : { estado: 'error', mensaje: 'Debe tener 9 dígitos.' };
        case 'fechaVisita':
            if (!esFechaValida(valorStr)) return { estado: 'error', mensaje: 'Fecha no válida.' };
            if (!fechaNoFutura(valorStr)) return { estado: 'error', mensaje: 'La fecha no puede ser futura.' };
            return { estado: 'ok', mensaje: null };
        case 'fechaDerivacion':
            if (!esFechaValida(valorStr)) return { estado: 'error', mensaje: 'Fecha no válida.' };
            if (contexto.fechaEntrega && !fechaAnteriorOIgual(valorStr, contexto.fechaEntrega)) {
                return { estado: 'error', mensaje: 'Debe ser anterior o igual a la fecha de entrega.' };
            }
            return { estado: 'ok', mensaje: null };
        case 'fechaEntrega':
            if (!esFechaValida(valorStr)) return { estado: 'error', mensaje: 'Fecha no válida.' };
            if (contexto.fechaDerivacion && !fechaAnteriorOIgual(contexto.fechaDerivacion, valorStr)) {
                return { estado: 'error', mensaje: 'No puede ser anterior a la fecha de derivación.' };
            }
            return { estado: 'ok', mensaje: null };
        default:
            return { estado: 'ok', mensaje: null };
    }
}
