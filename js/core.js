/* ============================================================
   core.js — Configuración, estado global y utilidades base
   ============================================================ */

const STORAGE_KEY = 'fichas_emergencia';
const USERS_KEY = 'fichas_users';
const SESSION_KEY = 'fichas_session';

const firebaseConfig = {
    apiKey: "AIzaSyBNrdUVNfkmE9cjqPluG7d9bERXWEgaG3E",
    authDomain: "informe-ingenieria.firebaseapp.com",
    projectId: "informe-ingenieria",
    storageBucket: "informe-ingenieria.firebasestorage.app",
    messagingSenderId: "492484682151",
    appId: "1:492484682151:web:28240beb71f559f7f81682"
};
firebase.initializeApp(firebaseConfig);
const db_firestore = firebase.firestore();

/* ---------- Estado global ---------- */
const App = {
    fichas: null,          // caché en memoria (null = aún no cargado)
    currentUser: null,
    currentView: 'dashboard',
    currentFichaId: null,
    currentFilter: 'all',
    currentSearch: '',
    currentImagesAntes: [],
    currentImagesDespues: [],
    currentStep: 1,
    formFicha: null,       // ficha que se está editando/creando
    loaded: false,
    firestoreOk: true
};

/* ---------- Helpers DOM ---------- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function fechas(ms) {
    if (!ms) return '';
    const d = new Date(ms);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
}

function fechasHora(ms) {
    if (!ms) return '';
    const d = new Date(ms);
    return `${fechas(ms)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function esDeHoy(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    const h = new Date();
    return d.getFullYear() === h.getFullYear() &&
           d.getMonth() === h.getMonth() &&
           d.getDate() === h.getDate();
}

/* ---------- Toast ---------- */
function showToast(msg, tipo) {
    const c = $('#toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + (tipo || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.classList.add('is-visible'), 10);
    setTimeout(() => {
        t.classList.remove('is-visible');
        setTimeout(() => t.remove(), 400);
    }, 4000);
}

/* ---------- Modal ---------- */
function openModal(id) {
    $(id).hidden = false;
    $('#overlay').hidden = false;
}
function closeModals() {
    $$('.modal').forEach(m => m.hidden = true);
    $('#overlay').hidden = true;
}

/* ---------- Navegación de vistas ---------- */
function showView(name) {
    App.currentView = name;
    $$('.view').forEach(v => v.hidden = true);
    const target = $('#view-' + name);
    if (target) target.hidden = false;
    $$('.nav-btn').forEach(b => {
        b.classList.toggle('is-active', b.dataset.view === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
