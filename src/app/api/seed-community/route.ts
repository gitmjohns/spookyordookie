import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SEED_USERS = [
  { email: "ClassicHorrorFan@seed.terrormeter.local", bias: "classic" },
  { email: "ElevatedHorrorHead@seed.terrormeter.local", bias: "elevated" },
  { email: "SlasherStan@seed.terrormeter.local", bias: "slasher" },
  { email: "ScreenQueenReviews@seed.terrormeter.local", bias: "critical" },
  { email: "HorrorVaultPod@seed.terrormeter.local", bias: "balanced" },
];

// ─── Comment pools ────────────────────────────────────────────────────────────

const POOL_ENTHUSIASTIC = [
  "Absolute masterpiece. I have seen this film probably thirty times and it reveals something new each viewing. This is why the genre exists.",
  "Don't let anyone tell you this is 'just a horror movie.' It's one of the finest films made in any genre in the last fifty years.",
  "Saw this for the first time at fourteen and it changed the way I understood what cinema could do. Revisited it last week and it hit even harder.",
  "The rare horror film where every single decision — cast, score, cinematography, editing — is the right one. Near perfect execution.",
  "People who dismiss horror as a lesser genre have never sat with this film alone in a dark room. Completely transformative.",
  "I'm not easily scared. I've seen hundreds of horror films. This one got me. That doesn't happen often anymore.",
  "Whatever the hype around this film is, it's earned. Sometimes the consensus is just correct.",
  "Genuinely scary in a way most modern horror simply isn't. Gets under your skin and stays there for days.",
  "Everything horror should be: specific, committed, uncompromising. A full recommend to anyone who takes the genre seriously.",
  "The ending haunted me for weeks. Still thinking about it months later and I've seen it four times.",
  "Put this on with someone who says they don't do horror. By the end they'll understand what they've been missing.",
  "One of those films that proves the genre is as capable of genuine artistry as anything playing at prestige festivals.",
  "The craft on display is extraordinary. Every frame is considered. The filmmaker understood exactly what they were making and why.",
  "I pushed through the slow opening and the film rewarded me with one of the most intense final acts in horror history.",
  "Required viewing. Not negotiable. This is part of the canon for a reason.",
  "Terrifying in the best possible way. Hasn't lost a single frame of its power over the years.",
  "This is the film I show people when I want to convince them horror is a serious art form.",
  "Rewatched it before writing this comment and immediately wanted to watch it again. That's the mark.",
  "The atmosphere alone justifies the runtime. Even the quiet scenes feel dangerous.",
  "Legitimately one of the greatest horror films ever committed to camera. Essential.",
];

const POOL_MEASURED_POSITIVE = [
  "Solid entry in the genre. Nothing revolutionary but everything it does, it does competently. Worth a watch on a dark evening.",
  "Better than its reputation suggests. Some rough edges but the core of it really works.",
  "The third act is a bit of a mess but the first two thirds are quietly excellent. Recommended with mild caveats.",
  "Technically accomplished with at least two genuinely great sequences. Not a classic but a very decent film.",
  "I came in skeptical and left pleasantly surprised. Genre fans will find plenty to enjoy.",
  "Good, not great. Effective for what it is. Delivers on the basic promise of its premise.",
  "Not quite as clever as it thinks it is but the atmosphere is genuinely unsettling throughout.",
  "Has the ingredients of a classic without quite assembling them in the right order. Still worth your time.",
  "Strong performances elevate slightly predictable material. More watchable than the premise suggests.",
  "Gets better on a second viewing when you know what's coming and can appreciate the construction.",
  "Not going to change your life but delivers solidly. A reliable horror film that knows what it is.",
  "The pacing drags in the middle third but everything around it is confident and well-executed.",
  "Worth your time. Not a masterpiece but an honest, effective piece of horror filmmaking.",
  "Good studio horror. Doesn't reinvent anything but knows what it's doing and does it well.",
  "Competent, occasionally inspired, never embarrassing. A solid night's viewing.",
  "Would recommend to genre fans. Would not use the word essential but it earns its place in the conversation.",
  "The lead performance alone makes this worth watching. Everything else ranges from fine to quite good.",
  "Satisfying in a way a lot of modern horror isn't. Follows through on what it sets up.",
];

const POOL_MIXED = [
  "I understand why people love this and I understand why people hate it. I'm somewhere in the middle, still thinking about it.",
  "First half is genuinely great. Second half loses the thread completely. Average those out and you get a frustrated shrug.",
  "The concept is better than the execution. Frustrating because you can see what it was trying to be throughout.",
  "Works on atmosphere but falls apart when it has to deliver on its promises.",
  "Started brilliantly, ended disappointingly. Still worth watching for the first eighty minutes alone.",
  "Technically impressive in places, completely incoherent in others. A mess with moments of genuine inspiration.",
  "I've watched it twice and had a completely different reaction each time. Can't decide if that's a feature or a bug.",
  "The performances are terrific. The script lets them down. A genuinely frustrating near-miss.",
  "Creates tremendous dread and then doesn't know what to do with it. Fascinating failure as much as a success.",
  "Built like a slow burn and pays off... partially. The ending needed another draft.",
  "Some absolutely brilliant sequences surrounding a film that doesn't quite deserve them.",
  "Impressive ambition. Execution is patchy. The highs are very high and the lows are pretty low.",
  "I admire it more than I enjoy it. The craft is undeniable even when the film frustrates.",
  "Not the film the trailers promised and that works both for and against it depending on your expectations.",
  "Half a masterpiece. Infuriatingly, I can't quite tell you which half.",
  "The horror community is split on this one and honestly both sides make valid points.",
];

const POOL_DISAPPOINTED = [
  "I wanted to love this. The more I think about it the more its problems outweigh its qualities.",
  "The reputation is doing most of the work here. Strip that away and it's a competent but unremarkable film.",
  "Not every quiet, deliberately paced horror film is profound. Sometimes slow is just slow.",
  "Gets more credit than it deserves because of the era it was released in. Context is doing heavy lifting.",
  "Bored me. I know that puts me in a minority but I found very little here that worked for me personally.",
  "The setup is excellent. The follow-through is almost insultingly bad. What a waste of a great premise.",
  "Technically fine. Emotionally inert. I watched it and felt absolutely nothing.",
  "There are three great scenes in a very long film. The math doesn't work in its favor.",
  "Overlong, underdeveloped, and nowhere near as scary as people insist.",
  "My hot take: this is mid at best and the critical establishment is wrong about it.",
];

const POOL_CONTRARIAN = [
  "Wildly misunderstood on release and honestly the reappraisal still hasn't gone far enough. Still underrated.",
  "People cite this as a classic but I rewatched it recently and it has aged badly. More nostalgia than substance.",
  "Criminally overlooked. If this had been made by a prestige director it would have a completely different reputation.",
  "I will always be the person in the room defending this one. Yes it has problems. It's still more interesting than most.",
  "Everyone agrees this is a masterpiece. I'm here to say it's a masterpiece specifically because of the elements people criticize.",
  "The ending everyone hates is the best part. The film was never going to give you what you wanted and that's the point.",
  "This film predicted where the genre was going ten years before anyone else saw it.",
  "Hot take: this is better than anything the director made before or after it and I will not be taking questions.",
  "Revisionist take incoming: this has aged incredibly well and the people who dismissed it on release were simply wrong.",
  "The most underrated film in the genre. The discourse around it has been embarrassingly shallow.",
];

// ─── Era-specific pools ────────────────────────────────────────────────────────

const POOL_ERA_70S = [
  "This is peak 70s horror — grimy, paranoid, and completely uninterested in reassuring you. No decade did it quite like this.",
  "The 70s were the most fertile period in horror history and this is a prime example. Raw filmmaking, real dread.",
  "There's a texture to 70s horror that no other era has managed to replicate. The grain, the lighting, the silence. This has all of it.",
  "Pre-slasher horror operated on different rules and this is a masterclass in them. The fear is existential, not visceral.",
  "The 70s horror renaissance produced some of the genre's most enduring work. This deserves to be in that conversation.",
  "You can feel the cultural anxiety of the era in every frame. Vietnam, Watergate, the collapse of the American dream — all filtered through the genre.",
];

const POOL_ERA_80S = [
  "Classic 80s horror. The practical effects, the synth score, the complete lack of self-consciousness — this is the genre at its most vital.",
  "The 80s were the golden age and this is a perfect example of why. Hair metal era horror had a specific energy that's never come back.",
  "Everything about this screams 1980s in the best possible way. Pure genre filmmaking with no apologies.",
  "The decade that defined horror is represented well here. No CGI, no irony, no meta-commentary — just craft and commitment.",
  "You can feel every dollar of the budget on screen, which wasn't much, and it still works. 80s horror understood limitations as advantages.",
  "The Reagan era produced the most creative horror of the 20th century and this belongs in that canon.",
  "80s horror gets reduced to slashers in the popular memory but there was so much more happening. This is part of that broader story.",
];

const POOL_ERA_90S = [
  "The 90s are criminally underrated in horror history. This is a solid reminder that the decade had serious things going on.",
  "Peak 90s aesthetic — which I mean as a genuine compliment. This holds up better than most people remember.",
  "Sandwiched between the 80s golden age and the 2000s torture era, 90s horror did interesting, strange things. This is one of them.",
  "The 90s horror film has a specific look and feel that I find genuinely comforting at this point. This delivers exactly that.",
  "The decade gets overlooked but produced some underappreciated genre work. This falls into that category.",
  "Post-slasher, pre-torture porn — 90s horror was figuring out what to be next. Some fascinating results.",
];

const POOL_ERA_2000S = [
  "Early 2000s horror had a specific post-millennial anxiety that this captures well. The genre was processing a lot.",
  "The 2000s torture porn wave gets all the attention but there was genuinely interesting work happening alongside it. This is some of it.",
  "2000s horror is due for reappraisal and this is one of the films that will benefit. More craft here than it got credit for.",
  "The decade produced some genuinely unsettling work under the radar. This is an example of what you might have missed.",
  "J-horror and its American remakes dominated conversation in this era but the domestic stuff had its moments. This is one of them.",
  "Post-9/11 horror had a very specific texture — paranoid, body-conscious, deeply uncomfortable with safety. This has it.",
];

const POOL_ERA_2010S = [
  "The elevated horror wave of the 2010s produced some of the finest genre filmmaking ever and this is part of that tradition.",
  "Modern horror took itself seriously in this decade in a way it hadn't since the 70s. This is evidence of what that produced.",
  "The 2010s are going to be looked back on as a second golden age for the genre. This is part of why.",
  "The Blumhouse model and the A24 model both thrived in this decade and this fits somewhere between them — thoughtful but accessible.",
  "Contemporary horror found its voice in this period and this is a strong example of the form.",
];

const POOL_ERA_RECENT = [
  "Modern horror is in a stronger place than it's been in decades. This is part of why that argument holds up.",
  "Recent horror is doing serious work with serious themes and this contributes to that conversation meaningfully.",
  "The current horror landscape is genuinely exciting and this is a solid entry in what's shaping up to be another strong era for the genre.",
  "Horror right now has real ambition behind it. Not everything lands but when it does it really does. This mostly lands.",
  "Good contemporary horror. Aware of its predecessors, not enslaved to them.",
];

// ─── Specific comments for iconic titles ─────────────────────────────────────

const TITLE_COMMENTS: Record<string, { username: string; content: string }[]> = {
  "silence of the lambs": [
    { username: "HorrorVaultPod", content: "Hopkins has about sixteen minutes of screen time and dominates every frame. Five Oscars including Best Picture — the only horror film to do it. A landmark of the form." },
    { username: "ClassicHorrorFan", content: "More psychological thriller than straight horror but Buffalo Bill's basement is pure nightmare fuel. Demme's direction is almost uncomfortably intimate throughout." },
    { username: "ElevatedHorrorHead", content: "Clarice Starling is the greatest horror protagonist ever written. She's not prey — she's a hunter. The film earns every moment of its horror through character." },
    { username: "ScreenQueenReviews", content: "A towering achievement that still gets undersold as a genre film. The scene where Leatherface — sorry, Lecter — first encounters Clarice through the glass is perfect cinema." },
  ],
  "hereditary": [
    { username: "ClassicHorrorFan", content: "I don't scare easily after forty years of watching horror. This film scared me. The miniatures are inspired. That dinner table scene will follow you home forever." },
    { username: "ElevatedHorrorHead", content: "Ari Aster's debut is a miracle of sustained dread. It earns its extreme moments because of how carefully it builds the family dynamics first. The grief is real before the horror is." },
    { username: "SlasherStan", content: "Slow burn for most of the runtime but the final act is absolutely unhinged. The pylon scene had my entire theater silent. Aster does not pull punches." },
    { username: "ScreenQueenReviews", content: "Toni Collette was robbed of every award going that year. Her performance in the attic scene alone should have been career-defining recognition." },
  ],
  "get out": [
    { username: "ScreenQueenReviews", content: "Peele weaponized horror tropes to say something that genuinely matters. The sunken place sequence is one of the most original horror images of the decade. Required viewing." },
    { username: "HorrorVaultPod", content: "Rare horror film that gets better on every rewatch. First time you're scared. Second time you notice all the foreshadowing. Third time you're in awe of the construction." },
    { username: "ClassicHorrorFan", content: "Reminds me of Rosemary's Baby in how it weaponizes the horror of social situations. Jordan Peele arrived fully formed with this film." },
    { username: "SlasherStan", content: "The auction scene. I can't stop thinking about the auction scene. Genius filmmaking." },
  ],
  "the shining": [
    { username: "ClassicHorrorFan", content: "Kubrick takes King's novel and transcends it entirely. The Overlook Hotel doesn't feel like a set — it feels like a dimension. One of cinema's great performances from Nicholson." },
    { username: "ElevatedHorrorHead", content: "The Steadicam work alone is worth the price of admission. Kubrick understood that perfect symmetry could be profoundly unsettling. Room 237 still haunts me." },
    { username: "ScreenQueenReviews", content: "Shelley Duvall's performance is chronically underrated. She carries the emotional weight of the entire film while working under reportedly impossible conditions." },
    { username: "HorrorVaultPod", content: "King hates this adaptation. King is wrong. This is the rare case where the film surpasses the source material by asking different questions." },
  ],
  "halloween": [
    { username: "SlasherStan", content: "The genre-defining slasher. Myers works because Carpenter gives him zero motivation — he's not a person, he's an idea. Pure evil in a William Shatner mask." },
    { username: "ClassicHorrorFan", content: "Carpenter's score is effectively the fifth cast member. Low budget, no blood, no CGI — still terrifying forty-five years later. This is how you do it with almost nothing." },
    { username: "HorrorVaultPod", content: "Every slasher made after 1978 is either imitating or reacting to this one. The POV shots at the start still feel deeply, wrongly intimate." },
    { username: "ElevatedHorrorHead", content: "What Carpenter understood that his imitators missed: it's not about death, it's about watching. Myers is voyeurism made terrifying." },
  ],
  "midsommar": [
    { username: "ElevatedHorrorHead", content: "Aster's second feature is somehow more disturbing than his first because it all happens in broad daylight. Florence Pugh's grief turns into something genuinely transformative." },
    { username: "ScreenQueenReviews", content: "The best breakup movie ever made, which also happens to contain some of the most disturbing imagery in mainstream horror. The ättestupa scene just clears the theater." },
    { username: "SlasherStan", content: "First twenty minutes are devastating. The rest is gorgeous and completely wrong. The bear. I cannot explain the bear. Just watch it." },
    { username: "ClassicHorrorFan", content: "Reminds me of The Wicker Man in the best possible way. Folk horror at its finest and most formally ambitious." },
  ],
  "nightmare on elm street": [
    { username: "ClassicHorrorFan", content: "Craven gives horror a philosopher villain who kills in your dreams — the one place you can't escape. Freddy before the sequels made him a comedian is genuinely terrifying." },
    { username: "SlasherStan", content: "The bed geyser is still jaw-dropping practical effects. Nancy is one of horror's great final girls. Englund created an icon from essentially nothing." },
    { username: "HorrorVaultPod", content: "Craven said the idea came from reading about Hmong refugees dying in their sleep after the Vietnam War. Knowing that makes the film hit entirely differently." },
    { username: "ElevatedHorrorHead", content: "The logic of dreams used as a horror mechanism is still the most original concept in the genre's history. Nothing has matched it since." },
  ],
  "scream": [
    { username: "ScreenQueenReviews", content: "Craven and Williamson deconstruct the slasher while simultaneously delivering one of the best slashers ever made. Meta without ever being smug about it." },
    { username: "SlasherStan", content: "The opening with Drew Barrymore sets a standard the rest of the film somehow maintains. Ghost Face is genuinely menacing under all the pop culture banter." },
    { username: "ClassicHorrorFan", content: "The rules scene changed how audiences watch horror forever. Smart, fast, and still scary despite everything you know going in." },
    { username: "HorrorVaultPod", content: "Roger Ebert gave this three and a half stars in 1996. He was right. This is proper filmmaking in service of genuine entertainment." },
  ],
  "the conjuring": [
    { username: "ClassicHorrorFan", content: "Wan brings old-school craft to a found-footage era. The clapping game sequence is a textbook lesson in horror direction." },
    { username: "HorrorVaultPod", content: "Best mainstream horror film of the 2010s by a significant margin. Spawned a franchise that immediately diluted what made this special." },
    { username: "ScreenQueenReviews", content: "Vera Farmiga elevates everything she appears in. The possession sequence in the finale is legitimately frightening cinema." },
    { username: "ElevatedHorrorHead", content: "Wan's gift is making you care about the characters before scaring you. That's rarer than it sounds." },
  ],
  "the thing": [
    { username: "ClassicHorrorFan", content: "Carpenter at absolute peak Carpenter. Rob Bottin's practical creature effects have never been surpassed. The chest defibrillator scene gets me every single time." },
    { username: "HorrorVaultPod", content: "The paranoia is the real horror. The alien is almost secondary — it's watching the men turn on each other that's truly disturbing. A masterclass in tension." },
    { username: "ElevatedHorrorHead", content: "Antarctic isolation horror done perfectly. The ambiguous ending is one of cinema's great final shots. MacReady and Childs just staring at each other." },
    { username: "SlasherStan", content: "The practical effects are so good they're almost offensive. Every dollar of that budget is on screen and horrifying." },
  ],
  "the witch": [
    { username: "ElevatedHorrorHead", content: "Eggers builds a film of almost unbearable tension from Puritan anxiety. The horror comes as much from the community turning on itself as from anything in the woods." },
    { username: "ScreenQueenReviews", content: "Anya Taylor-Joy's debut. Thomasin is one of horror's most complex protagonists. Live deliciously. The ending is horrifying and weirdly triumphant simultaneously." },
    { username: "ClassicHorrorFan", content: "Slow burn horror the way they used to make it. Black Phillip alone justifies the film's existence." },
    { username: "SlasherStan", content: "I've heard people call this boring. Those people are wrong. The tension in this film is almost unbearable by the third act." },
  ],
  "rosemary's baby": [
    { username: "ClassicHorrorFan", content: "Polanski's masterpiece of sustained paranoia. Mia Farrow sells Rosemary's terror entirely through performance — no jump scares, no monsters, just relentless dread." },
    { username: "ScreenQueenReviews", content: "The horror of a woman losing bodily autonomy surrounded by people insisting everything is perfectly fine. Still one of the ten greatest horror films ever made." },
    { username: "HorrorVaultPod", content: "The production design of the Bramford apartment is a character unto itself. Everything feels slightly wrong in ways you can't quite articulate." },
    { username: "ElevatedHorrorHead", content: "Roman Polanski understood that the most terrifying place is inside a marriage where one partner isn't who they said they were." },
  ],
  "the exorcist": [
    { username: "ClassicHorrorFan", content: "The film that made horror respectable. Still shocking fifty years on — not because of the pea soup but because of what it says about faith and doubt. Friedkin understood the book." },
    { username: "HorrorVaultPod", content: "The medical examination sequence is more disturbing than anything supernatural in the film. Linda Blair at twelve gives one of the most technically demanding performances in film history." },
    { username: "ElevatedHorrorHead", content: "It's really a film about a mother's grief and a priest's crisis of faith. The horror is almost incidental to the human story underneath. That's what makes it endure." },
    { username: "ScreenQueenReviews", content: "The scene where Karras watches the tape of the medical examinations tells you everything about the film's real subject. Shattering." },
  ],
  "alien": [
    { username: "ClassicHorrorFan", content: "Scott grafts a haunted house onto a spaceship and the result is perfect cinema. The chest burster is still one of cinema's great shock moments. Giger's design work is timeless." },
    { username: "ElevatedHorrorHead", content: "Ripley is the gold standard for horror protagonists. Everything about the Nostromo feels lived-in and real. The horror works because the characters work first." },
    { username: "HorrorVaultPod", content: "The scariest thing isn't the Xenomorph — it's Ash. The reveal in the third act turns survival horror into something genuinely existential. A masterpiece." },
    { username: "SlasherStan", content: "Perfect pacing. Perfect production design. Perfect ending. The word classic is overused in horror. This is what it actually means." },
  ],
  "psycho": [
    { username: "ClassicHorrorFan", content: "Hitchcock broke every rule of filmmaking and in doing so invented the modern horror film. Killing your apparent protagonist in the first act is still audacious sixty years later." },
    { username: "HorrorVaultPod", content: "The shower scene uses 70 cuts in 45 seconds and you never see the knife make contact. The most studied scene in cinema history still works perfectly." },
    { username: "ScreenQueenReviews", content: "Anthony Perkins was so good as Norman Bates that Hollywood never let him play anything else. The tragedy of his career mirrors the tragedy of his character." },
    { username: "ElevatedHorrorHead", content: "The score. The black and white photography. The architecture of suspense. Hitchcock teaching a masterclass." },
  ],
  "friday the 13th": [
    { username: "SlasherStan", content: "The one that cemented Camp Crystal Lake in the cultural consciousness. The twist reveal is still one of horror's all-time great gotcha moments. Tom Savini's effects are incredible." },
    { username: "ClassicHorrorFan", content: "Cunningham made this on a shoestring budget and created a franchise that's still running. The chemistry between the counselors makes you care before things go wrong." },
    { username: "HorrorVaultPod", content: "People always say Halloween is the template but Friday the 13th is the film that actually got cloned a thousand times. The slasher formula lives here." },
    { username: "ScreenQueenReviews", content: "Not as polished as Halloween but it has a raw, unpretentious energy that works in its favor. You know exactly what you're getting and it delivers." },
  ],
  "poltergeist": [
    { username: "ClassicHorrorFan", content: "Spielberg's fingerprints are all over this and I mean that entirely as a compliment. The suburban setting makes the supernatural intrusion feel genuinely threatening to something real." },
    { username: "SlasherStan", content: "The clown scene. Enough said. The clown scene. That thing ruined clowns for an entire generation and the film deserves credit for that achievement." },
    { username: "HorrorVaultPod", content: "Tobe Hooper directing a Spielberg production is a fascinating collision of sensibilities. The film is warmer than either filmmaker's usual work and more frightening for it." },
    { username: "ElevatedHorrorHead", content: "What's really scary here isn't the ghosts — it's the mundanity of the suburban family being the target. It could be anyone. It could be your house." },
  ],
  "carrie": [
    { username: "ClassicHorrorFan", content: "De Palma's split-screen finale is one of cinema's great formal experiments put to horrifying use. Sissy Spacek's performance is extraordinary — she's completely believable as a social outcast and an agent of destruction." },
    { username: "ScreenQueenReviews", content: "The bullying scenes are genuinely upsetting in a way the supernatural elements almost aren't. The horror is rooted in real social cruelty." },
    { username: "ElevatedHorrorHead", content: "King's first published novel adapted into one of his best adaptations. The prom scene is cinema at its most formally operatic." },
    { username: "SlasherStan", content: "The bucket of blood is the best-setup payoff in horror history. Everything in the first hour exists to make that moment land. It lands like a freight train." },
  ],
  "jaws": [
    { username: "ClassicHorrorFan", content: "The film that invented the summer blockbuster also happens to be a masterclass in horror. The shark barely appears and it's terrifying. Spielberg understood that imagination is more frightening than any effect." },
    { username: "HorrorVaultPod", content: "Three of the greatest character actors in American cinema stuck on a boat together. The Indianapolis scene alone is worth the runtime. Quint is one of the great American characters." },
    { username: "ElevatedHorrorHead", content: "You'll never look at the ocean the same way. That's the measure of great horror — it changes how you experience the world." },
    { username: "SlasherStan", content: "The chief reveals the scar. Quint shows his. The greatest scene in any blockbuster ever made and it's a horror film doing it." },
  ],
  "texas chain saw massacre": [
    { username: "ClassicHorrorFan", content: "Hooper made this film feel like a genuine snuff film. The 16mm grain, the relentless Texas heat, the family dinner scene — one of the most uncomfortable viewing experiences in cinema." },
    { username: "SlasherStan", content: "Leatherface is horror's original human monster. No motivation, no backstory, no mercy. Just a family and their chainsaw in the Texas summer. Unmatched raw terror." },
    { username: "HorrorVaultPod", content: "Almost nothing is shown, everything is felt. There's remarkably little actual violence on screen but the implication of it is suffocating for the entire runtime." },
    { username: "ElevatedHorrorHead", content: "A document of post-Vietnam American anxiety as much as a horror film. The family are veterans of a different kind of war." },
  ],
  "hellraiser": [
    { username: "ClassicHorrorFan", content: "Clive Barker brought a transgressive, literary intelligence to horror that was completely unlike anything before it. Pinhead is the genre's most genuinely philosophical monster." },
    { username: "SlasherStan", content: "The practical effects and creature design are extraordinary for 1987. The cenobites are legitimately unsettling — they feel like they come from somewhere real." },
    { username: "HorrorVaultPod", content: "The box. The blood. The hooks. Barker created an entire cosmology out of sadomasochism and theology and somehow made it work as a horror film." },
    { username: "ElevatedHorrorHead", content: "Unlike any other horror film before or since. Barker was writing about the relationship between pleasure and pain and using the genre to say something genuinely transgressive." },
  ],
  "candyman": [
    { username: "ClassicHorrorFan", content: "Bernard Rose adapted Clive Barker and created something that explores race in America with genuine intelligence and horror. Tony Todd is magnetic and terrifying." },
    { username: "ScreenQueenReviews", content: "The Cabrini-Green setting isn't just backdrop — it's argument. The film is about what gets gentrified and what gets erased. Decades ahead of the conversation." },
    { username: "HorrorVaultPod", content: "Philip Glass's score is one of the greatest horror soundtracks ever recorded. The film is inseparable from its music." },
    { username: "ElevatedHorrorHead", content: "The most intelligent mainstream horror film about American race relations until Get Out. These two films should be watched together." },
  ],
  "blair witch project": [
    { username: "ClassicHorrorFan", content: "You had to experience it in 1999 to understand what it did to audiences. The found footage genre begins here. Nothing that followed matched this one's specific, relentless dread." },
    { username: "SlasherStan", content: "People call this boring. Those people watched it knowing it was fake. In 1999, in a dark theater, with half the audience unsure if it was real, it was genuinely terrifying." },
    { username: "HorrorVaultPod", content: "Shot for sixty thousand dollars and grossed two hundred and fifty million worldwide. The most profitable independent film ever made and it's a legitimately great horror film." },
    { username: "ElevatedHorrorHead", content: "The final minute is one of cinema's great horror images. Myrick and Sánchez understood exactly where to cut to. Heather Donahue's confession monologue still gets me." },
  ],
  "se7en": [
    { username: "ClassicHorrorFan", content: "Fincher's masterpiece doesn't call itself horror but every bone in its body is horror. The box. The ending. The decision Somerset makes. No film has a better last ten minutes." },
    { username: "ScreenQueenReviews", content: "What's in the box has entered the cultural vocabulary permanently. That's the measure of truly great horror — it doesn't leave." },
    { username: "HorrorVaultPod", content: "Two of the greatest performances of the nineties — Freeman and Pitt — playing off each other in Fincher's ashen, rain-soaked nightmare. The seven sins as serial killer motivation is still the best horror premise of the decade." },
    { username: "ElevatedHorrorHead", content: "The victim of the sloth sin. The sewing. The studio pushed back on the ending. Fincher refused to change it. The studio was wrong." },
  ],
  "it": [
    { username: "SlasherStan", content: "Bill Skarsgård's Pennywise is alien and wrong in ways the original couldn't attempt. The Losers Club dynamic is what carries the whole film." },
    { username: "HorrorVaultPod", content: "Nostalgia-flavored horror done properly. Skarsgård's Pennywise doesn't rely on humor — just pure wrongness." },
    { username: "ClassicHorrorFan", content: "Surprisingly faithful adaptation that improves on several of King's ideas. Sets up the sequel better than the sequel ultimately deserved." },
    { username: "ElevatedHorrorHead", content: "The library scene is great. The pharmacist scene is great. The film knows how to build a monster." },
  ],
  "us": [
    { username: "ElevatedHorrorHead", content: "Peele swings for the fences and mostly connects. Lupita Nyong'o gives two extraordinary performances simultaneously. The scissors are iconic." },
    { username: "HorrorVaultPod", content: "Messier than Get Out but considerably more ambitious. The mythology rewards multiple viewings. The final act revelation recontextualizes everything." },
    { username: "ScreenQueenReviews", content: "Lupita Nyong'o should have been in every awards conversation. The Tethered movement choreography I haven't been able to get out of my head." },
    { username: "SlasherStan", content: "The home invasion sequence in the first act is as tense as anything I've seen in the last ten years of horror. Peele is the real deal." },
  ],
  "28 days later": [
    { username: "ElevatedHorrorHead", content: "Boyle and Garland redefined the zombie genre for a generation. The empty London sequence is still one of the most striking images in modern horror." },
    { username: "ClassicHorrorFan", content: "The rage zombies were controversial when this came out. Now they're ubiquitous. This is the film that invented them. A genuine game-changer for the genre." },
    { username: "HorrorVaultPod", content: "The third act shift when the real threat reveals itself is one of horror's great structural moves. Selena is one of the genre's great survivors." },
    { username: "SlasherStan", content: "Fast zombies changed everything. Argue with the walls." },
  ],
  "the babadook": [
    { username: "ElevatedHorrorHead", content: "Kent's debut is a masterwork of grief rendered as horror. Essie Davis gives everything in a role that required her to go to genuinely dark places." },
    { username: "ScreenQueenReviews", content: "The best horror metaphor since The Shining. Depression, grief, motherhood — handled with real intelligence. Australian horror cinema announced itself with this film." },
    { username: "ClassicHorrorFan", content: "The film that finally made 'elevated horror' a mainstream conversation. Deserves every word of praise it received." },
    { username: "SlasherStan", content: "Not a traditional horror film but it scared me in a way that went beyond jump scares or gore. The dread is existential." },
  ],
  "it follows": [
    { username: "ElevatedHorrorHead", content: "Mitchell creates a sustained nightmare using the simplest concept imaginable. The slow approach of the thing is somehow more terrifying than any fast-moving threat in horror history." },
    { username: "ClassicHorrorFan", content: "Shot like a John Carpenter film but with distinctly modern anxieties. Maika Monroe is excellent. The beach ending is haunting in ways I still can't fully articulate." },
    { username: "SlasherStan", content: "The most original horror concept in decades. The slow moving threat is brilliant because your eye can never rest on any background figure." },
    { username: "HorrorVaultPod", content: "The score by Disasterpeace is the best horror soundtrack since the 1980s. Richie Watanabe's cinematography creates suburban Ohio as a genuinely threatening space." },
  ],
  "annihilation": [
    { username: "ElevatedHorrorHead", content: "Garland adapts the unadaptable and makes something that has no right to work. The lighthouse sequence is the most disturbing thing I've seen in a theater in years." },
    { username: "HorrorVaultPod", content: "Deliberately opaque in the best possible way. The bear scene is the scene of 2018 for horror full stop. Uncompromising cinema." },
    { username: "ScreenQueenReviews", content: "Five extraordinary performances from five extraordinary actresses. Garland trusted his cast completely and they delivered everything." },
    { username: "SlasherStan", content: "I've watched the bear scene at least fifteen times. The sound design in that sequence is the most disturbing thing committed to film in the last decade." },
  ],
  "the fly": [
    { username: "ClassicHorrorFan", content: "Cronenberg's body horror masterpiece. Goldblum's performance tracks the psychological decay perfectly alongside the physical. The most emotionally devastating horror film of the 80s." },
    { username: "SlasherStan", content: "The practical effects are astounding even now. The teleportation scene is still nauseating in the best possible way." },
    { username: "HorrorVaultPod", content: "An AIDS allegory that works simultaneously as a love story, a body horror film, and a tragedy. The triple function is almost miraculous." },
    { username: "ElevatedHorrorHead", content: "Geena Davis in the second half of this film should be in every conversation about great horror performances. She's the emotional center while Goldblum does the transformation." },
  ],
  "suspiria": [
    { username: "ClassicHorrorFan", content: "Argento's color palette turns a straightforward thriller into something closer to a nightmare you can walk around in. Goblin's score is the greatest horror soundtrack ever recorded." },
    { username: "ElevatedHorrorHead", content: "Pure audiovisual cinema. The plot barely matters — Argento is painting with sound and light. The wire death in the first fifteen minutes announces exactly what kind of film this is going to be." },
    { username: "HorrorVaultPod", content: "If you can watch this on 35mm at a revival theater, do it. The Technicolor process creates colors that digital genuinely cannot reproduce. Essential horror cinema." },
    { username: "ScreenQueenReviews", content: "Technically a proto-slasher dressed in the most extraordinary visual clothing imaginable. One of the most beautiful films ever made about something very ugly." },
  ],
  "stranger things": [
    { username: "ElevatedHorrorHead", content: "Season 1 is a perfect horror story wrapped in Spielberg nostalgia. The Upside Down remains one of television's most original horror concepts." },
    { username: "SlasherStan", content: "Vecna is the show's best villain by a considerable margin. The Kate Bush scene in Season 4 is one of the greatest moments in TV history, horror or otherwise." },
    { username: "HorrorVaultPod", content: "Started as lean, genuinely scary mystery television and became something bigger and messier. The first season is as good as TV horror gets." },
    { username: "ClassicHorrorFan", content: "The show understands 80s horror better than most people who actually lived through it. The Demogorgon reveal in episode one is still great television." },
  ],
  "haunting of hill house": [
    { username: "ElevatedHorrorHead", content: "Flanagan understood that grief is horror's greatest subject. The Bent Neck Lady twist is devastating. Watched the whole thing in a single night and couldn't sleep after." },
    { username: "ScreenQueenReviews", content: "Episode 6 — Two Storms — is one of the great episodes of television. The apparent long take across two timelines simultaneously. This show broke me." },
    { username: "HorrorVaultPod", content: "Flanagan hid 21 ghosts in the background of scenes throughout the series. The show rewards obsessive rewatching in a way almost nothing else does." },
    { username: "ClassicHorrorFan", content: "The best Stephen King adaptation that isn't actually based on a Stephen King novel. Captures the essence of the book better than a literal adaptation ever could." },
  ],
  "midnight mass": [
    { username: "ElevatedHorrorHead", content: "Flanagan's most personal work. The long monologues that other directors would cut are exactly what makes this special. It's about addiction and faith as much as vampires." },
    { username: "ClassicHorrorFan", content: "The beach fire scene between Zach Gilford and Kate Siegel goes for seven minutes and I would have watched it for seven hours. Extraordinary writing." },
    { username: "ScreenQueenReviews", content: "Samantha Sloyan's Bev Keane is the most chilling TV villain in years. She's horrifying because she's completely real. Religious fanaticism rendered without caricature." },
    { username: "HorrorVaultPod", content: "The sermon scenes should not work in a horror TV show. They work completely. Hamish Linklater's Father Paul is one of the most complex characters in recent television." },
  ],
  "american horror story": [
    { username: "SlasherStan", content: "Asylum is the best season of horror television ever produced. The first five episodes are relentless. Jessica Lange gives the performance of a career in this season." },
    { username: "HorrorVaultPod", content: "Wildly inconsistent across seasons but when it works — Murder House, Asylum, Coven — it really works. Murphy's ambition overrides his attention span but the highs are exceptional." },
    { username: "ClassicHorrorFan", content: "Murder House Season 1 is genuinely scary suburban horror. Asylum is almost too much. Coven is camp perfection. Skip most of what comes after Freak Show and you'll be fine." },
    { username: "ScreenQueenReviews", content: "The three Jessica Lange seasons are essential television regardless of genre. She commands every scene she's in with complete authority." },
  ],
  "the walking dead": [
    { username: "SlasherStan", content: "Season 1 is near-perfect television. The tank in Atlanta, the CDC, the farm — Darabont made something genuinely special before AMC took it away from him." },
    { username: "ClassicHorrorFan", content: "The zombies are window dressing. It's really about whether civilization is worth preserving. The Governor is one of television's great villains." },
    { username: "HorrorVaultPod", content: "First three seasons are essential viewing for any horror fan. Deteriorates significantly after that but those early seasons rewired what was possible for horror on television." },
    { username: "ElevatedHorrorHead", content: "The pilot episode is a piece of genuinely great television. Frank Darabont shooting widescreen in Atlanta with a huge budget for the time. They never quite recaptured that opening episode." },
  ],
  "what we do in the shadows": [
    { username: "ElevatedHorrorHead", content: "The funniest horror comedy on television by a considerable margin. Laszlo and Nadja are one of TV's great couples. Guillermo's arc across the series is genuinely moving." },
    { username: "ScreenQueenReviews", content: "Horror comedy is the hardest genre. This show makes it look completely effortless. Colin Robinson alone justifies the whole enterprise." },
    { username: "HorrorVaultPod", content: "Expands the Waititi film universe in ways that surpass the original. Season 2 is almost perfect television. The Guide episode is a genuine masterpiece of the form." },
    { username: "SlasherStan", content: "Guillermo de la Cruz is one of television's greatest supporting characters. The twist about what he actually is in the later seasons is beautifully set up across years of episodes." },
  ],
  "black mirror": [
    { username: "ElevatedHorrorHead", content: "Brooker at his best — The Entire History of You, White Bear, USS Callister — is as good as any horror anthology has ever been. The dark future has never felt so specifically contemporary." },
    { username: "ScreenQueenReviews", content: "White Christmas is the definitive episode. Jon Hamm playing multiple variations on the same hollow man. One of the great TV horror hours." },
    { username: "HorrorVaultPod", content: "San Junipero is the only episode that made me cry. Bandersnatch turned the format into event television. The interactive element isn't a gimmick — it's the entire point of the episode." },
    { username: "ClassicHorrorFan", content: "Reminds me of the original Twilight Zone in the best possible way. Technology as the monster is a very old idea but Brooker finds genuinely new angles on it." },
  ],
};

// ─── Score generation ─────────────────────────────────────────────────────────

function generateScore(
  titleIndex: number,
  bias: string,
  releaseYear: number | null,
  seed: number
): number {
  const year = releaseYear ?? 2000;
  const isClassic = year < 1995;
  const isModern = year >= 2012;

  let base = Math.max(4, Math.round(8.5 - (titleIndex / 150) * 3));

  let adj = 0;
  if (bias === "classic") adj = isClassic ? 1.5 : isModern ? -1 : 0;
  if (bias === "elevated") adj = isModern ? 1 : isClassic ? -0.5 : 0;
  if (bias === "slasher") adj = [1978, 1980, 1981, 1982, 1984, 1996].includes(year) ? 1.5 : 0;
  if (bias === "critical") adj = -1;
  if (bias === "balanced") adj = 0;

  const variance = (seed % 3) - 1;
  return Math.max(1, Math.min(10, Math.round(base + adj + variance)));
}

// ─── Comment generation ───────────────────────────────────────────────────────

function pickComment(
  pool: string[],
  seed: number
): string {
  return pool[Math.abs(seed) % pool.length];
}

function getEraPool(year: number | null): string[] | null {
  const y = year ?? 2000;
  if (y < 1980) return POOL_ERA_70S;
  if (y < 1990) return POOL_ERA_80S;
  if (y < 2000) return POOL_ERA_90S;
  if (y < 2010) return POOL_ERA_2000S;
  if (y < 2020) return POOL_ERA_2010S;
  return POOL_ERA_RECENT;
}

function getCommentForUser(
  bias: string,
  titleLower: string,
  titleIndex: number,
  userIndex: number,
  releaseYear: number | null
): string {
  // Check specific title first
  const matchKey = Object.keys(TITLE_COMMENTS).find((k) => titleLower.includes(k));
  if (matchKey) {
    const specificComments = TITLE_COMMENTS[matchKey];
    const userComment = specificComments.find(
      (c) => c.username === SEED_USERS[userIndex].email.split("@")[0]
    );
    if (userComment) return userComment.content;
  }

  const year = releaseYear ?? 2000;
  const isClassic = year < 1995;
  const seed = titleIndex * 31 + userIndex * 17;
  const r = seed % 100;

  // ~25% of the time use an era-specific comment for variety
  const eraPool = getEraPool(year);
  if (eraPool && r % 4 === 0) return pickComment(eraPool, seed + 5);

  // Weighted pool selection by persona
  if (bias === "classic") {
    if (isClassic) {
      if (r < 50) return pickComment(POOL_ENTHUSIASTIC, seed);
      if (r < 80) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
      return pickComment(POOL_MIXED, seed + 2);
    } else {
      if (r < 30) return pickComment(POOL_ENTHUSIASTIC, seed);
      if (r < 55) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
      if (r < 75) return pickComment(POOL_MIXED, seed + 2);
      if (r < 90) return pickComment(POOL_DISAPPOINTED, seed + 3);
      return pickComment(POOL_CONTRARIAN, seed + 4);
    }
  }
  if (bias === "elevated") {
    if (r < 40) return pickComment(POOL_ENTHUSIASTIC, seed);
    if (r < 65) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
    if (r < 85) return pickComment(POOL_MIXED, seed + 2);
    return pickComment(POOL_CONTRARIAN, seed + 3);
  }
  if (bias === "slasher") {
    if (r < 45) return pickComment(POOL_ENTHUSIASTIC, seed);
    if (r < 65) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
    if (r < 80) return pickComment(POOL_MIXED, seed + 2);
    if (r < 90) return pickComment(POOL_CONTRARIAN, seed + 3);
    return pickComment(POOL_DISAPPOINTED, seed + 4);
  }
  if (bias === "critical") {
    if (r < 20) return pickComment(POOL_ENTHUSIASTIC, seed);
    if (r < 40) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
    if (r < 60) return pickComment(POOL_MIXED, seed + 2);
    if (r < 80) return pickComment(POOL_DISAPPOINTED, seed + 3);
    return pickComment(POOL_CONTRARIAN, seed + 4);
  }
  // balanced
  if (r < 35) return pickComment(POOL_ENTHUSIASTIC, seed);
  if (r < 60) return pickComment(POOL_MEASURED_POSITIVE, seed + 1);
  if (r < 80) return pickComment(POOL_MIXED, seed + 2);
  if (r < 90) return pickComment(POOL_DISAPPOINTED, seed + 3);
  return pickComment(POOL_CONTRARIAN, seed + 4);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 1. Create or retrieve seed users
  const userIds: Record<string, string> = {};
  for (const u of SEED_USERS) {
    const username = u.email.split("@")[0];
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      userIds[u.bias] = existing.id;
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: "Sp00kyD00kie!seed",
      email_confirm: true,
    });
    if (error || !data.user) continue;
    userIds[u.bias] = data.user.id;
    await supabase.from("profiles").update({ username }).eq("id", data.user.id);
  }

  // 2. Fetch ALL titles in pages (Supabase REST caps at 1000 rows per request)
  const allTitles: { id: string; title: string; release_year: number | null }[] = [];
  for (const mediaType of ["movie", "tv"] as const) {
    let from = 0;
    while (true) {
      const { data } = await supabase
        .from("titles")
        .select("id, title, release_year")
        .eq("media_type", mediaType)
        .order("critic_score", { ascending: false })
        .range(from, from + 499);
      if (!data?.length) break;
      allTitles.push(...data);
      if (data.length < 500) break;
      from += 500;
    }
  }

  // 3. Build ratings payload — every user rates every title
  const ratingsPayload: { user_id: string; title_id: string; score: number }[] = [];
  for (const [i, title] of allTitles.entries()) {
    for (const [j, u] of SEED_USERS.entries()) {
      const uid = userIds[u.bias];
      if (!uid) continue;
      ratingsPayload.push({
        user_id: uid,
        title_id: title.id,
        score: generateScore(i, u.bias, title.release_year, i * 7 + j * 13),
      });
    }
  }

  // 4. Build comments — 2-3 comments per title
  const commentsPayload: {
    user_id: string;
    title_id: string;
    content: string;
    parent_id: null;
  }[] = [];

  // First delete existing seed comments to avoid duplicates on re-run
  const seedUserIds = Object.values(userIds);
  if (seedUserIds.length > 0) {
    await supabase.from("comments").delete().in("user_id", seedUserIds);
    await supabase.from("ratings").delete().in("user_id", seedUserIds);
  }

  for (const [i, title] of allTitles.entries()) {
    const titleLower = title.title.toLowerCase();
    // Each title gets comments from 2-3 users (deterministic selection)
    const commentingUsers = SEED_USERS.filter((_, j) => (i + j) % 3 !== 0);
    for (const [j, u] of commentingUsers.entries()) {
      const uid = userIds[u.bias];
      if (!uid) continue;
      const content = getCommentForUser(u.bias, titleLower, i, SEED_USERS.indexOf(u), title.release_year);
      commentsPayload.push({ user_id: uid, title_id: title.id, content, parent_id: null });
    }
  }

  // 5. Upsert ratings in batches
  let ratingsInserted = 0;
  for (let i = 0; i < ratingsPayload.length; i += 200) {
    const batch = ratingsPayload.slice(i, i + 200);
    const { count } = await supabase.from("ratings").upsert(batch, {
      onConflict: "user_id,title_id",
      count: "exact",
    });
    ratingsInserted += count ?? batch.length;
  }

  // 6. Insert comments in batches
  let commentsInserted = 0;
  for (let i = 0; i < commentsPayload.length; i += 100) {
    const batch = commentsPayload.slice(i, i + 100);
    const { count } = await supabase.from("comments").insert(batch, { count: "exact" });
    commentsInserted += count ?? 0;
  }

  return NextResponse.json({
    success: true,
    users: Object.keys(userIds).length,
    titlesProcessed: allTitles.length,
    ratingsInserted,
    commentsInserted,
  });
}
