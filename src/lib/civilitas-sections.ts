export interface CivilitasSection {
  num: string;
  title: string;
  content: CivilitasBlock[];
}

export type CivilitasBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "h3"; text: string }
  | { type: "quote"; lines: string[] };

const PO = "„";
const PC = "”";
const q = (s: string) => `${PO}${s}${PC}`;

export const CIVILITAS_SECTIONS: CivilitasSection[] = [
  {
    num: "I",
    title: "Zachowanie w kościele i miejscach sakralnych",
    content: [
      { type: "h3", text: "1. Wejście do kościoła" },
      { type: "p", text: "Wchodząc do kościoła, należy pamiętać, że nie wchodzi się do zwykłego budynku, ale do miejsca poświęconego Bogu. Już sam sposób wejścia powinien wyrażać skupienie." },
      { type: "p", text: "Po wejściu do kościoła należy:" },
      { type: "ul", items: ["zachować ciszę lub mówić bardzo cicho;","wyciszyć telefon;","unikać rozmów towarzyskich;","zanurzyć palce w wodzie święconej i uczynić znak krzyża;","skierować wzrok ku tabernakulum lub ołtarzowi;","przyklęknąć, jeśli w tabernakulum obecny jest Najświętszy Sakrament;","zająć miejsce spokojnie, bez przepychania się."] },
      { type: "p", text: "Jeżeli ktoś nie może przyklęknąć z powodów zdrowotnych, może wykonać głęboki skłon. W katolickim savoir-vivre nie chodzi o teatralność gestu, lecz o szczerość szacunku." },
      { type: "h3", text: "2. Przyklęknięcie i ukłon" },
      { type: "p", text: "Przyklęknięcie wykonuje się na prawe kolano, w stronę tabernakulum. Ukłon wykonuje się wobec ołtarza, zwłaszcza gdy tabernakulum jest w osobnej kaplicy. Nie należy przyklękać byle jak — lepiej gest prosty, spokojny i świadomy." },
      { type: "h3", text: "3. Cisza w kościele" },
      { type: "p", text: "Kościół nie jest miejscem rozmów towarzyskich. Dotyczy to szczególnie czasu przed Mszą Świętą i po Komunii Świętej." },
      { type: "p", text: "Nie należy:" },
      { type: "ul", items: ["prowadzić głośnych rozmów;","komentować wyglądu innych;","śmiać się głośno;","odbierać telefonu;","chodzić bez potrzeby po kościele;","robić zdjęć bez zgody i wyraźnej potrzeby;","żuć gumy;","jeść ani pić (poza wyjątkami zdrowotnymi)."] },
      { type: "h3", text: "4. Telefon komórkowy" },
      { type: "p", text: "Telefon przed wejściem do kościoła należy wyciszyć — najlepiej tryb samolotowy. Nie wypada przeglądać wiadomości, nagrywać liturgii ani korzystać z mediów społecznościowych. Korzystanie z telefonu jako modlitewnika jest dopuszczalne, ale dyskretnie." },
      { type: "h3", text: "5. Zajmowanie miejsc" },
      { type: "p", text: "Osobom starszym, chorym, kobietom w ciąży i osobom z małymi dziećmi należy ustąpić miejsca. Katolicka kultura osobista wymaga wrażliwości." },
    ],
  },
  { num: "II", title: "Zachowanie podczas Mszy Świętej", content: [
    { type: "h3", text: "1. Punktualność" }, { type: "p", text: "Na Mszę Świętą należy przychodzić punktualnie, najlepiej kilka minut wcześniej. Spóźnianie się z przyczyn błahych jest oznaką lekceważenia liturgii. Jeśli ktoś się spóźni, niech wejdzie dyskretnie i poczeka z tyłu jeśli trwa Ewangelia lub przeistoczenie." },
    { type: "h3", text: "2. Postawy liturgiczne" }, { type: "p", text: "Należy stać, siedzieć i klęczeć w odpowiednich momentach. Ciało również uczestniczy w modlitwie. Kto nie może klęczeć ze względu na zdrowie — może siedzieć bez obaw." },
    { type: "h3", text: "3. Śpiew i odpowiedzi" }, { type: "p", text: "Wierny powinien uczestniczyć przez odpowiedzi i śpiew. Należy unikać skrajności: całkowitego milczenia z obojętności oraz śpiewania tak głośno, że przeszkadza innym." },
    { type: "h3", text: "4. Znak pokoju" }, { type: "p", text: "Znak pokoju — skinienie głową lub podanie ręki osobom najbliżej stojącym. Nie należy chodzić po całym kościele ani robić z tego momentu spotkania towarzyskiego." },
    { type: "h3", text: "5. Komunia Święta" }, { type: "p", text: "Do Komunii Świętej należy podchodzić w stanie łaski uświęcającej. W kolejce nie przepychamy się, nie rozmawiamy, nie żujemy gumy. Po przyjęciu Komunii — skupienie, nie obserwowanie innych." },
    { type: "h3", text: "6. Wyjście z kościoła" }, { type: "p", text: "Nie wypada wychodzić przed końcowym błogosławieństwem. Masowe wychodzenie po Komunii jest złym zwyczajem. Rozmowy prowadź przed kościołem, nie w nawie głównej." },
  ]},
  { num: "III", title: "Ubiór w kościele", content: [
    { type: "h3", text: "1. Zasada podstawowa" }, { type: "p", text: "Ubiór powinien być godny, czysty i niewyzywający. Elegancja nie polega na cenie ubrania, lecz na szacunku do miejsca. Idziemy na spotkanie z Bogiem, nie na plażę ani imprezę." },
    { type: "h3", text: "2. Ubiór mężczyzny" }, { type: "p", text: "Mężczyzna unika: krótkich spodenek, koszulek z obraźliwymi napisami, nakrycia głowy (poza względami zdrowotnymi), stroju sportowego bez potrzeby, klapek plażowych. W niedzielę: długie spodnie, koszula lub sweter. Na uroczystości: strój formalny." },
    { type: "h3", text: "3. Ubiór kobiety" }, { type: "p", text: "Kobieta wybiera strój godny i skromny. Nieodpowiednie: bardzo krótkie spódnice, głębokie dekolty, przezroczyste materiały, stroje plażowe. Elegancka sukienka, spódnica, żakiet lub bluzka są właściwe. Nakrycie głowy jest możliwe, ale nie obowiązkowe." },
    { type: "h3", text: "4. Ubiór dzieci i młodzieży" }, { type: "p", text: "Dzieci warto od małego uczyć, że do kościoła ubieramy się inaczej. Nie chodzi o krępowanie — chodzi o wychowanie do szacunku. Młodzież unika stroju prowokacyjnego lub manifestacyjnie lekceważącego." },
    { type: "h3", text: "5. Uroczystości szczególne" }, { type: "p", text: "Na pogrzeb: kolory stonowane, ciemne. Na ślub: nie przyćmiewaj pary młodej. Na każdą uroczystość kościelną: strój z większą starannością." },
  ]},
  { num: "IV", title: "Szacunek wobec osób starszych", content: [
    { type: "h3", text: "1. Pierwszeństwo i ustępowanie miejsca" }, { type: "p", text: "Osobom starszym okazujemy szacunek konkretnie: ustępujemy miejsca, pomagamy w przejściu, przytrzymujemy drzwi. Pomoc powinna być delikatna, bez zawstydzania." },
    { type: "p", text: "Dobrze jest zapytać:" }, { type: "quote", lines: [q("Czy mogę pomóc?"), q("Czy podać rękę?"), q("Czy chce pani/pan usiąść?")] },
    { type: "h3", text: "2. Sposób rozmowy" }, { type: "p", text: "Do osób starszych mówimy spokojnie, wyraźnie i z szacunkiem. Nie przerywamy, nie przewracamy oczami, nie okazujemy zniecierpliwienia, nie poprawiamy w sposób upokarzający." },
    { type: "h3", text: "3. Starsi w rodzinie i wspólnocie" }, { type: "p", text: "Osoby starsze są nośnikami pamięci, doświadczenia i tradycji. Nawet jeśli nie ze wszystkim się zgadzamy, odnosimy się do nich z godnością. Szacunek to forma, takt i wdzięczność." },
  ]},
  { num: "V", title: "Zachowanie wobec kobiet", content: [
    { type: "h3", text: "1. Godność i szacunek" }, { type: "p", text: "Katolicki mężczyzna traktuje kobietę z szacunkiem — nie jako ozdobę, nie jako służącą. Uprzejmość jest przejawem kultury i uznania jej godności." },
    { type: "h3", text: "2. Gesty uprzejmości" }, { type: "ul", items: ["przepuścić kobietę w drzwiach;","pomóc założyć płaszcz;","ustąpić miejsca kobiecie w ciąży, starszej lub zmęczonej;","pomóc przy cięższym bagażu;","nie używać przy kobietach wulgaryzmów;","nie komentować nachalnie wyglądu;","nie zawstydzać żartami dwuznacznymi."] },
    { type: "h3", text: "3. Kolejność przy powitaniu" }, { type: "p", text: "Kobieta pierwsza podaje rękę mężczyźnie. Osoba starsza — młodszej. Mężczyzna nie narzuca kobiecie uścisku dłoni." },
    { type: "h3", text: "4. Język wobec kobiet" }, { type: "p", text: "Unikamy określeń lekceważących wobec kobiet nieznajomych. Lepsza forma:" },
    { type: "quote", lines: [q("Proszę pani"), q("Szanowna pani"), q("Pani Anno")] },
    { type: "p", text: `Zamiast: ${q("Kochaniutka")}, ${q("Słoneczko")}, ${q("Dziewczyno")}, ${q("Mała")} — takie słowa mogą być odebrane jako niekulturalne, nawet bez złej intencji.` },
  ]},
  { num: "VI", title: "Zwroty grzecznościowe ogólne", content: [
    { type: "h3", text: "1. Podstawowe formy" }, { type: "p", text: "Podstawą kultury osobistej są proste słowa:" },
    { type: "ul", items: [`${q("proszę")};`,`${q("dziękuję")};`,`${q("przepraszam")};`,`${q("dzień dobry")};`,`${q("dobry wieczór")};`,`${q("do widzenia")};`,`${q("szczęść Boże")}.`] },
    { type: "h3", text: `2. ${q("Szczęść Boże")}` }, { type: "p", text: `${q("Szczęść Boże")} jest tradycyjnym katolickim pozdrowieniem — wobec księży, w kancelarii parafialnej, podczas prac kościelnych. Odpowiedź: ${q("Bóg zapłać")} albo ${q("Szczęść Boże")}.` },
    { type: "p", text: `W kontaktach świeckich, gdzie nie wiemy, czy druga osoba jest wierząca, bezpieczniej użyć neutralnego ${q("dzień dobry")}.` },
    { type: "h3", text: `3. ${q("Bóg zapłać")}` }, { type: "p", text: `${q("Bóg zapłać")} to religijna forma podziękowania — stosowna wobec księdza, siostry zakonnej, organisty, wolontariuszy. Nie używa się jej ironicznie.` },
    { type: "h3", text: "4. Przepraszanie" }, { type: "p", text: "Przeprosiny powinny być jasne i uczciwe. Lepsza forma:" },
    { type: "quote", lines: [q("Przepraszam, zachowałem się niewłaściwie."), q("Przepraszam, nie powinienem był tego powiedzieć."), q("Przepraszam za spóźnienie.")] },
  ]},
  { num: "VII", title: "Tytułowanie duchownych i hierarchii kościelnej", content: [
    { type: "h3", text: "1. Ksiądz" }, { type: "p", text: "Do księdza zwracamy się:" },
    { type: "quote", lines: [q("Proszę księdza"), q("Księże proboszczu"), q("Księże wikary"), q("Księże profesorze")] },
    { type: "p", text: `W korespondencji: ${q("Czcigodny Księże")}, ${q("Wielebny Księże")}, ${q("Szanowny Księże Proboszczu")}.` },
    { type: "h3", text: "2. Proboszcz" }, { type: "p", text: `Do proboszcza: ${q("Księże Proboszczu")}, ${q("Proszę Księdza Proboszcza")}. W piśmie: ${q("Czcigodny Księże Proboszczu")}. Krytykę wyraża się rzeczowo, nie publicznie i nie obraźliwie.` },
    { type: "h3", text: "3. Wikariusz" }, { type: "p", text: `Do wikariusza: ${q("Proszę księdza")}, ${q("Księże Wikary")}. Nie należy mówić lekceważąco ${q("ten młody ksiądz")}, szczególnie w jego obecności.` },
    { type: "h3", text: "4. Biskup" }, { type: "p", text: `Do biskupa: ${q("Księże Biskupie")}, ${q("Ekscelencjo")}, ${q("Wasza Ekscelencjo")}. W piśmie: ${q("Jego Ekscelencja Ksiądz Biskup…")}. Nie skracamy dystansu bez zaproszenia.` },
    { type: "h3", text: "5. Arcybiskup" }, { type: "p", text: `Do arcybiskupa: ${q("Księże Arcybiskupie")}, ${q("Ekscelencjo")}. W piśmie: ${q("Jego Ekscelencja Ksiądz Arcybiskup…")}.` },
    { type: "h3", text: "6. Kardynał" }, { type: "p", text: `Do kardynała: ${q("Księże Kardynale")}, ${q("Eminencjo")}, ${q("Wasza Eminencjo")}. W piśmie: ${q("Jego Eminencja Ksiądz Kardynał…")}.` },
    { type: "h3", text: "7. Papież" }, { type: "p", text: `Do papieża: ${q("Ojcze Święty")}, ${q("Wasza Świątobliwość")}. W piśmie: ${q("Jego Świątobliwość Papież…")}.` },
    { type: "h3", text: "8. Diakon" }, { type: "p", text: `Do diakona: ${q("Proszę diakona")}, ${q("Księże Diakonie")}.` },
    { type: "h3", text: "9. Osoby zakonne" }, { type: "p", text: `Do siostry zakonnej: ${q("Proszę siostry")}, ${q("Siostro [imię]")}, ${q("Matko")} (jeśli przełożona). Do zakonnika-kapłana: ${q("Proszę ojca")}, ${q("Ojcze [imię]")}. Do zakonnika niebędącego kapłanem: ${q("Bracie")}, ${q("Proszę brata")}.` },
  ]},
  { num: "VIII", title: "Zachowanie wobec księży i osób konsekrowanych", content: [
    { type: "h3", text: "1. Powitanie" }, { type: "p", text: `Wobec księdza właściwe są formy: ${q("Szczęść Boże, proszę księdza")}, ${q("Szczęść Boże, Księże Proboszczu")}, ${q("Dzień dobry, proszę księdza")}. Nie należy przechodzić na ${q("ty")}, chyba że wynika z rzeczywistej relacji.` },
    { type: "h3", text: "2. Rozmowa" }, { type: "p", text: "W rozmowie z duchownym — normalność i szacunek. Nie przesadzamy z uniżonością, ale nie traktujemy go jak kolegi z baru." },
    { type: "p", text: "Nie należy:" }, { type: "ul", items: ["publicznie atakować księdza;","zadawać prowokacyjnych pytań w złej wierze;","komentować jego prywatności;","plotkować o innych księżach;","nachodzić go poza stosownym czasem."] },
    { type: "h3", text: "3. Kancelaria parafialna" }, { type: "p", text: "Przychodzimy w godzinach urzędowania z potrzebnymi dokumentami. Mówimy rzeczowo, nie podnosimy głosu. Warto zacząć od:" },
    { type: "quote", lines: [q("Szczęść Boże, chciałbym zapytać w sprawie…"), q("Szczęść Boże, przychodzę w sprawie chrztu / pogrzebu / zaświadczenia…")] },
  ]},
  { num: "IX", title: "Zachowanie podczas uroczystości kościelnych", content: [
    { type: "h3", text: "1. Chrzest" }, { type: "p", text: "Zachowujemy skupienie. Fotografowanie nie przeszkadza liturgii. Rodzice i chrzestni — ubrani godnie, znają swoje obowiązki. Nie traktujemy chrztu wyłącznie jako okazji do przyjęcia." },
    { type: "h3", text: "2. Pierwsza Komunia Święta" }, { type: "p", text: "Najważniejsze: przyjęcie Pana Jezusa przez dziecko — nie strój, prezenty ani restauracja. Unikamy ostentacyjnego fotografowania i skupiania uwagi na sprawach drugorzędnych." },
    { type: "h3", text: "3. Bierzmowanie" }, { type: "p", text: "Świadek powinien być rzeczywistym wsparciem duchowym, nie tylko osobą wpisaną w dokumenty." },
    { type: "h3", text: "4. Ślub" }, { type: "p", text: "Ślub to sakrament. Nie spóźniamy się, nie rozmawiamy podczas liturgii, nie klaskamy w nieodpowiednich momentach. Goście eleganccy — ale nie przyćmiewają pary młodej." },
    { type: "h3", text: "5. Pogrzeb" }, { type: "p", text: "Powaga, cisza, współczucie. Kondolencje krótkie:" },
    { type: "quote", lines: [q("Proszę przyjąć moje wyrazy współczucia."), q("Bardzo mi przykro."), q("Łączę się z państwem w modlitwie.")] },
    { type: "p", text: `Nie mówimy banalnie: ${q("Czas leczy rany")}, ${q("Tak musiało być")}, ${q("Przynajmniej się nie męczy")} — takie słowa mogą ranić, choć wypowiadane w dobrej wierze.` },
  ]},
  { num: "X", title: "Zachowanie przy stole", content: [
    { type: "h3", text: "1. Modlitwa przed posiłkiem" }, { type: "p", text: "W domu katolickim naturalna jest modlitwa przed jedzeniem. Przy gościach niewierzących — z godnością, ale bez przymuszania. Nie używamy modlitwy jako demonstracji." },
    { type: "h3", text: "2. Kolejność siadania" }, { type: "p", text: "Gospodarz wskazuje miejsca. Honorowe miejsca: gość najważniejszy, osoba starsza, duchowny, jubilat, solenizant." },
    { type: "h3", text: "3. Zachowanie przy stole" }, { type: "ul", items: ["siedzieć prosto, ale swobodnie;","nie mówić z pełnymi ustami;","używać serwetki;","nie sięgać przez cały stół — poprosić o podanie;","nie krytykować potraw;","nie przesadzać z alkoholem;","dziękować za posiłek."] },
    { type: "h3", text: "4. Alkohol" }, { type: "p", text: "Umiarkowane spożycie alkoholu nie jest zakazane. Pijaństwo, wulgarność i utrata panowania nad sobą — tak. Chrzciny, Komunia, ślub kościelny nie powinny przeradzać się w pijacką zabawę." },
    { type: "h3", text: "5. Rozmowy przy stole" }, { type: "p", text: "Unikamy tematów prowadzących do kłótni: polityka, pieniądze, spadki, konflikty rodzinne, cudze grzechy, plotki. Dobre tematy: rodzina, podróże, kultura, wspomnienia, wdzięczność." },
  ]},
  { num: "XI", title: "Zasady pierwszeństwa", content: [
    { type: "h3", text: "1. Ogólna zasada" }, { type: "p", text: "Pierwszeństwo służy porządkowi i szacunkowi, nie walce o rangę. Zasadniczo mają je:" },
    { type: "ul", items: ["osoby starsze przed młodszymi;","kobiety przed mężczyznami;","osoby duchowne w kontekście religijnym;","osoby chore, słabsze, niepełnosprawne;","jubilaci i osoby wyróżnione w danej uroczystości."] },
    { type: "h3", text: "2. Drzwi" }, { type: "p", text: "Mężczyzna przepuszcza kobietę, osoba młodsza — starszą, gospodarz — gościa. Wyjątek: jeśli wejście jest niepewne, mężczyzna wchodzi pierwszy, by otworzyć drogę." },
    { type: "h3", text: "3. Schody" }, { type: "p", text: "Przy wchodzeniu mężczyzna idzie za kobietą. Przy schodzeniu może iść przed nią, by asekurować. Najważniejsze: bezpieczeństwo i naturalność." },
    { type: "h3", text: "4. W samochodzie i kolejce" }, { type: "p", text: "Osobie starszej, kobiecie lub gościowi proponujemy wygodniejsze miejsce. W kolejce: nie wykorzystujemy znajomości by ominąć innych. Osobie starszej, ciężarnej lub chorej — ustępujemy." },
  ]},
  { num: "XII", title: "Powitania, przedstawianie i rozmowa", content: [
    { type: "h3", text: "1. Kto komu się kłania" }, { type: "p", text: "Osoba młodsza pierwsza mówi dzień dobry osobie starszej. Mężczyzna pierwszy pozdrawia kobietę. Osoba wchodząca do pomieszczenia pozdrawia obecnych." },
    { type: "h3", text: "2. Podawanie ręki" }, { type: "p", text: "Rękę pierwsza podaje: osoba starsza, kobieta mężczyźnie, przełożony podwładnemu, gospodarz gościowi. Nie wyciągamy ręki na siłę. Uścisk dłoni: krótki, pewny, ale nie miażdżący." },
    { type: "h3", text: "3. Przedstawianie osób" }, { type: "p", text: "Osobę młodszą przedstawiamy starszej, mężczyznę — kobiecie. Przykład:" },
    { type: "quote", lines: [q("Księże Proboszczu, pozwolę sobie przedstawić mojego brata, Jana."), q("Pani Anno, to jest pan Marek, nasz nowy sąsiad.")] },
    { type: "h3", text: "4. Rozmowa" }, { type: "p", text: "Dobra rozmowa wymaga słuchania. Unikamy: plotek, obmowy, wulgarności, szyderstwa, wyciągania cudzych błędów, ostentacyjnej pobożności służącej ocenianiu innych. Celem rozmowy: aby druga osoba poczuła się potraktowana z godnością." },
  ]},
  { num: "XIII", title: "Zachowanie w zakrystii", content: [
    { type: "p", text: "Zakrystia to miejsce przygotowania do liturgii, nie salon towarzyski. Wchodzimy tylko z potrzeby, krótko i rzeczowo." },
    { type: "ul", items: ["nie wchodzimy w ostatniej chwili przed Mszą z długą sprawą;","nie przerywamy księdzu przygotowania;","nie dotykamy szat, kielichów i paramentów bez pozwolenia;","nie prowadzimy głośnych rozmów;","nie traktujemy zakrystii jak zaplecza imprezy."] },
  ]},
  { num: "XIV", title: "Fotografowanie i nagrywanie w kościele", content: [
    { type: "p", text: "Fotografowanie powinno być dyskretne i podporządkowane liturgii. Fotograf nie jest najważniejszą osobą w kościele." },
    { type: "ul", items: ["uzyskaj zgodę, jeśli jest wymagana;","nie wchodź do prezbiterium bez pozwolenia;","nie zasłaniaj wiernym widoku;","nie używaj lampy błyskowej rozpraszająco;","nie chodź podczas przeistoczenia i Komunii."] },
  ]},
  { num: "XV", title: "Dzieci w kościele", content: [
    { type: "p", text: "Dzieci mają miejsce w kościele — są częścią wspólnoty. Małe dziecko może zapłakać. Nie patrzymy na rodziców z potępieniem. Dobrą praktyką jest:" },
    { type: "ul", items: ["siąść bliżej wyjścia z małym dzieckiem;","wziąć cichą książeczkę religijną;","wyjść na chwilę, jeśli dziecko bardzo płacze;","spokojnie tłumaczyć, co dzieje się podczas Mszy;","nie dawać dziecku głośnych zabawek."] },
  ]},
  { num: "XVI", title: "Osoby chore i niepełnosprawne", content: [
    { type: "p", text: "Katolicka wspólnota powinna być dla osób chorych miejscem przyjaznym, nie upokarzającym. Miłosierdzie jest ważniejsze niż pedantyczne poprawianie." },
    { type: "ul", items: ["ustąp miejsca;","pomóż przy wejściu;","umożliw przejazd wózkiem;","nie komentuj choroby;","nie patrz natarczywie;","nie oceniaj, że ktoś siedzi, gdy inni klęczą;","nie rób uwag osobie zachowującej się nietypowo z powodu choroby."] },
  ]},
  { num: "XVII", title: "Jałmużna, ofiara i pieniądze", content: [
    { type: "p", text: "Składanie ofiary powinno być dyskretne. Taca nie jest konkursem hojności — nie oceniamy innych." },
    { type: "p", text: "Przy zamawianiu intencji mszalnych lepsza forma:" },
    { type: "quote", lines: [q("Jaka jest zwyczajowa ofiara?"), q("Jaką ofiarę mogę złożyć?")] },
    { type: "p", text: `Zamiast ${q("Ile kosztuje Msza?")} — ta forma może być odebrana jako nieodpowiednia.` },
  ]},
  { num: "XVIII", title: "Pobożność bez ostentacji", content: [
    { type: "p", text: "Nie wstydzimy się wiary, ale nie używamy pobożności do popisywania się. Nie wypada:" },
    { type: "ul", items: ["modlić się ostentacyjnie, by inni widzieli;","poprawiać wszystkich wokół;","głośno wzdychać z dezaprobatą;","oceniać, kto jak klęka;","komentować, kto przystępuje do Komunii;","robić z kościoła miejsca religijnej rywalizacji."] },
    { type: "p", text: "Prawdziwa pobożność jest skupiona, pokorna i życzliwa." },
  ]},
  { num: "XIX", title: "Upominanie innych", content: [
    { type: "p", text: "Nie każde uchybienie wymaga reakcji. Trzeba odróżnić poważne naruszenie od ludzkiej słabości. Jeśli trzeba zwrócić uwagę — cicho, krótko, bez upokarzania. Zamiast:" },
    { type: "quote", lines: [q("Co pan wyprawia?!")] },
    { type: "p", text: "Lepiej:" },
    { type: "quote", lines: [q("Przepraszam, tu trwa modlitwa. Proszę mówić ciszej.")] },
    { type: "p", text: "Upomnienie chrześcijańskie nie jest wyładowaniem irytacji." },
  ]},
  { num: "XX", title: "Gość na plebanii lub w domu zakonnym", content: [
    { type: "p", text: "Wchodząc na plebanię lub do klasztoru, szanujemy rytm życia gospodarzy." },
    { type: "ul", items: ["nie przychodź bez zapowiedzi z długą sprawą;","nie zaglądaj do prywatnych pomieszczeń;","nie komentuj wyposażenia;","nie przedłużaj wizyty bez potrzeby;","nie oczekuj natychmiastowej obsługi;","pamiętaj: plebania i klasztor to też miejsca mieszkania i odpoczynku."] },
  ]},
  { num: "XXI", title: "Katolik w przestrzeni publicznej", content: [
    { type: "p", text: "Katolik reprezentuje wiarę nie tylko w kościele. Kultura osobista jest formą świadectwa. Chodzi o spójność: nie można być pobożnym w kościele i brutalnym, aroganckim lub nieuczciwym poza nim." },
    { type: "ul", items: ["mówi prawdę;","dotrzymuje słowa;","nie poniża słabszych;","szanuje kobiety;","troszczy się o starszych;","zachowuje umiar;","nie plotkuje;","nie wykorzystuje religii do manipulacji;","przeprasza, gdy zawini."] },
  ]},
  { num: "XXII", title: "Najczęstsze błędy", content: [
    { type: "ol", items: ["Rozmowy w kościele przed Mszą i po Komunii.","Spóźnianie się bez poważnego powodu.","Wychodzenie zaraz po Komunii.","Nieodpowiedni strój.","Żucie gumy w kościele.","Trzymanie rąk w kieszeniach podczas modlitwy.","Fotografowanie bez umiaru.","Publiczne poprawianie innych z irytacją.","Lekceważące mówienie o księżach i osobach starszych.","Brak wdzięczności wobec organisty, kościelnego, ministrantów, wolontariuszy.","Traktowanie sakramentów jako tła do przyjęcia rodzinnego.","Nieuprzejmość w kancelarii parafialnej.","Brak umiaru przy stole.","Mylenie pobożności z demonstracją.","Brak wrażliwości na osoby chore, starsze i z dziećmi."] },
  ]},
  { num: "XXIII", title: "Krótki kodeks katolickiego savoir-vivre'u", content: [
    { type: "ol", items: ["W kościele zachowuj ciszę, skupienie i szacunek.","Ubieraj się godnie, niekoniecznie bogato.","Przychodź punktualnie.","Nie przeszkadzaj innym w modlitwie.","Szanuj osoby starsze, chore i słabsze.","Wobec kobiet zachowuj uprzejmość, takt i godność.","Do duchownych zwracaj się zgodnie z ich urzędem.","Nie skracaj dystansu bez zaproszenia.","Przy stole zachowuj umiar i wdzięczność.","Nie plotkuj, nie obmawiaj, nie zawstydzaj.","Pomagaj dyskretnie.","Upominaj łagodnie, jeśli naprawdę trzeba.","Nie używaj religii do wywyższania się.","Pamiętaj, że dobre maniery są formą miłości bliźniego.","Zachowuj się tak, aby inni dzięki tobie mieli więcej pokoju, a nie mniej."] },
  ]},
];

/** Converts blocks to a simple editable text format */
export function blocksToText(blocks: CivilitasBlock[]): string {
  return blocks.map(b => {
    if (b.type === "h3") return `## ${b.text}`;
    if (b.type === "p") return b.text;
    if (b.type === "ul") return b.items.map(i => `- ${i}`).join("\n");
    if (b.type === "ol") return b.items.map((i, n) => `${n + 1}. ${i}`).join("\n");
    if (b.type === "quote") return b.lines.map(l => `> ${l}`).join("\n");
    return "";
  }).filter(Boolean).join("\n\n");
}

/** Parses simple text format back to blocks */
export function textToBlocks(text: string): CivilitasBlock[] {
  const blocks: CivilitasBlock[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    const lines = para.trim().split("\n");
    if (!lines.length || !para.trim()) continue;

    const firstLine = lines[0];

    if (firstLine.startsWith("## ")) {
      for (const line of lines) {
        if (line.startsWith("## ")) blocks.push({ type: "h3", text: line.slice(3).trim() });
        else if (line.trim()) blocks.push({ type: "p", text: line.trim() });
      }
    } else if (lines.every(l => l.match(/^- /))) {
      blocks.push({ type: "ul", items: lines.map(l => l.slice(2).trim()) });
    } else if (lines.every(l => l.match(/^\d+\. /))) {
      blocks.push({ type: "ol", items: lines.map(l => l.replace(/^\d+\. /, "").trim()) });
    } else if (lines.every(l => l.startsWith("> "))) {
      blocks.push({ type: "quote", lines: lines.map(l => l.slice(2).trim()) });
    } else {
      blocks.push({ type: "p", text: para.trim() });
    }
  }

  return blocks;
}
