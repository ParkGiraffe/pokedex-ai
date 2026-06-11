import { apiRequest } from '@/features/auth';

export type MoveResult = {
  move: string;
  min: number;
  max: number;
  koChance: number;
  koText: string;
  desc: string;
};

export type Pairwise = {
  opponent: string;
  myBest?: MoveResult;
  oppBest?: MoveResult;
  faster: 'win' | 'lose' | 'tie';
  verdict: '유리' | '불리' | '호각';
  hasSet: boolean;
};

export type LeadScore = {
  myPick: string;
  pairs: Pairwise[];
  favorable: number;
  unfavorable: number;
  score: number;
};

export type TeamSelectResponse = {
  board: LeadScore[];
  summary: string;
};

export type MyMonInput = {
  species: string;
  moves?: string[];
  level?: number;
  item?: string;
  ability?: string;
  nature?: string;
  evs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  ivs?: Partial<Record<'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe', number>>;
  teraType?: string;
  terastallized?: boolean;
  mega?: boolean;
  megaForme?: 'X' | 'Y';
};

export type TeamSelectRequest = {
  myTeam: MyMonInput[];
  opponentTeam: string[];
  field?: {
    weather?: 'Rain' | 'Sun' | 'Sand' | 'Snow';
    terrain?: 'Electric' | 'Grassy' | 'Psychic' | 'Misty';
  };
};

export const fetchMatchupMatrix = (body: TeamSelectRequest): Promise<TeamSelectResponse> =>
  apiRequest('/team-select', { method: 'POST', body: JSON.stringify(body) }, '매치업 계산 실패');
