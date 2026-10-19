// 사내 부서 목록 설정 파일
// 추후 회사 실제 조직도/부서 리스트로 손쉽게 교체하실 수 있도록 분리 설계되었습니다.

export interface DepartmentOption {
  id: string;
  name: string;
  isPlanningTeam?: boolean; // 서비스기획팀 여부 (편집 권한 자동 부여)
}

export const COMPANY_DEPARTMENTS: DepartmentOption[] = [
  // 1. 서비스기획팀 (기본 편집 권한)
  { id: 'dept-plan', name: '디지털서비스기획팀', isPlanningTeam: true },

  // 2. 유관부서 목록 (기본 읽기 전용 뷰어 권한)
  { id: 'dept-dev-frontend', name: '플랫폼개발팀 (프론트엔드/웹)', isPlanningTeam: false },
  { id: 'dept-dev-backend', name: '플랫폼개발팀 (백엔드/API)', isPlanningTeam: false },
  { id: 'dept-design', name: 'UI/UX디자인팀', isPlanningTeam: false },
  { id: 'dept-data', name: '데이터인텔리전스팀 (BI/DW)', isPlanningTeam: false },
  { id: 'dept-qa', name: '품질관리팀 (QA)', isPlanningTeam: false },
  { id: 'dept-mkt', name: '디지털마케팅실 (퍼포먼스/CRM)', isPlanningTeam: false },
  { id: 'dept-biz', name: '신사업전략실', isPlanningTeam: false },
  { id: 'dept-commerce', name: '커머스영업운영팀', isPlanningTeam: false },
  { id: 'dept-cx', name: '고객경험(CX)/고객센터운영팀', isPlanningTeam: false },
  { id: 'dept-sec', name: '정보보안/IT인프라팀', isPlanningTeam: false },
  { id: 'dept-legal', name: '법무/컴플라이언스팀', isPlanningTeam: false },
];
