// ============================================
// AYUDAS DE LLENADO - Guía para cada campo
// Módulo separado para facilitar el mantenimiento
// de los textos de ayuda y sugerencias.
// ============================================

// Texto de ayuda por campo del formulario.
// key: id del input/select o nombre lógico del campo.
const CAMPO_AYUDAS = {
    semaforo: {
        ayuda: 'Elija el estado de la vivienda según la visita técnica. El sistema sugiere el reporte concluyente según el color.',
        ejemplo: 'Verde = habitable · Amarillo = habitable con mitigación · Rojo = inhabitable'
    },
    tipoEmergencia: {
        ayuda: '¿Qué pasó? Describa el tipo de evento en pocas palabras.',
        ejemplo: 'Ej: Remoción en masa, Incendio, Inundación'
    },
    registroNum: {
        ayuda: 'Número correlativo asignado automáticamente por el sistema. No lo modifique.'
    },
    sector: {
        ayuda: 'Barrio o zona de la comuna donde ocurrió la emergencia.',
        ejemplo: 'Elija uno de la lista o escríbalo si no aparece.'
    },
    calle: {
        ayuda: 'Dirección del lugar: calle y número de la vivienda afectada.',
        ejemplo: 'Ej: Avda. Collao 1234'
    },
    fechaVisita: {
        ayuda: 'Día en que el equipo técnico visitó el lugar.',
        ejemplo: 'No puede ser una fecha futura.'
    },
    nombreAfectado: {
        ayuda: 'Nombre de la persona afectada (dueño/a u ocupante de la vivienda).',
        ejemplo: 'Ej: María José Fuentes'
    },
    fono: {
        ayuda: 'Teléfono de contacto del afectado/a. Se formatea automáticamente.',
        ejemplo: 'Ej: 9 8765 4321'
    },
    rut: {
        ayuda: 'Cédula de identidad del afectado/a. Se formatea y verifica automáticamente.',
        ejemplo: 'Ej: 12.345.678-9'
    },
    visitaCon: {
        ayuda: 'Nombre de la persona que acompañó al equipo durante la visita.',
        ejemplo: 'Ej: Encargado/a del sector, vecino/a, etc.'
    },
    reporteConcluyente: {
        ayuda: 'Resultado final de la visita. El sistema lo sugiere según el semáforo; verifique que sea correcto.',
        ejemplo: 'Puede cambiarlo manualmente si corresponde.'
    },
    conclusion: {
        ayuda: 'Resumen breve del resultado de la visita y del estado del lugar.',
        ejemplo: 'Ej: La vivienda presenta daños menores, se recomienda monitoreo.'
    },
    codigoSeguimiento: {
        ayuda: 'Código de seguimiento asignado automáticamente. No lo modifique.'
    },
    sectorialSelect: {
        ayuda: 'Delegación municipal a la que pertenece el sector afectado.',
        ejemplo: 'Seleccione una opción de la lista.'
    },
    sectorialPersonaSelect: {
        ayuda: 'Encargado/a de la delegación: será el contacto directo y su firma quedará en el informe.',
        ejemplo: 'Seleccione una opción de la lista.'
    },
    profesionalCargo: {
        ayuda: 'Profesional responsable de elaborar el informe. Su firma quedará en el documento.',
        ejemplo: 'Seleccione una opción de la lista.'
    },
    derivadoPor: {
        ayuda: 'Persona o unidad a la que se deriva la emergencia.',
        ejemplo: 'Seleccione una opción de la lista.'
    },
    prioridadSelect: {
        ayuda: 'Urgencia del caso según los plazos definidos por la Dirección.',
        ejemplo: 'Alta = 48 h · Media = 72 h · Baja = 96 h'
    },
    ubicacionGeo: {
        ayuda: 'Ubicación exacta del lugar: link de Google Maps o el nombre del sector (se completa solo).',
        ejemplo: 'Ej: https://maps.app.goo.gl/xxxx o "Collao"'
    },
    fechaDerivacion: {
        ayuda: 'Día en que se derivó la emergencia al equipo.',
        ejemplo: 'Debe ser anterior o igual a la fecha de entrega.'
    },
    fechaEntrega: {
        ayuda: 'Día en que se entregará el informe final.',
        ejemplo: 'No puede ser anterior a la fecha de derivación.'
    },
    descripcion: {
        ayuda: 'Cuente qué ocurrió: dónde, cuándo y cómo se detectó la emergencia. Sea claro y ordenado.',
        ejemplo: 'Recomendado: al menos 10 caracteres.'
    },
    causas: {
        ayuda: '¿Qué pudo provocar la emergencia? Agregue una causa por línea.',
        ejemplo: 'Ej: Lluvias intensas, acumulación de agua, falla estructural'
    },
    peligrosidad: {
        ayuda: '¿Qué riesgo representa el lugar hoy para las personas?',
        ejemplo: 'Ej: Riesgo de derrumbe, cables expuestos, acceso inseguro'
    },
    recomendaciones: {
        ayuda: 'Acciones sugeridas después de la emergencia (no aplica en semáforo rojo).',
        ejemplo: 'Ej: Realizar monitoreo mensual, despejar canal de aguas'
    },
    imagenesAntes: {
        ayuda: 'Fotografías del lugar antes de la visita (si existen). Suba una o varias imágenes.',
        ejemplo: 'Formatos: JPG, PNG'
    },
    imagenesDespues: {
        ayuda: 'Fotografías del estado actual del lugar. Suba una o varias imágenes.',
        ejemplo: 'Formatos: JPG, PNG'
    }
};

// Alias de campos de la tabla de Control Documental -> claves de CAMPO_AYUDAS
const CAMPO_TABLE_ALIAS = {
    sectorial: 'sectorialSelect',
    sectorialPersona: 'sectorialPersonaSelect',
    profesionalCargo: 'profesionalCargo',
    derivadoPor: 'derivadoPor',
    prioridad: 'prioridadSelect',
    ubicacionGeo: 'ubicacionGeo'
};

// Campos obligatorios para GUARDAR el informe
const CAMPOS_REQUERIDOS_GUARDAR = [
    { campo: 'semaforo', label: 'Tipo de Informe (Semáforo)' },
    { campo: 'sector', label: 'Sector' }
];

// Sugerencias para el campo "Tipo de Emergencia"
const TIPOS_EMERGENCIA = [
    'Remoción en masa',
    'Incendio',
    'Inundación',
    'Caída de árbol',
    'Falla estructural',
    'Filtración de agua',
    'Colapso de muro',
    'Daño en techumbre',
    'Anegamiento',
    'Derrumbe parcial'
];
