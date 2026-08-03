/* ============================================================
   auth.js — Autenticación local, usuarios y roles
   ============================================================ */

const ROLE_LABELS = { admin: 'Administrador', creador: 'Creador', editor: 'Editor' };

function hashPassword(pass) {
    let hash = 5381;
    for (let i = 0; i < pass.length; i++) {
        hash = ((hash << 5) + hash) + pass.charCodeAt(i);
    }
    return 'h_' + (hash >>> 0).toString(36);
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function initDefaultUsers() {
    const users = getUsers();
    if (users.length) return users;
    const def = [
        { login: 'admin', pass: hashPassword('admin123'), name: 'Administrador', role: 'admin' },
        { login: 'creador', pass: hashPassword('creador123'), name: 'Creador', role: 'creador' },
        { login: 'editor', pass: hashPassword('editor123'), name: 'Editor', role: 'editor' }
    ];
    saveUsers(def);
    return def;
}

function loginUser(login, pass) {
    const users = getUsers();
    const u = users.find(x => x.login.toLowerCase() === login.trim().toLowerCase());
    if (!u || u.pass !== hashPassword(pass)) return false;
    App.currentUser = { login: u.login, name: u.name, role: u.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(App.currentUser));
    return true;
}

function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    App.currentUser = null;
    location.reload();
}

function checkSession() {
    try {
        const s = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (s && s.login) { App.currentUser = s; return true; }
    } catch { }
    return false;
}

function hasRole(roles) {
    if (!App.currentUser) return false;
    if (roles === 'admin') return App.currentUser.role === 'admin';
    return roles.split(',').includes(App.currentUser.role);
}

function applyRoleRestrictions() {
    $$('[data-role]').forEach(el => {
        const ok = hasRole(el.dataset.role);
        el.hidden = !ok;
        if (!ok) el.classList.add('is-hidden-role');
    });
}

function showLoginScreen() {
    $('#app').hidden = true;
    $('#loginScreen').hidden = false;
    setTimeout(() => $('#loginUser').focus(), 50);
}

function showApp() {
    $('#loginScreen').hidden = true;
    $('#app').hidden = false;
    const u = App.currentUser;
    $('#userName').textContent = u.name || u.login;
    $('#userRole').textContent = ROLE_LABELS[u.role] || u.role;
    $('#userAvatar').textContent = (u.name || u.login || '?').charAt(0).toUpperCase();
    $('#userAvatar').classList.add('avatar-' + u.role);
    applyRoleRestrictions();
}

/* ---------- Gestión de usuarios ---------- */
function renderUsersList() {
    const cont = $('#usersList');
    const users = getUsers();
    cont.innerHTML = users.map(u => `
        <div class="user-row">
            <div class="user-row-info">
                <strong>${escapeHtml(u.name)}</strong>
                <span class="muted-text">${escapeHtml(u.login)} · ${ROLE_LABELS[u.role] || u.role}</span>
            </div>
            ${u.login !== 'admin' ? `<button class="btn btn-ghost btn-sm" data-del-user="${escapeHtml(u.login)}">Eliminar</button>` : ''}
        </div>`).join('');
    $$('[data-del-user]').forEach(b => {
        b.addEventListener('click', () => {
            if (!confirm(`¿Eliminar al usuario "${b.dataset.delUser}"?`)) return;
            const users2 = getUsers().filter(u => u.login !== b.dataset.delUser);
            saveUsers(users2);
            renderUsersList();
            renderCredentials();
            showToast('Usuario eliminado');
        });
    });
}

function renderCredentials() {
    const users = getUsers();
    $('#credsTable').innerHTML = `
        <thead><tr><th>Rol</th><th>Usuario</th><th>Contraseña</th></tr></thead>
        <tbody>${users.map(u => `
            <tr>
                <td>${ROLE_LABELS[u.role] || u.role}</td>
                <td><code>${escapeHtml(u.login)}</code></td>
                <td><code>${escapeHtml(u.login)}123</code></td>
            </tr>`).join('')}
        </tbody>`;
}
