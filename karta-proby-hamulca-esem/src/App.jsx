import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle, CheckCircle, AlertTriangle, Lock, X, Plus, Trash2, Download, Upload,
  LogOut, ArrowDown, ArrowUp, RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

// ===== FIREBASE (ten sam projekt co „Zestawienie pojazdów KD” i „Karta próby hamulca”) =====
const firebaseConfig = {
  apiKey: "AIzaSyDPENv7EmaYfmg_Zkvz7eHmG47aQ_beh_8",
  authDomain: "zestawienie-pojazdow.firebaseapp.com",
  projectId: "zestawienie-pojazdow",
  storageBucket: "zestawienie-pojazdow.firebasestorage.app",
  messagingSenderId: "522920995518",
  appId: "1:522920995518:web:3b96cd98fee98d4c58ccef",
  measurementId: "G-MY6FEBL2N7"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Dane tej aplikacji (jazda esem) są w osobnej kolekcji „kph_esem”,
// więc testy nie ruszają danych „kph_sluzbowy” ani zwykłej karty.
// Zwykła karta próby hamulca używa kolekcji „kph” — tu tylko ją odczytujemy (import listy).
const VEHICLES_DOC = doc(db, 'kph_esem', 'pojazdy');
const UPDATE_DOC = doc(db, 'kph_esem', 'aktualizacja');
const MAIN_CARD_VEHICLES_DOC = doc(db, 'kph', 'pojazdy');
// Lista z aplikacji „przejazd służbowy” — stąd bierzemy masę bez podróżnych, żeby wyliczyć ładunek
const SLUZBOWY_VEHICLES_DOC = doc(db, 'kph_sluzbowy', 'pojazdy');

// ===== USTAWIENIA =====
const ADMIN_PASSWORD = 'KPH2026';
const DEFAULT_UPDATE = { date: '', changes: '' };
// Ciśnienie powietrza w przewodzie głównym — wartość domyślna, gdy pojazd nie ma własnej
const CISNIENIE_PRZEWOD_GLOWNY = 0.5;

const EMPTY_VEHICLE = {
  name: '', masaOgolna: '', masaPusty: '', masaWlasna: '', masaSluzbowa: '', masaHamujaca: '', cisnienieGlowny: '0,5', cisnienie: '',
  hamulecElektro: 'TAK', ukladSterowania: 'TAK', ukladDrzwi: 'TAK', inne: 'TAK',
  sprawdzony: true
};

const YES_NO_FIELDS = [
  { key: 'hamulecElektro', label: 'Hamulec elektrodynamiczny', cardLabel: 'Sprawny hamulec elektrodynamiczny' },
  { key: 'ukladSterowania', label: 'Układ sterowania el.-pneum.', cardLabel: 'Sprawny układ sterowania hamulcem el.-pneum.' },
  { key: 'ukladDrzwi', label: 'Układ zamykania drzwi', cardLabel: 'Sprawny układ zamykania drzwi wejściowych' },
  { key: 'inne', label: 'Inne urządzenia', cardLabel: 'Sprawne inne urządzenia' }
];

// ===== WBUDOWANA LISTA POJAZDÓW (zestawienie pojazdów KD, 20 pozycji) =====
// Masa ogólna z Karty próby hamulca.
// masaPusty = masa ogólna pustego składu (bez ładunku) z zestawienia KD
// masaHamujaca = masa hamująca rzeczywista dla próżnego składu z tego samego zestawienia KD
// „Dane pojazdów … niezbędne do wypełnienia karty próby hamulca dla próżnego składu pociągu”.
const DEFAULT_VEHICLES = [
  {
    "id": "v1",
    "name": "SA108-011",
    "masaOgolna": 59,
    "masaHamujaca": 80,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 51,
    "sprawdzony": false
  },
  {
    "id": "v2",
    "name": "SA132-002",
    "masaOgolna": 98,
    "masaHamujaca": 135,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 77,
    "sprawdzony": true
  },
  {
    "id": "v3",
    "name": "SA134-001 do SA134-002",
    "masaOgolna": 86,
    "masaHamujaca": 135,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 77,
    "sprawdzony": true
  },
  {
    "id": "v4",
    "name": "SA134-003 do SA134-007",
    "masaOgolna": 98,
    "masaHamujaca": 135,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 77,
    "sprawdzony": true
  },
  {
    "id": "v5",
    "name": "SA134-023 do SA134-025",
    "masaOgolna": 98,
    "masaHamujaca": 135,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 77,
    "sprawdzony": true
  },
  {
    "id": "v6",
    "name": "SA135-001 do SA135-003",
    "masaOgolna": 55,
    "masaHamujaca": 69,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 45,
    "sprawdzony": true
  },
  {
    "id": "v7",
    "name": "SA135-004 do SA135-009",
    "masaOgolna": 55,
    "masaHamujaca": 69,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.8,
    "hamulecElektro": "-",
    "ukladSterowania": "-",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 45,
    "sprawdzony": true
  },
  {
    "id": "v8",
    "name": "SA139-010 do SA139-014",
    "masaOgolna": 106,
    "masaHamujaca": 132,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "-",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 88,
    "sprawdzony": true
  },
  {
    "id": "v9",
    "name": "48WEc-024 do 48WEc-036",
    "masaOgolna": 201,
    "masaHamujaca": 358,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.95,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 169,
    "sprawdzony": true
  },
  {
    "id": "v10",
    "name": "31WE-001 do 31WE-005",
    "masaOgolna": 172,
    "masaHamujaca": 281,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 136,
    "sprawdzony": true
  },
  {
    "id": "v11",
    "name": "31WE-020 do 31WE-024",
    "masaOgolna": 172,
    "masaHamujaca": 281,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 136,
    "sprawdzony": true
  },
  {
    "id": "v12",
    "name": "36WEa-011 do 36WEa-016",
    "masaOgolna": 135,
    "masaHamujaca": 217,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 108,
    "sprawdzony": true
  },
  {
    "id": "v13",
    "name": "36WEh-012 do 36WEh-017",
    "masaOgolna": 143,
    "masaHamujaca": 228,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 121.5,
    "sprawdzony": true
  },
  {
    "id": "v14",
    "name": "45WE-019 do 45WE-029",
    "masaOgolna": 207,
    "masaHamujaca": 335,
    "cisnienieGlowny": 0.5,
    "cisnienie": 1.0,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 169,
    "sprawdzony": true
  },
  {
    "id": "v15",
    "name": "EN57-1703",
    "masaOgolna": 138,
    "masaHamujaca": 124,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "-",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 126,
    "sprawdzony": true
  },
  {
    "id": "v16",
    "name": "EN57AKD 1937",
    "masaOgolna": 155,
    "masaHamujaca": 155,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 127.5,
    "sprawdzony": true
  },
  {
    "id": "v17",
    "name": "EN57AKM 1718",
    "masaOgolna": 140,
    "masaHamujaca": 165,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": "",
    "sprawdzony": false
  },
  {
    "id": "v18",
    "name": "EN57AL 1501",
    "masaOgolna": 147,
    "masaHamujaca": 133,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 127.5,
    "sprawdzony": true
  },
  {
    "id": "v19",
    "name": "EN57AL 1542",
    "masaOgolna": 147,
    "masaHamujaca": 133,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 130.6,
    "sprawdzony": true
  },
  {
    "id": "v20",
    "name": "EN67AL 1938",
    "masaOgolna": 145,
    "masaHamujaca": 133,
    "cisnienieGlowny": 0.5,
    "cisnienie": 0.7,
    "hamulecElektro": "TAK",
    "ukladSterowania": "TAK",
    "ukladDrzwi": "TAK",
    "inne": "TAK",
    "masaPusty": 127,
    "sprawdzony": true
  }
];

// ===== POMOCNICZE =====
const toNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  const n = parseFloat(String(val).replace(',', '.'));
  return isNaN(n) ? '' : n;
};

const fmt = (n) => (Math.round(n * 100) / 100).toString().replace('.', ',');

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}.${m}.${y}` : iso;
};

// Masa pojazdu do jazdy esem = masa ogólna − ładunek
// Ładunek = masa ogólna − masa pustego składu (z zestawienia KD).
// Gdy jej brak: masa ogólna − masa własna.
// Gdy nie ma masy własnej: masa ogólna − masa służbowa.
// Gdy podane są obie — odejmujemy masę własną.
const obliczLadunek = (v) => {
  const mo = toNumber(v.masaOgolna);
  if (mo === '') return null;
  const mp = toNumber(v.masaPusty);
  if (mp !== '' && mp > 0) return { ladunek: round2(mo - mp), odjeta: mp, zrodlo: 'masa pustego składu' };
  const mw = toNumber(v.masaWlasna);
  if (mw !== '' && mw > 0) return { ladunek: round2(mo - mw), odjeta: mw, zrodlo: 'masa własna' };
  const ms = toNumber(v.masaSluzbowa);
  if (ms !== '' && ms > 0) return { ladunek: round2(mo - ms), odjeta: ms, zrodlo: 'masa służbowa' };
  const ld = toNumber(v.ladunek); // stary zapis — ładunek wpisany ręcznie
  if (ld !== '') return { ladunek: ld, odjeta: round2(mo - ld), zrodlo: 'ładunek wpisany' };
  return null;
};
const ladunekPojazdu = (v) => obliczLadunek(v)?.ladunek ?? 0;
const masaBezLadunku = (v) => (toNumber(v.masaOgolna) || 0) - ladunekPojazdu(v);
const brakLadunku = (v) => obliczLadunek(v) === null;

// Pojazd ze zwykłej karty → pojazd tej aplikacji (ładunek do uzupełnienia, do sprawdzenia)
const fromMainCard = (v, i) => ({
  id: v.id || 'v' + Date.now() + '_' + i,
  name: v.name || '',
  masaOgolna: v.masaOgolna ?? '',
  masaPusty: v.masaPusty ?? '',
  masaWlasna: v.masaWlasna ?? '',
  masaSluzbowa: v.masaSluzbowa ?? '',
  masaHamujaca: v.masaHamujaca ?? '',
  cisnienieGlowny: v.cisnienieGlowny ?? CISNIENIE_PRZEWOD_GLOWNY,
  cisnienie: v.cisnienie ?? '',
  hamulecElektro: v.hamulecElektro || '-',
  ukladSterowania: v.ukladSterowania || '-',
  ukladDrzwi: v.ukladDrzwi || '-',
  inne: v.inne || '-',
  sprawdzony: v.sprawdzony === true
});

const round2 = (n) => Math.round(n * 100) / 100;
const cisnienieGlownePojazdu = (v) => toNumber(v.cisnienieGlowny) || CISNIENIE_PRZEWOD_GLOWNY;
// sortowanie „naturalne”: 31WE przed 36WEa, EN57-1703 przed EN57AKD itd.
const compareNames = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pl', { numeric: true, sensitivity: 'base' });
const normName = (s) => String(s || '').trim().toLowerCase();

// Łączy listę zwykłej karty (masa ogólna) z listą „przejazd służbowy” (masa bez podróżnych).
// Ładunek = masa ogólna − masa bez podróżnych.
const buildEsemList = (mainList, sluzbowyList) => {
  const main = Array.isArray(mainList) ? mainList : [];
  const sluz = Array.isArray(sluzbowyList) ? sluzbowyList : [];
  const sluzByName = new Map(sluz.map(v => [normName(v.name), v]));
  const used = new Set();

  const list = main.map((v, i) => {
    const base = fromMainCard(v, i);
    const s = sluzByName.get(normName(v.name));
    if (s) {
      used.add(normName(v.name));
      const ms = toNumber(s.masaSluzbowa);
      if (ms !== '' && base.masaSluzbowa === '') base.masaSluzbowa = ms;
    }
    return base;
  });

  // pojazdy, które są tylko w aplikacji „przejazd służbowy”
  sluz.forEach((s, i) => {
    if (used.has(normName(s.name)) || main.some(m => normName(m.name) === normName(s.name))) return;
    list.push({
      ...EMPTY_VEHICLE,
      id: s.id || 'vs' + Date.now() + '_' + i,
      name: s.name || '',
      masaOgolna: s.masaSluzbowa ?? '',
      masaSluzbowa: s.masaSluzbowa ?? '',
      masaHamujaca: s.masaHamujaca ?? '',
      cisnienie: s.cisnienie ?? '',
      hamulecElektro: s.hamulecElektro || '-',
      ukladSterowania: s.ukladSterowania || '-',
      ukladDrzwi: s.ukladDrzwi || '-',
      inne: s.inne || '-',
      sprawdzony: false
    });
  });
  return list;
};

const fetchEsemList = async () => {
  // Podstawą jest wbudowana lista pojazdów; z karty „przejazd służbowy” bierzemy tylko masę bez podróżnych
  const sluzSnap = await getDoc(SLUZBOWY_VEHICLES_DOC).catch(() => null);
  const sluzList = sluzSnap?.exists() ? sluzSnap.data().list : [];
  const list = buildEsemList(DEFAULT_VEHICLES, []);
  // dopasowanie masy służbowej po nazwie — bez dopisywania pojazdów spoza wbudowanej listy
  const sluzByName = new Map((Array.isArray(sluzList) ? sluzList : []).map(v => [normName(v.name), v]));
  return list.map(v => {
    const sv = sluzByName.get(normName(v.name));
    const ms = sv ? toNumber(sv.masaSluzbowa) : '';
    return (ms !== '' && v.masaSluzbowa === '') ? { ...v, masaSluzbowa: ms } : v;
  });
};

// ===== UŁAMEK DO WZORÓW =====
function Fraction({ top, bottom }) {
  return (
    <span className="inline-flex flex-col items-center align-middle mx-1 leading-tight">
      <span className="px-1">{top}</span>
      <span className="px-1 border-t border-slate-800">{bottom}</span>
    </span>
  );
}

// Znak ostrzegawczy z wykrzyknikiem (po obu stronach tytułu)
function WarningSign() {
  return (
    <svg viewBox="0 0 64 58" aria-hidden="true" className="w-8 h-7 sm:w-14 sm:h-12 flex-shrink-0 drop-shadow-sm">
      <path d="M32 3 L61 54 H3 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="3" strokeLinejoin="round" />
      <rect x="28.5" y="18" width="7" height="21" rx="3.5" fill="#fff" />
      <circle cx="32" cy="46" r="4" fill="#fff" />
    </svg>
  );
}

function RoundBadge({ up }) {
  const label = up ? 'Wynik zaokrąglamy w górę' : 'Wynik zaokrąglamy w dół';
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${
        up ? 'bg-yellow-400 text-blue-900' : 'bg-blue-900 text-white'
      }`}
    >
      {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
    </span>
  );
}

function ResultRow({ label, sub, value, unit, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-dashed border-slate-300 last:border-b-0">
      <div>
        <p className="text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-right whitespace-nowrap tabular-nums ${strong ? 'text-2xl font-bold text-blue-900' : 'text-xl font-semibold text-slate-900'}`}>
        {value}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
    </div>
  );
}

export default function App() {
  // Wbudowana lista jest widoczna od razu, także bez połączenia z bazą
  const [vehicles, setVehicles] = useState(() => buildEsemList(DEFAULT_VEHICLES, []));
  const [vehiclesLoaded, setVehiclesLoaded] = useState(true);
  const [autoList, setAutoList] = useState(true); // lista pobrana automatycznie, jeszcze nie zapisana
  const [updateInfo, setUpdateInfo] = useState(DEFAULT_UPDATE);

  const [vehicle1, setVehicle1] = useState('');
  const [vehicle2, setVehicle2] = useState('');
  const [procentWymagany, setProcentWymagany] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [sortAlfabetyczne, setSortAlfabetyczne] = useState(true);
  const [formError, setFormError] = useState('');

  // tryb administratora
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newVehicle, setNewVehicle] = useState(EMPTY_VEHICLE);
  const [addError, setAddError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [saveError, setSaveError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const vehiclesDirty = useRef(false);
  const updateDirty = useRef(false);

  // zmiany admina oznaczamy do zapisu w bazie
  const changeVehicles = (updater) => { vehiclesDirty.current = true; setAutoList(false); setVehicles(updater); };
  const changeUpdateInfo = (value) => { updateDirty.current = true; setUpdateInfo(value); };

  // ===== ODCZYT Z BAZY NA ŻYWO =====
  useEffect(() => {
    const fallback = setTimeout(() => setVehiclesLoaded(true), 6000);

    let seeded = false;
    const unsubVehicles = onSnapshot(VEHICLES_DOC, async snap => {
      if (snap.metadata.hasPendingWrites) return;
      const list = snap.exists() ? snap.data().list : null;
      if (snap.exists() && typeof snap.data().sortAlfabetyczne === 'boolean') setSortAlfabetyczne(snap.data().sortAlfabetyczne);
      if (Array.isArray(list) && list.length > 0) {
        // uzupełnij masę pustego składu z wbudowanego zestawienia, jeśli w bazie jej jeszcze nie ma
        const defByName = new Map(DEFAULT_VEHICLES.map(d => [normName(d.name), d]));
        setVehicles(list.map(v => {
          const d = defByName.get(normName(v.name));
          return (v.masaPusty === undefined && d && d.masaPusty !== '') ? { ...v, masaPusty: d.masaPusty } : v;
        }));
        setAutoList(false);
        setVehiclesLoaded(true);
        return;
      }
      // Własna lista jeszcze pusta → wbudowana lista + ładunek z karty „przejazd służbowy” (bez zapisu)
      if (!seeded) {
        seeded = true;
        try {
          const auto = await fetchEsemList();
          if (auto.length > 0) { setVehicles(auto); setAutoList(true); }
        } catch (e) {
          console.error('Nie udało się pobrać list z pozostałych kart:', e);
        }
      }
      setVehiclesLoaded(true);
    }, err => {
      console.error('Nie udało się pobrać listy pojazdów:', err);
      setVehiclesLoaded(true);
    });

    const unsubUpdate = onSnapshot(UPDATE_DOC, snap => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) setUpdateInfo({ ...DEFAULT_UPDATE, ...snap.data() });
    }, err => console.error('Nie udało się pobrać informacji o aktualizacji:', err));

    return () => { clearTimeout(fallback); unsubVehicles(); unsubUpdate(); };
  }, []);

  // ===== ZAPIS DO BAZY =====
  const saveToDb = async (ref, data) => {
    setSaveStatus('saving');
    try {
      await setDoc(ref, data);
      setSaveStatus('saved');
      setSaveError('');
    } catch (e) {
      console.error('Błąd zapisu:', e);
      setSaveStatus('error');
      setSaveError(e.message || String(e));
    }
  };

  useEffect(() => {
    if (!vehiclesDirty.current) return;
    setSaveStatus('saving');
    const t = setTimeout(() => {
      vehiclesDirty.current = false;
      saveToDb(VEHICLES_DOC, { list: vehicles, sortAlfabetyczne, zmieniono: new Date().toISOString() });
    }, 800);
    return () => clearTimeout(t);
  }, [vehicles, sortAlfabetyczne]);

  // Lista w kolejności do wyświetlenia (wybór pojazdu i panel administratora)
  const orderedVehicles = sortAlfabetyczne ? [...vehicles].sort(compareNames) : vehicles;

  const toggleSort = (on) => {
    vehiclesDirty.current = true;
    setAutoList(false);
    // przy wyłączaniu zapamiętujemy bieżący układ alfabetyczny jako punkt startowy
    if (!on) setVehicles(list => [...list].sort(compareNames));
    setSortAlfabetyczne(on);
  };

  const moveVehicle = (id, dir) => {
    changeVehicles(list => {
      const i = list.findIndex(v => v.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  useEffect(() => {
    if (!updateDirty.current) return;
    setSaveStatus('saving');
    const t = setTimeout(() => {
      updateDirty.current = false;
      saveToDb(UPDATE_DOC, { date: updateInfo.date || '', changes: updateInfo.changes || '' });
    }, 800);
    return () => clearTimeout(t);
  }, [updateInfo]);

  // jeśli wybrany pojazd zniknął z listy — czyścimy wybór
  useEffect(() => {
    if (vehicle1 && !vehicles.some(v => v.id === vehicle1)) setVehicle1('');
    if (vehicle2 && !vehicles.some(v => v.id === vehicle2)) setVehicle2('');
  }, [vehicles, vehicle1, vehicle2]);

  // ===== OBLICZENIA =====
  const selected = [vehicle1, vehicle2]
    .map(id => vehicles.find(v => v.id === id))
    .filter(Boolean);

  const pw = toNumber(procentWymagany);
  const pwError = procentWymagany !== '' && (pw === '' || pw <= 0 || pw > 250)
    ? 'Wpisz procent większy od 0 (np. 65).' : '';

  const calculateResults = () => {
    if (selected.length === 0 || pw === '' || pwError) return null;
    const sumaMasOgolnych = selected.reduce((s, v) => s + (toNumber(v.masaOgolna) || 0), 0);
    const sumaLadunku = selected.reduce((s, v) => s + ladunekPojazdu(v), 0);
    // Masa ogólna składu = masa ogólna pociągu = suma mas ogólnych pomniejszona o ładunek
    const masaOgolna = selected.reduce((s, v) => s + masaBezLadunku(v), 0);
    const masaHamujacaRzeczywista = selected.reduce((s, v) => s + (toNumber(v.masaHamujaca) || 0), 0);
    if (masaOgolna <= 0) return null;

    const masaHamujacaWymaganaDokladna = masaOgolna * pw / 100;
    const masaHamujacaWymagana = Math.ceil(masaHamujacaWymaganaDokladna - 1e-9);
    const procentDokladny = 100 * masaHamujacaRzeczywista / masaOgolna;
    const procentMasyHamujacejRzeczywistej = Math.floor(procentDokladny + 1e-9);
    const cisnienie = Math.max(...selected.map(v => toNumber(v.cisnienie) || 0));
    const cisnienieGlowny = Math.max(...selected.map(cisnienieGlownePojazdu));

    const isSuccess = masaHamujacaRzeczywista >= masaHamujacaWymagana &&
                      procentMasyHamujacejRzeczywistej >= pw;

    return {
      sumaMasOgolnych, sumaLadunku, masaOgolna, masaHamujacaRzeczywista,
      masaHamujacaWymagana, masaHamujacaWymaganaDokladna,
      procentMasyHamujacejRzeczywistej, procentDokladny,
      cisnienie, cisnienieGlowny, isSuccess
    };
  };

  const results = calculateResults();
  const unverified = selected.filter(v => v.sprawdzony === false);
  const noLoad = selected.filter(brakLadunku);

  // ===== LOGOWANIE =====
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Nieprawidłowe hasło.');
    }
  };

  const closeLogin = () => { setShowLogin(false); setPassword(''); setLoginError(''); };

  const handleLogout = () => { setIsAdmin(false); setAdminMessage(''); setAddError(''); };

  // ===== EDYCJA POJAZDÓW =====
  const updateVehicle = (id, field, value) => {
    changeVehicles(list => list.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const deleteVehicle = (id) => {
    const v = vehicles.find(x => x.id === id);
    if (window.confirm(`Usunąć pojazd „${v?.name || 'bez nazwy'}” z listy?`)) {
      changeVehicles(list => list.filter(x => x.id !== id));
    }
  };

  const handleAddVehicle = () => {
    const name = newVehicle.name.trim();
    const mo = toNumber(newVehicle.masaOgolna);
    const mp = toNumber(newVehicle.masaPusty);
    const mw = toNumber(newVehicle.masaWlasna);
    const msl = toNumber(newVehicle.masaSluzbowa);
    const mh = toNumber(newVehicle.masaHamujaca);
    const p = toNumber(newVehicle.cisnienie);
    const pg = toNumber(newVehicle.cisnienieGlowny);

    if (!name) return setAddError('Wpisz nazwę serii pojazdów.');
    if (vehicles.some(v => v.name.trim().toLowerCase() === name.toLowerCase()))
      return setAddError('Pojazd o tej nazwie już jest na liście.');
    if (mo === '' || mo <= 0) return setAddError('Wpisz masę ogólną większą od zera.');
    if (mp === '' && mw === '' && msl === '') return setAddError('Wpisz masę pustego składu, masę własną lub masę służbową (potrzebna do wyliczenia ładunku).');
    if (mp !== '' && (mp <= 0 || mp > mo)) return setAddError('Masa pustego składu musi być większa od zera i nie większa od masy ogólnej.');
    if (mw !== '' && (mw <= 0 || mw > mo)) return setAddError('Masa własna musi być większa od zera i nie większa od masy ogólnej.');
    if (msl !== '' && (msl <= 0 || msl > mo)) return setAddError('Masa służbowa musi być większa od zera i nie większa od masy ogólnej.');
    if (mh === '' || mh <= 0) return setAddError('Wpisz masę hamującą większą od zera.');
    if (pg === '' || pg <= 0) return setAddError('Wpisz ciśnienie powietrza w przewodzie głównym większe od zera.');
    if (p === '' || p <= 0) return setAddError('Wpisz ciśnienie sprężonego powietrza w przewodzie większe od zera.');

    changeVehicles(list => [...list, {
      ...newVehicle, id: 'v' + Date.now(), name,
      masaOgolna: mo, masaPusty: mp, masaWlasna: mw, masaSluzbowa: msl, masaHamujaca: mh, cisnienieGlowny: pg, cisnienie: p, sprawdzony: true
    }]);
    setNewVehicle(EMPTY_VEHICLE);
    setAddError('');
    setAdminMessage(`Dodano pojazd „${name}”.`);
  };

  const handleImportFromMainCard = async () => {
    const replace = vehicles.length === 0 || autoList || window.confirm(
      'Wczytać wbudowaną listę pojazdów?\n\nObecna lista w tej aplikacji zostanie zastąpiona. ' +
      'Ładunek zostanie wyliczony jako masa ogólna − masa bez podróżnych. Pojazdy zostaną oznaczone „do sprawdzenia”.'
    );
    if (!replace) return;
    setImporting(true);
    try {
      const list = await fetchEsemList();
      if (list.length === 0) {
        setAdminMessage('W pozostałych kartach nie ma zapisanych list pojazdów. Dodaj pojazdy ręcznie.');
      } else {
        changeVehicles(list);
        const bez = list.filter(brakLadunku).length;
        setAdminMessage(`Pobrano i zapisano ${list.length} pojazdów.` +
          (bez ? ` ${bez} z nich nie ma masy pustego składu ani masy własnej czy służbowej — uzupełnij ją, żeby wyliczyć ładunek.` : '') +
          ' Sprawdź dane i zaznacz „Dane sprawdzone”.');
      }
    } catch (e) {
      console.error(e);
      setAdminMessage('Nie udało się pobrać list: ' + (e.message || e));
    }
    setImporting(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(vehicles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pojazdy-jazda-esem.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const valid = Array.isArray(data) && data.length > 0 &&
          data.every(v => v && typeof v.name === 'string' && v.masaHamujaca !== undefined &&
            v.masaOgolna !== undefined);
        if (!valid) throw new Error('zły format');
        const list = data.map((v, i) => (v.masaPusty !== undefined || v.masaWlasna !== undefined || v.masaSluzbowa !== undefined || v.ladunek !== undefined)
          ? { ...EMPTY_VEHICLE, ...v, id: v.id || 'v' + Date.now() + '_' + i }
          : fromMainCard(v, i));
        if (window.confirm(`Zastąpić obecną listę ${list.length} pojazdami z pliku?`)) {
          changeVehicles(list);
          setAdminMessage(`Wczytano ${list.length} pojazdów z pliku.`);
        }
      } catch {
        setAdminMessage('Nie udało się wczytać pliku. Wybierz plik JSON wyeksportowany z tej aplikacji lub z Karty próby hamulca.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const inputCls = 'w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-blue-900';

  // ===== WIDOK =====
  const selectCls = 'w-full px-3 py-2.5 border border-blue-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/30 focus:border-blue-900';
  const v1obj = vehicles.find(v => v.id === vehicle1);
  const v2obj = vehicles.find(v => v.id === vehicle2);

  const handleCalculate = () => {
    if (!vehicle1) return setFormError('Wybierz pojazd 1.');
    if (procentWymagany === '' || pwError) return setFormError('Wpisz procent wymagany z WRJ.');
    if (!results) return setFormError('Nie da się wyliczyć próby dla wybranych pojazdów — sprawdź ich dane.');
    setFormError('');
    setShowResults(true);
  };

  const handleReset = () => {
    setVehicle1(''); setVehicle2(''); setProcentWymagany('');
    setShowResults(false); setFormError('');
  };

  const VehicleInfo = ({ v }) => v ? (
    <div className="mt-3 p-3 rounded-md bg-blue-50 border-l-4 border-blue-600 text-sm text-slate-900">
      <p><strong>Masa ogólna:</strong> {fmt(masaBezLadunku(v))} t</p>
      <p><strong>Masa hamująca rzeczywista:</strong> {fmt(toNumber(v.masaHamujaca) || 0)} t</p>
    </div>
  ) : null;

  const Line = ({ label, value }) => (
    <p className="py-1"><strong>{label}:</strong> {value}</p>
  );

  const FormulaCard = ({ title, children, up, legend }) => (
    <div className="bg-white/95 rounded-lg shadow-sm border-l-4 border-yellow-400 px-4 py-3 text-center">
      <p className="text-xs font-semibold text-blue-900">{title}</p>
      <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
        <div className="font-serif text-lg flex items-center">{children}</div>
        <RoundBadge up={up} />
        <span className="text-xs text-slate-700">{up ? 'zaokrąglenie w górę' : 'zaokrąglenie w dół'}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">{legend}</p>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-900 bg-gradient-to-br from-slate-200 via-amber-50 to-slate-300"
      style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 60px), linear-gradient(135deg, #e2e8f0 0%, #fdf8ec 45%, #dbe3ec 100%)' }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 space-y-4">

        {/* ================= NAGŁÓWEK ================= */}
        <header className="bg-white/95 rounded-lg shadow-md px-5 pt-4 pb-5 relative border-2 border-red-600 ring-4 ring-red-600/15">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-700">Autor: Grzegorz Rejszel (kier. poc. 186)</p>
            <button
              onClick={() => (isAdmin ? handleLogout() : setShowLogin(true))}
              title={isAdmin ? 'Wyjdź z trybu administratora' : 'Tryb administratora'}
              aria-label={isAdmin ? 'Wyjdź z trybu administratora' : 'Tryb administratora'}
              className="text-slate-400 hover:text-blue-900 p-1 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {isAdmin ? <LogOut size={16} /> : <Lock size={16} />}
            </button>
          </div>
          <div className="text-center mt-1">
            <div className="flex items-center justify-center gap-2 sm:gap-6">
              <WarningSign />
              <h1 className="text-xl sm:text-3xl font-bold text-red-700 leading-tight">
                <span className="block">Próba hamulca –</span>
                <span className="block">jazda „S”{'\u00a0'}(esem) – bez{'\u00a0'}podróżnych</span>
              </h1>
              <WarningSign />
            </div>
            <p className="mt-3 font-semibold text-slate-700">
              Aplikacja dla kierowników pociągu wypełniających kartę próby hamulca przy przejeździe służbowym bez podróżnych.
            </p>
            <p className="mt-3 mx-auto max-w-2xl px-4 py-2 rounded-md bg-red-50 border border-red-300 text-sm font-semibold text-red-700 flex items-start justify-center gap-2 text-left sm:text-center">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Aplikacja ma charakter wyłącznie pomocniczy i ułatwia wypełnienie karty próby hamulca. Korzystasz z niej na własną odpowiedzialność —
                nie zwalnia ona kierownika pociągu z obowiązku sprawdzenia, czy wyliczone wartości są prawidłowe.
              </span>
            </p>
            {(updateInfo.date || updateInfo.changes) && (
              <div className="inline-block text-left mt-4 border-l-4 border-yellow-400 pl-4 py-1 text-sm">
                {updateInfo.date && <p className="font-semibold text-blue-900">Aktualizacja: {formatDate(updateInfo.date)}</p>}
                {updateInfo.changes && <p className="text-slate-700 mt-0.5">{updateInfo.changes}</p>}
              </div>
            )}
          </div>
        </header>

        {/* ================= WZORY ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormulaCard
            title="Masa hamująca wymagana" up
            legend={<>M<sub>o</sub> – masa ogólna, P<sub>w</sub> – procent wymagany (z WRJ)</>}
          >
            <span className="italic">M<sub>hw</sub></span>
            <span className="mx-1">=</span>
            <Fraction top={<span className="italic">M<sub>o</sub> × P<sub>w</sub></span>} bottom={<span>100</span>} />
          </FormulaCard>
          <FormulaCard
            title="Procent masy hamującej rzeczywistej"
            legend={<>M<sub>hr</sub> – masa hamująca rzeczywista, M<sub>o</sub> – masa ogólna</>}
          >
            <span className="italic">P<sub>R</sub></span>
            <span className="mx-1">=</span>
            <Fraction top={<span className="italic">M<sub>hr</sub></span>} bottom={<span className="italic">M<sub>o</sub></span>} />
            <span className="ml-1">× 100</span>
          </FormulaCard>
        </section>

        {/* ================= KALKULATOR ================= */}
        <section className="bg-white/95 rounded-lg shadow-sm border-t-4 border-yellow-400 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
            {/* ----- Lewa kolumna ----- */}
            <div className="md:pr-6 md:border-r border-slate-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Wybór pojazdów</h2>
              <div className="p-3 mb-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 text-sm text-blue-900">
                Przy wykonywaniu próby hamulca dla dwóch połączonych składów należy wybrać dwa pojazdy.
              </div>

              {!vehiclesLoaded ? (
                <p className="text-slate-500 flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Wczytywanie listy pojazdów…</p>
              ) : vehicles.length === 0 ? (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-slate-800">
                  Nie udało się wczytać listy pojazdów. Sprawdź połączenie z internetem.
                </div>
              ) : (
                <>
                  <label htmlFor="v1" className="block text-sm text-slate-800 mb-1.5">Pojazd 1 *</label>
                  <select id="v1" value={vehicle1} onChange={e => { setVehicle1(e.target.value); setShowResults(false); }} className={selectCls}>
                    <option value="">-- Wybierz pojazd --</option>
                    {orderedVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <VehicleInfo v={v1obj} />

                  <label htmlFor="v2" className="block text-sm text-slate-800 mb-1.5 mt-4">Pojazd 2 (opcjonalnie)</label>
                  <select id="v2" value={vehicle2} onChange={e => { setVehicle2(e.target.value); setShowResults(false); }} className={selectCls} disabled={!vehicle1}>
                    <option value="">-- Wybierz pojazd --</option>
                    {orderedVehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <VehicleInfo v={v2obj} />

                  <label htmlFor="pw" className="block text-sm text-slate-800 mt-4">Procent wymagany (%) *</label>
                  <p className="text-xs text-slate-500 mb-1.5">Bierzemy go z WRJ (wewnętrznego rozkładu jazdy).</p>
                  <input
                    id="pw" type="text" inputMode="decimal" placeholder="np. 65"
                    value={procentWymagany}
                    onChange={e => { setProcentWymagany(e.target.value); setShowResults(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                    className={selectCls}
                  />
                  {pwError && <p className="text-sm text-red-700 mt-1">{pwError}</p>}
                  {formError && <p className="text-sm text-red-700 mt-2">{formError}</p>}

                  <div className="grid grid-cols-[1fr_auto] gap-3 mt-5">
                    <button onClick={handleCalculate}
                      className="py-3 rounded-md bg-blue-900 hover:bg-blue-800 text-white font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-yellow-400">
                      WYLICZ
                    </button>
                    <button onClick={handleReset}
                      className="px-8 py-3 rounded-md bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-900/40">
                      RESET
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ----- Prawa kolumna ----- */}
            <div className="md:pl-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Podsumowanie wyliczeń</h2>

              {!(showResults && results) ? (
                <div className="p-4 rounded-md bg-slate-50 border-l-4 border-slate-300 text-sm text-slate-600">
                  Wybierz pojazd, wpisz procent wymagany i naciśnij <strong>WYLICZ</strong>.
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="p-4 rounded-md bg-slate-50 border-l-4 border-yellow-400">
                    <Line label="Masa ogólna składu" value={`${fmt(results.masaOgolna)} t`} />
                    <Line label="Masa ogólna pociągu" value={`${fmt(results.masaOgolna)} t`} />
                    <Line label="Masa hamująca wymagana" value={`${results.masaHamujacaWymagana} t`} />
                    <Line label="Masa hamująca rzeczywista" value={`${fmt(results.masaHamujacaRzeczywista)} t`} />
                    <Line label="Procent masy hamującej wymaganej" value={`${fmt(pw)}%`} />
                    <Line label="Procent masy hamującej rzeczywistej" value={`${results.procentMasyHamujacejRzeczywistej}%`} />
                    <Line label="Ciśnienie powietrza w przewodzie głównym" value={`${fmt(results.cisnienieGlowny)} MPa`} />
                    <Line label="Ciśnienie sprężonego powietrza w przewodzie" value={`${fmt(results.cisnienie)} MPa`} />
                  </div>

                  <div className="p-4 rounded-md bg-blue-50 border-l-4 border-blue-600">
                    <p className="font-semibold text-blue-900 mb-2">Pozostałe parametry:</p>
                    {YES_NO_FIELDS.map(f => (
                      <p key={f.key} className="py-1">
                        <strong>{f.cardLabel}:</strong>{' '}
                        {selected.length > 1
                          ? selected.map(v => v[f.key]).join(' / ')
                          : selected[0][f.key]}
                      </p>
                    ))}
                    {selected.length > 1 && (
                      <p className="text-xs text-slate-500 mt-1">Kolejno: {selected.map(v => v.name).join(' / ')}</p>
                    )}
                  </div>

                  {unverified.length > 0 && (
                    <div className="p-3 rounded-md bg-yellow-50 border-l-4 border-yellow-500 text-slate-800 flex gap-2">
                      <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span>Dane pojazdu {unverified.map(v => `„${v.name}”`).join(' i ')} nie zostały jeszcze sprawdzone przez administratora. Porównaj je z dokumentacją pojazdu.</span>
                    </div>
                  )}
                  {noLoad.length > 0 && (
                    <div className="p-3 rounded-md bg-red-50 border-l-4 border-red-600 text-slate-800 flex gap-2">
                      <AlertTriangle size={18} className="text-red-700 flex-shrink-0 mt-0.5" />
                      <span>Brak masy pustego składu dla {noLoad.map(v => `„${v.name}”`).join(' i ')} — do obliczeń przyjęto pełną masę ogólną.</span>
                    </div>
                  )}

                  {results.isSuccess ? (
                    <div className="p-4 rounded-md bg-green-50 border border-green-500 flex gap-3">
                      <CheckCircle size={22} className="text-green-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-green-800">Próba pomyślna ✓</p>
                        <p className="text-green-800">Wszystkie warunki zostały spełnione.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-md bg-red-50 border border-red-500 flex gap-3">
                      <AlertCircle size={22} className="text-red-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-800">Próba niepomyślna ✗</p>
                        <p className="text-red-800">Konieczne jest wyliczenie nowej prędkości.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= PANEL ADMINISTRATORA ================= */}
        {isAdmin && (
          <section className="bg-white/95 rounded-lg shadow-sm p-5 border-t-4 border-yellow-400">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-blue-900">Panel administratora</h2>
              <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-blue-900 inline-flex items-center gap-1">
                <LogOut size={14} /> Wyjdź
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">Zmiany zapisują się automatycznie i od razu widzą je wszyscy.</p>

            <div className={`mb-4 p-3 rounded-md text-sm border-l-4 ${
              saveStatus === 'error' ? 'bg-red-50 border-red-500 text-red-800'
              : saveStatus === 'saving' ? 'bg-yellow-50 border-yellow-400 text-slate-800'
              : 'bg-green-50 border-green-600 text-green-900'}`}>
              {saveStatus === 'error' && <>Nie udało się zapisać zmian w bazie. Szczegóły: {saveError}</>}
              {saveStatus === 'saving' && 'Zapisywanie…'}
              {saveStatus === 'saved' && 'Zapisano w bazie.'}
              {saveStatus === '' && 'Połączono z bazą.'}
            </div>

            {adminMessage && (
              <div className="mb-4 p-3 rounded-md text-sm bg-blue-50 border-l-4 border-blue-900 text-blue-900 flex justify-between gap-2">
                <span>{adminMessage}</span>
                <button onClick={() => setAdminMessage('')} aria-label="Zamknij komunikat"><X size={16} /></button>
              </div>
            )}

            {/* Informacja o aktualizacji */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-2">Informacja o aktualizacji</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex gap-2">
                  <input type="date" value={updateInfo.date} onChange={e => changeUpdateInfo({ ...updateInfo, date: e.target.value })} className={inputCls} />
                  <button onClick={() => changeUpdateInfo({ ...updateInfo, date: todayIso() })} className="px-3 text-sm bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap">Dziś</button>
                </div>
                <textarea
                  rows={2} placeholder="Opis zmian"
                  value={updateInfo.changes} onChange={e => changeUpdateInfo({ ...updateInfo, changes: e.target.value })}
                  className={`${inputCls} sm:col-span-2`}
                />
              </div>
            </div>

            {autoList && (
              <div className="mb-4 p-3 rounded-md text-sm bg-yellow-50 border-l-4 border-yellow-400 text-slate-800">
                Wyświetlana jest wbudowana lista pojazdów (masa służbowa uzupełniona z karty „przejazd służbowy”, jeśli był tam pojazd o tej samej nazwie). Lista nie jest jeszcze zapisana w bazie tej aplikacji. Kliknij „Zapisz tę listę w bazie” albo zmień dowolny pojazd.
              </div>
            )}

            {/* Narzędzia listy */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={handleImportFromMainCard} disabled={importing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-60">
                <RefreshCw size={14} className={importing ? 'animate-spin' : ''} /> {autoList ? 'Zapisz tę listę w bazie' : `Wczytaj wbudowaną listę (${DEFAULT_VEHICLES.length} pojazdów)`}
              </button>
              <button onClick={handleExport} disabled={vehicles.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-50">
                <Download size={14} /> Eksportuj do pliku
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200">
                <Upload size={14} /> Wczytaj z pliku
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
            </div>

            {/* Lista pojazdów */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="font-semibold text-slate-800">Pojazdy ({vehicles.length})</h3>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={sortAlfabetyczne} onChange={e => toggleSort(e.target.checked)} className="w-4 h-4 accent-blue-900" />
                Układaj listę alfabetycznie automatycznie
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {sortAlfabetyczne
                ? 'Lista układa się sama alfabetycznie, także po dodaniu nowego pojazdu. Odznacz, żeby ustawić własną kolejność strzałkami.'
                : 'Własna kolejność — przesuwaj pojazdy strzałkami. Ta kolejność obowiązuje też na liście wyboru pojazdu.'}
            </p>
            <div className="space-y-3 mb-6">
              {orderedVehicles.map((v, idx) => (
                <div key={v.id} className={`rounded-md border p-3 ${v.sprawdzony === false ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'}`}>
                  <div className="flex gap-2 mb-2">
                    {!sortAlfabetyczne && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveVehicle(v.id, -1)} disabled={idx === 0} title="Przesuń wyżej" aria-label={`Przesuń ${v.name} wyżej`}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-blue-900 disabled:opacity-30"><ArrowUp size={14} /></button>
                        <button onClick={() => moveVehicle(v.id, 1)} disabled={idx === orderedVehicles.length - 1} title="Przesuń niżej" aria-label={`Przesuń ${v.name} niżej`}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-blue-900 disabled:opacity-30"><ArrowDown size={14} /></button>
                      </div>
                    )}
                    <input value={v.name} onChange={e => updateVehicle(v.id, 'name', e.target.value)} className={`${inputCls} font-semibold`} aria-label="Nazwa pojazdu" />
                    <button onClick={() => deleteVehicle(v.id)} title="Usuń pojazd" aria-label={`Usuń ${v.name}`}
                      className="px-3 rounded-md text-red-700 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                    <label className="text-xs text-slate-600">Masa ogólna (t)
                      <input inputMode="decimal" value={v.masaOgolna} onChange={e => updateVehicle(v.id, 'masaOgolna', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Masa pustego składu (t)
                      <input inputMode="decimal" value={v.masaPusty ?? ''} onChange={e => updateVehicle(v.id, 'masaPusty', e.target.value)} className={`${inputCls} mt-1 ${brakLadunku(v) ? 'border-red-400 bg-red-50' : ''}`} />
                    </label>
                    <label className="text-xs text-slate-600">Masa własna (t)
                      <input inputMode="decimal" value={v.masaWlasna ?? ''} onChange={e => updateVehicle(v.id, 'masaWlasna', e.target.value)} className={`${inputCls} mt-1 ${brakLadunku(v) ? 'border-red-400 bg-red-50' : ''}`} />
                    </label>
                    <label className="text-xs text-slate-600">Masa służbowa (t)
                      <input inputMode="decimal" value={v.masaSluzbowa ?? ''} onChange={e => updateVehicle(v.id, 'masaSluzbowa', e.target.value)} className={`${inputCls} mt-1 ${brakLadunku(v) ? 'border-red-400 bg-red-50' : ''}`} />
                    </label>
                    <label className="text-xs text-slate-600">Masa hamująca (t)
                      <input inputMode="decimal" value={v.masaHamujaca} onChange={e => updateVehicle(v.id, 'masaHamujaca', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Ciśnienie powietrza w przewodzie głównym (MPa)
                      <input inputMode="decimal" value={v.cisnienieGlowny ?? CISNIENIE_PRZEWOD_GLOWNY} onChange={e => updateVehicle(v.id, 'cisnienieGlowny', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                    <label className="text-xs text-slate-600">Ciśnienie sprężonego powietrza w przewodzie (MPa)
                      <input inputMode="decimal" value={v.cisnienie} onChange={e => updateVehicle(v.id, 'cisnienie', e.target.value)} className={`${inputCls} mt-1`} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {YES_NO_FIELDS.map(f => (
                      <label key={f.key} className="text-xs text-slate-600">{f.label}
                        <select value={v[f.key]} onChange={e => updateVehicle(v.id, f.key, e.target.value)} className={`${inputCls} mt-1`}>
                          <option value="TAK">TAK</option>
                          <option value="-">-</option>
                        </select>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    {(() => {
                      const l = obliczLadunek(v);
                      return l
                        ? <>Ładunek: <strong className="text-blue-900">{fmt(l.ladunek)} t</strong> ({l.zrodlo}) · Masa do jazdy esem: <strong className="text-blue-900">{fmt(masaBezLadunku(v))} t</strong></>
                        : <span className="text-red-700">Wpisz masę pustego składu, masę własną lub służbową — bez nich ładunek = 0 t.</span>;
                    })()}
                  </p>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={v.sprawdzony !== false} onChange={e => updateVehicle(v.id, 'sprawdzony', e.target.checked)} className="w-4 h-4 accent-blue-900" />
                    Dane sprawdzone
                  </label>
                </div>
              ))}
            </div>

            {/* Dodawanie pojazdu */}
            <div className="rounded-md bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Dodaj pojazd</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                <input placeholder="Nazwa serii, np. 36WEa-011 do 36WEa-016" value={newVehicle.name}
                  onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })} className={`${inputCls} sm:col-span-4`} />
                <input placeholder="Masa ogólna (t)" inputMode="decimal" value={newVehicle.masaOgolna}
                  onChange={e => setNewVehicle({ ...newVehicle, masaOgolna: e.target.value })} className={inputCls} />
                <input placeholder="Masa pustego składu (t)" inputMode="decimal" value={newVehicle.masaPusty}
                  onChange={e => setNewVehicle({ ...newVehicle, masaPusty: e.target.value })} className={inputCls} />
                <input placeholder="Masa własna (t)" inputMode="decimal" value={newVehicle.masaWlasna}
                  onChange={e => setNewVehicle({ ...newVehicle, masaWlasna: e.target.value })} className={inputCls} />
                <input placeholder="Masa służbowa (t)" inputMode="decimal" value={newVehicle.masaSluzbowa}
                  onChange={e => setNewVehicle({ ...newVehicle, masaSluzbowa: e.target.value })} className={inputCls} />
                <input placeholder="Masa hamująca (t)" inputMode="decimal" value={newVehicle.masaHamujaca}
                  onChange={e => setNewVehicle({ ...newVehicle, masaHamujaca: e.target.value })} className={`${inputCls} sm:col-span-4`} />
                <label className="text-xs text-slate-600 sm:col-span-2">Ciśnienie powietrza w przewodzie głównym (MPa)
                  <input inputMode="decimal" value={newVehicle.cisnienieGlowny}
                    onChange={e => setNewVehicle({ ...newVehicle, cisnienieGlowny: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
                <label className="text-xs text-slate-600 sm:col-span-2">Ciśnienie sprężonego powietrza w przewodzie (MPa)
                  <input inputMode="decimal" placeholder="np. 0,8" value={newVehicle.cisnienie}
                    onChange={e => setNewVehicle({ ...newVehicle, cisnienie: e.target.value })} className={`${inputCls} mt-1`} />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {YES_NO_FIELDS.map(f => (
                  <label key={f.key} className="text-xs text-slate-600">{f.label}
                    <select value={newVehicle[f.key]} onChange={e => setNewVehicle({ ...newVehicle, [f.key]: e.target.value })} className={`${inputCls} mt-1`}>
                      <option value="TAK">TAK</option>
                      <option value="-">-</option>
                    </select>
                  </label>
                ))}
              </div>
              {addError && <p className="text-sm text-red-700 mb-2">{addError}</p>}
              <button onClick={handleAddVehicle}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-400 text-blue-900 font-semibold hover:bg-yellow-300">
                <Plus size={16} /> Dodaj pojazd
              </button>
            </div>
          </section>
        )}

      </main>

      {/* ================= OKNO LOGOWANIA ================= */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeLogin}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-blue-900">Tryb administratora</h2>
              <button onClick={closeLogin} aria-label="Zamknij"><X size={18} /></button>
            </div>
            <input
              type="password" autoFocus placeholder="Hasło"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className={inputCls}
            />
            {loginError && <p className="text-sm text-red-700 mt-2">{loginError}</p>}
            <button onClick={handleLogin} className="mt-3 w-full py-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-800">
              Zaloguj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
