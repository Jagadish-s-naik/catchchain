import QRCode from 'qrcode';
import {dispatch as cDispatch, confirm as cConfirm, encodePayload } from './chain.js';

const VER = 'v1';
const k = { VERSION: 'cc_version', PARTIES: 'cc_parties', BATCHES : 'cc_batches', HANDOVERS: 'cc_handovers', DISPUTES: 'cc_disputes', SESSION: 'cc_session', LANG: 'cc_lang'};
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('catchchain') : null;

function sg(key, fb = null) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb;} catch {return fb;}}
function ss(key, val) {try {localStorage.setItem(key, JSON.stringify(val)); } catch {/* storage full */}}
let _listners = [];
export const onDataChange = (fn) => {_listners.push(fn); return () => {_listners = _listners.filter((f) => f !== fn);};};
function notify() { if (bc) bc.postMessage('change'); _listners.forEach((f) => f());}
if (bc) bc.onmessage = () => _listners.forEach((f) => f());
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => {if (e.key?.startsWith('cc_')) _listners.forEach((f) => f()); });

const lg = (k) => sg(k, []);
const upsert = (list, item) => {const i = list.findIndex((x) => x.id === item.id); if (i >= 0) list[i] = item; else list.push(item); return list;};
function ls(k, item) { const list = upsert(lg(k), item); ss(k, list); notify(); }

export const getParties = () => lg(k.PARTIES);
export const getPartyById = (id) => getParties().find((p) => p.id === id) || null;
export const saveParty = (p) => ls(k.PARTIES, p);
export const getBatches = () => lg(k.BATCHES);
export const getBatchById = (id) => getBatches().find((b) => b.id === id) || null;
export const getHandovers = () => lg(k.HANDOVERS);
export const getHandoverById = (id) => getHandovers().find((h) => h.id  === id) || null;
export const getHandoversByBatch =  (bId) => getHandovers().filter((h) => h.batchId === bId);
export const saveHandover = (h) => ls(k.HANDOVERS, h);
export const getDisputes = () => lg(k.DISPUTES);
export const saveDispute = (d) => ls(k.DISPUTES, d);
export const getSession = () => sg(k.SESSION, null);
export const setSession = (s) => { ss(k.SESSION, s); notify();};
export const clearSession = () => {localStorage.removeItem(k.SESSION); notify(); };
export const getStoredLang = () => sg(k.LANG, 'en') || 'en';
export const setStoredLang = (l) => ss(k.LANG, l);


export function exportData() { return JSON.stringify({ parties: getParties(), batches: getBatches(), handovers: getHandovers(), disputes: getDisputes() }, null, 2);}
export function importData(str) {
    const d = JSON.parse(str);
    if (!d || !Array.isArray(d.parties) || !Array.isArray(d.batches) || !Array.isArray(d.handovers)|| !Array.isArray(d.disputes)) throw new Error('invalid');
    ss(k.PARTIES, d.parties); ss(k.BATCHES, d.batches); ss(k.HANDOVERS, d.handovers); ss(k.DISPUTES, d.disputes); notify();
}

export async function generateQrDataUrl(text, size = 240) { try { return await QRCode.toDataURL(text, {width: size, margin:  2, errorCorrectionLevel: 'L', color: {dark: '#12304A', light: '#FFFFFF'}}); } catch {return null;}}

export function buildBatchQrUrl(batch,  chain, parties){
    const names = {}; parties.forEach((p) => { names[p.id] = p.name;});
    const base = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#/t/${batch.id}`;
    const full =  `${base}?d=${encodePayload(batch, chain, names)}`;
    return full.length > 1800 ? base : full;
}

export const buildHandoverQrUrl = (id) => `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname: ''}#/receive/${id}`;

let _bn = null, _hn = null;
function nextBId() { if (_bn === null) {const e = getBatches().map((b) => parseInt(b.id.replace('CB-',  ''), 10)).filter(Boolean); _bn = e.length ? Math.max(...e) + 1 : 1001;} return `CB-${_bn++}`;}
function nextHId() { if (_hn === null) {const e = getHandovers().map((h) => parseInt(h.id.replace('HO-',  ''), 10)).filter(Boolean); _hn = e.length ? Math.max(...e) + 1 : 2001;} return `HO-${_hn++}`;}

export function createBatch(ownerId, species, harbour, landedAt, kg, price) { const b ={id: nextBId(), species, harbour, landedAt, kg, price, ownerId}; saveBatch(b); return b; }

export function dispatchBatch(batch, fromId, toId, kg, price, iced, iceIn){
    const  chain = getHandoversByBatch(batch.id);
    const ho = cDispatch(batch, chain, fromId, toId, kg, price, iced, iceIn, Date.now());
    const hoWithId = { ...ho, id: nextHId() }; saveHandover(hoWithId); return hoWithId;
}


export function  confirmHandover(handover, kgReceived, priceAgreed, iceInRecv) {
    const { handover: upd, disputes} = cConfirm(handover, kgReceived, priceAgreed, iceInRecv, Date.now());
    saveHandover(upd);
    let dn = getDisputes().length + 1;
    disputes.forEach((d) => saveDispute({...d, id: `DP-${dn++}` }));
    return  {handover: upd, disputes };
}

export  function resolveDispute(dispId, note){
    const dList = getDisputes(), d = dList.find((x) => x.id === dispId); if (!d) return;
    d.status = 'resolved'; d.note = note; ss(k.DISPUTES, dList);
    const open = dList.filter((x) => x.handoverId === d.handoverId &&x.status === 'open');
    if (open.length === 0) {const hl = getHandovers(), h = hl.find((x) => x.id === d.handoverId); if (h && h.status === 'disputed') {h.status = 'resolved'; ss(k.HANDOVERS, hl); }}
    notify();
}


export function tamperHandover(id) { const list = getHandovers(), h = list.find((x) => x.id === id ); if (!h) return null; h.kgSent += 10; ss(k.HANDOVERS, list); notify() ; return h; }

export function seed(){
    if (sg(k.VERSION) === VER && getParties().length > 0) return;
    const P = [
        { id: 'P01', name: 'Ramesh Salian', role: 'fisher', town: 'Bunder', phone: '9845000001', pin: '1234' },
        { id: 'P02', name: 'Sunanda Kharvi', role: 'fisher', town: 'Panambur', phone: '9845000002', pin: '1234' },
        { id: 'P03', name: 'Ramesh Salian', role: 'agent', town: 'Bunder', phone: '9845000003', pin: '1234' },
        { id: 'P04', name: 'Ramesh Salian', role: 'transporter', town: 'Mangaluru', phone: '9845000004', pin: '1234' },
        { id: 'P05', name: 'Ramesh Salian', role: 'wholesaler', town: 'Ullal', phone: '9845000005', pin: '1234' },
        { id: 'P06', name: 'Ramesh Salian', role: 'retailer', town: 'Surathkal', phone: '9845000006', pin: '1234' },
        { id: 'P07', name: 'Ramesh Salian', role: 'processor', town: 'Ullal', phone: '9845000007', pin: '1234' },
        { id: 'P08', name: 'Ramesh Salian', role: 'officer', town: 'Mangalore', phone: '9845000008', pin: '1234' },
    ];

    ss(k.PARTIES, P);
    const t = (h) => Date.now() - h * 36e5;
    const mk = (id, sp, hb, la, kg, pr, ow) => ({id, species: sp, harbour:  hb, landedAt: la,  kg, price: pr, ownerId: ow});
    const ho = (id, b, c, fi, ti, kg, pr, ic, ii, sa) => {const h = cDispatch(b, c, fi, ti, kg, pr, ic, ii, sa); return { ...h, id };};
    const co = (h, kr, pa, ir, ra) => { const { handover: upd} = cConfirm(h, kr, pa, ir, ra); return { ... upd, id: h.id}; };

    const b1 = mk('CB-1001', 'Sardine', 'Bunder', t(120), 200, 80, 'P01');
    let c1 = [];
    const h1 = co(ho('HO-2001', b1, c1, 'P01', 'P03', 200, 80, true, false, t(118)), 198, 80, false, t(115)); c1 = [h1];
    const h2 = co(ho('HO-2002', b1, c1, 'P03', 'P04' , 198, 82, true, false, t(113)), 196, 82, false, t(108));c1 = [h1, h2];
    const h3 = co(ho('HO-2003', b1, c1, 'P04', 'P05', 196, 85, true, false, t(106)), 195, 85, false, t(100)); c1 = [h1, h2, h3];
    const h4 = co(ho('HO-2004', b1, c1, 'P05', 'P06', 195, 90, false, false, t(96)), 194, 90, false, t(90));
    [h1, h2, h3, h4].forEach((h) => {h.paid = true; h.paidAt = t(80) ; });


    const  b2 = mk('CB-1002', 'Mackerel', 'Panambur', t(72), 150, 95, 'P02');
    const  h5r = co(ho('HO-2005', b2, [], 'P02' , 'P05', 100, 95, true, true, t(70)), 94, 95, false, t(65)); 
    const  d1 = { id: 'DP-001', handoverId: 'HO-2005', batchId: 'CB-1002', type: 'weight', expected: 100, actual: 94, diffPct: 6, iceAgreed: false, status: 'open', note: '', createdAt: t(65)};

    const b3 = mk('CB-1003', 'Seer', 'Bunder', t(96), 80, 420, 'P01');
    const h6r = co(ho('HO-2006', b3, [], 'P01','P03', 80, 420, false, false, t(94)), 80, 380, false, t(90));
    const d2 = {id: 'DP-002', handoverId: 'HO-2006', batchId: 'CB-1003' , type: 'price', expected: 420,  actual: 380, diffPct: 9.5 ,  iceAgreed: true, status:  'open', note: '', createdAt: t(90)};
    const h7r = co(ho('HO-2007', b3, [h6r], 'P03' , 'P04', 80, 400, false,false, t(88)),  79,  400, false, t(50));

    const b4 =   mk('CB-1004', 'Ribbonfish' ,  'Panambur', t(10), 60, 110,  'P02');
    const h8 = ho('HO-2008', b4, [], 'P02', 'P03', 60,  110, false, false, t(8));

    ss(k.BATCHES, [b1,b2,b3,b4]);
    ss(k.HANDOVERS, [h1, h2, h3, h4, h5r, h6r , h7r,h8]);
    ss(k.DISPUTES, [d1, d2]);
    ss(k.VERSION, VER); notify();



}






export const saveBatch = (b) => ls(k.BATCHES, b);

export function markHandoverPaid(id, paid = true) {
  const list = getHandovers(), h = list.find((x) => x.id === id);
  if (!h) return null;
  h.paid = paid; h.paidAt = paid ? Date.now() : null;
  ss(k.HANDOVERS, list); notify(); return h;
}

export function resetDemo() {
  [k.VERSION, k.PARTIES, k.BATCHES, k.HANDOVERS, k.DISPUTES].forEach((key) => localStorage.removeItem(key));
  _bn = null; _hn = null;
  seed();
}
