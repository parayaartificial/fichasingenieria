/* ============================================================
   app.js — Orquestador principal
   ============================================================ */

function initDatalists() {
    $('#sugTipoEmergencia').innerHTML = (TIPOS_EMERGENCIA || []).map(t =>
        `<option value="${escapeHtml(t)}">`).join('');
    const sectores = Object.keys(SECTORES || {});
    $('#sector').innerHTML = '<option value="">Selecciona el sector...</option>' +
        sectores.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}

function initSelectsFormulario() {
    llenarSelectSelect($('#sectorialSelect'), Object.keys(SECTORES));
    llenarSelectSelect($('#profesionalCargo'), PROFESIONALES);
    llenarSelectSelect($('#derivadoPor'), DERIVADOS);
}

function llenarSelectSelect(sel, valores) {
    sel.innerHTML = '<option value="">Selecciona...</option>' +
        (valores || []).map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}
function initNavigation() {
    $$('.nav-btn').forEach(b => {
        b.addEventListener('click', async () => {
            const v = b.dataset.view;
            switch (v) {
                case 'dashboard': await renderDashboard(); break;
                case 'lista': await renderFichasList(); break;
                case 'control': await mostrarControl(); break;
                case 'papelera': await mostrarPapelera(); break;
            }
            showView(v);
        });
    });

    $('#brandHome').addEventListener('click', async e => {
        e.preventDefault();
        await renderDashboard();
        showView('dashboard');
    });

    $('#btnRefreshDashboard').addEventListener('click', async () => {
        await loadFichas({ force: true });
        await renderDashboard();
        showToast('Datos actualizados');
    });

    $('#btnRefreshControl').addEventListener('click', async () => {
        await loadFichas({ force: true });
        await mostrarControl();
        showToast('Datos actualizados');
    });
}

/* ---------- Búsqueda y filtros ---------- */
function initBusqueda() {
    $('#searchInput').addEventListener('input', e => {
        App.currentSearch = e.target.value;
        renderFichasList();
    });

    $$('.filter-btn').forEach(b => {
        b.addEventListener('click', () => {
            $$('.filter-btn').forEach(x => x.classList.remove('is-active'));
            b.classList.add('is-active');
            App.currentFilter = b.dataset.filter;
            renderFichasList();
        });
    });
}

/* ---------- Acciones de la vista de ficha ---------- */
function initFichaActions() {
    $('#btnBackToList').addEventListener('click', volverALista);
    $('#btnEditFromView').addEventListener('click', editarFichaActual);
    $('#btnDuplicateFromView').addEventListener('click', duplicarFichaActual);
    $('#btnDeleteFromView').addEventListener('click', borrarFichaActual);
    $('#btnExportPdf').addEventListener('click', exportPdf);
    $('#btnNewInforme').addEventListener('click', () => showForm(null, true));
}

/* ---------- Usuario y menús ---------- */
function initUserMenu() {
    $('#btnUserActions').addEventListener('click', e => {
        e.stopPropagation();
        const menu = $('#userActionsMenu');
        menu.hidden = !menu.hidden;
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.user-menu')) $('#userActionsMenu').hidden = true;
    });

    $$('#userActionsMenu [data-action]').forEach(b => {
        b.addEventListener('click', async () => {
            $('#userActionsMenu').hidden = true;
            switch (b.dataset.action) {
                case 'logout': logoutUser(); break;
                case 'creds':
                    renderCredentials();
                    openModal('#credsModal');
                    break;
                case 'users':
                    renderUsersList();
                    openModal('#userModal');
                    break;
                case 'export': exportarJson(); break;
                case 'import': $('#importFileInput').click(); break;
            }
        });
    });

    $('#importFileInput').addEventListener('change', e => {
        if (e.target.files[0]) importarJson(e.target.files[0]);
        e.target.value = '';
    });
}

/* ---------- Login ---------- */
function initLogin() {
    $('#loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const ok = loginUser($('#loginUser').value, $('#loginPass').value);
        if (!ok) {
            $('#loginError').textContent = 'Usuario o contraseña incorrectos';
            $('#loginError').hidden = false;
            return;
        }
        $('#loginError').hidden = true;
        initAppDespuesLogin();
    });
}

/* ---------- Modal usuarios ---------- */
function initUserModal() {
    $('#addUserForm').addEventListener('submit', e => {
        e.preventDefault();
        const nombre = $('#newUserName').value.trim();
        const login = $('#newUserLogin').value.trim();
        const pass = $('#newUserPass').value.trim();
        const role = $('#newUserRole').value;
        if (!nombre || !login || !pass) { showToast('Completa todos los campos', 'error'); return; }
        const users = getUsers();
        if (users.some(u => u.login.toLowerCase() === login.toLowerCase())) {
            showToast('Ese usuario ya existe', 'error');
            return;
        }
        users.push({ login, pass: hashPassword(pass), name: nombre, role });
        saveUsers(users);
        $('#newUserName').value = '';
        $('#newUserLogin').value = '';
        $('#newUserPass').value = '';
        renderUsersList();
        renderCredentials();
        showToast('Usuario agregado');
    });

    $$('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
    $('#overlay').addEventListener('click', closeModals);
}

/* ---------- Init ---------- */
function initAppDespuesLogin() {
    showApp();
    initSeccion(1).then(() => {});
}

async function initSeccion(n) {
    if (n === 1) {
        App.loaded = true;
        await renderDashboard();
        showView('dashboard');
        actualizarPapeleraCount();
    }
}

function init() {
    initDefaultUsers();
    initDatalists();
    initSelectsFormulario();
    initForm();
    bindChipInputs();
    initValidacionVivo();
    initFormListeners();
    initNavigation();
    initBusqueda();
    initFichaActions();
    initUserMenu();
    initLogin();
    initUserModal();

    if (checkSession()) {
        showApp();
        initAppDespuesLogin();
    } else {
        showLoginScreen();
    }
}

document.addEventListener('DOMContentLoaded', init);
