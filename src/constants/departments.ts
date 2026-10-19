// 사내 부서 목록 설정 파일

export interface DepartmentOption {
  id: string;
  name: string;
  isPlanningTeam?: boolean; // 서비스기획팀 여부 (편집 권한 자동 부여)
}

export const COMPANY_DEPARTMENTS: DepartmentOption[] = [
  // 1. 서비스기획팀 (편집 권한 - 기본 소속 부서)
  { id: 'dept-plan', name: '서비스기획팀', isPlanningTeam: true },

  // 2. 유관부서 목록 (읽기 전용)
  { id: 'dept-online-mn', name: 'MI/MO/EBM 온라인MN팀', isPlanningTeam: false },
  { id: 'dept-it-md', name: 'IT 온라인MD팀', isPlanningTeam: false },
  { id: 'dept-mgmt-plan', name: '경영기획 총괄', isPlanningTeam: false },
  { id: 'dept-digital-info', name: '디지털정보실', isPlanningTeam: false },
  { id: 'dept-digital-mkt', name: '디지털마케팅실', isPlanningTeam: false },
];
