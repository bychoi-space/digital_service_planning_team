import { useState } from 'react';
import { TEAM_GUIDE_DATA } from '../constants/teamGuide';
import { COMPANY_DEPARTMENTS } from '../constants/departments';
import { SisunRenewalStoryStage } from './SisunRenewalStoryStage';
import {
  Compass,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  Laptop,
  Layers,
  ChevronRight,
  Copy,
  Check,
  ArrowUpRight,
  HelpCircle,
  FolderGit2,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateToTasks: () => void;
}

export function OverviewView({ onNavigateToTasks }: OverviewViewProps) {
  // 3대 핵심 업무 탭 상태 (0: UI/UX개편, 1: 어드민효율화, 2: 이커머스정책)
  const [activePillar, setActivePillar] = useState<number>(0);

  // 5단계 스프린트 진행 단계 상태 (1~5)
  const [activeStep, setActiveStep] = useState<number>(1);

  // 6대 부서별 협업 가이드 탭 상태
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-online-mn');

  // 클립보드 복사 피드백 상태
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 부서별 FAQ 아코디언 토글
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // 클립보드 복사 헬퍼
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // 3대 핵심 업무 상세 데이터 (중복 아이콘 제거, 핵심 내용 통합 및 텍스트 간결화)
  const PILLARS_DATA = [
    {
      id: 0,
      badge: 'PILLAR 01',
      title: '시선닷컴 (sisun.com) UI/UX 전면 개편',
      subtitle: '화면설계(SB) · 비주얼 UI 디자인 · 반응형 퍼블리싱',
      color: '#2563eb',
      bgGradient: 'linear-gradient(135deg, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0.01) 100%)',
      borderColor: '#bfdbfe',
      description:
        '미샤(MICHAA)·잇미샤(it MICHAA)·E.B.M 브랜드 감성을 온전히 전달하도록 화면설계부터 디자인·퍼블리싱까지 전 과정을 총괄합니다.',
      pipelineSteps: [
        {
          name: '1. 기획서(화면설계서/SB) 작성',
          desc: '고객 여정(CJM) 기반 화면 구조 및 상세 정책·예외 케이스 명세',
          points: [
            'IA 및 플로우: 탐색 ➔ 결제 전환 동선 최적화',
            '정책 명세: 결제·쿠폰·마일리지 복합 룰 정의',
            '표준 규격화: 공통 UI 요소 및 예외 케이스 정의',
          ],
        },
        {
          name: '2. UI/UX 비주얼 디자인',
          desc: '브랜드 아이덴티티를 극대화한 고해상도 비주얼 디자인 시스템',
          points: [
            '브랜드 무드: 미샤(클래식 모던)·잇미샤(영 페미닌)',
            '룩북 뷰어: 화보 내 착장 상품 인터랙티브 태깅',
            '컴포넌트 표준: 왜곡 없는 컬러 재현 및 UI 일관성',
          ],
        },
        {
          name: '3. 반응형 웹 퍼블리싱',
          desc: '모바일·PC·앱 웹뷰 전 환경 크로스 브라우징 및 웹 표준 구현',
          points: [
            '모바일 퍼스트: 디바이스별 최적 비율 반응형 설계',
            '로딩 최적화: WebP/AVIF 이미지 레이지 로딩 적용',
            '웹 표준 준수: 웹 접근성 및 SEO 메타태그 완비',
          ],
        },
      ],
      keyMetrics: '모바일 탐색 이탈 최소화 · 상품 상세 몰입도 및 구매 전환 경험 강화',
    },
    {
      id: 1,
      badge: 'PILLAR 02',
      title: '시선닷컴 어드민(백오피스) 운영 효율화',
      subtitle: '상품·프로모션 세팅 자동화 · 운영 공수 절감',
      color: '#059669',
      bgGradient: 'linear-gradient(135deg, rgba(5,150,105,0.05) 0%, rgba(5,150,105,0.01) 100%)',
      borderColor: '#a7f3d0',
      description:
        '온라인MD·운영팀의 반복 수기 작업을 줄이고, 대량 상품 등록과 기획전 세팅을 직관적으로 처리하도록 백오피스를 개선합니다.',
      pipelineSteps: [
        {
          name: '1. 상품 대량 일괄 관리 개선',
          desc: '옵션·재고·가격 대량 엑셀 업로드 및 사전 오류 검증',
          points: [
            '일괄 파싱: 대용량 엑셀 드래그 앤 드롭 등록',
            '실시간 프리뷰: 업로드 즉시 오류 셀 하이라이트',
            '재작업 방지: 정상 행 우선 반영 및 오류 내역 추출',
          ],
        },
        {
          name: '2. 프로모션/기획전 세팅 간소화',
          desc: '쿠폰 발급 조건 및 타임세일 자동 스케줄링 UI 직관화',
          points: [
            '스마트 스케줄러: 기획전·타임세일 자동 온/오프',
            '조건 템플릿: 자주 쓰는 쿠폰·사은품 룰 프리셋',
            '상품 진열 개선: 드래그 정렬 및 대량 상품 일괄 매핑',
          ],
        },
        {
          name: '3. 주문/클레임 워크플로우 단축',
          desc: '교환·반품 승인 및 물류 연동 간소화로 VOC 처리 개선',
          points: [
            '원클릭 처리: 교환·반품 검품 및 환불 승인 간소화',
            '물류 상태 연동: 입출고·배송 추적 상태 실시간 조회',
            'CS 이력 통합: 고객별 문의·클레임 단일 화면 확인',
          ],
        },
      ],
      keyMetrics: '온라인MD 반복 세팅 공수 절감 · 수기 입력에 따른 운영 휴먼 에러 방지',
    },
    {
      id: 2,
      badge: 'PILLAR 03',
      title: '시선인터내셔널 이커머스 정책 & 프로세스 정의',
      subtitle: '온·오프라인 통합 정책 · 부서별 협업 R&R 표준화',
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(124,58,237,0.01) 100%)',
      borderColor: '#ddd6fe',
      description:
        '브랜드 사업부·온라인몰·물류·마케팅·IT 간 업무 기준을 일원화하고 전사 이커머스 표준 운영 규정을 정립합니다.',
      pipelineSteps: [
        {
          name: '1. 온·오프라인 통합 멤버십 규정',
          desc: '오프라인 매장과 시선닷컴 고객의 포인트·등급·혜택 통합 정책',
          points: [
            '마일리지 통합: 매장 포인트·온라인 마일리지 교차 사용',
            '등급 산정 표준: 온·오프 합산 구매 실적 기준 정립',
            '옴니 쿠폰 정책: 채널 간 발급·사용 예외 기준 명문화',
          ],
        },
        {
          name: '2. 온라인 판매 및 반품/교환 규정',
          desc: '패션 상품군별 검품 기준 및 배송비·환불 정책 표준화',
          points: [
            '검품 기준서: 의류·잡화 품목별 불량/변심 판정 기준',
            '배송비 규정: 교환·반품 왕복 배송비 부과/면제 기준',
            '자동 환불 정책: 입고 확인 후 환불 승인 표준 프로세스',
          ],
        },
        {
          name: '3. 사내 유관부서 협업 R&R 정의',
          desc: '요구사항 접수부터 릴리즈까지 6대 부서별 역할 매트릭스',
          points: [
            '표준 인입 창구: 부서별 요청 양식 및 사전 검토 절차',
            '책임 매트릭스: 기획·MD·MN·정보실·마케팅 역할 정의',
            '배포 거버넌스: 정기 싱크 및 QA 검수 후 운영 반영',
          ],
        },
      ],
      keyMetrics: '유관부서 간 협업 커뮤니케이션 효율화 · 전사 이커머스 표준 매뉴얼 구축',
    },
  ];

  // 국내외 4대 벤치마킹 레퍼런스 데이터
  const BENCHMARK_SITES = [
    {
      id: 'toss',
      name: '토스 디자인 (Toss Product & Design)',
      url: 'https://toss.design',
      tag: '국내 최고 인터랙션',
      logoColor: '#3182f6',
      summary: '복잡한 금융과 쇼핑 UX를 극도로 단순화하고, 모션과 마이크로 인터랙션으로 사용자를 몰입시키는 기획 체계',
      benchmarkingPoints: [
        '기획자(PO/서비스기획)와 디자이너가 단일 화면설계 시스템(TDS)으로 협업',
        '사용자 여정(CJM)의 불필요한 단계를 과감히 제거하는 One Thing Per Screen 원칙',
        '시선닷컴 메인 배너 및 기획전 레이아웃에 토스식 부드러운 스크롤 인터랙션 벤치마킹',
      ],
    },
    {
      id: 'shopify',
      name: '쇼피파이 폴라리스 (Shopify Polaris)',
      url: 'https://polaris.shopify.com',
      tag: '글로벌 이커머스 & 어드민 표준',
      logoColor: '#008060',
      summary: '전 세계 1위 글로벌 커머스 플랫폼의 백오피스(어드민) UI/UX 디자인 가이드라인',
      benchmarkingPoints: [
        '온라인MD가 가장 많이 다루는 대량 상품 등록, 재고 테이블 필터링 표준화',
        '복잡한 프로모션(할인율, 타임세일, 쿠폰) 조건 설정 폼의 직관적 시각화',
        '시선닷컴 백오피스 어드민 개편 시 테이블 인터랙션 및 배치 작업 UI에 적극 반영',
      ],
    },
    {
      id: 'linear',
      name: '리니어 메소드 (Linear Method)',
      url: 'https://linear.app/method',
      tag: '글래스모피즘 & 스프린트 미학',
      logoColor: '#5e6ad2',
      summary: '감각적인 다크 테마와 매끄러운 반응 속도로 글로벌 테크 기업들의 기획/이슈 관리를 선도하는 방법론',
      benchmarkingPoints: [
        '불필요한 회의와 보고를 없애고, 살아있는 이슈 티켓과 자동화된 감사 로그로 소통',
        '마우스 호버 시 은은한 발광 효과(Hover Glow)와 매끄러운 반응형 UX',
        '본 서비스기획팀 업무관리 포털의 대시보드 카드 및 감사 로그 뷰에 디자인 반영',
      ],
    },
    {
      id: '29cm',
      name: '29CM / 무신사 테크 & 프로덕트',
      url: 'https://medium.com/musinsa-tech',
      tag: '패션 버티컬 커머스 최적화',
      logoColor: '#111111',
      summary: '프리미엄 패션 브랜드의 가치 전달과 브랜드 룩북, 큐레이션 기획전 중심의 이커머스 설계',
      benchmarkingPoints: [
        '단순 상품 판매를 넘어선 브랜드 스토리텔링과 고화질 화보형 UI 레이아웃',
        '패션 브랜드(MICHAA, it MICHAA) 감성에 맞춘 룩북 태깅 및 원클릭 장바구니 담기',
        '시선닷컴 모바일 메인 룩북 개편 및 시즌 프로모션 기획 시 참고 모델',
      ],
    },
  ];

  // 6대 부서별 맞춤 협업 가이드 상세
  const DEPT_COLLAB_INFO: Record<
    string,
    {
      roleTitle: string;
      cooperationPoints: string[];
      mainContact: string;
      guideTip: string;
      requestTemplate: string;
      faq: { q: string; a: string }[];
    }
  > = {
    'dept-online-mn': {
      roleTitle: 'MI/MO/EBM 온라인MN팀 협업 가이드',
      cooperationPoints: [
        '브랜드별(MICHAA, it MICHAA, E.B.M) 신규 룩북 및 시즌 메인 비주얼 배너 개편 협의',
        '온라인 전용 프로모션 페이지 레이아웃 및 팝업 정책 기획 지원',
        '모바일 앱 푸시 및 브랜드 스토리텔링 전용 콘텐츠 화면설계 지원',
      ],
      mainContact: '서비스기획팀 UI/UX 기획 파트 (사내 잔디/슬랙: #sisun-service-planning)',
      guideTip: '신규 시즌 런칭 최소 3주 전 요구사항을 접수해 주시면 화면설계와 퍼블리싱이 원활히 진행됩니다.',
      requestTemplate: `[온라인MN ➔ 서비스기획팀 업무 협조 요청]
1. 브랜드명: (MICHAA / it MICHAA / E.B.M)
2. 개편/기획 목적: (예: 2026 S/S 시즌 메인 룩북 배너 신규 제작)
3. 희망 라이브 일시: 2026-00-00
4. 주요 기획 요구사항:
   - 레이아웃 형태: (슬라이드형 / 그리드형 / 풀스크린형)
   - 링크 연결 페이지: (신규 기획전 URL)
5. 비주얼 에셋 전달 예정일: 2026-00-00`,
      faq: [
        {
          q: '신규 시즌 룩북 기획 및 퍼블리싱까지 소요 기간은 며칠인가요?',
          a: '에셋(사진/영상) 전달 완료 기준, 화면설계 3~4일 ➔ 디자인 3일 ➔ 반응형 퍼블리싱 3일로 총 7~10영업일이 표준 소요됩니다.',
        },
        {
          q: '모바일 전용 기획전 페이지도 별도로 퍼블리싱 지원을 받을 수 있나요?',
          a: '네, 서비스기획팀에서는 반응형 웹을 기본 원칙으로 설계하므로 모바일/PC 모두 최적화된 상태로 제작 지원합니다.',
        },
      ],
    },
    'dept-it-md': {
      roleTitle: 'IT 온라인MD팀 협업 가이드',
      cooperationPoints: [
        '시선닷컴 백오피스(어드민) 상품 등록/수정/카테고리 매핑 편의 기능 개선 건의',
        '타임세일, 장바구니 쿠폰, 사은품 증정 등 신규 프로모션 룰 엔진 어드민 연동',
        '재고 연동 오류 및 품절 상품 노출 정책 최적화 협의',
      ],
      mainContact: '서비스기획팀 어드민/백오피스 파트',
      guideTip: '어드민 사용 시 불편하신 점은 언제든 백로그에 제안해 주시면 스프린트 단위로 개선 반영합니다.',
      requestTemplate: `[온라인MD ➔ 서비스기획팀 어드민 기능 개선 제안]
1. 제안 영역: (상품관리 / 프로모션세팅 / 주문관리 / 정산)
2. 현재 문제점(AS-IS): (예: 엑셀 대량 업로드 시 옵션명 오타 발생 시 전체 실패됨)
3. 희망 개선안(TO-BE): (예: 정상 행은 우선 등록되고 오류 행만 엑셀로 재다운로드)
4. 기대 효과: 반복 수기 등록 공수 절감 및 대량 업로드 오류 방지`,
      faq: [
        {
          q: '대량 상품 등록 어드민 UI 개선 일정은 언제 릴리즈되나요?',
          a: '현재 2026 Q4 핵심 과제로 지정되어 파일럿 개발 중이며, 11월 중순 온라인MD팀 대상 1차 사용성 테스트를 진행할 예정입니다.',
        },
        {
          q: '신규 프로모션(타임세일 룰) 세팅 지원을 받으려면 어떻게 하나요?',
          a: '프로모션 시작 2주 전 서비스기획팀 어드민 파트로 요청 양식을 전달해 주시면 어드민 룰 세팅 가이드와 함께 사전 테스트를 지원합니다.',
        },
      ],
    },
    'dept-mgmt-plan': {
      roleTitle: '경영기획 총괄 협업 가이드',
      cooperationPoints: [
        '시선닷컴 연간/분기별 핵심 KPI 지표(GMV, MAU, 전환율, 이탈률) 실시간 대시보드 공유',
        '이커머스 중장기 로드맵 수립 및 전사 디지털 트랜스포메이션(DT) 방향성 정렬',
        '온·오프라인 통합 옴니채널 성과 측정 및 리소스 배분 협의',
      ],
      mainContact: '서비스기획팀장 직통 협의체',
      guideTip: '포털 내 [KPI 목표 및 평가] 탭에서 분기별 종합 달성도를 상시 열람하실 수 있습니다.',
      requestTemplate: `[경영기획 ➔ 서비스기획팀 전략 보고 요청]
1. 요청 안건: (예: 2026 시선닷컴 연간 DT 추진 로드맵 및 지표 공유)
2. 필요 데이터 지표: (월간 활성 이용자 수 / 객단가 추이 / 모바일 비중)
3. 회의 및 보고 희망일: 2026-00-00`,
      faq: [
        {
          q: '시선닷컴의 분기별 성과 지표는 어디서 바로 확인할 수 있나요?',
          a: '본 업무관리 포털의 좌측 네비게이션 [KPI 목표 및 평가] 화면에서 실시간 가중치 및 달성률 대시보드를 조회하실 수 있습니다.',
        },
      ],
    },
    'dept-digital-info': {
      roleTitle: '디지털정보실 협업 가이드',
      cooperationPoints: [
        '시선닷컴 프론트엔드와 ERP/물류/PG사 API 연동 규격 사전 협의 및 스펙 정의',
        '서버 부하 분산 및 대규모 트래픽 프로모션 사전 모니터링 체계 구축',
        '어드민 권한 및 보안 컴플라이언스 준수 체계 공동 점검',
      ],
      mainContact: '서비스기획팀 기술 협의 파트',
      guideTip: '주간 개발/기획 정기 싱크(매주 화요일)를 통해 기술 실현 가능성과 배포 일정을 조율합니다.',
      requestTemplate: `[디지털정보실 ➔ 서비스기획팀 기술 협의]
1. 연동 시스템: (ERP / WMS물류 / 결제PG / 회원DB)
2. API 변경 사항: (파라미터 규격 변경 및 응답 속도 개선)
3. 기획단 검토 필요 사항: (예외 에러 발생 시 사용자 화면 안내 문구 가이드)`,
      faq: [
        {
          q: 'API 규격 변경 시 프론트엔드 반영 주기는 어떻게 되나요?',
          a: '매주 화요일 정기 싱크 후 스테이징 환경에서 1차 검수 후, 목요일 새벽 정기 배포로 안정적으로 운영됩니다.',
        },
      ],
    },
    'dept-digital-mkt': {
      roleTitle: '디지털마케팅실 협업 가이드',
      cooperationPoints: [
        '퍼포먼스 마케팅 랜딩페이지 및 광고 추적 태그(GA4, 메타 픽셀 등) 설치 기획',
        '회원가입 퍼널 및 첫 구매 쿠폰 전환율 개선 A/B 테스트 기획',
        '카카오 알림톡/개인화 푸시 발송 시나리오 및 고객 세그먼트 정책 설계',
      ],
      mainContact: '서비스기획팀 데이터/전환 파트',
      guideTip: 'A/B 테스트 제안은 가설과 타겟 지표(CTR, CVR)를 함께 전달해 주시면 즉시 설계안을 도출합니다.',
      requestTemplate: `[디지털마케팅 ➔ 서비스기획팀 A/B 테스트 제안]
1. 테스트 대상 페이지: (메인 히어로 / 상품 상세 / 장바구니)
2. 검증 가설: (예: 장바구니 첫 구매 혜택 안내 팝업 노출 시 결제 전환 경험 개선 여부 검증)
3. 타겟 모수 및 기간: (예: 대조군 A / 실험군 B 균등 분할 테스트)`,
      faq: [
        {
          q: '광고 추적 스크립트(GTM/픽셀) 삽입 요청은 어떻게 하나요?',
          a: '태그 스크립트 코드와 발화 조건(트리거)을 정리하여 전달해 주시면 QA 후 2영업일 내 운영 반영됩니다.',
        },
      ],
    },
    'dept-plan': {
      roleTitle: '서비스기획팀 내부 R&R 가이드',
      cooperationPoints: [
        '시선닷컴 UI/UX 화면설계서(SB) 및 정책서 표준 템플릿 준수',
        '디자인/퍼블리싱 산출물 QA 검수 및 개발팀 인계(Handoff)',
        '사내 유관부서 인입 요구사항 티켓팅 및 스프린트 우선순위 관리',
      ],
      mainContact: '서비스기획팀 전체',
      guideTip: '모든 업무 변경과 휴가 일정은 포털에 등록하여 팀원 간 공백 없는 협업을 유지합니다.',
      requestTemplate: `[서비스기획팀 내부 스프린트 티켓]
1. 과제명: 
2. 담당자:
3. 마감 예정일: 
4. 관련 산출물 링크: (화면설계서 SB 문서 링크)`,
      faq: [
        {
          q: '화면설계서(SB) 버전 및 산출물 관리 원칙은 무엇인가요?',
          a: '모든 화면설계서(SB)는 표준 문서 템플릿과 정책 코드(Policy Code) 체계를 준수하여 작성하며, 배포 전 팀 리뷰를 필수로 거칩니다.',
        },
      ],
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* 1. 최상단 슬림 히어로 배너 (시선인터내셔널 비전 & 미션 1줄 요약) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #0f1f3d 40%, #1e3a8a 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '22px 32px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 장식용 은은한 배경 발광 원 */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', position: 'relative', zIndex: 2 }}>
          <h1
            style={{
              fontSize: 'clamp(17px, 1.85vw, 24px)',
              fontWeight: 800,
              letterSpacing: '-0.6px',
              lineHeight: 1.35,
              marginBottom: '6px',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {TEAM_GUIDE_DATA.vision}
          </h1>

          <p
            style={{
              fontSize: 'clamp(12px, 1.05vw, 14.5px)',
              color: '#cbd5e1',
              lineHeight: 1.5,
              marginBottom: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {TEAM_GUIDE_DATA.mission}
          </p>
        </div>
      </div>

      {/* 2. 3인 캐릭터 [시선닷컴 UI/UX 개편] 릴레이 애니메이션 쇼케이스 */}
      <SisunRenewalStoryStage />

      {/* 2. 서비스기획팀 3대 집중 추진 영역 (탭 UI & 통합 상세 뷰) */}
      <div id="pillars-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <Layers size={20} color="#2563eb" />
          <h2 style={{ fontSize: '19px', fontWeight: 800 }}>서비스기획팀 3대 집중 추진 영역</h2>
        </div>

        {/* 상단 3대 영역 TAB 바 (중복 아이콘 제거, 간결한 탭 구조) */}
        <div
          role="tablist"
          aria-label="서비스기획팀 3대 집중 추진 영역 탭"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '8px',
            background: '#f1f5f9',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '14px',
          }}
        >
          {PILLARS_DATA.map((pillar) => {
            const isSelected = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActivePillar(pillar.id)}
                style={{
                  background: isSelected ? '#ffffff' : 'transparent',
                  border: isSelected ? `1.5px solid ${pillar.color}` : '1.5px solid transparent',
                  borderRadius: '9px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 4px 12px -2px ${pillar.color}20` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: pillar.color,
                    }}
                  />
                )}

                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: isSelected ? pillar.color : '#64748b',
                    letterSpacing: '0.6px',
                  }}
                >
                  {pillar.badge}
                </span>

                <div
                  style={{
                    fontSize: '14.5px',
                    fontWeight: isSelected ? 800 : 700,
                    color: isSelected ? 'var(--text-main)' : '#475569',
                    lineHeight: 1.35,
                  }}
                >
                  {pillar.title}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: isSelected ? 'var(--text-secondary)' : '#64748b',
                    lineHeight: 1.35,
                  }}
                >
                  {pillar.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택된 영역의 통합 상세 패널 (중복 섹션 통합 & 텍스트 간소화) */}
        {(() => {
          const selected = PILLARS_DATA[activePillar];
          return (
            <div
              className="card"
              style={{
                padding: '22px 24px',
                background: selected.bgGradient,
                border: `1.5px solid ${selected.borderColor}`,
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#334155',
                  fontWeight: 600,
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                {selected.description}
              </p>

              {/* 통합 3단계 핵심 과업 카드 그리드 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px',
                }}
              >
                {selected.pipelineSteps.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.45 }}>
                      {step.desc}
                    </div>
                    <div
                      style={{
                        marginTop: '4px',
                        paddingTop: '10px',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {step.points.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            fontSize: '12px',
                            color: '#334155',
                            lineHeight: 1.4,
                          }}
                        >
                          • {pt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 핵심 기대 목표 바 (아이콘 및 정량 숫자 배제) */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '11px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: selected.color, fontWeight: 800 }}>핵심 추진 목표</span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>{selected.keyMetrics}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. 시선닷컴 5단계 기획 & 릴리즈 스프린트 (인터랙티브 스텝퍼) */}
      <div id="process-guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Compass size={22} color="#2563eb" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>시선닷컴 5단계 기획 & 릴리즈 스프린트</h2>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
          단계를 클릭하시면 해당 스프린트 단계의 핵심 산출물과 유관부서 협의 체크리스트를 확인하실 수 있습니다.
        </p>

        {/* 인터랙티브 스텝퍼 버튼 헤더 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {TEAM_GUIDE_DATA.processSteps.map((step) => {
            const isStepActive = activeStep === step.step;
            return (
              <button
                key={step.step}
                onClick={() => setActiveStep(step.step)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isStepActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: isStepActive ? '#eff6ff' : '#ffffff',
                  color: isStepActive ? '#1d4ed8' : '#475569',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                  boxShadow: isStepActive ? '0 4px 12px rgba(37,99,235,0.15)' : 'none',
                }}
              >
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isStepActive ? '#2563eb' : '#e2e8f0',
                    color: isStepActive ? '#ffffff' : '#64748b',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.step}
                </span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: isStepActive ? '#2563eb' : '#94a3b8', textTransform: 'uppercase' }}>
                    STEP 0{step.step}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 현재 활성화된 스텝 상세 카드 쇼케이스 */}
        {(() => {
          const currentStep = TEAM_GUIDE_DATA.processSteps[activeStep - 1];
          return (
            <div
              className="card"
              style={{
                padding: '24px 28px',
                border: '1.5px solid #bfdbfe',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        borderRadius: '4px',
                      }}
                    >
                      STEP {currentStep.step}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      {currentStep.subtitle}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {currentStep.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeStep > 1 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      이전 단계
                    </button>
                  )}
                  {activeStep < 5 && (
                    <button
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      다음 단계 보기 <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginBottom: '20px' }}>
                {currentStep.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderGit2 size={15} color="#2563eb" /> 본 단계 핵심 산출물 (Deliverables):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentStep.deliverables.map((deliv, dIdx) => (
                      <div key={dIdx} style={{ fontSize: '12.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={13} color="#10b981" /> {deliv}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={15} color="#7c3aed" /> 주요 협의 관계자 (Stakeholders):
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {currentStep.stakeholders}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. 사내 6대 유관부서 맞춤 협업 가이드 & 업무 요청 양식 복사기 */}
      <div className="card" style={{ padding: '30px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Laptop size={22} color="#2563eb" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>사내 6대 유관부서별 맞춤 협업 데스크</h2>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          소속 부서 탭을 클릭하시면, 서비스기획팀과의 맞춤형 협업 포인트 및 메신저/이메일용 업무 요청 양식을 1초 만에 복사하실 수 있습니다.
        </p>

        {/* 부서 선택 버튼 바 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          {COMPANY_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDeptId === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedDeptId(dept.id);
                  setExpandedFaqIndex(null);
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#475569',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
                }}
              >
                {dept.name} {dept.isPlanningTeam && '⭐ (우리팀)'}
              </button>
            );
          })}
        </div>

        {/* 선택된 부서의 협업 상세 카드 */}
        {(() => {
          const collab = DEPT_COLLAB_INFO[selectedDeptId] || DEPT_COLLAB_INFO['dept-online-mn'];
          return (
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                animation: 'fadeIn 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {collab.roleTitle}
                </h3>
                <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                  💡 {collab.guideTip}
                </span>
              </div>

              {/* 중점 협업 포인트 */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  🎯 주요 협업 및 지원 업무 범위:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {collab.cooperationPoints.map((pt, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <CheckCircle2 size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 업무 요청 양식 1클릭 복사기 (인터랙션) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={15} color="#2563eb" /> 사내 메신저(잔디) / 이메일 공식 요청 템플릿
                  </div>
                  <button
                    onClick={() => handleCopyText(collab.requestTemplate, selectedDeptId)}
                    className="btn"
                    style={{
                      background: copiedKey === selectedDeptId ? '#059669' : '#2563eb',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderRadius: '6px',
                    }}
                  >
                    {copiedKey === selectedDeptId ? (
                      <>
                        <Check size={14} /> 양식 복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> 양식 클립보드 복사
                      </>
                    )}
                  </button>
                </div>

                <pre
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#334155',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid #e2e8f0',
                    margin: 0,
                  }}
                >
                  {collab.requestTemplate}
                </pre>
              </div>

              {/* 자주 묻는 질문(FAQ) 아코디언 */}
              {collab.faq && collab.faq.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={15} color="#64748b" /> 자주 묻는 질문 (FAQ)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {collab.faq.map((item, fIdx) => {
                      const isExpanded = expandedFaqIndex === fIdx;
                      return (
                        <div
                          key={fIdx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : fIdx)}
                            style={{
                              padding: '10px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              color: '#1e293b',
                            }}
                          >
                            <span>Q. {item.q}</span>
                            <ChevronRight
                              size={15}
                              style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.15s ease',
                              }}
                            />
                          </div>
                          {isExpanded && (
                            <div
                              style={{
                                padding: '10px 14px',
                                background: '#f8fafc',
                                borderTop: '1px solid #e2e8f0',
                                fontSize: '12px',
                                color: '#475569',
                                lineHeight: 1.5,
                              }}
                            >
                              A. {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 공식 소통 창구 바 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '12.5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>공식 소통 및 요청 담당:</span>
                <strong style={{ color: '#2563eb' }}>{collab.mainContact}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. 국내외 서비스기획 & 프로덕트 벤치마킹 허브 (사용자 요청 반영 섹션) */}
      <div id="benchmark-hub" className="card" style={{ padding: '30px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="#2563eb" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>국내외 서비스기획/프로덕트 벤치마킹 레퍼런스</h2>
          </div>
          <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>
            Toss · Shopify · Linear · 29CM 디자인 시스템 분석
          </span>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
          서비스기획팀이 지향하는 최상위 프로덕트 기준을 제공하기 위해, 글로벌 및 국내 1위 테크 기업들의 기획·디자인 시스템을 벤치마킹하여 시선닷컴에 도입하고 있습니다.
        </p>

        {/* 4대 벤치마크 사이트 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          {BENCHMARK_SITES.map((site) => (
            <div
              key={site.id}
              className="interactive-card"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: site.logoColor,
                    background: `${site.logoColor}15`,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {site.tag}
                </span>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#64748b',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  공식 사이트 <ArrowUpRight size={14} />
                </a>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {site.name}
              </h4>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {site.summary}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  ⭐ 시선닷컴 적용 벤치마킹 포인트:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {site.benchmarkingPoints.map((pt, pIdx) => (
                    <div key={pIdx} style={{ fontSize: '11.5px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                      <CheckCircle2 size={12} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 공식 협업 창구 & 팀원 명단 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* 공식 협업 창구 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>공식 기획 문의 & 정기 회의체</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TEAM_GUIDE_DATA.collaborationChannels.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{ch.name}</span>
                  <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {ch.type}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{ch.purpose}</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>{ch.linkOrContact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 서비스기획팀 조직 R&R 및 다짐 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>서비스기획팀 R&R 조직 구성</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                기획
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                  시선인터내셔널 디지털서비스기획팀
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                  시선닷컴 UI/UX 화면설계 · 비주얼 디자인 · 퍼블리싱 · 백오피스 어드민 효율화 · 이커머스 정책
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              💬 <strong>협업 안내:</strong> 담당 기획자별 개별 연락은 사내 메신저(잔디) 검색 또는 상단 <strong>#sisun-service-planning</strong> 채널을 이용해 주시면 가장 빠르고 체계적으로 소통하실 수 있습니다.
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button
                onClick={onNavigateToTasks}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '13px', justifyContent: 'center' }}
              >
                전체 업무 목록(Tasks) 확인하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
