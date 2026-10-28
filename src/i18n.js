import en from  './en.json';

export function t(key, params = {}){
    let str = en[key] ?? key;
    if (typeof str !== 'string') return String(str);
    for (const [k, v] of Object.entries(params)){
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return str;
}

