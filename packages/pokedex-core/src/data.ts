import { PokedexFile } from "./types";
import pokedexRaw from "../data/pokedex.json" with { type: "json" };

export const pokedex = PokedexFile.parse(pokedexRaw);

export const pokedexByNo = new Map(pokedex.entries.map((e) => [e.no, e]));
export const pokedexByKo = new Map(pokedex.entries.map((e) => [e.ko, e]));
export const pokedexByEn = new Map(pokedex.entries.map((e) => [e.en, e]));
