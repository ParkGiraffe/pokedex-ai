import pLimit from "p-limit";

const BASE = "https://pokeapi.co/api/v2";
const USER_AGENT = "pokedex-agent/data-fetchers";
const RETRIES = 4;

export const concurrency = pLimit(32);

export const fetchJson = async <T>(path: string): Promise<T> => {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error(`fetch 실패: ${url} :: ${String(lastError)}`);
};

export const pickKo = (names: ReadonlyArray<{ language: { name: string }; name: string }>): string | undefined =>
  names.find((n) => n.language.name === "ko")?.name;

export const generationToInt = (slug: string): number => {
  const roman = slug.replace(/^generation-/, "").toUpperCase();
  const table: Record<string, number> = { I: 1, V: 5, X: 10 };
  let total = 0;
  let prev = 0;
  for (const ch of [...roman].reverse()) {
    const value = table[ch];
    if (value === undefined) throw new Error(`알 수 없는 세대 슬러그: ${slug}`);
    total = value < prev ? total - value : total + value;
    prev = value;
  }
  return total;
};

export const announce = (label: string, done: number, total: number): void => {
  if (done === total || done % 50 === 0) {
    process.stderr.write(`  [${label}] ${done}/${total}\n`);
  }
};
