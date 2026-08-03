/* ============================================================
   control.js — Tabla de Control Documental
   ============================================================ */

function mapsUrlControl(u) {
    if (!u) return '';
    return /^https?:\/\//i.test(u) ? u : ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(u));
}

function extractMotivo(descripcion) {
    const primera = (descripcion || '').split('\n')[0].trim();
    return primera.length > 100 ? primera.slice(0, 97) + '...' : primera;
}

function getHorasEstado(f) {
    const lim = PRIORIDAD_LIMITES[f.prioridad] || 72;
    if (!f.fechaDerivacion) return { pct: 0, label: '', clase: '' };
    const der = new Date(f.fechaDerivacion + 'T00:00:00');
    const ahora = new Date();
    const horas = (ahora - der) / 3600000;
    const pct = Math.min((horas / lim) * 100, 100);
    return {
        pct,
        label: `${Math.round(horas)}/${lim} h`,
        clase: horas > lim ? 'horas-late' : horas > lim * 0.7 ? 'horas-warn' : 'horas-ok'
    };
}

function llenarSelect(sel, valores, seleccionado) {
    sel.innerHTML = '<option value="">—</option>' +
        (valores || []).map(v => `<option value="${escapeHtml(v)}" ${v === seleccionado ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

async function mostrarControl() {
    const fichas = await loadFichas();
    const vivas = fichasVivas(fichas).sort((a, b) => (a.registroNum || 0) - (b.registroNum || 0));

    const tbody = $('#controlTableBody');
    tbody.innerHTML = '';

    for (const f of vivas) {
        if (!f.codigoSeguimiento) {
            f.codigoSeguimiento = await getNextCodigoSeguimiento();
            await guardarFicha(f);
        }
        const est = estadoControl(f);
        const horas = getHorasEstado(f);
        const tr = document.createElement('tr');
        tr.className = 'control-row';
        tr.dataset.id = f.id;

        tr.innerHTML = `
            <td class="mono">${escapeHtml(String(f.registroNum || ''))}</td>
            <td class="motivo" title="${escapeHtml(f.descripcion || '')}">${escapeHtml(extractMotivo(f.descripcion))}</td>
            <td class="mono">${escapeHtml(f.codigoSeguimiento || '')}</td>
            <td><span class="estado-pill estado-${est.clase}">${est.label}</span></td>
            <td><select class="sel-sectorial" data-campo="sectorial">${OpcionesSelects.sectorial(f.sectorial)}</select></td>
            <td><select class="sel-persona" data-campo="sectorialPersona"></select></td>
            <td><select class="sel-derivado" data-campo="derivadoPor">${OpcionesSelects.derivados(f.derivadoPor)}</select></td>
            <td><input type="date" class="inp-fecha" data-campo="fechaDerivacion" value="${escapeHtml(f.fechaDerivacion || '')}"></td>
            <td><input type="date" class="inp-fecha" data-campo="fechaVisita" value="${escapeHtml(f.fechaVisita || '')}"></td>
            <td><input type="date" class="inp-fecha" data-campo="fechaEntrega" value="${escapeHtml(f.fechaEntrega || '')}"></td>
            <td><select class="sel-prioridad" data-campo="prioridad">
                <option value="">—</option>
                <option value="alta" ${f.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
                <option value="media" ${f.prioridad === 'media' ? 'selected' : ''}>Media</option>
                <option value="baja" ${f.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
            </select></td>
            <td><span class="horas ${horas.clase}" title="${horas.label}">${horas.label}</span></td>
            <td class="acciones">
                ${est.clase === 'listo' ? `<button class="btn btn-accent btn-xs" data-generar>Generar</button>` : ''}
                <button class="btn btn-ghost btn-xs" data-ver>Ver</button>
            </td>`;

        const selSectorial = tr.querySelector('.sel-sectorial');
        const selPersona = tr.querySelector('.sel-persona');
        const personas = SECTORES[f.sectorial] ? SECTORES[f.sectorial].map(p => p.nombre) : [];
        llenarSelect(selPersona, personas, f.sectorialPersona);

        tbody.appendChild(tr);

        /* ---- listeners ---- */
        const guardarCampo = async (campo, valor) => {
            f[campo] = valor;
            if (campo === 'sectorial' && SECTORES[valor]) {
                f.ubicacionGeo = f.ubicacionGeo || valor;
            }
            await guardarFicha(f);
            actualizarHorasFila(tr, f);
        };

        selSectorial.addEventListener('change', async () => {
            f.sectorial = selSectorial.value;
            const pers = SECTORES[f.sectorial] ? SECTORES[f.sectorial] : [];
            llenarSelect(selPersona, pers.map(p => p.nombre), '');
            f.sectorialPersona = '';
            if (f.sectorial) f.ubicacionGeo = f.ubicacionGeo || f.sectorial;
            await guardarFicha(f);
            actualizarFilaEstado(tr, f);
        });

        selPersona.addEventListener('change', async () => {
            const persona = SECTORES[f.sectorial] ? SECTORES[f.sectorial].find(p => p.nombre === selPersona.value) : null;
            if (persona) {
                f.sectorialCorreo = persona.correo;
                f.sectorialTelefono = persona.telefono;
            }
            f.sectorialPersona = selPersona.value;
            await guardarFicha(f);
            actualizarFilaEstado(tr, f);
        });

        tr.querySelector('.sel-derivado').addEventListener('change', e => guardarCampo('derivadoPor', e.target.value));
        tr.querySelector('.sel-prioridad').addEventListener('change', async e => {
            f.prioridad = e.target.value;
            await guardarFicha(f);
            actualizarHorasFila(tr, f);
        });

        tr.querySelectorAll('.inp-fecha').forEach(inp => {
            inp.addEventListener('change', async e => {
                await guardarCampo(e.target.dataset.campo, e.target.value);
                actualizarFilaEstado(tr, f);
            });
        });

        const btnGenerar = tr.querySelector('[data-generar]');
        if (btnGenerar) {
            btnGenerar.addEventListener('click', async () => {
                f.fechaGeneracion = Date.now();
                await guardarFicha(f);
                showToast('Informe marcado como generado');
                renderFichasList();
                viewFicha(f.id);
            });
        }
        tr.querySelector('[data-ver]').addEventListener('click', () => viewFicha(f.id));
    }
}

function actualizarHorasFila(tr, f) {
    const horas = getHorasEstado(f);
    const celda = tr.querySelector('.horas');
    if (celda) {
        celda.className = 'horas ' + horas.clase;
        celda.textContent = horas.label;
        celda.title = horas.label;
    }
}

function actualizarFilaEstado(tr, f) {
    const est = estadoControl(f);
    const celda = tr.querySelector('.estado-pill');
    if (celda) celda.className = `estado-pill estado-${est.clase}`;
    const btnGen = tr.querySelector('[data-generar]');
    if (btnGen) btnGen.remove();
    if (est.clase === 'listo') {
        const td = tr.querySelector('.acciones');
        const b = document.createElement('button');
        b.className = 'btn btn-accent btn-xs';
        b.textContent = 'Generar';
        b.addEventListener('click', async () => {
            f.fechaGeneracion = Date.now();
            await guardarFicha(f);
            showToast('Informe marcado como generado');
            renderFichasList();
            viewFicha(f.id);
        });
        td.insertBefore(b, td.firstChild);
    }
}

/* ---------- Opciones de selects (estático para rendimiento) ---------- */
const OpcionesSelects = {
    sectorial: (sel) => '<option value="">—</option>' + Object.keys(SECTORES).map(s =>
        `<option value="${escapeHtml(s)}" ${s === sel ? 'selected' : ''}>${escapeHtml(s)}</option>`).join(''),
    derivados: (sel) => '<option value="">—</option>' + DERIVADOS.map(d =>
        `<option value="${escapeHtml(d)}" ${d === sel ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')
};
