import { type NatureName, type StatBlock, type TeraType } from "@pokedex-agent/pokedex-core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MemberDraft = {
  species: string;
  level: number;
  ability: string;
  item: string;
  nature: NatureName;
  teraType: TeraType;
  moves: [string, string, string, string];
  evs: StatBlock;
};

export const MAX_PARTY = 6;

const emptyEvs = (): StatBlock => ({ H: 0, A: 0, B: 0, C: 0, D: 0, S: 0 });

export const createDraft = (): MemberDraft => ({
  species: "",
  level: 50,
  ability: "",
  item: "",
  nature: "노력",
  teraType: "노말",
  moves: ["", "", "", ""],
  evs: emptyEvs(),
});

const SAMPLE: MemberDraft = {
  species: "한카리아스",
  level: 50,
  ability: "까칠한피부",
  item: "구애스카프",
  nature: "고집",
  teraType: "땅",
  moves: ["지진", "역린", "스톤에지", "불꽃엄니"],
  evs: { H: 0, A: 252, B: 0, C: 0, D: 4, S: 252 },
};

type PartyState = {
  members: MemberDraft[];
  addMember: () => void;
  removeMember: (index: number) => void;
  updateMember: (index: number, patch: Partial<MemberDraft>) => void;
  setMembers: (members: MemberDraft[]) => void;
};

export const usePartyStore = create<PartyState>()(
  persist(
    (set) => ({
      members: [SAMPLE],
      addMember: () =>
        set((state) =>
          state.members.length >= MAX_PARTY
            ? state
            : { members: [...state.members, createDraft()] }
        ),
      removeMember: (index) =>
        set((state) => ({ members: state.members.filter((_, i) => i !== index) })),
      updateMember: (index, patch) =>
        set((state) => ({
          members: state.members.map((member, i) => (i === index ? { ...member, ...patch } : member)),
        })),
      setMembers: (members) => set({ members: members.slice(0, MAX_PARTY) }),
    }),
    { name: "pokedex-party" }
  )
);
