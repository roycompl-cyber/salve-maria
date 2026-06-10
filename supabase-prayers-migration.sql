-- Prayers table
create table if not exists public.prayers (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  category    text not null default 'Ogólne',
  language    text not null default 'pl',
  tags        text[] default '{}',
  sort_order  int  default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.prayers enable row level security;

-- Everyone can read prayers
drop policy if exists "prayers_read_all" on public.prayers;
create policy "prayers_read_all"
  on public.prayers for select
  using (true);

-- Only admins can write
drop policy if exists "prayers_write_admin" on public.prayers;
create policy "prayers_write_admin"
  on public.prayers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed with existing mock prayers
insert into public.prayers (title, content, category, language, tags, sort_order) values
('Ojcze Nasz',
 'Ojcze nasz, któryś jest w niebie,
niech się święci imię Twoje;
niech przyjdzie królestwo Twoje;
niech Twoja wola się spełnia na ziemi, tak jak w niebie.
Chleba naszego powszedniego
daj nam dzisiaj;
i przebacz nam nasze winy,
jako i my przebaczamy tym, którzy przeciw nam zawinili;
i nie wódź nas na pokuszenie,
ale nas zbaw ode złego. Amen.',
 'Podstawowe', 'pl', ARRAY['codzienna','modlitwa Pańska'], 1),

('Zdrowaś Maryjo',
 'Zdrowaś Maryjo, łaski pełna,
Pan z Tobą,
błogosławionaś Ty między niewiastami
i błogosławiony owoc żywota Twojego, Jezus.
Święta Maryjo, Matko Boża,
módl się za nami grzesznymi
teraz i w godzinę śmierci naszej. Amen.',
 'Maryjna', 'pl', ARRAY['maryjna','różaniec'], 2),

('Różaniec — Tajemnice Radosne',
 'I. Zwiastowanie Najświętszej Maryi Pannie
II. Nawiedzenie Świętej Elżbiety
III. Narodzenie Pana Jezusa
IV. Ofiarowanie Pana Jezusa w świątyni
V. Znalezienie Pana Jezusa w świątyni

Na każdą tajemnicę:
- 1× Ojcze Nasz
- 10× Zdrowaś Maryjo
- 1× Chwała Ojcu',
 'Różaniec', 'pl', ARRAY['różaniec','maryjna','poniedziałek','sobota'], 3),

('Modlitwa za darczyńców',
 'Panie Boże, w Trójcy Świętej jedyny,
dziękujemy Ci za dobroć serc tych,
którzy wspierają nasze dzieło.
Niech Twoje błogosławieństwo spłynie na nich
na każdy dzień ich życia,
niech Twoja łaska mnoży owoce ich ofiarności
i napełnia ich serca pokojem i radością.
Przez Chrystusa Pana naszego. Amen.',
 'Specjalne', 'pl', ARRAY['wdzięczność','darczyńcy','błogosławieństwo'], 4),

('Koronka do Bożego Miłosierdzia',
 'Na początku:
Ojcze Nasz, Zdrowaś Maryjo, Wierzę w Boga.

Na paciorka Ojcze Nasz:
"Ojcze Przedwieczny, ofiaruję Ci Ciało i Krew,
Duszę i Bóstwo najmilszego Syna Twojego,
a Pana naszego Jezusa Chrystusa,
na przebłaganie za grzechy nasze
i całego świata."

Na paciorkach Zdrowaś Maryjo (10 razy):
"Dla Jego bolesnej Męki
miej miłosierdzie dla nas i całego świata."

Na zakończenie (3 razy):
"Święty Boże, Święty Mocny,
Święty Nieśmiertelny,
zmiłuj się nad nami i nad całym światem."',
 'Koronki', 'pl', ARRAY['miłosierdzie','godzina trzecia','koronka'], 5),

('Pater Noster',
 'Pater noster, qui es in cælis:
sanctificétur nomen tuum;
advéniat regnum tuum;
fiat volúntas tua,
sicut in cælo, et in terra.
Panem nostrum cotidiánum da nobis hódie;
et dimítte nobis débita nostra,
sicut et nos dimíttimus debitóribus nostris;
et ne nos indúcas in tentatiónem;
sed líbera nos a malo. Amen.',
 'Łacińskie', 'la', ARRAY['łacina','tradycja'], 6),

('Modlitwa poranna',
 'Boże, dziękuję Ci za noc spokojną
i za nowy dzień, który mi dajesz.
Ofiaruję Ci wszystkie moje myśli, słowa i uczynki
tego dnia.
Niech wszystko, co czynię,
będzie na Twoją chwałę i ku pożytkowi bliźnich.
Strzeż mnie od grzechu
i prowadź drogą Twoich przykazań.
Amen.',
 'Poranna/Wieczorna', 'pl', ARRAY['poranna','codzienna'], 7),

('Modlitwa wieczorna',
 'Boże w Trójcy Świętej Jedyny,
dziękuję Ci za dzień dzisiejszy,
za wszystko dobro, jakie przez ten dzień otrzymałem.
Przebacz mi wszystkie grzechy i zaniedbania.
Połącz mój nocny spoczynek
z odpoczynkiem Jezusa w grobie
i z Jego chwalebnym Zmartwychwstaniem.
Amen.',
 'Poranna/Wieczorna', 'pl', ARRAY['wieczorna','codzienna'], 8)

,

-- ── PACIERZ ──────────────────────────────────────────────────────────────────
('Skład Apostolski (Wierzę w Boga)',
 'Wierzę w Boga, Ojca wszechmogącego,
Stworzyciela nieba i ziemi.
I w Jezusa Chrystusa, Syna Jego jedynego, Pana naszego,
który się począł z Ducha Świętego,
narodził się z Maryi Panny,
umęczon pod Ponckim Piłatem,
ukrzyżowan, umarł i pogrzebion,
zstąpił do piekieł,
trzeciego dnia zmartwychwstał,
wstąpił na niebiosa,
siedzi po prawicy Boga Ojca wszechmogącego,
stamtąd przyjdzie sądzić żywych i umarłych.
Wierzę w Ducha Świętego,
święty Kościół powszechny,
świętych obcowanie,
grzechów odpuszczenie,
ciała zmartwychwstanie,
żywot wieczny. Amen.',
 'Pacierz', 'pl', ARRAY['pacierz','wyznanie wiary','podstawowe'], 10),

('Chwała Ojcu (Doksologia)',
 'Chwała Ojcu i Synowi,
i Duchowi Świętemu.
Jak była na początku, teraz i zawsze,
i na wieki wieków. Amen.',
 'Pacierz', 'pl', ARRAY['pacierz','podstawowe','różaniec'], 11),

('Anioł Pański',
 'Anioł Pański zwiastował Pannie Maryi
i poczęła z Ducha Świętego.
Zdrowaś Maryjo…

Oto ja służebnica Pańska,
niech mi się stanie według słowa Twego.
Zdrowaś Maryjo…

A Słowo stało się Ciałem
i zamieszkało między nami.
Zdrowaś Maryjo…

Módl się za nami, święta Boża Rodzicielko,
abyśmy się stali godnymi obietnic Chrystusowych.

Módlmy się:
Łaskę Twoją, prosimy Cię, Panie, racz wlać w serca nasze,
abyśmy, którzy za zwiastowaniem anielskim
Wcielenie Chrystusa Syna Twego poznali,
przez Mękę Jego i Krzyż do chwały Zmartwychwstania byli doprowadzeni.
Przez Chrystusa Pana naszego. Amen.',
 'Pacierz', 'pl', ARRAY['pacierz','maryjna','codzienna'], 12),

('Wieczny odpoczynek (De profundis)',
 'Wieczny odpoczynek racz Im dać, Panie,
a światłość wiekuista niechaj Im świeci.
Niech odpoczywają w pokoju wiecznym. Amen.

Z głębokości wołam do Ciebie, Panie,
Panie, słuchaj głosu mego!
Niechaj uszy Twoje będą nakłonione
ku głosowi błagania mego!

Jeśli zachowasz pamięć o grzechach, Panie,
Panie, któż się ostoi?
Ale Ty udzielasz przebaczenia,
aby Cię otaczała cześć.

Pokładam nadzieję w Panu,
dusza moja pokłada nadzieję w Jego słowie,
dusza moja oczekuje Pana.
Bardziej niż strażnicy świtu niechaj Izrael wygląda Pana.',
 'Pacierz', 'pl', ARRAY['pacierz','za zmarłych','żałobna'], 13),

('Akty strzeliste (zestaw)',
 'Akt wiary:
Wierzę w Ciebie, Boże żywy,
w Trójcy jedyny, prawdziwy.
Wierzę, coś objawił, Boże,
Twe słowo mnie mylić nie może.

Akt nadziei:
Ufam Tobie, boś Ty wierny,
wszechmocny i miłosierny.
Dasz mi grzechów odpuszczenie,
łaskę i zbawienie.

Akt miłości:
Boże, choć Cię nie pojmuję,
jednak nad wszystko miłuję.
Nad wszystko, co jest stworzone,
miłuję dobro wszelkie — Ciebie.

Akt żalu:
Ach, żałuję za me złości
jedynie dla Twej miłości.
Bądź miłościw mnie grzesznemu,
do poprawy dążącemu.',
 'Pacierz', 'pl', ARRAY['pacierz','podstawowe','wiara'], 14),

-- ── LITANIE ──────────────────────────────────────────────────────────────────
('Litania Loretańska do NMP',
 'Kyrie, elejson. Chryste, elejson. Kyrie, elejson.
Chryste, usłysz nas. Chryste, wysłuchaj nas.

Ojcze z nieba, Boże — zmiłuj się nad nami.
Synu, Odkupicielu świata, Boże — zmiłuj się nad nami.
Duchu Święty, Boże — zmiłuj się nad nami.
Święta Trójco, jedyny Boże — zmiłuj się nad nami.

Święta Maryjo — módl się za nami.
Święta Boża Rodzicielko — módl się za nami.
Święta Panno nad pannami — módl się za nami.
Matko Chrystusowa — módl się za nami.
Matko Kościoła — módl się za nami.
Matko łaski Bożej — módl się za nami.
Matko Miłosierdzia — módl się za nami.
Matko miłości Bożej — módl się za nami.
Matko Niepokalana — módl się za nami.
Matko nienaruszona — módl się za nami.
Matko dziewicza — módl się za nami.
Matko nieskażona — módl się za nami.
Matko najmilsza — módl się za nami.
Matko przedziwna — módl się za nami.
Matko dobrej rady — módl się za nami.
Matko Stworzyciela — módl się za nami.
Matko Zbawiciela — módl się za nami.
Panno roztropna — módl się za nami.
Panno czcigodna — módl się za nami.
Panno wsławiona — módl się za nami.
Panno można — módl się za nami.
Panno łaskawa — módl się za nami.
Panno wierna — módl się za nami.
Zwierciadło sprawiedliwości — módl się za nami.
Stolico mądrości — módl się za nami.
Przyczyno naszej radości — módl się za nami.
Przybytku Ducha Świętego — módl się za nami.
Przybytku chwalebny — módl się za nami.
Przybytku sławny pobożności — módl się za nami.
Różo duchowna — módl się za nami.
Wieżo Dawidowa — módl się za nami.
Wieżo z kości słoniowej — módl się za nami.
Domie złoty — módl się za nami.
Arko przymierza — módl się za nami.
Bramo niebieska — módl się za nami.
Gwiazdo zaranna — módl się za nami.
Zdrowie chorych — módl się za nami.
Ucieczko grzesznych — módl się za nami.
Pocieszycielko strapionych — módl się za nami.
Wspomożenie wiernych — módl się za nami.
Królowo aniołów — módl się za nami.
Królowo patriarchów — módl się za nami.
Królowo proroków — módl się za nami.
Królowo apostołów — módl się za nami.
Królowo męczenników — módl się za nami.
Królowo wyznawców — módl się za nami.
Królowo dziewic — módl się za nami.
Królowo wszystkich świętych — módl się za nami.
Królowo bez zmazy pierworodnej poczęta — módl się za nami.
Królowo wniebowzięta — módl się za nami.
Królowo różańca świętego — módl się za nami.
Królowo rodzin — módl się za nami.
Królowo pokoju — módl się za nami.
Królowo Polski — módl się za nami.

Baranku Boży, który gładzisz grzechy świata — przepuść nam, Panie.
Baranku Boży, który gładzisz grzechy świata — wysłuchaj nas, Panie.
Baranku Boży, który gładzisz grzechy świata — zmiłuj się nad nami.

Módl się za nami, święta Boża Rodzicielko,
abyśmy się stali godnymi obietnic Chrystusowych.

Módlmy się:
Panie Boże nasz, daj nam, sługom Twoim, cieszyć się trwałym zdrowiem duszy i ciała, i za przyczyną chwalebnej Maryi, zawsze Dziewicy, uwolnij nas od doczesnych smutków i obdarz wieczną radością. Przez Chrystusa Pana naszego. Amen.',
 'Litanie', 'pl', ARRAY['litania','maryjna','loretańska'], 20),

('Litania do Serca Pana Jezusa',
 'Kyrie, elejson. Chryste, elejson. Kyrie, elejson.
Chryste, usłysz nas. Chryste, wysłuchaj nas.

Ojcze z nieba, Boże — zmiłuj się nad nami.
Synu, Odkupicielu świata, Boże — zmiłuj się nad nami.
Duchu Święty, Boże — zmiłuj się nad nami.
Święta Trójco, jedyny Boże — zmiłuj się nad nami.

Serce Jezusa, Syna Ojca Przedwiecznego — zmiłuj się nad nami.
Serce Jezusa, w łonie Matki Dziewicy przez Ducha Świętego utworzone — zmiłuj się nad nami.
Serce Jezusa, ze Słowem Bożym istotowo zjednoczone — zmiłuj się nad nami.
Serce Jezusa, nieskończonego majestatu — zmiłuj się nad nami.
Serce Jezusa, świątynio Boga — zmiłuj się nad nami.
Serce Jezusa, przybytku Najwyższego — zmiłuj się nad nami.
Serce Jezusa, domie Boży i bramo niebios — zmiłuj się nad nami.
Serce Jezusa, gorejące ognisko miłości — zmiłuj się nad nami.
Serce Jezusa, sprawiedliwości i miłości skarbnico — zmiłuj się nad nami.
Serce Jezusa, dobroci i miłości pełne — zmiłuj się nad nami.
Serce Jezusa, cnót wszelkich bezdenna głębino — zmiłuj się nad nami.
Serce Jezusa, wszelkiej chwały najgodniejsze — zmiłuj się nad nami.
Serce Jezusa, królu i zjednoczenie serc wszelkich — zmiłuj się nad nami.
Serce Jezusa, w którym są wszystkie skarby mądrości i umiejętności — zmiłuj się nad nami.
Serce Jezusa, w którym mieszka cała pełność bóstwa — zmiłuj się nad nami.
Serce Jezusa, w którym sobie Ojciec bardzo upodobał — zmiłuj się nad nami.
Serce Jezusa, z Twojej pełni wszyscyśmy otrzymali — zmiłuj się nad nami.
Serce Jezusa, odwieczna tęsknoto świata — zmiłuj się nad nami.
Serce Jezusa, cierpliwe i wielkiego miłosierdzia — zmiłuj się nad nami.
Serce Jezusa, hojne dla wszystkich, którzy Cię wzywają — zmiłuj się nad nami.
Serce Jezusa, źródło życia i świętości — zmiłuj się nad nami.
Serce Jezusa, przebłaganie za grzechy nasze — zmiłuj się nad nami.
Serce Jezusa, zelżywością nasycone — zmiłuj się nad nami.
Serce Jezusa, dla nieprawości naszych starte — zmiłuj się nad nami.
Serce Jezusa, aż do śmierci posłuszne — zmiłuj się nad nami.
Serce Jezusa, włócznią przebite — zmiłuj się nad nami.
Serce Jezusa, źródło wszelkiej pociechy — zmiłuj się nad nami.
Serce Jezusa, życie i zmartwychwstanie nasze — zmiłuj się nad nami.
Serce Jezusa, pokój i pojednanie nasze — zmiłuj się nad nami.
Serce Jezusa, ofiaro grzeszników — zmiłuj się nad nami.
Serce Jezusa, zbawienie ufających Tobie — zmiłuj się nad nami.
Serce Jezusa, nadziejo w Tobie umierających — zmiłuj się nad nami.
Serce Jezusa, rozkoszy wszystkich świętych — zmiłuj się nad nami.

Baranku Boży, który gładzisz grzechy świata — przepuść nam, Panie.
Baranku Boży, który gładzisz grzechy świata — wysłuchaj nas, Panie.
Baranku Boży, który gładzisz grzechy świata — zmiłuj się nad nami.

Jezu cichy i serca pokornego,
uczyń serce nasze według Serca Twego.

Módlmy się:
Wszechmogący i wieczny Boże, wejrzyj na Serce najmilszego Syna Swego i na chwałę, i zadośćuczynienie, jakie składa w imieniu grzeszników; daj się przebłagać tym, którzy żebrzą Twego miłosierdzia, i racz udzielić przebaczenia w imię tegoż Syna Twojego, Jezusa Chrystusa, który z Tobą żyje i króluje na wieki wieków. Amen.',
 'Litanie', 'pl', ARRAY['litania','do serca jezusa','czerwiec'], 21),

('Litania do Wszystkich Świętych',
 'Kyrie, elejson. Chryste, elejson. Kyrie, elejson.
Chryste, usłysz nas. Chryste, wysłuchaj nas.

Ojcze z nieba, Boże — zmiłuj się nad nami.
Synu, Odkupicielu świata, Boże — zmiłuj się nad nami.
Duchu Święty, Boże — zmiłuj się nad nami.
Święta Trójco, jedyny Boże — zmiłuj się nad nami.

Święta Maryjo — módl się za nami.
Święta Boża Rodzicielko — módl się za nami.
Święta Dziewico nad Dziewicami — módl się za nami.
Święty Michale — módl się za nami.
Święty Gabrielu — módl się za nami.
Święty Rafale — módl się za nami.
Wszyscy święci Aniołowie i Archaniołowie — módlcie się za nami.
Święty Janie Chrzcicielu — módl się za nami.
Święty Józefie — módl się za nami.
Wszyscy święci Patriarchowie i Prorocy — módlcie się za nami.
Święty Piotrze — módl się za nami.
Święty Pawle — módl się za nami.
Święty Andrzeju — módl się za nami.
Święty Janie — módl się za nami.
Wszyscy święci Apostołowie i Ewangeliści — módlcie się za nami.
Wszyscy święci Uczniowie Pańscy — módlcie się za nami.
Wszyscy święci Młodziankowie — módlcie się za nami.
Święty Szczepanie — módl się za nami.
Święty Wawrzyńcze — módl się za nami.
Wszyscy święci Męczennicy — módlcie się za nami.
Święty Sylwestrze — módl się za nami.
Święty Grzegorzu — módl się za nami.
Święty Augustynie — módl się za nami.
Wszyscy święci Biskupi i Wyznawcy — módlcie się za nami.
Wszyscy święci Doktorowie — módlcie się za nami.
Święty Benedykcie — módl się za nami.
Święty Dominiku — módl się za nami.
Święty Franciszku — módl się za nami.
Wszyscy święci Kapłani i Lewici — módlcie się za nami.
Wszyscy święci Mnisi i Pustelnicy — módlcie się za nami.
Święta Mario Magdaleno — módl się za nami.
Święta Agnieszko — módl się za nami.
Święta Cecylio — módl się za nami.
Święta Katarzyno — módl się za nami.
Święta Małgorzato — módl się za nami.
Błogosławiona Jadwigo — módl się za nami.
Wszyscy Święci i Święte Boże — módlcie się za nami.

Bądź nam miłościw — przepuść nam, Panie.
Od wszelkiego złego — wybaw nas, Panie.
Od wszelkiego grzechu — wybaw nas, Panie.
Od śmierci wiecznej — wybaw nas, Panie.
Przez Twoje Wcielenie — wybaw nas, Panie.
Przez Twoje Narodzenie — wybaw nas, Panie.
Przez Twój Chrzest i święty post — wybaw nas, Panie.
Przez Twój Krzyż i Mękę — wybaw nas, Panie.
Przez Twoją śmierć i złożenie do grobu — wybaw nas, Panie.
Przez Twoje święte Zmartwychwstanie — wybaw nas, Panie.
Przez Twoje cudowne Wniebowstąpienie — wybaw nas, Panie.
Przez zesłanie Ducha Świętego — wybaw nas, Panie.

Baranku Boży, który gładzisz grzechy świata — przepuść nam, Panie.
Baranku Boży, który gładzisz grzechy świata — wysłuchaj nas, Panie.
Baranku Boży, który gładzisz grzechy świata — zmiłuj się nad nami.

Chryste, usłysz nas. Chryste, wysłuchaj nas.
Kyrie, elejson. Chryste, elejson. Kyrie, elejson.',
 'Litanie', 'pl', ARRAY['litania','wszyscy święci','1 listopada'], 22),

('Litania do św. Józefa',
 'Kyrie, elejson. Chryste, elejson. Kyrie, elejson.
Chryste, usłysz nas. Chryste, wysłuchaj nas.

Ojcze z nieba, Boże — zmiłuj się nad nami.
Synu, Odkupicielu świata, Boże — zmiłuj się nad nami.
Duchu Święty, Boże — zmiłuj się nad nami.
Święta Trójco, jedyny Boże — zmiłuj się nad nami.

Święta Maryjo — módl się za nami.
Święty Józefie — módl się za nami.
Przesławny potomku Dawida — módl się za nami.
Światło Patriarchów — módl się za nami.
Oblubieńcze Matki Bożej — módl się za nami.
Przeczysty Stróżu Dziewicy — módl się za nami.
Żywicielu Syna Bożego — módl się za nami.
Troskliwy Obrońco Chrystusa — módl się za nami.
Głowo Najświętszej Rodziny — módl się za nami.
Józefie najsprawiedliwszy — módl się za nami.
Józefie najczystszy — módl się za nami.
Józefie najroztropniejszy — módl się za nami.
Józefie najdzielniejszy — módl się za nami.
Józefie najposłuszniejszy — módl się za nami.
Józefie najwierniejszy — módl się za nami.
Zwierciadło cierpliwości — módl się za nami.
Miłośniku ubóstwa — módl się za nami.
Wzorze dla pracujących — módl się za nami.
Ozdobo życia rodzinnego — módl się za nami.
Opiekunie dziewic — módl się za nami.
Ostojo rodzin — módl się za nami.
Pociecho nieszczęśliwych — módl się za nami.
Nadziejo chorych — módl się za nami.
Patronie umierających — módl się za nami.
Postrachu duchów piekielnych — módl się za nami.
Opiekunie Kościoła Świętego — módl się za nami.

Baranku Boży, który gładzisz grzechy świata — przepuść nam, Panie.
Baranku Boży, który gładzisz grzechy świata — wysłuchaj nas, Panie.
Baranku Boży, który gładzisz grzechy świata — zmiłuj się nad nami.

Ustanowił go panem domu swego.
I zarządcą wszelkiej swojej własności.

Módlmy się:
Boże, który w przedziwnej Opatrzności wybrałeś świętego Józefa na Oblubieńca Najświętszej Rodzicielki Twojego Syna, spraw, abyśmy mając go za opiekuna na ziemi, zasłużyli na jego orędownictwo w niebie. Przez Chrystusa Pana naszego. Amen.',
 'Litanie', 'pl', ARRAY['litania','józef','rodzina','marzec'], 23),

-- ── NOWENNY ──────────────────────────────────────────────────────────────────
('Nowenna do Miłosierdzia Bożego',
 'Nowenna do Miłosierdzia Bożego — podyktowana przez Pana Jezusa św. Faustynie
Odmawiać przez 9 dni (Wielki Piątek – Wigilia Niedzieli Miłosierdzia)

Każdego dnia odmów Koronkę do Bożego Miłosierdzia, a następnie modlitwę na dany dzień.

DZIEŃ I – W intencji całej ludzkości, a szczególnie grzeszników:
Jezu miłosierny, którego właściwością jest litować się nad nami i przebaczać nam, nie patrz na grzechy nasze, ale na ufność, jaką mamy w nieskończoną dobroć Twoją, i przyjmij nas wszystkich do mieszkania najlitościwszego Serca Twego…

DZIEŃ II – W intencji kapłanów i zakonników:
Jezu miłosierny, od którego pochodzi wszelkie dobro, pomnóż w nas łaskę, abyśmy spełniali miłosierne uczynki, by ci, co na nas patrzą, chwalili Ojca Miłosierdzia, który jest w niebie…

DZIEŃ III – W intencji wszystkich dusz pobożnych i wiernych:
Jezu miłosierny, który przez szczególną łaskę oświecasz serca pełne dobrej woli, przyjmij do mieszkania Najlitościwszego Serca Swego dusze dobre i rozmiłowane w Tobie…

DZIEŃ IV – W intencji pogan i tych, którzy Cię jeszcze nie znają:
Jezu miłosierny, Ty jesteś Światłością całego świata, przyjmij do mieszkania Najlitościwszego Serca Swego dusze pogan, które Cię nie znają…

DZIEŃ V – W intencji heretyków i schizmatyków:
Jezu miłosierny, Dobroci sama, Ty nie odmawiasz światła tym, którzy Cię proszą, przyjmij do Serca swego dusze heretyków i schizmatyków…

DZIEŃ VI – W intencji dusz cichych i pokornych oraz dusz dzieci:
Jezu miłosierny, Ty sam powiedziałeś: uczcie się ode mnie, żem jest cichy i pokorny sercem, przyjmij do mieszkania Najlitościwszego Serca Swego dusze ciche i pokorne…

DZIEŃ VII – W intencji dusz, które szczególnie czczą i wysławiają miłosierdzie Boże:
Jezu miłosierny, którego miłość i miłosierdzie jest bez miary, przyjmij do Serca Swego dusze, które szczególnie czczą i wysławiają wielkość miłosierdzia Twego…

DZIEŃ VIII – W intencji dusz w czyśćcu zatrzymanych:
Jezu miłosierny, Ty sam powiedziałeś, że chcesz miłosierdzia, otóż wprowadzam do mieszkania Najlitościwszego Serca Twego dusze czyśćcowe, dusze, które są Ci bardzo miłe…

DZIEŃ IX – W intencji dusz letnich:
Jezu miłosierny, Ty sam jesteś Miłością i Miłosierdziem, przyjmij do mieszkania Najlitościwszego Serca Swego dusze letnie, które są otwartą raną w Sercu Twoim…

Na zakończenie każdego dnia:
O Krwi i Wodo, która wytrysnęłaś z Serca Jezusowego jako zdrój miłosierdzia dla nas — ufam Tobie!',
 'Nowenny', 'pl', ARRAY['nowenna','miłosierdzie','faustyna','wielkanoc'], 30),

('Nowenna do Ducha Świętego',
 'Nowenna przed Zesłaniem Ducha Świętego (odmawiana przez 9 dni przed Zielonymi Świętkami)

Przyjdź, Duchu Święty, ześlij nam z nieba błysk Twej jasności.

Przyjdź, Ojcze ubogich,
przyjdź, dawco darów wszelkich,
przyjdź, Światłości serc.

Najlepszy Pocieszycielu,
słodki gościu duszy,
słodkie orzeźwienie.

W pracy Tyś odpocznieniem,
w skwarze upał uśmierzasz,
Tyś pociechy łza.

Światłości najszczęśliwsza,
serc wiernych wnętrza napełnij
bez Twej mocy Bożej
człowiek jest niczym.

Obmyj, co brudne,
nawodnij, co oschłe,
ulecz, co zranione.
Nagnij, co harde,
ogrzej, co zięble,
Przywiedź na drogę zbłąkane.

Daj Twoim wiernym,
którzy Tobie ufają,
siedem świętych darów:
daj nam zasługę i czysty żywot,
daj nam radość i wieczyste zbawienie.
Amen. Alleluja.

Módlmy się:
Boże, któryś serca wiernych światłem Ducha Świętego oświecić raczył, daj nam w tymże Duchu znać co dobre i pociechą Jego zawsze się weselić. Przez Chrystusa Pana naszego. Amen.',
 'Nowenny', 'pl', ARRAY['nowenna','duch święty','zielone świątki'], 31),

('Nowenna do Matki Bożej Nieustającej Pomocy',
 'Nowenna do Matki Bożej Nieustającej Pomocy (odmawiana w środy)

O Matko Boża Nieustającej Pomocy,
przychodzimy do Ciebie z ufnością dzieci.
Jesteś naszą Matką i Pomocą —
nie opuszczaj nas w potrzebach naszych.

Dzień I – Boże macierzyństwo Maryi:
Maryjo, Matko Boża, Tyś przez swoje Boże macierzyństwo najbliższa Bogu ze wszystkich stworzeń. Wstawiaj się za nami, grzesznymi, i uproś nam łaskę, której potrzebujemy.

Dzień II – Niepokalane Poczęcie:
O Niepokalana Dziewico, Tyś wolna od wszelkiego grzechu. Wstawiaj się za nami, którzy tak często grzeszymy, i uproś nam łaskę wierności.

Dzień III – Pokora Maryi:
Najpokorniejsza Dziewico, naucz nas pokory i prostoty. Niech nie pysznimy się z naszych zdolności i zasług, lecz wszystko odnosimy do Boga.

Dzień IV – Wierność Maryi pod krzyżem:
O Matko Bolesna, Tyś wytrwała pod krzyżem Syna. Uproś nam wytrwałość w przeciwnościach i cierpliwe znoszenie naszego krzyża.

Dzień V – Maryja Pośredniczką łask:
O Matko Nieustającej Pomocy, przez Twoje ręce przechodzą wszystkie łaski. Przynieś nasze prośby do stóp Syna i uproś to, czego nam najbardziej potrzeba.

Modlitwa końcowa (odmawiana każdego dnia):
Matko Nieustającej Pomocy, oddaję się Tobie całkowicie i powierzam moją duszę i zbawienie. Spraw, abym zawsze był blisko Ciebie. Broń mnie od wszelkiego złego i prowadź do nieba. Amen.',
 'Nowenny', 'pl', ARRAY['nowenna','maryjna','nieustająca pomoc','środa'], 32),

('Nowenna do św. Rity',
 'Patronki spraw niemożliwych — odmawiana przez 9 kolejnych dni

Święta Rito, patronko spraw trudnych i beznadziejnych,
Ty, która przez całe życie nosiłaś Krzyż Chrystusa i uczestniczyłaś w Jego cierpieniu,
wejrzyj na mnie w mojej potrzebie.

Wiem, że Bóg nie opuszcza tych, którzy w Nim pokładają ufność,
i że Ty, wyjednałaś u Boga wiele łask,
które ludziom wydawały się niemożliwe.

Oto moja sprawa (wymień prośbę w myślach lub głośno)…

Wierzę, że jeśli taka jest wola Boża,
uprosisz dla mnie tę łaskę.
Jeśli zaś Bóg ma inne plany wobec mnie,
pomóż mi przyjąć je z poddaniem i miłością.

Święta Rito, módl się za mną!

Modlitwa dodatkowa:
O Boże, który w świętej Rycie raczyłeś obdarzyć nas przedziwnym przykładem miłości ku Tobie i nieprzyjaciołom, daj nam za jej przyczyną i w naśladowaniu jej cnót wytrwałość i pokój. Przez Chrystusa Pana naszego. Amen.',
 'Nowenny', 'pl', ARRAY['nowenna','rita','sprawy trudne','maj'], 33),

-- ── MODLITWY ŁACIŃSKIE ───────────────────────────────────────────────────────
('Ave Maria',
 'Ave Maria, gratia plena,
Dominus tecum.
Benedicta tu in mulieribus,
et benedictus fructus ventris tui, Iesus.
Sancta Maria, Mater Dei,
ora pro nobis peccatoribus,
nunc et in hora mortis nostrae. Amen.',
 'Łacińskie', 'la', ARRAY['łacina','maryjna','podstawowe'], 40),

('Gloria in Excelsis Deo',
 'Gloria in excelsis Deo
et in terra pax hominibus bonae voluntatis.
Laudamus te, benedicimus te,
adoramus te, glorificamus te,
gratias agimus tibi propter magnam gloriam tuam,
Domine Deus, Rex caelestis,
Deus Pater omnipotens.

Domine Fili unigenite, Iesu Christe,
Domine Deus, Agnus Dei, Filius Patris,
qui tollis peccata mundi, miserere nobis;
qui tollis peccata mundi, suscipe deprecationem nostram.
Qui sedes ad dexteram Patris, miserere nobis.

Quoniam tu solus Sanctus, tu solus Dominus,
tu solus Altissimus, Iesu Christe,
cum Sancto Spiritu in gloria Dei Patris. Amen.',
 'Łacińskie', 'la', ARRAY['łacina','chwała','msza'], 41),

('Salve Regina',
 'Salve, Regina, Mater misericordiae,
vita, dulcedo et spes nostra, salve.
Ad te clamamus, exsules filii Hevae.
Ad te suspiramus gementes et flentes
in hac lacrimarum valle.
Eia ergo, Advocata nostra,
illos tuos misericordes oculos ad nos converte.
Et Iesum, benedictum fructum ventris tui,
nobis post hoc exsilium ostende.
O clemens, o pia, o dulcis Virgo Maria.',
 'Łacińskie', 'la', ARRAY['łacina','maryjna','różaniec','kompletoria'], 42),

('Sub Tuum Praesidium',
 'Sub tuum praesidium confugimus,
Sancta Dei Genetrix;
nostras deprecationes ne despicias in necessitatibus nostris,
sed a periculis cunctis libera nos semper,
Virgo gloriosa et benedicta.',
 'Łacińskie', 'la', ARRAY['łacina','maryjna','najstarsza'], 43),

('Anima Christi',
 'Anima Christi, sanctifica me.
Corpus Christi, salva me.
Sanguis Christi, inebria me.
Aqua lateris Christi, lava me.
Passio Christi, conforta me.
O bone Iesu, exaudi me.
Intra tua vulnera absconde me.
Ne permittas me separari a te.
Ab hoste maligno defende me.
In hora mortis meae voca me.
Et iube me venire ad te.
Ut cum Sanctis tuis laudem te
in saecula saeculorum. Amen.',
 'Łacińskie', 'la', ARRAY['łacina','po komunii','ignacy'], 44),

('Memorare',
 'Memorare, O piissima Virgo Maria,
non esse auditum a saeculo,
quemquam ad tua currentem praesidia,
tua implorantem auxilia,
tua petentem suffragia esse derelictum.
Ego tali animatus confidentia,
ad te, Virgo Virginum, Mater, curro;
ad te venio, coram te gemens peccator assisto.
Noli, Mater Verbi, verba mea despicere,
sed audi propitia et exaudi. Amen.',
 'Łacińskie', 'la', ARRAY['łacina','maryjna','ufność'], 45),

('Kyrie Eleison — Trisagion',
 'Kyrie, eleison.
Christe, eleison.
Kyrie, eleison.

Sanctus Deus,
Sanctus Fortis,
Sanctus Immortalis,
miserere nobis.',
 'Łacińskie', 'la', ARRAY['łacina','msza','podstawowe'], 46)

on conflict do nothing;
