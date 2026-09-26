# Karta próby hamulca – jazda esem (przejazd służbowy bez podróżnych)

Osobna aplikacja do wyliczania karty próby hamulca dla pojazdu jadącego
jako przejazd służbowy, bez podróżnych. Siostrzana aplikacja zwykłej
„Karty próby hamulca” (repo `karta-proby-hamulca`).

## Stos
- React + Vite, Tailwind przez CDN (w `index.html`), ikony `lucide-react`
- Firebase Firestore – ten sam projekt `zestawienie-pojazdow` co „Zestawienie pojazdów KD”
- GitHub `generatortestowkd`, repo `karta-proby-hamulca-esem` → Vercel (auto-deploy)

## Dane w Firestore
- `kph_esem/pojazdy` – lista pojazdów tej aplikacji (`{ list: [...] }`)
- `kph_esem/aktualizacja` – data i opis ostatniej zmiany
- Wbudowana lista 20 pojazdów (`DEFAULT_VEHICLES` w App.jsx) – pokazywana, dopóki w `kph_esem/pojazdy` nie ma zapisanej listy
- `kph_sluzbowy/pojazdy` – tylko odczyt, źródło masy służbowej (masa bez podróżnych)

Pojazd: `name, masaOgolna (t), masaPusty (t – masa pustego składu z zestawienia KD), masaWlasna (t), masaSluzbowa (t), masaHamujaca (t), cisnienie (MPa),
hamulecElektro, ukladSterowania, ukladDrzwi, inne ("TAK"/"-"), sprawdzony (true/false)`

## Obliczenia
- Ładunek = masa ogólna − masa pustego składu; gdy jej brak: − masa własna; gdy i jej brak: masa ogólna − masa służbowa (gdy są obie, odejmujemy masę własną)
- Masa ogólna składu = masa ogólna pociągu = Mo = Σ(masa ogólna − ładunek) wybranych pojazdów (1 lub 2)
- Mhr = suma mas hamujących
- Mhw = Mo × Pw / 100, zaokrąglone w górę
- PR = Mhr / Mo × 100, zaokrąglone w dół
- Pw – procent wymagany z WRJ
- Próba pomyślna, gdy Mhr ≥ Mhw i PR ≥ Pw
- Ciśnienie – większa z wartości wybranych pojazdów

## Administrator
Kłódka w nagłówku, hasło `KPH2026`. Edycja pojazdów, dodawanie, usuwanie,
import/eksport JSON, informacja o aktualizacji. Zmiany zapisują się od razu w Firestore.

## Sposób pracy
- Autor nie jest programistą – instrukcje krok po kroku, po polsku
- Zmiany: nowy `src/App.jsx` → wgranie na GitHub (przez przeglądarkę lub `git push`) → Vercel publikuje sam
- Projekty lokalnie w `C:\projekty\`, nie na Pulpicie (OneDrive); CMD, nie PowerShell
