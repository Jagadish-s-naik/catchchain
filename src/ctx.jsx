import React, {createContext, useContext, useState, useEffect} from "react";
import {getSession, setSession, clearSession, getStoredLang, setStoredLang, onDataChange} from './data.js';
import {t as translate} from './i18n.js';

const AppContext = createContext(null);

function applyGT(lang){
    if (lang === 'en'){
        const exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = `googtrans=; ${exp}`;
        document.cookie = `googtrans=; ${exp}; domain=${location.hostname}`;
        window.location.reload();

    }else{
        document.cookie = `googtrans=/en/${lang}; path=/`;
        const tryCombo = (n = 0)=>{
            const el = document.querySelector('.goog-te-combo');
            if (el) { el.value = lang; el.dispatchEvent(new Event('change'));}
            else if (n < 30) setTimeout(() => tryCombo(n + 1), 200);
        };
        tryCombo();
    }
}

export function AppProvider({ children}){
    const [lang, setLangState] = useState(() => getStoredLang());
    const [session, setSessionState] = useState(() => getSession());
    const [toast , setToast] = useState(null);
    const [tick, setTick] = useState(0);

    const setLang =  (n1) => { setLangState(n1); setStoredLang(n1); applyGT(n1); };
    const t = (k, p ={}) => translate(k, p);

    const login = (party) => {
        const s = {partyId: party.id, role: party.role, name: party.name};
        setSession(s) ; setSessionState(s);
    };

    const logout =() => { clearSession(); setSessionState(null);};
    const showToast = (message, type = 'info') => setToast({message, type});
    const hideToast = () => setToast(null);

    useEffect(() => {const unsub = onDataChange(() => setTick((n) => n + 1)); return unsub;}, []);
    useEffect(() => {
        if (!toast) return;
        const id =  setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(id);

    }, [toast]);

    useEffect(() => {
        if (lang === 'kn') applyGT('kn');
    }, []);

    return (
        <AppContext.Provider value={{lang, setLang, t, session,login,logout,toast, showToast, hideToast, tick}}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
};
