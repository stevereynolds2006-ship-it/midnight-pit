import {
  expectedReward,
  maximumPrize,
  parseChanceGame,
  type ChanceGameDefinition,
} from "@rarefriends/friendsdk/game";
import raw from "./game.json";

export const definition: ChanceGameDefinition = parseChanceGame(raw);
export const expectedPayout = expectedReward(definition);
export const maximumPayout = maximumPrize(definition);

export type AssetTone = "ash" | "rumor" | "brass" | "badge" | "lens" | "spark";

export type PitAsset = Readonly<{
  name: string;
  tone: AssetTone;
  note: string;
  rows: readonly string[];
}>;

const row = (lines: readonly string[]) => lines;

export const assets: readonly PitAsset[] = [
  {
    name: "Ash Chip",
    tone: "ash",
    note: "Floor scrap. The window still pays its book in RF.",
    rows: row([
      "................",
      "................",
      "......###.......",
      ".....##.##......",
      ".....#...##.....",
      "......#..#......",
      "................",
      "..###...........",
      "..#..#..........",
      "..#..##.........",
      "...##...........",
      "................",
      "........###.....",
      ".......#...#....",
      "........###.....",
      "................",
    ]),
  },
  {
    name: "Alley Rumor",
    tone: "rumor",
    note: "A whisper with a fixed bid. No expiry.",
    rows: row([
      "................",
      "...########.....",
      "...#......#.....",
      "...#.#..#.#.....",
      "...#......#.....",
      "...#..##..#.....",
      "...#......#.....",
      "...########.....",
      "......#.........",
      ".....#..........",
      "....#...........",
      "................",
      "................",
      "................",
      "................",
      "................",
    ]),
  },
  {
    name: "Brass Marker",
    tone: "brass",
    note: "Trades flat with the seal that deployed it.",
    rows: row([
      "................",
      ".....######.....",
      "...##......##...",
      "..#..........#..",
      "..#...####...#..",
      ".#...#....#...#.",
      ".#...#....#...#.",
      ".#...#....#...#.",
      ".#...#....#...#.",
      "..#...####...#..",
      "..#..........#..",
      "...##......##...",
      ".....######.....",
      "................",
      "................",
      "................",
    ]),
  },
  {
    name: "Velvet Badge",
    tone: "badge",
    note: "Pin it on your Friend, or cash the cloth.",
    rows: row([
      "................",
      "....########....",
      "...##########...",
      "...##########...",
      "...##########...",
      "...##########...",
      "....########....",
      ".....#....#.....",
      ".....#.##.#.....",
      "......#..#......",
      "......#..#......",
      ".......##.......",
      "................",
      "................",
      "................",
      "................",
    ]),
  },
  {
    name: "Oracle Lens",
    tone: "lens",
    note: "Rare glass. The bid is still only RF.",
    rows: row([
      "................",
      "................",
      ".....######.....",
      "...##......##...",
      "..#....##....#..",
      ".#....#..#....#.",
      ".#...#....#...#.",
      ".#...#....#...#.",
      ".#....#..#....#.",
      "..#....##....#..",
      "...##......##...",
      ".....######.....",
      ".......#........",
      ".......#........",
      "......###.......",
      "................",
    ]),
  },
  {
    name: "Genesis Spark",
    tone: "spark",
    note: "One percent. Ten RF if you sell it to the pit.",
    rows: row([
      "................",
      ".......##.......",
      ".......##.......",
      "....#..##..#....",
      ".....#.##.#.....",
      "..############..",
      "..############..",
      ".....#.##.#.....",
      "....#..##..#....",
      ".......##.......",
      ".......##.......",
      ".....#....#.....",
      "....#......#....",
      "................",
      "................",
      "................",
    ]),
  },
];

if (assets.length !== definition.outcomes.length || assets.some((asset, index) => asset.name !== definition.outcomes[index]?.name)) {
  throw new Error("Midnight Pit asset table does not match game.json.");
}

export function chanceLabel(bps: number): string {
  const whole = Math.floor(bps / 100);
  const frac = bps % 100;
  if (frac === 0) return `${whole}%`;
  const tail = String(frac).padStart(2, "0").replace(/0$/, "");
  return `${whole}.${tail}%`;
}

export const PREVIEW_FRIEND_ID = 777n;

export const PREVIEW_IDLE: readonly (readonly string[])[] = [
  [
    "................",
    "....##....##....",
    ".....#....#.....",
    ".....#....#.....",
    ".....#....#.....",
    ".....######.....",
    "....########....",
    "....#..##..#....",
    "....########....",
    ".....######.....",
    "....########....",
    "....########....",
    ".....######.....",
    ".....##..##.....",
    ".....##..##.....",
    "................",
  ],
  [
    "................",
    "................",
    "....##....##....",
    ".....#....#.....",
    ".....#....#.....",
    ".....#....#.....",
    ".....######.....",
    "....########....",
    "....#..##..#....",
    "....########....",
    ".....######.....",
    "....########....",
    ".....######.....",
    ".....##..##.....",
    ".....##..##.....",
    "................",
  ],
];
