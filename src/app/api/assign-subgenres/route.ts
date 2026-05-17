import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// â”€â”€â”€ Hardcoded MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These take precedence over TMDB keyword inference.
type E = { t: string; y?: number; s: string[] };

const MAP: E[] = [
  // â”€â”€ Built from CONTENT_POLICY.md â€” all multi-genre tagging per policy â”€â”€â”€â”€â”€â”€â”€â”€
  // SLASHER
  { t: "halloween", y: 1978, s: ["Slasher"] }, { t: "halloween ii", y: 1981, s: ["Slasher"] },
  { t: "halloween iii: season of the witch", s: ["Slasher"] }, { t: "halloween 4: the return of michael myers", s: ["Slasher"] },
  { t: "halloween h20: 20 years later", s: ["Slasher"] }, { t: "halloween", y: 2018, s: ["Slasher"] },
  { t: "halloween kills", s: ["Slasher"] }, { t: "halloween ends", s: ["Slasher"] },
  { t: "a nightmare on elm street", y: 1984, s: ["Slasher", "Supernatural"] }, { t: "a nightmare on elm street 2: freddy's revenge", s: ["Slasher", "Supernatural"] },
  { t: "a nightmare on elm street 3: dream warriors", s: ["Slasher", "Supernatural"] }, { t: "a nightmare on elm street 4: the dream master", s: ["Slasher", "Supernatural"] },
  { t: "wes craven's new nightmare", s: ["Slasher", "Supernatural"] }, { t: "freddy vs. jason", s: ["Slasher", "Supernatural"] },
  { t: "friday the 13th", y: 1980, s: ["Slasher"] }, { t: "friday the 13th part 2", s: ["Slasher"] },
  { t: "friday the 13th part iii", s: ["Slasher"] }, { t: "friday the 13th: the final chapter", s: ["Slasher"] },
  { t: "friday the 13th: a new beginning", s: ["Slasher"] }, { t: "jason lives: friday the 13th part vi", s: ["Slasher"] },
  { t: "friday the 13th part vii: the new blood", s: ["Slasher"] }, { t: "friday the 13th part viii: jason takes manhattan", s: ["Slasher"] },
  { t: "jason goes to hell: the final friday", s: ["Slasher"] }, { t: "jason x", s: ["Slasher"] },
  { t: "friday the 13th", y: 2009, s: ["Slasher"] },
  { t: "scream", y: 1996, s: ["Slasher"] }, { t: "scream 2", s: ["Slasher"] }, { t: "scream 3", s: ["Slasher"] },
  { t: "scream 4", s: ["Slasher"] }, { t: "scream", y: 2022, s: ["Slasher"] }, { t: "scream vi", s: ["Slasher"] },
  { t: "child's play", y: 1988, s: ["Slasher", "Supernatural"] }, { t: "child's play 2", s: ["Slasher", "Supernatural"] },
  { t: "bride of chucky", s: ["Slasher", "Supernatural", "Comedy Horror"] }, { t: "seed of chucky", s: ["Slasher", "Supernatural", "Comedy Horror"] },
  { t: "curse of chucky", s: ["Slasher", "Supernatural"] }, { t: "cult of chucky", s: ["Slasher", "Supernatural"] },
  { t: "candyman", y: 1992, s: ["Supernatural", "Slasher"] }, { t: "candyman", y: 2021, s: ["Supernatural", "Slasher"] },
  { t: "my bloody valentine", y: 1981, s: ["Slasher"] }, { t: "my bloody valentine 3d", s: ["Slasher"] },
  { t: "black christmas", y: 1974, s: ["Slasher"] }, { t: "black christmas", y: 2006, s: ["Slasher"] },
  { t: "prom night", y: 1980, s: ["Slasher"] }, { t: "terror train", y: 1980, s: ["Slasher"] },
  { t: "the burning", y: 1981, s: ["Slasher"] }, { t: "sleepaway camp", y: 1983, s: ["Slasher"] },
  { t: "sleepaway camp ii: unhappy campers", s: ["Slasher"] }, { t: "sleepaway camp iii: teenage wasteland", s: ["Slasher"] },
  { t: "slumber party massacre", y: 1982, s: ["Slasher"] }, { t: "the house on sorority row", s: ["Slasher"] },
  { t: "happy birthday to me", s: ["Slasher"] }, { t: "pieces", y: 1982, s: ["Slasher"] },
  { t: "madman", y: 1982, s: ["Slasher"] }, { t: "the funhouse", y: 1981, s: ["Slasher"] },
  { t: "maniac", y: 1980, s: ["Slasher"] }, { t: "silent night, deadly night", s: ["Slasher"] },
  { t: "silent night deadly night", s: ["Slasher"] }, { t: "graduation day", y: 1981, s: ["Slasher"] },
  { t: "final exam", y: 1981, s: ["Slasher"] }, { t: "he knows you're alone", s: ["Slasher"] },
  { t: "the dorm that dripped blood", s: ["Slasher"] }, { t: "curtains", y: 1983, s: ["Slasher"] },
  { t: "offerings", y: 1989, s: ["Slasher"] }, { t: "hatchet", y: 2006, s: ["Slasher"] },
  { t: "hatchet ii", s: ["Slasher"] }, { t: "hatchet iii", s: ["Slasher"] }, { t: "victor crowley", s: ["Slasher"] },
  { t: "laid to rest", y: 2009, s: ["Slasher"] }, { t: "chromeskull: laid to rest 2", s: ["Slasher"] },
  { t: "wrong turn", y: 2003, s: ["Slasher", "Creature Feature"] }, { t: "wrong turn 2: dead end", s: ["Slasher", "Creature Feature"] },
  { t: "saw", y: 2004, s: ["Slasher", "Psychological"] }, { t: "saw ii", s: ["Slasher", "Psychological"] },
  { t: "saw iii", s: ["Slasher", "Psychological"] }, { t: "saw iv", s: ["Slasher", "Psychological"] },
  { t: "saw v", s: ["Slasher", "Psychological"] }, { t: "saw vi", s: ["Slasher", "Psychological"] },
  { t: "saw 3d", s: ["Slasher", "Psychological"] }, { t: "jigsaw", y: 2017, s: ["Slasher", "Psychological"] },
  { t: "spiral: from the book of saw", s: ["Slasher", "Psychological"] }, { t: "saw x", s: ["Slasher", "Psychological"] },
  { t: "urban legend", y: 1998, s: ["Slasher"] }, { t: "i know what you did last summer", s: ["Slasher"] },
  { t: "i still know what you did last summer", s: ["Slasher"] }, { t: "valentine", y: 2001, s: ["Slasher"] },
  { t: "jeepers creepers", y: 2001, s: ["Slasher", "Supernatural"] }, { t: "jeepers creepers 2", s: ["Slasher", "Supernatural"] },
  { t: "the strangers", y: 2008, s: ["Slasher"] }, { t: "the strangers: prey at night", s: ["Slasher"] },
  { t: "you're next", s: ["Slasher"] }, { t: "the purge", y: 2013, s: ["Slasher", "Sci-Fi Horror"] },
  { t: "the purge: anarchy", s: ["Slasher", "Sci-Fi Horror"] }, { t: "the first purge", s: ["Slasher", "Sci-Fi Horror"] },
  { t: "the forever purge", s: ["Slasher", "Sci-Fi Horror"] }, { t: "ready or not", y: 2019, s: ["Slasher", "Psychological"] },
  { t: "terrifier", y: 2016, s: ["Slasher"] }, { t: "terrifier 2", s: ["Slasher"] }, { t: "terrifier 3", s: ["Slasher"] },
  { t: "x", y: 2022, s: ["Slasher"] }, { t: "pearl", y: 2022, s: ["Slasher", "Psychological"] }, { t: "maxxxine", s: ["Slasher"] },
  { t: "bone tomahawk", s: ["Slasher", "Creature Feature"] }, { t: "green room", y: 2015, s: ["Slasher", "Psychological"] },
  { t: "it follows", s: ["Supernatural", "Psychological"] }, { t: "the guest", y: 2014, s: ["Slasher", "Psychological"] },
  { t: "eden lake", s: ["Slasher", "Psychological"] }, { t: "wolf creek", y: 2005, s: ["Slasher"] },
  { t: "wolf creek 2", s: ["Slasher"] }, { t: "the loved ones", y: 2009, s: ["Slasher", "Psychological"] },
  { t: "severance", y: 2006, s: ["Slasher", "Comedy Horror"] },
  { t: "high tension", s: ["Slasher", "Psychological"] }, { t: "inside", y: 2007, s: ["Body Horror", "Slasher"] },
  { t: "Ã  l'intÃ©rieur", s: ["Body Horror", "Slasher"] }, { t: "ils", y: 2006, s: ["Slasher", "Psychological"] },
  { t: "american psycho", s: ["Psychological", "Slasher"] }, { t: "the silence of the lambs", s: ["Psychological", "Slasher"] },
  { t: "manhunter", y: 1986, s: ["Psychological", "Slasher"] }, { t: "red dragon", y: 2002, s: ["Psychological", "Slasher"] },
  { t: "hannibal", y: 2001, s: ["Psychological", "Slasher"] }, { t: "se7en", s: ["Psychological", "Slasher"] },
  { t: "wolf creek 2", s: ["Slasher"] },
  // SUPERNATURAL
  { t: "the exorcist", y: 1973, s: ["Supernatural"] }, { t: "exorcist ii: the heretic", s: ["Supernatural"] },
  { t: "the exorcist iii", s: ["Supernatural"] }, { t: "the exorcist: believer", s: ["Supernatural"] },
  { t: "poltergeist", y: 1982, s: ["Supernatural"] }, { t: "poltergeist ii: the other side", s: ["Supernatural"] },
  { t: "poltergeist iii", s: ["Supernatural"] }, { t: "the amityville horror", y: 1979, s: ["Supernatural"] },
  { t: "amityville ii: the possession", s: ["Supernatural"] }, { t: "the amityville horror", y: 2005, s: ["Supernatural"] },
  { t: "the conjuring", y: 2013, s: ["Supernatural", "Psychological"] }, { t: "the conjuring 2", s: ["Supernatural", "Psychological"] },
  { t: "the conjuring: the devil made me do it", s: ["Supernatural"] },
  { t: "annabelle", y: 2014, s: ["Supernatural"] }, { t: "annabelle: creation", s: ["Supernatural"] }, { t: "annabelle comes home", s: ["Supernatural"] },
  { t: "the nun", y: 2018, s: ["Supernatural"] }, { t: "the nun ii", s: ["Supernatural"] },
  { t: "insidious", y: 2010, s: ["Supernatural", "Psychological"] }, { t: "insidious: chapter 2", s: ["Supernatural", "Psychological"] },
  { t: "insidious: chapter 3", s: ["Supernatural"] }, { t: "insidious: the last key", s: ["Supernatural"] }, { t: "insidious: the red door", s: ["Supernatural"] },
  { t: "sinister", y: 2012, s: ["Supernatural", "Found Footage", "Psychological"] }, { t: "sinister 2", s: ["Supernatural"] },
  { t: "the ring", y: 2002, s: ["Supernatural", "Psychological"] }, { t: "the ring two", s: ["Supernatural"] }, { t: "rings", y: 2017, s: ["Supernatural"] },
  { t: "the grudge", y: 2004, s: ["Supernatural", "Psychological"] }, { t: "the grudge 2", s: ["Supernatural"] },
  { t: "drag me to hell", s: ["Supernatural", "Comedy Horror"] },
  { t: "hereditary", s: ["Supernatural", "Psychological", "Folk Horror"] }, { t: "midsommar", s: ["Folk Horror", "Psychological"] },
  { t: "the witch", y: 2015, s: ["Folk Horror", "Psychological", "Supernatural"] }, { t: "apostle", y: 2018, s: ["Folk Horror", "Body Horror"] },
  { t: "rosemary's baby", s: ["Supernatural", "Psychological"] },
  { t: "the omen", y: 1976, s: ["Supernatural"] }, { t: "damien: omen ii", s: ["Supernatural"] }, { t: "the final conflict", s: ["Supernatural"] }, { t: "the omen", y: 2006, s: ["Supernatural"] },
  { t: "carrie", y: 1976, s: ["Supernatural", "Slasher"] }, { t: "carrie", y: 2013, s: ["Supernatural", "Slasher"] }, { t: "the rage: carrie 2", s: ["Supernatural", "Slasher"] },
  { t: "christine", y: 1983, s: ["Supernatural"] }, { t: "firestarter", y: 1984, s: ["Supernatural"] },
  { t: "the dead zone", s: ["Supernatural", "Psychological"] }, { t: "needful things", s: ["Supernatural"] },
  { t: "thinner", y: 1996, s: ["Supernatural"] }, { t: "dolores claiborne", s: ["Psychological"] },
  { t: "the shining", s: ["Supernatural", "Psychological"] }, { t: "doctor sleep", s: ["Supernatural", "Psychological"] },
  { t: "pet sematary", y: 1989, s: ["Supernatural", "Zombie"] }, { t: "pet sematary", y: 2019, s: ["Supernatural", "Zombie"] },
  { t: "it", y: 1990, s: ["Supernatural", "Creature Feature"] }, { t: "it chapter one", s: ["Supernatural", "Creature Feature"] }, { t: "it chapter two", s: ["Supernatural", "Creature Feature"] },
  { t: "misery", s: ["Psychological"] }, { t: "gerald's game", s: ["Psychological"] },
  { t: "1408", s: ["Supernatural", "Psychological"] }, { t: "dreamcatcher", s: ["Supernatural"] },
  { t: "the mist", y: 2007, s: ["Creature Feature", "Sci-Fi Horror", "Psychological"] },
  { t: "creepshow", y: 1982, s: ["Supernatural", "Comedy Horror"] }, { t: "creepshow 2", s: ["Supernatural"] },
  { t: "trick 'r treat", s: ["Supernatural", "Comedy Horror"] }, { t: "the houses october built", s: ["Found Footage", "Slasher"] },
  { t: "paranormal activity", y: 2007, s: ["Found Footage", "Supernatural"] }, { t: "paranormal activity 2", s: ["Found Footage", "Supernatural"] },
  { t: "paranormal activity 3", s: ["Found Footage", "Supernatural"] }, { t: "paranormal activity 4", s: ["Found Footage", "Supernatural"] },
  { t: "paranormal activity: the marked ones", s: ["Found Footage", "Supernatural"] }, { t: "paranormal activity: the ghost dimension", s: ["Found Footage", "Supernatural"] },
  { t: "the haunting", y: 1999, s: ["Supernatural"] }, { t: "the others", y: 2001, s: ["Supernatural", "Psychological"] },
  { t: "the orphanage", s: ["Supernatural", "Psychological"] }, { t: "mama", y: 2013, s: ["Supernatural"] },
  { t: "oculus", s: ["Supernatural", "Psychological"] }, { t: "ouija", y: 2014, s: ["Supernatural"] }, { t: "ouija: origin of evil", s: ["Supernatural"] },
  { t: "the boy", y: 2016, s: ["Supernatural", "Psychological"] }, { t: "brahms: the boy ii", s: ["Supernatural", "Psychological"] },
  { t: "the autopsy of jane doe", s: ["Supernatural", "Body Horror"] }, { t: "a ghost story", y: 2017, s: ["Supernatural", "Psychological"] },
  { t: "his house", y: 2020, s: ["Supernatural", "Folk Horror", "Psychological"] },
  { t: "veronica", y: 2017, s: ["Supernatural"] }, { t: "the babadook", s: ["Supernatural", "Psychological"] },
  { t: "lights out", y: 2016, s: ["Supernatural"] }, { t: "before i wake", s: ["Supernatural", "Psychological"] },
  { t: "hush", y: 2016, s: ["Slasher", "Psychological"] }, { t: "get out", s: ["Psychological", "Supernatural"] },
  { t: "us", y: 2019, s: ["Supernatural", "Psychological"] }, { t: "nope", s: ["Creature Feature", "Sci-Fi Horror"] },
  { t: "barbarian", y: 2022, s: ["Supernatural"] }, { t: "talk to me", y: 2022, s: ["Supernatural"] },
  { t: "the evil dead", y: 1981, s: ["Supernatural"] }, { t: "evil dead ii", s: ["Supernatural", "Comedy Horror"] },
  { t: "army of darkness", s: ["Supernatural", "Comedy Horror"] }, { t: "evil dead", y: 2013, s: ["Supernatural", "Body Horror"] },
  { t: "evil dead rise", s: ["Supernatural", "Body Horror"] },
  { t: "the changeling", y: 1980, s: ["Supernatural"] }, { t: "burnt offerings", y: 1976, s: ["Supernatural"] },
  { t: "audrey rose", s: ["Supernatural"] }, { t: "the watcher in the woods", s: ["Supernatural"] },
  { t: "something wicked this way comes", s: ["Supernatural"] }, { t: "cat's eye", y: 1985, s: ["Supernatural"] },
  { t: "warlock", y: 1989, s: ["Supernatural"] }, { t: "warlock: the armageddon", s: ["Supernatural"] },
  { t: "wishmaster", y: 1997, s: ["Supernatural"] }, { t: "wishmaster 2: evil never dies", s: ["Supernatural"] },
  { t: "shocker", y: 1989, s: ["Supernatural"] }, { t: "the first power", s: ["Supernatural"] },
  { t: "in the mouth of madness", s: ["Psychological", "Supernatural"] }, { t: "prince of darkness", s: ["Supernatural"] },
  { t: "wolfen", y: 1981, s: ["Creature Feature", "Supernatural"] }, { t: "night of the demons", y: 1988, s: ["Supernatural"] },
  { t: "demon knight", s: ["Supernatural"] }, { t: "haunt", y: 2019, s: ["Slasher", "Folk Horror"] },
  { t: "under the shadow", s: ["Supernatural", "Psychological", "Folk Horror"] }, { t: "a dark song", s: ["Supernatural", "Folk Horror", "Psychological"] },
  { t: "tigers are not afraid", s: ["Supernatural", "Folk Horror"] }, { t: "the wailing", s: ["Supernatural", "Folk Horror", "Creature Feature"] },
  { t: "ringu", s: ["Supernatural", "Psychological"] }, { t: "ju-on: the grudge", s: ["Supernatural", "Psychological"] },
  { t: "dark water", y: 2002, s: ["Supernatural", "Psychological"] }, { t: "one missed call", y: 2003, s: ["Supernatural"] },
  { t: "a tale of two sisters", s: ["Psychological", "Supernatural"] },
  // CREATURE FEATURE
  { t: "the thing", y: 1982, s: ["Sci-Fi Horror", "Creature Feature", "Body Horror"] }, { t: "the thing", y: 2011, s: ["Sci-Fi Horror", "Creature Feature", "Body Horror"] },
  { t: "jaws", y: 1975, s: ["Creature Feature"] }, { t: "jaws 2", s: ["Creature Feature"] }, { t: "jaws 3-d", s: ["Creature Feature"] }, { t: "jaws: the revenge", s: ["Creature Feature"] },
  { t: "tremors", y: 1990, s: ["Creature Feature", "Comedy Horror"] }, { t: "tremors 2: aftershocks", s: ["Creature Feature", "Comedy Horror"] },
  { t: "tremors 3: back to perfection", s: ["Creature Feature", "Comedy Horror"] }, { t: "tremors 4: the legend begins", s: ["Creature Feature"] },
  { t: "tremors 5: bloodlines", s: ["Creature Feature"] }, { t: "tremors: a cold day in hell", s: ["Creature Feature"] },
  { t: "the descent", y: 2005, s: ["Creature Feature", "Psychological"] }, { t: "the descent: part 2", s: ["Creature Feature"] },
  { t: "predator", y: 1987, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "predator 2", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "predators", y: 2010, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "the predator", y: 2018, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "prey", y: 2022, s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "critters", y: 1986, s: ["Creature Feature", "Comedy Horror", "Sci-Fi Horror"] }, { t: "critters 2", s: ["Creature Feature", "Comedy Horror", "Sci-Fi Horror"] },
  { t: "gremlins", y: 1984, s: ["Creature Feature", "Comedy Horror"] }, { t: "gremlins 2: the new batch", s: ["Creature Feature", "Comedy Horror"] },
  { t: "pumpkinhead", y: 1988, s: ["Creature Feature", "Supernatural"] }, { t: "pumpkinhead ii: blood wings", s: ["Creature Feature", "Supernatural"] },
  { t: "the gate", y: 1987, s: ["Supernatural", "Creature Feature"] }, { t: "slither", y: 2006, s: ["Creature Feature", "Comedy Horror", "Zombie"] },
  { t: "the host", y: 2006, s: ["Creature Feature"] }, { t: "grabbers", y: 2012, s: ["Creature Feature", "Comedy Horror"] },
  { t: "feast", y: 2005, s: ["Creature Feature", "Comedy Horror"] }, { t: "dog soldiers", s: ["Werewolf", "Creature Feature"] },
  { t: "the ritual", s: ["Folk Horror", "Creature Feature"] }, { t: "mimic", y: 1997, s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "mimic 2", s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "mimic 3: sentinel", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "eight legged freaks", s: ["Creature Feature", "Comedy Horror"] }, { t: "arachnophobia", s: ["Creature Feature", "Comedy Horror"] },
  { t: "kingdom of the spiders", s: ["Creature Feature"] }, { t: "splinter", y: 2008, s: ["Creature Feature"] },
  { t: "godzilla", y: 2014, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "kong: skull island", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "godzilla: king of the monsters", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "the blob", y: 1988, s: ["Creature Feature", "Sci-Fi Horror", "Body Horror"] },
  { t: "leviathan", y: 1989, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "deepstar six", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "below", y: 2002, s: ["Sci-Fi Horror", "Supernatural", "Psychological"] }, { t: "the bay", y: 2012, s: ["Found Footage", "Sci-Fi Horror", "Creature Feature"] },
  { t: "c.h.u.d.", s: ["Creature Feature", "Sci-Fi Horror"] }, { t: "q the winged serpent", s: ["Creature Feature"] },
  { t: "alligator", y: 1980, s: ["Creature Feature"] }, { t: "prophecy", y: 1979, s: ["Creature Feature", "Sci-Fi Horror"] },
  { t: "rawhead rex", s: ["Creature Feature", "Supernatural"] }, { t: "basket case", y: 1982, s: ["Creature Feature", "Body Horror"] },
  { t: "ghoulies", y: 1984, s: ["Creature Feature", "Comedy Horror"] }, { t: "troll", y: 1986, s: ["Creature Feature", "Comedy Horror"] },
  { t: "cloverfield", s: ["Found Footage", "Sci-Fi Horror", "Creature Feature"] }, { t: "underwater", y: 2020, s: ["Sci-Fi Horror", "Creature Feature"] },
  // SCI-FI HORROR
  { t: "alien", y: 1979, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "aliens", y: 1986, s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "alien 3", s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "alien resurrection", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "prometheus", y: 2012, s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "alien: covenant", s: ["Sci-Fi Horror", "Creature Feature"] }, { t: "alien: romulus", s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "the fly", y: 1986, s: ["Body Horror", "Sci-Fi Horror", "Creature Feature"] }, { t: "the fly ii", s: ["Body Horror", "Sci-Fi Horror"] },
  { t: "10 cloverfield lane", s: ["Sci-Fi Horror", "Psychological"] }, { t: "the cloverfield paradox", s: ["Sci-Fi Horror"] },
  { t: "annihilation", s: ["Sci-Fi Horror", "Body Horror", "Psychological"] }, { t: "color out of space", s: ["Sci-Fi Horror", "Body Horror", "Psychological"] },
  { t: "videodrome", s: ["Body Horror", "Psychological", "Sci-Fi Horror"] }, { t: "existenz", s: ["Sci-Fi Horror", "Body Horror", "Psychological"] },
  { t: "possessor", s: ["Sci-Fi Horror", "Body Horror", "Psychological"] }, { t: "titane", s: ["Body Horror", "Psychological", "Sci-Fi Horror"] },
  { t: "crimes of the future", y: 2022, s: ["Body Horror", "Sci-Fi Horror"] },
  { t: "scanners", s: ["Sci-Fi Horror", "Body Horror"] }, { t: "the brood", s: ["Body Horror", "Psychological", "Sci-Fi Horror"] },
  { t: "shivers", s: ["Body Horror", "Sci-Fi Horror"] }, { t: "rabid", y: 1977, s: ["Body Horror", "Sci-Fi Horror"] },
  { t: "night of the comet", s: ["Sci-Fi Horror", "Comedy Horror"] }, { t: "overlord", y: 2018, s: ["Zombie", "Sci-Fi Horror"] },
  { t: "lifeforce", s: ["Vampire", "Sci-Fi Horror"] }, { t: "daybreakers", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "priest", y: 2011, s: ["Vampire", "Sci-Fi Horror"] }, { t: "battle royale", s: ["Slasher", "Sci-Fi Horror"] },
  { t: "night of the creeps", s: ["Zombie", "Comedy Horror", "Sci-Fi Horror"] },
  { t: "the girl with all the gifts", s: ["Zombie", "Sci-Fi Horror"] }, { t: "wyrmwood: road of the dead", s: ["Zombie", "Sci-Fi Horror"] },
  { t: "wyrmwood", y: 2014, s: ["Zombie", "Sci-Fi Horror"] },
  // BODY HORROR
  { t: "naked lunch", y: 1991, s: ["Body Horror", "Psychological"] }, { t: "dead ringers", s: ["Body Horror", "Psychological"] },
  { t: "society", y: 1989, s: ["Body Horror"] }, { t: "tusk", y: 2014, s: ["Body Horror", "Psychological"] },
  { t: "contracted", y: 2013, s: ["Body Horror"] }, { t: "contracted: phase ii", s: ["Body Horror"] },
  { t: "bite", y: 2015, s: ["Body Horror"] }, { t: "starry eyes", s: ["Body Horror", "Psychological", "Folk Horror"] },
  { t: "raw", y: 2016, s: ["Body Horror", "Psychological"] }, { t: "martyrs", y: 2008, s: ["Body Horror", "Psychological"] },
  { t: "men", y: 2022, s: ["Folk Horror", "Body Horror", "Psychological"] },
  // PSYCHOLOGICAL
  { t: "black swan", s: ["Psychological"] }, { t: "repulsion", y: 1965, s: ["Psychological"] }, { t: "the tenant", y: 1976, s: ["Psychological"] },
  { t: "eyes wide shut", s: ["Psychological"] }, { t: "the sixth sense", s: ["Supernatural", "Psychological"] },
  { t: "identity", y: 2003, s: ["Psychological", "Slasher"] }, { t: "shutter island", s: ["Psychological"] },
  { t: "prisoners", y: 2013, s: ["Psychological"] }, { t: "gone girl", s: ["Psychological"] }, { t: "nightcrawler", s: ["Psychological"] },
  { t: "may", y: 2002, s: ["Psychological", "Slasher"] }, { t: "pontypool", s: ["Zombie", "Psychological"] },
  { t: "lake mungo", s: ["Found Footage", "Supernatural", "Psychological"] },
  { t: "don't breathe", y: 2016, s: ["Psychological", "Slasher"] }, { t: "don't breathe 2", s: ["Psychological", "Slasher"] },
  { t: "the invisible man", y: 2020, s: ["Psychological", "Sci-Fi Horror"] }, { t: "parasite", y: 2019, s: ["Psychological"] },
  { t: "oldboy", y: 2003, s: ["Psychological", "Slasher"] }, { t: "i saw the devil", s: ["Psychological", "Slasher"] },
  { t: "audition", y: 1999, s: ["Psychological", "Slasher"] }, { t: "session 9", s: ["Psychological"] },
  { t: "jacob's ladder", y: 1990, s: ["Psychological", "Supernatural"] },
  { t: "suspiria", y: 1977, s: ["Supernatural", "Psychological"] }, { t: "suspiria", y: 2018, s: ["Supernatural", "Psychological"] },
  { t: "baskin", s: ["Supernatural", "Body Horror", "Psychological"] },
  { t: "deep red", y: 1975, s: ["Slasher", "Psychological"] }, { t: "tenebrae", s: ["Slasher", "Psychological"] },
  { t: "opera", y: 1987, s: ["Slasher", "Psychological"] },
  // ZOMBIE
  { t: "night of the living dead", y: 1968, s: ["Zombie"] }, { t: "dawn of the dead", y: 1978, s: ["Zombie"] },
  { t: "day of the dead", y: 1985, s: ["Zombie", "Sci-Fi Horror"] }, { t: "land of the dead", s: ["Zombie"] },
  { t: "diary of the dead", s: ["Zombie", "Found Footage"] }, { t: "survival of the dead", s: ["Zombie"] },
  { t: "dawn of the dead", y: 2004, s: ["Zombie"] }, { t: "day of the dead", y: 2008, s: ["Zombie"] },
  { t: "return of the living dead", y: 1985, s: ["Zombie", "Comedy Horror", "Sci-Fi Horror"] },
  { t: "return of the living dead part ii", s: ["Zombie", "Comedy Horror"] }, { t: "return of the living dead 3", s: ["Zombie", "Body Horror"] },
  { t: "28 days later", s: ["Zombie", "Sci-Fi Horror"] }, { t: "28 weeks later", s: ["Zombie", "Sci-Fi Horror"] },
  { t: "shaun of the dead", s: ["Comedy Horror", "Zombie"] }, { t: "zombieland", s: ["Zombie", "Comedy Horror"] },
  { t: "zombieland: double tap", s: ["Zombie", "Comedy Horror"] }, { t: "world war z", s: ["Zombie", "Sci-Fi Horror"] },
  { t: "train to busan", s: ["Zombie", "Creature Feature"] }, { t: "peninsula", y: 2020, s: ["Zombie", "Sci-Fi Horror"] },
  { t: "dead snow", y: 2009, s: ["Zombie", "Comedy Horror"] }, { t: "dead snow 2: red vs. dead", s: ["Zombie", "Comedy Horror"] },
  { t: "rec", y: 2007, s: ["Found Footage", "Zombie", "Supernatural"] }, { t: "[rec]", y: 2007, s: ["Found Footage", "Zombie", "Supernatural"] },
  { t: "rec 2", s: ["Found Footage", "Zombie", "Supernatural"] }, { t: "[rec] 2", s: ["Found Footage", "Zombie", "Supernatural"] },
  { t: "rec 3: genesis", s: ["Zombie", "Supernatural", "Comedy Horror"] }, { t: "rec 4: apocalypse", s: ["Zombie", "Found Footage"] },
  { t: "quarantine", y: 2008, s: ["Found Footage", "Zombie"] }, { t: "quarantine 2: terminal", s: ["Zombie"] },
  { t: "warm bodies", s: ["Zombie", "Comedy Horror"] }, { t: "pride and prejudice and zombies", s: ["Zombie", "Comedy Horror"] },
  { t: "one cut of the dead", s: ["Zombie", "Comedy Horror", "Found Footage"] },
  { t: "the crazies", y: 1973, s: ["Zombie", "Sci-Fi Horror"] }, { t: "the crazies", y: 2010, s: ["Zombie", "Sci-Fi Horror"] },
  { t: "planet terror", s: ["Zombie", "Comedy Horror", "Sci-Fi Horror"] }, { t: "fido", y: 2006, s: ["Zombie", "Comedy Horror"] },
  { t: "dead alive", s: ["Zombie", "Comedy Horror", "Body Horror"] }, { t: "braindead", s: ["Zombie", "Comedy Horror", "Body Horror"] },
  { t: "re-animator", y: 1985, s: ["Zombie", "Comedy Horror", "Body Horror"] }, { t: "bride of re-animator", s: ["Zombie", "Comedy Horror", "Body Horror"] },
  { t: "beyond re-animator", s: ["Zombie", "Comedy Horror"] }, { t: "cargo", y: 2017, s: ["Zombie"] },
  { t: "the beyond", y: 1981, s: ["Supernatural", "Zombie"] }, { t: "city of the living dead", s: ["Supernatural", "Zombie"] },
  { t: "zombie", y: 1979, s: ["Zombie"] }, { t: "zombi 2", s: ["Zombie"] }, { t: "demons", y: 1985, s: ["Creature Feature", "Zombie"] }, { t: "demons 2", s: ["Creature Feature", "Zombie"] },
  // VAMPIRE
  { t: "dracula", y: 1979, s: ["Vampire"] }, { t: "bram stoker's dracula", s: ["Vampire"] },
  { t: "dracula 2000", s: ["Vampire"] }, { t: "dracula untold", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "the lost boys", s: ["Vampire", "Comedy Horror"] }, { t: "interview with the vampire", s: ["Vampire"] },
  { t: "queen of the damned", s: ["Vampire"] }, { t: "near dark", s: ["Vampire"] },
  { t: "salem's lot", y: 1979, s: ["Vampire", "Supernatural"] }, { t: "salem's lot", y: 2024, s: ["Vampire", "Supernatural"] },
  { t: "from dusk till dawn", y: 1996, s: ["Vampire", "Comedy Horror"] },
  { t: "from dusk till dawn 2: texas blood money", s: ["Vampire"] }, { t: "from dusk till dawn 3: the hangman's daughter", s: ["Vampire"] },
  { t: "blade", y: 1998, s: ["Vampire", "Sci-Fi Horror"] }, { t: "blade ii", s: ["Vampire", "Sci-Fi Horror"] }, { t: "blade: trinity", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "underworld", y: 2003, s: ["Vampire", "Werewolf", "Sci-Fi Horror"] }, { t: "underworld: evolution", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "underworld: rise of the lycans", s: ["Vampire", "Werewolf", "Sci-Fi Horror"] }, { t: "underworld: awakening", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "underworld: blood wars", s: ["Vampire", "Sci-Fi Horror"] },
  { t: "let the right one in", s: ["Vampire", "Psychological"] }, { t: "let me in", y: 2010, s: ["Vampire", "Psychological"] },
  { t: "only lovers left alive", s: ["Vampire", "Psychological"] }, { t: "a girl walks home alone at night", s: ["Vampire", "Psychological"] },
  { t: "what we do in the shadows", y: 2014, s: ["Vampire", "Comedy Horror"] }, { t: "byzantium", s: ["Vampire", "Psychological"] },
  { t: "shadow of the vampire", s: ["Vampire"] }, { t: "fright night", y: 1985, s: ["Vampire", "Comedy Horror"] }, { t: "fright night", y: 2011, s: ["Vampire", "Comedy Horror"] },
  { t: "innocent blood", s: ["Vampire", "Comedy Horror"] }, { t: "vampires", y: 1998, s: ["Vampire"] },
  { t: "30 days of night", s: ["Vampire"] }, { t: "stakeland", s: ["Vampire"] },
  { t: "dark shadows", y: 2012, s: ["Vampire", "Comedy Horror"] }, { t: "cronos", y: 1993, s: ["Vampire", "Supernatural"] },
  { t: "martin", y: 1977, s: ["Vampire", "Psychological"] }, { t: "the hunger", y: 1983, s: ["Vampire", "Psychological"] }, { t: "thirst", y: 2009, s: ["Vampire", "Psychological"] },
  // WEREWOLF
  { t: "an american werewolf in london", s: ["Werewolf", "Comedy Horror", "Body Horror"] }, { t: "the howling", y: 1981, s: ["Werewolf", "Body Horror"] },
  { t: "howling ii: your sister is a werewolf", s: ["Werewolf"] }, { t: "silver bullet", s: ["Werewolf", "Supernatural"] },
  { t: "teen wolf", y: 1985, s: ["Werewolf", "Comedy Horror"] }, { t: "the monster squad", s: ["Vampire", "Werewolf", "Creature Feature", "Comedy Horror"] },
  { t: "wolf", y: 1994, s: ["Werewolf", "Psychological"] },
  { t: "ginger snaps", y: 2000, s: ["Werewolf", "Body Horror", "Psychological"] }, { t: "ginger snaps 2: unleashed", s: ["Werewolf", "Body Horror"] },
  { t: "ginger snaps back: the beginning", s: ["Werewolf"] }, { t: "van helsing", y: 2004, s: ["Vampire", "Werewolf", "Creature Feature"] },
  { t: "blood and chocolate", s: ["Werewolf"] }, { t: "the wolfman", y: 2010, s: ["Werewolf", "Supernatural"] },
  { t: "wer", y: 2013, s: ["Werewolf", "Found Footage"] }, { t: "wolves", y: 2014, s: ["Werewolf"] },
  { t: "late phases", s: ["Werewolf"] }, { t: "howl", y: 2015, s: ["Werewolf", "Creature Feature"] },
  { t: "bad moon", s: ["Werewolf"] }, { t: "cursed", y: 2005, s: ["Werewolf", "Comedy Horror"] },
  { t: "wolfcop", s: ["Werewolf", "Comedy Horror"] }, { t: "another wolfcop", s: ["Werewolf", "Comedy Horror"] },
  // FOUND FOOTAGE
  { t: "the blair witch project", s: ["Found Footage", "Psychological", "Supernatural"] },
  { t: "book of shadows: blair witch 2", s: ["Found Footage", "Supernatural"] }, { t: "blair witch", y: 2016, s: ["Found Footage", "Supernatural"] },
  { t: "troll hunter", s: ["Found Footage", "Creature Feature"] }, { t: "trollhunter", s: ["Found Footage", "Creature Feature"] },
  { t: "the last exorcism", s: ["Found Footage", "Supernatural"] }, { t: "the last exorcism part ii", s: ["Supernatural"] },
  { t: "v/h/s", y: 2012, s: ["Found Footage", "Supernatural", "Slasher"] }, { t: "v/h/s/2", s: ["Found Footage", "Supernatural"] },
  { t: "v/h/s viral", s: ["Found Footage"] }, { t: "v/h/s/94", s: ["Found Footage"] }, { t: "v/h/s/99", s: ["Found Footage"] }, { t: "v/h/s/85", s: ["Found Footage"] },
  { t: "chronicle", y: 2012, s: ["Found Footage", "Sci-Fi Horror"] }, { t: "willow creek", y: 2013, s: ["Found Footage", "Creature Feature"] },
  { t: "exists", y: 2014, s: ["Found Footage", "Creature Feature"] }, { t: "as above so below", s: ["Found Footage", "Supernatural"] },
  { t: "unfriended", y: 2014, s: ["Found Footage", "Supernatural"] }, { t: "unfriended: dark web", s: ["Found Footage"] },
  { t: "the den", y: 2013, s: ["Found Footage", "Slasher"] }, { t: "host", y: 2020, s: ["Found Footage", "Supernatural"] },
  { t: "dashcam", y: 2021, s: ["Found Footage", "Supernatural"] },
  { t: "hell house llc", s: ["Found Footage", "Supernatural"] }, { t: "hell house llc ii: the abaddon hotel", s: ["Found Footage", "Supernatural"] },
  { t: "hell house llc iii: lake of fire", s: ["Found Footage", "Supernatural"] }, { t: "hell house llc origins: the carmichael manor", s: ["Found Footage", "Supernatural"] },
  { t: "grave encounters", y: 2011, s: ["Found Footage", "Supernatural"] }, { t: "grave encounters 2", s: ["Found Footage", "Supernatural"] },
  { t: "the taking of deborah logan", s: ["Found Footage", "Supernatural"] }, { t: "afflicted", y: 2013, s: ["Found Footage", "Vampire", "Body Horror"] },
  { t: "the sacrament", y: 2013, s: ["Found Footage", "Psychological"] }, { t: "creep", y: 2014, s: ["Found Footage", "Psychological"] },
  { t: "creep 2", s: ["Found Footage", "Psychological"] }, { t: "noroi: the curse", s: ["Found Footage", "Supernatural"] },
  { t: "terrified", y: 2017, s: ["Supernatural", "Found Footage"] },
  // FOLK HORROR
  { t: "the wicker man", y: 1973, s: ["Folk Horror", "Psychological"] }, { t: "the wicker man", y: 2006, s: ["Folk Horror"] },
  { t: "children of the corn", y: 1984, s: ["Supernatural", "Folk Horror"] }, { t: "children of the corn ii: the final sacrifice", s: ["Supernatural", "Folk Horror"] },
  { t: "children of the corn iii: urban harvest", s: ["Supernatural", "Folk Horror"] }, { t: "children of the corn", y: 2009, s: ["Supernatural", "Folk Horror"] },
  { t: "children of the corn", y: 2020, s: ["Supernatural", "Folk Horror"] },
  { t: "kill list", y: 2011, s: ["Folk Horror", "Psychological", "Slasher"] }, { t: "a field in england", s: ["Folk Horror"] },
  { t: "blood on satan's claw", s: ["Folk Horror", "Supernatural"] }, { t: "witchfinder general", s: ["Folk Horror"] },
  { t: "the wicker tree", s: ["Folk Horror"] }, { t: "the borderlands", y: 2013, s: ["Found Footage", "Supernatural", "Folk Horror"] },
  { t: "consecration", y: 2023, s: ["Supernatural", "Folk Horror"] }, { t: "the invitation", y: 2022, s: ["Folk Horror", "Supernatural"] },
  { t: "lamb", y: 2021, s: ["Folk Horror", "Creature Feature"] }, { t: "the green knight", s: ["Folk Horror", "Supernatural"] },
  // COMEDY HORROR
  { t: "tucker and dale vs evil", s: ["Comedy Horror", "Slasher"] }, { t: "beetlejuice", s: ["Comedy Horror", "Supernatural"] },
  { t: "little shop of horrors", y: 1986, s: ["Comedy Horror", "Creature Feature"] }, { t: "the rocky horror picture show", s: ["Comedy Horror"] },
  { t: "young frankenstein", s: ["Comedy Horror"] }, { t: "the frighteners", y: 1996, s: ["Comedy Horror", "Supernatural"] },
  { t: "idle hands", y: 1999, s: ["Comedy Horror", "Supernatural"] }, { t: "scary movie", y: 2000, s: ["Comedy Horror", "Slasher"] },
  { t: "scary movie 2", s: ["Comedy Horror"] }, { t: "scary movie 3", s: ["Comedy Horror"] }, { t: "scary movie 4", s: ["Comedy Horror"] },
  { t: "the cabin in the woods", s: ["Comedy Horror", "Slasher"] }, { t: "happy death day", s: ["Comedy Horror", "Slasher"] }, { t: "happy death day 2u", s: ["Comedy Horror", "Slasher"] },
  { t: "freaky", y: 2020, s: ["Comedy Horror", "Slasher"] }, { t: "the final girls", s: ["Comedy Horror", "Slasher"] },
  { t: "cocaine bear", s: ["Comedy Horror", "Creature Feature"] }, { t: "m3gan", s: ["Sci-Fi Horror", "Comedy Horror"] },
  { t: "totally killer", s: ["Comedy Horror", "Slasher"] }, { t: "repossessed", s: ["Comedy Horror", "Supernatural"] },
  { t: "student bodies", s: ["Comedy Horror", "Slasher"] }, { t: "krampus", y: 2015, s: ["Creature Feature", "Comedy Horror", "Supernatural"] },
  { t: "anna and the apocalypse", s: ["Comedy Horror", "Zombie"] }, { t: "deathgasm", s: ["Comedy Horror", "Supernatural"] },
  { t: "house", y: 1977, s: ["Supernatural", "Comedy Horror"] }, { t: "hausu", s: ["Supernatural", "Comedy Horror"] },
  { t: "the 'burbs", s: ["Comedy Horror"] }, { t: "the burbs", s: ["Comedy Horror"] },
  // ITALIAN HORROR (under actual genres â€” no Italian Horror tag)
  { t: "suspiria", y: 1977, s: ["Supernatural", "Psychological"] }, { t: "inferno", y: 1980, s: ["Supernatural"] },
  { t: "phenomena", y: 1985, s: ["Slasher", "Supernatural"] }, { t: "the bird with the crystal plumage", s: ["Slasher", "Psychological"] },
  { t: "four flies on grey velvet", s: ["Slasher", "Psychological"] }, { t: "the cat o' nine tails", s: ["Slasher", "Psychological"] },
  { t: "bay of blood", s: ["Slasher"] }, { t: "stagefright", y: 1987, s: ["Slasher"] },
  { t: "the church", y: 1989, s: ["Supernatural"] }, { t: "cemetery man", s: ["Zombie", "Comedy Horror"] },
  { t: "dellamorte dellamore", s: ["Zombie", "Comedy Horror"] },
  { t: "don't torture a duckling", s: ["Slasher", "Psychological"] }, { t: "the new york ripper", s: ["Slasher"] },
  // CULT CLASSICS (internal tag only â€” entries here get cult_classic treatment via assign-cult-classics)
  { t: "the people under the stairs", s: ["Supernatural", "Slasher"] }, { t: "the hidden", y: 1987, s: ["Sci-Fi Horror"] },
  { t: "phantasm", y: 1979, s: ["Supernatural", "Creature Feature"] }, { t: "phantasm ii", s: ["Supernatural", "Creature Feature"] },
  { t: "phantasm iii: lord of the dead", s: ["Supernatural", "Creature Feature"] }, { t: "phantasm iv: oblivion", s: ["Supernatural"] }, { t: "phantasm: ravager", s: ["Supernatural"] },
  { t: "the fog", y: 1980, s: ["Supernatural"] }, { t: "blood simple", s: ["Psychological"] },
  { t: "tourist trap", y: 1979, s: ["Slasher", "Supernatural"] }, { t: "squirm", y: 1976, s: ["Creature Feature"] },
  { t: "sorority house massacre", s: ["Slasher"] }, { t: "hell night", y: 1981, s: ["Slasher", "Supernatural"] },
  { t: "the stuff", y: 1985, s: ["Creature Feature", "Sci-Fi Horror", "Comedy Horror"] },
  { t: "maximum overdrive", s: ["Sci-Fi Horror"] }, { t: "leprechaun", y: 1993, s: ["Creature Feature", "Comedy Horror"] },
  { t: "hellraiser", y: 1987, s: ["Supernatural", "Body Horror"] }, { t: "hellbound: hellraiser ii", s: ["Supernatural", "Body Horror"] },
  { t: "hellraiser iii: hell on earth", s: ["Supernatural", "Body Horror"] }, { t: "hellraiser: bloodline", s: ["Supernatural", "Body Horror"] },
  { t: "hellraiser: inferno", s: ["Supernatural", "Psychological"] }, { t: "hellraiser: hellseeker", s: ["Supernatural"] },
  { t: "hellraiser: deader", s: ["Supernatural"] }, { t: "hellraiser: hellworld", s: ["Supernatural"] }, { t: "hellraiser", y: 2022, s: ["Supernatural", "Body Horror"] },
  { t: "waxwork", y: 1988, s: ["Supernatural", "Comedy Horror"] }, { t: "house", y: 1986, s: ["Supernatural", "Comedy Horror"] },
  { t: "house ii: the second story", s: ["Supernatural", "Comedy Horror"] }, { t: "pulse", y: 1988, s: ["Supernatural"] },
  { t: "flatliners", y: 1990, s: ["Supernatural", "Psychological"] }, { t: "brainscan", s: ["Psychological", "Sci-Fi Horror"] },
  { t: "troll 2", s: ["Creature Feature", "Comedy Horror"] }, { t: "the sentinel", y: 1977, s: ["Supernatural"] },
  { t: "we are what we are", y: 2013, s: ["Folk Horror", "Body Horror"] }, { t: "american mary", s: ["Body Horror", "Slasher"] },
  { t: "the innkeepers", s: ["Supernatural", "Psychological"] },
  { t: "behind the mask: the rise of leslie vernon", s: ["Slasher", "Comedy Horror"] },
  { t: "frailty", y: 2001, s: ["Supernatural", "Psychological"] }, { t: "bubba ho-tep", s: ["Supernatural", "Comedy Horror"] },
  { t: "ravenous", y: 1999, s: ["Slasher", "Supernatural"] }, { t: "the faculty", y: 1998, s: ["Sci-Fi Horror", "Creature Feature"] },
  { t: "phantoms", y: 1998, s: ["Supernatural", "Creature Feature"] },
  { t: "the gift", y: 2015, s: ["Psychological"] },
  // New titles from CONTENT_POLICY.md update
  { t: "the black phone", y: 2021, s: ["Slasher", "Supernatural"] },
  { t: "smile", y: 2022, s: ["Slasher", "Supernatural", "Psychological"] },
  { t: "smile 2", y: 2024, s: ["Slasher", "Supernatural", "Psychological"] },
  { t: "the boogeyman", y: 2023, s: ["Supernatural", "Slasher"] },
  { t: "strange darling", y: 2024, s: ["Slasher", "Psychological"] },
  { t: "in a violent nature", y: 2024, s: ["Slasher"] },
  { t: "malignant", y: 2021, s: ["Supernatural", "Slasher", "Body Horror"] },
  { t: "the night house", y: 2020, s: ["Supernatural", "Psychological"] },
  { t: "antlers", y: 2021, s: ["Supernatural", "Creature Feature", "Folk Horror"] },
  { t: "immaculate", y: 2024, s: ["Supernatural", "Psychological"] },
  { t: "heretic", y: 2024, s: ["Supernatural", "Psychological"] },
  { t: "late night with the devil", y: 2023, s: ["Supernatural", "Psychological", "Found Footage"] },
  { t: "it lives inside", y: 2023, s: ["Supernatural"] },
  { t: "when evil lurks", y: 2023, s: ["Supernatural", "Folk Horror"] },
  { t: "a quiet place", y: 2018, s: ["Creature Feature", "Sci-Fi Horror", "Psychological"] },
  { t: "a quiet place part ii", y: 2021, s: ["Creature Feature", "Sci-Fi Horror"] },
  { t: "five nights at freddy's", y: 2023, s: ["Creature Feature", "Supernatural"] },
  { t: "abigail", y: 2024, s: ["Vampire", "Creature Feature", "Comedy Horror", "Slasher"] },
  { t: "the substance", y: 2024, s: ["Body Horror", "Psychological", "Sci-Fi Horror"] },
  { t: "longlegs", y: 2024, s: ["Psychological", "Slasher", "Supernatural"] },
  { t: "last night in soho", y: 2021, s: ["Psychological", "Supernatural"] },
  { t: "skinamarink", y: 2022, s: ["Found Footage", "Supernatural", "Psychological"] },
];

// â”€â”€â”€ TMDB keyword â†’ subgenre mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function keywordsToSubgenres(keywordNames: string[]): string[] {
  const tags = new Set<string>();
  const kStr = " " + keywordNames.join(" ") + " ";

  if (/slasher film|slasher movie| slasher |masked killer|knife killer/.test(kStr)) tags.add("Slasher");
  if (/ serial killer|mass murderer|psychopathic killer/.test(kStr)) tags.add("Slasher");
  if (/ zombie|undead|living dead|zombie apocalypse/.test(kStr)) tags.add("Zombie");
  if (/ vampire|vampirism|bloodsucker| dracula | nosferatu /.test(kStr)) tags.add("Vampire");
  if (/werewolf|lycanthropy|lycanthrope/.test(kStr)) tags.add("Werewolf");
  if (/found footage/.test(kStr)) tags.add("Found Footage");
  if (/ ghost |haunted house|haunting|poltergeist| specter | spectre |apparition/.test(kStr)) tags.add("Supernatural");
  if (/demonic possession|possession|exorcism| demon |satanism|witchcraft|black magic|occult| curse |cursed|supernatural horror/.test(kStr)) tags.add("Supernatural");
  if (/body horror|body transformation|mutation|body modification|parasit/.test(kStr)) tags.add("Body Horror");
  if (/psychological horror| paranoia |gaslighting|mind control|psychological terror/.test(kStr)) tags.add("Psychological");
  if (/folk horror|pagan ritual|pagan|isolated community|rural horror/.test(kStr)) tags.add("Folk Horror");
  if (/creature feature|sea monster|giant monster|kaiju|mutant animal|killer animal| monster | creature /.test(kStr)) tags.add("Creature Feature");
  if (/ alien creature|extraterrestrial creature|space monster|alien monster/.test(kStr)) { tags.add("Creature Feature"); tags.add("Sci-Fi Horror"); }
  if (/comedy horror|horror comedy/.test(kStr)) tags.add("Comedy Horror");
  if (/science fiction horror|sci-fi horror|space horror/.test(kStr)) tags.add("Sci-Fi Horror");

  return [...tags];
}

// â”€â”€â”€ Main subgenre computer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function computeFromMap(title: string, year: number | null): string[] | null {
  const t = title.toLowerCase().trim();
  const y = year;

  if (y) {
    for (const e of MAP) {
      if (e.y === y && e.t === t) return [...new Set(e.s)];
    }
  }
  for (const e of MAP) {
    if (!e.y && e.t === t) return [...new Set(e.s)];
  }
  return null;
}

// â”€â”€â”€ TMDB genre names â†’ subgenres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ensures that whatever genre label is displayed on a card is also filterable.
// These tags are ADDED to (not replacing) MAP/keyword tags.

function fromTmdbGenres(genres: string[] | null): string[] {
  if (!genres?.length) return [];
  const g = genres.map((x) => x.toLowerCase());
  const tags: string[] = [];
  if (g.includes("comedy")) tags.push("Comedy Horror");
  if (g.includes("science fiction")) tags.push("Sci-Fi Horror");
  if (g.includes("thriller") || g.includes("mystery")) tags.push("Psychological");
  return tags;
}

// â”€â”€â”€ Overview/title heuristic fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function inferFromText(title: string, overview: string | null): string[] {
  const t = title.toLowerCase();
  const o = (overview ?? "").toLowerCase();
  const combined = t + " " + o;
  const tags = new Set<string>();

  if (/\bzombie\b|\bthe living dead\b|\bthe undead\b/.test(combined)) tags.add("Zombie");
  if (/\bvampire\b|\bdracula\b|\bnosferatu\b|\bvampyr\b/.test(combined)) tags.add("Vampire");
  if (/\bwerewolf\b|\bwerewolves\b|\bwolf man\b|\bwolfman\b|\blycanthrop/.test(combined)) tags.add("Werewolf");
  if (/found footage/.test(t)) tags.add("Found Footage");
  if (/\bslasher\b/.test(combined)) tags.add("Slasher");
  if (/\bexorcis|\bdemonic possession|\bwitchcraft\b|\boccult\b|\bpossesse/.test(combined)) tags.add("Supernatural");

  return [...tags];
}

// â”€â”€â”€ Fetch TMDB keywords for a single title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function fetchTMDBKeywords(tmdbId: number, mediaType: string): Promise<string[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];
  const path = mediaType === "movie" ? `/movie/${tmdbId}/keywords` : `/tv/${tmdbId}/keywords`;
  try {
    const res = await fetch(`https://api.themoviedb.org/3${path}?api_key=${apiKey}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const keywords: { id: number; name: string }[] = data.keywords ?? data.results ?? [];
    return keywords.map((k) => k.name.toLowerCase());
  } catch {
    return [];
  }
}

// â”€â”€â”€ Route â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // 1. Fetch all titles in pages
  const allTitles: { id: string; tmdb_id: number; title: string; media_type: string; release_year: number | null; overview: string | null; genres: string[] | null }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("titles")
      .select("id,tmdb_id,title,media_type,release_year,overview,genres")
      .range(from, from + 499);
    if (error || !data?.length) break;
    allTitles.push(...data);
    if (data.length < 500) break;
    from += 500;
  }

  // 2. Apply MAP first â€” instant, no API calls
  const needsKeywordFetch: typeof allTitles = [];
  const subgenreMap = new Map<string, string[]>();

  for (const t of allTitles) {
    const fromMap = computeFromMap(t.title, t.release_year);
    if (fromMap !== null && fromMap.length > 0) {
      // Merge genre-derived tags even into MAP hits for full sync
      const merged = [...new Set([...fromMap, ...fromTmdbGenres(t.genres)])];
      subgenreMap.set(t.id, merged);
    } else {
      needsKeywordFetch.push(t);
    }
  }

  // 3. Fetch TMDB keywords for untagged titles in batches of 25
  const BATCH_SIZE = 25;
  for (let i = 0; i < needsKeywordFetch.length; i += BATCH_SIZE) {
    const batch = needsKeywordFetch.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((t) => fetchTMDBKeywords(t.tmdb_id, t.media_type))
    );
    for (let j = 0; j < batch.length; j++) {
      const t = batch[j];
      const keywordNames = results[j];
      let tags = keywordsToSubgenres(keywordNames);

      // Fall back to text heuristics if keywords produced nothing
      if (tags.length === 0) {
        tags = inferFromText(t.title, t.overview);
      }

      // Always merge in TMDB genre-derived tags so display and filter stay in sync
      const genreTags = fromTmdbGenres(t.genres);
      tags = [...new Set([...tags, ...genreTags])];

      // Last resort: Supernatural is the appropriate catch-all for any horror
      // title that can't be classified more specifically â€” covers haunted houses,
      // demons, witches, evil forces, and ambiguous horror alike.
      if (tags.length === 0) {
        tags = ["Supernatural"];
      }

      subgenreMap.set(t.id, tags);
    }

    // Small delay between batches to stay under TMDB rate limit
    if (i + BATCH_SIZE < needsKeywordFetch.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // 4. Build upsert payloads and write in batches
  let updated = 0;
  const payloadChunks: { tmdb_id: number; media_type: string; title: string; subgenres: string[] }[][] = [];
  const chunkSize = 200;

  const payloads = allTitles.map((t) => ({
    tmdb_id: t.tmdb_id,
    media_type: t.media_type,
    title: t.title,
    subgenres: subgenreMap.get(t.id) ?? [],
  }));

  for (let i = 0; i < payloads.length; i += chunkSize) {
    payloadChunks.push(payloads.slice(i, i + chunkSize));
  }

  for (const chunk of payloadChunks) {
    const { count } = await supabase.from("titles").upsert(chunk, {
      onConflict: "tmdb_id,media_type",
      count: "exact",
    });
    updated += count ?? chunk.length;
  }

  const withTags = payloads.filter((p) => p.subgenres.length > 0).length;

  return NextResponse.json({
    success: true,
    totalTitles: allTitles.length,
    updated,
    withSubgenres: withTags,
    withoutSubgenres: allTitles.length - withTags,
    mapHits: allTitles.length - needsKeywordFetch.length,
    keywordFetched: needsKeywordFetch.length,
  });
}
