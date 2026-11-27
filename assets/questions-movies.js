/* Rewind Movie Night — the all-movies theme. Same format as questions.js, but every row starts with its
   toughness (1 easy, 2 medium, 3 hard): [tough, question, answer, [three wrong answers], fun fact].
   Rounds here get theme:"movies" automatically. Christmas rounds (questions.js) are theme "xmas". */
(() => {
  const R = window.ROUNDS;
  const add = (meta, rows) => {
    const r = Object.assign({ theme: "movies" }, meta);
    r.tough = rows.map(x => x[0]).join("");
    r.qs = rows.map(x => x.slice(1));
    R.push(r);
    return r;
  };

/* ---------- Regular rounds ---------- */
add({id:"mv-classics",kind:"feature",title:"Opening Night",sub:"The big ones everybody has seen"},[
[1,"In The Wizard of Oz (1939), what color are Dorothy’s magic slippers?","Ruby red",["Silver","Gold","Emerald green"],"In the original book, the slippers are silver. The movie made them red to show off Technicolor."],
[1,"In Jaws (1975), what’s the name of the island town the shark terrorizes?","Amity Island",["Nantucket","Cape Cod","Block Island"],"The movie was filmed on Martha’s Vineyard, which played Amity."],
[1,"In Back to the Future (1985), how many gigawatts does the DeLorean need to travel through time?","1.21",["88","2.21","12.1"],"It also has to hit 88 miles per hour."],
[1,"In E.T. the Extra-Terrestrial (1982), which candy does Elliott use to lure E.T. out?","Reese’s Pieces",["M&M’s","Skittles","Jelly beans"],"M&M’s turned down the chance. Sales of Reese’s Pieces jumped after the movie came out."],
[2,"In Jurassic Park (1993), what’s the name of the island where the park is built?","Isla Nublar",["Isla Sorna","Skull Island","Isla Muerta"],"Isla Sorna is “Site B,” the island from the sequels."],
[2,"In Titanic (1997), what’s the name of the huge blue diamond necklace?","The Heart of the Ocean",["The Star of India","The Blue Moon","The Pride of the Sea"],"It was inspired by the real Hope Diamond."],
[1,"In The Godfather (1972), what does a Hollywood producer wake up to find in his bed?","A horse’s head",["A dead fish","A bull’s horns","A pig’s head"],"The horse head was real. The prop team got it from a dog food company."],
[1,"In Raiders of the Lost Ark (1981), what is Indiana Jones afraid of?","Snakes",["Spiders","Heights","Rats"],"“Snakes. Why’d it have to be snakes?”"],
[1,"In Forrest Gump (1994), Forrest says life is like a box of what?","Chocolates",["Crayons","Surprises","Cereal"],"Tom Hanks won Best Actor two years in a row: for Philadelphia, then for Forrest Gump."],
[2,"In The Sound of Music (1965), how many von Trapp children are there?","Seven",["Five","Six","Eight"],"The real Georg von Trapp had ten children: seven with his first wife and three with Maria."],
[1,"In Ghostbusters (1984), what giant monster stomps through New York at the end?","The Stay Puft Marshmallow Man",["The Michelin Man","Slimer","A giant gingerbread man"],"Ray accidentally picks its shape when Gozer tells them to choose."],
[1,"In The Princess Bride (1987), finish Inigo Montoya’s line: “You killed my father. Prepare to…”","Die",["Fight","Duel","Run"],"Mandy Patinkin has said it’s his favorite role."],
[2,"In Rocky (1976), Rocky runs up the steps of which building?","The Philadelphia Museum of Art",["The Smithsonian","The Liberty Bell Center","Philadelphia City Hall"],"They’re now called the Rocky Steps, and a Rocky statue stands near the bottom."],
[1,"In Top Gun (1986), what is Tom Cruise’s call sign?","Maverick",["Iceman","Goose","Viper"],"Val Kilmer plays his rival, Iceman."],
[1,"In The Matrix (1999), which pill does Neo take?","The red pill",["The blue pill","The green pill","The white pill"],"The blue pill would have sent him back to his normal life, none the wiser."],
[2,"In Casablanca (1942), the city of Casablanca is in which country?","Morocco",["Algeria","Egypt","Tunisia"],"Almost the whole movie was shot on Hollywood sound stages."],
[2,"In Psycho (1960), Norman Bates runs which business?","The Bates Motel",["The Overlook Hotel","The Bates Diner","A taxidermy shop"],"Hitchcock bought up copies of the novel to keep the ending a secret."],
[2,"In The Shining (1980), Jack types the same line over and over: “All work and no play makes Jack a…”","Dull boy",["Bad boy","Tired boy","Lonely boy"],"For foreign versions, Kubrick had the pages retyped with a local saying in each language."],
[1,"In King Kong (1933), which building does Kong climb?","The Empire State Building",["The Chrysler Building","The Woolworth Building","The Flatiron Building"],"In the 1976 remake, he climbs the World Trade Center instead."],
[1,"Who directed Jaws, E.T. and Jurassic Park?","Steven Spielberg",["George Lucas","James Cameron","Robert Zemeckis"],"Spielberg was only 27 when he made Jaws."],
[1,"In The Terminator (1984), what famous line does Arnold Schwarzenegger say at the police station?","“I’ll be back.”",["“Hasta la vista, baby.”","“Get to the chopper!”","“Come with me if you want to live.”"],"“Hasta la vista, baby” is from Terminator 2."],
[3,"In Back to the Future, what’s the name of Doc Brown’s dog in 1985?","Einstein",["Newton","Copernicus","Tesla"],"In 1955, young Doc has a dog named Copernicus."]
]);

add({id:"mv-disney",kind:"feature",title:"House of Mouse",sub:"Disney and Pixar, from Snow White to today"},[
[1,"In The Lion King (1994), what does “Hakuna Matata” mean?","No worries",["Good luck","Long live the king","Let’s eat"],"Nathan Lane voices Timon, and Ernie Sabella voices Pumbaa."],
[1,"In The Little Mermaid (1989), which sea witch takes Ariel’s voice?","Ursula",["Morgana","Maleficent","Medusa"],"Morgana is Ursula’s little sister in The Little Mermaid II."],
[1,"In Beauty and the Beast (1991), what’s the name of the enchanted candlestick?","Lumière",["Cogsworth","Chip","Babette"],"Cogsworth is the clock, and Chip is the teacup."],
[1,"In Aladdin (1992), who voices the Genie?","Robin Williams",["Eddie Murphy","Jim Carrey","Will Smith"],"Will Smith played the Genie in the 2019 remake."],
[1,"In Toy Story (1995), what’s the name of the boy who owns Woody and Buzz?","Andy",["Sid","Al","Bonnie"],"Toy Story was the first feature film made entirely with computer animation."],
[1,"In Toy Story, Buzz Lightyear is a Space what?","Ranger",["Cadet","Marine","Trooper"],"Buzz was named after astronaut Buzz Aldrin."],
[2,"In Finding Nemo (2003), what kind of fish is Dory?","A blue tang",["A clownfish","An angelfish","A parrotfish"],"Ellen DeGeneres voices Dory."],
[1,"In Up (2009), how does Carl get his house off the ground?","Thousands of balloons",["A hot-air engine","A giant kite","Rocket boosters"],"Kevin, the giant bird, turns out to be a girl."],
[1,"In Frozen (2013), what’s the name of Elsa and Anna’s kingdom?","Arendelle",["Corona","Agrabah","Atlantica"],"Corona is Rapunzel’s kingdom in Tangled."],
[2,"In Monsters, Inc. (2001), what powers the city of Monstropolis at the start of the movie?","Children’s screams",["Lightning","Nightmares","Snoring"],"By the end, they find out kids’ laughter works even better."],
[2,"In Coco (2017), what does Miguel’s family make for a living?","Shoes",["Guitars","Candles","Bread"],"His great-great-grandmother started the shoe business after her husband left to play music."],
[1,"In Moana (2016), who voices the demigod Maui?","Dwayne Johnson",["Jason Momoa","Vin Diesel","Kevin Hart"],"Lin-Manuel Miranda co-wrote the songs."],
[1,"In The Incredibles (2004), who designs the family’s super suits?","Edna Mode",["Mirage","Frozone","Mr. Huph"],"Director Brad Bird voiced Edna himself."],
[2,"In Snow White and the Seven Dwarfs (1937), which dwarf never speaks?","Dopey",["Sleepy","Bashful","Happy"],"It was Disney’s first full-length animated movie."],
[1,"In Ratatouille (2007), Remy the rat cooks in which city?","Paris",["Lyon","Rome","New York"],"Pixar’s team took cooking classes to get the kitchen scenes right."],
[2,"In WALL-E (2008), what’s the name of the sleek robot WALL-E falls for?","EVE",["AUTO","M-O","HAL"],"AUTO is the ship’s evil autopilot."],
[2,"In Encanto (2021), what’s Mirabel’s family name?","Madrigal",["Rivera","Montoya","Encanto"],"“We Don’t Talk About Bruno” went to number one on the Billboard Hot 100."],
[2,"In Lilo & Stitch (2002), what’s Stitch’s experiment number?","626",["525","627","221"],"“Ohana means family. Family means nobody gets left behind.”"],
[1,"In Zootopia (2016), what kind of animal is officer Judy Hopps?","A rabbit",["A fox","A sheep","A raccoon"],"Her partner, Nick Wilde, is a fox."],
[2,"In Inside Out (2015), which of these emotions is NOT in Riley’s head in the first movie?","Anxiety",["Disgust","Fear","Anger"],"Anxiety shows up in Inside Out 2 (2024)."],
[2,"In Mulan (1998), who voices the little dragon Mushu?","Eddie Murphy",["Robin Williams","Chris Rock","Martin Lawrence"],"Mushu isn’t in the 2020 live-action remake."],
[3,"In Tangled (2010), what is Flynn Rider’s real name?","Eugene Fitzherbert",["Eric Fitzwilliam","Edward Fairfax","Flynn Fitzgerald"],"Rapunzel’s chameleon sidekick is named Pascal."],
[2,"In The Jungle Book (1967), which song does Baloo sing to Mowgli?","“The Bare Necessities”",["“Hakuna Matata”","“I Wan’na Be Like You”","“Trust in Me”"],"King Louie sings “I Wan’na Be Like You,” and Kaa the snake sings “Trust in Me.”"],
[2,"In Cars (2006), what number is on Lightning McQueen?","95",["43","1","86"],"95 is for 1995, the year Toy Story came out."]
]);

add({id:"mv-marvel",kind:"feature",title:"Avengers, Assemble!",sub:"Marvel heroes and villains"},[
[1,"In Iron Man (2008), what are Tony Stark’s famous last words of the movie?","“I am Iron Man.”",["“I love you 3000.”","“I’m always angry.”","“Genius, billionaire, playboy, philanthropist.”"],"He says it one last time in Avengers: Endgame."],
[1,"In the Marvel movies, what metal is Captain America’s shield made of?","Vibranium",["Adamantium","Uru","Titanium"],"Adamantium is the metal on Wolverine’s claws."],
[1,"What’s the name of Thor’s hammer?","Mjolnir",["Stormbreaker","Gungnir","Excalibur"],"Stormbreaker is the axe he gets in Avengers: Infinity War."],
[1,"In Black Panther (2018), what’s the name of T’Challa’s secret high-tech nation?","Wakanda",["Genovia","Zamunda","Sokovia"],"Zamunda is from Coming to America, and Sokovia is from Avengers: Age of Ultron."],
[2,"Who is the voice of Groot in Guardians of the Galaxy?","Vin Diesel",["Bradley Cooper","Dave Bautista","Chris Pratt"],"Bradley Cooper voices Rocket. Vin Diesel recorded “I am Groot” in several languages."],
[1,"How many Infinity Stones are there in the Marvel movies?","Six",["Five","Seven","Four"],"Space, Mind, Reality, Power, Time and Soul."],
[1,"Who plays Nick Fury in the Marvel movies?","Samuel L. Jackson",["Laurence Fishburne","Idris Elba","Don Cheadle"],"Captain Marvel reveals how Fury lost his eye: Goose the “cat” scratched it."],
[1,"What is the Hulk’s human name?","Bruce Banner",["Bruce Wayne","Peter Banner","Steve Banner"],"Mark Ruffalo took over the role in The Avengers (2012)."],
[1,"In Avengers: Endgame (2019), Tony’s daughter Morgan says “I love you” how much?","3000",["A million","Infinity","1000"],"Endgame briefly became the highest-grossing movie of all time."],
[2,"Which Infinity Stone is hidden in Doctor Strange’s Eye of Agamotto?","The Time Stone",["The Mind Stone","The Soul Stone","The Reality Stone"],"The Mind Stone is in Loki’s scepter, then in Vision’s forehead."],
[1,"Who plays Scott Lang in Ant-Man?","Paul Rudd",["Seth Rogen","Jason Sudeikis","Ryan Reynolds"],"Paul Rudd also helped write the first Ant-Man."],
[1,"What’s the name of Thor’s mischievous adopted brother?","Loki",["Heimdall","Baldur","Odin"],"Tom Hiddleston first auditioned for the part of Thor."],
[3,"In the Marvel movies, what do people call the five years when half of all life vanished after Thanos’s snap?","The Blip",["The Fade","The Gap","The Vanishing"],"Fans also call it “the Snap.”"],
[2,"Captain Marvel (2019) is mostly set in which decade?","The 1990s",["The 1980s","The 2000s","The 1970s"],"She crashes through the roof of a Blockbuster video store."],
[1,"Who plays Deadpool?","Ryan Reynolds",["Ryan Gosling","Chris Pratt","Hugh Jackman"],"Deadpool & Wolverine (2024) became the highest-grossing R-rated movie ever."],
[1,"Which Marvel legend made a quick cameo in almost every Marvel movie until 2019?","Stan Lee",["Jack Kirby","Kevin Feige","Steve Ditko"],"His last filmed cameo was in Avengers: Endgame."],
[1,"What is Black Widow’s real name?","Natasha Romanoff",["Wanda Maximoff","Yelena Belova","Maria Hill"],"Florence Pugh plays her sister, Yelena."],
[1,"Which Avenger is a World War II super-soldier who was frozen in ice?","Captain America",["Iron Man","Hawkeye","Thor"],"He wakes up about 70 years later."],
[2,"In Spider-Man: No Way Home (2021), which two earlier Spider-Man actors come back?","Tobey Maguire and Andrew Garfield",["Tobey Maguire and Jake Gyllenhaal","Andrew Garfield and Shameik Moore","Chris Evans and Andrew Garfield"],"Their return was one of the worst-kept secrets in Hollywood."],
[2,"In Guardians of the Galaxy (2014), what’s Star-Lord’s cassette tape called?","Awesome Mix Vol. 1",["Star-Lord’s Jams","Mom’s Mixtape","Greatest Hits of ’79"],"The soundtrack went to number one on the Billboard 200."],
[2,"What’s the name of Wanda Maximoff’s twin brother?","Pietro",["Vision","Tommy","Billy"],"Pietro is Quicksilver. Tommy and Billy are Wanda’s sons in WandaVision."],
[1,"In Spider-Man movies, what’s the name of Peter Parker’s aunt?","May",["Mary","June","Martha"],"Marisa Tomei plays her in the Tom Holland movies."]
]);

add({id:"mv-starwars",kind:"feature",title:"A Galaxy Far, Far Away",sub:"Star Wars, from Tatooine to the Mandalorian"},[
[1,"In Star Wars, who turns out to be Luke Skywalker’s father?","Darth Vader",["Obi-Wan Kenobi","The Emperor","Han Solo"],"The real line is “No, I am your father,” not “Luke, I am your father.”"],
[1,"What’s the name of Han Solo’s ship?","The Millennium Falcon",["Slave I","The Ghost","The Razor Crest"],"“It made the Kessel Run in less than twelve parsecs!”"],
[2,"What color is Mace Windu’s lightsaber?","Purple",["Green","Blue","Red"],"Samuel L. Jackson asked for purple so he could spot himself in the big battle scenes."],
[2,"How old is Yoda when he dies in Return of the Jedi?","900",["800","1,000","500"],"“When 900 years old you reach, look as good you will not.”"],
[1,"The Ewoks live on the forest moon of which planet?","Endor",["Hoth","Dagobah","Naboo"],"The forest scenes were filmed in the California redwoods."],
[2,"What is Princess Leia’s home planet, destroyed by the Death Star?","Alderaan",["Tatooine","Coruscant","Naboo"],"Grand Moff Tarkin destroys it to show off the Death Star’s power."],
[2,"C-3PO says he is fluent in over how many forms of communication?","Six million",["One million","Sixty thousand","Six billion"],"Anthony Daniels played C-3PO in all nine Skywalker saga movies."],
[2,"In The Empire Strikes Back, who takes the frozen Han Solo to Jabba the Hutt?","Boba Fett",["Lando Calrissian","Greedo","Darth Vader"],"Boba Fett says only four lines in the original trilogy."],
[2,"In the cantina, who shoots first: Han or Greedo?","Han",["Greedo","They shoot at the same time","Chewbacca"],"Later special editions changed it so Greedo shoots first. Fans have argued about it ever since."],
[1,"What is Luke Skywalker’s home planet?","Tatooine",["Naboo","Jakku","Dagobah"],"Tatooine scenes were filmed in Tunisia, which has a real town named Tataouine."],
[1,"In The Mandalorian, what is “Baby Yoda’s” real name?","Grogu",["Din","Yaddle","Ahsoka"],"The Mandalorian’s own name is Din Djarin."],
[1,"Who composed the music for Star Wars?","John Williams",["Hans Zimmer","James Horner","Danny Elfman"],"The Star Wars soundtrack is one of the best-selling film scores of all time."],
[2,"Who plays Rey in the newest Star Wars trilogy?","Daisy Ridley",["Felicity Jones","Keira Knightley","Natalie Portman"],"Felicity Jones is Jyn Erso in Rogue One, and Natalie Portman is Padmé."],
[3,"Who directed The Empire Strikes Back?","Irvin Kershner",["George Lucas","Richard Marquand","Steven Spielberg"],"George Lucas directed the first one. Richard Marquand directed Return of the Jedi."],
[2,"What is Kylo Ren’s real name?","Ben Solo",["Ben Skywalker","Jacen Solo","Anakin Solo"],"He’s the son of Han Solo and Princess Leia."],
[2,"Who plays Obi-Wan Kenobi in the original Star Wars (1977)?","Alec Guinness",["Ewan McGregor","Peter Cushing","Christopher Lee"],"Ewan McGregor plays young Obi-Wan. Peter Cushing is Grand Moff Tarkin."],
[2,"What is the Emperor’s Sith name?","Darth Sidious",["Darth Maul","Darth Tyranus","Darth Plagueis"],"His real name is Sheev Palpatine."],
[1,"In Rogue One (2016), what are the rebels trying to steal?","The plans for the Death Star",["Darth Vader’s helmet","A kyber crystal","The Emperor’s throne"],"It leads straight into the start of the first Star Wars movie."],
[1,"What year did the first Star Wars movie come out?","1977",["1975","1979","1980"],"Other studios turned it down before 20th Century Fox said yes."],
[2,"Who shouts “It’s a trap!” in Return of the Jedi?","Admiral Ackbar",["Lando Calrissian","Admiral Piett","Wedge Antilles"],"It’s one of the most famous lines in the series, and he barely has any others."],
[2,"What color is Luke’s lightsaber in Return of the Jedi?","Green",["Blue","Purple","Yellow"],"He lost his blue one, along with his hand, in The Empire Strikes Back."],
[2,"What species is Jar Jar Binks?","Gungan",["Ewok","Jawa","Twi’lek"],"His home is an underwater city on the planet Naboo."]
]);

add({id:"mv-comedy",kind:"feature",title:"Laugh Track",sub:"Comedies that never get old"},[
[1,"In Anchorman (2004), Ron Burgundy is the top news anchor in which city?","San Diego",["Los Angeles","Phoenix","Miami"],"“Stay classy, San Diego.”"],
[1,"In Mean Girls (2004), what color do the Plastics wear on Wednesdays?","Pink",["Black","Red","Purple"],"Tina Fey wrote the movie and plays the math teacher, Ms. Norbury."],
[1,"In Ferris Bueller’s Day Off (1986), whose fancy red sports car do they take for the day?","Cameron’s dad’s",["Ferris’s dad’s","Principal Rooney’s","Ferris’s sister’s"],"Most of the “Ferraris” in the movie were replicas."],
[1,"In Groundhog Day (1993), which day does Phil relive over and over?","February 2",["January 1","December 25","February 14"],"It takes place in Punxsutawney, Pennsylvania, home of the real groundhog Phil."],
[1,"In The Hangover (2009), which city does the bachelor party wake up in with no memory?","Las Vegas",["Atlantic City","Reno","Miami"],"The tiger in the bathroom belongs to Mike Tyson."],
[1,"In Napoleon Dynamite (2004), who does Napoleon help run for class president?","Pedro",["Kip","Deb","Uncle Rico"],"“Vote for Pedro” shirts were everywhere after the movie came out."],
[1,"In Dumb and Dumber (1994), what is Lloyd and Harry’s van shaped like?","A dog",["A cat","A hot dog","A banana"],"It’s the Mutt Cutts van. It even has fur."],
[1,"In Monty Python and the Holy Grail (1975), what do the knights use instead of horses?","Coconut halves",["Broomsticks","Wooden hobby horses","Nothing at all"],"The story goes that they couldn’t afford real horses."],
[2,"In Zoolander (2001), what is the name of Derek’s famous model look?","Blue Steel",["Red Hot","Silver Fox","The Smolder"],"His other looks, Ferrari and Le Tigre, are pretty much the same face."],
[2,"Who co-wrote and stars in Bridesmaids (2011)?","Kristen Wiig",["Melissa McCarthy","Amy Poehler","Maya Rudolph"],"Melissa McCarthy got an Oscar nomination for her role."],
[2,"In Step Brothers (2008), what do Brennan and Dale name their entertainment company?","Prestige Worldwide",["Catalina Wine Co.","Dale & Brennan Inc.","Bunk Bed Entertainment"],"Their first big event is the Catalina Wine Mixer."],
[1,"In Ace Ventura (1994), Jim Carrey plays what kind of detective?","A pet detective",["A private detective","A bird detective","A zoo detective"],"Jim Carrey had three huge hits in 1994: Ace Ventura, The Mask and Dumb and Dumber."],
[1,"In Mrs. Doubtfire (1993), Robin Williams dresses up as what to spend time with his kids?","An elderly British nanny",["A French maid","A school crossing guard","A lunch lady"],"The makeup took about four hours to put on."],
[1,"In Legally Blonde (2001), which law school does Elle Woods get into?","Harvard",["Yale","Stanford","Columbia"],"Her application video was shot in a hot tub."],
[3,"Clueless (1995) is loosely based on which Jane Austen novel?","Emma",["Pride and Prejudice","Persuasion","Sense and Sensibility"],"Cher’s catchphrase “As if!” took off after the movie."],
[2,"In Office Space (1999), what color is Milton’s beloved stapler?","Red",["Black","Blue","Silver"],"Swingline didn’t sell red ones at the time, but started making them after fans asked."],
[2,"In Coming to America (1988), Prince Akeem comes from which country?","Zamunda",["Wakanda","Genovia","Elbonia"],"Eddie Murphy and Arsenio Hall each play several characters."],
[2,"In The Big Lebowski (1998), what is the Dude’s favorite drink?","A White Russian",["A martini","An old fashioned","A mojito"],"“That rug really tied the room together.”"],
[3,"In School of Rock (2003), Dewey Finn pretends to be his roommate. What’s the roommate’s name?","Ned Schneebly",["Ned Flanders","Ted Schneider","Ed Finnegan"],"The real kids played their own instruments."],
[1,"In Caddyshack (1980), what animal does Bill Murray’s groundskeeper battle?","A gopher",["A raccoon","A mole","A squirrel"],"Bill Murray made up most of his lines on the spot."],
[1,"In the Austin Powers movies, what is Dr. Evil’s tiny clone called?","Mini-Me",["Little Evil","Number Two","Scott"],"Scott is Dr. Evil’s teenage son."],
[2,"In Night at the Museum (2006), what job does Ben Stiller’s character take at the museum?","Night guard",["Tour guide","Janitor","Curator"],"Robin Williams plays a wax figure of Teddy Roosevelt that comes to life."]
]);

add({id:"mv-awards",kind:"feature",title:"And the Oscar Goes To…",sub:"Award winners and Oscar night history"},[
[3,"Which movie won the very first Academy Award for Best Picture?","Wings",["Sunrise","The Jazz Singer","All Quiet on the Western Front"],"It’s a silent movie about World War I fighter pilots."],
[2,"Titanic, Ben-Hur and which other movie share the record for most Oscar wins, with 11 each?","The Lord of the Rings: The Return of the King",["Gone with the Wind","West Side Story","Schindler’s List"],"The Return of the King won every one of the 11 Oscars it was nominated for."],
[3,"Which was the first animated movie nominated for Best Picture?","Beauty and the Beast (1991)",["Toy Story","The Lion King","Up"],"Up and Toy Story 3 were nominated later."],
[1,"Parasite (2019) was the first non-English movie to win Best Picture. Which country is it from?","South Korea",["Japan","China","France"],"Director Bong Joon Ho won four Oscars that night."],
[3,"Who has won the most acting Oscars, with four?","Katharine Hepburn",["Meryl Streep","Jack Nicholson","Daniel Day-Lewis"],"Meryl Streep has the most acting nominations of anyone."],
[2,"How many Oscars did Titanic win?","11",["9","12","14"],"It was nominated for 14."],
[1,"Which movie won Best Picture at the Oscars in 2024?","Oppenheimer",["Barbie","Killers of the Flower Moon","Poor Things"],"Christopher Nolan won his first Oscar for directing it."],
[2,"In 2017, which movie was wrongly announced as Best Picture before the real winner, Moonlight, was revealed?","La La Land",["Hidden Figures","Manchester by the Sea","Arrival"],"The presenters had been handed the wrong envelope."],
[2,"Who won Best Actress for Everything Everywhere All at Once?","Michelle Yeoh",["Jamie Lee Curtis","Awkwafina","Cate Blanchett"],"Jamie Lee Curtis and Ke Huy Quan won the supporting acting awards for it."],
[1,"Heath Ledger won a posthumous Oscar for playing which villain?","The Joker",["Two-Face","The Riddler","Bane"],"It was for The Dark Knight (2008)."],
[1,"Which actor finally won Best Actor for The Revenant (2015)?","Leonardo DiCaprio",["Matthew McConaughey","Eddie Redmayne","Tom Hardy"],"He really ate raw bison liver for one scene."],
[1,"Joaquin Phoenix won Best Actor in 2020 for playing which character?","The Joker",["Johnny Cash","Commodus","Napoleon"],"He lost about 50 pounds for the role."],
[3,"Which was the first movie directed by a woman to win Best Picture?","The Hurt Locker",["Lost in Translation","Nomadland","Lady Bird"],"Kathryn Bigelow also became the first woman to win Best Director."],
[2,"Hattie McDaniel became the first Black actor to win an Oscar, for which movie?","Gone with the Wind",["Casablanca","The Wizard of Oz","Imitation of Life"],"She won Best Supporting Actress in 1940."],
[1,"Which song from Frozen won the Oscar for Best Original Song?","“Let It Go”",["“Do You Want to Build a Snowman?”","“For the First Time in Forever”","“Love Is an Open Door”"],"Idina Menzel sings it as Elsa."],
[2,"Who hosted the Oscars a record 19 times?","Bob Hope",["Billy Crystal","Johnny Carson","Whoopi Goldberg"],"Billy Crystal comes second, with nine."],
[2,"Which movie won the very first Oscar for Best Animated Feature?","Shrek",["Monsters, Inc.","Spirited Away","Toy Story"],"Spirited Away won it the next year."],
[1,"Which actor won Best Actor two years in a row, for Philadelphia and Forrest Gump?","Tom Hanks",["Denzel Washington","Jack Nicholson","Daniel Day-Lewis"],"Spencer Tracy did it first, back in the 1930s."],
[3,"About how many minutes is Anthony Hopkins on screen in The Silence of the Lambs, his Oscar-winning role?","About 16",["About 5","About 45","About 30"],"It’s one of the shortest performances ever to win Best Actor."],
[3,"What is the official name of the Oscar statuette?","The Academy Award of Merit",["The Golden Knight","The Oscar Medal","The Hollywood Star"],"Nobody is quite sure who first nicknamed it “Oscar.”"],
[3,"The Return of the King won 11 Oscars. How many was it nominated for?","11",["12","13","14"],"A clean sweep."]
]);

add({id:"mv-drama",kind:"feature",title:"Drama Club",sub:"Tearjerkers, true stories and big performances"},[
[3,"In The Shawshank Redemption (1994), whose poster covers Andy’s escape tunnel at the end?","Raquel Welch",["Rita Hayworth","Marilyn Monroe","Jane Russell"],"Rita Hayworth and Marilyn Monroe hung on the wall first."],
[1,"Who plays Red in The Shawshank Redemption?","Morgan Freeman",["Denzel Washington","Danny Glover","Samuel L. Jackson"],"Shawshank flopped in theaters, then became a favorite on home video."],
[2,"Matt Damon and Ben Affleck won an Oscar for Good Will Hunting (1997). Which one?","Best Original Screenplay",["Best Picture","Best Actor","Best Director"],"Robin Williams won Best Supporting Actor for it."],
[1,"In The Green Mile (1999), what kind of animal is Mr. Jingles?","A mouse",["A cat","A dog","A bird"],"It’s based on a Stephen King story."],
[2,"Schindler’s List (1993) is in black and white, except for a little girl’s coat. What color is it?","Red",["Yellow","Blue","Green"],"Steven Spielberg didn’t take a paycheck for it."],
[2,"In Rain Man (1988), what does Raymond count in an instant when a box spills on the floor?","Toothpicks",["Matches","Coins","Paper clips"],"Dustin Hoffman won Best Actor for the role."],
[1,"The Social Network (2010) is about the founding of which company?","Facebook",["Twitter","MySpace","Google"],"Aaron Sorkin won an Oscar for the screenplay."],
[2,"In Dead Poets Society (1989), what’s the name of Robin Williams’s inspiring teacher?","John Keating",["Glenn Holland","Sean Maguire","John Nash"],"Sean Maguire is his therapist character in Good Will Hunting."],
[2,"In A Beautiful Mind (2001), Russell Crowe plays which real mathematician?","John Nash",["Alan Turing","Richard Feynman","Stephen Hawking"],"It won Best Picture."],
[1,"In The Imitation Game (2014), Alan Turing works to crack which German code?","Enigma",["Morse","Navajo","Rosetta"],"Benedict Cumberbatch plays Turing."],
[3,"In Erin Brockovich (2000), Erin takes on which real company?","Pacific Gas and Electric",["Exxon","DuPont","Monsanto"],"The real Erin Brockovich has a cameo as a waitress named Julia."],
[1,"In The Pursuit of Happyness (2006), Will Smith stars alongside his real-life son. Who?","Jaden Smith",["Willow Smith","Trey Smith","Michael B. Jordan"],"“Happyness” is spelled that way on purpose, like it is on a wall in the movie."],
[1,"Million Dollar Baby (2004) is about which sport?","Boxing",["Baseball","Tennis","Wrestling"],"Clint Eastwood directed it and starred in it."],
[1,"In Cast Away (2000), what’s the name of Tom Hanks’s volleyball friend?","Wilson",["Spalding","Mikasa","Rawlings"],"Hanks’s character works for FedEx."],
[2,"In The Notebook (2004), how often does Noah write to Allie?","Every day for a year",["Once a week","Once a month","Once a year"],"It’s based on Nicholas Sparks’s first published novel."],
[3,"Who directed 12 Years a Slave, the 2014 Best Picture winner?","Steve McQueen",["Spike Lee","Barry Jenkins","Lee Daniels"],"Not the 1960s action star. Same name, different person."],
[2,"Saving Private Ryan (1998) opens with the D-Day landing on which beach?","Omaha Beach",["Utah Beach","Gold Beach","Juno Beach"],"That opening battle lasts more than 20 minutes."],
[1,"In Whiplash (2014), what instrument does Andrew play?","Drums",["Trumpet","Piano","Saxophone"],"J.K. Simmons won an Oscar as his terrifying teacher."],
[3,"In The Blind Side (2009), what football position does Michael Oher play?","Left tackle",["Quarterback","Running back","Linebacker"],"Sandra Bullock won Best Actress."],
[1,"Hidden Figures (2016) is about Black women mathematicians who worked where?","NASA",["MIT","Bell Labs","IBM"],"Katherine Johnson’s math helped send John Glenn into orbit."]
]);

add({id:"mv-quotes",kind:"feature",title:"Famous Last Lines",sub:"Name the movie from the quote",lead:"Which movie is this line from?"},[
[2,"“Here’s looking at you, kid.”","Casablanca",["Gone with the Wind","The Maltese Falcon","Citizen Kane"],"Humphrey Bogart says it to Ingrid Bergman four times in the movie."],
[1,"“You’re gonna need a bigger boat.”","Jaws",["The Perfect Storm","Deep Blue Sea","Titanic"],"Roy Scheider made up the line on set."],
[2,"“I’ll have what she’s having.”","When Harry Met Sally…",["Sleepless in Seattle","You’ve Got Mail","Pretty Woman"],"The woman who says it is director Rob Reiner’s mother."],
[1,"“May the Force be with you.”","Star Wars",["Star Trek","Dune","Guardians of the Galaxy"],"It’s said at least once in every Skywalker saga movie."],
[1,"“There’s no place like home.”","The Wizard of Oz",["E.T. the Extra-Terrestrial","Labyrinth","The NeverEnding Story"],"Dorothy has to click her heels three times."],
[1,"“Houston, we have a problem.”","Apollo 13",["Armageddon","The Martian","Gravity"],"The real astronaut, Jim Lovell, said “Houston, we’ve had a problem.”"],
[1,"“To infinity and beyond!”","Toy Story",["The Incredibles","WALL-E","Lightyear"],"Buzz’s catchphrase."],
[1,"“Why so serious?”","The Dark Knight",["Batman (1989)","Joker","Suicide Squad"],"Heath Ledger kept a diary in character as the Joker."],
[1,"“I see dead people.”","The Sixth Sense",["The Others","Ghost","Poltergeist"],"Haley Joel Osment was 10 and got an Oscar nomination."],
[1,"“Nobody puts Baby in a corner.”","Dirty Dancing",["Grease","Footloose","Flashdance"],"Patrick Swayze also sang “She’s Like the Wind” on the soundtrack."],
[2,"“Life, uh, finds a way.”","Jurassic Park",["Jurassic World","Twister","Contagion"],"Jeff Goldblum’s Ian Malcolm says it."],
[1,"“Just keep swimming.”","Finding Nemo",["The Little Mermaid","Shark Tale","Moana"],"Dory sings it."],
[2,"“You can’t handle the truth!”","A Few Good Men",["Top Gun","The Firm","Jerry Maguire"],"Jack Nicholson yells it at Tom Cruise in court."],
[1,"“Show me the money!”","Jerry Maguire",["Wall Street","The Wolf of Wall Street","Moneyball"],"Cuba Gooding Jr. won an Oscar for the role."],
[2,"“Carpe diem. Seize the day, boys.”","Dead Poets Society",["Good Will Hunting","Mr. Holland’s Opus","Stand by Me"],"Robin Williams plays the English teacher."],
[1,"“Wax on, wax off.”","The Karate Kid",["Rocky","Kickboxer","Bloodsport"],"Mr. Miyagi was played by Pat Morita, who got an Oscar nomination."],
[1,"“I feel the need… the need for speed!”","Top Gun",["Days of Thunder","The Fast and the Furious","Speed"],"Maverick and Goose say it together."],
[2,"“Frankly, my dear, I don’t give a damn.”","Gone with the Wind",["Casablanca","Citizen Kane","Sunset Boulevard"],"The American Film Institute voted it the greatest movie line of all time."],
[2,"“Hasta la vista, baby.”","Terminator 2: Judgment Day",["The Terminator","Predator","Total Recall"],"Young John Connor teaches the Terminator to say it."],
[3,"“Keep your friends close, but your enemies closer.”","The Godfather Part II",["The Godfather","Goodfellas","Scarface"],"Michael Corleone says it in the sequel, not the first movie."],
[3,"“What we’ve got here is failure to communicate.”","Cool Hand Luke",["The Great Escape","Bullitt","Easy Rider"],"Paul Newman stars as Luke."],
[1,"“Inconceivable!”","The Princess Bride",["Monty Python and the Holy Grail","Labyrinth","Willow"],"Vizzini says it so often that Inigo says, “I do not think it means what you think it means.”"],
[1,"“They may take our lives, but they’ll never take our freedom!”","Braveheart",["Gladiator","Troy","Kingdom of Heaven"],"Mel Gibson directed it and won Best Director."],
[1,"“Are you not entertained?”","Gladiator",["Braveheart","300","Spartacus"],"Russell Crowe won Best Actor for it."]
]);

add({id:"mv-emoji",kind:"feature",title:"Emoji Box Office",sub:"Name the movie from the pictures",lead:"Which movie is this?",big:true},[
[1,"🦁👑","The Lion King",["The Jungle Book","Madagascar","Zootopia"],"Its songs are by Elton John and Tim Rice."],
[1,"🧊🚢💔","Titanic",["Poseidon","Frozen","Pearl Harbor"],"The ship set was built at nearly full size."],
[1,"🦖🏝️🚙","Jurassic Park",["King Kong","The Land Before Time","Godzilla"],"The dinosaur roars mix animal sounds, including a baby elephant."],
[1,"👻🚫","Ghostbusters",["Casper","Beetlejuice","Poltergeist"],"Dan Aykroyd first wrote it for himself and John Belushi."],
[1,"🐠🔍","Finding Nemo",["The Little Mermaid","Shark Tale","Luca"],"It was the best-selling DVD of all time for years."],
[1,"🏠🎈👴","Up",["Coco","WALL-E","The Wizard of Oz"],"The “Married Life” montage near the start has no talking at all."],
[1,"🕷️🧑‍🦱🏙️","Spider-Man",["Ant-Man","Charlotte’s Web","Arachnophobia"],"Tobey Maguire caught that tray of lunch for real, after many tries."],
[2,"⏰🚗⚡","Back to the Future",["Cars","The Fast and the Furious","Click"],"Eric Stoltz played Marty for weeks before Michael J. Fox replaced him."],
[2,"💍🌋🧙","The Lord of the Rings",["Harry Potter","Willow","The Princess Bride"],"The three movies were filmed at the same time, in New Zealand."],
[1,"🍫🏭🎫","Willy Wonka & the Chocolate Factory",["Ratatouille","Matilda","Hugo"],"Gene Wilder asked to enter limping and then do a somersault."],
[1,"👽📞🏠","E.T. the Extra-Terrestrial",["Men in Black","Lilo & Stitch","Close Encounters of the Third Kind"],"E.T.’s voice was partly done by a woman named Pat Welsh."],
[1,"🦈🏖️","Jaws",["The Meg","Finding Nemo","Moana"],"The mechanical shark kept breaking, so Spielberg showed it less. That made it scarier."],
[1,"🐀👨‍🍳","Ratatouille",["Chef","Mouse Hunt","Stuart Little"],"Real chef Thomas Keller designed the final ratatouille dish."],
[1,"❄️👸⛄","Frozen",["Snow White","Tangled","Moana"],"It was loosely inspired by The Snow Queen, by Hans Christian Andersen."],
[2,"💊🕶️🐇","The Matrix",["Alice in Wonderland","Men in Black","Inception"],"“Follow the white rabbit.”"],
[1,"🧠😊😢😡","Inside Out",["Up","Soul","Coco"],"The idea came from director Pete Docter watching his daughter grow up."],
[1,"🌪️👠🐶","The Wizard of Oz",["Twister","Cinderella","Lady and the Tramp"],"Toto was played by a dog named Terry."],
[2,"👰🏃‍♀️","Runaway Bride",["Bridesmaids","27 Dresses","The Wedding Planner"],"It reunited the Pretty Woman stars, Julia Roberts and Richard Gere."],
[1,"🔨⚡💪","Thor",["Iron Man","Captain America","Shazam!"],"Chris Hemsworth almost didn’t get the part after a bad first audition."],
[2,"🎈🤡🌧️","It",["Joker","Up","Poltergeist"],"Bill Skarsgård can move his eyes in different directions on his own. No effects needed."],
[2,"🦇🃏🌃","The Dark Knight",["Spider-Man","Iron Man","Watchmen"],"Some of it was shot with huge IMAX cameras."],
[3,"🌽👻⚾","Field of Dreams",["The Sandlot","Signs","Children of the Corn"],"“If you build it, he will come.”"],
[2,"🐷🕷️🕸️","Charlotte’s Web",["Babe","Spider-Man","Arachnophobia"],"The 2006 movie has Julia Roberts as the voice of Charlotte."],
[2,"👨‍🚀🥔🔴","The Martian",["Interstellar","Apollo 13","Gravity"],"Matt Damon grows potatoes on Mars to stay alive."]
]);

add({id:"mv-years",kind:"feature",title:"Name That Year",sub:"Pick the year it came out",lead:"What year did this come out?",years:true},[
[1,"Star Wars","1977",[],"It opened in only 32 theaters."],
[2,"Jaws","1975",[],"It’s often called the first summer blockbuster."],
[2,"E.T. the Extra-Terrestrial","1982",[],"It was the biggest movie of the 1980s."],
[1,"Titanic","1997",[],"It stayed in some theaters for about ten months."],
[2,"Jurassic Park","1993",[],"It was the highest-grossing movie ever until Titanic."],
[2,"The Lion King","1994",[],"The remake came out 25 years later, in 2019."],
[2,"Toy Story","1995",[],"The first fully computer-animated feature film."],
[2,"The Matrix","1999",[],"It made “bullet time” famous."],
[2,"Back to the Future","1985",[],"Marty travels back 30 years, to 1955."],
[2,"Iron Man","2008",[],"It kicked off the Marvel Cinematic Universe."],
[2,"The Avengers","2012",[],"The first time the big Marvel heroes teamed up on screen."],
[1,"Frozen","2013",[],"It was the highest-grossing animated movie ever at the time."],
[3,"The Wizard of Oz","1939",[],"Gone with the Wind came out the same year."],
[3,"The Godfather","1972",[],"The sequel came out two years later."],
[2,"Forrest Gump","1994",[],"It won Best Picture over Pulp Fiction and The Shawshank Redemption."],
[2,"Avatar","2009",[],"The sequel took 13 years."],
[1,"Barbie","2023",[],"It came out the same day as Oppenheimer: “Barbenheimer.”"],
[2,"Shrek","2001",[],"It won the first Oscar for Best Animated Feature."],
[3,"Ghostbusters","1984",[],"The theme song hit number one."],
[3,"Top Gun","1986",[],"The sequel came out 36 years later."]
]);

add({id:"mv-franchise",kind:"feature",title:"Franchise Fever",sub:"Wizards, hobbits, spies, pirates and more"},[
[1,"In Harry Potter, which Hogwarts house is Harry sorted into?","Gryffindor",["Slytherin","Hufflepuff","Ravenclaw"],"The Sorting Hat thought about putting him in Slytherin."],
[1,"In Harry Potter, what platform does the Hogwarts Express leave from?","9¾",["7½","10¼","9½"],"King’s Cross station in London now has a sign and a luggage cart stuck in the wall."],
[1,"In The Lord of the Rings, who carries the One Ring to Mount Doom?","Frodo",["Sam","Bilbo","Aragorn"],"Near the end, Sam carries Frodo up the mountain."],
[2,"In The Fellowship of the Ring, Gandalf shouts “You shall not pass!” at which creature?","A Balrog",["A troll","A Nazgûl","Smaug"],"Smaug is the dragon from The Hobbit."],
[1,"In Jurassic World (2015), which dinosaurs does Owen train?","Velociraptors",["T. rexes","Pteranodons","Triceratops"],"The leader of his raptor pack is named Blue."],
[1,"How does James Bond like his martini?","Shaken, not stirred",["Stirred, not shaken","On the rocks","With a twist"],"Bond first ordered it that way in the books, in the 1950s."],
[3,"Who played James Bond in the most official Bond movies?","Roger Moore",["Sean Connery","Daniel Craig","Pierce Brosnan"],"Moore made seven. Connery made six official ones, plus 1983’s Never Say Never Again."],
[2,"In Indiana Jones and the Last Crusade (1989), who plays Indy’s father?","Sean Connery",["Michael Caine","Roger Moore","Peter O’Toole"],"Sean Connery was only 12 years older than Harrison Ford."],
[1,"In the Fast & Furious movies, what does Dom Toretto talk about more than anything?","Family",["Money","Revenge","Sandwiches"],"The series started as a street-racing movie in 2001."],
[1,"In Pirates of the Caribbean, what’s the name of Jack Sparrow’s ship?","The Black Pearl",["The Flying Dutchman","Queen Anne’s Revenge","The Jolly Roger"],"Johnny Depp says he based Jack partly on Keith Richards."],
[1,"In the Mission: Impossible movies, what is Tom Cruise’s character called?","Ethan Hunt",["Jason Bourne","Jack Reacher","Jack Ryan"],"Cruise really climbed the outside of the world’s tallest building, the Burj Khalifa."],
[2,"In The Matrix, who plays Morpheus?","Laurence Fishburne",["Samuel L. Jackson","Wesley Snipes","Ving Rhames"],"He also played Perry White in the Superman movies."],
[1,"In Jurassic Park, what’s the name of Jeff Goldblum’s chaos-theory scientist?","Ian Malcolm",["Alan Grant","John Hammond","Dennis Nedry"],"He came back for Jurassic World Dominion in 2022."],
[2,"In the Rocky movies, who is Rocky’s grumpy old trainer?","Mickey",["Apollo","Paulie","Duke"],"Burgess Meredith got an Oscar nomination for the role."],
[1,"Who is the voice of Donkey in Shrek?","Eddie Murphy",["Chris Rock","Kevin Hart","Will Smith"],"He also voiced Mushu in Mulan."],
[1,"In The Hunger Games, which district is Katniss from?","District 12",["District 1","District 13","District 7"],"District 12 is the coal-mining district."],
[1,"In Twilight, what is Edward Cullen?","A vampire",["A werewolf","A wizard","A ghost"],"Jacob is the werewolf."],
[2,"In Back to the Future Part II, which future year do Marty and Doc visit?","2015",["2000","2020","2085"],"They predicted video calls and flat-screen TVs. Still waiting on hoverboards."],
[1,"In Despicable Me, what are Gru’s little yellow helpers called?","Minions",["Gremlins","Oompa-Loompas","Smurfs"],"Their own movie, Minions (2015), made over a billion dollars."],
[2,"In Ghostbusters, what should you never cross?","The streams",["The beams","The wires","The ghosts"],"“It would be bad.”"],
[1,"Who plays Hermione in the Harry Potter movies?","Emma Watson",["Emma Stone","Emma Roberts","Bonnie Wright"],"Bonnie Wright plays Ginny Weasley."],
[1,"In John Wick (2014), what starts John’s quest for revenge?","Someone kills his dog",["Someone kidnaps his wife","Someone burns his house","Someone steals his money"],"They steal his car too, but the dog is what really does it."],
[2,"How many members are in the Fellowship of the Ring?","Nine",["Seven","Eight","Twelve"],"Four hobbits, two men, a wizard, an elf and a dwarf."]
]);

add({id:"mv-horror",kind:"feature",title:"Thrills & Chills",sub:"Scary movies and edge-of-your-seat thrillers"},[
[1,"In Halloween (1978), what’s the masked killer’s name?","Michael Myers",["Jason Voorhees","Freddy Krueger","Leatherface"],"His mask was a cheap Captain Kirk mask, painted white."],
[3,"Who plays Freddy Krueger in A Nightmare on Elm Street?","Robert Englund",["Kane Hodder","Tony Todd","Doug Bradley"],"Johnny Depp made his movie debut in the first one."],
[1,"In the Friday the 13th movies, what kind of mask does Jason wear?","A hockey mask",["A catcher’s mask","A welding mask","A gas mask"],"He doesn’t get the hockey mask until Part III."],
[1,"In The Shining (1980), Jack breaks through the door and yells “Here’s…” who?","Johnny!",["Jack!","Danny!","Wendy!"],"It’s from the way Johnny Carson was introduced on The Tonight Show."],
[1,"In Scream (1996), what does Ghostface ask on the phone?","“What’s your favorite scary movie?”",["“Do you want to play a game?”","“Are you home alone?”","“Have you checked the children?”"],"The Ghostface mask was based on a store-bought Halloween mask."],
[1,"Who wrote and directed Get Out (2017)?","Jordan Peele",["Ari Aster","M. Night Shyamalan","James Wan"],"It won him the Oscar for Best Original Screenplay."],
[1,"Which director is famous for twist endings like The Sixth Sense?","M. Night Shyamalan",["Steven Spielberg","Wes Craven","John Carpenter"],"He often makes a small cameo in his own movies."],
[1,"In It (2017), where does Pennywise first appear to Georgie?","In a storm drain",["In a treehouse","In a well","In a basement"],"Georgie is chasing his paper boat."],
[1,"Alien (1979): “In space, no one can hear you…”","Scream",["Breathe","Cry","Run"],"Sigourney Weaver plays Ripley."],
[1,"In The Silence of the Lambs, what’s the name of the FBI trainee played by Jodie Foster?","Clarice Starling",["Dana Scully","Laurie Strode","Ellen Ripley"],"Jodie Foster won Best Actress."],
[2,"In Poltergeist (1982), what does little Carol Anne say to the TV?","“They’re here.”",["“Here’s Johnny!”","“I see dead people.”","“Be afraid.”"],"The clown doll scene is just as famous."],
[2,"In The Exorcist (1973), what’s the name of the possessed girl?","Regan",["Carrie","Samara","Annabelle"],"It was the first horror movie nominated for Best Picture."],
[1,"Carrie (1976) is based on a novel by which author?","Stephen King",["Dean Koontz","Peter Benchley","Anne Rice"],"Carrie was King’s first published novel."],
[1,"In The Ring (2002), how many days do you have after watching the cursed tape?","Seven",["Three","Thirteen","One"],"It’s a remake of a Japanese movie, Ringu."],
[1,"In A Quiet Place (2018), how do the monsters hunt?","By sound",["By smell","By sight","By body heat"],"John Krasinski directed it and stars with his real-life wife, Emily Blunt."],
[1,"Which Alfred Hitchcock movie has birds attacking a California town?","The Birds",["Vertigo","Rear Window","Psycho"],"Some of the birds in the attack scenes were real."],
[2,"In Signs (2002), what hurts the aliens?","Water",["Fire","Light","Salt"],"Mel Gibson plays a former priest."],
[2,"The Ghostface mask in Scream was inspired by which famous painting?","The Scream",["American Gothic","Mona Lisa","The Persistence of Memory"],"The Scream was painted by Edvard Munch."]
]);

add({id:"mv-finale",kind:"feature",title:"The Final Reel",sub:"The hardest questions of the night",mult:2,rule:"Double points on every question."},[
[3,"In Citizen Kane (1941), what is “Rosebud”?","His childhood sled",["His first horse","His mother’s name","His yacht"],"Orson Welles was 25 when he made it."],
[3,"What was the first feature-length movie with synchronized talking?","The Jazz Singer",["Wings","Metropolis","Steamboat Willie"],"Its first spoken words were “You ain’t heard nothin’ yet!”"],
[3,"Which was the first movie to make $1 billion worldwide?","Titanic",["Jurassic Park","Star Wars","Avatar"],"Jurassic Park came close in its first run, a few years earlier."],
[2,"Which movie is the highest-grossing of all time (not adjusted for inflation)?","Avatar",["Avengers: Endgame","Titanic","Star Wars: The Force Awakens"],"Endgame passed it in 2019, until a 2021 re-release put Avatar back on top."],
[3,"In The Wizard of Oz, which actor was first cast as the Tin Man but got sick from the makeup?","Buddy Ebsen",["Ray Bolger","Bert Lahr","Jack Haley"],"The makeup had aluminum powder in it. Jack Haley took over the role."],
[2,"Which movie is set in the town of Hill Valley?","Back to the Future",["Gremlins","The Goonies","E.T. the Extra-Terrestrial"],"The town square was a set on the Universal Studios lot."],
[2,"What’s the name of the hotel in The Shining?","The Overlook Hotel",["The Bates Motel","The Stanley Hotel","The Grand Budapest"],"A stay at the real Stanley Hotel in Colorado inspired Stephen King."],
[2,"In Pulp Fiction, what does Vincent say a Quarter Pounder with Cheese is called in Paris?","A Royale with Cheese",["Le Big Mac","A Quarter Royale","Le Cheeseburger"],"Vincent explains it’s because France uses the metric system."],
[2,"Who played the Joker in Batman (1989)?","Jack Nicholson",["Jared Leto","Cesar Romero","Mark Hamill"],"He took a share of the profits and reportedly made more than $50 million."],
[2,"What’s the name of the computer in 2001: A Space Odyssey?","HAL 9000",["Skynet","MOTHER","WOPR"],"MOTHER is the ship’s computer in Alien."],
[2,"In Casablanca, which song does Sam play?","“As Time Goes By”",["“Moon River”","“Over the Rainbow”","“Unchained Melody”"],"Nobody ever says “Play it again, Sam” in the movie."],
[3,"Which Stanley Kubrick movie features a gang called the droogs?","A Clockwork Orange",["The Shining","Full Metal Jacket","Dr. Strangelove"],"The droogs talk in a made-up slang called Nadsat."],
[3,"What was Pixar’s second feature film?","A Bug’s Life",["Toy Story 2","Monsters, Inc.","Cars"],"It came out in 1998, the same fall as DreamWorks’s Antz."]
]);

add({id:"mv-tiebreak",kind:"feature",extra:true,title:"Sudden Death",sub:"Tiebreakers"},[
[3,"In what year was the first Academy Awards ceremony held?","1929",["1919","1939","1927"],"The whole ceremony lasted about 15 minutes."],
[3,"About how long is Gone with the Wind, with its intermission?","Almost 4 hours",["About 2 hours","About 3 hours","About 5 hours"],"Adjusted for inflation, it’s still the highest-grossing movie ever."],
[3,"How long is Avengers: Endgame?","3 hours, 1 minute",["2 hours, 21 minutes","2 hours, 45 minutes","3 hours, 21 minutes"],"It’s the longest Marvel movie."]
]);

add({id:"mv-speed",kind:"feature",title:"Lightning Round",sub:"Five seconds. No thinking. Just tap.",timer:5,speed:true,rule:"Only 5 seconds per question! Fast answers score big."},[
[1,"Toy Story: Woody is a…","Cowboy",["Pirate","Astronaut","Knight"],"Woody was almost a ventriloquist’s dummy in early versions."],
[1,"Darth Vader’s lightsaber is…","Red",["Blue","Green","Purple"],"Sith lightsabers are always red."],
[1,"Shrek is an…","Ogre",["Elf","Troll","Goblin"],"Mike Myers voices him with a Scottish accent."],
[1,"Nemo is a…","Clownfish",["Shark","Turtle","Whale"],"Clownfish live in sea anemones."],
[1,"Indiana Jones carries a…","Whip",["Sword","Lasso","Bow"],"Harrison Ford learned to crack the whip for real."],
[1,"Simba is a…","Lion",["Tiger","Bear","Cheetah"],"Matthew Broderick voices grown-up Simba."],
[1,"The Hulk is…","Green",["Red","Blue","Purple"],"In the first comic, he was gray."],
[1,"Iron Man is Tony…","Stark",["Rogers","Banner","Parker"],"Robert Downey Jr. played him for 11 years."],
[1,"Harry Potter’s scar is shaped like a…","Lightning bolt",["Star","Moon","X"],"Daniel Radcliffe had the scar drawn on thousands of times."],
[1,"E.T. wants to…","Phone home",["Eat candy","Fly a bike","Go to sleep"],"“E.T. phone home.”"],
[1,"Elsa’s magic makes…","Ice and snow",["Fire","Wind","Rain"],"She’s voiced by Idina Menzel."],
[1,"Rocky is a…","Boxer",["Wrestler","Runner","Pilot"],"Sylvester Stallone wrote the script himself."],
[1,"Captain America throws his…","Shield",["Hammer","Bow","Car"],"It always comes back to him."],
[1,"In Up, the house flies with…","Balloons",["Rockets","Wings","A kite"],"The house is tied to them with thousands of strings."],
[1,"Minions love…","Bananas",["Apples","Pizza","Carrots"],"“Bello!” means hello in Minion talk."],
[1,"Jaws is a…","Shark",["Whale","Squid","Crocodile"],"A great white."]
]);

/* ---------- Surprise rounds ---------- */
add({id:"mv-lightsout",kind:"alarm",title:"Lights Out",dark:true,
 alarm:"Somebody turned off the projector…",tagline:"The questions only show up on your phones. Shh.",
 rule:"The TV goes dark. Read each question on your phone.",
 emoji:"🎬🌑🍿🔦",fx:"flicker",c1:"#7b3dff",c2:"#1b0b3a",
 sfx:[["siren",0],["wobble",3.1]]},[
[1,"Who is the voice of Woody in Toy Story?","Tom Hanks",["Tim Allen","Billy Crystal","John Goodman"],"Tim Allen voices Buzz. Tom’s brother Jim Hanks voices Woody in video games and toys."],
[2,"In Star Wars, what’s the name of the rough spaceport bar where Luke meets Han?","The Mos Eisley Cantina",["The Jedi Tavern","Maz’s Castle","Dex’s Diner"],"The cantina band song is called “Mad About Me.”"],
[2,"In The Wizard of Oz, what does the Scarecrow want?","A brain",["A heart","Courage","A way home"],"The Tin Man wants a heart, and the Lion wants courage."],
[2,"In Ghostbusters, what’s the name of the green ghost who loves to eat?","Slimer",["Gozer","Zuul","Vinz Clortho"],"The crew nicknamed him “Onionhead” for his smell."],
[2,"In Finding Nemo, what are the names of the sharks trying to quit eating fish?","Bruce, Anchor and Chum",["Jaws, Fin and Chomp","Bruce, Jaws and Fang","Hammer, Tiger and Reef"],"Bruce is named after the mechanical shark from Jaws."],
[2,"What’s the name of the Avengers’ artificial intelligence assistant before FRIDAY?","JARVIS",["ULTRON","KAREN","EDITH"],"Paul Bettany voiced JARVIS before playing Vision."],
[3,"In The Princess Bride, what does Westley say every time Buttercup gives him an order?","“As you wish.”",["“Inconceivable!”","“My pleasure.”","“Anything for you.”"],"“As you wish” really means “I love you.”"],
[2,"What toy brand gets its own big movie in 2014, with the song “Everything Is Awesome”?","LEGO",["Barbie","Hot Wheels","Transformers"],"The song got an Oscar nomination."],
[2,"In Jurassic Park, what shakes in a cup to warn that the T. rex is coming?","Water",["Coffee","Soda","Milk"],"They made the ripples by plucking a guitar string under the dashboard."],
[3,"In Raiders of the Lost Ark, what does Indy swap for the golden idol?","A bag of sand",["A rock","His hat","A gold coin"],"It doesn’t weigh enough. Cue the giant boulder."],
[2,"Which movie features a talking snowman named Olaf?","Frozen",["Frosty","Shrek the Third","Ice Age"],"Josh Gad is Olaf’s voice."],
[2,"In Back to the Future, what does Marty play at the dance that “your kids are gonna love”?","“Johnny B. Goode”",["“Rock Around the Clock”","“Blue Suede Shoes”","“Great Balls of Fire”"],"Chuck Berry’s cousin Marvin calls him on the phone to listen."]
]);

add({id:"mv-heist",kind:"alarm",title:"The Heist",steal:50,
 alarm:"The vault just opened…",tagline:"Everybody stay calm. This is a robbery.",
 rule:"Steal round: every right answer swipes 50 points from whoever is in first place.",
 emoji:"💰🕶️💎🚐",fx:"police",c1:"#16a34a",c2:"#052e16",
 sfx:[["klaxon",0],["slide",3.1]]},[
[2,"In Ocean’s Eleven (2001), how many casinos does the crew rob?","Three",["One","Two","Eleven"],"All three casinos keep their money in one vault under the Bellagio."],
[1,"Who leads the crew in Ocean’s Eleven (2001)?","Danny Ocean",["Rusty Ryan","Linus Caldwell","Terry Benedict"],"George Clooney plays Danny. Brad Pitt’s Rusty is always eating."],
[1,"In The Italian Job (2003), what kind of cars does the crew use for the getaway?","Mini Coopers",["Fiats","Ferraris","VW Beetles"],"The 1969 original used Minis too."],
[2,"In Inception (2010), what does Cobb use as his totem?","A spinning top",["A loaded die","A chess piece","A coin"],"The top first belonged to his wife, Mal."],
[2,"Heat (1995) finally put which two legends in a scene together?","Al Pacino and Robert De Niro",["Al Pacino and Marlon Brando","Robert De Niro and Joe Pesci","Jack Nicholson and Al Pacino"],"They were both in The Godfather Part II, but never on screen at the same time."],
[3,"In The Thomas Crown Affair (1999), what does Crown steal from the museum?","A Monet painting",["A Fabergé egg","A diamond","A Picasso painting"],"He puts it back later, in his own sneaky way."],
[2,"In Baby Driver (2017), why does Baby always have music playing?","To drown out his tinnitus",["To stay awake","To hide his hearing aids","To block police radios"],"The car chases were timed to the songs."],
[1,"In Now You See Me (2013), the robbers are a team of what?","Magicians",["Hackers","Clowns","Chefs"],"They call themselves the Four Horsemen."],
[3,"Who directed the bank-robbery thriller Inside Man (2006)?","Spike Lee",["Steven Soderbergh","Ridley Scott","Michael Mann"],"Denzel Washington plays the detective."],
[1,"In Reservoir Dogs (1992), the robbers use code names based on what?","Colors",["Animals","Numbers","Planets"],"Nobody wants to be Mr. Pink."],
[2,"In Ocean’s 8 (2018), what do they steal at the Met Gala?","A diamond necklace",["A crown","A painting","A designer dress"],"The necklace in the movie is by Cartier."],
[2,"In Fast Five (2011), what does the crew drag through the streets of Rio?","A whole bank vault",["A jet plane","A train car","An armored truck"],"Dwayne Johnson joined the series in this one."]
]);

add({id:"mv-sequel",kind:"alarm",title:"Sequel Round",mult:2,
 alarm:"Coming soon to a theater near you…",tagline:"This time, it’s personal.",
 rule:"Sequels only. Double points on every question!",
 emoji:"🎞️2️⃣🍿🎟️",fx:"pulse",c1:"#e11d48",c2:"#3f0613",
 sfx:[["klaxon",0],["boom",3.1]]},[
[2,"In Toy Story 2, who steals Woody to sell him?","A toy collector named Al",["Sid from next door","Stinky Pete","Lotso"],"Al owns a store called Al’s Toy Barn."],
[2,"In Terminator 2, what model is the shape-shifting liquid-metal Terminator?","T-1000",["T-800","T-X","T-3000"],"The T-800 is Arnold’s model."],
[2,"In Shrek 2, Shrek and Fiona visit her parents in which kingdom?","Far Far Away",["Duloc","Fairyland","Dunroamin"],"Duloc was Lord Farquaad’s kingdom in the first movie."],
[1,"The Empire Strikes Back opens on which ice planet?","Hoth",["Endor","Jakku","Dagobah"],"Luke spends the night inside a tauntaun to stay warm."],
[2,"In Top Gun: Maverick (2022), which original star comes back as Iceman?","Val Kilmer",["Tom Skerritt","Anthony Edwards","Kelly McGillis"],"It made almost $1.5 billion worldwide."],
[2,"Who directed Aliens (1986), the sequel to Alien?","James Cameron",["Ridley Scott","David Fincher","Steven Spielberg"],"Ridley Scott directed the first one, and David Fincher directed Alien 3."],
[2,"In Inside Out 2 (2024), which new emotion takes over Headquarters?","Anxiety",["Envy","Ennui","Embarrassment"],"Envy, Ennui and Embarrassment are new in the movie too."],
[2,"Who won an Oscar for playing young Vito Corleone in The Godfather Part II?","Robert De Niro",["Al Pacino","Marlon Brando","Robert Duvall"],"Brando won for playing old Vito in the first movie."],
[1,"Back to the Future Part III takes Marty and Doc back to which time?","The Wild West, 1885",["1955","2015","1985"],"Marty uses the name Clint Eastwood."],
[1,"Who is the masked villain in The Dark Knight Rises (2012)?","Bane",["Two-Face","Scarecrow","The Riddler"],"Tom Hardy plays him."],
[2,"In Avengers: Endgame, what do the Avengers call their plan to go back in time for the stones?","The Time Heist",["The Stone Run","Project Rewind","The Snap Back"],"Ant-Man’s quantum realm makes it possible."],
[2,"In Frozen II, what is the big song Elsa sings when she first hears the mysterious voice?","“Into the Unknown”",["“Show Yourself”","“Let It Go”","“Some Things Never Change”"],"She sings “Show Yourself” later, when she finds the voice."]
]);

add({id:"mv-speedway",kind:"alarm",title:"Need for Speed",timer:10,first:200,
 alarm:"Start your engines…",tagline:"Ten seconds a question. Floor it.",
 rule:"Only 10 seconds a question! The fastest right answer gets a 200-point bonus.",
 emoji:"🏎️🏁💨🔥",fx:"pulse",c1:"#ffb627",c2:"#e2420c",ink:"#1a0b00",
 sfx:[["klaxon",0],["slideUp",3.1],["powerup",3.8]]},[
[1,"In Cars, which little town does Lightning McQueen get stuck in?","Radiator Springs",["Carburetor County","Piston Peak","Tailpipe Town"],"It was based on towns along Route 66."],
[1,"In The Fast and the Furious, what is Paul Walker’s character named?","Brian O’Conner",["Dominic Toretto","Han Lue","Roman Pearce"],"He starts out as an undercover cop."],
[1,"What car is the time machine in Back to the Future?","A DeLorean",["A Mustang","A Camaro","A Corvette"],"In early drafts, the time machine was a refrigerator."],
[1,"What kind of car is Herbie, the Love Bug?","A Volkswagen Beetle",["A Mini Cooper","A Ford Model T","A Volkswagen Bus"],"Herbie wears the number 53."],
[2,"Which of these is NOT something Ricky Bobby says in Talladega Nights?","“Rubbin’ is racin’.”",["“If you ain’t first, you’re last.”","“Shake and bake!”","“I wanna go fast!”"],"“Rubbin’ is racin’” is from Tom Cruise’s Days of Thunder."],
[1,"Who plays Furiosa in Mad Max: Fury Road (2015)?","Charlize Theron",["Zoe Saldaña","Gal Gadot","Emily Blunt"],"She shaved her head for the role."],
[1,"In Speed (1994), the bus will explode if it goes slower than what speed?","50 mph",["55 mph","60 mph","30 mph"],"Keanu Reeves and Sandra Bullock star."],
[2,"Who stars in the NASCAR movie Days of Thunder (1990)?","Tom Cruise",["Tom Hanks","Kevin Costner","Patrick Swayze"],"He met Nicole Kidman while making it."],
[2,"Ford v Ferrari (2019) is about which famous race?","The 24 Hours of Le Mans",["The Daytona 500","The Indianapolis 500","The Monaco Grand Prix"],"Christian Bale plays driver Ken Miles."],
[3,"Which fighter jet do the pilots fly in the original Top Gun?","The F-14 Tomcat",["The F-16 Falcon","The F-22 Raptor","The SR-71 Blackbird"],"In Top Gun: Maverick, they fly F/A-18 Super Hornets."],
[3,"In Gone in 60 Seconds (2000), what kind of car is “Eleanor”?","A 1967 Shelby Mustang GT500",["A Dodge Charger","A Chevy Camaro","A Pontiac GTO"],"Nicolas Cage did some of the driving himself."],
[3,"Rush (2013) is about James Hunt’s Formula 1 rivalry with which driver?","Niki Lauda",["Ayrton Senna","Michael Schumacher","Mario Andretti"],"Lauda came back to racing just weeks after a terrible crash."]
]);

add({id:"mv-snackbar",kind:"alarm",title:"Snack Bar Round",everyone:25,
 alarm:"The concession stand is open…",tagline:"Free refills on everything.",
 rule:"Food questions! Everyone who answers gets 25 points, right or wrong.",
 emoji:"🍿🥤🌭🍫",fx:"twinkle",c1:"#ffd166",c2:"#c2410c",ink:"#fff",
 sfx:[["siren",0],["powerup",3.1],["boing",3.8]]},[
[1,"In Ratatouille, which dish wins over the food critic Anton Ego?","Ratatouille",["Soufflé","Bouillabaisse","Crêpes"],"One bite takes him back to his childhood."],
[2,"In Pulp Fiction, what burger does Jules try from Brett?","A Big Kahuna Burger",["A Royale with Cheese","A Krabby Patty","An In-N-Out burger"],"“That IS a tasty burger.”"],
[1,"In The Avengers (2012), what food do the heroes eat after the battle?","Shawarma",["Tacos","Pizza","Burgers"],"Tony suggests it mid-battle. The scene was filmed the day after the premiere."],
[1,"In Forrest Gump, what food does Bubba know every way to cook?","Shrimp",["Chicken","Crab","Catfish"],"There are now Bubba Gump Shrimp restaurants."],
[1,"In Willy Wonka & the Chocolate Factory, what does Violet turn into?","A blueberry",["A gumball","A grape","A plum"],"She chewed the three-course-dinner gum."],
[1,"In Lady and the Tramp, what do the dogs share on their date?","Spaghetti and meatballs",["A hot dog","A pizza","A steak"],"Walt Disney almost cut the spaghetti scene."],
[3,"The famous “I’ll have what she’s having” scene in When Harry Met Sally… was filmed in which restaurant?","Katz’s Delicatessen",["Carnegie Deli","Russ & Daughters","Barney Greengrass"],"There’s still a sign hanging over the table."],
[2,"In Napoleon Dynamite, what does Napoleon keep in his pocket to eat later?","Tater tots",["Chicken nuggets","French fries","Pizza rolls"],"“Napoleon, give me some of your tots.”"],
[2,"In Big (1988), how does Josh eat the tiny baby corn at the fancy party?","Like corn on the cob",["Like a lollipop","With chopsticks","Like a french fry"],"Tom Hanks got his first Oscar nomination for it."],
[1,"In Matilda, what does Bruce Bogtrotter have to eat in front of the whole school?","A giant chocolate cake",["A bucket of worms","A whole turkey","A tub of ice cream"],"He finishes every crumb."],
[1,"In The Godfather: “Leave the gun. Take the…”","Cannoli",["Lasagna","Meatballs","Pizza"],"The actor came up with “take the cannoli” on the spot."],
[1,"In Harry Potter, Bertie Bott’s Every Flavour what?","Beans",["Frogs","Gum","Pops"],"Flavors include earwax and vomit. You can buy them for real."]
]);

/* ---------- Kid rounds ---------- */
add({id:"mv-kidflicks",kind:"kid",title:"Kid Flicks",sub:"Cartoons and family favorites",timer:30,
 rule:"30 seconds per question. No points lost, ever!",emoji:"🍿🦁🧸🚀",c1:"#2a64c4",c2:"#ffd166",
 sillies:["Roar like Simba from the top of Pride Rock!","Strike Buzz Lightyear’s flying pose and say “To infinity and beyond!”","Swim like Nemo all the way around the room!","Freeze! Elsa just froze you. Don’t move for 5 seconds!","Do your best Minion laugh!"]},[
[1,"What kind of animal is Simba?","A lion",["A tiger","A bear","A dog"],"Simba means “lion” in Swahili."],
[1,"Who is Woody’s best friend in Toy Story?","Buzz Lightyear",["Mr. Potato Head","Rex","Slinky Dog"],"They didn’t like each other at first!"],
[1,"What color is Shrek?","Green",["Blue","Orange","Purple"],"Shrek lives in a swamp."],
[1,"What does Elsa make with her magic?","Ice and snow",["Fire","Flowers","Bubbles"],"She makes a whole ice castle in one song!"],
[1,"Who is Mickey Mouse’s girlfriend?","Minnie Mouse",["Daisy Duck","Clarabelle Cow","Princess Peach"],"Mickey and Minnie both appeared for the first time in 1928."],
[1,"In Finding Dory, who is Dory looking for?","Her mom and dad",["Nemo","A treasure","A whale named Bob"],"Dory has trouble remembering things."],
[1,"What are the little yellow helpers in Despicable Me?","Minions",["Smurfs","Trolls","Gnomes"],"They love bananas!"],
[1,"In Cars, what is Lightning McQueen?","A race car",["A tow truck","A fire truck","A school bus"],"His best friend is a tow truck named Mater."],
[1,"What is Ariel in The Little Mermaid?","A mermaid",["A fairy","A dolphin","A princess frog"],"Her best friend is a fish named Flounder."],
[1,"In Zootopia, what animal is Officer Judy Hopps?","A bunny",["A cat","A mouse","A fox"],"She’s the first bunny police officer in Zootopia."],
[1,"What does Winnie the Pooh love to eat?","Honey",["Cookies","Carrots","Fish"],"He keeps it in “hunny” pots."],
[1,"What’s the name of the snowman in Frozen?","Olaf",["Frosty","Sven","Snowy"],"Olaf likes warm hugs!"],
[1,"In Up, what makes the house fly?","Balloons",["Rockets","Wings","Magic"],"Lots and lots of balloons."],
[1,"In The Lion King, who is Simba’s dad?","Mufasa",["Scar","Rafiki","Timon"],"Scar is Simba’s sneaky uncle."],
[1,"In The Jungle Book, what animal is Baloo?","A bear",["A panther","A monkey","A tiger"],"Bagheera is the panther."],
[1,"In Toy Story, what kind of toy is Rex?","A dinosaur",["A dragon","A robot","A teddy bear"],"Rex is afraid of almost everything!"],
[2,"In Encanto, what is the name of the family’s magical house?","Casita",["Casa Grande","Madrigala","Little Home"],"The house can move its tiles and doors to talk!"],
[1,"What’s the name of the blue alien in Lilo & Stitch?","Stitch",["Zip","Blue","Patch"],"His number is 626."],
[1,"In Kung Fu Panda, what is Po’s favorite food?","Dumplings",["Bamboo","Pizza","Cookies"],"Po’s dad runs a noodle shop."],
[1,"In Inside Out, which emotion is blue?","Sadness",["Joy","Anger","Fear"],"Anger is red, and Joy is yellow."],
[2,"In Moana, what is the name of Moana’s pet chicken?","Heihei",["Pua","Kaka","Tui"],"Pua is her pet pig."],
[1,"Which superhero swings from webs?","Spider-Man",["Batman","Superman","The Hulk"],"He was bitten by a special spider."]
]);

add({id:"mv-kidjokes",kind:"kid",title:"Silly Cinema",sub:"Movie jokes. Pick the punchline!",lead:"Pick the punchline!",timer:30,
 rule:"Pick the funniest punchline. 30 seconds a joke. No points lost, ever!",emoji:"😂🍿🎬🤡",c1:"#e8283c",c2:"#ffd166",
 sillies:["Tell your neighbor your best joke!","Laugh like a movie villain: mwa-ha-ha!","Do a superhero landing!"]},[
[1,"Why couldn’t Elsa have a balloon?","Because she would let it go!",["Because it was too cold","Because Olaf popped it","Because it was red"]],
[1,"Why is Cinderella bad at soccer?","She runs away from the ball!",["Her glass shoes break","She’s always late","She can’t kick in a dress"]],
[1,"What does Spider-Man do on the computer?","He surfs the web!",["He plays games","He sends emails","He watches cartoons"]],
[1,"Why did Darth Vader turn off one light?","He likes the dark side!",["He was sleepy","To save money","The light was too bright"]],
[1,"What do you call a sleeping dinosaur?","A dino-snore!",["A T. rest","A sleepy-saurus","A nap-tile"]],
[1,"Which superhero is great at baseball?","Batman!",["Iron Man","Ant-Man","Aquaman"]],
[1,"What does Olaf eat for breakfast?","Frosted Flakes!",["Snow cones","Ice cream","Pancakes"]],
[1,"Why did Mickey Mouse go to outer space?","He was looking for Pluto!",["To meet aliens","To find cheese","He got lost"]],
[1,"What do you call a pig that does karate?","A pork chop!",["A ham-ster","A karate kid","A bacon belt"]],
[1,"Why don’t they play cards in the jungle?","There are too many cheetahs!",["The lions eat them","It’s too windy","Monkeys steal them"]],
[1,"What’s a ghost’s favorite dessert?","I scream!",["Boo-berry pie","Ghost toast","Spooky cookies"]],
[1,"What did the ocean say to Nemo?","Nothing. It just waved!",["Keep swimming","Welcome home","Splash!"]]
]);

/* ---------- Party games (prompts below are picked by theme) ---------- */
add({id:"mv-draw",kind:"draw",title:"Doodle Theater",sub:"Draw a movie. Everyone else guesses it.",
 drawSec:90,artist:100,emoji:"🖍️🎨🎬🖼️",
 rule:"Pick one of three movies on your phone and draw it. No letters! Guessers score like normal. Artists get 100 for every person who guesses theirs."},[]);
add({id:"mv-gif",kind:"gif",title:"GIF Reel",sub:"Answer with the perfect movie GIF. Everyone votes for the funniest.",
 prompts:4,pickSec:75,voteSec:25,perVote:100,best:200,emoji:"🎞️😂🍿📱",
 rule:"Search for a GIF on your phone and add a caption if you like. Then vote for the funniest one. 100 points per vote, +200 for Best in Show."},[]);
add({id:"mv-fibs",kind:"fib",title:"Box Office Bluff",sub:"Write a fake answer that fools your friends. Then find the truth.",
 prompts:4,writeSec:60,voteSec:25,truth:300,fooled:150,emoji:"🤥🎬🤫🍿",
 rule:"Type a believable FAKE answer on your phone. Then pick the real one. Find the truth: +300. Fool someone with your fib: +150 each."},[]);

/* ---------- Picture, sound and clip rounds ----------
   One line per movie: [file name, title, three wrong answers, toughness, a fact, another fact, kid-friendly].
   Files: <name>_1.png / _2 / _3 for The Frame Game, <name>_1.mp3 for Soundbites, clip-<name>_1.mp4 for Clip Show
   (plain <name>.png etc. works too). Kid rounds use the same picture files. */
const MOVIES = [
["jurassic-park","Jurassic Park",["Jurassic World","King Kong","The Lost World: Jurassic Park"],1,"Steven Spielberg directed it in 1993.","The T. rex robot weighed about 9,000 pounds.",1],
["back-to-the-future","Back to the Future",["Back to the Future Part II","Ghostbusters","The Goonies"],1,"Michael J. Fox filmed it at night while making the TV show Family Ties by day.","The DeLorean’s license plate reads OUTATIME.",1],
["the-lion-king","The Lion King",["The Jungle Book","Tarzan","Brother Bear"],1,"It came out in 1994.","James Earl Jones voices Mufasa in both the 1994 and 2019 versions.",1],
["toy-story","Toy Story",["Toy Story 2","Monsters, Inc.","A Bug’s Life"],1,"Pixar’s first movie, from 1995.","Tom Hanks voices Woody and Tim Allen voices Buzz.",1],
["finding-nemo","Finding Nemo",["Finding Dory","The Little Mermaid","Shark Tale"],1,"It came out in 2003.","The dentist’s office is in Sydney, Australia.",1],
["frozen","Frozen",["Frozen II","Tangled","Moana"],1,"It came out in 2013.","Kristen Bell voices Anna, and Idina Menzel voices Elsa.",1],
["shrek","Shrek",["Shrek 2","Puss in Boots","Ice Age"],1,"It came out in 2001.","Mike Myers re-recorded all his lines with a Scottish accent.",1],
["the-avengers","The Avengers",["Avengers: Endgame","Captain America: Civil War","Justice League"],1,"It came out in 2012.","Joss Whedon wrote and directed it.",0],
["iron-man","Iron Man",["Iron Man 2","Captain America: The First Avenger","Ant-Man"],2,"It came out in 2008 and started the Marvel Cinematic Universe.","Jon Favreau directed it and plays Tony’s driver, Happy Hogan.",0],
["black-panther","Black Panther",["Black Panther: Wakanda Forever","Thor: Ragnarok","Eternals"],2,"It came out in 2018.","It was the first superhero movie nominated for Best Picture.",0],
["guardians-of-the-galaxy","Guardians of the Galaxy",["Thor: Ragnarok","Star Trek Beyond","The Avengers"],2,"It came out in 2014.","Chris Pratt lost about 60 pounds to play Star-Lord.",0],
["spider-verse","Spider-Man: Into the Spider-Verse",["Spider-Man: Homecoming","The Incredibles","Big Hero 6"],2,"It came out in 2018 and won the Oscar for Best Animated Feature.","Miles Morales is voiced by Shameik Moore.",1],
["the-dark-knight","The Dark Knight",["Batman Begins","The Dark Knight Rises","Joker"],2,"It came out in 2008.","They flipped a real 18-wheeler truck on a Chicago street.",0],
["star-wars","Star Wars",["The Empire Strikes Back","Return of the Jedi","The Force Awakens"],1,"It came out in 1977.","Harrison Ford was working as a carpenter when he was cast.",1],
["titanic","Titanic",["Pearl Harbor","The Notebook","Poseidon"],1,"It came out in 1997.","James Cameron drew the sketch of Rose himself.",0],
["the-wizard-of-oz","The Wizard of Oz",["Return to Oz","Oz the Great and Powerful","Wicked"],1,"It came out in 1939.","The “snow” in the poppy field scene was made of asbestos.",1],
["forrest-gump","Forrest Gump",["Big","Cast Away","The Green Mile"],2,"It came out in 1994.","It won six Oscars, including Best Picture.",0],
["the-godfather","The Godfather",["The Godfather Part II","Goodfellas","Scarface"],2,"It came out in 1972.","The cat in Marlon Brando’s lap was a stray found on the studio lot.",0],
["harry-potter","Harry Potter and the Sorcerer’s Stone",["Harry Potter and the Chamber of Secrets","Fantastic Beasts and Where to Find Them","The Chronicles of Narnia"],2,"It came out in 2001.","Daniel Radcliffe was 11 when he was cast.",1],
["lord-of-the-rings","The Lord of the Rings: The Fellowship of the Ring",["The Hobbit: An Unexpected Journey","The Two Towers","Willow"],2,"It came out in 2001.","They used forced perspective and doubles to make the hobbits look small.",0],
["raiders-of-the-lost-ark","Raiders of the Lost Ark",["Indiana Jones and the Last Crusade","The Mummy","Romancing the Stone"],2,"It came out in 1981.","Tom Selleck was first choice for Indy, but couldn’t get out of Magnum, P.I.",0],
["jaws","Jaws",["Jaws 2","The Meg","Deep Blue Sea"],1,"It came out in 1975.","The shark doesn’t fully appear until more than an hour in.",0],
["ghostbusters","Ghostbusters",["Ghostbusters II","Men in Black","Beetlejuice"],1,"It came out in 1984.","The firehouse is a real working fire station in New York.",1],
["et","E.T. the Extra-Terrestrial",["Close Encounters of the Third Kind","Super 8","The Goonies"],1,"It came out in 1982.","Drew Barrymore was 6 when she made it.",1],
["the-matrix","The Matrix",["The Matrix Reloaded","Inception","Equilibrium"],2,"It came out in 1999.","The green code on the screens is made of sushi recipes, written in Japanese.",0],
["top-gun","Top Gun",["Top Gun: Maverick","Iron Eagle","Days of Thunder"],1,"It came out in 1986.","Navy recruiting went up after the movie came out.",0],
["ferris-bueller","Ferris Bueller’s Day Off",["The Breakfast Club","Sixteen Candles","Weird Science"],2,"It came out in 1986.","John Hughes wrote the script in less than a week.",0],
["the-princess-bride","The Princess Bride",["Stardust","Willow","Labyrinth"],2,"It came out in 1987.","André the Giant had back trouble, so Robin Wright was held up by ropes in some scenes with him.",1],
["mean-girls","Mean Girls",["Clueless","Legally Blonde","10 Things I Hate About You"],1,"It came out in 2004.","October 3 is “Mean Girls Day,” from a line in the movie.",0],
["anchorman","Anchorman",["Talladega Nights","Step Brothers","Old School"],2,"It came out in 2004.","So much was improvised that they made a whole second movie from the leftovers.",0],
["groundhog-day","Groundhog Day",["Caddyshack","Scrooged","What About Bob?"],2,"It came out in 1993.","It was filmed in Woodstock, Illinois, not Punxsutawney.",0],
["pulp-fiction","Pulp Fiction",["Reservoir Dogs","Jackie Brown","Kill Bill: Vol. 1"],2,"It came out in 1994.","Nobody ever finds out what’s inside the glowing briefcase.",0],
["shawshank","The Shawshank Redemption",["The Green Mile","Escape from Alcatraz","Cool Hand Luke"],2,"It came out in 1994.","It’s based on a Stephen King novella.",0],
["rocky","Rocky",["Rocky II","Creed","Raging Bull"],2,"It came out in 1976 and won Best Picture.","It was filmed in about 28 days.",0],
["gladiator","Gladiator",["Troy","Braveheart","300"],2,"It came out in 2000.","Oliver Reed died during filming, so his last scenes were finished with a digital double.",0],
["silence-of-the-lambs","The Silence of the Lambs",["Se7en","Red Dragon","Zodiac"],3,"It came out in 1991.","It’s the only horror movie to win Best Picture.",0],
["the-sound-of-music","The Sound of Music",["Mary Poppins","My Fair Lady","The King and I"],2,"It came out in 1965.","Julie Andrews was also Mary Poppins the year before.",1],
["grease","Grease",["Grease 2","Dirty Dancing","Hairspray"],1,"It came out in 1978.","Olivia Newton-John was sewn into her black pants for the last scene.",0],
["la-la-land","La La Land",["Whiplash","Crazy, Stupid, Love.","Singin’ in the Rain"],2,"It came out in 2016.","Ryan Gosling learned to play the piano for it.",0],
["barbie","Barbie",["Legally Blonde","Enchanted","Mean Girls"],1,"It came out in 2023.","It used so much pink paint that the company ran low.",1],
["the-incredibles","The Incredibles",["Incredibles 2","Megamind","Big Hero 6"],1,"It came out in 2004.","The sequel came 14 years later but picks up right where it left off.",1],
["up","Up",["WALL-E","Coco","Inside Out"],1,"It came out in 2009.","Up was the first animated movie to open the Cannes Film Festival.",1],
["coco","Coco",["The Book of Life","Encanto","Up"],1,"It came out in 2017.","Miguel’s dog Dante is a Xoloitzcuintli, the national dog of Mexico.",1],
["moana","Moana",["Lilo & Stitch","Encanto","Frozen"],1,"It came out in 2016.","Auliʻi Cravalho was 14 when she was cast as Moana.",1],
["aladdin","Aladdin",["Hercules","Mulan","The Prince of Egypt"],1,"The animated movie came out in 1992.","The Genie was animated to match Robin Williams’s improvising.",1],
["beauty-and-the-beast","Beauty and the Beast",["Cinderella","The Little Mermaid","Tangled"],1,"The animated movie came out in 1991.","The Beast is a mix of a lion, a buffalo, a bear, a gorilla and a boar.",1],
["monsters-inc","Monsters, Inc.",["Monsters University","Toy Story 2","Shrek"],1,"It came out in 2001.","Sulley has about 2.3 million individually animated hairs.",1],
["inside-out","Inside Out",["Inside Out 2","Soul","Up"],1,"It came out in 2015.","The emotions were designed to look like they’re made of tiny glowing particles.",1],
["terminator-2","Terminator 2: Judgment Day",["The Terminator","RoboCop","Total Recall"],2,"It came out in 1991.","Linda Hamilton’s twin sister plays her double in some scenes.",0],
["die-hard","Die Hard",["Lethal Weapon","Speed","Under Siege"],1,"It came out in 1988.","Nakatomi Plaza is really Fox Plaza in Los Angeles.",0],
["the-breakfast-club","The Breakfast Club",["Sixteen Candles","Pretty in Pink","Ferris Bueller’s Day Off"],2,"It came out in 1985.","Almost the whole movie takes place in one library.",0],
["pirates-of-the-caribbean","Pirates of the Caribbean: The Curse of the Black Pearl",["Hook","The Goonies","Treasure Island"],1,"It came out in 2003.","It’s based on a Disneyland ride.",1],
["avatar","Avatar",["Avatar: The Way of Water","Dune","John Carter"],1,"It came out in 2009.","James Cameron waited years for the technology to be good enough to make it.",0],
["oppenheimer","Oppenheimer",["Interstellar","Tenet","Dunkirk"],2,"It came out in 2023 and won Best Picture.","The big explosion was done with real fire and explosives, not computer effects.",0],
["napoleon-dynamite","Napoleon Dynamite",["Nacho Libre","Juno","Little Miss Sunshine"],2,"It came out in 2004.","It was made for about $400,000.",0],
["wall-e","WALL-E",["Up","Robots","Big Hero 6"],1,"It came out in 2008.","WALL-E’s voice was made by sound designer Ben Burtt, who also did R2-D2.",1],
["despicable-me","Despicable Me",["Minions","Megamind","Monsters vs. Aliens"],1,"It came out in 2010.","Steve Carell voices Gru.",1],
["the-little-mermaid","The Little Mermaid",["Moana","Splash","Finding Nemo"],1,"The animated movie came out in 1989.","It started the Disney Renaissance of the 1990s.",1],
["zootopia","Zootopia",["Sing","The Secret Life of Pets","Robin Hood"],1,"It came out in 2016.","The animators studied real animals in Kenya.",1],
["kung-fu-panda","Kung Fu Panda",["Kung Fu Panda 2","Turning Red","Madagascar"],1,"It came out in 2008.","Jack Black voices Po.",1],
["home-alone","Home Alone",["Home Alone 2: Lost in New York","Jingle All the Way","Dennis the Menace"],1,"It came out in 1990.","Kevin’s house is a real home near Chicago.",1],
["edward-scissorhands","Edward Scissorhands",["Beetlejuice","Corpse Bride","Sleepy Hollow"],2,"It came out in 1990.","Johnny Depp says only about 169 words in the whole movie.",0]
];
  const files = { img: n => `assets/media/${n}.png`, audio: n => `assets/media/${n}.mp3`, video: n => `assets/media/clip-${n}.mp4` };
  const media = (id, meta, kind, lead, factIx, filter) => {
    const list = MOVIES.filter(filter || (() => true));
    add(Object.assign({ id, pick: 12, kind: meta.kind || "media", lead }, meta),
      list.map(m => [m[3], lead, m[1], m[2], m[factIx] || m[4], { [kind]: files[kind](m[0]), ...(kind === "img" ? { fx: "blur" } : {}) }]));
  };
  media("mv-frames", { title: "Freeze Frame", sub: "Guess the movie from one blurry frame",
    rule: "The picture starts blurry and clears up as time runs out. Guess early for more points!" }, "img", "Which movie is this?", 4);
  media("mv-sounds", { title: "Sound Check", sub: "Name the movie from the sound clip",
    rule: "Listen closely. The sooner you name it, the more you score." }, "audio", "Listen! Which movie?", 5);
  media("mv-clips", { title: "Coming Attractions", sub: "Name the movie from a few seconds of video",
    rule: "Watch the clip. The sooner you name it, the more you score." }, "video", "Watch! Which movie?", 4);
  media("mv-kidframes", { kind: "kid", title: "Kid Freeze Frame", sub: "Guess the movie from a blurry picture", timer: 30,
    rule: "The picture starts blurry and gets clearer. 30 seconds a picture. No points lost, ever!", emoji: "🖼️🍿🦁🚀", c1: "#2a64c4", c2: "#ffd166",
    sillies: ["Act out the movie you think it is, without talking!", "Make the face of your favorite movie hero!", "Do a superhero landing!"] }, "img", "Which movie is this?", 5, m => m[6]);
  /* Kid rounds are always easy. */
  { const kr = R[R.length - 1]; kr.tough = kr.tough.replace(/[23]/g, "1"); }
  window.MOVIE_MEDIA = MOVIES;

/* ---------- Prompts for the party games ---------- */
  const tag = (arr, theme) => arr.map(x => Object.assign({ theme }, x));
  window.DRAW_PROMPTS = (window.DRAW_PROMPTS || []).concat(tag([
  {t:"Jaws",kid:1},{t:"Toy Story",kid:1},{t:"Finding Nemo",kid:1},{t:"The Lion King",kid:1},{t:"Frozen",kid:1},{t:"Up",kid:1},
  {t:"Shrek",kid:1},{t:"Cars",kid:1},{t:"Spider-Man",kid:1},{t:"Star Wars",kid:1},{t:"Jurassic Park",kid:1},{t:"Harry Potter",kid:1},
  {t:"E.T. the Extra-Terrestrial",kid:1},{t:"Ghostbusters",kid:1},{t:"The Wizard of Oz",kid:1},{t:"Ratatouille",kid:1},
  {t:"Monsters, Inc.",kid:1},{t:"Moana",kid:1},{t:"The Little Mermaid",kid:1},{t:"Aladdin",kid:1},{t:"Despicable Me",kid:1},
  {t:"King Kong",kid:1},{t:"The Incredibles",kid:1},{t:"Inside Out",kid:1},{t:"Beauty and the Beast",kid:1},{t:"Zootopia",kid:1},
  {t:"Kung Fu Panda",kid:1},{t:"Snow White",kid:1},{t:"Cinderella",kid:1},{t:"Charlie and the Chocolate Factory",kid:1},
  {t:"Titanic"},{t:"Back to the Future"},{t:"Iron Man"},{t:"Batman"},{t:"Pirates of the Caribbean"},{t:"The Karate Kid"},
  {t:"Top Gun"},{t:"Rocky"},{t:"The Matrix"},{t:"Barbie"},{t:"Avatar"},{t:"Godzilla"},{t:"Psycho"},{t:"Gladiator"},{t:"Cast Away"}
  ], "movies"));

  window.GIF_PROMPTS = (window.GIF_PROMPTS || []).concat(tag([
  {t:"Your face when someone talks during the movie."},
  {t:"When the popcorn is gone before the trailers end.",kid:1},
  {t:"When someone spoils the ending."},
  {t:"Your reaction to a jump scare.",kid:1},
  {t:"When the sequel is better than the original."},
  {t:"Walking out of a three-hour movie."},
  {t:"When your friend says they’ve never seen Star Wars."},
  {t:"When there’s a secret scene after the credits.",kid:1},
  {t:"When they remake a movie you love."},
  {t:"Trying to find your seat in a dark theater.",kid:1},
  {t:"When the theater is FREEZING.",kid:1},
  {t:"When the hero finally shows up.",kid:1},
  {t:"Crying at an animated movie."},
  {t:"When your favorite character shows up.",kid:1},
  {t:"Sneaking candy into the movies.",kid:1},
  {t:"When you get the giant tub of popcorn.",kid:1},
  {t:"When the lights go down.",kid:1},
  {t:"Picking a movie for family night.",kid:1},
  {t:"When someone says the book was better."},
  {t:"When you finally figure out the twist."},
  {t:"Your face during the kissing scene.",kid:1},
  {t:"Watching a scary movie alone."},
  {t:"When the opening theme music starts.",kid:1},
  {t:"When you quote a movie and nobody gets it."},
  {t:"Leaving the theater like you’re the action hero.",kid:1},
  {t:"When the movie is “based on a true story.”"},
  {t:"Your phone ringing in the middle of the movie."},
  {t:"When the villain has a really good point."},
  {t:"Two hours of scrolling and you still haven’t picked a movie."},
  {t:"When the dog in the movie is in danger.",kid:1}
  ], "movies"));

  window.FIB_PROMPTS = (window.FIB_PROMPTS || []).concat(tag([
  {q:"In Toy Story, the toy-wrecking kid next door is named ____.",a:"Sid",h:["Kevin","Butch","Marty"],kid:1},
  {q:"The Jaws crew nicknamed the mechanical shark “____,” after Spielberg’s lawyer.",a:"Bruce",h:["Jerry","Chompy","Big Al"]},
  {q:"In Back to the Future, the judge who rejects Marty’s band is played by singer ____.",a:"Huey Lewis",h:["Billy Joel","Phil Collins","Bruce Springsteen"]},
  {q:"In Ghostbusters, the Ghostbusters set up their headquarters in an old ____.",a:"firehouse",h:["church","bank","bowling alley"]},
  {q:"In The Princess Bride, the giant Fezzik is played by the wrestler André the ____.",a:"Giant",h:["Bear","Mountain","Great"]},
  {q:"In Finding Nemo, the dentist’s fish-shaking niece is named ____.",a:"Darla",h:["Daisy","Dolly","Debbie"],kid:1},
  {q:"In Jurassic Park, the dinosaur DNA came from a mosquito trapped in ____.",a:"amber",h:["ice","tar","a volcano rock"]},
  {q:"In Up, the talking dog is named ____.",a:"Dug",h:["Buddy","Rex","Barkley"],kid:1},
  {q:"Mike Wazowski in Monsters, Inc. is voiced by Billy ____.",a:"Crystal",h:["Murray","Joel","Bob Thornton"]},
  {q:"The Hogwarts motto means “Never tickle a sleeping ____.”",a:"dragon",h:["troll","giant","teacher"]},
  {q:"In Shrek, the Gingerbread Man is called ____.",a:"Gingy",h:["Ginger","Cookie","Crumbs"],kid:1},
  {q:"In The Matrix, Neo’s real name is Thomas ____.",a:"Anderson",h:["Andrews","Wilson","Nelson"]},
  {q:"In Titanic, Jack wins his ticket in a game of ____.",a:"poker",h:["chess","dice","darts"]},
  {q:"In Forrest Gump, Forrest names his shrimp boat after ____.",a:"Jenny",h:["Bubba","Lieutenant Dan","his mama"]},
  {q:"In The Incredibles, the family’s last name is ____.",a:"Parr",h:["Strong","Powers","Mighty"],kid:1},
  {q:"In The Empire Strikes Back, Yoda lives on the swamp planet ____.",a:"Dagobah",h:["Mudbar","Bogwalla","Swampos"]},
  {q:"In Frozen, Kristoff’s reindeer is named ____.",a:"Sven",h:["Sparky","Rudy","Olav"],kid:1},
  {q:"In Toy Story 2, Jessie and Woody’s horse is named ____.",a:"Bullseye",h:["Blaze","Trigger","Buttercup"],kid:1},
  {q:"In Despicable Me, Gru adopts three girls: Margo, Edith and ____.",a:"Agnes",h:["Annie","Lucy","Ellie"],kid:1},
  {q:"In The Last Crusade, we learn Indiana Jones was named after the family ____.",a:"dog",h:["horse","hometown","grandpa"]},
  {q:"In The Godfather, the Corleones’ olive oil company is called ____.",a:"Genco",h:["Sicilia Oil","Corleone Imports","Vito & Sons"]},
  {q:"In Pulp Fiction, Mia and Vincent win a ____ contest.",a:"twist",h:["karaoke","milkshake","hula hoop"]},
  {q:"In Guardians of the Galaxy, Drax takes everything ____.",a:"literally",h:["seriously","personally","for granted"]},
  {q:"In Cars, Lightning McQueen’s best friend is a tow truck named ____.",a:"Mater",h:["Hooky","Rusty","Towy"],kid:1},
  {q:"In Moana, Moana’s pet pig is named ____.",a:"Pua",h:["Oink","Kai","Moko"],kid:1},
  {q:"In The Lion King, Timon is a meerkat and Pumbaa is a ____.",a:"warthog",h:["boar","hippo","hedgehog"],kid:1},
  {q:"In Star Wars, Chewbacca is a ____.",a:"Wookiee",h:["Ewok","Gungan","Jawa"]},
  {q:"In Harry Potter, Harry’s owl is named ____.",a:"Hedwig",h:["Errol","Hoot","Pigwidgeon"],kid:1}
  ], "movies"));
})();
