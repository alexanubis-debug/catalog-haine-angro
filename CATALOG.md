# Catalog angro

Site static, fără dependențe. Din acest director rulează `python3 -m http.server 8000` pentru dezvoltare. Publicarea necesită un serviciu de găzduire statică; fișierele locale nu reprezintă o adresă publică.

Produsele sunt în `catalog.json`. Completează prețul numeric, unitatea explicită `priceUnit`, numele afacerii, numărul WhatsApp în format internațional și comanda minimă. Prețurile necunoscute rămân `null`. Culorile sunt transcrise din fotografii și trebuie confirmate de comerciant. Nu sunt declarate stocuri ori cantități minime pe baza etichetelor furnizorului.

Cele 16 fotografii originale sunt în `assets/`, asociate modelelor după codurile vizibile. Prețul confirmat este 125 lei / compleu. Contact: AJ PARIS FASHION SRL, WhatsApp +40 722 212 459. Comanda minimă nu este încă specificată.

Această versiune nu include autentificare sau administrare online. Modificările se fac în fișiere și necesită republicare; o administrare de pe telefon cu salvare comună necesită un serviciu persistent separat.

Actualizare: catalogul conține 39 de modele. Cele 16 inițiale au preț confirmat de 125 lei; cele 23 noi au `price: null` și afișează „Cere preț” până la primirea prețurilor. Câmpul `images` grupează fotografiile aceluiași produs; `image` este fotografia principală.

Import nou: 74 fotografii primite, 13 copii identice excluse, 16 fotografii ale modelelor existente excluse după verificare vizuală. 45 fotografii grupate în 38 modele noi; total 77 modele. Toate modelele acestui import au preț necompletat. Cinci modele fără cod vizibil folosesc coduri interne AJ-FOTO-001–005, marcate prin `internalCode: true`.

Produsele AJ-FOTO-001–005 folosesc imagini de studio generate cu AI ca fotografii principale, marcate în `aiImages`; fotografiile originale sunt păstrate în galerie. Fotografiile AI sunt ilustrative, pot prezenta diferențe de detaliu față de original.
