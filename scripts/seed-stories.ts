import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const storyChapters = [
  {
    level: 1,
    title: "The Call",
    bodyEn: `Do you hear me? This voice comes from a time far beyond your own. The Tokyo of my era still stands: towers rise into the sky, trains run across steel bridges, neon lights flicker faintly in the mist. Yet the city is hollow. Its streets are empty of warmth, its plazas echo with nothing but footsteps. The laughter, the songs, the countless little gestures that once filled the city with life—gone, as if they never existed.

No one here remembers why it happened. No book explains it, no archive holds the answer. We only know that at some point, people stopped leaving traces. They lived, but they did not record. And so, when the last memory faded, it was as though none of it had ever been.

You may wonder, why you? Why now? Because the traces you leave through your journey—your footsteps, your discoveries, your records—can still travel forward to us. Each image, each story you capture is more than a souvenir; it is evidence of a living Tokyo. Perhaps it is the only way we can rebuild what was lost.

This is your beginning. Walk, observe, and remember—for our future depends on it.`,
    riddleEn: "",
    themeHints: ["trace", "memory", "setup"],
    estReadSec: 90,
  },
  {
    level: 2,
    title: "The Hollow Streets",
    bodyEn: `In the future Tokyo I inhabit, the streets are unnervingly quiet. Not the gentle quiet of a temple courtyard, nor the peaceful hush of falling snow. This silence is different—unnatural. People still move through the city, but they pass without a word, without a glance, without the unspoken music of life.

Once, the city was filled with subtle sounds of connection: a shopkeeper calling out a greeting, friends laughing softly over tea, footsteps that paused because someone had noticed another's smile. These were not loud or chaotic, but they carried warmth. Over time, when such moments were no longer remembered, people stopped seeking them. The city became efficient, orderly, and lifeless.

Your record reached us: a fragment where two people shared even a brief exchange, a voice answered by another. To us, it was a revelation. People here stared in awe, realizing what we had lost was not noise, but recognition—one person acknowledging another.

So I leave you this riddle: If no one acknowledges you, does your presence leave a trace?`,
    riddleEn: "If no one acknowledges you, does your presence leave a trace?",
    themeHints: ["recognition", "trace", "memory"],
    estReadSec: 120,
  },
  {
    level: 3,
    title: "The Vanished Wish",
    bodyEn: `In the Tokyo of the future, no one makes wishes anymore. People walk, work, and sleep, but they never pause, never look up, never entrust a dream to something beyond themselves. Hope has been reduced to a fragile superstition, spoken of only in half-forgotten tales.

Long ago, people whispered wishes into the air: prayers at shrines, promises written on slips of paper, dreams murmured beneath the stars. These acts were not guarantees, yet they carried power. They reminded people that their lives were part of something larger, that they were connected across time by their hopes.

But when such traditions were no longer remembered, when no record remained to show their meaning, a generation arose that had never seen anyone make a wish. And what you never see, you never learn. Hope was abandoned—not because it failed, but because it was forgotten.

Then your record arrived. It showed even a small gesture—a hand clasped, eyes closed, someone pausing with quiet determination. To us, it was extraordinary. For the first time in centuries, people tried it themselves.

Here is my question for you: If a wish is never recorded, can hope survive?`,
    riddleEn: "If a wish is never recorded, can hope survive?",
    themeHints: ["hope", "record", "memory"],
    estReadSec: 135,
  },
  {
    level: 4,
    title: "The Gray City",
    bodyEn: `I want you to picture the city we live in. Imagine endless towers, their glass shining but empty, roads where people walk quickly but never pause. Everything functions, everything works—yet nothing feels alive. The city is gray, not only in stone and steel, but in spirit.

Why did this happen? Once, people chose efficiency above all else. Beauty was dismissed as unnecessary, decoration as waste. Slowly, color disappeared from daily life. It was not taken violently; it simply faded, because no one cared enough to preserve it.

And then your fragment appeared. A single scene—perhaps a banner fluttering, a painted wall, the glow of a lantern. To us, it was startling. People gathered to watch, whispering, "So the city once had color." Some laughed awkwardly, some cried without knowing why. And from that moment, a few began painting walls, carrying bright cloths, trying to imitate what was seen.

We had forgotten that color is not luxury. It is memory. It tells us who we are.

So I ask you this: If colors fade without memory, does the city still have a soul?`,
    riddleEn: "If colors fade without memory, does the city still have a soul?",
    themeHints: ["color", "identity", "memory"],
    estReadSec: 120,
  },
  {
    level: 5,
    title: "The Broken Memory",
    bodyEn: `There is something missing in our world that is harder to describe than sound or color. It is memory. People in this future wake, work, eat, and sleep, but when you ask them what happened yesterday, their eyes grow vacant. They truly do not know. Days slip away like water through open hands.

Long ago, memory was preserved—through journals, photographs, even simple conversations at the end of the day. But when leaders declared such things unnecessary, when people began to live only for the moment, memory dissolved. Without records, there was nothing to remind them of who they were, what they loved, or why they endured. History itself fractured into silence.

And then your fragment arrived. Perhaps it was nothing more than a fleeting gesture—someone pausing to remember, to look back before moving forward. Yet when people here saw it, something shifted. They touched their heads, straining to recall their own moments. Some whispered names they thought they had forgotten. For the first time in centuries, memories returned.

So consider this: If an event leaves no record, did it truly happen?`,
    riddleEn: "If an event leaves no record, did it truly happen?",
    themeHints: ["memory", "history"],
    estReadSec: 135,
  },
  {
    level: 6,
    title: "The Abandoned Smile",
    bodyEn: `There is one absence that hurts more than all the rest. It is the absence of joy. In this Tokyo, children grow up without learning how to laugh. Adults move through life with solemn faces, never smiling, as if joy is a language they no longer understand.

How did we come to this? At first, it was subtle. People stopped sharing their happiness, believing it was too fragile, too fleeting to matter. If joy could not be preserved, why waste energy expressing it? And so, smiles disappeared—not because life was unbearable, but because people convinced themselves joy had no value.

Your record broke that silence. A face lit up, eyes crinkled, a moment of laughter caught in time. When people here saw it, they were stunned. Children tried to mimic the expression, awkward at first, then genuine. Parents, watching, felt their lips tremble into unfamiliar curves. Soon, laughter returned—not perfectly, but enough to remind us of what had been lost.

So here is my riddle: If no one remembers laughter, does joy still exist?`,
    riddleEn: "If no one remembers laughter, does joy still exist?",
    themeHints: ["joy", "share", "memory"],
    estReadSec: 120,
  },
  {
    level: 7,
    title: "The Broken Bond",
    bodyEn: `I must speak plainly now. I am afraid. For in my Tokyo, no one reaches for another's hand. I have lived my whole life in a city where people walk alone, work alone, and even die alone. We were taught that bonds are fragile, unreliable, dangerous. And so, we obeyed. We built walls around our hearts until even loneliness felt normal.

Do you know what it is like to sit in a crowded train and feel no connection at all? To know the faces around you, but never once meet their eyes? That is the life we inherited. Efficient, yes. Safe, perhaps. But unbearably hollow.

When your record appeared, I wept. I am not ashamed to admit it. I saw people together—shoulders close, voices overlapping, laughter shared without fear. I realized then that bonds are not weakness. They are strength. Without them, even the strongest city crumbles.

So answer me this: If bonds are never preserved, can connection endure?`,
    riddleEn: "If bonds are never preserved, can connection endure?",
    themeHints: ["bond", "connection", "memory"],
    estReadSec: 135,
  },
  {
    level: 8,
    title: "The Erased Culture",
    bodyEn: `I want to tell you what hurts most. It is not silence, nor gray streets, nor even loneliness. It is the absence of culture. In my world, there are no songs to sing, no games to play, no celebrations to mark the passing of time. Children grow old without ever learning how to dance. Adults work until they collapse, but never pause to create.

How did it vanish? We were told culture was useless. Festivals were distractions. Music was noise. Play was unproductive. And because no one left records to remind us of its worth, people believed the lie. The city grew more efficient, more controlled, and infinitely colder.

Then your fragment arrived. It showed something simple—someone humming as they walked, children playing, maybe a crowd swaying together. I cannot describe what it did to us. People cried, not because they understood, but because they felt. The heart remembers even when the mind forgets.

So let me leave you this: If culture is erased from memory, is humanity still whole?`,
    riddleEn: "If culture is erased from memory, is humanity still whole?",
    themeHints: ["culture", "humanity", "memory"],
    estReadSec: 135,
  },
  {
    level: 9,
    title: "The Final Puzzle",
    bodyEn: `I cannot hide it any longer. You deserve the truth.

Why did our city lose its heart? Why did voices, smiles, bonds, and culture vanish?

It was not stolen by some enemy. There was no great disaster, no sudden collapse.

It was quieter. Slower. More dangerous.

We stopped remembering.

We stopped recording.

And when nothing is remembered, it is as if it never existed.

At first, it was harmless. A few festivals left unmarked. A story untold. A photograph never taken. People said, "It doesn't matter. Life goes on." And so they stopped.

One generation later, no one knew what they had lost. Another generation later, they believed there had never been anything to lose. Forgetting became our law. Silence became our truth. And soon, an entire city stood hollow.

But your journey… it has broken this chain. Every fragment you send proves that something once existed—something worth cherishing.

So now the last riddle: If nothing at all is remembered, does humanity vanish with it?`,
    riddleEn: "If nothing at all is remembered, does humanity vanish with it?",
    themeHints: ["truth", "record", "memory"],
    estReadSec: 150,
  },
  {
    level: 10,
    title: "The City of Hope",
    bodyEn: `It has happened. I can see it with my own eyes.

The city is no longer gray. Colors bloom where stone once ruled. Lanterns shine, cloth flutters in the wind, walls glow with paint and light. People are laughing—yes, laughing—voices rising into the air without fear. Children run, calling each other's names, while elders smile as though remembering something they thought was gone forever.

The silence has broken. The emptiness has lifted. Bonds, culture, memory—all have returned, not perfectly, not completely, but enough to make this city alive again. And it is because of you. Every step you took, every record you left, became a seed planted in our barren soil. And those seeds have grown.

Do you remember the riddles we asked along the way? Each one was about memory, about record, about what remains when time moves on. The answer was always the same: without record, nothing endures. Not joy, not bonds, not culture, not even life itself. And yet, you carried them forward. You proved they could last.

Thank you, traveler. Thank you, recorder of life.

TokyoQuest is not just a game. It's a record for the future`,
    riddleEn: "",
    themeHints: ["resolution", "memory", "color"],
    estReadSec: 120,
  },
];

async function seedStories() {
  console.log("🌱 Seeding story chapters...");

  for (const chapter of storyChapters) {
    await prisma.storyChapter.upsert({
      where: { level: chapter.level },
      update: chapter,
      create: chapter,
    });
    console.log(`✅ Seeded Level ${chapter.level}: ${chapter.title}`);
  }

  console.log("🎉 Story chapters seeded successfully!");
}

seedStories()
  .catch((e) => {
    console.error("❌ Error seeding stories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
