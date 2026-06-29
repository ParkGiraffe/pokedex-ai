import { readFileSync } from 'node:fs';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

import { ClaudeResponseSchema, isKnownTerm, serializeForClaude } from '@pokedex-agent/pokedex-core';

for (const line of readFileSync(new URL('./.env.development', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SYSTEM_OLD = [
  '포켓몬 챔피언스 싱글배틀 분석가. 한국 SV 커뮤니티 어휘 (영어 직역 금지).',
  '응답은 details 2~4개로 압축, 파티 전체 관점. 포켓몬별 분산 금지.',
  'details.kind는 strength·weakness 위주. 근거(상성·수치) 포함, 단정형 금지. task 필드는 호출자 값.',
  "고유명사(포켓몬 종족·도구·기술·특성)는 절대 만들어내지 마라. 입력에 등장하지 않은 이름이나 확신 없는 한국 명칭을 출력하지 말 것. 필요하면 슬롯 번호('1번', '2번 슬롯')로만 가리켜라.",
].join('\n');

const SYSTEM_NOW = [
  '포켓몬 챔피언스 싱글배틀 분석가. 한국 SV 커뮤니티 어휘 (영어 직역 금지).',
  '응답은 details 2~4개로 압축, 파티 전체 관점. 포켓몬별 분산 금지.',
  'details.kind는 strength·weakness 위주. 근거(상성·수치) 포함, 단정형 금지. task 필드는 호출자 값.',
  '고유명사(포켓몬 종족·도구·기술·특성)는 절대 만들어내지 마라. 입력에 등장하지 않은 이름이나 확신 없는 한국 명칭을 출력하지 말 것.',
  "영어 음역·직역 절대 금지. 반드시 한국 정식 명칭만. 예: '샌드스트림'→'모래날림', '스텔스록'→'스텔스록'은 통용되나 '스텔스 록' 띄어쓰기 금지, '로키헬멧'→'울퉁불퉁멧', '드래곤테일'→'용의꼬리', '돌머리 계열'·'돌진계' 같은 애매한 총칭 금지.",
  "상대 포켓몬의 특성·기술은 입력에 없으면 모르는 정보다. 추측해서 단정하지 말 것. 정 필요하면 '예상' 표현을 쓰되, 확신 없는 특성·기술명은 아예 언급하지 마라. 모르는 특성을 지어내느니 '상대 특성 불명'으로 두는 게 낫다.",
  "포켓몬을 가리킬 때는 입력에 적힌 한국어 종족명을 그대로 쓴다. '슬롯 1번', '1번 슬롯', '슬롯 2' 같은 슬롯 번호 표현 절대 금지. 둘 이상이면 종족명을 쉼표로 나열.",
  "문장 부호는 마침표(.)와 쉼표(,)만 사용. 세미콜론(;), 콜론(:) 같은 영문식 부호는 금지. 'A; B' 대신 'A. B' 또는 'A, B'.",
  "actionable.slot 필드는 절대 사용하지 마라(슬롯 번호 표현 금지). 대신 actionable.reason 시작에 대상 포켓몬의 한국어 종족명을 적어라. 예: '망나뇽: 메가진화 중복 해소, 구애스카프로 교체'.",
  'mentionedNames에는 응답(summary·details·actionable)에 등장시킨 모든 포켓몬 종족·기술·특성·도구의 한국 명칭을 빠짐없이 나열하라. 타입명(불꽃·물 등)·일반 명사·수치는 넣지 마라. 이 목록은 명칭 검증에 쓰이므로 정확히 적어야 한다.',
].join('\n');

const MODEL = process.env.REPRO_MODEL ?? 'claude-haiku-4-5-20251001';
const TASK = process.env.REPRO_TASK ?? 'party-analysis';
const SYSTEM = process.env.REPRO_ERA === 'old' ? SYSTEM_OLD : SYSTEM_NOW;

const ivs = { H: 31, A: 31, B: 31, C: 31, D: 31, S: 31 };
const party = [
  { species: '리자몽', ability: '맹화', item: '리자몽나이트X', nature: '겁쟁이', level: 50, teraType: '불꽃',
    moves: ['불대문자', '에어슬래시', '날개치기', '대지의힘'], evs: { H: 0, A: 0, B: 0, C: 32, D: 0, S: 32 }, ivs },
  { species: '한카리아스', ability: '까칠한피부', item: '구애스카프', nature: '고집', level: 50, teraType: '땅',
    moves: ['지진', '역린', '스톤에지', '불꽃엄니'], evs: { H: 0, A: 32, B: 0, C: 0, D: 1, S: 32 }, ivs },
];

const state = {
  my: party,
  opponent: {
    revealed: [{ species: '마기라스' }, { species: '크레세리아' }, { species: '메타몽' }],
    field: [],
  },
  myField: [],
  trickRoom: false,
  turn: 1,
};

const payload = TASK === 'party-analysis' ? { party } : { state };
const body = serializeForClaude(TASK, payload);

const anthropic = new Anthropic({ timeout: 90_000 });
const response = await anthropic.messages.parse({
  model: MODEL,
  max_tokens: 1500,
  system: [{ type: 'text', text: SYSTEM }],
  messages: [{ role: 'user', content: body }],
  output_config: { format: zodOutputFormat(ClaudeResponseSchema) },
});
const parsed = response.parsed_output;

console.log('model:', MODEL, '/ task:', TASK);
console.log('summary:', parsed.summary);
for (const d of parsed.details) console.log(`- ${d.kind} | ${d.target} | ${d.text}`);
for (const a of parsed.actionable ?? []) console.log(`* ${a.kind} | ${a.reason}`);
console.log('mentionedNames:', JSON.stringify(parsed.mentionedNames));
const unverified = parsed.mentionedNames.filter((n) => !isKnownTerm(n));
console.log('검증 사전 탈락(unverified):', JSON.stringify(unverified));
