export const TOL = 5;
export const ROLES = ['fisher', 'agent', 'transporter', 'wholesaler', 'retailer', 'processor', 'officer'];
export const SPECIES = ['Sardine', 'Mackerel', 'Seer','Ribbonfish', 'Anchovy', 'Prawn','Other'];
export const HARBOURS = ['Bunder', 'Panambur', 'Ullal', 'Surathkal', 'Mangaluru', 'Malpe'];

export function hash53(str){
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++){
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0'); 
}

export const pct = (a, b) => a ? Math.round(Math.abs(a - b) / a * 1000) / 10 : 0;

export function hashHandover(h){
    return hash53([h.batchId, h.seq, h.fromId, h.toId, h.kgSent,
        h.kgReceived ?? '', h.price, h.priceAgreed ?? '',
        h.iceIn ? '1' : '0', h.iceInRecv != null ? (h.iceInRecv ? '1' : '0') :'',
        h.sentAt , h.receivedAt ?? '', h.prevHash].join('|'));
}

export const holder = (batch, chain) => chain.length ? chain[chain.length - 1].toId : batch.ownerId;

export function available(batch, chain){
    if (!chain || chain.length === 0 ) return batch.kg;
    const last = chain[chain.length -1];
    return last.status === 'sent' ? 0 : (last.kgReceived ?? 0);
}

export function dispatch(batch, chain, fromId, toId, kg, price, iced, iceIn, now){
    if (holder(batch, chain) !== fromId) throw new Error('errNotHolder');
    const last = chain.length ? chain[chain.length -1] : null;
    if (last && last.status === 'sent') throw new Error('errPending');
    const avail = available(batch, chain);
    if (!kg || kg <= 0|| kg> avail) throw new Error('errKg');
    if (!price || price <= 0) throw new Error('errPrice');
    if (fromId === toId) throw new Error('errSame');
    const prevHash = last ? last.hash : 'GENESIS';
    const seq = chain.length + 1;
    const ho = {id: `HO-${2000 + seq}`, batchId: batch.id, seq, fromId, toId,
        kgSent: kg, kgReceived:null, price, priceAgreed:null,sentAt:now, receivedAt: null,
        iced, iceIn, iceInRecv:null, status: 'sent', paid:false, paidAt: null, prevHash, hash: ''};
    ho.hash = hashHandover(ho);
    return ho;
}

export function confirm(h, kgReceived, priceAgreed, iceInRecv, now){
    const wDiff = pct(h.kgSent, kgReceived), pDiff = pct(h.price, priceAgreed);
    const iceAgreed = h.iceIn === iceInRecv;
    const updated = {...h, kgReceived, priceAgreed, iceInRecv, receivedAt: now,
        status: (wDiff > TOL || pDiff > TOL) ? 'disputed' : 'received', hash:''};
    updated.hash = hashHandover(updated);
    const disputes = [];
    if (wDiff > TOL) disputes.push({ handoverId: h.id, batchId: h.batchId,type: 'weight', expected: h.kgSent, actual:kgReceived, diffPct: wDiff, iceAgreed, status: 'open', note: '', createdAt: now });
    if (pDiff > TOL) disputes.push({ handoverId: h.id, batchId: h.batchId, type: 'price', expected: h.price, actual: priceAgreed, diffPct: pDiff, iceAgreed, status:'open', note:'', createdAt: now});
    return { handover: updated, disputes};
}

export function verifyChain(chain){
    for (let i = 0; i < chain.length; i ++){
        const h = chain[i];
        if (h.prevHash !== (i === 0 ? 'GENESIS' : chain[i-1].hash)) return { ok: false, brokenAt: h.seq};
        if (hashHandover(h) !== h.hash) return { ok: false, brokenAt: h.seq};
    }
    return {ok: true, brokenAt: null};

}


export function stageHours(batch, chain){
    const toH = (ms) => Math.round(ms / 36e5 * 10) / 10;
    const stages = [];
    if (!chain.length) return stages;
    stages.push({key: 'landing', hours: toH(chain[0].sentAt - batch.landedAt)});
    for (let i = 0; i < chain.length; i++){
      const h = chain[i];
      if (h.receivedAt) {
            stages.push({ key: `transit_${h.seq}`, hours: toH(h.receivedAt - h.sentAt) });
            if (i < chain.length - 1) stages.push({ key: `hold_${h.seq}`, hours: toH(chain[i + 1].sentAt - h.receivedAt)});
        }
    }
    const last = chain[chain.length -1 ];
    stages.push({key: 'total', hours: toH((last.receivedAt || last.sentAt) - batch.landedAt)});
    return stages;
}

export const overdue = (h,now, hrs = 24) => Boolean(h.receivedAt && !h.paid && (now - h.receivedAt) > hrs * 3.6e6);
export const amount = (h) => h.kgReceived == null ? 0 : Math.round(h.kgReceived * (h.priceAgreed ?? h.price));

export function summarize({batches, handovers, disputes, parties }, now){
    const rcvd = handovers.filter((h) => h.status === 'received' || h.status === 'disputed');
    const totalKg = batches.reduce((s, b) => s + b.kg, 0);
    const lossKg = Math.round(rcvd.reduce((s, h) => s + ((h.kgSent || 0) - (h.kgReceived || 0)), 0) * 10) / 10;
    const group = (arr, key) => Object.entries(arr.reduce((a, x) => { a[x[key]] = (a[x[key]] || 0) + x.kg; return a; }, {})).map(([key, kg]) => ({k, kg })).sort((a, b) => b.kg - a.kg);
    const dispCounts = {};
    disputes.forEach((d) => { const ho = handovers.find((h) => h.id === d.handoverId); if (ho) dispCounts[ho.toId] = (dispCounts[ho.toId] || 0) + 1; });
    return {
        totalKg, lossKg, lossPct: totalKg ? Math.round(lossKg / totalKg * 1000) / 10 : 0,
        byHarbour: group(batches.map((b) => ({ harbour: b.harbour, kg: b.kg})).map((x) => ({...x })), 'harbour'),
        bySpecies: group(batches.map((b) => ({species: b.species, kg: b.kg })).map((x) => ({...x })), 'species'),
        openDisputes: disputes.filter((d) => d.status === 'open').length,
        overdueCount: handovers.filter((h) => overdue(h, now)).length,
        flagged: Object.entries(dispCounts).map(([partyId, count]) => ({ partyId, count})).sort((a, b) => b.count - a.count)
    };
}

const toB64u = (s) => btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => {try {let b = s.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; return decodeURIComponent(Array.from(atob(b), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); } catch {return null;} };

export const encodePayload = (batch, chain,names) => toB64u(JSON.stringify({batch, chain, names}));
export function decodePayload(str){
    if (!str) return null;
    try { const raw = fromB64u(str); if (!raw) return null; const d = JSON.parse(raw); return (d && d.batch && d.chain) ? d : null; } catch {return null;}
}