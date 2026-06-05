// 포켓몬 18타입 정식 색(커뮤니티 표준). 키는 한국어 타입명.
// 약점 매트릭스의 배율색(×4·반감 등 의미색)과는 별개로, 타입 "정체성"을 나타낼 때 쓴다.
export const TYPE_COLOR: Record<string, string> = {
  노말: '#9099A1',
  불꽃: '#FF9D55',
  물: '#5090D6',
  풀: '#63BC5A',
  전기: '#F4D23C',
  얼음: '#73CEC0',
  격투: '#CE4069',
  독: '#AB6AC8',
  땅: '#D97845',
  비행: '#8FA9DE',
  에스퍼: '#F97176',
  벌레: '#90C12C',
  바위: '#C7B78B',
  고스트: '#5269AC',
  드래곤: '#0B6DC3',
  악: '#5A5366',
  강철: '#5A8EA1',
  페어리: '#EC8FE6',
};

// 밝은 배경색이라 흰 글자 대신 어두운 글자가 필요한 타입.
const DARK_TEXT_TYPES = new Set(['전기', '얼음', '바위']);

export const typeColor = (type: string): string => TYPE_COLOR[type] ?? '#6b7280';

export const typeTextColor = (type: string): string => (DARK_TEXT_TYPES.has(type) ? '#1f2937' : '#ffffff');
