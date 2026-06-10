-- Różaniec (pełny) + Katechizm
-- Uruchom w Supabase SQL Editor po supabase-prayers-migration.sql

insert into public.prayers (title, content, category, language, tags, sort_order) values

-- ════════════════════════════════════════════════════════════════
-- RÓŻANIEC — PEŁNY
-- ════════════════════════════════════════════════════════════════

('Jak odmawiać Różaniec — wprowadzenie',
 'Różaniec składa się z 4 części (po 5 tajemnic każda):
• Tajemnice Radosne — poniedziałek i sobota
• Tajemnice Światła — czwartek
• Tajemnice Bolesne — wtorek i piątek
• Tajemnice Chwalebne — środa i niedziela

Struktura każdej dziesiątki:
1. Zapowiedz tajemnicę
2. Odmów Ojcze Nasz
3. Odmów 10× Zdrowaś Maryjo (rozważając tajemnicę)
4. Odmów Chwała Ojcu
5. Odmów Modlitwę fatimską

Na początku całego Różańca:
• Skład Apostolski (Wierzę w Boga)
• Ojcze Nasz
• 3× Zdrowaś Maryjo (o wiarę, nadzieję i miłość)
• Chwała Ojcu

Modlitwa fatimska (po każdej dziesiątce):
O mój Jezu, przebacz nam nasze grzechy, zachowaj nas od ognia piekielnego, zaprowadź wszystkie dusze do nieba i dopomóż szczególnie tym, którzy najbardziej potrzebują Twojego miłosierdzia. Amen.',
 'Różaniec', 'pl', ARRAY['różaniec','wprowadzenie'], 50),

('Różaniec — Tajemnice Radosne',
 'Odmawiane w poniedziałek i sobotę.

I. ZWIASTOWANIE NAJŚWIĘTSZEJ MARYI PANNIE
„Anioł Gabriel został posłany przez Boga... i przyszedłszy do Niej, rzekł: Bądź pozdrowiona, pełna łaski, Pan z Tobą." (Łk 1,26-28)
Owoc tajemnicy: pokora
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

II. NAWIEDZENIE ŚWIĘTEJ ELŻBIETY
„W tym czasie Maryja wybrała się i poszła z pośpiechem w góry do pewnego miasta w pokoleniu Judy." (Łk 1,39)
Owoc tajemnicy: miłość bliźniego
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

III. NARODZENIE PANA JEZUSA
„I porodziła swego pierworodnego Syna, owinęła Go w pieluszki i położyła w żłobie, gdyż nie było dla nich miejsca w gospodzie." (Łk 2,7)
Owoc tajemnicy: ubóstwo duchowe i miłość Boga
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

IV. OFIAROWANIE PANA JEZUSA W ŚWIĄTYNI
„Gdy potem upłynęły dni ich oczyszczenia według Prawa Mojżeszowego, przynieśli Je do Jerozolimy, aby je przedstawić Panu." (Łk 2,22)
Owoc tajemnicy: posłuszeństwo i duch ofiary
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

V. ZNALEZIENIE PANA JEZUSA W ŚWIĄTYNI
„Dopiero po trzech dniach odnaleźli Go w świątyni, gdzie siedział między nauczycielami, przysłuchiwał się im i zadawał pytania." (Łk 2,46)
Owoc tajemnicy: gorliwość w rzeczach Bożych
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

Na zakończenie:
Zdrowaś Królowo (Salve Regina):
Zdrowaś Królowo, Matko miłosierdzia,
życie, słodyczy i nadziejo nasza, zdrowaś!
Do Ciebie wołamy wygnańcy, synowie Ewy,
do Ciebie wzdychamy, jęcząc i płacząc na tym łez padole.
Przeto, Orędowniczko nasza, one miłosierne oczy Twoje na nas zwróć,
a Jezusa, błogosławiony owoc żywota Twojego,
po tym wygnaniu nam okaż.
O łaskawa, o litościwa, o słodka Panno Maryjo!',
 'Różaniec', 'pl', ARRAY['różaniec','radosne','poniedziałek','sobota'], 51),

('Różaniec — Tajemnice Światła',
 'Odmawiane w czwartek. Wprowadzone przez św. Jana Pawła II w 2002 roku.

I. CHRZEST PANA JEZUSA W JORDANIE
„A gdy Jezus został ochrzczony, natychmiast wyszedł z wody. A oto otworzyły się nad Nim niebiosa i ujrzał Ducha Bożego zstępującego jak gołębicę." (Mt 3,16)
Owoc tajemnicy: otwartość na działanie Ducha Świętego
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

II. OBJAWIENIE SIĘ JEZUSA NA WESELU W KANIE
„Rzekła do Niego Matka Jego: Nie mają już wina. Jezus jej odpowiedział: Czyż to moja lub Twoja sprawa, Niewiasto?" (J 2,3-4)
Owoc tajemnicy: wstawiennictwo Maryi, zaufanie
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

III. GŁOSZENIE KRÓLESTWA BOŻEGO I WZYWANIE DO NAWRÓCENIA
„Czas się wypełnił i bliskie jest Królestwo Boże. Nawracajcie się i wierzcie w Ewangelię." (Mk 1,15)
Owoc tajemnicy: nawrócenie i pokuta
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

IV. PRZEMIENIENIE PAŃSKIE NA GÓRZE TABOR
„I przemienił się wobec nich: twarz Jego zajaśniała jak słońce, odzienie zaś stało się białe jak światło." (Mt 17,2)
Owoc tajemnicy: pragnienie świętości
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

V. USTANOWIENIE EUCHARYSTII
„Następnie wziął chleb, odmówiwszy dziękczynienie połamał go i podał mówiąc: To jest Ciało moje, które za was będzie wydane. Czyńcie to na moją pamiątkę." (Łk 22,19)
Owoc tajemnicy: adoracja Jezusa w Eucharystii
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

Na zakończenie:
Zdrowaś Królowo (jak w Tajemnicach Radosnych)',
 'Różaniec', 'pl', ARRAY['różaniec','światła','czwartek','jan paweł'], 52),

('Różaniec — Tajemnice Bolesne',
 'Odmawiane we wtorek i piątek.

I. MODLITWA PANA JEZUSA W OGRÓJCU
„I odszedłszy nieco dalej, upadł na twarz i modlił się tymi słowami: Ojcze mój, jeśli to możliwe, niech Mnie ominie ten kielich." (Mt 26,39)
Owoc tajemnicy: skrucha za grzechy
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

II. BICZOWANIE PANA JEZUSA
„Wówczas uwolnił im Barabasza, a Jezusa kazał ubiczować i wydał na ukrzyżowanie." (Mt 27,26)
Owoc tajemnicy: umartwienie i czystość
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

III. UKORONOWANIE PANEM JEZUSA CIERNIEM
„Uplótłszy wieniec z ciernia, włożyli Mu na głowę, a do prawej ręki dali Mu trzcinę. Potem przyklękali przed Nim i szydzili z Niego." (Mt 27,29)
Owoc tajemnicy: odwaga duchowa
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

IV. DROGA KRZYŻOWA PANA JEZUSA
„A niosąc krzyż, wyszedł na miejsce zwane Miejscem Czaszki, które po hebrajsku nazywa się Golgota." (J 19,17)
Owoc tajemnicy: cierpliwość w krzyżu
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

V. ŚMIERĆ PANA JEZUSA NA KRZYŻU
„A Jezus zawołał donośnym głosem: Ojcze, w Twoje ręce powierzam ducha mojego. Po tych słowach wyzionął ducha." (Łk 23,46)
Owoc tajemnicy: miłość Boga, odkupienie
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

Na zakończenie:
Zdrowaś Królowo (jak w Tajemnicach Radosnych)',
 'Różaniec', 'pl', ARRAY['różaniec','bolesne','wtorek','piątek'], 53),

('Różaniec — Tajemnice Chwalebne',
 'Odmawiane w środę i niedzielę.

I. ZMARTWYCHWSTANIE PANA JEZUSA
„Anioł przemówił do niewiast: Wy się nie bójcie! Gdyż wiem, że szukacie Jezusa Ukrzyżowanego. Nie ma Go tu, bo zmartwychwstał, jak powiedział." (Mt 28,5-6)
Owoc tajemnicy: wiara i radość
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

II. WNIEBOWSTĄPIENIE PANA JEZUSA
„Po tych słowach uniósł się w ich obecności w górę i obłok zabrał Go im sprzed oczu." (Dz 1,9)
Owoc tajemnicy: nadzieja i tęsknota za niebem
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

III. ZESŁANIE DUCHA ŚWIĘTEGO
„Nagle dał się słyszeć z nieba szum, jakby uderzenie gwałtownego wiatru... i wszyscy zostali napełnieni Duchem Świętym." (Dz 2,2.4)
Owoc tajemnicy: mądrość i dary Ducha Świętego
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

IV. WNIEBOWZIĘCIE NAJŚWIĘTSZEJ MARYI PANNY
„Cała piękna jesteś, Maryjo, i skaza pierworodna nie ma w Tobie miejsca. Tyś chwałą Jeruzalem, Tyś weselem Izraela." (ant. liturgiczna)
Owoc tajemnicy: pobożność maryjna
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

V. UKORONOWANIE NAJŚWIĘTSZEJ MARYI PANNY NA KRÓLOWĄ NIEBA I ZIEMI
„Potem wielki znak ukazał się na niebie: Niewiasta obleczona w słońce i księżyc pod jej stopami, a na jej głowie wieniec z gwiazd dwunastu." (Ap 12,1)
Owoc tajemnicy: ostateczne wytrwanie, zbawienie
Ojcze Nasz — 10× Zdrowaś Maryjo — Chwała Ojcu — Modlitwa fatimska

Na zakończenie:
Zdrowaś Królowo (jak w Tajemnicach Radosnych)

Pod Twoją obronę uciekamy się, święta Boża Rodzicielko,
naszymi prośbami racz nie gardzić w potrzebach naszych,
ale od wszelkich złych przygód racz nas zawsze wybawiać,
Panno chwalebna i błogosławiona,
o Pani nasza, Orędowniczko nasza, Pośredniczko nasza, Pocieszycielko nasza.
Z Synem Swoim nas pojednaj, Synowi Swemu nas polecaj,
Synowi Swemu nas oddawaj. Amen.',
 'Różaniec', 'pl', ARRAY['różaniec','chwalebne','środa','niedziela'], 54),

-- ════════════════════════════════════════════════════════════════
-- KATECHIZM
-- ════════════════════════════════════════════════════════════════

('Główne prawdy wiary',
 '1. Jest jeden Bóg.

2. Bóg jest sędzią sprawiedliwym, który za dobro wynagradza, a za zło karze.

3. Są trzy Osoby Boskie: Bóg Ojciec, Syn Boży i Duch Święty.

4. Syn Boży stał się człowiekiem i umarł na krzyżu dla naszego zbawienia.

5. Dusza ludzka jest nieśmiertelna.

6. Łaska Boża jest do zbawienia koniecznie potrzebna.',
 'Katechizm', 'pl', ARRAY['katechizm','prawdy wiary','podstawowe'], 60),

('10 Przykazań Bożych',
 'Jam jest Pan, Bóg twój, którym cię wywiódł z ziemi egipskiej, z domu niewoli.

1. Nie będziesz miał bogów cudzych przede Mną.

2. Nie będziesz brał imienia Pana Boga twego nadaremno.

3. Pamiętaj, abyś dzień święty święcił.

4. Czcij ojca swego i matkę swoją.

5. Nie zabijaj.

6. Nie cudzołóż.

7. Nie kradnij.

8. Nie mów fałszywego świadectwa przeciw bliźniemu swemu.

9. Nie pożądaj żony bliźniego swego.

10. Ani żadnej rzeczy, która jego jest.

Streszczenie przykazań (Mt 22,37-39):
„Będziesz miłował Pana Boga swego całym swoim sercem, całą swoją duszą i całym swoim umysłem" — to jest największe i pierwsze przykazanie.

Drugie podobne jest do niego: „Będziesz miłował swego bliźniego jak siebie samego".',
 'Katechizm', 'pl', ARRAY['katechizm','dekalog','przykazania'], 61),

('5 Przykazań Kościelnych',
 '1. W niedziele i święta nakazane uczestniczyć we Mszy świętej i powstrzymać się od prac niekoniecznych.

2. Przynajmniej raz w roku przystąpić do sakramentu pokuty.

3. Przynajmniej raz w roku, w czasie wielkanocnym, przyjąć Komunię świętą.

4. Zachowywać nakazane posty i wstrzemięźliwość od pokarmów mięsnych, a w dni skupienia powstrzymywać się od udziału w zabawach.

5. Troszczyć się o potrzeby wspólnoty Kościoła.

Dni nakazane (święta nakazane w Polsce):
• Wszystkie niedziele
• 1 stycznia — Uroczystość Świętej Bożej Rodzicielki
• 6 stycznia — Objawienie Pańskie (Trzech Króli)
• Wniebowstąpienie Pańskie
• Boże Ciało
• 15 sierpnia — Wniebowzięcie NMP
• 1 listopada — Wszystkich Świętych
• 25-26 grudnia — Narodzenie Pańskie',
 'Katechizm', 'pl', ARRAY['katechizm','przykazania kościelne'], 62),

('7 Sakramentów Świętych',
 '1. CHRZEST
Woda i słowa: „Ja ciebie chrzczę w imię Ojca i Syna, i Ducha Świętego."
Skutek: odpuszczenie grzechu pierworodnego, wcielenie do Kościoła, charakter niezatarty.

2. BIERZMOWANIE
Namaszczenie krzyżmem i słowa: „Przyjmij znamię daru Ducha Świętego."
Skutek: umocnienie w wierze, dary Ducha Świętego, charakter niezatarty.

3. EUCHARYSTIA (Komunia Święta)
Chleb i wino, słowa konsekracji.
Skutek: jedność z Chrystusem, pokarm duchowy, zadatek życia wiecznego.

4. POKUTA (Spowiedź)
Wyznanie grzechów, żal, rozgrzeszenie: „Ja odpuszczam tobie grzechy w imię Ojca i Syna, i Ducha Świętego."
Skutek: odpuszczenie grzechów popełnionych po chrzcie.

5. NAMASZCZENIE CHORYCH
Namaszczenie olejem i modlitwa.
Skutek: umocnienie w chorobie, zjednoczenie cierpienia z Chrystusem.

6. KAPŁAŃSTWO (Święcenia)
Nałożenie rąk i modlitwa konsekracyjna.
Skutek: udział w kapłaństwie Chrystusa, charakter niezatarty.

7. MAŁŻEŃSTWO
Wzajemna zgoda małżonków.
Skutek: łaska do budowania rodziny chrześcijańskiej, nierozerwalność.',
 'Katechizm', 'pl', ARRAY['katechizm','sakramenty'], 63),

('7 Grzechów Głównych i cnoty przeciwne',
 '1. PYCHA — przeciw niej: pokora
Nadmierne umiłowanie własnej doskonałości i wywyższanie siebie nad innych.

2. CHCIWOŚĆ (skąpstwo) — przeciw niej: hojność
Nieumiarkowane przywiązanie do dóbr materialnych.

3. NIECZYSTOŚĆ (rozwiązłość) — przeciw niej: czystość
Nieumiarkowane pożądanie przyjemności cielesnych.

4. ZAZDROŚĆ — przeciw niej: życzliwość
Smutek z powodu dobra bliźniego postrzeganego jako własne zło.

5. NIEUMIARKOWANIE W JEDZENIU I PICIU (łakomstwo) — przeciw niemu: wstrzemięźliwość
Nieumiarkowane oddawanie się przyjemnościom podniebienia.

6. GNIEW — przeciw niemu: łagodność
Nieuporządkowane pragnienie zemsty.

7. LENISTWO (opieszałość) — przeciw niemu: gorliwość
Opór wobec dóbr duchowych z powodu wysiłku, jaki wymagają.

Pamięć: Pycha — Chciwość — Nieczystość — Zazdrość — Nieumiarkowanie — Gniew — Lenistwo
(skrót: PCNZN GL)',
 'Katechizm', 'pl', ARRAY['katechizm','grzechy główne','rachunek sumienia'], 64),

('Uczynki miłosierdzia',
 'CO DO DUSZY (7 uczynków):
1. Grzeszących upominać.
2. Nieumiejętnych pouczać.
3. Wątpiącym dobrze radzić.
4. Strapionych pocieszać.
5. Krzywdy cierpliwie znosić.
6. Urazy chętnie darować.
7. Modlić się za żywych i umarłych.

CO DO CIAŁA (7 uczynków):
1. Głodnych nakarmić.
2. Spragnionych napoić.
3. Nagich przyodziać.
4. Podróżnych w dom przyjąć.
5. Więźniów pocieszać.
6. Chorych nawiedzać.
7. Umarłych pogrzebać.

„Byłem głodny, a daliście Mi jeść; byłem spragniony, a daliście Mi pić; byłem przybyszem, a przyjęliście Mnie; byłem nagi, a przyodzialiście Mnie; byłem chory, a odwiedziliście Mnie; byłem w więzieniu, a przyszliście do Mnie." (Mt 25,35-36)',
 'Katechizm', 'pl', ARRAY['katechizm','miłosierdzie','uczynki'], 65),

('Dary Ducha Świętego i Owoce Ducha Świętego',
 '7 DARÓW DUCHA ŚWIĘTEGO (Iz 11,2-3):
1. Mądrość — pomaga oceniać wszystko w świetle Bożym
2. Rozum — pogłębia rozumienie prawd wiary
3. Rada — pomaga rozeznawać wolę Bożą
4. Męstwo — umacnia w trudnościach i prześladowaniach
5. Umiejętność — pozwala właściwie oceniać rzeczy stworzone
6. Pobożność — budzi synowską miłość do Boga
7. Bojaźń Boża — chroni przed grzechem z miłości do Boga

12 OWOCÓW DUCHA ŚWIĘTEGO (Ga 5,22-23):
1. Miłość
2. Radość
3. Pokój
4. Cierpliwość
5. Uprzejmość
6. Dobroć
7. Wspaniałomyślność
8. Łagodność
9. Wierność
10. Skromność
11. Wstrzemięźliwość
12. Czystość',
 'Katechizm', 'pl', ARRAY['katechizm','duch święty','dary','bierzmowanie'], 66),

('Błogosławieństwa (Kazanie na Górze)',
 'Mt 5,3-12

1. Błogosławieni ubodzy w duchu, albowiem do nich należy królestwo niebieskie.

2. Błogosławieni, którzy się smucą, albowiem oni będą pocieszeni.

3. Błogosławieni cisi, albowiem oni na własność posiądą ziemię.

4. Błogosławieni, którzy łakną i pragną sprawiedliwości, albowiem oni będą nasyceni.

5. Błogosławieni miłosierni, albowiem oni miłosierdzia dostąpią.

6. Błogosławieni czystego serca, albowiem oni Boga oglądać będą.

7. Błogosławieni, którzy wprowadzają pokój, albowiem oni będą nazwani synami Bożymi.

8. Błogosławieni, którzy cierpią prześladowanie dla sprawiedliwości, albowiem do nich należy królestwo niebieskie.

Błogosławieni jesteście, gdy ludzie wam urągają i prześladują was, i gdy z mego powodu mówią kłamliwie wszystko złe o was. Cieszcie się i radujcie, albowiem wielka jest wasza nagroda w niebie.',
 'Katechizm', 'pl', ARRAY['katechizm','błogosławieństwa','ewangelia'], 67),

('Rachunek sumienia — przygotowanie do spowiedzi',
 'Warunki dobrej spowiedzi (5 warunków):
1. Rachunek sumienia
2. Żal za grzechy
3. Mocne postanowienie poprawy
4. Szczera spowiedź (wyznanie grzechów)
5. Zadośćuczynienie Bogu i bliźniemu

RACHUNEK SUMIENIA według przykazań:

Wobec Boga (I–III przykazanie):
• Czy zaniedbywałem modlitwę, Mszę niedzielną, sakramenty?
• Czy bluźniłem, przeklinałem, używałem imienia Bożego nadaremno?
• Czy dawałem zgorszenie wiarą, wstydził się jej?

Wobec bliźnich (IV–X przykazanie):
• Czy byłem nieposłuszny rodzicom lub przełożonym?
• Czy skrzywdziłem kogoś słowem, czynem, zaniedbaniem?
• Czy popełniłem grzech nieczystości — myślą, słowem, czynem?
• Czy okradłem kogoś, wyrządziłem szkodę materialną?
• Czy kłamałem, oczerniałem, plotkowałem?
• Czy zazdrościłem, żywiłem urazy, nie przebaczyłem?

Wobec siebie:
• Czy dbam o zdrowie, nie ulegam nałogom?
• Czy marnuję czas, talenty dane od Boga?

Akt żalu:
Boże, bądź miłościw mnie grzesznemu.
Żałuję za grzechy moje,
bo przez nie zasłużyłem na Twoje kary,
a nade wszystko, że Ciebie, mój Boże,
nieskończenie dobrego i godnego miłości, obraziłem.
Postanawiam poprawę, przystąpić do spowiedzi
i zadośćuczynić za grzechy. Amen.',
 'Katechizm', 'pl', ARRAY['katechizm','spowiedź','rachunek sumienia'], 68),

('Cnoty teologalne i kardynalne',
 'CNOTY TEOLOGALNE (dotyczą bezpośrednio Boga):

WIARA — przyjęcie objawienia Bożego jako prawdy.
„Wiara jest poręką tych dóbr, których się spodziewamy, dowodem tych rzeczywistości, których nie widzimy." (Hbr 11,1)

NADZIEJA — ufne oczekiwanie zbawienia i pomocy Bożej.
„Nadzieja zaś zawieść nie może, ponieważ miłość Boża rozlana jest w sercach naszych." (Rz 5,5)

MIŁOŚĆ (caritas) — miłowanie Boga nade wszystko i bliźniego dla Boga.
„Największa z nich jest miłość." (1 Kor 13,13)

CNOTY KARDYNALNE (fundamenty życia moralnego):

ROZTROPNOŚĆ — właściwa ocena i wybór środków do celu.
SPRAWIEDLIWOŚĆ — oddanie każdemu tego, co mu się należy.
UMIARKOWANIE — panowanie nad pragnieniami zmysłowymi.
MĘSTWO — wytrwałość w dobru i gotowość do ofiary.

„Jeśli kto miłuje sprawiedliwość — jej trudy są cnotami: uczy ona bowiem umiarkowania i roztropności, sprawiedliwości i męstwa." (Mdr 8,7)',
 'Katechizm', 'pl', ARRAY['katechizm','cnoty','teologalne','kardynalne'], 69),

('Ostateczne rzeczy człowieka',
 'Cztery rzeczy ostateczne, o których należy pamiętać:

1. ŚMIERĆ
„Postanowione ludziom raz umrzeć, a potem sąd." (Hbr 9,27)
Każdy człowiek umiera tylko raz. Chwila śmierci jest nieznana — dlatego żyj tak, byś był zawsze gotów.

2. SĄD
Sąd szczegółowy — zaraz po śmierci, dla każdego z osobna.
Sąd ostateczny — na końcu czasów, dla wszystkich razem.
„Albowiem my wszyscy musimy stanąć przed trybunałem Chrystusa." (2 Kor 5,10)

3. NIEBO
Wieczna szczęśliwość — oglądanie Boga twarzą w twarz (visio beatifica).
„Ani oko nie widziało, ani ucho nie słyszało, ani serce człowieka nie zdołało pojąć, jak wielkie rzeczy przygotował Bóg tym, którzy Go miłują." (1 Kor 2,9)

4. PIEKŁO
Wieczne odrzucenie od Boga — dla tych, którzy dobrowolnie i ostatecznie odwrócili się od Niego.
„Idźcie precz ode mnie, przeklęci, w ogień wieczny." (Mt 25,41)

CZYŚCIEC
Stan oczyszczenia po śmierci dla tych, którzy umarli w łasce, ale potrzebują oczyszczenia.
Dusze w czyśćcu możemy wspierać modlitwą i ofiarą Mszy świętej.',
 'Katechizm', 'pl', ARRAY['katechizm','eschatologia','śmierć','niebo','piekło'], 70),

('Modlitwa Pańska — rozważanie',
 'Ojcze nasz — Bóg jest naszym Ojcem; jesteśmy Jego dziećmi i braćmi między sobą.

któryś jest w niebie — niebo to nie miejsce, lecz sposób istnienia; Bóg jest ponad wszystkim.

niech się święci imię Twoje — pierwsze życzenie: niech Bóg będzie znany, kochany i chwalony.

niech przyjdzie królestwo Twoje — drugie życzenie: niech Boże panowanie ogarnie wszystkich i wszystko.

niech Twoja wola się spełnia na ziemi, tak jak w niebie — trzecie życzenie: nasze życie zgodne z wolą Bożą.

Chleba naszego powszedniego daj nam dzisiaj — pierwsza prośba o dobra ziemskie niezbędne do życia; dziękczynienie za codzienność.

i przebacz nam nasze winy, jako i my przebaczamy — przebaczenie warunkowe: sami musimy przebaczać, by otrzymać przebaczenie.

i nie wódź nas na pokuszenie — nie wystawiaj nas na próby ponad nasze siły.

ale nas zbaw ode złego — od szatana, grzechu i wiecznej śmierci.

Amen — „niech tak będzie"; osobiste potwierdzenie modlitwy.',
 'Katechizm', 'pl', ARRAY['katechizm','ojcze nasz','rozważanie'], 71)

on conflict do nothing;
