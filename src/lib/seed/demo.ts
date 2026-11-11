import { addDays, startOfMonth, subDays, subMonths, subYears } from 'date-fns';
import type { Day, DaySignals, Media, Piece, Recap, Ribbon, RibbonLabel } from '@shared/types';
import { db } from '../db/db';
import { dateKey, monthKey, parseDateKey } from '../db/dates';
import { newId, ribbonId } from '../db/ids';
import { ensureSettings, kvGet } from '../db/repositories';
import { piecesHash } from '../ai/hash';

export const DEMO_LOADED_KEY = 'demo:loaded';
const DEMO_DAYS_KEY = 'demo:dayKeys';
const DEMO_RECAPS_KEY = 'demo:recapIds';

type DemoPieceSpec = {
  kind: 'text' | 'voice' | 'photo' | 'video';
  text: string;
  media?: string;
  addedLater?: boolean;
};

type DemoStoryParagraph = {
  text: string;
  sources: number[];
};

type DemoDaySpec = {
  date: string;
  heading: string;
  pieces: DemoPieceSpec[];
  story: DemoStoryParagraph[];
  people?: string[];
  places?: string[];
  ribbon?: { label: RibbonLabel; pieceIndex: number; quote: string };
};

function at(date: string, hour: number, minute = 0): number {
  const day = parseDateKey(date);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
}

function dayKey(base: Date, offset = 0): string {
  return dateKey(addDays(base, offset));
}

function makeSpecs(): DemoDaySpec[] {
  const today = new Date();
  const lastMonth = startOfMonth(subMonths(today, 1));
  const yearAgo = subYears(today, 1);
  const twoYears = subYears(today, 2);
  const threeYears = subYears(today, 3);
  const fiveYears = subYears(today, 5);

  const base: DemoDaySpec[] = [
    {
      date: dayKey(today),
      heading: 'The long way home',
      pieces: [
        {
          kind: 'text',
          text: 'It rained all morning, so I took the long way home past the bakery. The woman at the counter remembered my name and gave me the last cinnamon roll. I ate it standing under the awning while the street shone.',
        },
        {
          kind: 'voice',
          text: 'I called Ana on the walk back. She said the garden is finally coming in, and that I should come see it before the tomatoes go.',
        },
        {
          kind: 'photo',
          text: 'The bakery awning, wet and bright.',
          media: 'bakery',
        },
      ],
      story: [
        {
          text: 'It rained all morning, so I took the long way home past the bakery. The woman at the counter remembered my name and gave me the last cinnamon roll.',
          sources: [0, 1],
        },
        {
          text: 'I ate it under the awning while the street shone, then called Ana. The garden is finally coming in, she said, and I should come before the tomatoes go.',
          sources: [1, 2],
        },
      ],
      people: ['Ana'],
      places: ['the bakery'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'remembered my name' },
    },
    {
      date: dayKey(today, -1),
      heading: 'A small kindness',
      pieces: [
        {
          kind: 'text',
          text: "The neighbor's cat was on the wall again. I sat with Mrs. Alvarez while she waited for the plumber, and she told me about the summer she spent in Cádiz. She laughed when I said I had never been.",
        },
        {
          kind: 'voice',
          text: 'I left her a bag of oranges. It felt like the smallest thing, but she held my hand at the door.',
        },
      ],
      story: [
        {
          text: "The neighbor's cat was on the wall again. I sat with Mrs. Alvarez while she waited for the plumber, and she told me about the summer she spent in Cádiz.",
          sources: [0],
        },
        {
          text: 'I left her a bag of oranges. It felt like the smallest thing, but she held my hand at the door.',
          sources: [1],
        },
      ],
      people: ['Mrs. Alvarez'],
      places: ['Cádiz'],
      ribbon: { label: 'Tender', pieceIndex: 1, quote: 'held my hand at the door' },
    },
    {
      date: dayKey(today, -2),
      heading: 'The quiet desk',
      pieces: [
        {
          kind: 'text',
          text: 'I cleared the desk. Under the receipts I found the postcard from Lisbon, the one with the yellow tram. I pinned it above the lamp and wrote for an hour without stopping.',
        },
      ],
      story: [
        {
          text: 'I cleared the desk and found the postcard from Lisbon, the one with the yellow tram. I pinned it above the lamp and wrote for an hour without stopping.',
          sources: [0],
        },
      ],
      places: ['Lisbon'],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'wrote for an hour without stopping' },
    },
    {
      date: dayKey(today, -4),
      heading: 'Dinner with Ana',
      pieces: [
        {
          kind: 'text',
          text: 'Ana brought bread and a jar of olives. We cooked too much pasta and argued about whether the sauce needed lemon. It did.',
        },
        {
          kind: 'photo',
          text: 'The table after dinner, plates and candle wax.',
          media: 'dinner',
        },
        {
          kind: 'video',
          text: 'A short clip of rain on the kitchen window.',
          media: 'video',
        },
      ],
      story: [
        {
          text: 'Ana brought bread and a jar of olives. We cooked too much pasta and argued about whether the sauce needed lemon. It did.',
          sources: [0, 1, 2],
        },
      ],
      people: ['Ana'],
      places: ['the kitchen'],
      ribbon: { label: 'Funny', pieceIndex: 0, quote: 'argued about whether the sauce needed lemon' },
    },
    {
      date: dayKey(today, -7),
      heading: 'The old road',
      pieces: [
        {
          kind: 'text',
          text: 'I drove the old road to the reservoir. The water was low and the reeds were loud. I sat on the hood until the light went orange.',
        },
      ],
      story: [
        {
          text: 'I drove the old road to the reservoir. The water was low and the reeds were loud. I sat on the hood until the light went orange.',
          sources: [0],
        },
      ],
      places: ['the reservoir'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'until the light went orange' },
    },
    {
      date: dayKey(today, -10),
      heading: 'A hard afternoon',
      pieces: [
        {
          kind: 'text',
          text: 'The meeting went badly. I said too much and then said nothing at all. I walked to the park and sat by the fountain until my hands stopped shaking.',
        },
        {
          kind: 'voice',
          text: 'I keep thinking I should have apologized. Maybe tomorrow I will.',
        },
      ],
      story: [
        {
          text: 'The meeting went badly. I said too much and then said nothing at all. I walked to the park and sat by the fountain until my hands stopped shaking.',
          sources: [0],
        },
        {
          text: 'I keep thinking I should have apologized. Maybe tomorrow I will.',
          sources: [1],
        },
      ],
      places: ['the park'],
      ribbon: { label: 'Hard', pieceIndex: 0, quote: 'said too much and then said nothing at all' },
    },
    {
      date: dayKey(today, -14),
      heading: 'The market',
      pieces: [
        {
          kind: 'text',
          text: 'At the market I bought figs and a bad melon. The melon seller insisted it was perfect. We both knew it was not.',
        },
        {
          kind: 'photo',
          text: 'Figs in a paper bag on the counter.',
          media: 'market',
        },
      ],
      story: [
        {
          text: 'At the market I bought figs and a bad melon. The melon seller insisted it was perfect. We both knew it was not.',
          sources: [0, 1],
        },
      ],
      places: ['the market'],
      ribbon: { label: 'Funny', pieceIndex: 0, quote: 'We both knew it was not.' },
    },
    {
      date: dayKey(today, -21),
      heading: 'The first cold morning',
      pieces: [
        {
          kind: 'text',
          text: 'The first cold morning. I found my coat in the back of the closet and a ticket stub from the train in the pocket. I kept the ticket.',
        },
      ],
      story: [
        {
          text: 'The first cold morning. I found my coat in the back of the closet and a ticket stub from the train in the pocket. I kept the ticket.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'I kept the ticket.' },
    },
    {
      date: dateKey(addDays(lastMonth, 2)),
      heading: 'The train north',
      pieces: [
        {
          kind: 'text',
          text: 'The train north was almost empty. A woman across the aisle read a book with a broken spine. The sea appeared all at once, gray and steady, and I stopped pretending to sleep.',
        },
      ],
      story: [
        {
          text: 'The train north was almost empty. A woman across the aisle read a book with a broken spine. The sea appeared all at once, gray and steady, and I stopped pretending to sleep.',
          sources: [0],
        },
      ],
      places: ['the north'],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'stopped pretending to sleep' },
    },
    {
      date: dateKey(addDays(lastMonth, 6)),
      heading: 'A borrowed book',
      pieces: [
        {
          kind: 'text',
          text: 'Sam lent me a book and wrote in the margin on page forty: “This is the part I meant.” I read it twice and left the note where it was.',
        },
      ],
      story: [
        {
          text: 'Sam lent me a book and wrote in the margin on page forty: “This is the part I meant.” I read it twice and left the note where it was.',
          sources: [0],
        },
      ],
      people: ['Sam'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'This is the part I meant.' },
    },
    {
      date: dateKey(addDays(lastMonth, 11)),
      heading: 'The kitchen at midnight',
      pieces: [
        {
          kind: 'text',
          text: 'I made tea at midnight and saw a fox cross the yard. It stopped under the pear tree, looked at the window, and went on. I stood there until the kettle clicked.',
        },
      ],
      story: [
        {
          text: 'I made tea at midnight and saw a fox cross the yard. It stopped under the pear tree, looked at the window, and went on. I stood there until the kettle clicked.',
          sources: [0],
        },
      ],
      places: ['the yard'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'until the kettle clicked' },
    },
    {
      date: dateKey(addDays(lastMonth, 16)),
      heading: 'The long call',
      pieces: [
        {
          kind: 'voice',
          text: 'I called my mother and we talked for an hour about nothing. She asked if I was eating. I asked if she was sleeping. We both lied a little.',
        },
      ],
      story: [
        {
          text: 'I called my mother and we talked for an hour about nothing. She asked if I was eating. I asked if she was sleeping. We both lied a little.',
          sources: [0],
        },
      ],
      people: ['my mother'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'We both lied a little.' },
    },
    {
      date: dateKey(addDays(lastMonth, 21)),
      heading: 'Rain on the roof',
      pieces: [
        {
          kind: 'text',
          text: 'Rain on the roof all afternoon. I read on the floor with a blanket over my legs and did not answer the phone. It was the quietest hour of the month.',
        },
      ],
      story: [
        {
          text: 'Rain on the roof all afternoon. I read on the floor with a blanket over my legs and did not answer the phone. It was the quietest hour of the month.',
          sources: [0],
        },
      ],
    },
    {
      date: dateKey(addDays(lastMonth, 26)),
      heading: 'A new recipe',
      pieces: [
        {
          kind: 'text',
          text: 'I made the soup from the torn page in the drawer. Too much thyme, not enough salt. I ate two bowls and decided it was good anyway.',
        },
        {
          kind: 'photo',
          text: 'The pot on the stove, steam on the window.',
          media: 'soup',
        },
      ],
      story: [
        {
          text: 'I made the soup from the torn page in the drawer. Too much thyme, not enough salt. I ate two bowls and decided it was good anyway.',
          sources: [0, 1],
        },
      ],
      places: ['the kitchen'],
      ribbon: { label: 'Proud', pieceIndex: 0, quote: 'decided it was good anyway' },
    },
    {
      date: dayKey(yearAgo, 0),
      heading: 'The same bench',
      pieces: [
        {
          kind: 'text',
          text: 'I sat on the same bench as last year. The tree had grown past the railing. I thought about how much can change without anyone announcing it.',
        },
        {
          kind: 'voice',
          text: 'I brought the blue notebook and wrote one page. It was enough.',
          addedLater: true,
        },
      ],
      story: [
        {
          text: 'I sat on the same bench as last year. The tree had grown past the railing. I thought about how much can change without anyone announcing it.',
          sources: [0],
        },
        {
          text: 'I brought the blue notebook and wrote one page. It was enough.',
          sources: [1],
        },
      ],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'how much can change without anyone announcing it' },
    },
    {
      date: dayKey(yearAgo, -11),
      heading: 'A year of small things',
      pieces: [
        {
          kind: 'text',
          text: 'A year ago I started writing things down. Not the big things, mostly the small ones: receipts, weather, the names of streets. Tonight I read the first page and recognized myself.',
        },
      ],
      story: [
        {
          text: 'A year ago I started writing things down. Not the big things, mostly the small ones: receipts, weather, the names of streets. Tonight I read the first page and recognized myself.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Proud', pieceIndex: 0, quote: 'recognized myself' },
    },
    {
      date: dayKey(yearAgo, -20),
      heading: 'The blue door',
      pieces: [
        {
          kind: 'text',
          text: 'The blue door on the corner was open. Inside, a woman was repainting the frame. She said the color was called harbor. I walked home thinking about that word.',
        },
      ],
      story: [
        {
          text: 'The blue door on the corner was open. Inside, a woman was repainting the frame. She said the color was called harbor. I walked home thinking about that word.',
          sources: [0],
        },
      ],
    },
    {
      date: dayKey(yearAgo, 13),
      heading: 'The ferry',
      pieces: [
        {
          kind: 'text',
          text: 'I took the ferry across for no reason. The wind was cold and the water was the color of old glass. A man beside me fed pieces of bread to the gulls.',
        },
      ],
      story: [
        {
          text: 'I took the ferry across for no reason. The wind was cold and the water was the color of old glass. A man beside me fed pieces of bread to the gulls.',
          sources: [0],
        },
      ],
      places: ['the ferry'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'the color of old glass' },
    },
    {
      date: dayKey(yearAgo, 26),
      heading: 'The letter',
      pieces: [
        {
          kind: 'text',
          text: 'I found the letter I never sent. The paper had gone soft at the folds. I read it once, put it back in the drawer, and did not write a new one.',
        },
      ],
      story: [
        {
          text: 'I found the letter I never sent. The paper had gone soft at the folds. I read it once, put it back in the drawer, and did not write a new one.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'did not write a new one' },
    },
    {
      date: dayKey(twoYears, -15),
      heading: 'The first apartment',
      pieces: [
        {
          kind: 'text',
          text: 'The first apartment had one window and a radiator that knocked all night. I thought it was temporary. I lived there for two years.',
        },
      ],
      story: [
        {
          text: 'The first apartment had one window and a radiator that knocked all night. I thought it was temporary. I lived there for two years.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Funny', pieceIndex: 0, quote: 'I thought it was temporary. I lived there for two years.' },
    },
    {
      date: dayKey(twoYears, 0),
      heading: 'The anniversary dinner',
      pieces: [
        {
          kind: 'text',
          text: 'We ate at the same table as the year before. The menu had changed, and so had we. I ordered the thing I always order, because some things should stay.',
        },
        {
          kind: 'photo',
          text: 'Two glasses and a candle at the corner table.',
          media: 'dinner',
        },
      ],
      story: [
        {
          text: 'We ate at the same table as the year before. The menu had changed, and so had we. I ordered the thing I always order, because some things should stay.',
          sources: [0, 1],
        },
      ],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'some things should stay' },
    },
    {
      date: dayKey(twoYears, 19),
      heading: 'The long winter',
      pieces: [
        {
          kind: 'text',
          text: 'The winter was long and quiet. I learned to make bread and ruined three loaves before one rose. I kept the ruined ones in a bowl until spring.',
        },
      ],
      story: [
        {
          text: 'The winter was long and quiet. I learned to make bread and ruined three loaves before one rose. I kept the ruined ones in a bowl until spring.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Proud', pieceIndex: 0, quote: 'before one rose' },
    },
    {
      date: dayKey(twoYears, 41),
      heading: 'The move',
      pieces: [
        {
          kind: 'voice',
          text: 'We carried the boxes up three flights and sat on the floor eating cold noodles. The apartment smelled like paint. It felt like the start of something.',
        },
      ],
      story: [
        {
          text: 'We carried the boxes up three flights and sat on the floor eating cold noodles. The apartment smelled like paint. It felt like the start of something.',
          sources: [0],
        },
      ],
      places: ['the apartment'],
    },
    {
      date: dayKey(threeYears, -31),
      heading: 'The old kitchen',
      pieces: [
        {
          kind: 'text',
          text: 'The old kitchen had a window over the sink and a shelf where the paint had worn through. I used to stand there in the morning and watch the street wake up.',
        },
      ],
      story: [
        {
          text: 'The old kitchen had a window over the sink and a shelf where the paint had worn through. I used to stand there in the morning and watch the street wake up.',
          sources: [0],
        },
      ],
      places: ['the old kitchen'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'watch the street wake up' },
    },
    {
      date: dayKey(threeYears, 0),
      heading: 'The three-year mark',
      pieces: [
        {
          kind: 'text',
          text: 'Three years since I started this notebook. I read a page from the beginning and found a sentence I still believe: keep the small things and the years will take care of themselves.',
        },
      ],
      story: [
        {
          text: 'Three years since I started this notebook. I read a page from the beginning and found a sentence I still believe: keep the small things and the years will take care of themselves.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Proud', pieceIndex: 0, quote: 'keep the small things and the years will take care of themselves' },
    },
    {
      date: dayKey(threeYears, 61),
      heading: 'The garden',
      pieces: [
        {
          kind: 'text',
          text: 'The garden finally came in. The tomatoes were small and split at the top, but they tasted like the summer I remembered. I gave half of them away.',
        },
      ],
      story: [
        {
          text: 'The garden finally came in. The tomatoes were small and split at the top, but they tasted like the summer I remembered. I gave half of them away.',
          sources: [0],
        },
      ],
      places: ['the garden'],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'the summer I remembered' },
    },
    {
      date: dayKey(fiveYears, -5),
      heading: 'The beginning',
      pieces: [
        {
          kind: 'text',
          text: 'I bought the first notebook from the shop by the station. It had a green cover and a ribbon marker. I wrote the date on the first page and then sat there for twenty minutes.',
        },
      ],
      story: [
        {
          text: 'I bought the first notebook from the shop by the station. It had a green cover and a ribbon marker. I wrote the date on the first page and then sat there for twenty minutes.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Honest', pieceIndex: 0, quote: 'sat there for twenty minutes' },
    },
    {
      date: dayKey(fiveYears, 0),
      heading: 'The five-year mark',
      pieces: [
        {
          kind: 'text',
          text: 'Five years of pages. I do not remember most of the days, but I remember the person who wrote them. She was trying to pay attention.',
        },
        {
          kind: 'voice',
          text: 'I am still trying.',
        },
      ],
      story: [
        {
          text: 'Five years of pages. I do not remember most of the days, but I remember the person who wrote them. She was trying to pay attention.',
          sources: [0],
        },
        {
          text: 'I am still trying.',
          sources: [1],
        },
      ],
      ribbon: { label: 'Honest', pieceIndex: 1, quote: 'I am still trying.' },
    },
    {
      date: dayKey(fiveYears, 32),
      heading: 'The first page',
      pieces: [
        {
          kind: 'text',
          text: 'The first page was about the weather, because I did not know what else to write. It rained. I made tea. That was the whole day, and it was enough.',
        },
      ],
      story: [
        {
          text: 'The first page was about the weather, because I did not know what else to write. It rained. I made tea. That was the whole day, and it was enough.',
          sources: [0],
        },
      ],
      ribbon: { label: 'Tender', pieceIndex: 0, quote: 'That was the whole day, and it was enough.' },
    },
  ];

  return withExtraDays(base, today);
}

function withExtraDays(base: DemoDaySpec[], today: Date): DemoDaySpec[] {
  const used = new Set<string>();
  const uniqueBase = base.map((spec) => {
    let date = spec.date;
    let offset = -1;
    while (used.has(date)) {
      date = dayKey(parseDateKey(spec.date), offset);
      offset -= 1;
    }
    used.add(date);
    return date === spec.date ? spec : { ...spec, date };
  });
  const entries: Array<{ date: string; heading: string; text: string }> = [
    {
      date: dayKey(today, -33),
      heading: 'The borrowed umbrella',
      text: 'I borrowed an umbrella from the café and forgot to return it. The rain stopped before I reached the corner.',
    },
    {
      date: dayKey(today, -39),
      heading: 'A slow Sunday',
      text: 'I did not leave the apartment until four. I made coffee twice and read the same page three times.',
    },
    {
      date: dayKey(today, -46),
      heading: "The neighbor's radio",
      text: 'The neighbor played the same song all afternoon. I opened the window to hear it better.',
    },
    {
      date: dayKey(today, -54),
      heading: 'A small repair',
      text: 'I sewed the button back on the coat. It took ten minutes and made the whole week feel less frayed.',
    },
    {
      date: dayKey(today, -62),
      heading: 'The wrong bus',
      text: 'I took the wrong bus and ended up by the river. I was not sorry.',
    },
    {
      date: dayKey(today, -71),
      heading: 'A letter from Sam',
      text: 'Sam wrote a postcard from the coast. The handwriting was small and the stamp was crooked.',
    },
    {
      date: dayKey(today, -79),
      heading: 'The first frost',
      text: 'The first frost silvered the roof. I stood at the window with my hands around the cup.',
    },
    {
      date: dayKey(today, -91),
      heading: 'The library',
      text: 'I read in the library until closing. The woman at the desk did not ask me to leave.',
    },
    {
      date: dayKey(today, -103),
      heading: 'The long walk',
      text: 'I walked to the edge of town and back. The road smelled like cut grass and diesel.',
    },
    {
      date: dayKey(today, -117),
      heading: 'The old song',
      text: 'A song came on in the shop and I had to stand still until it ended.',
    },
    {
      date: dayKey(today, -132),
      heading: 'The new chair',
      text: 'I found a chair on the sidewalk with a note that said free. I carried it home and it fits the corner.',
    },
    {
      date: dayKey(today, -151),
      heading: 'The quiet house',
      text: 'The house was quiet in a way that felt like company. I made soup and listened to the radiators.',
    },
    {
      date: dayKey(today, -173),
      heading: 'The first snow',
      text: 'The first snow did not settle, but it came. I watched it from the doorway.',
    },
    {
      date: dayKey(subYears(today, 1), -37),
      heading: 'The borrowed coat',
      text: 'I borrowed a coat and found a train ticket in the pocket. I kept the ticket.',
    },
    {
      date: dayKey(subYears(today, 1), -64),
      heading: 'The long table',
      text: 'We pushed two tables together and ate until the candles were stubs.',
    },
    {
      date: dayKey(subYears(today, 2), -44),
      heading: 'The green notebook',
      text: 'I filled the green notebook and bought another. The shelf is beginning to lean.',
    },
    {
      date: dayKey(subYears(today, 2), -83),
      heading: 'The winter walk',
      text: 'We walked to the water and back. The wind made my eyes water and we laughed at nothing.',
    },
    {
      date: dayKey(subYears(today, 3), -52),
      heading: 'The old map',
      text: 'I found an old map in the drawer with a circle around a town I have never visited.',
    },
    {
      date: dayKey(subYears(today, 5), -78),
      heading: 'The first entry',
      text: 'I wrote the first entry in a café by the station. The table wobbled and I used a sugar packet to steady it.',
    },
    {
      date: dayKey(subYears(today, 5), -140),
      heading: 'The blue cup',
      text: 'I bought a blue cup from the market. It has a chip on the rim and I use it every morning.',
    },
  ];

  const extra = entries
    .filter((entry) => !used.has(entry.date))
    .map<DemoDaySpec>((entry) => ({
      date: entry.date,
      heading: entry.heading,
      pieces: [{ kind: 'text', text: entry.text }],
      story: [{ text: entry.text, sources: [0] }],
    }));

  return [...uniqueBase, ...extra];
}

function svgPhoto(label: string, sky: string, ground: string): Blob {
  const safe = label.replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky}" />
      <stop offset="1" stop-color="#F4EAD9" />
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${ground}" />
      <stop offset="1" stop-color="#C7B49E" />
    </linearGradient>
  </defs>
  <rect width="800" height="560" fill="url(#sky)" />
  <circle cx="620" cy="128" r="58" fill="#E8C89D" opacity="0.8" />
  <path d="M0 360 Q180 300 360 350 T800 330 V560 H0 Z" fill="url(#ground)" />
  <path d="M0 420 Q220 370 430 410 T800 400 V560 H0 Z" fill="#B2967A" opacity="0.45" />
  <path d="M330 390 v-90 M330 330 q-45 -30 -70 -5 M330 315 q45 -38 82 -12" stroke="#5E4A39" stroke-width="9" fill="none" stroke-linecap="round" />
  <rect x="60" y="470" width="680" height="1" fill="#8C7A68" opacity="0.35" />
  <text x="60" y="520" fill="#4B3A2D" font-family="Georgia, serif" font-size="24" opacity="0.72">${safe}</text>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

function photoBlob(key: string): Blob {
  switch (key) {
    case 'bakery':
      return svgPhoto('the bakery awning', '#D9C6AE', '#A9876A');
    case 'dinner':
      return svgPhoto('the table after dinner', '#D8BFA8', '#8B6A54');
    case 'market':
      return svgPhoto('figs in a paper bag', '#D6C3A7', '#A78A6A');
    case 'soup':
      return svgPhoto('the pot on the stove', '#D9CBB8', '#A58A6E');
    case 'video':
      return svgPhoto('rain on the kitchen window', '#C9C2B6', '#8C8275');
    default:
      return svgPhoto('the pot on the stove', '#D9CBB8', '#A58A6E');
  }
}

export async function isDemoLoaded(): Promise<boolean> {
  return (await kvGet<boolean>(DEMO_LOADED_KEY)) ?? false;
}

export async function loadDemoDiary(): Promise<{ days: number; pieces: number }> {
  if (await isDemoLoaded()) return { days: 0, pieces: 0 };
  const existing = await db.pieces.filter((piece) => piece.source === 'demo').count();
  if (existing > 0) await removeDemoDiary();
  const settings = await ensureSettings();

  const specs = makeSpecs();
  const now = Date.now();
  const dayKeys: string[] = [];
  const recapIds: string[] = [];
  let pieceCount = 0;

  await db.transaction(
    'rw',
    [db.days, db.pieces, db.ribbons, db.recaps, db.media, db.daySignals, db.kv, db.settings],
    async () => {
      for (const spec of specs) {
        dayKeys.push(spec.date);
        const pieces: Piece[] = [];
        for (const [index, pieceSpec] of spec.pieces.entries()) {
          const createdAt = at(spec.date, 8 + index, 30);
          let mediaId: string | undefined;
          if (pieceSpec.media) {
            const media: Media = {
              id: newId('media'),
              kind: pieceSpec.kind === 'video' ? 'video' : 'photo',
              mimeType: 'image/svg+xml',
              blob: photoBlob(pieceSpec.media),
              fileName: `${pieceSpec.media}.svg`,
              createdAt,
              demo: true,
            };
            await db.media.put(media);
            mediaId = media.id;
          }
          pieces.push({
            id: `demo-${spec.date}-${index}`,
            date: spec.date,
            kind: pieceSpec.kind,
            text: pieceSpec.text,
            originalText: pieceSpec.text,
            polishedText: pieceSpec.kind === 'text' || pieceSpec.kind === 'voice' ? pieceSpec.text : undefined,
            polishStatus: 'polished',
            isFavorite: index === 0 && (spec.ribbon?.label === 'Tender' || spec.ribbon?.label === 'Proud'),
            source: 'demo',
            addedLater: pieceSpec.addedLater ?? false,
            createdAt,
            updatedAt: createdAt,
            capturedAt: createdAt,
            mediaId,
            polishedAt: createdAt,
          });
        }
        pieceCount += pieces.length;
        await db.pieces.bulkPut(pieces);

        const story = {
          heading: spec.heading,
          paragraphs: spec.story.map((paragraph) => ({
            text: paragraph.text,
            sourcePieceIds: paragraph.sources
              .map((index) => pieces[index]?.id)
              .filter((id): id is string => Boolean(id)),
          })),
          form: 'full' as const,
          generatedAt: now,
        };
        const day: Day = {
          date: spec.date,
          heading: spec.heading,
          story,
          storyStatus: 'ready',
          storySourceHash: piecesHash(pieces),
          storyUpdatedAt: now,
          createdAt: pieces[0]?.createdAt ?? now,
          updatedAt: now,
        };
        await db.days.put(day);

        if (spec.ribbon) {
          const source = pieces[spec.ribbon.pieceIndex] ?? pieces[0];
          const index = source?.text.indexOf(spec.ribbon.quote) ?? -1;
          if (source) {
            const quote = index >= 0 ? spec.ribbon.quote : source.text.slice(0, Math.min(80, source.text.length));
            const ribbon: Ribbon = {
              id: ribbonId(spec.date, spec.ribbon.label),
              date: spec.date,
              label: spec.ribbon.label,
              quote,
              pieceId: source.id,
              sourcePieceIds: [source.id],
              awardedAt: source.createdAt,
              source: 'demo',
            };
            await db.ribbons.put(ribbon);
          }
        }

        const latest = Math.max(...pieces.map((piece) => piece.createdAt), now);
        const start = at(spec.date, 0, 0);
        const end = start + 86_400_000;
        const signals: DaySignals = {
          date: spec.date,
          hint: spec.story[0]?.text ?? '',
          people: spec.people ?? [],
          places: spec.places ?? [],
          winningRibbon: spec.ribbon?.label ?? null,
          winningRibbonStrength: spec.ribbon ? 0.72 : 0,
          interactionScore: Math.max(0, Math.min(1, (latest - start) / (end - start))),
          storyBacked: true,
          pieceCount: pieces.length,
          mediaCount: pieces.filter((piece) => Boolean(piece.mediaId)).length,
          updatedAt: now,
        };
        await db.daySignals.put(signals);
      }

      const monthGroups = new Map<string, Piece[]>();
      for (const spec of specs) {
        const month = spec.date.slice(0, 7);
        const pieces = await db.pieces.where('date').equals(spec.date).toArray();
        const list = monthGroups.get(month) ?? [];
        list.push(...pieces);
        monthGroups.set(month, list);
      }

      const currentMonth = monthKey(new Date());
      const previousMonth = monthKey(subMonths(new Date(), 1));
      const yearAgoMonth = monthKey(subYears(new Date(), 1));
      const recapCopy: Record<string, { text: string; highlights: string[] }> = {
        [currentMonth]: {
          text: 'This month has been full of small returns: the bakery, Ana’s garden, the desk by the window. I keep thinking about the rain and the cinnamon roll, and how a name can make a place feel like yours.',
          highlights: ['the last cinnamon roll', 'the garden is finally coming in', 'wrote for an hour without stopping'],
        },
        [previousMonth]: {
          text: 'Last month was a season of trains and borrowed books. I cooked too much, read late, and called home more than once. The kitchen at midnight is still my favorite room.',
          highlights: ['a book with a broken spine', 'a fox cross the yard', 'the quietest hour of the month'],
        },
        [yearAgoMonth]: {
          text: 'A year ago I was sitting on the same bench, learning how little I needed to feel steady. The blue door, the ferry, the letter — they all still feel close.',
          highlights: ['The tree had grown past the railing', 'the color of old glass', 'I am still trying.'],
        },
      };

      for (const [month, piecesForMonth] of monthGroups.entries()) {
        const copy = recapCopy[month];
        if (!copy) continue;
        const existing = await db.recaps.where('month').equals(month).first();
        if (existing) continue;
        const id = `demo-recap-${month}`;
        const recap: Recap = {
          id,
          month,
          text: copy.text,
          highlights: copy.highlights,
          sourceHash: piecesHash(piecesForMonth),
          generatedAt: now,
          createdAt: now,
        };
        await db.recaps.put(recap);
        recapIds.push(id);
      }

      await db.kv.put({ key: DEMO_LOADED_KEY, value: true, updatedAt: now });
      await db.kv.put({ key: DEMO_DAYS_KEY, value: dayKeys, updatedAt: now });
      await db.kv.put({ key: DEMO_RECAPS_KEY, value: recapIds, updatedAt: now });
      await db.settings.put({ ...settings, demoLoaded: true, updatedAt: now });
    },
  );

  return { days: specs.length, pieces: pieceCount };
}

export async function removeDemoDiary(): Promise<void> {
  const demoPieces = await db.pieces.filter((piece) => piece.source === 'demo').toArray();
  if (demoPieces.length === 0) {
    await db.kv.bulkDelete([DEMO_LOADED_KEY, DEMO_DAYS_KEY, DEMO_RECAPS_KEY]);
    return;
  }
  const mediaIds = demoPieces
    .map((piece) => piece.mediaId)
    .filter((id): id is string => Boolean(id));
  const dates = Array.from(new Set(demoPieces.map((piece) => piece.date)));
  const demoRibbons = await db.ribbons.filter((ribbon) => ribbon.source === 'demo').toArray();
  const storedRecaps = (await kvGet<string[]>(DEMO_RECAPS_KEY)) ?? [];
  const changedDates: string[] = [];

  await db.transaction(
    'rw',
    [db.days, db.pieces, db.ribbons, db.recaps, db.media, db.daySignals, db.kv, db.settings],
    async () => {
      await db.pieces.bulkDelete(demoPieces.map((piece) => piece.id));
      if (mediaIds.length) await db.media.bulkDelete(mediaIds);
      if (demoRibbons.length) await db.ribbons.bulkDelete(demoRibbons.map((ribbon) => ribbon.id));
      if (storedRecaps.length) await db.recaps.bulkDelete(storedRecaps);
      for (const date of dates) {
        const remaining = await db.pieces.where('date').equals(date).count();
        if (remaining === 0) {
          await db.days.delete(date);
          await db.daySignals.delete(date);
        } else {
          const day = await db.days.get(date);
          if (day?.story) {
            await db.days.update(date, {
              story: undefined,
              storyStatus: 'queued',
              storySourceHash: undefined,
              storyUpdatedAt: undefined,
              storyError: undefined,
            });
          }
          await db.daySignals.delete(date);
          changedDates.push(date);
        }
      }
      await db.kv.bulkDelete([DEMO_LOADED_KEY, DEMO_DAYS_KEY, DEMO_RECAPS_KEY]);
      const settings = await db.settings.get('settings');
      if (settings) await db.settings.put({ ...settings, demoLoaded: false, updatedAt: Date.now() });
    },
  );

  if (changedDates.length > 0) {
    const { afterPieceChange } = await import('../ai/queue');
    await Promise.all(changedDates.map((date) => afterPieceChange(date)));
  }
}
