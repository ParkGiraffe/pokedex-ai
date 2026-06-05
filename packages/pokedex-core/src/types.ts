import { z } from 'zod';

export const TYPE_NAMES = [
  '노말',
  '불꽃',
  '물',
  '풀',
  '전기',
  '얼음',
  '격투',
  '독',
  '땅',
  '비행',
  '에스퍼',
  '벌레',
  '바위',
  '고스트',
  '드래곤',
  '악',
  '강철',
  '페어리',
] as const;

export const TypeName = z.enum(TYPE_NAMES);
export type TypeName = z.infer<typeof TypeName>;

export const isTypeName = (value: unknown): value is TypeName => TypeName.safeParse(value).success;

export const TeraType = z.union([TypeName, z.literal('스텔라')]);
export type TeraType = z.infer<typeof TeraType>;

// 공식 한국어 표기(PokeAPI /nature/ 기준, 도감번호 순). 보정치는 natures.json에서 파생한다.
export const NATURE_NAMES = [
  '노력',
  '대담',
  '조심',
  '차분',
  '겁쟁이',
  '외로움',
  '온순',
  '의젓',
  '얌전',
  '성급',
  '고집',
  '장난꾸러기',
  '수줍음',
  '신중',
  '덜렁',
  '명랑',
  '개구쟁이',
  '촐랑',
  '변덕',
  '천진난만',
  '용감',
  '무사태평',
  '냉정',
  '건방',
  '성실',
] as const;

export const NatureName = z.enum(NATURE_NAMES);
export type NatureName = z.infer<typeof NatureName>;

// 챔피언스 시스템: 노력 포인트 0~32 (각 스탯). 본가 EV 0~252 시스템은 사용하지 않는다.
const StatNumber = z.number().int().min(0).max(32);

export const StatBlock = z.object({
  H: StatNumber,
  A: StatNumber,
  B: StatNumber,
  C: StatNumber,
  D: StatNumber,
  S: StatNumber,
});
export type StatBlock = z.infer<typeof StatBlock>;

const IvNumber = z.number().int().min(0).max(31);

export const IvBlock = z.object({
  H: IvNumber,
  A: IvNumber,
  B: IvNumber,
  C: IvNumber,
  D: IvNumber,
  S: IvNumber,
});
export type IvBlock = z.infer<typeof IvBlock>;

export const PERFECT_IVS: IvBlock = { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 };

// 챔피언스 시스템: 각 스탯 0~32 노력 포인트(= 0~252 EV) 한도만 강제, 합계 제한 없음.
export const PartyMemberObject = z.object({
  species: z.string().min(1),
  level: z.number().int().min(1).max(100).default(50),
  nature: NatureName,
  ability: z.string().min(1),
  item: z.string().optional(),
  teraType: TeraType,
  moves: z.array(z.string().min(1)).length(4),
  evs: StatBlock,
  ivs: IvBlock.default(PERFECT_IVS),
});

export const PartyMember = PartyMemberObject;
export type PartyMember = z.infer<typeof PartyMember>;

export const Party = z.array(PartyMember).min(1).max(6);
export type Party = z.infer<typeof Party>;

// 빌더 작업 상태(부분 입력 허용). 프리셋은 검증된 Party가 아니라 이 draft를 그대로 저장·복원한다.
// species·ability·item·moves는 빈 문자열 허용(nature·teraType·evs는 셀렉트/스피너라 항상 유효).
export const PartyDraftMember = z.object({
  species: z.string(),
  level: z.number().int().min(1).max(100),
  nature: NatureName,
  ability: z.string(),
  item: z.string(),
  teraType: TeraType,
  moves: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  evs: StatBlock,
});
export type PartyDraftMember = z.infer<typeof PartyDraftMember>;

export const PartyDraft = z.array(PartyDraftMember).min(1).max(6);
export type PartyDraft = z.infer<typeof PartyDraft>;

export const Weather = z.enum(['맑음', '비', '모래바람', '눈']);
export type Weather = z.infer<typeof Weather>;

export const Terrain = z.enum(['그래스필드', '미스트필드', '사이코필드', '일렉트릭필드']);
export type Terrain = z.infer<typeof Terrain>;

export const StatusCondition = z.enum(['화상', '독', '맹독', '마비', '잠듦', '얼음']);
export type StatusCondition = z.infer<typeof StatusCondition>;

const RankNumber = z.number().int().min(-6).max(6);

export const RankBlock = z.object({
  A: RankNumber.default(0),
  B: RankNumber.default(0),
  C: RankNumber.default(0),
  D: RankNumber.default(0),
  S: RankNumber.default(0),
  accuracy: RankNumber.default(0),
  evasion: RankNumber.default(0),
});
export type RankBlock = z.infer<typeof RankBlock>;

export const FieldSlot = z.object({
  member: PartyMember,
  hpPercent: z.number().min(0).max(100).default(100),
  ranks: RankBlock.default({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    S: 0,
    accuracy: 0,
    evasion: 0,
  }),
  status: StatusCondition.optional(),
  terastalized: z.boolean().default(false),
  // 메가 폼 슬러그. "" 또는 미지정이면 비메가. 데미지·스피드 계산에서 종족값·타입을 swap한다.
  megaForm: z.string().optional(),
});
export type FieldSlot = z.infer<typeof FieldSlot>;

// 필드 상태. 진입 위험(hazard)은 내 쪽, 스크린은 상대 쪽, 순풍은 양쪽 기준.
export const BattleFieldState = z.object({
  myStealthRock: z.boolean().default(false),
  mySpikes: z.number().int().min(0).max(3).default(0),
  myStickyWeb: z.boolean().default(false),
  opponentLightScreen: z.boolean().default(false),
  opponentReflect: z.boolean().default(false),
  myTailwind: z.boolean().default(false),
  opponentTailwind: z.boolean().default(false),
});
export type BattleFieldState = z.infer<typeof BattleFieldState>;

export const BattleState = z.object({
  my: Party,
  opponent: z.object({
    revealed: z.array(PartyMemberObject.partial()).max(6),
    field: z.array(FieldSlot).max(1),
  }),
  myField: z.array(FieldSlot).max(1).default([]),
  weather: Weather.optional(),
  terrain: Terrain.optional(),
  trickRoom: z.boolean().default(false),
  turn: z.number().int().min(1).default(1),
  battleField: BattleFieldState.optional(),
});
export type BattleState = z.infer<typeof BattleState>;

const BaseStatNumber = z.number().int().min(1).max(255);

export const BaseStatBlock = z.object({
  H: BaseStatNumber,
  A: BaseStatNumber,
  B: BaseStatNumber,
  C: BaseStatNumber,
  D: BaseStatNumber,
  S: BaseStatNumber,
});
export type BaseStatBlock = z.infer<typeof BaseStatBlock>;

export const PokedexEntry = z.object({
  no: z.number().int().min(1),
  ko: z.string(),
  en: z.string(),
  generation: z.number().int().min(1).max(9),
  types: z.array(TypeName).min(1).max(2),
  types_en: z.array(z.string()).min(1).max(2),
  base: BaseStatBlock,
  past_types: z.array(z.unknown()).default([]),
});
export type PokedexEntry = z.infer<typeof PokedexEntry>;

export const PokedexFile = z.object({
  source: z.string(),
  generated_at_utc: z.string(),
  generations: z.string(),
  count: z.number().int(),
  type_map_ko: z.record(z.string(), z.string()),
  entries: z.array(PokedexEntry),
});
export type PokedexFile = z.infer<typeof PokedexFile>;
