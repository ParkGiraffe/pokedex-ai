import { type ClaudeResponse } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";

type ClaudeBridgeState = {
  lastResult: ClaudeResponse | null;
  setResult: (result: ClaudeResponse | null) => void;
};

export const useClaudeBridgeStore = create<ClaudeBridgeState>((set) => ({
  lastResult: null,
  setResult: (result) => set({ lastResult: result }),
}));
