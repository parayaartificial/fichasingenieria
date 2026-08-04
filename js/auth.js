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

function randomPassword() {
    const mayus = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const minus = 'abcdefghjkmnpqrstuvwxyz';
    const nums = '23456789';
    const chars = mayus + minus + nums;
    let p = mayus[Math.floor(Math.random() * mayus.length)] + nums[Math.floor(Math.random() * nums.length)];
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p.split('').sort(() => Math.random() - 0.5).join('');
}

function seedUser(login, name, role) {
    const pass = randomPassword();
    return {
        login, name, role,
        pass: hashPassword(pass),
        initPass: pass,
        mustChangePass: true,
        seed: true,
        createdAt: Date.now()
    };
}

const SEED_NUEVOS_USUARIOS = [
    ['eduardo', 'Eduardo', 'creador'],
    ['francisco', 'Francisco', 'creador'],
    ['victor', 'Victor', 'creador'],
    ['mario', 'Mario', 'creador'],
    ['marcela', 'Marcela', 'admin'],
    ['fernando', 'Fernando', 'admin'],
    ['daisy', 'Daisy', 'admin']
];

function initDefaultUsers() {
    const users = getUsers();
    if (users.length) return ensureSeedUsers();
    const def = [
        { login: 'admin', pass: hashPassword('admin123'), name: 'Administrador', role: 'admin', seed: true, createdAt: Date.now() },
        { login: 'creador', pass: hashPassword('creador123'), name: 'Creador', role: 'creador', seed: true, createdAt: Date.now() },
        { login: 'editor', pass: hashPassword('editor123'), name: 'Editor', role: 'editor', seed: true, createdAt: Date.now() }
    ];
    saveUsers(def);
    return ensureSeedUsers();
}

function ensureSeedUsers() {
    const users = getUsers();
    let changed = false;
    SEED_NUEVOS_USUARIOS.forEach(([login, name, role]) => {
        if (!users.some(u => u.login.toLowerCase() === login)) {
            users.push(seedUser(login, name, role));
            changed = true;
        }
    });
    if (changed) saveUsers(users);
    return users;
}

function loginUser(login, pass) {
    const users = getUsers();
    const u = users.find(x => x.login.toLowerCase() === login.trim().toLowerCase());
    if (!u || u.pass !== hashPassword(pass)) return false;
    u.lastLogin = Date.now();
    saveUsers(users);
    if (u.mustChangePass) {
        App.pendingChangeUser = { login: u.login, name: u.name };
        return true;
    }
    App.currentUser = { login: u.login, name: u.name, role: u.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(App.currentUser));
    return true;
}

function changePassword(login, newPass) {
    const users = getUsers();
    const u = users.find(x => x.login.toLowerCase() === login.toLowerCase());
    if (!u) return false;
    u.pass = hashPassword(newPass);
    u.mustChangePass = false;
    u.initPass = undefined;
    u.passwordChangedAt = Date.now();
    saveUsers(users);
    return true;
}

function resetUserPassword(login) {
    const users = getUsers();
    const u = users.find(x => x.login.toLowerCase() === login.toLowerCase());
    if (!u) return null;
    const pass = randomPassword();
    u.pass = hashPassword(pass);
    u.initPass = pass;
    u.mustChangePass = true;
    saveUsers(users);
    return pass;
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

/* ---------- Gestión de usuarios (solo admin) ---------- */
function renderUsersList() {
    const cont = $('#usersList');
    const users = getUsers();
    cont.innerHTML = users.map(u => `
        <div class="user-row">
            <div class="user-row-info">
                <strong>${escapeHtml(u.name)}</strong>
                <span class="muted-text">@${escapeHtml(u.login)} · ${ROLE_LABELS[u.role] || u.role}</span>
                <span class="user-row-state ${u.mustChangePass ? 'is-pending' : 'is-ok'}">
                    ${u.mustChangePass ? 'Contraseña temporal · sin cambiar' : 'Contraseña activa'}
                    ${u.lastLogin ? ` · Último ingreso: ${fechasHora(u.lastLogin)}` : ''}
                </span>
                <span class="user-row-temp" data-temp="${escapeHtml(u.login)}" hidden></span>
            </div>
            <div class="user-row-actions">
                <button class="btn btn-ghost btn-sm" data-reset-pass="${escapeHtml(u.login)}">Resetear contraseña</button>
                ${!u.seed && u.login !== 'admin' ? `<button class="btn btn-ghost btn-sm" data-del-user="${escapeHtml(u.login)}">Eliminar</button>` : ''}
            </div>
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
    $$('[data-reset-pass]').forEach(b => {
        b.addEventListener('click', () => {
            const pass = resetUserPassword(b.dataset.resetPass);
            if (!pass) return;
            const tempEl = cont.querySelector(`[data-temp="${b.dataset.resetPass}"]`);
            if (tempEl) {
                tempEl.hidden = false;
                tempEl.textContent = 'Contraseña temporal: ' + pass + ' (se pedirá cambiarla en el próximo ingreso)';
            }
            renderCredentials();
            showToast('Contraseña restablecida');
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
                <td>${u.mustChangePass && u.initPass
                    ? `<code>${escapeHtml(u.initPass)}</code>`
                    : '<span class="muted-text">Cambiada por el usuario</span>'}</td>
            </tr>`).join('')}
        </tbody>`;
}
