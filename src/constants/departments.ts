import type { KpiAccessRole, User, UserRole } from '../types';

export type { KpiAccessRole };

export interface DepartmentOption {
  id: string;
  name: string;
  isPlanningTeam?: boolean;
}

// 시선그룹(시선인터내셔널) 조직도 기준 소속 부서 목록 (순수 부서 명칭만 표기)
export const COMPANY_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-plan', name: '서비스기획팀', isPlanningTeam: true },
  { id: 'dept-digital-mkt', name: '디지털마케팅실', isPlanningTeam: false },
  { id: 'dept-growth-mkt', name: '그로스마케팅부', isPlanningTeam: false },
  { id: 'dept-online-cx', name: '온라인 CX', isPlanningTeam: false },
  { id: 'dept-digital-info', name: '디지털정보실', isPlanningTeam: false },
  { id: 'dept-mgmt-plan', name: '경영기획 총괄', isPlanningTeam: false },
  { id: 'dept-mgmt-hq', name: '경영관리본부', isPlanningTeam: false },
  { id: 'dept-online-mn', name: 'MI/MO/EBM 온라인MN팀', isPlanningTeam: false },
  { id: 'dept-it-md', name: 'IT 온라인MD팀', isPlanningTeam: false },
  { id: 'dept-logistics', name: '물류운영 총괄', isPlanningTeam: false },
  { id: 'dept-accounting', name: '회계팀', isPlanningTeam: false },
  { id: 'dept-hr', name: 'HR실', isPlanningTeam: false },
  { id: 'dept-strategy', name: '경영전략실', isPlanningTeam: false },
  { id: 'dept-fashion-info', name: '패션정보실', isPlanningTeam: false },
];

export interface KpiRoleOptionMeta {
  value: KpiAccessRole;
  label: string;
  shortLabel: string;
  portalAccessLabel: string;
  kpiAccessLabel: string;
  defaultDepartment?: string;
  defaultPosition: string;
  portalRole: UserRole;
  sortPriority: number;
}

export const KPI_ACCESS_ROLE_OPTIONS: KpiRoleOptionMeta[] = [
  {
    value: 'executive_viewer',
    label: '최상위 임원 (산하 전체 열람)',
    shortLabel: '최상위 임원',
    portalAccessLabel: '포털 읽기 전용',
    kpiAccessLabel: 'KPI 산하 전체 열람',
    defaultDepartment: '경영관리본부',
    defaultPosition: '경영관리본부장 (사장)',
    portalRole: 'viewer',
    sortPriority: 1,
  },
  {
    value: 'division_head',
    label: '상위 실장 · 최종 평가권자',
    shortLabel: '실장 · 최종평가',
    portalAccessLabel: '포털 읽기 전용',
    kpiAccessLabel: 'KPI 전체 열람 · 최종평가 확정',
    defaultDepartment: '디지털마케팅실',
    defaultPosition: '디지털마케팅실장 (상무)',
    portalRole: 'viewer',
    sortPriority: 2,
  },
  {
    value: 'team_lead',
    label: '서비스기획팀장 · 1차 평가권자',
    shortLabel: '팀장 · 1차평가',
    portalAccessLabel: '포털 편집 권한',
    kpiAccessLabel: 'KPI 팀 전체 열람 · 1차평가',
    defaultDepartment: '서비스기획팀',
    defaultPosition: '서비스기획자 / 차장',
    portalRole: 'admin',
    sortPriority: 3,
  },
  {
    value: 'team_member',
    label: '서비스기획팀원',
    shortLabel: '서비스기획팀원',
    portalAccessLabel: '포털 편집 권한',
    kpiAccessLabel: '본인 KPI 관리 · 다면평가',
    defaultDepartment: '서비스기획팀',
    defaultPosition: '서비스기획자',
    portalRole: 'member',
    sortPriority: 4,
  },
  {
    value: 'cross_dept',
    label: '타 부서 / 유관부서',
    shortLabel: '유관부서',
    portalAccessLabel: '포털 읽기 전용',
    kpiAccessLabel: '무기명 협업 다면평가 참여',
    defaultPosition: '유관부서 담당자',
    portalRole: 'viewer',
    sortPriority: 5,
  },
];

export const KPI_ACCESS_ROLE_META: Record<KpiAccessRole, KpiRoleOptionMeta> = {
  executive_viewer: KPI_ACCESS_ROLE_OPTIONS[0],
  division_head: KPI_ACCESS_ROLE_OPTIONS[1],
  team_lead: KPI_ACCESS_ROLE_OPTIONS[2],
  team_member: KPI_ACCESS_ROLE_OPTIONS[3],
  cross_dept: KPI_ACCESS_ROLE_OPTIONS[4],
};

const VALID_KPI_ROLES = new Set<KpiAccessRole>([
  'executive_viewer',
  'division_head',
  'team_lead',
  'team_member',
  'cross_dept',
]);

const EXECUTIVE_VIEWER_NAMES = new Set(['신동휘', '박종삼', '박종상']);
const DIVISION_HEAD_NAMES = new Set(['유은정']);
const TEAM_LEAD_NAMES = new Set(['최범열']);

export function isValidKpiAccessRole(value?: string | null): value is KpiAccessRole {
  return Boolean(value && VALID_KPI_ROLES.has(value as KpiAccessRole));
}

// 계정 권한 및 직책 설정 수정 권한 보유 여부 (오직 최범열 본인에게만 수정 권한 부여)
export function canManageUserPermissions(user?: Pick<User, 'name'> | null): boolean {
  return (user?.name || '').trim() === '최범열';
}

export function isTeamLeadName(name?: string | null, users?: User[]): boolean {
  const clean = (name || '').trim();
  if (!clean) return false;
  let list = users;
  if (!list && typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('ds_planning_users_v2');
      if (raw) {
        list = JSON.parse(raw) as User[];
      }
    } catch {
      list = undefined;
    }
  }
  if (Array.isArray(list) && list.length > 0) {
    const matched = list.find((u) => (u.name || '').trim() === clean);
    if (matched) {
      return resolveKpiAccessRole(matched) === 'team_lead';
    }
  }
  return TEAM_LEAD_NAMES.has(clean);
}

// 사용자의 유효 KPI/조직 위계 권한 산출
// 1순위: 관리자가 UI/DB에서 명시적으로 지정한 kpiRole
// 2순위: 최초 가입 시 성명·부서 기반 스마트 기본값
export function resolveKpiAccessRole(
  user?: Pick<User, 'name' | 'department' | 'position' | 'role' | 'kpiRole'> | null
): KpiAccessRole {
  if (!user) return 'cross_dept';
  if (isValidKpiAccessRole(user.kpiRole)) {
    return user.kpiRole;
  }

  const cleanName = (user.name || '').trim();
  const cleanDept = (user.department || '').trim();

  if (EXECUTIVE_VIEWER_NAMES.has(cleanName)) {
    return 'executive_viewer';
  }
  if (DIVISION_HEAD_NAMES.has(cleanName)) {
    return 'division_head';
  }
  if (TEAM_LEAD_NAMES.has(cleanName) || user.role === 'admin') {
    return 'team_lead';
  }
  if (cleanDept === '서비스기획팀' || user.role === 'member') {
    return 'team_member';
  }
  return 'cross_dept';
}

// 신규 회원가입 시 초기 소속·직책·권한 기본값 결정 (사전 등록 계정이 없는 경우에만 사용)
export function resolveDefaultOrgProfile(
  name: string,
  selectedDepartment: string
): {
  department: string;
  position: string;
  role: UserRole;
  kpiRole: KpiAccessRole;
} {
  const cleanName = name.trim();
  const cleanDept = selectedDepartment.trim() || '서비스기획팀';

  if (cleanName === '신동휘') {
    return {
      department: '경영관리본부',
      position: '경영관리본부장 (사장)',
      role: 'viewer',
      kpiRole: 'executive_viewer',
    };
  }
  if (cleanName === '박종삼' || cleanName === '박종상') {
    return {
      department: '경영기획 총괄',
      position: '경영기획 총괄 (전무)',
      role: 'viewer',
      kpiRole: 'executive_viewer',
    };
  }
  if (cleanName === '유은정') {
    return {
      department: '디지털마케팅실',
      position: '디지털마케팅실장 (상무)',
      role: 'viewer',
      kpiRole: 'division_head',
    };
  }
  if (cleanName === '최범열') {
    return {
      department: '서비스기획팀',
      position: '서비스기획자 / 차장',
      role: 'admin',
      kpiRole: 'team_lead',
    };
  }
  if (cleanDept === '서비스기획팀') {
    return {
      department: '서비스기획팀',
      position: '서비스기획자',
      role: 'member',
      kpiRole: 'team_member',
    };
  }
  return {
    department: cleanDept,
    position: '유관부서 담당자',
    role: 'viewer',
    kpiRole: 'cross_dept',
  };
}

export function resolveViewerModeBadgeText(user?: User | null): string | null {
  if (!user || user.role !== 'viewer') return null;
  const kpiRole = resolveKpiAccessRole(user);
  if (kpiRole === 'division_head') {
    return '실장 열람 · KPI 최종평가 권한';
  }
  if (kpiRole === 'executive_viewer') {
    return '상위 임원 열람 모드';
  }
  return '유관부서 읽기 전용 모드 적용 중 (등록/수정 제한)';
}

export function resolveMobileViewerBadgeText(user?: User | null): string | null {
  if (!user || user.role !== 'viewer') return null;
  const kpiRole = resolveKpiAccessRole(user);
  if (kpiRole === 'division_head') {
    return '실장 열람 · 최종평가 모드';
  }
  if (kpiRole === 'executive_viewer') {
    return '상위 임원 열람 모드';
  }
  return '읽기 전용 모드';
}
