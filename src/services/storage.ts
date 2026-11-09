import type {
  User,
  TaskItem,
  TaskAttachment,
  TaskStatus,
  VacationItem,
  KpiItem,
  KpiProcessStage,
  KpiQuarterlyCheckin,
  KpiPeerReview,
  KpiGrade,
  AuditLog,
  UserRole,
  WorkInfoItem,
  OnboardingChecklistItem,
  OnboardingPhase,
  PolicyDomain,
  PolicyRuleRow,
  SisunPolicyItem,
} from '../types';
import { getSupabaseClient, isSupabaseEnabled, SUPABASE_URL } from './supabase';

const STORAGE_KEYS = {
  USERS: 'ds_planning_users_v2',
  TASKS: 'ds_planning_tasks_clean_v1',
  VACATIONS: 'ds_planning_vacations_clean_v1',
  KPIS: 'ds_planning_kpis_clean_v1',
  AUDIT_LOGS: 'ds_planning_audit_logs_clean_v1',
  WORK_INFOS: 'ds_planning_work_infos_v1',
  ONBOARDING_ITEMS: 'ds_planning_onboarding_items_v3',
  POLICY_ITEMS: 'ds_planning_policy_items_v1',
  CURRENT_USER_ID: 'ds_planning_current_user_id_v2',
  CURRENT_USER_SNAPSHOT: 'ds_planning_current_user_snapshot_v2',
};

const WORK_INFO_CLOUD_RECORD_ID = 'sys-work-info-store-v1';
const KPI_CLOUD_RECORD_ID = 'sys-kpi-extended-store-v1';
const ONBOARDING_CLOUD_RECORD_ID = 'sys-onboarding-store-v3';
const POLICY_CLOUD_RECORD_ID = 'sys-policy-store-v1';

const INITIAL_WORK_INFO_ITEMS: WorkInfoItem[] = [
  {
    id: 'winfo-1',
    category: '기본 사항',
    title: '시선 그룹웨어 (메신저, 메일, 일정)',
    content: 'https://gw.sisun.com/',
    note: '',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-2',
    category: '기본 사항',
    title: 'ERP, 나스 폴더 (공유폴더)',
    content: 'ID : 1260808\nPW : sisun65@@',
    note: '',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-3',
    category: '기본 사항',
    title: '디지털정보실 업무 담당자',
    content: 'ERP : 김현진 수석부장, 모세 과장\n그룹웨어 / 메신저 : 민상연 대리\n나스 : 김동혁 주임',
    note: '',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-4',
    category: '기본 사항',
    title: '와이파이',
    content:
      '1. 게스트 (손님용)\nsisun\nsisun1234\n* 인터넷만 가능\n\n2. 내부 업무용\nsisunin\nsisun12#$\n* 내부 : NAS, ERP 회의실에서 업무사용\n내부업무 접속 가이드 - Hiden 되어 있는 WiFi',
    note: '',
    sortOrder: 4,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-5',
    category: '기본 사항',
    title: '라이브 방송',
    content: '소스라이브',
    note: '',
    sortOrder: 5,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-6',
    category: '참고 정보',
    title: 'QA 서버 Front',
    content: 'https://qas.sisun.com/',
    note: '',
    sortOrder: 6,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-7',
    category: '참고 정보',
    title: 'QA 서버 Admin',
    content: 'https://qasadmin.sisun.com/',
    note: '',
    sortOrder: 7,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
];

const INITIAL_ONBOARDING_ITEMS: OnboardingChecklistItem[] = [
  // --- 1일차 (출근 첫날) ---
  {
    id: 'onb-1',
    phase: 'day1',
    category: '인프라·권한',
    title: '사내 와이파이(sisunin) 및 네트워크 연결',
    description: '내부 업무용 와이파이 연결 후 사내망 접속 확인',
    ownerRole: '',
    linkLabel: '와이파이 정보',
    linkUrl: '#/work-info',
    completed: false,
    note: '',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-2',
    phase: 'day1',
    category: '인프라·권한',
    title: '시선 그룹웨어 로그인 및 메일·메신저 설정',
    description: '조직도 확인, 이메일 서명 및 메신저 프로필 설정',
    ownerRole: '',
    linkLabel: '그룹웨어',
    linkUrl: 'https://gw.sisun.com/',
    completed: false,
    note: '',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-3',
    phase: 'day1',
    category: '인프라·권한',
    title: 'ERP 및 공유폴더(나스) 접속 확인',
    description: '서비스기획팀 공유 문서함 및 산출물 폴더 접근 확인',
    ownerRole: '',
    linkLabel: '계정 정보',
    linkUrl: '#/work-info',
    completed: false,
    note: '',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-4',
    phase: 'day1',
    category: '협업 도구',
    title: '업무포털 계정 생성 및 팀 구성 파악',
    description: '기획 · 디자인 · 퍼블리싱 파트별 역할 및 담당 서비스 확인',
    ownerRole: '',
    linkLabel: '팀 안내',
    linkUrl: '#/overview',
    completed: false,
    note: '',
    sortOrder: 4,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-5',
    phase: 'day1',
    category: '협업 도구',
    title: '기획 워크스페이스 · 노션 · 피그마 · 테스트 서버 권한 확인',
    description: '기획서 작성 도구, 노션 과제 보드, 피그마 시안, 테스트 서버 접속 점검',
    ownerRole: '',
    linkLabel: '기획 워크스페이스',
    linkUrl: 'https://bychoi-space.github.io/workspace/index.html',
    completed: false,
    note: '',
    sortOrder: 5,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },

  // --- 1주차 (서비스·시스템 파악) ---
  {
    id: 'onb-6',
    phase: 'week1',
    category: '업무 절차',
    title: '서비스기획 5단계 업무 프로세스 숙지',
    description: '요구사항 접수 → 기획/설계 → 개발 협의 → 검수 → 배포 절차 파악',
    ownerRole: '',
    linkLabel: '업무 프로세스',
    linkUrl: '#/overview',
    completed: false,
    note: '',
    sortOrder: 6,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-7',
    phase: 'week1',
    category: '서비스·시스템',
    title: '자사몰(시선닷컴) 전시 · 상품 · 주문 화면 탐색',
    description: '기획전, 상품 상세, 장바구니·주문서 주요 화면 및 고객 동선 확인',
    ownerRole: '',
    linkLabel: '테스트몰(전시)',
    linkUrl: 'https://qas.sisun.com/',
    completed: false,
    note: '',
    sortOrder: 7,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-8',
    phase: 'week1',
    category: '서비스·시스템',
    title: '어드민(관리자) 주요 메뉴 및 운영 기능 파악',
    description: '상품 정렬, 프로모션 배너 관리, 주문·출고 관리 등 어드민 메뉴 구조 확인',
    ownerRole: '',
    linkLabel: '테스트 어드민',
    linkUrl: 'https://qasadmin.sisun.com/',
    completed: false,
    note: '',
    sortOrder: 8,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-9',
    phase: 'week1',
    category: '업무 절차',
    title: '최근 진행 과제 산출물(기획서 · 디자인 시안) 살펴보기',
    description: '업무 관리에 등록된 기존 과제의 기획서와 실제 반영 화면 비교',
    ownerRole: '',
    linkLabel: '업무 관리',
    linkUrl: '#/tasks',
    completed: false,
    note: '',
    sortOrder: 9,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },

  // --- 2주차 (협업·첫 과제 실습) ---
  {
    id: 'onb-10',
    phase: 'week2',
    category: '업무 절차',
    title: '기획 워크스페이스 화면설계서 작성법 실습',
    description: '화면 상태 정의, 정책 작성 및 업무포털·노션 링크 연결 실습',
    ownerRole: '',
    linkLabel: '기획 워크스페이스',
    linkUrl: 'https://bychoi-space.github.io/workspace/index.html',
    completed: false,
    note: '',
    sortOrder: 10,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-11',
    phase: 'week2',
    category: '협업 도구',
    title: '기획 · 디자인 · 퍼블리싱 파트 간 업무 연계 방식 숙지',
    description: '상위 기획 과제 등록 후 디자인·퍼블리싱 하위 작업 요청 및 시안 공유 방식 확인',
    ownerRole: '',
    linkLabel: '업무 관리',
    linkUrl: '#/tasks',
    completed: false,
    note: '',
    sortOrder: 11,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-12',
    phase: 'week2',
    category: '실무 과제',
    title: '첫 소규모 개선 과제 배정 및 화면설계서 초안 작성',
    description: '단일 화면 기능개선 과제를 배정받아 기획서 초안 작성 후 리뷰 진행',
    ownerRole: '',
    linkLabel: '업무 관리',
    linkUrl: '#/tasks',
    completed: false,
    note: '',
    sortOrder: 12,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-13',
    phase: 'week2',
    category: '서비스·시스템',
    title: '유관부서(사업부 · 온라인MD · 개발 · 물류/CS) 협업 창구 파악',
    description: '부서별 주요 요청 사항 및 협의 절차 확인',
    ownerRole: '',
    linkLabel: '팀 안내',
    linkUrl: '#/overview',
    completed: false,
    note: '',
    sortOrder: 13,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },

  // --- 3~4주차 (검수·배포·담당 배정) ---
  {
    id: 'onb-14',
    phase: 'week3_4',
    category: '실무 과제',
    title: '배정 과제 개발·퍼블리싱 협의 및 테스트 서버 검수',
    description: '테스트 서버 반영 내역 확인 및 예외 사항 검수·피드백',
    ownerRole: '',
    linkLabel: '테스트몰(전시)',
    linkUrl: 'https://qas.sisun.com/',
    completed: false,
    note: '',
    sortOrder: 14,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-15',
    phase: 'week3_4',
    category: '실무 과제',
    title: '운영 서버 배포 확인 및 결과 공유',
    description: '실서버 정상 동작 점검 및 요청 부서 안내 완료',
    ownerRole: '',
    linkLabel: '통합 일정',
    linkUrl: '#/schedule',
    completed: false,
    note: '',
    sortOrder: 15,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
  {
    id: 'onb-16',
    phase: 'week3_4',
    category: '실무 과제',
    title: '2027년 주요 개발과제 검토 및 담당 영역·KPI 수립',
    description: '연간 주요 과제 리스트 검토 후 주력 담당 영역 및 개인 목표 설정',
    ownerRole: '',
    linkLabel: 'KPI 관리',
    linkUrl: '#/kpi',
    completed: false,
    note: '',
    sortOrder: 16,
    createdBy: '최범열',
    createdAt: '2026-11-05T02:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-05T02:00:00.000Z',
  },
];

// 시선닷컴(https://sisun.com/) 실제 Front 운영 정책 시드 데이터 (7대 도메인)
const INITIAL_POLICY_ITEMS: SisunPolicyItem[] = [
  // =========================================================================
  // 1. 상품 (product) 도메인
  // =========================================================================
  {
    id: 'pol-prd-001',
    domain: 'product',
    subCategory: '상품 코드 및 유형 체계',
    code: 'POL-PRD-001',
    title: '상품 코드(goodsCode) 체계 및 정상 · 아울렛 · 온라인단독 구분 정책',
    summary: '시선닷컴 전 브랜드 상품의 고유 식별 코드 규칙과 판매 유형별 Front 배지·혜택 적용 기준을 정의합니다.',
    description:
      '시선닷컴에 전시·판매되는 모든 상품은 G로 시작하는 14자리 고유 상품코드(goodsCode)로 식별되며, 상품 유형(정상/아울렛/온라인단독)에 따라 쿠폰 적용 가능 여부와 전시 매장이 결정됩니다.',
    rules: [
      {
        id: 'r-prd-101',
        classification: '상품 코드(goodsCode) 채번',
        ruleDetail: 'G + 등록연월일(YYYYMMDD) + 일련번호 5자리 (예: G2026090500011)',
        exceptionNote: 'URL 파라미터(/goods/view?goodsCode=...) 및 Groobee 개인화 트래킹 식별자로 공통 사용',
      },
      {
        id: 'r-prd-102',
        classification: '정상 상품 (Season Regular)',
        ruleDetail: '당해 시즌 신상품으로 브랜드관 메인, NEW, 카테고리 매장에 노출되며 등급별 정상 상품 쿠폰 적용 가능',
        exceptionNote: '일부 브랜드 정책에 따라 프로모션 제외 상품 별도 지정 가능',
      },
      {
        id: 'r-prd-103',
        classification: '아울렛 상품 (Outlet)',
        ruleDetail: '이월 시즌 상품으로 [아울렛] 전용 매장 및 검색 결과에 노출되며 할인가가 기본 반영됨',
        exceptionNote: '신규가입 10% 쿠폰, APP 첫 로그인 쿠폰, SMS 수신동의 쿠폰 등 일반 할인쿠폰 적용 제외',
      },
      {
        id: 'r-prd-104',
        classification: '온라인 단독 (Online Exclusive)',
        ruleDetail: '[온라인 단독] 전용 카테고리 및 상품 카드 배지로 구분 노출',
        exceptionNote: '신규가입 시 지급되는 브랜드별 EXCLUSIVE 10% 쿠폰(E.B.M / IT MICHAA) 적용 대상',
      },
    ],
    frontScreenPath: 'https://sisun.com/goods/view?goodsCode=G2026090500011',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-prd-002',
    domain: 'product',
    subCategory: '상품 상세(PDP) UI/노출',
    code: 'POL-PRD-002',
    title: '상품 상세 페이지(PDP) 정보 구성, PC 상세 더보기 및 상·하단 공지 노출 정책',
    summary: '상품 상세 화면의 이미지 갤러리, 옵션 선택기, 상세 설명 접기/펼치기(더보기) 및 공지 영역 노출 규칙입니다.',
    description:
      '고해상도 룩북/상세 이미지로 인해 스크롤이 과도하게 길어지는 현상을 방지하기 위해 PC 상품 상세 영역에 [상품 정보 더보기] 접기/펼치기 UI를 적용하며, 브랜드·상품별 상단/하단 공지를 동적으로 노출합니다.',
    rules: [
      {
        id: 'r-prd-201',
        classification: 'PC 상품 상세 더보기 (접기/펼치기)',
        ruleDetail: '상세 기술서 영역이 기준 높이를 초과할 경우 초기 진입 시 일부만 노출하고 하단 그라데이션 및 [상품 정보 더보기] 버튼 제공',
        exceptionNote: '더보기 클릭 시 전체 상세 이미지/정보가 펼쳐지며 하단 탭(실측사이즈/리뷰/Q&A/배송·교환 안내)으로 자연스럽게 이어짐',
      },
      {
        id: 'r-prd-202',
        classification: '상품 상세 상단 · 하단 공지 노출',
        ruleDetail: '관리자(BO)에 등록된 브랜드 공통 공지 또는 특정 상품 전용 공지를 상세 설명 최상단 및 최하단에 자동 바인딩 노출',
        exceptionNote: '배송 지연 안내, 소재 취급 주의사항, 프로모션 유의사항 등 운영 공지 즉시 반영',
      },
      {
        id: 'r-prd-203',
        classification: '컬러 · 사이즈 옵션 및 실측 안내',
        ruleDetail: '연관 컬러칩 클릭 시 해당 컬러 상품 상세로 이동 또는 전환되며, 사이즈 선택 시 재고 유무(품절 시 SOLD OUT 표기 및 재입고 알림 신청)를 실시간 표시',
        exceptionNote: '하단 사이즈 정보 탭에서 체형별/부위별 실측 사이즈표 및 세탁법 아이콘 필수 노출',
      },
      {
        id: 'r-prd-204',
        classification: '위시리스트 · 최근 본 상품 연동',
        ruleDetail: '하트(위시) 클릭 시 회원 위시리스트에 즉시 저장되며, 상세 페이지 진입 시 헤더 유틸리티 [최근본상품] 목록 최상단에 자동 기록',
        exceptionNote: '비회원 상태에서 위시리스트 클릭 시 로그인 페이지로 이동 유도',
      },
    ],
    frontScreenPath: 'https://sisun.com/goods/view?goodsCode=G2026090500011',
    workspaceUrl: 'https://bychoi-space.github.io/workspace/viewer.html?project=p_dcuun',
    status: 'updated',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-prd-003',
    domain: 'product',
    subCategory: '재고 연동 및 출고 리드타임',
    code: 'POL-PRD-003',
    title: '물류센터 우선 출고 및 오프라인 매장 재고 확보(옴니채널) 발송 정책',
    summary: '물류센터 재고와 전국 오프라인 매장 재고를 통합 연동하여 판매하며, 출고처에 따라 상이한 배송 소요 기간과 품절 안내 기준을 적용합니다.',
    description:
      '시선닷컴은 온라인 물류센터 재고뿐만 아니라 오프라인 매장 재고까지 통합 연동하여 판매 가용성을 극대화합니다. 이에 따라 출고지에 따른 소요 기간 안내 및 매장 실재고 부재 시 품절 취소 정책이 적용됩니다.',
    rules: [
      {
        id: 'r-prd-301',
        classification: '물류센터 보유 재고 출고',
        ruleDetail: '결제 완료 후 1~2영업일 이내 즉시 출고 진행',
        exceptionNote: '주말·공휴일 및 명절 연휴 기간 제외',
      },
      {
        id: 'r-prd-302',
        classification: '오프라인 매장 재고 확보 출고',
        ruleDetail: '물류센터 재고 소진 시 전국 오프라인 매장 재고를 수급·검수하여 발송하며 5~10영업일 소요',
        exceptionNote: '매장 재고 이동으로 출고 지연 발생 시 고객에게 알림톡/SMS로 지연 일정 사전 안내',
      },
      {
        id: 'r-prd-303',
        classification: '시즌오프 · 소량 재고 품절 취소',
        ruleDetail: '매장 디스플레이 상품 오염·불량 판정 또는 오프라인 동시 판매로 실재고 확보 불가 시 부득이하게 품절 취소 안내 후 전액 환불 처리',
        exceptionNote: '품절 취소 확정 시 고객 알림톡 안내 및 결제 수단별 자동 환불 진행',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/faq',
    status: 'active',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 2. 회원 (member) 도메인
  // =========================================================================
  {
    id: 'pol-mem-001',
    domain: 'member',
    subCategory: '신규 가입 및 APP 혜택',
    code: 'POL-MEM-001',
    title: '신규 회원가입 웰컴 쿠폰팩 및 모바일 APP 첫 로그인 혜택 정책',
    summary: '시선닷컴 통합회원 신규 가입 시 즉시 지급되는 4종 웰컴 쿠폰팩과 모바일 앱 다운로드/첫 로그인 리워드 기준입니다.',
    description:
      '신규 회원의 첫 구매 전환과 모바일 APP 설치 유도를 위해 가입 즉시 브랜드 통합 및 온라인 단독 쿠폰을 자동 발급하며, 앱 최초 로그인 시 추가 쿠폰과 마일리지를 지급합니다.',
    rules: [
      {
        id: 'r-mem-101',
        classification: '신규 가입 전 상품 할인 쿠폰',
        ruleDetail: '전 브랜드 정상 상품에 사용 가능한 10% 할인 쿠폰 1장 자동 발급',
        exceptionNote: '아울렛 상품 및 일부 기획 상품 제외, 발급일로부터 3개월 이내 사용 가능',
      },
      {
        id: 'r-mem-102',
        classification: '신규 가입 온라인 단독(EXCLUSIVE) 쿠폰',
        ruleDetail: 'E.B.M EXCLUSIVE 10% 쿠폰 2장 + IT MICHAA EXCLUSIVE 10% 쿠폰 2장 자동 발급',
        exceptionNote: '각 브랜드의 온라인 단독(EXCLUSIVE) 전용 상품 구매 시 적용 가능',
      },
      {
        id: 'r-mem-103',
        classification: '생일 축하 쿠폰',
        ruleDetail: '회원정보에 등록된 생일 기준 10,000원 할인 쿠폰 1장 발급',
        exceptionNote: '마이페이지 > 쿠폰함에서 확인 및 다운로드/적용 가능',
      },
      {
        id: 'r-mem-104',
        classification: '모바일 APP 다운로드 & 첫 로그인 혜택',
        ruleDetail: '시선닷컴 모바일 APP 설치 후 최초 로그인 시 10% 할인 쿠폰 1장 + 3,000 마일리지 즉시 지급',
        exceptionNote: 'ID당 최초 1회 한정 지급',
      },
    ],
    frontScreenPath: 'https://sisun.com/about/gradeText',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-mem-002',
    domain: 'member',
    subCategory: '멤버십 등급 산정 및 혜택',
    code: 'POL-MEM-002',
    title: '6단계 멤버십 등급 체계(FAMILY ~ PLATINUM) 산정 기준 및 정기 승급 정책',
    summary: '연 4회(분기별 1일) 최근 1년간 구매확정된 실결제 금액을 기준으로 산정되는 6단계 멤버십 등급 및 등급별 혜택 정책입니다.',
    description:
      '시선닷컴 멤버십은 FAMILY, SILVER, GOLD, VIP, PRESTIGE, PLATINUM 총 6단계로 운영됩니다. 매년 1월·4월·7월·10월 1일에 등급이 정기 산정되며, 산정월 전월 15일까지의 최근 1년간 주문 건 중 전월 말일까지 구매확정이 완료된 실결제 금액(취소·반품·쿠폰할인 제외)을 합산하여 반영합니다.',
    rules: [
      {
        id: 'r-mem-201',
        classification: 'FAMILY / SILVER 등급 기준 및 혜택',
        ruleDetail: '• FAMILY(신규 가입 및 50만원 미만): 신규 가입 웰컴 쿠폰팩 제공\n• SILVER(50만원 이상~100만원 미만): 정상 10% 쿠폰 1장, 아울렛 5% 쿠폰 1장, 10,000원 금액권 1장',
        exceptionNote: '승급 시점(분기 첫째 날) 쿠폰 자동 발급',
      },
      {
        id: 'r-mem-202',
        classification: 'GOLD / VIP 등급 기준 및 혜택',
        ruleDetail: '• GOLD(100만원 이상~300만원 미만): 정상 10% 2장, 아울렛 5% 1장, 20,000원권 1장\n• VIP(300만원 이상~500만원 미만): 정상 15% 1장, 정상 10% 2장, 아울렛 5% 2장, 30,000원권 1장, 무료반품 쿠폰(분기 1장)',
        exceptionNote: 'VIP 등급부터 분기별 무료반품 쿠폰 혜택 제공',
      },
      {
        id: 'r-mem-203',
        classification: 'PRESTIGE / PLATINUM 등급 기준 및 혜택',
        ruleDetail: '• PRESTIGE(500만원 이상~1,000만원 미만): 상시 5% 할인, 정상 15% 2장, 정상 10% 3장, 아울렛 5% 3장, 50,000원권 1장, 무료반품 쿠폰(분기 2장)\n• PLATINUM(1,000만원 이상): 상시 7% 할인, 정상 20% 1장, 정상 15% 2장, 정상 10% 3장, 아울렛 5% 3장, 100,000원권 1장, 무료반품 쿠폰(분기 3장)',
        exceptionNote: '최상위 등급(PRESTIGE/PLATINUM)은 기본 상시 할인율 및 고액 금액권 추가 부여',
      },
      {
        id: 'r-mem-204',
        classification: '정기 산정 주기 및 구매확정 마감일',
        ruleDetail: '매년 4회(1월 1일, 4월 1일, 7월 1일, 10월 1일) 산정 / 전월 15일까지의 최근 1년간 주문 중 전월 말일까지 [구매확정] 완료된 실결제 금액 기준',
        exceptionNote: '단순 결제 완료나 배송 중 상태인 주문은 당분기 산정에서 제외되며 차기 산정 시 반영',
      },
    ],
    frontScreenPath: 'https://sisun.com/about/gradeText',
    status: 'active',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-mem-003',
    domain: 'member',
    subCategory: '쿠폰 · 마일리지 사용/소멸',
    code: 'POL-MEM-003',
    title: '쿠폰 · 마일리지 중복 사용 불가 원칙 및 유효기간 · 취소 시 복원 정책',
    summary: '주문 결제 시 쿠폰과 마일리지의 동시 사용 제한, 쿠폰 유효기간(3개월/당월말), 주문 취소·반품 시 복원/소멸 기준입니다.',
    description:
      '프로모션 마진 보호 및 정산 무결성을 위해 시선닷컴 주문서에서는 할인 쿠폰과 마일리지의 중복 적용을 제한하며, 쿠폰 유형별 유효기간 경과 여부에 따라 취소 시 재발급 여부가 결정됩니다.',
    rules: [
      {
        id: 'r-mem-301',
        classification: '쿠폰 · 마일리지 중복 사용 불가',
        ruleDetail: '주문서(결제 화면)에서 할인 쿠폰을 적용한 경우 마일리지(적립금)를 동시에 사용할 수 없음 (택1 사용 원칙)',
        exceptionNote: '쿠폰 선택 시 마일리지 입력란 비활성화 또는 초기화 안내 노출',
      },
      {
        id: 'r-mem-302',
        classification: '일반 등급/웰컴 쿠폰 유효기간',
        ruleDetail: '발급일로부터 3개월간 사용 가능하며, 유효기간 경과 시 자동 소멸',
        exceptionNote: '아울렛 상품 및 일부 특가 기획전 상품은 쿠폰 적용 대상에서 제외',
      },
      {
        id: 'r-mem-303',
        classification: 'SMS 마케팅 수신동의 쿠폰 정책',
        ruleDetail: 'SMS 수신동의 회원에게 매월 1회 발급되며, 발급 당월 말일(23:59:59)에 일괄 소멸',
        exceptionNote: '아울렛 상품 적용 불가',
      },
      {
        id: 'r-mem-304',
        classification: '주문 취소 · 반품 시 쿠폰 복원 기준',
        ruleDetail: '취소/반품 완료 시점에 쿠폰의 원래 유효기간이 남아 있는 경우에만 자동 재발급되며, 유효기간이 이미 만료된 쿠폰은 복원되지 않음',
        exceptionNote: '고객 변심 취소/반품 시 만료 쿠폰 수동 재발급 불가',
      },
    ],
    frontScreenPath: 'https://sisun.com/about/gradeText',
    status: 'active',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 3. 주문 (order) 도메인
  // =========================================================================
  {
    id: 'pol-ord-001',
    domain: 'order',
    subCategory: '배송비 · 부분 선출고 정책',
    code: 'POL-ORD-001',
    title: '전 상품 무료배송(CJ대한통운) 및 복수 상품 주문 시 개별(부분) 선출고 정책',
    summary: '결제 금액과 무관한 전 상품 무료배송 원칙과, 2개 이상 상품 주문 시 준비된 상품부터 먼저 발송하는 부분 선출고 기준입니다.',
    description:
      '시선닷컴은 고객 편의 증대를 위해 구매 금액과 관계없이 전 상품 무료배송을 기본 제공하며, 물류센터 보유 상품과 매장 수급 상품이 함께 주문된 경우 고객 대기 시간을 줄이기 위해 준비된 상품부터 개별 선출고합니다.',
    rules: [
      {
        id: 'r-ord-101',
        classification: '전 상품 무료배송 및 지정 택배사',
        ruleDetail: '시선닷컴 전 상품 구매 금액·수량 무관 무료배송 (지정 택배사: CJ대한통운)',
        exceptionNote: '단, 고객 변심에 의한 반품/교환 시에는 최초 무료배송분을 포함한 왕복 배송비(5,000원) 발생',
      },
      {
        id: 'r-ord-102',
        classification: '복수 상품 주문 시 부분(개별) 선출고',
        ruleDetail: '한 주문번호 내 여러 상품을 주문한 경우, 물류센터에 재고가 확보된 상품 1건이라도 먼저 개별 선출고 진행',
        exceptionNote: '나머지 매장 수급 상품은 확보 완료 시 별도 송장으로 순차 추가 발송 (추가 배송비 회사 부담)',
      },
      {
        id: 'r-ord-103',
        classification: '희망 배송일(지정일 배송) 불가',
        ruleDetail: '물류 및 택배사 사정상 특정 날짜 도착을 지정하는 희망 배송일 예약 서비스는 미지원',
        exceptionNote: '주문 시 배송 메모란에 기재하더라도 택배 기사님 전달 사항으로만 활용됨',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/faq',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-ord-002',
    domain: 'order',
    subCategory: '배송지 지정 및 단계별 변경',
    code: 'POL-ORD-002',
    title: '1주문 단일 배송지 원칙 및 주문 진행 단계별 배송지 변경 가능 조건',
    summary: '주문당 단일 배송지 입력 원칙과 마이페이지에서 고객이 직접 배송지를 변경할 수 있는 주문 상태값 기준입니다.',
    description:
      '물류 출고 지시 및 송장 채번 프로세스와 연동되어 주문 진행 단계에 따라 프론트(마이페이지)에서 배송지 직접 변경 가능 여부가 엄격히 구분됩니다.',
    rules: [
      {
        id: 'r-ord-201',
        classification: '1주문번호 단일 배송지 원칙',
        ruleDetail: '한 번의 주문(단일 주문번호)으로 여러 상품을 결제하더라도 배송지는 1곳만 지정 가능',
        exceptionNote: '서로 다른 주소지로 배송을 원할 경우 주소지별로 각각 주문을 분리하여 결제해야 함',
      },
      {
        id: 'r-ord-202',
        classification: '[결제 완료] · [출고지정] 단계',
        ruleDetail: '마이페이지 > 주문/배송 조회 화면에서 고객이 직접 [배송지 변경] 버튼을 통해 수령인 및 주소 수정 가능',
        exceptionNote: '물류 패킹 작업 착수 전 단계로 즉시 변경 반영',
      },
      {
        id: 'r-ord-203',
        classification: '[출고준비중] 단계',
        ruleDetail: '프론트 화면에서 고객 직접 배송지 변경 불가 (버튼 비활성화/미노출), 고객센터(1644-0107) 또는 1:1 문의를 통해 변경 가능 여부 확인 필요',
        exceptionNote: '이미 물류 현장 패킹/송장 출력이 진행된 경우 고객센터에서도 변경이 불가할 수 있음',
      },
      {
        id: 'r-ord-204',
        classification: '[배송중] · [배송완료] 단계',
        ruleDetail: '택배사 집하 완료 상태이므로 배송지 변경 절대 불가',
        exceptionNote: '주소 오기재 또는 수취인 부재로 반송될 경우 재배송비(또는 반품비)는 고객 부담',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/faq',
    status: 'active',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-ord-003',
    domain: 'order',
    subCategory: '결제 프로모션 · 제3자 동의',
    code: 'POL-ORD-003',
    title: '결제 수단별 제휴 프로모션 안내 및 브랜드 제휴 시 개인정보 제3자 제공 동의 정책',
    summary: '주문서 결제 혜택(삼성카드·BC카드·페이코 등) 노출과 외부 제휴 프로모션 참여 시 개인정보 제3자 제공 동의 UI 정책입니다.',
    description:
      '주문/결제 화면에서 진행 중인 카드사 즉시할인·청구할인 및 간편결제 혜택을 안내하며, 외부 브랜드 제휴 이벤트 대상 주문 시 법적 요건에 부합하는 개인정보 제3자 제공 동의 영역을 조건부 노출합니다.',
    rules: [
      {
        id: 'r-ord-301',
        classification: '결제 수단별 프로모션 혜택 노출',
        ruleDetail: '삼성카드 LINK, BC카드 마이태그, PAYCO 등 결제 수단 선택 영역 및 프로모션 배너에 혜택 조건과 기간을 명시',
        exceptionNote: '프로모션 종료 시 자동 미노출 처리',
      },
      {
        id: 'r-ord-302',
        classification: '제휴 프로모션 개인정보 제3자 제공 동의',
        ruleDetail: '제휴 경품/혜택 대상 조건 충족 시 주문서 하단 약관 영역에 [개인정보 제3자 제공 동의] 항목(제공받는 자, 목적, 항목, 보유기간) 노출',
        exceptionNote: '동의 체크 및 전문 보기 팝업 검증 후 결제 진행',
      },
    ],
    frontScreenPath: 'https://sisun.com/order/cart',
    workspaceUrl: 'https://bychoi-space.github.io/workspace/viewer.html?project=p_3597n',
    status: 'updated',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 4. 전시 (display) 도메인
  // =========================================================================
  {
    id: 'pol-dsp-001',
    domain: 'display',
    subCategory: '멀티 브랜드관 · 카테고리 구조',
    code: 'POL-DSP-001',
    title: '통합몰(SISUN.COM) 및 브랜드관(E.B.M · MICHAA · IT MICHAA) 전시 카테고리 정책',
    summary: '시선닷컴 상단 브랜드 스위처 구조와 대·중카테고리 및 특수 매장(NEW, BEST, 온라인 단독, 아울렛) 전시 체계입니다.',
    description:
      '시선닷컴은 통합몰 메인과 각 브랜드 전용관(E.B.M, MICHAA, IT MICHAA)을 GNB 상단에서 즉시 전환할 수 있는 멀티 브랜드 아키텍처로 구성되며, 공통 상품 카테고리와 브랜드 특화 메뉴를 함께 제공합니다.',
    rules: [
      {
        id: 'r-dsp-101',
        classification: '브랜드관 스위처 (GNB 좌측 상단)',
        ruleDetail: '통합몰(SISUN.COM) 및 브랜드관(E.B.M / MICHAA / IT MICHAA) 간 원클릭 전환 지원',
        exceptionNote: '선택한 브랜드 컨텍스트에 맞춰 메인 배너, GNB 카테고리, 신상품/베스트 랭킹이 전환됨',
      },
      {
        id: 'r-dsp-102',
        classification: '표준 상품 카테고리 체계 (upperCateCode)',
        ruleDetail: '아우터(9801), 원피스(9802), 상의(9803), 하의(9805), 니트(9804), 데님(9806), UNI, ACC(9807) 대카테고리 및 하위 중카테고리(자켓, 코트, 패딩, 블라우스, 스커트 등) 2뎁스 전시',
        exceptionNote: '대카테고리 진입 시 [전체] 탭 기본 선택 및 중카테고리 필터 탭 제공',
      },
      {
        id: 'r-dsp-103',
        classification: '특수 전시 매장',
        ruleDetail: '• NEW: 최근 등록 신상품 모아보기\n• BEST: 실시간/주간 판매 및 조회 베스트 랭킹\n• 온라인 단독: 온라인 전용 기획 상품관\n• 아울렛: 시즌오프 및 이월 할인가 상품관',
        exceptionNote: 'GNB 우측 구분선 이후 콘텐츠형 매장(룩북/캠페인, LIVE, 기획전/이벤트, 아울렛) 배치',
      },
    ],
    frontScreenPath: 'https://sisun.com/',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-dsp-002',
    domain: 'display',
    subCategory: '기획전 · 캠페인 · LIVE 전시',
    code: 'POL-DSP-002',
    title: '기획전 배너 슬롯 · 상품 그룹 정렬 및 LIVE 방송(소스라이브) 연동 정책',
    summary: '기획전/이벤트 목록·상세 화면의 배너 슬롯, 상품 그룹 탭 구성, 정렬 옵션 및 라이브 커머스 전시 규칙입니다.',
    description:
      '시즌 프로모션과 브랜드 기획전을 효과적으로 운영하기 위해 기획전 상단 배너 슬롯과 하단 상품 그룹(앵커 탭)의 노출 순서·정렬 방식을 어드민 설정과 연동하여 제어하며, 소스라이브 기반 LIVE 방송을 프론트에 통합 전시합니다.',
    rules: [
      {
        id: 'r-dsp-201',
        classification: '기획전 배너 슬롯 및 목록 노출',
        ruleDetail: '통합 기획전(/event/intgr/promotion) 진입 시 상단 대표 히어로 배너 슬롯과 진행중 기획전 그리드 카드를 노출하며 브랜드 필터(전체/E.B.M/MICHAA/IT MICHAA) 지원',
        exceptionNote: '전시 기간(시작일시~종료일시) 외 기획전은 프론트 목록에서 자동 제외',
      },
      {
        id: 'r-dsp-202',
        classification: '기획전 상세 상품 그룹 UI 및 정렬',
        ruleDetail: '기획전 상세 하단에 다중 상품 그룹(테마별 탭/앵커)을 구성하며, 관리자 설정에 따른 지정 순서 또는 신상품순·판매순·가격순 정렬 제공',
        exceptionNote: '품절 상품 하단 배치 또는 품절 표시 옵션 연동',
      },
      {
        id: 'r-dsp-203',
        classification: 'LIVE 방송 (소스라이브 연동) 및 룩북',
        ruleDetail: '생방송 및 다시보기(VOD) 플레이어를 소스라이브 솔루션과 연동하여 노출하며, 방송 중 소개 상품을 플레이어 하단/우측에 즉시 구매 가능하도록 매핑',
        exceptionNote: '룩북/캠페인 화보 클릭 시 화보 내 착용 상품 리스트 연동 노출',
      },
    ],
    frontScreenPath: 'https://sisun.com/event/intgr/promotion',
    workspaceUrl: 'https://bychoi-space.github.io/workspace/viewer.html?project=p_523an',
    status: 'updated',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 5. 클레임 (claim) 도메인
  // =========================================================================
  {
    id: 'pol-clm-001',
    domain: 'claim',
    subCategory: '반품/교환 기한 · 자동 구매확정',
    code: 'POL-CLM-001',
    title: '배송완료 후 7일 이내 반품/교환 접수 및 7일 경과 시 자동 구매확정 정책',
    summary: '상품 수령(배송완료) 후 반품·교환 신청 가능 기한과 7일 경과 시 시스템 자동 구매확정 전환 및 클레임 제한 규칙입니다.',
    description:
      '전자상거래법 및 시선닷컴 운영 정책에 따라 배송완료일로부터 7일 이내에만 마이페이지에서 반품/교환 신청이 가능하며, 7일이 경과하면 자동으로 구매확정 상태로 전환되어 정산 및 등급 산정 실적에 반영됩니다.',
    rules: [
      {
        id: 'r-clm-101',
        classification: '반품 · 교환 접수 가능 기한',
        ruleDetail: '[배송완료] 일자로부터 7일 이내에 마이페이지 > 주문/배송 조회 화면에서 직접 반품 또는 교환 접수 가능',
        exceptionNote: '접수 시 지정 택배사(CJ대한통운) 자동 수거 예약 연동',
      },
      {
        id: 'r-clm-102',
        classification: '배송완료 7일 경과 시 자동 구매확정',
        ruleDetail: '배송완료 후 7일이 경과할 때까지 반품/교환 접수가 없는 주문 건은 시스템이 자동으로 [구매확정] 처리',
        exceptionNote: '구매확정 전환 이후에는 마이페이지에서 반품/교환 접수 버튼이 비활성화(접수 불가) 처리됨',
      },
      {
        id: 'r-clm-103',
        classification: '반품 · 교환 불가 사유',
        ruleDetail: '• 구매확정 완료 또는 수령 후 7일 경과 건\n• 고객 부주의로 인한 상품 훼손·세탁·수선·착용 흔적(향수/화장품 오염 등) 발생 건\n• 상품 택(Tag), 라벨, 정품 패키지/옷걸이 등이 분실·훼손된 건',
        exceptionNote: '입고 검수 시 반품 불가 사유 확인될 경우 고객 안내 후 착불 반송 처리',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/customerCenter',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-clm-002',
    domain: 'claim',
    subCategory: '반품 배송비 · 합포장 정산',
    code: 'POL-CLM-002',
    title: '반품/교환 왕복배송비(5,000원) 차감, 무료반품 쿠폰 및 합포장 반품 1건 차감 정책',
    summary: '최초 무료배송 혜택에 따른 반품 시 왕복운임(5,000원) 부과 기준과 복수 상품 1박스 합포장 반품 시 배송비 1건만 차감하는 정산 정책입니다.',
    description:
      '시선닷컴은 최초 주문 시 전 상품 무료배송을 제공하므로, 고객 단순 변심(사이즈/컬러 불만족 등)으로 반품하거나 교환할 경우 왕복 배송비 5,000원이 부과됩니다. 단, 동일 주문 내 여러 상품을 합포장하여 반품하는 경우 고객이 이중 부과받지 않도록 입고 검수 시 1건(5,000원)만 차감합니다.',
    rules: [
      {
        id: 'r-clm-201',
        classification: '단순 변심 반품 · 교환 배송비 기준',
        ruleDetail: '최초 무료배송 혜택이 적용되었으므로 단순 변심 반품/교환 시 왕복 배송비 5,000원 부과 (환불 예정 금액에서 차감 또는 선결제)',
        exceptionNote: '상품 불량 또는 오배송으로 인한 반품/교환 시 배송비는 시선닷컴이 전액 부담',
      },
      {
        id: 'r-clm-202',
        classification: '등급별 무료반품 쿠폰 적용',
        ruleDetail: 'VIP(분기 1장), PRESTIGE(분기 2장), PLATINUM(분기 3장) 회원은 반품 접수 시 무료반품 쿠폰을 선택하여 반품 배송비 면제 가능',
        exceptionNote: '무료반품 쿠폰 적용 시 왕복운임 5,000원 미차감',
      },
      {
        id: 'r-clm-203',
        classification: '복수 상품 합포장 반품 시 배송비 1건 차감',
        ruleDetail: '동일 주문번호 내 여러 상품을 각각 반품 신청한 뒤 1개의 박스에 합포장하여 발송한 경우, 신청 화면상 안내 금액과 무관하게 물류 입고·검수 완료 시 합포장 1건(5,000원)만 차감 후 환불',
        exceptionNote: '각각 별도 박스로 개별 발송하여 택배 송장이 여러 건 발생한 경우에는 실제 발생한 건수만큼 차감될 수 있음',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/customerCenter',
    status: 'active',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-clm-003',
    domain: 'claim',
    subCategory: '수선(AS) 접수 정책',
    code: 'POL-CLM-003',
    title: '시선닷컴 구매 상품 및 오프라인 매장 구매 상품 수선(AS) 접수 기준',
    summary: '온라인몰 구매 상품과 백화점/아울렛 매장 구매 상품의 수선(AS) 접수 채널 및 유·무상 처리 안내 정책입니다.',
    description:
      '의류 및 패션 잡화 상품의 특성상 수선(AS) 요청 시 구매처와 수선 부위 자재 보유 여부에 따라 고객센터 또는 전국 오프라인 매장을 통해 접수·처리합니다.',
    rules: [
      {
        id: 'r-clm-301',
        classification: '시선닷컴 온라인 구매 상품 AS 접수',
        ruleDetail: '마이페이지 > 1:1 문의 또는 고객센터(1644-0107)를 통해 수선 가능 여부 상담 후 접수, 또는 가까운 브랜드 오프라인 매장 방문 접수 가능',
        exceptionNote: '기장 수선 등 개인 체형 맞춤 수선은 온라인에서 진행되지 않으며 매장 방문 또는 개별 수선 필요',
      },
      {
        id: 'r-clm-302',
        classification: '수선 소요 기간 및 비용',
        ruleDetail: '본사 수선실 입고 후 평균 2주 내외 소요되며, 수선 항목 및 부자재 교체 여부에 따라 유상 수선비 및 왕복 택배비가 발생할 수 있음',
        exceptionNote: '원단/부자재 소진 시 수선이 불가할 수 있으며 사전 해피콜 안내 진행',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/faq',
    status: 'active',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 6. 검색 (search) 도메인
  // =========================================================================
  {
    id: 'pol-src-001',
    domain: 'search',
    subCategory: '통합 검색 레이어 · 키워드 추천',
    code: 'POL-SRC-001',
    title: '브랜드 필터 통합 검색 레이어 및 최근 · 추천(#해시태그) · 인기 검색어 노출 정책',
    summary: 'GNB 검색 아이콘 클릭 시 열리는 통합 검색 레이어의 브랜드 범위 선택과 3단 키워드(최근/추천/인기) 노출 규칙입니다.',
    description:
      '고객이 원하는 브랜드 범위 내에서 빠르게 상품을 탐색할 수 있도록 통합 검색창 상단에 브랜드 선택 드롭다운을 제공하며, 검색어 입력 전 최근 검색어·MD 추천 해시태그·실시간 인기 검색어를 함께 노출합니다.',
    rules: [
      {
        id: 'r-src-101',
        classification: '검색 대상 브랜드 범위 필터',
        ruleDetail: '검색 레이어 상단 셀렉트 박스에서 [전체], [E.B.M], [MICHAA], [IT MICHAA] 중 대상 브랜드를 지정하여 검색 실행 가능',
        exceptionNote: '특정 브랜드관 진입 상태에서 검색 레이어를 열면 해당 브랜드 또는 통합 검색으로 유연하게 전환',
      },
      {
        id: 'r-src-102',
        classification: '최근 검색어 저장 및 삭제',
        ruleDetail: '사용자가 검색한 키워드를 브라우저 스토리지에 기록하여 노출하며, 키워드별 개별 삭제(X) 및 [전체삭제] 기능 제공',
        exceptionNote: '최근 검색어 내역이 없을 경우 "최근 검색어가 없습니다." 안내 문구 표시',
      },
      {
        id: 'r-src-103',
        classification: '추천 검색어(#해시태그) 및 인기 검색어',
        ruleDetail: '시즌 주력 아이템 해시태그(예: #니트, #자켓, #원피스, #가디건, #데님 등)와 인기 검색어 순위 목록을 노출하며 클릭 시 즉시 해당 검색 결과로 이동',
        exceptionNote: '관리자(BO) 전시 키워드 설정과 연동',
      },
    ],
    frontScreenPath: 'https://sisun.com/',
    workspaceUrl: 'https://bychoi-space.github.io/workspace/viewer.html?project=p_dcuun',
    status: 'updated',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-src-002',
    domain: 'search',
    subCategory: '검색 결과 필터링 · 정렬',
    code: 'POL-SRC-002',
    title: '검색 결과 페이지(SRP) 다중 조건 필터 및 상품 정렬 · 무결과(No Result) 처리 정책',
    summary: '키워드 검색 결과 화면의 브랜드/카테고리/컬러/사이즈/가격대 상세 필터와 정렬 기준 및 검색 결과 0건 시 안내 정책입니다.',
    description:
      '검색 결과 페이지에서 고객이 세부 속성을 조합하여 상품을 좁혀볼 수 있도록 다중 조건 필터를 제공하며, 일치하는 상품이 없을 경우 추천 키워드 및 베스트 상품을 대체 노출하여 탐색 이탈을 방지합니다.',
    rules: [
      {
        id: 'r-src-201',
        classification: '검색 결과 상세 필터 항목',
        ruleDetail: '브랜드, 카테고리(아우터/원피스/상의/하의 등), 컬러칩, 사이즈, 가격 구간, 품절 상품 제외 체크 필터 지원',
        exceptionNote: '선택된 필터 조건은 상단 칩(Chip) 형태로 표시되며 [초기화] 버튼으로 일괄 해제 가능',
      },
      {
        id: 'r-src-202',
        classification: '검색 결과 정렬 옵션',
        ruleDetail: '신상품순, 판매인기순, 낮은가격순, 높은가격순, 할인율순 정렬 제공',
        exceptionNote: '필터 조건 변경 시 선택된 정렬 기준 유지',
      },
      {
        id: 'r-src-203',
        classification: '검색 결과 없음(0건) 화면 처리',
        ruleDetail: '입력한 검색어와 일치하는 상품이 없을 경우 오타 확인 안내 문구와 함께 추천 해시태그 키워드 및 브랜드 베스트 상품을 하단에 추천 노출',
        exceptionNote: '빈 화면 방지로 재검색 유도',
      },
    ],
    frontScreenPath: 'https://sisun.com/',
    status: 'active',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },

  // =========================================================================
  // 7. 공통 (common) 도메인
  // =========================================================================
  {
    id: 'pol-cmn-001',
    domain: 'common',
    subCategory: '헤더(GNB) · 다국어 · 푸터',
    code: 'POL-CMN-001',
    title: '공통 헤더 유틸리티(위시 · 최근본상품 · 장바구니) 및 다국어 전환(한/영/중) 정책',
    summary: '시선닷컴 전 페이지 공통 상단 헤더/유틸리티 바와 글로벌 고객을 위한 3개 국어(한국어/영어/중국어) 전환 정책입니다.',
    description:
      '시선닷컴은 전 페이지에서 일관된 탐색 경험을 제공하기 위해 상단 고정형(Sticky) GNB와 유틸리티 레이어를 운영하며, 글로벌 스토어 전환을 위한 다국어 선택기를 지원합니다.',
    rules: [
      {
        id: 'r-cmn-101',
        classification: '상단 우측 유틸리티 및 퀵 아이콘',
        ruleDetail: '로그인/회원가입(로그인 시 마이페이지/로그아웃), 위시리스트, 최근본상품(드로어/레이어), 주문/배송 조회, 통합 검색, 장바구니(담긴 상품 수량 배지 실시간 표시)',
        exceptionNote: '장바구니 수량은 기본 0부터 상품 추가/삭제 시 즉시 갱신',
      },
      {
        id: 'r-cmn-102',
        classification: '다국어 몰 전환 (Language Switcher)',
        ruleDetail: '헤더 우측 상단 언어 선택기를 통해 [한국어], [영어(EN)], [중국어(CN)] 전환 지원',
        exceptionNote: '언어 변경 시 해당 언어권 전용 스토어 환경으로 전환',
      },
      {
        id: 'r-cmn-103',
        classification: '푸터 법적 고지 및 에스크로 인증',
        ruleDetail: '사업자 정보(주식회사 시선인터내셔널), 이용약관, 개인정보처리방침(강조 표기), 사업자정보확인, 지급보증(에스크로) 안내 및 브랜드 SNS 채널(Instagram, YouTube, Kakao) 링크 노출',
        exceptionNote: '개인정보처리방침 및 이용약관 버전별 이력 열람 지원',
      },
    ],
    frontScreenPath: 'https://sisun.com/',
    status: 'active',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
  {
    id: 'pol-cmn-002',
    domain: 'common',
    subCategory: 'APP 다운로드 SMS · 고객센터 · 트래킹',
    code: 'POL-CMN-002',
    title: 'APP 다운로드 URL 문자 발송 제한(일 5회/번호 미저장), 고객센터 운영 및 개인화 스크립트 정책',
    summary: '푸터 앱 설치 URL SMS 발송의 스팸 방지·개인정보 보호 원칙과 고객센터 운영시간, GTM/Groobee 트래킹 정책입니다.',
    description:
      'PC 방문 고객이 모바일 앱을 쉽게 설치할 수 있도록 휴대폰 번호 입력 시 앱 다운로드 URL 문자를 발송하되, 무분별한 발송과 개인정보 보관을 원천 차단합니다. 또한 고객센터 상담 운영 기준과 마케팅/개인화 스크립트를 전 페이지 공통으로 적용합니다.',
    rules: [
      {
        id: 'r-cmn-201',
        classification: 'APP 다운로드 URL 문자 발송 제한 및 보안',
        ruleDetail: '• 입력한 휴대폰 번호는 APP 다운로드 URL 문자 발송 목적으로만 일회성 사용되며 서버에 저장되지 않음\n• 스팸 방지를 위해 동일한 휴대폰 번호로는 1일 최대 5회까지만 발송 가능 (초과 시 발송 차단)',
        exceptionNote: '개인정보 수집 동의 절차 없이 안전하게 URL 발송 처리',
      },
      {
        id: 'r-cmn-202',
        classification: '고객센터 운영시간 및 상담 채널',
        ruleDetail: '• 대표번호: 1644-0107\n• 운영시간: 평일 09:30 ~ 17:00 (점심시간 12:30 ~ 14:00 / 주말 및 공휴일 휴무)\n• 온라인 상담: 실시간 톡 상담, 마이페이지 1:1 문의, 고객센터 FAQ',
        exceptionNote: '푸터 및 고객센터 메인 화면에 동일 기준 고지',
      },
      {
        id: 'r-cmn-203',
        classification: '마케팅 · 개인화 추천 스크립트 (GTM / Groobee)',
        ruleDetail: 'Google Tag Manager(GTM-K6F323H) 및 그루비(Groobee) 개인화 추천 엔진 스크립트를 공통 탑재하여 상품 조회/장바구니/구매 이벤트 기반 맞춤 상품 추천 배너 및 카드를 노출',
        exceptionNote: '페이지별 메타 태그(groobee:goods_code 등) 표준 규격 준수',
      },
    ],
    frontScreenPath: 'https://sisun.com/cs/customerCenter',
    status: 'active',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-11-09T09:00:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-11-09T09:00:00.000Z',
  },
];

// 안전한 JSON 파싱 유틸리티 (무오류 원칙 준수)
function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return (parsed ?? fallback) as T;
  } catch (error) {
    console.error('Storage JSON parse error:', error);
    return fallback;
  }
}

// 안전한 고유 ID 생성기
export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${randomStr}`;
}

// 로컬 타임존 기준 오늘 날짜 문자열(YYYY-MM-DD) 반환 헬퍼
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 시작일·마감일 기준 진행 상태 자동 산출 헬퍼
// - 시작일과 마감일이 모두 비어있으면(null/빈 값): 기존 상태(fallbackStatus) 유지 (기본 'backlog')
// - 시작일이 도래하지 않았으면 (today < startDate): 'backlog' (대기)
// - 시작일과 마감일 사이면 (startDate <= today <= dueDate): 'in_progress' (진행중)
// - 마감일이 지나면 (today > dueDate): 'done' (완료)
export function computeTaskStatusByDates(
  startDate?: string | null,
  dueDate?: string | null,
  referenceDate: string = getTodayDateString(),
  fallbackStatus?: TaskStatus
): TaskStatus {
  const start = (startDate || '').trim();
  const due = (dueDate || '').trim();

  if (!start && !due) {
    return fallbackStatus || 'backlog';
  }
  if (due && referenceDate > due) {
    return 'done';
  }
  if (start && referenceDate < start) {
    return 'backlog';
  }
  return 'in_progress';
}

// 첨부파일 원본 다운로드 전용 URL 반환 (?download=원본파일명 보장)
export function resolveAttachmentDownloadUrl(att: TaskAttachment): string {
  const rawUrl = (att.url || '').split('?')[0];
  if (!rawUrl) return '#';
  return `${rawUrl}?download=${encodeURIComponent(att.name || 'attachment')}`;
}

// 브라우저 새 탭에서 읽기 모드로 바로 열람 가능한지 여부 (MS Office 웹 뷰어 또는 브라우저 내장 뷰어)
export function isWebViewableAttachment(att: TaskAttachment): boolean {
  const ext = (att.ext || att.name?.split('.').pop() || '').toLowerCase();
  return [
    'xlsx',
    'xls',
    'pptx',
    'ppt',
    'docx',
    'doc',
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'webp',
    'gif',
    'svg',
  ].includes(ext);
}

// 원본 파일명이 URL 경로 마지막 세그먼트와 Content-Disposition 헤더에 보존되는 스트리밍 프록시 URL 생성
export function resolveNamedAttachmentProxyUrl(att: TaskAttachment): string {
  const rawUrl = (att.url || '').split('?')[0];
  if (!rawUrl) return '#';
  const marker = '/task-attachments/';
  const markerIdx = rawUrl.indexOf(marker);
  const storagePath = (
    att.storagePath || (markerIdx !== -1 ? rawUrl.slice(markerIdx + marker.length) : '')
  ).replace(/^\/+/, '');

  if (storagePath && att.name) {
    const encodedPath = storagePath
      .split('/')
      .filter(Boolean)
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    return `${SUPABASE_URL}/functions/v1/notion-sync/file/${encodedPath}/${encodeURIComponent(att.name)}`;
  }
  return rawUrl;
}

// 첨부파일 브라우저 읽기 모드 바로 열기 URL 반환 (MS Office 파일은 원본 파일명이 보존된 공식 Office Web Viewer 연동)
export function resolveAttachmentViewerUrl(att: TaskAttachment): string {
  const rawUrl = (att.url || '').split('?')[0];
  if (!rawUrl) return '#';
  const ext = (att.ext || att.name?.split('.').pop() || '').toLowerCase();
  const namedFileUrl = resolveNamedAttachmentProxyUrl(att);

  // MS Office 문서 (Excel, PowerPoint, Word) -> 원본 한글 파일명이 표시되는 Microsoft 공식 Office Web Viewer 새 탭 열람
  if (['xlsx', 'xls', 'pptx', 'ppt', 'docx', 'doc'].includes(ext)) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(namedFileUrl)}`;
  }

  // PDF 및 이미지 -> 원본 한글 파일명이 보존된 인라인 스트리밍 URL로 브라우저 내장 뷰어에서 즉시 열람
  if (['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return namedFileUrl;
  }

  // 그 외(ZIP, HWP 등)는 다운로드 URL 반환
  return resolveAttachmentDownloadUrl(att);
}

export class PlanningStorageService {
  private static isSyncing = false;
  private static syncPromise: Promise<void> | null = null;

  // 10/23 초기 가입 당시 폴백 버그로 '최범열' 세션이 고정된 박수민·김리아 대리님 브라우저 자동 복구
  public static recoverPollutedLegacySession(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    if (localStorage.getItem('ds_planning_session_recovered_v1') === 'true') return;

    const isLogged = localStorage.getItem('ds_planning_is_logged_in_v1') === 'true';
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);

    if (isLogged && currentId === 'user-mvfynq9h-dl4un') {
      const hasChoiBrowserMarkers = Boolean(
        localStorage.getItem('ds_planning_onboarding_items_v1') ||
          localStorage.getItem('ds_planning_onboarding_items_v2') ||
          localStorage.getItem('ds_planning_tasks_v1') ||
          localStorage.getItem('ds_planning_users_v1')
      );

      if (!hasChoiBrowserMarkers) {
        const users = safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
        const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS) || '';
        const hadOnboardingV3 = Boolean(localStorage.getItem(STORAGE_KEYS.ONBOARDING_ITEMS));
        const isKimRiaBrowser = rawTasks.includes('task-mw07') || !hadOnboardingV3;

        if (isKimRiaBrowser) {
          const existingKra = users.find(
            (u) => u.name.trim() === '김리아' || String(u.id) === 'user-mvk8jq4m-kra'
          );
          const kraUser: User = existingKra || {
            id: 'user-mvk8jq4m-kra',
            username: 'user_mvk8jq4m',
            name: '김리아',
            password: '1234',
            role: 'member',
            department: '서비스기획팀',
            position: '서비스기획자',
            email: '김리아@company.com',
            avatarColor: '#059669',
          };
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, kraUser.id);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(kraUser));
        } else {
          const existingPsm = users.find(
            (u) => u.name.trim() === '박수민' || String(u.id) === 'user-mvk8jaq3-psm'
          );
          const psmUser: User = existingPsm || {
            id: 'user-mvk8jaq3-psm',
            username: 'user_mvk8jaq3',
            name: '박수민',
            password: '1234',
            role: 'member',
            department: '서비스기획팀',
            position: '서비스기획자',
            email: '박수민@company.com',
            avatarColor: '#7c3aed',
          };
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, psmUser.id);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(psmUser));
        }
      }
      localStorage.setItem('ds_planning_session_recovered_v1', 'true');
    }
  }

  // 1. 초기 시드 데이터 검증 및 초기화 (Supabase DB 전용)
  public static initialize(): void {
    // ONBOARDING_ITEMS 등 신규 스토리지 키 초기화 전에 먼저 오염 세션 복구 수행
    this.recoverPollutedLegacySession();

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VACATIONS)) {
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KPIS)) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORK_INFOS)) {
      localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(INITIAL_WORK_INFO_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ONBOARDING_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(INITIAL_ONBOARDING_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POLICY_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(INITIAL_POLICY_ITEMS));
    }

    // Supabase가 활성화되어 있으면 백그라운드 원격 동기화 시도
    this.syncFromSupabase();
  }

  // --- Supabase 클라우드 DB 백그라운드 동기화 (무오류 보호 및 진행 중 Promise 공유) ---
  public static async syncFromSupabase(): Promise<void> {
    if (!isSupabaseEnabled()) return;
    if (this.isSyncing && this.syncPromise) {
      return this.syncPromise;
    }
    const client = getSupabaseClient();
    if (!client) return;

    this.isSyncing = true;
    this.syncPromise = (async () => {
      try {
        // 0. users 동기화 (클라우드 회원 DB - 로컬 가입 회원 안전 병합 및 원격 자동 푸시)
        const { data: remoteUsers, error: userErr } = await client.from('users').select('*').order('created_at', { ascending: true });
        if (!userErr && remoteUsers && remoteUsers.length > 0) {
          this.recoverPollutedLegacySession();
          const localUsers = safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
          const prevCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
          const prevSnapshot = safeJsonParse<User | null>(
            localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT),
            null
          );
          const prevCurrentUser =
            localUsers.find((u) => String(u.id) === String(prevCurrentId)) || prevSnapshot;

          const mappedRemoteUsers: User[] = remoteUsers.map((row) => ({
            id: String(row.id),
            username: row.username || `user_${String(row.id)}`,
            name: row.name,
            password: row.password ?? '',
            role: row.role as UserRole,
            department: row.department,
            position: row.position || (row.role === 'admin' ? '팀장 / 수석기획자' : row.role === 'member' ? '서비스기획자' : '유관부서 담당자'),
            email: row.email || `${row.name.replace(/\s+/g, '').toLowerCase()}@company.com`,
            avatarColor: row.avatar_color || '#2563eb',
          }));

          const userMap = new Map<string, User>();
          mappedRemoteUsers.forEach((u) => userMap.set(u.name.trim(), u));

          for (const localUser of localUsers) {
            const key = localUser.name.trim();
            if (!userMap.has(key)) {
              userMap.set(key, localUser);
              this.pushUserToRemote(localUser);
            } else {
              const remoteUser = userMap.get(key)!;
              if (!remoteUser.password && localUser.password) {
                remoteUser.password = localUser.password;
                this.pushUserToRemote(remoteUser);
              }
            }
          }

          const mergedUsers = Array.from(userMap.values());
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));

          // 로그인된 사용자 세션 ID가 이름 기준으로 매칭되는 원격 회원 ID로 갱신되어야 하는 경우 보정
          if (this.isLoggedIn() && prevCurrentUser) {
            const matchedMerged = mergedUsers.find((u) => u.name.trim() === prevCurrentUser.name.trim());
            if (matchedMerged) {
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matchedMerged.id);
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(matchedMerged));
            }
          }
        }

      // 1. tasks 동기화 (로컬 데이터 보존 및 원격/Notion 삭제 항목 정리)
      const [{ data: remoteTasks, error: taskErr }, { data: remoteDeleteLogs }] = await Promise.all([
        client.from('tasks').select('*'),
        client
          .from('audit_logs')
          .select('entity_id')
          .eq('entity_type', 'task')
          .eq('action', 'DELETE'),
      ]);
      if (!taskErr && remoteTasks) {
        const deletedTaskIds = new Set<string>(
          (remoteDeleteLogs || []).map((row: any) => String(row.entity_id || ''))
        );
        const SUPERSEDED_MANUAL_TASK_IDS = new Set([
          // 디자인 구 수기 등록 6건
          'task-mvyiimh8-qp6sq',
          'task-mvyifvxj-u3ajq',
          'task-mvpzirjl-ji6dz',
          'task-mvowcjk1-vycle',
          'task-mvowbzus-ahlsu',
          'task-mvk8olb8-z6sqd',
          // 퍼블리싱 구 수기 등록 17건 (Notion 원본 과제로 통합 대체됨)
          'task-mw07wx9y-qj1ri',
          'task-mw07we5u-5j3gf',
          'task-mw07vop4-ehgh4',
          'task-mw07ulct-bx6n9',
          'task-mw07t7ws-g881o',
          'task-mw07twhn-8yqxt',
          'task-mw07iwf3-2wsmj',
          'task-mw07ha9v-nwa0p',
          'task-mw07gkqd-jsy3t',
          'task-mw07fdc8-hy2vg',
          'task-mw07dwff-2lo18',
          'task-mw07ckeq-frl6e',
          'task-mw07bpxz-5hjc0',
          'task-mw07ay8l-ftqdx',
          'task-mw075vzi-mlwsa',
          'task-mw077vd8-8jx92',
          'task-mw079msk-vkmyz',
        ]);
        const filteredTasks = remoteTasks.filter(
          (row) =>
            !String(row.id).startsWith('task-10') &&
            !SUPERSEDED_MANUAL_TASK_IDS.has(String(row.id))
        );
        const mappedRemoteTasks: TaskItem[] = filteredTasks.map((row) => {
          const autoStatus = computeTaskStatusByDates(
            row.start_date,
            row.due_date,
            getTodayDateString(),
            (row.status as TaskStatus) || 'backlog'
          );
          return {
            id: row.id,
            title: row.title,
            category: row.category,
            track: (row.track as any) || '기획',
            assigneeId: row.assignee_id,
            assigneeName: row.assignee_name,
            priority: row.priority,
            status: autoStatus,
            startDate: row.start_date || '',
            dueDate: row.due_date || '',
            progress: autoStatus === 'done' ? 100 : Number(row.progress || 0),
            description: row.description || '',
            links: row.links || [],
            attachments: Array.isArray(row.attachments) ? row.attachments : [],
            workspaceProjectId: row.workspace_project_id || undefined,
            period: row.period || undefined,
            notionUrl: row.notion_url || undefined,
            figmaUrl: row.figma_url || undefined,
            jiraUrl: row.jira_url || undefined,
            artifactUrl: row.artifact_url || undefined,
            themeIndex: row.theme_index !== undefined ? Number(row.theme_index) : undefined,
            version: row.version || '0.1',
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedBy: row.updated_by,
            updatedAt: row.updated_at,
          };
        });

        const remoteIdSet = new Set<string>(mappedRemoteTasks.map((r) => String(r.id)));

        // 로컬에 등록된 기존 데이터 보호 및 원격 삭제(Notion 휴지통 이동 포함) 항목 제외
        const localTasks = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []).filter(
          (t) => {
            const tid = String(t.id);
            if (tid.startsWith('task-10') || SUPERSEDED_MANUAL_TASK_IDS.has(tid)) {
              return false;
            }
            if (!remoteIdSet.has(tid)) {
              const isRemoteDeletedOrNotionSynced =
                deletedTaskIds.has(tid) || tid.startsWith('notion-') || Boolean(t.notionUrl);
              if (isRemoteDeletedOrNotionSynced) {
                return false;
              }
            }
            return true;
          }
        );

        const taskMap = new Map<string, TaskItem>();
        // 1-1. 로컬 데이터 먼저 맵에 등록 (사용자가 새로 등록한 미동기화 작업 보존)
        localTasks.forEach((t) => {
          const autoStatus = computeTaskStatusByDates(
            t.startDate,
            t.dueDate,
            getTodayDateString(),
            t.status
          );
          taskMap.set(t.id, {
            ...t,
            startDate: t.startDate || '',
            dueDate: t.dueDate || '',
            status: autoStatus,
            progress: autoStatus === 'done' ? 100 : t.progress,
          });
        });

        // 1-2. 원격 데이터 병합 (원격 정보 갱신, 단 로컬의 track 및 attachments 정보 보존)
        mappedRemoteTasks.forEach((remote) => {
          const local = taskMap.get(remote.id);
          taskMap.set(remote.id, {
            ...remote,
            track: remote.track || local?.track || '기획',
            attachments:
              Array.isArray(remote.attachments) && remote.attachments.length > 0
                ? remote.attachments
                : local?.attachments || [],
          });
        });

        const mergedTasks = Array.from(taskMap.values());
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ds-portal-tasks-updated'));
        }

        // 1-3. 로컬에만 있고 원격에 아직 반영 안 된 신규 항목이 있으면 자동 백그라운드 푸시
        for (const localTask of localTasks) {
          if (!remoteIdSet.has(String(localTask.id))) {
            this.pushTaskToRemote(localTask);
          }
        }
      }

      // 2. vacations 동기화 (로컬 데이터 안전 병합)
      const { data: remoteVac, error: vacErr } = await client.from('vacations').select('*');
      if (!vacErr && remoteVac) {
        const filteredVac = remoteVac.filter((row) => !String(row.id).startsWith('vac-20'));
        const mappedRemoteVac: VacationItem[] = filteredVac.map((row) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          department: row.department,
          type: row.type,
          startDate: row.start_date,
          endDate: row.end_date,
          deputyId: row.deputy_id,
          deputyName: row.deputy_name,
          contact: row.contact || '',
          notes: row.notes || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }));

        const localVac = safeJsonParse<VacationItem[]>(localStorage.getItem(STORAGE_KEYS.VACATIONS), []).filter(
          (v) => !String(v.id).startsWith('vac-20')
        );
        const vacMap = new Map<string, VacationItem>();
        localVac.forEach((v) => vacMap.set(v.id, v));
        mappedRemoteVac.forEach((r) => vacMap.set(r.id, r));

        localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(Array.from(vacMap.values())));
      }

      // 3. kpis 동기화 (로컬 데이터 안전 병합)
      const { data: remoteKpis, error: kpiErr } = await client.from('kpis').select('*');
      if (!kpiErr && remoteKpis) {
        const filteredKpis = remoteKpis.filter(
          (row) => !String(row.id).startsWith('kpi-30') && String(row.id) !== 'kpi-mw1s2aoz-2clky'
        );
        const mappedRemoteKpis: KpiItem[] = filteredKpis.map((row) => ({
          id: row.id,
          year: Number(row.year),
          quarter: row.quarter,
          targetScope: row.target_scope,
          ownerId: row.owner_id || undefined,
          ownerName: row.owner_name,
          track: row.track || '기획',
          title: row.title,
          targetMetric: row.target_metric,
          targetValue: row.target_value,
          currentValue: row.current_value || '',
          weight: Number(row.weight || 0),
          achievementRate: Number(row.achievement_rate || 0),
          status: row.status,
          stage: row.stage || (row.status === 'planning' ? 'draft' : 'aligned'),
          checkins: Array.isArray(row.checkins) ? row.checkins : [],
          peerReviews: Array.isArray(row.peer_reviews) ? row.peer_reviews : [],
          peerAvgScore: row.peer_avg_score ? Number(row.peer_avg_score) : undefined,
          selfEvaluation: row.self_evaluation || '',
          selfScore: row.self_score ? Number(row.self_score) : undefined,
          leaderScore: row.leader_score ? Number(row.leader_score) : undefined,
          leaderGrade: row.leader_grade || undefined,
          leaderComment: row.leader_comment || undefined,
          leaderEvaluatedAt: row.leader_evaluated_at || undefined,
          directorScore: row.director_score ? Number(row.director_score) : undefined,
          directorGrade: row.director_grade || undefined,
          directorComment: row.director_comment || undefined,
          directorEvaluatedAt: row.director_evaluated_at || undefined,
          finalEvaluation: row.final_evaluation || '',
          evaluatorName: row.evaluator_name || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }));

        const localKpis = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []).filter(
          (k) => !String(k.id).startsWith('kpi-30') && String(k.id) !== 'kpi-mw1s2aoz-2clky'
        );
        const kpiMap = new Map<string, KpiItem>();
        mappedRemoteKpis.forEach((r) => kpiMap.set(r.id, r));
        localKpis.forEach((k) => {
          const remote = kpiMap.get(k.id);
          kpiMap.set(k.id, remote ? { ...remote, ...k } : k);
        });

        localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(Array.from(kpiMap.values())));
      }

      // 4. audit_logs, 업무 관련 정보(work_infos), KPI 확장/동료피드백 데이터 동기화
      const { data: remoteLogs, error: logErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      if (!logErr && remoteLogs && remoteLogs.length > 0) {
        const cloudWorkInfoRow = remoteLogs.find((row) => row.id === WORK_INFO_CLOUD_RECORD_ID);
        if (cloudWorkInfoRow && typeof cloudWorkInfoRow.summary === 'string') {
          const parsedWorkInfos = safeJsonParse<WorkInfoItem[]>(cloudWorkInfoRow.summary, []);
          if (Array.isArray(parsedWorkInfos) && parsedWorkInfos.length > 0) {
            localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(parsedWorkInfos));
          }
        }

        const cloudOnboardingRow = remoteLogs.find((row) => row.id === ONBOARDING_CLOUD_RECORD_ID);
        if (cloudOnboardingRow && typeof cloudOnboardingRow.summary === 'string') {
          const parsedOnboarding = safeJsonParse<OnboardingChecklistItem[]>(cloudOnboardingRow.summary, []);
          if (Array.isArray(parsedOnboarding) && parsedOnboarding.length > 0) {
            localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(parsedOnboarding));
          }
        }

        const cloudPolicyRow = remoteLogs.find((row) => row.id === POLICY_CLOUD_RECORD_ID);
        if (cloudPolicyRow && typeof cloudPolicyRow.summary === 'string') {
          const parsedPolicies = safeJsonParse<SisunPolicyItem[]>(cloudPolicyRow.summary, []);
          if (Array.isArray(parsedPolicies) && parsedPolicies.length > 0) {
            localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(parsedPolicies));
          }
        }

        const cloudKpiRow = remoteLogs.find((row) => row.id === KPI_CLOUD_RECORD_ID);
        if (cloudKpiRow && typeof cloudKpiRow.summary === 'string') {
          const parsedExtendedKpis = safeJsonParse<KpiItem[]>(cloudKpiRow.summary, []).filter(
            (k) => String(k.id) !== 'kpi-mw1s2aoz-2clky'
          );
          if (Array.isArray(parsedExtendedKpis) && parsedExtendedKpis.length > 0) {
            const currentKpis = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []).filter(
              (k) => String(k.id) !== 'kpi-mw1s2aoz-2clky'
            );
            const mergedMap = new Map<string, KpiItem>();
            currentKpis.forEach((k) => mergedMap.set(k.id, k));
            parsedExtendedKpis.forEach((ext) => {
              const existing = mergedMap.get(ext.id);
              if (existing) {
                mergedMap.set(ext.id, {
                  ...existing,
                  ...ext,
                  linkedTaskIds: Array.isArray(ext.linkedTaskIds)
                    ? ext.linkedTaskIds
                    : existing.linkedTaskIds || [],
                  peerReviews: Array.isArray(ext.peerReviews) && ext.peerReviews.length > 0
                    ? ext.peerReviews
                    : existing.peerReviews || [],
                  peerAvgScore: ext.peerAvgScore ?? existing.peerAvgScore,
                });
              } else {
                mergedMap.set(ext.id, ext);
              }
            });
            localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(Array.from(mergedMap.values())));
          }
        }

        const mappedLogs: AuditLog[] = remoteLogs
          .filter(
            (row) =>
              row.id !== WORK_INFO_CLOUD_RECORD_ID &&
              row.entity_title !== 'WORK_INFO_STORE' &&
              row.id !== ONBOARDING_CLOUD_RECORD_ID &&
              row.entity_title !== 'ONBOARDING_STORE' &&
              row.id !== POLICY_CLOUD_RECORD_ID &&
              row.entity_title !== 'POLICY_STORE' &&
              row.id !== KPI_CLOUD_RECORD_ID &&
              row.entity_title !== 'KPI_EXTENDED_STORE'
          )
          .map((row) => ({
            id: row.id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            entityTitle: row.entity_title,
            action: row.action,
            actorId: row.actor_id,
            actorName: row.actor_name,
            actorRole: row.actor_role,
            timestamp: row.timestamp,
            summary: row.summary,
          }));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(mappedLogs));
      }
    } catch (e) {
      console.warn('Supabase background sync skipped (tables pending creation):', e);
    } finally {
      this.isSyncing = false;
      this.syncPromise = null;
    }
    })();

    return this.syncPromise;
  }

  // --- 사용자 및 인증/세션 관리 (Supabase DB 기반) ---
  public static getUsers(): User[] {
    this.initialize();
    return safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
  }

  // 서비스기획팀 소속으로 가입된 팀원 목록 조회 (담당자/대행자 선택용)
  public static getServicePlanningMembers(): User[] {
    const users = this.getUsers();
    const members = users.filter(
      (u) =>
        u.department === '서비스기획팀' ||
        u.department?.includes('서비스기획') ||
        u.role === 'admin' ||
        u.role === 'member'
    );
    if (members.length > 0) return members;
    const current = this.getCurrentUser();
    return current ? [current] : [];
  }

  // 원격 Supabase users 테이블로 회원 정보 업서트 (id/username 포함 스키마 및 시퀀스 스키마 모두 호환)
  public static async pushUserToRemote(user: User): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const payloadFull = {
      id: user.id,
      username: user.username || `user_${Date.now().toString(36)}`,
      name: user.name,
      password: user.password || '',
      role: user.role,
      department: user.department,
      position: user.position || (user.role === 'viewer' ? '유관부서 담당자' : '서비스기획자'),
      email: user.email || `${user.name.replace(/\s+/g, '').toLowerCase()}@company.com`,
      avatar_color: user.avatarColor || '#2563eb',
    };

    try {
      // 먼저 동일 성명(name)으로 등록된 원격 레코드가 있으면 비밀번호·부서·역할을 즉시 업데이트
      await client
        .from('users')
        .update({
          password: user.password || '',
          department: user.department,
          role: user.role,
          position: user.position || (user.role === 'viewer' ? '유관부서 담당자' : '서비스기획자'),
        })
        .eq('name', user.name.trim());

      const { error } = await client.from('users').upsert(payloadFull);
      if (error) {
        if (error.message.includes('username')) {
          const { username: _unused, ...payloadWithoutUsername } = payloadFull;
          await client.from('users').upsert(payloadWithoutUsername);
        } else {
          console.warn('[Supabase] User upsert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('[Supabase] User push error:', e);
    }
  }

  public static isLoggedIn(): boolean {
    this.recoverPollutedLegacySession();
    if (localStorage.getItem('ds_planning_is_logged_in_v1') !== 'true') {
      return false;
    }
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const snapshot = safeJsonParse<User | null>(localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT), null);
    return Boolean(currentId || snapshot?.name);
  }

  public static getCurrentUser(): User {
    this.recoverPollutedLegacySession();
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const snapshot = safeJsonParse<User | null>(localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT), null);

    if (currentId) {
      const matchedById = users.find((u) => String(u.id) === String(currentId));
      if (matchedById) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(matchedById));
        return matchedById;
      }
    }

    if (snapshot?.name) {
      const matchedByName = users.find((u) => u.name.trim() === snapshot.name.trim());
      if (matchedByName) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matchedByName.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(matchedByName));
        return matchedByName;
      }
      return snapshot;
    }

    // 비로그인 또는 세션 미설정 시 localStorage를 오염시키지 않는 메모리 전용 기본 객체 반환
    return {
      id: '',
      name: '',
      role: 'viewer',
      department: '서비스기획팀',
      position: '서비스기획자',
      email: '',
      avatarColor: '#2563eb',
    };
  }

  public static setCurrentUser(userId: string): User {
    const users = this.getUsers();
    const target = users.find((u) => String(u.id) === String(userId));
    if (target) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(target));
      localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
      localStorage.setItem('ds_planning_session_recovered_v1', 'true');
      this.recordAuditLog({
        entityType: 'auth',
        entityId: target.id,
        entityTitle: target.name,
        action: 'LOGIN',
        summary: `${target.name}(${target.role === 'viewer' ? '유관부서 뷰어' : '기획팀원'}) 계정으로 전환/로그인`,
        actorOverride: { id: target.id, name: target.name, role: target.role },
      });
      return target;
    }
    return this.getCurrentUser();
  }

  // 로그인 인증 처리 (이름 + 비밀번호)
  public static login(name: string, password?: string): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const trimmedName = name.trim();
    const found = users.find(
      (u) => u.name.trim() === trimmedName || u.name.startsWith(trimmedName)
    );

    if (!found) {
      return { success: false, message: '등록되지 않은 이름입니다. [회원가입]을 진행해 주세요.' };
    }

    if (!password) {
      return { success: false, message: '비밀번호를 입력해 주세요.' };
    }

    // 비밀번호가 설정되어 있는 경우 검증
    if (found.password && found.password !== password) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    // 비밀번호가 비어있던 복구 계정의 경우 최초 로그인 비밀번호를 저장 및 동기화
    if (!found.password) {
      found.password = password;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.pushUserToRemote(found);
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
    localStorage.setItem('ds_planning_session_recovered_v1', 'true');

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'LOGIN',
      summary: `${found.name} (${found.department}) 포털 로그인 성공`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return { success: true, user: found };
  }

  // 신규 회원가입 처리 (Supabase users 테이블 스키마 완벽 호환)
  public static async registerUser(params: {
    name: string;
    password: string;
    department: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    await this.syncFromSupabase();
    const users = this.getUsers();
    const trimmedName = params.name.trim();

    // 역할 자동 결정: 서비스기획팀이면 member, 그 외 유관부서는 viewer
    const isPlanTeam = params.department.includes('서비스기획') || params.department.includes('기획');
    const role: UserRole = isPlanTeam ? 'member' : 'viewer';

    // 이미 동일 이름이 존재하는 경우: 비밀번호 미설정(복구 계정) 또는 초기 시드 계정('1234')이면 비밀번호/부서 갱신 허용
    const existingUser = users.find((u) => u.name.trim() === trimmedName);
    if (existingUser) {
      const isInitialSeedAccount =
        !existingUser.password ||
        ((existingUser.id === 'user-mvk8jaq3-psm' || existingUser.id === 'user-mvk8jq4m-kra') &&
          existingUser.password === '1234');

      if (isInitialSeedAccount) {
        existingUser.password = params.password;
        existingUser.department = params.department;
        existingUser.role = role;
        existingUser.position = isPlanTeam ? '서비스기획자' : '유관부서 담당자';
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existingUser.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(existingUser));
        localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
        localStorage.setItem('ds_planning_session_recovered_v1', 'true');
        await this.pushUserToRemote(existingUser);
        return { success: true, user: existingUser };
      }
      return { success: false, message: '이미 동일한 이름으로 등록된 사용자가 있습니다. [로그인] 탭을 이용해 주세요.' };
    }

    const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const assignedId = generateUniqueId('user');
    const assignedUsername = `user_${Date.now().toString(36)}`;

    const newUser: User = {
      id: assignedId,
      username: assignedUsername,
      name: trimmedName,
      password: params.password,
      role,
      department: params.department,
      position: isPlanTeam ? '서비스기획자' : '유관부서 담당자',
      email: `${trimmedName.replace(/\s+/g, '').toLowerCase()}@company.com`,
      avatarColor: randomColor,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(newUser));
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
    localStorage.setItem('ds_planning_session_recovered_v1', 'true');

    // Supabase DB 동기화 저장
    await this.pushUserToRemote(newUser);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: newUser.id,
      entityTitle: newUser.name,
      action: 'CREATE',
      summary: `신규 회원가입: ${newUser.name} (${newUser.department}, ${role === 'member' ? '기획팀원' : '유관부서 뷰어'})`,
      actorOverride: { id: newUser.id, name: newUser.name, role: newUser.role },
    });

    return { success: true, user: newUser };
  }

  // 로그아웃 처리 (세션 스토리지 완전 정리)
  public static logout(): void {
    const current = this.getCurrentUser();
    localStorage.setItem('ds_planning_is_logged_in_v1', 'false');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT);
    if (current.id && current.name) {
      this.recordAuditLog({
        entityType: 'auth',
        entityId: current.id,
        entityTitle: current.name,
        action: 'LOGIN',
        summary: `${current.name} 포털 로그아웃`,
        actorOverride: { id: current.id, name: current.name, role: current.role },
      });
    }
  }

  // [비밀번호 관리 1] 비로그인 상태: 이름 + 가입 소속 부서 일치 검증 후 즉시 새 비밀번호 재설정
  public static async resetPasswordByIdentity(params: {
    name: string;
    department: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers();
    const trimmedName = params.name.trim();
    const trimmedDept = params.department.trim();

    if (!trimmedName) {
      return { success: false, message: '이름(성명)을 입력해 주세요.' };
    }
    if (!trimmedDept) {
      return { success: false, message: '가입 시 선택한 소속 부서를 선택해 주세요.' };
    }
    if (!params.newPassword) {
      return { success: false, message: '새 비밀번호를 입력해 주세요.' };
    }

    const found = users.find((u) => u.name.trim() === trimmedName);
    if (!found) {
      return {
        success: false,
        message: '등록되지 않은 이름입니다. 성명을 다시 확인하거나 [회원가입]을 진행해 주세요.',
      };
    }

    if (found.department.trim() !== trimmedDept) {
      return {
        success: false,
        message: '가입 시 등록된 소속 부서와 일치하지 않습니다. 소속 부서를 다시 확인해 주세요.',
      };
    }

    found.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const currentSnapshot = safeJsonParse<User | null>(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT),
      null
    );
    if (currentSnapshot && currentSnapshot.name.trim() === found.name.trim()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));
    }

    await this.pushUserToRemote(found);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'UPDATE',
      summary: `[비밀번호 재설정] ${found.name} (${found.department}) 본인 확인(성명+소속부서)을 통한 비밀번호 재설정 완료`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return {
      success: true,
      message: `${found.name}님의 비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인해 주세요.`,
    };
  }

  // [비밀번호 관리 2] 로그인 상태: 내 비밀번호 변경 (현재 비밀번호 검증 -> 새 비밀번호 저장)
  public static async changeMyPassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();
    const found =
      users.find((u) => String(u.id) === String(params.userId)) ||
      users.find((u) => u.name.trim() === currentUser.name.trim());

    if (!found) {
      return { success: false, message: '현재 로그인된 계정 정보를 찾을 수 없습니다.' };
    }

    if (!params.currentPassword) {
      return { success: false, message: '현재 비밀번호를 입력해 주세요.' };
    }

    const isSeedPasswordBypass =
      (found.id === 'user-mvk8jaq3-psm' || found.id === 'user-mvk8jq4m-kra') &&
      found.password === '1234';

    if (found.password && !isSeedPasswordBypass && found.password !== params.currentPassword) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }

    if (!params.newPassword) {
      return { success: false, message: '새 비밀번호를 입력해 주세요.' };
    }

    if (found.password && !isSeedPasswordBypass && found.password === params.newPassword) {
      return { success: false, message: '새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요.' };
    }

    found.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));

    await this.pushUserToRemote(found);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'UPDATE',
      summary: `[내 비밀번호 변경] ${found.name} (${found.department}) 본인이 직접 비밀번호를 변경함`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return {
      success: true,
      message: '비밀번호가 안전하게 변경되었습니다.',
    };
  }

  // [비밀번호 관리 3] 관리자(최범열) 전용: 특정 회원의 비밀번호 강제 초기화 또는 임시 비밀번호 지정
  public static async adminResetUserPassword(params: {
    targetUserId: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser();
    const isAdmin = currentUser.role === 'admin' || currentUser.name?.trim() === '최범열';
    if (!isAdmin) {
      return { success: false, message: '관리자만 회원의 비밀번호를 초기화할 수 있습니다.' };
    }

    const users = this.getUsers();
    const target = users.find((u) => String(u.id) === String(params.targetUserId));
    if (!target) {
      return { success: false, message: '대상 회원 정보를 찾을 수 없습니다.' };
    }

    target.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (target.name.trim() === currentUser.name.trim()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(target));
    }

    await this.pushUserToRemote(target);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: target.id,
      entityTitle: target.name,
      action: 'UPDATE',
      summary: params.newPassword
        ? `[관리자 비밀번호 지정] 관리자(${currentUser.name})가 ${target.name} (${target.department}) 계정의 비밀번호를 재설정함`
        : `[관리자 비밀번호 초기화] 관리자(${currentUser.name})가 ${target.name} (${target.department}) 계정을 최초 로그인 시 비밀번호 재설정 상태로 초기화함`,
    });

    return {
      success: true,
      message: params.newPassword
        ? `${target.name}님의 비밀번호가 지정한 비밀번호로 변경되었습니다.`
        : `${target.name}님의 비밀번호가 초기화되었습니다. (다음 로그인 시 입력하는 비밀번호로 자동 설정됩니다)`,
    };
  }

  public static isViewer(): boolean {
    return this.getCurrentUser().role === 'viewer';
  }

  // --- 감사 로그 (Audit Logs) 기록 유틸리티 ---
  public static getAuditLogs(): AuditLog[] {
    this.initialize();
    const logs = safeJsonParse<AuditLog[]>(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS), []).filter(
      (log) =>
        log.id !== WORK_INFO_CLOUD_RECORD_ID &&
        log.entityTitle !== 'WORK_INFO_STORE' &&
        log.id !== ONBOARDING_CLOUD_RECORD_ID &&
        log.entityTitle !== 'ONBOARDING_STORE' &&
        log.id !== POLICY_CLOUD_RECORD_ID &&
        log.entityTitle !== 'POLICY_STORE' &&
        log.id !== KPI_CLOUD_RECORD_ID &&
        log.entityTitle !== 'KPI_EXTENDED_STORE'
    );
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static recordAuditLog(params: {
    entityType: 'task' | 'vacation' | 'kpi' | 'auth' | 'work_info' | 'onboarding' | 'policy';
    entityId: string;
    entityTitle: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE';
    summary: string;
    actorOverride?: { id: string; name: string; role: UserRole };
  }): void {
    const actor = params.actorOverride || this.getCurrentUser();
    const newLog: AuditLog = {
      id: generateUniqueId('log'),
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      action: params.action,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      summary: params.summary,
    };

    const logs = this.getAuditLogs();
    const updated = [newLog, ...logs].slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    // Supabase DB 비동기 반영
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('audit_logs').insert({
        id: newLog.id,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        entity_title: newLog.entityTitle,
        action: newLog.action,
        actor_id: newLog.actorId,
        actor_name: newLog.actorName,
        actor_role: newLog.actorRole,
        timestamp: newLog.timestamp,
        summary: newLog.summary,
      }).then(({ error }) => {
        if (error) console.warn('Supabase audit log insert note:', error.message);
      });
    }
  }

  // --- 1. 업무 관리 (Task) CRUD ---
  public static getTasks(): TaskItem[] {
    this.initialize();
    const supersededIds = new Set([
      // 디자인 구 수기 등록 6건
      'task-mvyiimh8-qp6sq',
      'task-mvyifvxj-u3ajq',
      'task-mvpzirjl-ji6dz',
      'task-mvowcjk1-vycle',
      'task-mvowbzus-ahlsu',
      'task-mvk8olb8-z6sqd',
      // 퍼블리싱 구 수기 등록 17건 (Notion 원본 과제로 통합 대체됨)
      'task-mw07wx9y-qj1ri',
      'task-mw07we5u-5j3gf',
      'task-mw07vop4-ehgh4',
      'task-mw07ulct-bx6n9',
      'task-mw07t7ws-g881o',
      'task-mw07twhn-8yqxt',
      'task-mw07iwf3-2wsmj',
      'task-mw07ha9v-nwa0p',
      'task-mw07gkqd-jsy3t',
      'task-mw07fdc8-hy2vg',
      'task-mw07dwff-2lo18',
      'task-mw07ckeq-frl6e',
      'task-mw07bpxz-5hjc0',
      'task-mw07ay8l-ftqdx',
      'task-mw075vzi-mlwsa',
      'task-mw077vd8-8jx92',
      'task-mw079msk-vkmyz',
    ]);
    const rawStored = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []);
    const stored = rawStored.filter((t) => !supersededIds.has(String(t.id)));
    if (stored.length !== rawStored.length) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(stored));
    }
    const trackOrder: Record<string, number> = {
      기획: 0,
      디자인: 1,
      퍼블리싱: 2,
    };

    // 시작일·마감일 기준 진행 상태 자동 산출, 기본값 보정 및 파트별(기획 -> 디자인 -> 퍼블리싱) 일관 정렬
    return stored
      .map((t) => {
        const autoStatus = computeTaskStatusByDates(
          t.startDate,
          t.dueDate,
          getTodayDateString(),
          t.status
        );
        return {
          ...t,
          startDate: t.startDate || '',
          dueDate: t.dueDate || '',
          track: t.track || '기획',
          status: autoStatus,
          progress: autoStatus === 'done' ? 100 : t.progress,
          attachments: Array.isArray(t.attachments) ? t.attachments : [],
          createdBy:
            t.id === 'task-mvk8olb8-z6sqd' && t.createdBy === '최범열' ? '박수민' : t.createdBy,
        };
      })
      .sort((a, b) => {
        const trackDiff = (trackOrder[a.track] ?? 0) - (trackOrder[b.track] ?? 0);
        if (trackDiff !== 0) return trackDiff;
        const aHasDate = Boolean(a.startDate || a.dueDate);
        const bHasDate = Boolean(b.startDate || b.dueDate);
        if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
        const startDiff = (b.startDate || '').localeCompare(a.startDate || '');
        if (startDiff !== 0) return startDiff;
        const dueDiff = (b.dueDate || '').localeCompare(a.dueDate || '');
        if (dueDiff !== 0) return dueDiff;
        return (a.title || '').localeCompare(b.title || '');
      });
  }

  // 업무 첨부파일(Excel · PPT · PDF 등) Supabase Storage 업로드
  public static async uploadTaskAttachment(
    file: File,
    uploaderName: string
  ): Promise<TaskAttachment> {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 파일을 업로드할 수 없습니다.');
    }
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error('파일 크기는 최대 50MB 이하만 업로드할 수 있습니다.');
    }

    const client = getSupabaseClient();
    if (!client || !isSupabaseEnabled()) {
      throw new Error('클라우드 스토리지 연결이 활성화되어 있지 않습니다.');
    }

    const parts = file.name.split('.');
    const rawExt = parts.length > 1 ? parts.pop() || 'file' : 'file';
    const ext = rawExt.toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'bin';
    const uniqueKey = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storagePath = `tasks/${uniqueKey}.${safeExt}`;

    const mimeByExt: Record<string, string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv; charset=utf-8',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ppt: 'application/vnd.ms-powerpoint',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      pdf: 'application/pdf',
    };
    const resolvedContentType = file.type || mimeByExt[ext] || 'application/octet-stream';

    const { error: uploadErr } = await client.storage
      .from('task-attachments')
      .upload(storagePath, file, {
        upsert: true,
        contentType: resolvedContentType,
      });

    if (uploadErr) {
      throw new Error(`파일 업로드 실패: ${uploadErr.message}`);
    }

    const { data: pubData } = client.storage.from('task-attachments').getPublicUrl(storagePath);
    const downloadUrl = `${pubData.publicUrl}?download=${encodeURIComponent(file.name)}`;

    return {
      id: generateUniqueId('att'),
      name: file.name,
      url: downloadUrl,
      storagePath,
      size: file.size,
      ext,
      uploadedBy: uploaderName,
      uploadedAt: new Date().toISOString(),
    };
  }

  // Supabase Storage에서 첨부파일 객체 삭제
  public static async removeTaskAttachmentFromStorage(storagePath?: string): Promise<void> {
    if (!storagePath || !isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.storage.from('task-attachments').remove([storagePath]);
    } catch (e) {
      console.warn('[Storage] Attachment delete note:', e);
    }
  }

  // Supabase 원격 DB로 업무 전송 (track 컬럼 유무와 무관한 스마트 2단계 전송)
  public static async pushTaskToRemote(task: TaskItem): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const autoStatus = computeTaskStatusByDates(
      task.startDate,
      task.dueDate,
      getTodayDateString(),
      task.status
    );
    const payloadWithTrack = {
      id: task.id,
      title: task.title,
      category: task.category,
      track: task.track || '기획',
      assignee_id: task.assigneeId,
      assignee_name: task.assigneeName,
      priority: task.priority,
      status: autoStatus,
      start_date: task.startDate ? task.startDate : null,
      due_date: task.dueDate ? task.dueDate : null,
      progress: autoStatus === 'done' ? 100 : task.progress,
      description: task.description,
      links: task.links,
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
      workspace_project_id: task.workspaceProjectId || null,
      period: task.period || null,
      notion_url: task.notionUrl || null,
      figma_url: task.figmaUrl || null,
      jira_url: task.jiraUrl || null,
      artifact_url: task.artifactUrl || null,
      theme_index: task.themeIndex ?? 0,
      version: task.version || '0.1',
      created_by: task.createdBy,
      created_at: task.createdAt,
      updated_by: task.updatedBy,
      updated_at: task.updatedAt,
    };

    try {
      const { error } = await client.from('tasks').upsert(payloadWithTrack);
      if (error) {
        console.warn('[Supabase] Task push error:', error.message);
      } else {
        console.log(`[Supabase] Task [${task.title}] successfully synced to cloud DB.`);
      }
    } catch (e) {
      console.warn('[Supabase] Task push unexpected error:', e);
    }
  }

  // --- Notion (Sisun-Tasks) 양방향 실시간 동기화 (Supabase Edge Function 연동) ---
  public static async syncWithNotion(options?: {
    force?: boolean;
  }): Promise<{
    success: boolean;
    syncedCount: number;
    deletedCount?: number;
    deletedTitles?: string[];
    message?: string;
  }> {
    if (!isSupabaseEnabled()) {
      return { success: false, syncedCount: 0, message: '클라우드 DB 연결이 비활성화되어 있습니다.' };
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/notion-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pull',
          force: Boolean(options?.force),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        return {
          success: false,
          syncedCount: 0,
          message: data?.error || data?.message || 'Notion 동기화 요청에 실패했습니다.',
        };
      }

      if (Array.isArray(data.deletedIds) && data.deletedIds.length > 0) {
        const deletedIdSet = new Set<string>(data.deletedIds.map((id: any) => String(id)));
        const stored = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []);
        const filtered = stored.filter((t) => !deletedIdSet.has(String(t.id)));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
      }

      await this.syncFromSupabase();
      return {
        success: true,
        syncedCount: Number(data.syncedCount || 0),
        deletedCount: Number(data.deletedCount || 0),
        deletedTitles: Array.isArray(data.deletedTitles) ? data.deletedTitles : [],
      };
    } catch (error) {
      console.warn('[Notion Sync] Pull error:', error);
      return {
        success: false,
        syncedCount: 0,
        message: error instanceof Error ? error.message : 'Notion 동기화 중 네트워크 오류가 발생했습니다.',
      };
    }
  }

  public static async pushTaskUpdateToNotion(
    task: TaskItem
  ): Promise<{ success: boolean; notionUrl?: string }> {
    if (!isSupabaseEnabled()) return { success: false };
    const isNotionLinked = String(task.id).startsWith('notion-') || Boolean(task.notionUrl);
    if (!isNotionLinked) return { success: false };

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/notion-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_update',
          task,
        }),
      });
      const data = await response.json();
      return {
        success: Boolean(data?.success),
        notionUrl: data?.notionUrl,
      };
    } catch (error) {
      console.warn('[Notion Sync] Push update error:', error);
      return { success: false };
    }
  }

  public static async pushTaskCreateToNotion(
    task: TaskItem
  ): Promise<{ success: boolean; notionUrl?: string }> {
    if (!isSupabaseEnabled()) return { success: false };

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/notion-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_create',
          task,
        }),
      });
      const data = await response.json();
      if (data?.success && data?.notionUrl) {
        const stored = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []);
        const updated = stored.map((t) =>
          t.id === task.id ? { ...t, notionUrl: data.notionUrl } : t
        );
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
        await this.pushTaskToRemote({ ...task, notionUrl: data.notionUrl });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ds-portal-tasks-updated'));
        }
        return { success: true, notionUrl: data.notionUrl };
      }
      return { success: false };
    } catch (error) {
      console.warn('[Notion Sync] Push create error:', error);
      return { success: false };
    }
  }

  public static createTask(
    data: Omit<TaskItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>,
    actor?: User,
    options?: { syncToNotion?: boolean }
  ): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 등록할 수 없습니다.');
    }
    const currentUser = actor || this.getCurrentUser();
    const now = new Date().toISOString();
    const autoStatus = computeTaskStatusByDates(data.startDate, data.dueDate);
    const planningLink = data.links?.find((l) => !l.url.includes('figma.com'))?.url || data.artifactUrl || '';
    const figmaLink = data.figmaUrl || data.links?.find((l) => l.url.includes('figma.com'))?.url || '';
    const extractedWpMatch = planningLink.match(/[?&]project=([a-zA-Z0-9_-]+)/);
    const extractedWpId = extractedWpMatch ? extractedWpMatch[1] : data.workspaceProjectId;

    const newTask: TaskItem = {
      ...data,
      track: data.track || '기획',
      status: autoStatus,
      progress: autoStatus === 'done' ? 100 : 0,
      workspaceProjectId: extractedWpId,
      artifactUrl: planningLink || undefined,
      figmaUrl: figmaLink || undefined,
      id: generateUniqueId('task'),
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const tasks = this.getTasks();
    const updated = [newTask, ...tasks];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));

    this.recordAuditLog({
      entityType: 'task',
      entityId: newTask.id,
      entityTitle: newTask.title,
      action: 'CREATE',
      summary: `새 업무 등록: [${newTask.track} · ${newTask.category}] ${newTask.title} (담당: ${newTask.assigneeName})`,
      actorOverride: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    });

    // Supabase DB 비동기 반영 (스마트 2단계 전송)
    this.pushTaskToRemote(newTask);

    // Notion (Sisun-Tasks) 양방향 동시 등록
    const shouldSyncNotion =
      options?.syncToNotion ??
      (currentUser.name.trim() === '최범열' ||
        newTask.assigneeName?.trim() === '최범열' ||
        currentUser.name.trim() === '박수민' ||
        newTask.assigneeName?.trim() === '박수민' ||
        currentUser.name.trim() === '김리아' ||
        newTask.assigneeName?.trim() === '김리아' ||
        newTask.track === '기획' ||
        newTask.track === '디자인' ||
        newTask.track === '퍼블리싱');
    if (shouldSyncNotion) {
      this.pushTaskCreateToNotion(newTask);
    }

    return newTask;
  }

  public static updateTask(
    taskId: string,
    changes: Partial<TaskItem>,
    actor?: User,
    options?: { syncToNotion?: boolean }
  ): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 수정할 수 없습니다.');
    }
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error('수정할 업무 항목을 찾을 수 없습니다.');
    }

    const currentUser = actor || this.getCurrentUser();
    const original = tasks[index];
    const now = new Date().toISOString();
    const nextStartDate = changes.startDate ?? original.startDate;
    const nextDueDate = changes.dueDate ?? original.dueDate;
    const autoStatus = computeTaskStatusByDates(
      nextStartDate,
      nextDueDate,
      getTodayDateString(),
      changes.status || original.status
    );

    const nextLinks = changes.links ?? original.links;
    const planningLink =
      nextLinks?.find((l) => !l.url.includes('figma.com'))?.url ||
      (changes.artifactUrl !== undefined ? changes.artifactUrl : original.artifactUrl) ||
      '';
    const figmaLink =
      (changes.figmaUrl !== undefined ? changes.figmaUrl : original.figmaUrl) ||
      nextLinks?.find((l) => l.url.includes('figma.com'))?.url ||
      '';
    const extractedWpMatch = planningLink.match(/[?&]project=([a-zA-Z0-9_-]+)/);
    const nextWorkspaceProjectId = extractedWpMatch
      ? extractedWpMatch[1]
      : changes.workspaceProjectId ?? original.workspaceProjectId;

    const updatedTask: TaskItem = {
      ...original,
      ...changes,
      startDate: nextStartDate,
      dueDate: nextDueDate,
      status: autoStatus,
      progress: autoStatus === 'done' ? 100 : original.progress,
      track: changes.track || original.track || '기획',
      workspaceProjectId: nextWorkspaceProjectId,
      artifactUrl: planningLink || undefined,
      figmaUrl: figmaLink || undefined,
      createdBy: original.createdBy,
      createdAt: original.createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    const changeNotes: string[] = [];
    if (changes.track && changes.track !== original.track) {
      changeNotes.push(`파트: ${original.track} → ${changes.track}`);
    }
    if (changes.status && changes.status !== original.status) {
      changeNotes.push(`상태: ${original.status} → ${changes.status}`);
    }
    if (changes.progress !== undefined && changes.progress !== original.progress) {
      changeNotes.push(`진척률: ${original.progress}% → ${changes.progress}%`);
    }
    if (changes.priority && changes.priority !== original.priority) {
      changeNotes.push(`우선순위: ${original.priority} → ${changes.priority}`);
    }
    const summaryText = changeNotes.length > 0 
      ? `업무 변경: ${changeNotes.join(', ')}`
      : `업무 정보 수정: ${updatedTask.title}`;

    this.recordAuditLog({
      entityType: 'task',
      entityId: updatedTask.id,
      entityTitle: updatedTask.title,
      action: 'UPDATE',
      summary: summaryText,
      actorOverride: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    });

    // Supabase DB 비동기 반영 (스마트 2단계 전송)
    this.pushTaskToRemote(updatedTask);

    // Notion (Sisun-Tasks) 양방향 업데이트 반영
    const isAlreadyNotionLinked =
      String(updatedTask.id).startsWith('notion-') || Boolean(updatedTask.notionUrl);
    if (isAlreadyNotionLinked) {
      this.pushTaskUpdateToNotion(updatedTask);
    } else if (options?.syncToNotion) {
      this.pushTaskCreateToNotion(updatedTask);
    }

    return updatedTask;
  }

  public static async pushTaskDeleteToNotion(
    task: Pick<TaskItem, 'id' | 'notionUrl' | 'title'>
  ): Promise<{ success: boolean }> {
    if (!isSupabaseEnabled()) return { success: false };
    const isNotionLinked = String(task.id).startsWith('notion-') || Boolean(task.notionUrl);
    if (!isNotionLinked) return { success: false };

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/notion-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'push_delete',
          task: {
            id: task.id,
            notionUrl: task.notionUrl,
            title: task.title,
          },
        }),
      });
      const data = await response.json();
      return {
        success: Boolean(data?.success),
      };
    } catch (error) {
      console.warn('[Notion Sync] Push delete error:', error);
      return { success: false };
    }
  }

  public static deleteTask(taskId: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 삭제할 수 없습니다.');
    }
    const tasks = this.getTasks();
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const filtered = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));

    const isNotionLinked = String(target.id).startsWith('notion-') || Boolean(target.notionUrl);

    this.recordAuditLog({
      entityType: 'task',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: isNotionLinked
        ? `업무 삭제 (Notion 휴지통 연동): [${target.track || '기획'} · ${target.category}] ${target.title}`
        : `업무 삭제: [${target.track || '기획'} · ${target.category}] ${target.title}`,
    });

    // Supabase DB 삭제
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('tasks').delete().eq('id', taskId).then(({ error }) => {
        if (error) console.warn('Supabase task delete note:', error.message);
      });
    }

    // Notion (Sisun-Tasks) 연동 과제인 경우 휴지통(in_trash)으로 동시 이동
    if (isNotionLinked) {
      this.pushTaskDeleteToNotion(target);
    }
  }

  // --- 2. 휴가 관리 (Vacation) CRUD ---
  public static getVacations(): VacationItem[] {
    this.initialize();
    return safeJsonParse<VacationItem[]>(localStorage.getItem(STORAGE_KEYS.VACATIONS), []);
  }

  public static createVacation(data: Omit<VacationItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): VacationItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newVacation: VacationItem = {
      ...data,
      id: generateUniqueId('vac'),
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const vacations = this.getVacations();
    const updated = [newVacation, ...vacations];
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(updated));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: newVacation.id,
      entityTitle: `${newVacation.userName} 일정`,
      action: 'CREATE',
      summary: `휴가 등록: ${newVacation.userName} (${newVacation.startDate}~${newVacation.endDate}, 대행: ${newVacation.deputyName})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').insert({
        id: newVacation.id,
        user_id: newVacation.userId,
        user_name: newVacation.userName,
        department: newVacation.department,
        type: newVacation.type,
        start_date: newVacation.startDate,
        end_date: newVacation.endDate,
        deputy_id: newVacation.deputyId,
        deputy_name: newVacation.deputyName,
        contact: newVacation.contact,
        notes: newVacation.notes,
        created_by: newVacation.createdBy,
        created_at: newVacation.createdAt,
        updated_by: newVacation.updatedBy,
        updated_at: newVacation.updatedAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase vacation insert note:', error.message);
      });
    }

    return newVacation;
  }

  public static updateVacation(id: string, changes: Partial<VacationItem>): VacationItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 수정할 수 없습니다.');
    }
    const vacations = this.getVacations();
    const index = vacations.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('휴가 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const updated: VacationItem = {
      ...vacations[index],
      ...changes,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    vacations[index] = updated;
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: updated.id,
      entityTitle: `${updated.userName} 일정`,
      action: 'UPDATE',
      summary: `휴가 일정 수정: ${updated.userName} (${updated.startDate}~${updated.endDate})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').update({
        user_id: updated.userId,
        user_name: updated.userName,
        department: updated.department,
        type: updated.type,
        start_date: updated.startDate,
        end_date: updated.endDate,
        deputy_id: updated.deputyId,
        deputy_name: updated.deputyName,
        contact: updated.contact,
        notes: updated.notes,
        updated_by: updated.updatedBy,
        updated_at: updated.updatedAt,
      }).eq('id', updated.id).then(({ error }) => {
        if (error) console.warn('Supabase vacation update note:', error.message);
      });
    }

    return updated;
  }

  public static deleteVacation(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 취소할 수 없습니다.');
    }
    const vacations = this.getVacations();
    const target = vacations.find((v) => v.id === id);
    if (!target) return;

    const filtered = vacations.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(filtered));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: target.id,
      entityTitle: `${target.userName} 일정`,
      action: 'DELETE',
      summary: `휴가 취소/삭제: ${target.userName} (${target.startDate}~${target.endDate})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase vacation delete note:', error.message);
      });
    }
  }

  // --- 3. KPI 관리 CRUD & 4단계 라이프사이클 프로세스 ---
  public static getKpis(): KpiItem[] {
    this.initialize();
    const raw = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []);
    const dupRow = raw.find((k) => String(k.id) === 'kpi-mw1s2aoz-2clky');
    const filtered = raw
      .filter((k) => String(k.id) !== 'kpi-mw1s2aoz-2clky')
      .map((k) => {
        if (
          String(k.id) === 'kpi-mvkjcbtn-luec3' &&
          dupRow &&
          Array.isArray(dupRow.linkedTaskIds) &&
          dupRow.linkedTaskIds.length > 0
        ) {
          return {
            ...k,
            linkedTaskIds: Array.from(
              new Set([...(k.linkedTaskIds || []), ...dupRow.linkedTaskIds])
            ),
          };
        }
        return k;
      });
    if (filtered.length !== raw.length) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(filtered));
    }
    return filtered.map((k) => ({
      ...k,
      stage: k.stage || (k.status === 'planning' ? 'draft' : 'aligned'),
      linkedTaskIds: Array.isArray(k.linkedTaskIds) ? k.linkedTaskIds : [],
      checkins: Array.isArray(k.checkins) ? k.checkins : [],
      peerReviews: Array.isArray(k.peerReviews)
        ? k.peerReviews.map((pr) => ({
            ...pr,
            reviewerName: '익명 동료',
          }))
        : [],
      track: k.track || '기획',
    }));
  }

  private static async pushExtendedKpisToRemote(kpis: KpiItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: KPI_CLOUD_RECORD_ID,
        entity_type: 'kpi',
        entity_id: 'sys-kpi-extended',
        entity_title: 'KPI_EXTENDED_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: 'SYSTEM',
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(kpis),
      });
    } catch (e) {
      console.warn('Supabase kpi extended sync note:', e);
    }
  }

  public static createKpi(data: Omit<KpiItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): KpiItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newKpi: KpiItem = {
      ...data,
      id: generateUniqueId('kpi'),
      stage: data.stage || 'draft',
      track: data.track || '기획',
      ownerId: data.ownerId || currentUser.id,
      checkins: data.checkins || [],
      peerReviews: data.peerReviews || [],
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const kpis = this.getKpis();
    const updated = [newKpi, ...kpis];
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updated));
    this.pushExtendedKpisToRemote(updated);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: newKpi.id,
      entityTitle: newKpi.title,
      action: 'CREATE',
      summary: `KPI 목표 등록: [${newKpi.quarter} · ${newKpi.track}] ${newKpi.title} (가중치: ${newKpi.weight}%, 담당: ${newKpi.ownerName})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').insert({
        id: newKpi.id,
        year: newKpi.year,
        quarter: newKpi.quarter,
        target_scope: newKpi.targetScope,
        owner_name: newKpi.ownerName,
        title: newKpi.title,
        target_metric: newKpi.targetMetric,
        target_value: newKpi.targetValue,
        current_value: newKpi.currentValue,
        weight: newKpi.weight,
        achievement_rate: newKpi.achievementRate,
        status: newKpi.status,
        self_evaluation: newKpi.selfEvaluation,
        final_evaluation: newKpi.finalEvaluation,
        evaluator_name: newKpi.evaluatorName,
        created_by: newKpi.createdBy,
        created_at: newKpi.createdAt,
        updated_by: newKpi.updatedBy,
        updated_at: newKpi.updatedAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase kpi insert note:', error.message);
      });
    }

    return newKpi;
  }

  public static updateKpi(id: string, changes: Partial<KpiItem>): KpiItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 수정/평가할 수 없습니다.');
    }
    const kpis = this.getKpis();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) throw new Error('KPI 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const original = kpis[index];
    const updated: KpiItem = {
      ...original,
      ...changes,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    kpis[index] = updated;
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));
    this.pushExtendedKpisToRemote(kpis);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: updated.id,
      entityTitle: updated.title,
      action: 'UPDATE',
      summary: `KPI 갱신/평가: ${updated.title} (단계: ${updated.stage || '미정'}, 달성률: ${updated.achievementRate}%, 상태: ${updated.status})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').update({
        year: updated.year,
        quarter: updated.quarter,
        target_scope: updated.targetScope,
        owner_name: updated.ownerName,
        title: updated.title,
        target_metric: updated.targetMetric,
        target_value: updated.targetValue,
        current_value: updated.currentValue,
        weight: updated.weight,
        achievement_rate: updated.achievementRate,
        status: updated.status,
        self_evaluation: updated.selfEvaluation,
        final_evaluation: updated.finalEvaluation,
        evaluator_name: updated.evaluatorName,
        updated_by: updated.updatedBy,
        updated_at: updated.updatedAt,
      }).eq('id', updated.id).then(({ error }) => {
        if (error) console.warn('Supabase kpi update note:', error.message);
      });
    }

    return updated;
  }

  // [1단계] 팀장에게 목표 합의 요청
  public static requestKpiAlignment(id: string, comment?: string): KpiItem {
    return this.updateKpi(id, {
      stage: 'alignment_pending',
      alignmentComment: comment || '팀장 목표 합의를 요청합니다.',
    });
  }

  // [1단계] 팀장 목표 합의 승인 (목표 확정 Lock)
  public static approveKpiAlignment(id: string, leaderComment?: string): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'aligned',
      status: 'in_progress',
      alignedBy: currentUser.name,
      alignedAt: now,
      alignmentComment: leaderComment || '목표 합의가 승인되었습니다.',
    });
  }

  // [1단계] 팀장 목표 반려 / 보완 요청
  public static rejectKpiAlignment(id: string, reason: string): KpiItem {
    return this.updateKpi(id, {
      stage: 'draft',
      status: 'planning',
      alignmentComment: `[보완 요청] ${reason}`,
    });
  }

  // [2단계] 분기별 점검 및 목표 조정 (Quarterly Check-in)
  public static addQuarterlyCheckin(
    id: string,
    checkinData: Omit<KpiQuarterlyCheckin, 'id' | 'createdAt'>
  ): KpiItem {
    const kpis = this.getKpis();
    const target = kpis.find((k) => k.id === id);
    if (!target) throw new Error('KPI 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newCheckin: KpiQuarterlyCheckin = {
      ...checkinData,
      id: generateUniqueId('chk'),
      createdAt: now,
      reviewedBy: currentUser.name,
      reviewedAt: now,
    };

    const existingCheckins = Array.isArray(target.checkins) ? target.checkins : [];
    // 같은 분기가 있으면 교체, 없으면 추가
    const filteredCheckins = existingCheckins.filter((c) => c.quarter !== checkinData.quarter);
    const updatedCheckins = [...filteredCheckins, newCheckin].sort((a, b) => a.quarter.localeCompare(b.quarter));

    return this.updateKpi(id, {
      stage: target.stage === 'draft' || target.stage === 'alignment_pending' ? 'quarterly_checkin' : target.stage,
      currentValue: checkinData.currentValue || target.currentValue,
      achievementRate: checkinData.progressRate ?? target.achievementRate,
      checkins: updatedCheckins,
    });
  }

  // [3단계] 동료 다면평가 제출 (Peer Review - 타 임직원 전용, 무기명 결과 보장)
  public static submitPeerReview(
    id: string,
    reviewData: Omit<KpiPeerReview, 'id' | 'submittedAt'>
  ): KpiItem {
    const kpis = this.getKpis();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) throw new Error('KPI 항목을 찾을 수 없습니다.');
    const target = kpis[index];

    const currentUser = this.getCurrentUser();
    const isSelfKpi =
      target.ownerName?.trim() === currentUser.name?.trim() ||
      (target.ownerId ? String(target.ownerId) === String(currentUser.id) : false) ||
      (target.targetScope === 'team' && target.createdBy?.trim() === currentUser.name?.trim());

    if (isSelfKpi) {
      throw new Error('본인의 KPI에는 직접 동료 피드백을 등록할 수 없습니다.');
    }

    const now = new Date().toISOString();
    const newReview: KpiPeerReview = {
      ...reviewData,
      reviewerName: '익명 동료',
      id: generateUniqueId('peer'),
      submittedAt: now,
    };

    const existingReviews = Array.isArray(target.peerReviews) ? target.peerReviews : [];
    const filtered = existingReviews.filter(
      (r) => String(r.reviewerId) !== String(reviewData.reviewerId)
    );
    const updatedReviews = [...filtered, newReview];

    // 다면평가 평균점수 계산 (5점 만점 기준)
    const totalScore = updatedReviews.reduce(
      (sum, r) => sum + (Number(r.scoreCollaboration) + Number(r.scoreQuality)) / 2,
      0
    );
    const peerAvgScore =
      updatedReviews.length > 0 ? Number((totalScore / updatedReviews.length).toFixed(1)) : 0;

    // 무기명 보장을 위해 KPI의 최종 수정자(updatedBy)는 변경하지 않음
    const updated: KpiItem = {
      ...target,
      peerReviews: updatedReviews,
      peerAvgScore,
    };

    kpis[index] = updated;
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));
    this.pushExtendedKpisToRemote(kpis);

    return updated;
  }

  // [4단계-자가평가] 팀원 연간 자가평가 제출
  public static submitSelfEvaluation(id: string, selfEvaluation: string, selfScore?: number): KpiItem {
    return this.updateKpi(id, {
      selfEvaluation,
      selfScore: selfScore ?? 80,
      stage: 'leader_eval', // 1차 팀장 평가 단계로 전환
    });
  }

  // [4단계-1차평가] 팀 리더(1차) 평가 및 실장 상신
  public static submitLeaderEvaluation(
    id: string,
    data: { score: number; grade: KpiGrade; comment: string }
  ): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'director_eval', // 2차 실장 평가 단계로 상신
      leaderScore: data.score,
      leaderGrade: data.grade,
      leaderComment: data.comment,
      leaderEvaluatorName: currentUser.name,
      leaderEvaluatedAt: now,
    });
  }

  // [4단계-2차평가] 상위 실장(2차) 최종 평가 및 확정
  public static submitDirectorEvaluation(
    id: string,
    data: { score: number; grade: KpiGrade; comment: string }
  ): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'finalized', // 최종 평가 완료
      directorScore: data.score,
      directorGrade: data.grade,
      directorComment: data.comment,
      directorEvaluatorName: currentUser.name,
      directorEvaluatedAt: now,
      finalEvaluation: `[최종등급: ${data.grade} / 점수: ${data.score}점] ${data.comment}`,
      evaluatorName: `${currentUser.name} (실장)`,
      status: data.score >= 90 ? 'achieved' : data.score >= 70 ? 'partially_achieved' : 'missed',
    });
  }

  // 프로세스 단계 일괄/수동 전환 (관리자/팀장 편의용)
  public static advanceKpiStage(id: string, targetStage: KpiProcessStage): KpiItem {
    return this.updateKpi(id, { stage: targetStage });
  }

  public static deleteKpi(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 삭제할 수 없습니다.');
    }
    const kpis = this.getKpis();
    const target = kpis.find((k) => k.id === id);
    if (!target) return;

    const filtered = kpis.filter((k) => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(filtered));
    this.pushExtendedKpisToRemote(filtered);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `KPI 삭제: ${target.title}`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase kpi delete note:', error.message);
      });
    }
  }

  // --- 4. 업무 관련 정보 (Work Info) CRUD & 클라우드 동기화 ---
  public static getWorkInfos(): WorkInfoItem[] {
    this.initialize();
    const items = safeJsonParse<WorkInfoItem[]>(
      localStorage.getItem(STORAGE_KEYS.WORK_INFOS),
      INITIAL_WORK_INFO_ITEMS
    );
    if (!Array.isArray(items) || items.length === 0) {
      return INITIAL_WORK_INFO_ITEMS;
    }
    return [...items].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }

  private static async pushWorkInfosToRemote(items: WorkInfoItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: WORK_INFO_CLOUD_RECORD_ID,
        entity_type: 'auth',
        entity_id: 'sys-work-info',
        entity_title: 'WORK_INFO_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: currentUser.name,
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Supabase work_info sync note:', e);
    }
  }

  public static createWorkInfo(data: {
    category: string;
    title: string;
    content: string;
    note: string;
  }): WorkInfoItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 등록할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getWorkInfos();
    const maxOrder = items.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);

    const newItem: WorkInfoItem = {
      id: generateUniqueId('winfo'),
      category: data.category.trim() || '기본 사항',
      title: data.title.trim(),
      content: data.content,
      note: data.note.trim(),
      sortOrder: maxOrder + 1,
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updated = [...items, newItem];
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(updated));
    this.pushWorkInfosToRemote(updated);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: newItem.id,
      entityTitle: newItem.title,
      action: 'CREATE',
      summary: `[업무 관련 정보] 신규 등록: [${newItem.category}] ${newItem.title}`,
    });

    return newItem;
  }

  public static updateWorkInfo(
    id: string,
    updates: Partial<Pick<WorkInfoItem, 'category' | 'title' | 'content' | 'note' | 'sortOrder'>>
  ): WorkInfoItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 수정할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getWorkInfos();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('해당 업무 관련 정보 항목을 찾을 수 없습니다.');
    }

    const updatedItem: WorkInfoItem = {
      ...items[idx],
      ...updates,
      id: items[idx].id,
      createdBy: items[idx].createdBy,
      createdAt: items[idx].createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedList = [...items];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(updatedList));
    this.pushWorkInfosToRemote(updatedList);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: updatedItem.id,
      entityTitle: updatedItem.title,
      action: 'UPDATE',
      summary: `[업무 관련 정보] 수정: [${updatedItem.category}] ${updatedItem.title}`,
    });

    return updatedItem;
  }

  public static deleteWorkInfo(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 삭제할 수 없습니다.');
    }

    const items = this.getWorkInfos();
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(filtered));
    this.pushWorkInfosToRemote(filtered);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `[업무 관련 정보] 삭제: [${target.category}] ${target.title}`,
    });
  }

  public static moveWorkInfo(id: string, direction: 'up' | 'down'): WorkInfoItem[] {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 순서를 변경할 수 없습니다.');
    }

    const items = this.getWorkInfos();
    const target = items.find((i) => i.id === id);
    if (!target) return items;

    const categoryItems = items.filter((i) => i.category === target.category);
    const catIdx = categoryItems.findIndex((i) => i.id === id);
    if (catIdx === -1) return items;

    const swapIdx = direction === 'up' ? catIdx - 1 : catIdx + 1;
    if (swapIdx < 0 || swapIdx >= categoryItems.length) return items;

    const reorderedCat = [...categoryItems];
    const [moved] = reorderedCat.splice(catIdx, 1);
    reorderedCat.splice(swapIdx, 0, moved);

    return this.reorderWorkInfosInCategory(
      target.category,
      reorderedCat.map((i) => i.id)
    );
  }

  public static reorderWorkInfosInCategory(
    category: string,
    orderedIds: string[]
  ): WorkInfoItem[] {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 순서를 변경할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getWorkInfos();

    const categoryItems = items.filter((i) => i.category === category);
    const itemMap = new Map(categoryItems.map((i) => [i.id, i]));
    const reorderedCategoryItems: WorkInfoItem[] = [];

    orderedIds.forEach((id) => {
      const found = itemMap.get(id);
      if (found) {
        reorderedCategoryItems.push(found);
        itemMap.delete(id);
      }
    });
    itemMap.forEach((rem) => reorderedCategoryItems.push(rem));

    // 전체 카테고리 순서를 유지하면서 sortOrder를 1부터 순차 재할당
    const categories = Array.from(new Set(items.map((i) => i.category)));
    let nextOrder = 1;
    const finalList: WorkInfoItem[] = [];

    categories.forEach((cat) => {
      const rows =
        cat === category
          ? reorderedCategoryItems
          : items.filter((i) => i.category === cat);
      rows.forEach((row) => {
        finalList.push({
          ...row,
          sortOrder: nextOrder++,
          updatedBy: cat === category ? currentUser.name : row.updatedBy,
          updatedAt: cat === category ? now : row.updatedAt,
        });
      });
    });

    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(finalList));
    this.pushWorkInfosToRemote(finalList);

    return finalList;
  }

  // --- 5. 신규 입사자 온보딩 체크리스트 (Onboarding Checklist) CRUD & 클라우드 동기화 ---
  public static getOnboardingItems(): OnboardingChecklistItem[] {
    this.initialize();
    const items = safeJsonParse<OnboardingChecklistItem[]>(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_ITEMS),
      INITIAL_ONBOARDING_ITEMS
    );
    if (!Array.isArray(items) || items.length === 0) {
      return INITIAL_ONBOARDING_ITEMS;
    }
    const phaseRank: Record<OnboardingPhase, number> = {
      day1: 0,
      week1: 1,
      week2: 2,
      week3_4: 3,
    };
    return [...items].sort((a, b) => {
      const pDiff = (phaseRank[a.phase] ?? 9) - (phaseRank[b.phase] ?? 9);
      if (pDiff !== 0) return pDiff;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });
  }

  private static async pushOnboardingToRemote(items: OnboardingChecklistItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: ONBOARDING_CLOUD_RECORD_ID,
        entity_type: 'auth',
        entity_id: 'sys-onboarding',
        entity_title: 'ONBOARDING_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: currentUser.name,
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Supabase onboarding sync note:', e);
    }
  }

  public static toggleOnboardingItem(id: string): OnboardingChecklistItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 체크 상태를 변경할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getOnboardingItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('해당 온보딩 체크리스트 항목을 찾을 수 없습니다.');
    }

    const nextCompleted = !items[idx].completed;
    const updatedItem: OnboardingChecklistItem = {
      ...items[idx],
      completed: nextCompleted,
      completedBy: nextCompleted ? currentUser.name : undefined,
      completedAt: nextCompleted ? now : undefined,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedList = [...items];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(updatedList));
    this.pushOnboardingToRemote(updatedList);

    this.recordAuditLog({
      entityType: 'onboarding',
      entityId: updatedItem.id,
      entityTitle: updatedItem.title,
      action: 'STATUS_CHANGE',
      summary: `[신규 입사자 온보딩] ${nextCompleted ? '완료 체크' : '체크 해제'}: ${updatedItem.title}`,
    });

    return updatedItem;
  }

  public static createOnboardingItem(data: {
    phase: OnboardingPhase;
    category: string;
    title: string;
    description: string;
    ownerRole: string;
    linkLabel?: string;
    linkUrl?: string;
    note?: string;
  }): OnboardingChecklistItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 체크리스트 항목을 추가할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getOnboardingItems();
    const maxOrder = items.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);

    const newItem: OnboardingChecklistItem = {
      id: generateUniqueId('onb'),
      phase: data.phase,
      category: data.category.trim() || '도메인·시스템',
      title: data.title.trim(),
      description: data.description.trim(),
      ownerRole: data.ownerRole.trim() || '본인 · 멘토(최범열)',
      linkLabel: data.linkLabel?.trim() || undefined,
      linkUrl: data.linkUrl?.trim() || undefined,
      completed: false,
      note: data.note?.trim() || '',
      sortOrder: maxOrder + 1,
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updated = [...items, newItem];
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(updated));
    this.pushOnboardingToRemote(updated);

    this.recordAuditLog({
      entityType: 'onboarding',
      entityId: newItem.id,
      entityTitle: newItem.title,
      action: 'CREATE',
      summary: `[신규 입사자 온보딩] 항목 추가: [${newItem.category}] ${newItem.title}`,
    });

    return newItem;
  }

  public static updateOnboardingItem(
    id: string,
    updates: Partial<
      Pick<
        OnboardingChecklistItem,
        | 'phase'
        | 'category'
        | 'title'
        | 'description'
        | 'ownerRole'
        | 'linkLabel'
        | 'linkUrl'
        | 'note'
        | 'sortOrder'
      >
    >
  ): OnboardingChecklistItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 체크리스트를 수정할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getOnboardingItems();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('해당 온보딩 체크리스트 항목을 찾을 수 없습니다.');
    }

    const updatedItem: OnboardingChecklistItem = {
      ...items[idx],
      ...updates,
      id: items[idx].id,
      createdBy: items[idx].createdBy,
      createdAt: items[idx].createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedList = [...items];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(updatedList));
    this.pushOnboardingToRemote(updatedList);

    this.recordAuditLog({
      entityType: 'onboarding',
      entityId: updatedItem.id,
      entityTitle: updatedItem.title,
      action: 'UPDATE',
      summary: `[신규 입사자 온보딩] 항목 수정: [${updatedItem.category}] ${updatedItem.title}`,
    });

    return updatedItem;
  }

  public static deleteOnboardingItem(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 체크리스트를 삭제할 수 없습니다.');
    }

    const items = this.getOnboardingItems();
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(filtered));
    this.pushOnboardingToRemote(filtered);

    this.recordAuditLog({
      entityType: 'onboarding',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `[신규 입사자 온보딩] 항목 삭제: [${target.category}] ${target.title}`,
    });
  }

  public static resetOnboardingChecks(): OnboardingChecklistItem[] {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 초기화할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getOnboardingItems().map((item) => ({
      ...item,
      completed: false,
      completedBy: undefined,
      completedAt: undefined,
      updatedBy: currentUser.name,
      updatedAt: now,
    }));

    localStorage.setItem(STORAGE_KEYS.ONBOARDING_ITEMS, JSON.stringify(items));
    this.pushOnboardingToRemote(items);

    this.recordAuditLog({
      entityType: 'onboarding',
      entityId: 'onboarding-reset',
      entityTitle: '온보딩 체크리스트 전체 초기화',
      action: 'UPDATE',
      summary: '[신규 입사자 온보딩] 전체 완료 체크 상태 초기화',
    });

    return items;
  }

  // --- 6. 시선닷컴 정책서 (Sisun.com Front Policy) CRUD & 클라우드 동기화 ---
  public static getPolicies(): SisunPolicyItem[] {
    this.initialize();
    const items = safeJsonParse<SisunPolicyItem[]>(
      localStorage.getItem(STORAGE_KEYS.POLICY_ITEMS),
      INITIAL_POLICY_ITEMS
    );
    if (!Array.isArray(items) || items.length === 0) {
      return INITIAL_POLICY_ITEMS;
    }
    const domainRank: Record<PolicyDomain, number> = {
      product: 0,
      member: 1,
      order: 2,
      display: 3,
      claim: 4,
      search: 5,
      common: 6,
    };
    return [...items].sort((a, b) => {
      const dDiff = (domainRank[a.domain] ?? 99) - (domainRank[b.domain] ?? 99);
      if (dDiff !== 0) return dDiff;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    });
  }

  private static async pushPoliciesToRemote(items: SisunPolicyItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: POLICY_CLOUD_RECORD_ID,
        entity_type: 'auth',
        entity_id: 'sys-policy',
        entity_title: 'POLICY_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: currentUser.name,
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Supabase policy sync note:', e);
    }
  }

  public static createPolicyItem(data: {
    domain: PolicyDomain;
    subCategory: string;
    code: string;
    title: string;
    summary: string;
    description: string;
    rules: PolicyRuleRow[];
    frontScreenPath?: string;
    workspaceUrl?: string;
    status?: 'active' | 'updated';
  }): SisunPolicyItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정책을 등록할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getPolicies();
    const domainItems = items.filter((item) => item.domain === data.domain);
    const maxOrder = domainItems.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);

    const newItem: SisunPolicyItem = {
      id: generateUniqueId('pol'),
      domain: data.domain,
      subCategory: data.subCategory.trim() || '기본 정책',
      code:
        data.code.trim() ||
        `POL-${data.domain.slice(0, 3).toUpperCase()}-${String(domainItems.length + 1).padStart(3, '0')}`,
      title: data.title.trim(),
      summary: data.summary.trim(),
      description: data.description.trim(),
      rules: Array.isArray(data.rules) ? data.rules : [],
      frontScreenPath: data.frontScreenPath?.trim() || undefined,
      workspaceUrl: data.workspaceUrl?.trim() || undefined,
      status: data.status || 'active',
      sortOrder: maxOrder + 1,
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updated = [...items, newItem];
    localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(updated));
    this.pushPoliciesToRemote(updated);

    this.recordAuditLog({
      entityType: 'policy',
      entityId: newItem.id,
      entityTitle: `[${newItem.code}] ${newItem.title}`,
      action: 'CREATE',
      summary: `[시선닷컴 정책서] 정책 등록: [${newItem.subCategory}] ${newItem.title}`,
    });

    return newItem;
  }

  public static updatePolicyItem(
    id: string,
    updates: Partial<
      Pick<
        SisunPolicyItem,
        | 'domain'
        | 'subCategory'
        | 'code'
        | 'title'
        | 'summary'
        | 'description'
        | 'rules'
        | 'frontScreenPath'
        | 'workspaceUrl'
        | 'status'
        | 'sortOrder'
      >
    >
  ): SisunPolicyItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정책을 수정할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getPolicies();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('해당 시선닷컴 정책 항목을 찾을 수 없습니다.');
    }

    const updatedItem: SisunPolicyItem = {
      ...items[idx],
      ...updates,
      id: items[idx].id,
      createdBy: items[idx].createdBy,
      createdAt: items[idx].createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedList = [...items];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(updatedList));
    this.pushPoliciesToRemote(updatedList);

    this.recordAuditLog({
      entityType: 'policy',
      entityId: updatedItem.id,
      entityTitle: `[${updatedItem.code}] ${updatedItem.title}`,
      action: 'UPDATE',
      summary: `[시선닷컴 정책서] 정책 수정: [${updatedItem.subCategory}] ${updatedItem.title}`,
    });

    return updatedItem;
  }

  public static deletePolicyItem(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정책을 삭제할 수 없습니다.');
    }

    const items = this.getPolicies();
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(filtered));
    this.pushPoliciesToRemote(filtered);

    this.recordAuditLog({
      entityType: 'policy',
      entityId: target.id,
      entityTitle: `[${target.code}] ${target.title}`,
      action: 'DELETE',
      summary: `[시선닷컴 정책서] 정책 삭제: [${target.subCategory}] ${target.title}`,
    });
  }

  public static movePolicyItem(id: string, direction: 'up' | 'down'): SisunPolicyItem[] {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 순서를 변경할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getPolicies();
    const target = items.find((i) => i.id === id);
    if (!target) return items;

    const domainItems = items.filter((i) => i.domain === target.domain);
    const domIdx = domainItems.findIndex((i) => i.id === id);
    if (domIdx === -1) return items;

    const swapIdx = direction === 'up' ? domIdx - 1 : domIdx + 1;
    if (swapIdx < 0 || swapIdx >= domainItems.length) return items;

    const reorderedDomain = [...domainItems];
    const [moved] = reorderedDomain.splice(domIdx, 1);
    reorderedDomain.splice(swapIdx, 0, moved);

    const reorderedIds = new Map<string, number>();
    reorderedDomain.forEach((item, index) => {
      reorderedIds.set(item.id, index + 1);
    });

    const finalList = items.map((item) => {
      if (item.domain === target.domain && reorderedIds.has(item.id)) {
        return {
          ...item,
          sortOrder: reorderedIds.get(item.id)!,
          updatedBy: currentUser.name,
          updatedAt: now,
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(finalList));
    this.pushPoliciesToRemote(finalList);
    return this.getPolicies();
  }

  public static resetPoliciesToDefault(): SisunPolicyItem[] {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 초기화할 수 없습니다.');
    }

    localStorage.setItem(STORAGE_KEYS.POLICY_ITEMS, JSON.stringify(INITIAL_POLICY_ITEMS));
    this.pushPoliciesToRemote(INITIAL_POLICY_ITEMS);

    this.recordAuditLog({
      entityType: 'policy',
      entityId: 'policy-reset',
      entityTitle: '시선닷컴 정책서 기본값 복원',
      action: 'UPDATE',
      summary: '[시선닷컴 정책서] 7대 도메인 기본 표준 정책 데이터로 복원',
    });

    return this.getPolicies();
  }

  // 데이터 전체 리셋 (테스트용)
  public static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.VACATIONS);
    localStorage.removeItem(STORAGE_KEYS.KPIS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.initialize();
  }
}
