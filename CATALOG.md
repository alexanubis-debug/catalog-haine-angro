# Catalog angro

Site static, fără dependențe. Din acest director rulează `python3 -m http.server 8000` pentru dezvoltare. Publicarea necesită un serviciu de găzduire statică; fișierele locale nu reprezintă o adresă publică.

Produsele sunt în `catalog.json`. Completează prețul numeric, unitatea explicită `priceUnit`, numele afacerii, numărul WhatsApp în format internațional și comanda minimă. Prețurile necunoscute rămân `null`. Culorile sunt transcrise din fotografii și trebuie confirmate de comerciant. Nu sunt declarate stocuri ori cantități minime pe baza etichetelor furnizorului.

Cele 16 fotografii originale sunt în `assets/`, asociate modelelor după codurile vizibile. Prețul confirmat este 125 lei / compleu. Contact: AJ PARIS FASHION SRL, WhatsApp +40 722 212 459. Comanda minimă nu este încă specificată.

Această versiune nu include autentificare sau administrare online. Modificările se fac în fișiere și necesită republicare; o administrare de pe telefon cu salvare comună necesită un serviciu persistent separat.

Actualizare: catalogul conține 39 de modele. Cele 16 inițiale au preț confirmat de 125 lei; cele 23 noi au `price: null` și afișează „Cere preț” până la primirea prețurilor. Câmpul `images` grupează fotografiile aceluiași produs; `image` este fotografia principală.

Import nou: 74 fotografii primite, 13 copii identice excluse, 16 fotografii ale modelelor existente excluse după verificare vizuală. 45 fotografii grupate în 38 modele noi; total 77 modele. Toate modelele acestui import au preț necompletat. Cinci modele fără cod vizibil folosesc coduri interne AJ-FOTO-001–005, marcate prin `internalCode: true`.

Produsele AJ-FOTO-001–005 folosesc imagini de studio generate cu AI ca fotografii principale, marcate în `aiImages`; fotografiile originale sunt păstrate în galerie. Fotografiile AI sunt ilustrative, pot prezenta diferențe de detaliu față de original.

La cererea comerciantului, produsele AJ-FOTO-001–005 afișează exclusiv imaginile AI, fără fotografii originale în galeriile publice.

Import Archive 2.zip (50 fotografii): 48 modele noi, coduri interne AJ-FOTO-006–053, exclusiv imagini de studio AI în galeriile publice, fără prețuri completate. Total 125 modele. Cealaltă arhivă depășește limita de transfer de 32 MiB și nu a fost procesată.

Imaginile publice folosesc variante WebP responsive: 360/640 px în listă și până la 1200 px în detalii. Originalele rămân pe disc. După adăugarea de fotografii rulează `python3 scripts/optimize_images.py` (necesită Pillow). Lista afișează 12 produse inițial; butonul adaugă următorul lot de 12. Căutarea și categoria operează asupra întregului catalog.

Archive 3.zip (lot de 26 fotografii): o copie identică și o fotografie a modelului A-86913 excluse. Adăugate 24 modele, total 149; prețuri necompletate. Modelele 2991 și 9882 au fotografii de studio AI, fără originalele de pe umeraș în galerie. Toate imaginile noi au variante WebP 360/640/1200 px.

Test foto A86547: fotografia principală prezintă modelul întreg, fără inscripții. Câmpul opțional `colorVariantsImage` afișează fotografia variantelor de culoare sub fotografia principală în detalii; includeți această sursă în `media`. Scriptul de optimizare procesează și aceste imagini. Restul produselor nu sunt transformate de acest test.

Ordinea „Descoperă colecția” amestecă produsele o singură dată la fiecare deschidere sau reîncărcare a paginii. Filtrarea, căutarea, detaliile și încărcarea loturilor păstrează aceeași ordine pe pagina deschisă; „Cod produs A–Z” rămâne disponibil. Fișierul catalog.json nu este reordonat.

2026-11-07: arhiva WhatsApp conține 26 fotografii ale unui palton în crem și camel. Adăugat un singur produs AJ-FOTO-055 (cod intern), categoria Veste și jachete, 220 lei / palton, cu patru prezentări de studio (față/spate pentru fiecare culoare), optimizate WebP. Nu se declară compoziție, mărimi sau stocuri. `isNew: true` afișează eticheta NEW în card și detalii; elimină sau setează false când produsul nu mai trebuie marcat nou. Nu modifică ordinea amestecată.

„Descoperă colecția” afișează întâi produsele `isNew`, apoi restul; ordinea este amestecată în fiecare grup o singură dată pe vizită. Filtrarea pe categorie păstrează prioritatea NEW. Sortarea explicită „Cod produs A–Z” continuă să sorteze alfabetic.

Prezentare pe categorii: la „Toate”, fără căutare, apar „Noutăți” și secțiunile categoriilor, fiecare cu până la șase produse și „Vezi toate”. Produsele NEW nu se repetă în previzualizările categoriilor, dar sunt incluse în lista completă a categoriei. „Vezi toate” deschide lista filtrată, încărcată în loturi de 12, cu revenire la toate categoriile. Căutarea afișează rezultatele în lista obișnuită; ordinea vizitei și sortarea A–Z se păstrează. Imaginile de sub prima zonă rămân lazy-loaded.

Import WhatsApp 18.57.24–28 (30 fotografii): 22 fotografii de produse existente excluse — opt identice cu fișierele publice, una pentru codul QF3201 și 13 cadre ale paltonului AJ-FOTO-055. Adăugate opt modele noi: AJ-FOTO-056, AJ-FOTO-057, B2008, LM6062, MY1007, CR2672, CR2673 și XX9001, toate cu isNew:true și price:null. Șapte fotografii de studio AI curate, cu variante de culoare dedesubt; fotografia vestei AJ-FOTO-057 era deja pe model și a fost păstrată. Total 158 modele. Nicio modificare la cele 150 produse existente. Nu au fost preluate mărimi, stocuri sau cantități din inscripțiile furnizorului.

BWT6220: denumirile culorilor corectate după fotografie în Crem, Bej, Maro, Negru. Nu interpretați denumirea de furnizor KAKI drept o variantă verde; fotografia materialului este referința de culoare.

Mărimile transcrise din sursele originale sunt în `sizes`. TU se afișează „Talie universală (TU)”; combinațiile S/M, M/L, L/XL, XL/XXL și XXL/XXXL se păstrează exact și nu se despart în mărimi individuale. Nu completați mărimi neconfirmate sau cantități de stoc din tabelele de ambalare. Mărimile apar în card și în detalii. BWT6220 folosește retușuri ale fotografiilor originale, fără reconstrucția croielii sau recolorare.
