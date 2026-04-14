// ============================================================
// STORE — abstracts "where does data live" so the UI doesn't care.
// - If Firebase is configured: live Firestore sync (main doc + photos subcollection)
// - Else: localStorage (single-device, no sync)
// Photos are compressed client-side and stored as base64 in a separate
// Firestore subcollection so the main doc never bloats.
// ============================================================

import { firebaseConfig } from './firebase-config.js';
import { SEEDS } from './seeds.js';

const LOCAL_KEY = 'wedding-2027-data';
const isConfigured = !String(firebaseConfig.apiKey).startsWith('PASTE_');

let state = null;
let photos = {};
let listeners = new Set();
let firestore = null;
let firestoreDoc = null;
let photosCol = null;
let fsModule = null;
let syncStatus = 'local';
const DOC_PATH = ['weddings', 'ordy-devan-2027'];

export function getState() { return state ? { ...state, _photos: photos } : null; }
export function getSyncStatus() { return syncStatus; }
export function isFirebaseOn() { return isConfigured; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  const s = getState();
  listeners.forEach(fn => { try { fn(s); } catch (e) { console.error(e); } });
}

function setStatus(s) { syncStatus = s; notify(); }

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('localStorage read failed', e); }
  return null;
}
function saveLocal() {
  try {
    const snapshot = { ...state, _photos: photos };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
  } catch (e) { console.warn('localStorage write failed', e); }
}

async function compressImage(file, maxDim = 1200, quality = 0.78) {
  if (!file.type.startsWith('image/')) return await fileToDataURL(file);
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    let blob;
    if (canvas.convertToBlob) blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    else blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    return await blobToDataURL(blob);
  } catch (e) {
    console.warn('Image compression failed, using raw file', e);
    return await fileToDataURL(file);
  }
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function blobToDataURL(blob) { return fileToDataURL(blob); }

async function initFirebase() {
  setStatus('syncing');
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  fsModule = fs;

  const app = initializeApp(firebaseConfig);
  firestore = fs.getFirestore(app);
  try { await fs.enableIndexedDbPersistence(firestore).catch(() => {}); } catch {}

  firestoreDoc = fs.doc(firestore, DOC_PATH[0], DOC_PATH[1]);
  photosCol = fs.collection(firestore, DOC_PATH[0], DOC_PATH[1], 'photos');

  fs.onSnapshot(firestoreDoc, {
    next: (snap) => {
      if (snap.exists()) {
        state = snap.data();
        setStatus(navigator.onLine ? 'online' : 'offline');
        notify();
      } else {
        state = structuredClone(SEEDS);
        fs.setDoc(firestoreDoc, state).catch(console.error);
        setStatus('online');
        notify();
      }
    },
    error: (err) => { console.error('Firestore error', err); setStatus('offline'); }
  });

  fs.onSnapshot(photosCol, {
    next: (snap) => {
      const next = {};
      snap.forEach(d => { next[d.id] = d.data().data; });
      photos = next;
      notify();
    },
    error: (err) => { console.error('Photos sync error', err); }
  });

  window.addEventListener('online', () => setStatus('online'));
  window.addEventListener('offline', () => setStatus('offline'));

  _setDoc = (data) => fs.setDoc(firestoreDoc, data);
}

let _setDoc = null;

export async function init() {
  if (isConfigured) {
    try { await initFirebase(); return; }
    catch (e) { console.error('Firebase init failed, falling back to local', e); }
  }
  const loaded = loadLocal();
  if (loaded) {
    photos = loaded._photos || {};
    delete loaded._photos;
    state = loaded;
  } else {
    state = structuredClone(SEEDS);
    photos = {};
  }
  saveLocal();
  setStatus('local');
  notify();
}

export async function mutate(mutator) {
  const next = structuredClone(state);
  mutator(next);
  next.meta = next.meta || {};
  next.meta.updatedAt = new Date().toISOString();
  state = next;
  notify();
  if (isConfigured && _setDoc) {
    setStatus('syncing');
    try {
      await _setDoc(next);
      setStatus(navigator.onLine ? 'online' : 'offline');
    } catch (e) {
      console.error('Save failed', e);
      setStatus('offline');
    }
  } else {
    saveLocal();
  }
}

export async function uploadPhoto(file) {
  const dataURL = await compressImage(file);
  const id = 'ph_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  if (isConfigured && firestore && fsModule) {
    await fsModule.setDoc(
      fsModule.doc(firestore, DOC_PATH[0], DOC_PATH[1], 'photos', id),
      { data: dataURL, createdAt: Date.now() }
    );
  } else {
    photos = { ...photos, [id]: dataURL };
    saveLocal();
    notify();
  }
  return id;
}

export async function deletePhoto(photoId) {
  if (!photoId) return;
  if (isConfigured && firestore && fsModule) {
    try {
      await fsModule.deleteDoc(fsModule.doc(firestore, DOC_PATH[0], DOC_PATH[1], 'photos', photoId));
    } catch (e) { console.warn('Delete photo failed', e); }
  } else {
    const next = { ...photos };
    delete next[photoId];
    photos = next;
    saveLocal();
    notify();
  }
}

export function exportData() {
  return JSON.stringify({ ...state, _photos: photos }, null, 2);
}
export async function importData(json) {
  const parsed = JSON.parse(json);
  const incomingPhotos = parsed._photos || {};
  delete parsed._photos;
  await mutate((s) => { Object.assign(s, parsed); });
  if (isConfigured && fsModule) {
    for (const [id, data] of Object.entries(incomingPhotos)) {
      try {
        await fsModule.setDoc(fsModule.doc(firestore, DOC_PATH[0], DOC_PATH[1], 'photos', id),
          { data, createdAt: Date.now() });
      } catch (e) { console.warn('photo import failed', id, e); }
    }
  } else {
    photos = incomingPhotos;
    saveLocal();
    notify();
  }
}
export async function resetToSeeds() {
  await mutate((s) => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, structuredClone(SEEDS)); });
}
