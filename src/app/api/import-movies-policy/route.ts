import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

// Every approved movie from CONTENT_POLICY.md — title + year for precise TMDB lookup
const APPROVED: { q: string; y: number }[] = [
  // SLASHERS
  { q: "Halloween", y: 1978 }, { q: "Halloween II", y: 1981 }, { q: "Halloween III Season of the Witch", y: 1982 },
  { q: "Halloween 4 The Return of Michael Myers", y: 1988 }, { q: "Halloween H20 20 Years Later", y: 1998 },
  { q: "Halloween", y: 2018 }, { q: "Halloween Kills", y: 2021 }, { q: "Halloween Ends", y: 2022 },
  { q: "A Nightmare on Elm Street", y: 1984 }, { q: "A Nightmare on Elm Street 2 Freddy's Revenge", y: 1985 },
  { q: "A Nightmare on Elm Street 3 Dream Warriors", y: 1987 }, { q: "A Nightmare on Elm Street 4 The Dream Master", y: 1988 },
  { q: "Wes Craven's New Nightmare", y: 1994 }, { q: "Freddy vs. Jason", y: 2003 },
  { q: "Friday the 13th", y: 1980 }, { q: "Friday the 13th Part 2", y: 1981 }, { q: "Friday the 13th Part III", y: 1982 },
  { q: "Friday the 13th The Final Chapter", y: 1984 }, { q: "Friday the 13th A New Beginning", y: 1985 },
  { q: "Jason Lives Friday the 13th Part VI", y: 1986 }, { q: "Friday the 13th Part VII The New Blood", y: 1988 },
  { q: "Friday the 13th Part VIII Jason Takes Manhattan", y: 1989 }, { q: "Jason Goes to Hell The Final Friday", y: 1993 },
  { q: "Jason X", y: 2001 }, { q: "Friday the 13th", y: 2009 },
  { q: "Scream", y: 1996 }, { q: "Scream 2", y: 1997 }, { q: "Scream 3", y: 2000 }, { q: "Scream 4", y: 2011 },
  { q: "Scream", y: 2022 }, { q: "Scream VI", y: 2023 },
  { q: "Child's Play", y: 1988 }, { q: "Child's Play 2", y: 1990 }, { q: "Bride of Chucky", y: 1998 },
  { q: "Seed of Chucky", y: 2004 }, { q: "Curse of Chucky", y: 2013 }, { q: "Cult of Chucky", y: 2017 },
  { q: "Candyman", y: 1992 }, { q: "Candyman", y: 2021 },
  { q: "My Bloody Valentine", y: 1981 }, { q: "My Bloody Valentine 3D", y: 2009 },
  { q: "Black Christmas", y: 1974 }, { q: "Black Christmas", y: 2006 },
  { q: "Prom Night", y: 1980 }, { q: "Terror Train", y: 1980 }, { q: "The Burning", y: 1981 },
  { q: "Sleepaway Camp", y: 1983 }, { q: "Sleepaway Camp II Unhappy Campers", y: 1988 }, { q: "Sleepaway Camp III Teenage Wasteland", y: 1989 },
  { q: "Slumber Party Massacre", y: 1982 }, { q: "The House on Sorority Row", y: 1983 },
  { q: "Happy Birthday to Me", y: 1981 }, { q: "Pieces", y: 1982 }, { q: "Madman", y: 1982 },
  { q: "The Funhouse", y: 1981 }, { q: "Maniac", y: 1980 }, { q: "Silent Night Deadly Night", y: 1984 },
  { q: "Graduation Day", y: 1981 }, { q: "Final Exam", y: 1981 }, { q: "He Knows You're Alone", y: 1980 },
  { q: "The Dorm That Dripped Blood", y: 1982 }, { q: "Curtains", y: 1983 }, { q: "Offerings", y: 1989 },
  { q: "Hatchet", y: 2006 }, { q: "Hatchet II", y: 2010 }, { q: "Hatchet III", y: 2013 }, { q: "Victor Crowley", y: 2017 },
  { q: "Laid to Rest", y: 2009 }, { q: "ChromeSkull Laid to Rest 2", y: 2011 },
  { q: "Wrong Turn", y: 2003 }, { q: "Wrong Turn 2 Dead End", y: 2007 },
  { q: "Saw", y: 2004 }, { q: "Saw II", y: 2005 }, { q: "Saw III", y: 2006 }, { q: "Saw IV", y: 2007 },
  { q: "Saw V", y: 2008 }, { q: "Saw VI", y: 2009 }, { q: "Saw 3D", y: 2010 }, { q: "Jigsaw", y: 2017 },
  { q: "Spiral From the Book of Saw", y: 2021 }, { q: "Saw X", y: 2023 },
  { q: "Urban Legend", y: 1998 }, { q: "I Know What You Did Last Summer", y: 1997 }, { q: "I Still Know What You Did Last Summer", y: 1998 },
  { q: "Valentine", y: 2001 }, { q: "Jeepers Creepers", y: 2001 }, { q: "Jeepers Creepers 2", y: 2003 },
  { q: "The Strangers", y: 2008 }, { q: "The Strangers Prey at Night", y: 2018 },
  { q: "You're Next", y: 2011 }, { q: "The Purge", y: 2013 }, { q: "The Purge Anarchy", y: 2014 },
  { q: "The First Purge", y: 2018 }, { q: "The Forever Purge", y: 2021 },
  { q: "Ready or Not", y: 2019 }, { q: "Terrifier", y: 2016 }, { q: "Terrifier 2", y: 2022 }, { q: "Terrifier 3", y: 2024 },
  { q: "X", y: 2022 }, { q: "Pearl", y: 2022 }, { q: "MaXXXine", y: 2024 },
  { q: "Bone Tomahawk", y: 2015 }, { q: "Green Room", y: 2015 }, { q: "It Follows", y: 2014 }, { q: "The Guest", y: 2014 },
  { q: "Eden Lake", y: 2008 }, { q: "Wolf Creek", y: 2005 }, { q: "Wolf Creek 2", y: 2013 },
  { q: "The Loved Ones", y: 2009 }, { q: "Severance", y: 2006 }, { q: "High Tension", y: 2003 },
  { q: "Inside", y: 2007 }, { q: "Ils", y: 2006 }, { q: "American Psycho", y: 2000 },
  { q: "The Silence of the Lambs", y: 1991 }, { q: "Manhunter", y: 1986 }, { q: "Red Dragon", y: 2002 },
  { q: "Hannibal", y: 2001 }, { q: "Se7en", y: 1995 },
  { q: "The Black Phone", y: 2021 }, { q: "Smile", y: 2022 }, { q: "Smile 2", y: 2024 },
  { q: "The Boogeyman", y: 2023 }, { q: "Strange Darling", y: 2024 }, { q: "In a Violent Nature", y: 2024 },
  // SUPERNATURAL
  { q: "The Exorcist", y: 1973 }, { q: "Exorcist II The Heretic", y: 1977 }, { q: "The Exorcist III", y: 1990 },
  { q: "The Exorcist Believer", y: 2023 }, { q: "Poltergeist", y: 1982 }, { q: "Poltergeist II The Other Side", y: 1986 },
  { q: "Poltergeist III", y: 1988 }, { q: "The Amityville Horror", y: 1979 }, { q: "Amityville II The Possession", y: 1982 },
  { q: "The Amityville Horror", y: 2005 }, { q: "The Conjuring", y: 2013 }, { q: "The Conjuring 2", y: 2016 },
  { q: "The Conjuring The Devil Made Me Do It", y: 2021 }, { q: "Annabelle", y: 2014 },
  { q: "Annabelle Creation", y: 2017 }, { q: "Annabelle Comes Home", y: 2019 },
  { q: "The Nun", y: 2018 }, { q: "The Nun II", y: 2023 },
  { q: "Insidious", y: 2010 }, { q: "Insidious Chapter 2", y: 2013 }, { q: "Insidious Chapter 3", y: 2015 },
  { q: "Insidious The Last Key", y: 2018 }, { q: "Insidious The Red Door", y: 2023 },
  { q: "Sinister", y: 2012 }, { q: "Sinister 2", y: 2015 },
  { q: "The Ring", y: 2002 }, { q: "The Ring Two", y: 2005 }, { q: "Rings", y: 2017 },
  { q: "The Grudge", y: 2004 }, { q: "The Grudge 2", y: 2006 },
  { q: "Drag Me to Hell", y: 2009 }, { q: "Hereditary", y: 2018 }, { q: "Midsommar", y: 2019 }, { q: "The Witch", y: 2015 },
  { q: "Apostle", y: 2018 }, { q: "Rosemary's Baby", y: 1968 }, { q: "The Omen", y: 1976 },
  { q: "Damien Omen II", y: 1978 }, { q: "The Final Conflict", y: 1981 }, { q: "The Omen", y: 2006 },
  { q: "Carrie", y: 1976 }, { q: "Carrie", y: 2013 }, { q: "The Rage Carrie 2", y: 1999 },
  { q: "Christine", y: 1983 }, { q: "Firestarter", y: 1984 }, { q: "The Dead Zone", y: 1983 },
  { q: "Needful Things", y: 1993 }, { q: "Thinner", y: 1996 }, { q: "Dolores Claiborne", y: 1995 },
  { q: "The Shining", y: 1980 }, { q: "Doctor Sleep", y: 2019 }, { q: "Pet Sematary", y: 1989 }, { q: "Pet Sematary", y: 2019 },
  { q: "It", y: 1990 }, { q: "It Chapter One", y: 2017 }, { q: "It Chapter Two", y: 2019 },
  { q: "Misery", y: 1990 }, { q: "Gerald's Game", y: 2017 }, { q: "1408", y: 2007 }, { q: "Dreamcatcher", y: 2003 },
  { q: "The Mist", y: 2007 }, { q: "Creepshow", y: 1982 }, { q: "Creepshow 2", y: 1987 },
  { q: "Trick r Treat", y: 2007 }, { q: "The Houses October Built", y: 2014 },
  { q: "Paranormal Activity", y: 2007 }, { q: "Paranormal Activity 2", y: 2010 }, { q: "Paranormal Activity 3", y: 2011 },
  { q: "Paranormal Activity 4", y: 2012 }, { q: "Paranormal Activity The Marked Ones", y: 2014 },
  { q: "Paranormal Activity The Ghost Dimension", y: 2015 },
  { q: "The Haunting", y: 1999 }, { q: "The Others", y: 2001 }, { q: "The Orphanage", y: 2007 },
  { q: "Mama", y: 2013 }, { q: "Oculus", y: 2013 }, { q: "Ouija", y: 2014 }, { q: "Ouija Origin of Evil", y: 2016 },
  { q: "The Boy", y: 2016 }, { q: "Brahms The Boy II", y: 2020 }, { q: "The Autopsy of Jane Doe", y: 2016 },
  { q: "A Ghost Story", y: 2017 }, { q: "His House", y: 2020 }, { q: "Veronica", y: 2017 },
  { q: "The Babadook", y: 2014 }, { q: "Lights Out", y: 2016 }, { q: "Before I Wake", y: 2016 },
  { q: "Hush", y: 2016 }, { q: "Get Out", y: 2017 }, { q: "Us", y: 2019 }, { q: "Nope", y: 2022 },
  { q: "Barbarian", y: 2022 }, { q: "Talk to Me", y: 2022 },
  { q: "The Evil Dead", y: 1981 }, { q: "Evil Dead II", y: 1987 }, { q: "Army of Darkness", y: 1992 },
  { q: "Evil Dead", y: 2013 }, { q: "Evil Dead Rise", y: 2023 },
  { q: "The Changeling", y: 1980 }, { q: "Burnt Offerings", y: 1976 }, { q: "Audrey Rose", y: 1977 },
  { q: "The Watcher in the Woods", y: 1980 }, { q: "Something Wicked This Way Comes", y: 1983 },
  { q: "Cat's Eye", y: 1985 }, { q: "Warlock", y: 1989 }, { q: "Warlock The Armageddon", y: 1993 },
  { q: "Wishmaster", y: 1997 }, { q: "Wishmaster 2 Evil Never Dies", y: 1999 },
  { q: "Shocker", y: 1989 }, { q: "The First Power", y: 1990 }, { q: "In the Mouth of Madness", y: 1994 },
  { q: "Prince of Darkness", y: 1987 }, { q: "Wolfen", y: 1981 }, { q: "Night of the Demons", y: 1988 },
  { q: "Demon Knight", y: 1995 }, { q: "Haunt", y: 2019 }, { q: "Under the Shadow", y: 2016 },
  { q: "A Dark Song", y: 2016 }, { q: "Tigers Are Not Afraid", y: 2017 }, { q: "The Wailing", y: 2016 },
  { q: "Ringu", y: 1998 }, { q: "Ju-On The Grudge", y: 2002 }, { q: "Dark Water", y: 2002 },
  { q: "One Missed Call", y: 2003 }, { q: "A Tale of Two Sisters", y: 2003 },
  { q: "Malignant", y: 2021 }, { q: "The Night House", y: 2020 }, { q: "Antlers", y: 2021 },
  { q: "Immaculate", y: 2024 }, { q: "Heretic", y: 2024 }, { q: "Late Night with the Devil", y: 2023 },
  { q: "It Lives Inside", y: 2023 }, { q: "When Evil Lurks", y: 2023 },
  // CREATURE FEATURE
  { q: "The Thing", y: 1982 }, { q: "The Thing", y: 2011 },
  { q: "Jaws", y: 1975 }, { q: "Jaws 2", y: 1978 }, { q: "Jaws 3-D", y: 1983 }, { q: "Jaws The Revenge", y: 1987 },
  { q: "Tremors", y: 1990 }, { q: "Tremors 2 Aftershocks", y: 1996 }, { q: "Tremors 3 Back to Perfection", y: 2001 },
  { q: "Tremors 4 The Legend Begins", y: 2004 }, { q: "Tremors 5 Bloodlines", y: 2015 }, { q: "Tremors A Cold Day in Hell", y: 2018 },
  { q: "The Descent", y: 2005 }, { q: "The Descent Part 2", y: 2009 },
  { q: "Predator", y: 1987 }, { q: "Predator 2", y: 1990 }, { q: "Predators", y: 2010 },
  { q: "The Predator", y: 2018 }, { q: "Prey", y: 2022 },
  { q: "Critters", y: 1986 }, { q: "Critters 2", y: 1988 },
  { q: "Gremlins", y: 1984 }, { q: "Gremlins 2 The New Batch", y: 1990 },
  { q: "Pumpkinhead", y: 1988 }, { q: "Pumpkinhead II Blood Wings", y: 1994 },
  { q: "The Gate", y: 1987 }, { q: "Slither", y: 2006 }, { q: "The Host", y: 2006 },
  { q: "Grabbers", y: 2012 }, { q: "Feast", y: 2005 }, { q: "Dog Soldiers", y: 2002 },
  { q: "The Ritual", y: 2017 }, { q: "Mimic", y: 1997 }, { q: "Mimic 2", y: 2001 }, { q: "Mimic 3 Sentinel", y: 2003 },
  { q: "Eight Legged Freaks", y: 2002 }, { q: "Arachnophobia", y: 1990 },
  { q: "Kingdom of the Spiders", y: 1977 }, { q: "Splinter", y: 2008 },
  { q: "Godzilla", y: 2014 }, { q: "Kong Skull Island", y: 2017 }, { q: "Godzilla King of the Monsters", y: 2019 },
  { q: "The Blob", y: 1988 }, { q: "Leviathan", y: 1989 }, { q: "DeepStar Six", y: 1989 },
  { q: "Below", y: 2002 }, { q: "The Bay", y: 2012 }, { q: "C.H.U.D.", y: 1984 },
  { q: "Q The Winged Serpent", y: 1982 }, { q: "Alligator", y: 1980 }, { q: "Prophecy", y: 1979 },
  { q: "Rawhead Rex", y: 1986 }, { q: "Basket Case", y: 1982 }, { q: "Ghoulies", y: 1984 },
  { q: "Troll", y: 1986 }, { q: "Cloverfield", y: 2008 }, { q: "Underwater", y: 2020 },
  { q: "A Quiet Place", y: 2018 }, { q: "A Quiet Place Part II", y: 2021 },
  { q: "Five Nights at Freddy's", y: 2023 }, { q: "Abigail", y: 2024 },
  // SCI-FI HORROR
  { q: "Alien", y: 1979 }, { q: "Aliens", y: 1986 }, { q: "Alien 3", y: 1992 }, { q: "Alien Resurrection", y: 1997 },
  { q: "Prometheus", y: 2012 }, { q: "Alien Covenant", y: 2017 }, { q: "Alien Romulus", y: 2024 },
  { q: "The Fly", y: 1986 }, { q: "The Fly II", y: 1989 },
  { q: "10 Cloverfield Lane", y: 2016 }, { q: "The Cloverfield Paradox", y: 2018 },
  { q: "Annihilation", y: 2018 }, { q: "Color Out of Space", y: 2019 },
  { q: "Videodrome", y: 1983 }, { q: "eXistenZ", y: 1999 }, { q: "Possessor", y: 2020 },
  { q: "Titane", y: 2021 }, { q: "Crimes of the Future", y: 2022 },
  { q: "Scanners", y: 1981 }, { q: "The Brood", y: 1979 }, { q: "Shivers", y: 1975 }, { q: "Rabid", y: 1977 },
  { q: "Night of the Comet", y: 1984 }, { q: "Overlord", y: 2018 }, { q: "Lifeforce", y: 1985 },
  { q: "Daybreakers", y: 2009 }, { q: "Priest", y: 2011 }, { q: "Battle Royale", y: 2000 },
  { q: "Night of the Creeps", y: 1986 }, { q: "The Girl with All the Gifts", y: 2016 },
  { q: "Wyrmwood Road of the Dead", y: 2014 }, { q: "Peninsula", y: 2020 },
  // BODY HORROR
  { q: "Naked Lunch", y: 1991 }, { q: "Dead Ringers", y: 1988 }, { q: "Society", y: 1989 },
  { q: "Tusk", y: 2014 }, { q: "Contracted", y: 2013 }, { q: "Contracted Phase II", y: 2015 },
  { q: "Bite", y: 2015 }, { q: "Starry Eyes", y: 2014 }, { q: "Raw", y: 2016 },
  { q: "Martyrs", y: 2008 }, { q: "Men", y: 2022 }, { q: "The Substance", y: 2024 },
  // PSYCHOLOGICAL
  { q: "Black Swan", y: 2010 }, { q: "Repulsion", y: 1965 }, { q: "The Tenant", y: 1976 },
  { q: "Eyes Wide Shut", y: 1999 }, { q: "The Sixth Sense", y: 1999 }, { q: "Identity", y: 2003 },
  { q: "Shutter Island", y: 2010 }, { q: "Prisoners", y: 2013 }, { q: "Gone Girl", y: 2014 },
  { q: "Nightcrawler", y: 2014 }, { q: "May", y: 2002 }, { q: "Pontypool", y: 2008 },
  { q: "Lake Mungo", y: 2008 }, { q: "Don't Breathe", y: 2016 }, { q: "Don't Breathe 2", y: 2021 },
  { q: "The Invisible Man", y: 2020 }, { q: "Parasite", y: 2019 }, { q: "Oldboy", y: 2003 },
  { q: "I Saw the Devil", y: 2010 }, { q: "Audition", y: 1999 }, { q: "Session 9", y: 2001 },
  { q: "Jacob's Ladder", y: 1990 }, { q: "Suspiria", y: 1977 }, { q: "Suspiria", y: 2018 },
  { q: "Baskin", y: 2015 }, { q: "Prince of Darkness", y: 1987 },
  { q: "Last Night in Soho", y: 2021 }, { q: "Longlegs", y: 2024 },
  // ZOMBIE
  { q: "Night of the Living Dead", y: 1968 }, { q: "Dawn of the Dead", y: 1978 }, { q: "Day of the Dead", y: 1985 },
  { q: "Land of the Dead", y: 2005 }, { q: "Diary of the Dead", y: 2007 }, { q: "Survival of the Dead", y: 2009 },
  { q: "Dawn of the Dead", y: 2004 }, { q: "Day of the Dead", y: 2008 },
  { q: "Return of the Living Dead", y: 1985 }, { q: "Return of the Living Dead Part II", y: 1988 },
  { q: "Return of the Living Dead 3", y: 1993 }, { q: "28 Days Later", y: 2002 }, { q: "28 Weeks Later", y: 2007 },
  { q: "Shaun of the Dead", y: 2004 }, { q: "Zombieland", y: 2009 }, { q: "Zombieland Double Tap", y: 2019 },
  { q: "World War Z", y: 2013 }, { q: "Train to Busan", y: 2016 },
  { q: "Dead Snow", y: 2009 }, { q: "Dead Snow 2 Red vs Dead", y: 2014 },
  { q: "REC", y: 2007 }, { q: "REC 2", y: 2009 }, { q: "REC 3 Genesis", y: 2012 }, { q: "REC 4 Apocalypse", y: 2014 },
  { q: "Quarantine", y: 2008 }, { q: "Quarantine 2 Terminal", y: 2011 },
  { q: "Warm Bodies", y: 2013 }, { q: "Pride and Prejudice and Zombies", y: 2016 },
  { q: "One Cut of the Dead", y: 2017 }, { q: "The Crazies", y: 1973 }, { q: "The Crazies", y: 2010 },
  { q: "Planet Terror", y: 2007 }, { q: "Fido", y: 2006 }, { q: "Dead Alive", y: 1992 },
  { q: "Re-Animator", y: 1985 }, { q: "Bride of Re-Animator", y: 1990 }, { q: "Beyond Re-Animator", y: 2003 },
  { q: "Cargo", y: 2017 }, { q: "The Beyond", y: 1981 },
  // VAMPIRE
  { q: "Dracula", y: 1979 }, { q: "Bram Stoker's Dracula", y: 1992 }, { q: "Dracula 2000", y: 2000 },
  { q: "Dracula Untold", y: 2014 }, { q: "The Lost Boys", y: 1987 }, { q: "Interview with the Vampire", y: 1994 },
  { q: "Queen of the Damned", y: 2002 }, { q: "Near Dark", y: 1987 },
  { q: "Salem's Lot", y: 1979 }, { q: "Salem's Lot", y: 2024 },
  { q: "From Dusk Till Dawn", y: 1996 }, { q: "From Dusk Till Dawn 2 Texas Blood Money", y: 1999 },
  { q: "From Dusk Till Dawn 3 The Hangman's Daughter", y: 1999 },
  { q: "Blade", y: 1998 }, { q: "Blade II", y: 2002 }, { q: "Blade Trinity", y: 2004 },
  { q: "Underworld", y: 2003 }, { q: "Underworld Evolution", y: 2006 }, { q: "Underworld Rise of the Lycans", y: 2009 },
  { q: "Underworld Awakening", y: 2012 }, { q: "Underworld Blood Wars", y: 2016 },
  { q: "Let the Right One In", y: 2008 }, { q: "Let Me In", y: 2010 }, { q: "Only Lovers Left Alive", y: 2013 },
  { q: "A Girl Walks Home Alone at Night", y: 2014 }, { q: "What We Do in the Shadows", y: 2014 },
  { q: "Byzantium", y: 2012 }, { q: "Shadow of the Vampire", y: 2000 },
  { q: "Fright Night", y: 1985 }, { q: "Fright Night", y: 2011 },
  { q: "Innocent Blood", y: 1992 }, { q: "Vampires", y: 1998 }, { q: "30 Days of Night", y: 2007 },
  { q: "Stakeland", y: 2010 }, { q: "Dark Shadows", y: 2012 }, { q: "Cronos", y: 1993 },
  { q: "Martin", y: 1977 }, { q: "The Hunger", y: 1983 }, { q: "Thirst", y: 2009 },
  // WEREWOLF
  { q: "An American Werewolf in London", y: 1981 }, { q: "The Howling", y: 1981 },
  { q: "Howling II Your Sister Is a Werewolf", y: 1985 }, { q: "Silver Bullet", y: 1985 },
  { q: "Teen Wolf", y: 1985 }, { q: "The Monster Squad", y: 1987 }, { q: "Wolf", y: 1994 },
  { q: "Ginger Snaps", y: 2000 }, { q: "Ginger Snaps 2 Unleashed", y: 2004 },
  { q: "Ginger Snaps Back The Beginning", y: 2004 }, { q: "Van Helsing", y: 2004 },
  { q: "Blood and Chocolate", y: 2007 }, { q: "The Wolfman", y: 2010 }, { q: "Wer", y: 2013 },
  { q: "Wolves", y: 2014 }, { q: "Late Phases", y: 2014 }, { q: "Howl", y: 2015 },
  { q: "Bad Moon", y: 1996 }, { q: "Cursed", y: 2005 }, { q: "WolfCop", y: 2014 }, { q: "Another WolfCop", y: 2017 },
  // FOUND FOOTAGE
  { q: "The Blair Witch Project", y: 1999 }, { q: "Book of Shadows Blair Witch 2", y: 2000 }, { q: "Blair Witch", y: 2016 },
  { q: "Troll Hunter", y: 2010 }, { q: "The Last Exorcism", y: 2010 }, { q: "The Last Exorcism Part II", y: 2013 },
  { q: "V/H/S", y: 2012 }, { q: "V/H/S/2", y: 2013 }, { q: "V/H/S Viral", y: 2014 },
  { q: "V/H/S/94", y: 2021 }, { q: "V/H/S/99", y: 2022 }, { q: "V/H/S/85", y: 2023 },
  { q: "Chronicle", y: 2012 }, { q: "Willow Creek", y: 2013 }, { q: "Exists", y: 2014 },
  { q: "As Above So Below", y: 2014 }, { q: "Unfriended", y: 2014 }, { q: "Unfriended Dark Web", y: 2018 },
  { q: "The Den", y: 2013 }, { q: "Host", y: 2020 }, { q: "Dashcam", y: 2021 },
  { q: "Hell House LLC", y: 2015 }, { q: "Hell House LLC II The Abaddon Hotel", y: 2018 },
  { q: "Hell House LLC III Lake of Fire", y: 2019 }, { q: "Hell House LLC Origins", y: 2023 },
  { q: "Grave Encounters", y: 2011 }, { q: "Grave Encounters 2", y: 2012 },
  { q: "The Taking of Deborah Logan", y: 2014 }, { q: "Afflicted", y: 2013 },
  { q: "The Sacrament", y: 2013 }, { q: "Creep", y: 2014 }, { q: "Creep 2", y: 2017 },
  { q: "Noroi The Curse", y: 2005 }, { q: "Skinamarink", y: 2022 },
  // FOLK HORROR
  { q: "The Wicker Man", y: 1973 }, { q: "The Wicker Man", y: 2006 },
  { q: "Children of the Corn", y: 1984 }, { q: "Children of the Corn II The Final Sacrifice", y: 1992 },
  { q: "Children of the Corn III Urban Harvest", y: 1995 }, { q: "Children of the Corn", y: 2009 },
  { q: "Children of the Corn", y: 2020 }, { q: "Kill List", y: 2011 }, { q: "A Field in England", y: 2013 },
  { q: "Blood on Satan's Claw", y: 1971 }, { q: "Witchfinder General", y: 1968 },
  { q: "The Wicker Tree", y: 2011 }, { q: "The Borderlands", y: 2013 }, { q: "Consecration", y: 2023 },
  { q: "The Invitation", y: 2022 }, { q: "Lamb", y: 2021 }, { q: "The Green Knight", y: 2021 },
  // COMEDY HORROR
  { q: "Tucker and Dale vs Evil", y: 2010 }, { q: "Beetlejuice", y: 1988 }, { q: "Little Shop of Horrors", y: 1986 },
  { q: "The Rocky Horror Picture Show", y: 1975 }, { q: "Young Frankenstein", y: 1974 },
  { q: "The Frighteners", y: 1996 }, { q: "Idle Hands", y: 1999 },
  { q: "Scary Movie", y: 2000 }, { q: "Scary Movie 2", y: 2001 }, { q: "Scary Movie 3", y: 2003 }, { q: "Scary Movie 4", y: 2006 },
  { q: "The Cabin in the Woods", y: 2012 }, { q: "Happy Death Day", y: 2017 }, { q: "Happy Death Day 2U", y: 2019 },
  { q: "Freaky", y: 2020 }, { q: "The Final Girls", y: 2015 }, { q: "Cocaine Bear", y: 2023 },
  { q: "M3GAN", y: 2022 }, { q: "Totally Killer", y: 2023 }, { q: "Repossessed", y: 1990 },
  { q: "Student Bodies", y: 1981 }, { q: "Krampus", y: 2015 }, { q: "Anna and the Apocalypse", y: 2017 },
  { q: "Deathgasm", y: 2015 }, { q: "House", y: 1977 }, { q: "The Burbs", y: 1989 },
  // ITALIAN HORROR (tagged under actual genres)
  { q: "Inferno", y: 1980 }, { q: "Opera", y: 1987 }, { q: "Deep Red", y: 1975 },
  { q: "Tenebrae", y: 1982 }, { q: "Phenomena", y: 1985 }, { q: "The Cat o Nine Tails", y: 1971 },
  { q: "Four Flies on Grey Velvet", y: 1971 }, { q: "The Bird with the Crystal Plumage", y: 1970 },
  { q: "Zombie", y: 1979 }, { q: "City of the Living Dead", y: 1980 }, { q: "House by the Cemetery", y: 1981 },
  { q: "Don't Torture a Duckling", y: 1972 }, { q: "The New York Ripper", y: 1982 },
  { q: "Bay of Blood", y: 1971 }, { q: "Demons", y: 1985 }, { q: "Demons 2", y: 1986 },
  { q: "Stagefright", y: 1987 }, { q: "The Church", y: 1989 }, { q: "Cemetery Man", y: 1994 },
  // CULT CLASSICS (not already listed above)
  { q: "The People Under the Stairs", y: 1991 }, { q: "The Hidden", y: 1987 },
  { q: "Phantasm", y: 1979 }, { q: "Phantasm II", y: 1988 }, { q: "Phantasm III Lord of the Dead", y: 1994 },
  { q: "Phantasm IV Oblivion", y: 1998 }, { q: "Phantasm Ravager", y: 2016 },
  { q: "The Fog", y: 1980 }, { q: "Blood Simple", y: 1984 }, { q: "Tourist Trap", y: 1979 },
  { q: "Squirm", y: 1976 }, { q: "Sorority House Massacre", y: 1986 }, { q: "Hell Night", y: 1981 },
  { q: "The Stuff", y: 1985 }, { q: "Maximum Overdrive", y: 1986 }, { q: "Leprechaun", y: 1993 },
  { q: "Hellbound Hellraiser II", y: 1988 }, { q: "Hellraiser III Hell on Earth", y: 1992 },
  { q: "Hellraiser Bloodline", y: 1996 }, { q: "Hellraiser Inferno", y: 2000 },
  { q: "Hellraiser Hellseeker", y: 2002 }, { q: "Hellraiser Deader", y: 2005 },
  { q: "Hellraiser Hellworld", y: 2005 }, { q: "Hellraiser", y: 2022 },
  { q: "Waxwork", y: 1988 }, { q: "House", y: 1986 }, { q: "House II The Second Story", y: 1987 },
  { q: "Pulse", y: 1988 }, { q: "Flatliners", y: 1990 }, { q: "Brainscan", y: 1994 },
  { q: "Troll 2", y: 1990 }, { q: "The Sentinel", y: 1977 },
  { q: "We Are What We Are", y: 2013 }, { q: "American Mary", y: 2012 }, { q: "The Innkeepers", y: 2011 },
  { q: "Behind the Mask The Rise of Leslie Vernon", y: 2006 }, { q: "Frailty", y: 2001 },
  { q: "Bubba Ho-Tep", y: 2002 }, { q: "Ravenous", y: 1999 }, { q: "The Faculty", y: 1998 },
  { q: "Phantoms", y: 1998 }, { q: "Terrified", y: 2017 },
];

type MovieResult = {
  id: number; title: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  release_date: string; genre_ids: number[]; popularity: number;
};

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchMovie(query: string, year: number): Promise<MovieResult | null> {
  const res = await fetch(tmdbUrl("/search/movie", { query, year: String(year), language: "en-US" }), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

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

  // Wipe all movies
  await supabase.from("titles").delete().eq("media_type", "movie");

  // Fetch genre map
  const genreRes = await fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" });
  const genreData = await genreRes.json();
  const genreMap: Record<number, string> = Object.fromEntries(
    (genreData.genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  const seen = new Set<number>();
  const payload: object[] = [];
  const notFound: string[] = [];

  // Search in batches of 15 to respect rate limits
  const BATCH = 15;
  for (let i = 0; i < APPROVED.length; i += BATCH) {
    const batch = APPROVED.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((e) => searchMovie(e.q, e.y)));
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (!r) { notFound.push(`${batch[j].q} (${batch[j].y})`); continue; }
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      payload.push({
        tmdb_id: r.id, media_type: "movie", title: r.title,
        overview: r.overview || null, poster_path: r.poster_path, backdrop_path: r.backdrop_path,
        release_year: r.release_date ? parseInt(r.release_date.split("-")[0], 10) : null,
        genres: r.genre_ids.map((id) => genreMap[id]).filter(Boolean),
      });
    }
    if (i + BATCH < APPROVED.length) await new Promise((r) => setTimeout(r, 80));
  }

  // Upsert in chunks of 100
  let imported = 0;
  for (let i = 0; i < payload.length; i += 100) {
    const { count } = await supabase.from("titles").upsert(payload.slice(i, i + 100) as never[], {
      onConflict: "tmdb_id,media_type", count: "exact",
    });
    imported += count ?? 100;
  }

  return NextResponse.json({ success: true, searched: APPROVED.length, imported, notFound: notFound.length, notFoundList: notFound });
}
