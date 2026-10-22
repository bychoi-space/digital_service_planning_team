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
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateToTasks: () => void;
}

export function OverviewView({ onNavigateToTasks }: OverviewViewProps) {
  // 3대 핵심 업무 탭 상태 (0: UI/UX개편, 1: 어드민효율화, 2: 이커머스정책)
  const [activePillar, setActivePillar] = useState<number>(0);

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
      themeClass: 'pillar-theme-blue',
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
      themeClass: 'pillar-theme-emerald',
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
      themeClass: 'pillar-theme-purple',
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
      tagClass: 'benchmark-tag-toss',
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
      tagClass: 'benchmark-tag-shopify',
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
      tagClass: 'benchmark-tag-linear',
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
      tagClass: 'benchmark-tag-29cm',
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
    <div className="overview-container">
      {/* 1. 최상단 슬림 히어로 배너 (시선인터내셔널 비전 & 미션 1줄 요약) */}
      <div className="overview-hero">
        <div className="overview-hero-glow" />
        <div className="overview-hero-content">
          <h1 className="overview-hero-title">{TEAM_GUIDE_DATA.vision}</h1>
          <p className="overview-hero-mission">{TEAM_GUIDE_DATA.mission}</p>
        </div>
      </div>

      {/* 2. 3인 캐릭터 [시선닷컴 UI/UX 개편] 릴레이 애니메이션 쇼케이스 */}
      <SisunRenewalStoryStage />

      {/* 3. 서비스기획팀 3대 집중 추진 영역 (탭 UI & 통합 상세 뷰) */}
      <div id="pillars-section">
        <div className="overview-section-header">
          <Layers size={20} className="overview-section-icon" />
          <h2 className="overview-section-title">서비스기획팀 3대 집중 추진 영역</h2>
        </div>

        {/* 상단 3대 영역 TAB 바 */}
        <div
          role="tablist"
          aria-label="서비스기획팀 3대 집중 추진 영역 탭"
          className="pillars-tablist"
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
                className={`pillar-tab ${pillar.themeClass} ${isSelected ? 'active' : ''}`}
              >
                <span className="pillar-tab-badge">{pillar.badge}</span>
                <div className="pillar-tab-title">{pillar.title}</div>
                <div className="pillar-tab-subtitle">{pillar.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* 선택된 영역의 통합 상세 패널 */}
        {(() => {
          const selected = PILLARS_DATA[activePillar];
          return (
            <div className={`card pillar-panel ${selected.themeClass}`}>
              <p className="pillar-panel-desc">{selected.description}</p>

              {/* 통합 3단계 핵심 과업 카드 그리드 */}
              <div className="pillar-steps-grid">
                {selected.pipelineSteps.map((step, sIdx) => (
                  <div key={sIdx} className="pillar-step-card">
                    <div className="pillar-step-name">{step.name}</div>
                    <div className="pillar-step-desc">{step.desc}</div>
                    <div className="pillar-step-points">
                      {step.points.map((pt, pIdx) => (
                        <div key={pIdx} className="pillar-step-point">
                          • {pt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 핵심 추진 목표 바 */}
              <div className="pillar-goal-bar">
                <span className="pillar-goal-label">핵심 추진 목표</span>
                <span className="pillar-goal-divider">|</span>
                <strong className="pillar-goal-text">{selected.keyMetrics}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. 시선닷컴 5단계 기획 & 릴리즈 스프린트 (중복 상세 박스 제거, 5단계 흐름만 직관적 표시) */}
      <div id="process-guide">
        <div className="overview-section-header">
          <Compass size={20} className="overview-section-icon" />
          <h2 className="overview-section-title">시선닷컴 5단계 기획 & 릴리즈 스프린트</h2>
        </div>

        <div className="sprint-stepper-grid">
          {TEAM_GUIDE_DATA.processSteps.map((step) => (
            <div key={step.step} className="sprint-step-card">
              <span className="sprint-step-circle">{step.step}</span>
              <div className="sprint-step-text-wrap">
                <div className="sprint-step-code">STEP 0{step.step}</div>
                <div className="sprint-step-short-title">{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 사내 6대 유관부서 맞춤 협업 가이드 & 업무 요청 양식 복사기 */}
      <div className="card overview-card-padded">
        <div className="overview-section-header">
          <Laptop size={22} className="overview-section-icon" />
          <h2 className="overview-section-title">사내 6대 유관부서별 맞춤 협업 데스크</h2>
        </div>
        <p className="overview-section-desc">
          소속 부서 탭을 클릭하시면, 서비스기획팀과의 맞춤형 협업 포인트 및 메신저/이메일용 업무 요청 양식을 1초 만에 복사하실 수 있습니다.
        </p>

        {/* 부서 선택 버튼 바 */}
        <div className="collab-dept-bar">
          {COMPANY_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDeptId === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setSelectedDeptId(dept.id);
                  setExpandedFaqIndex(null);
                }}
                className={`collab-dept-btn ${isSelected ? 'active' : ''}`}
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
            <div className="collab-detail-box">
              <div className="collab-detail-header">
                <h3 className="collab-role-title">{collab.roleTitle}</h3>
                <span className="collab-tip-badge">{collab.guideTip}</span>
              </div>

              {/* 중점 협업 포인트 */}
              <div>
                <div className="collab-sub-title">주요 협업 및 지원 업무 범위</div>
                <div className="collab-points-list">
                  {collab.cooperationPoints.map((pt, pIdx) => (
                    <div key={pIdx} className="collab-point-item">
                      <CheckCircle2 size={16} className="collab-point-icon" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 업무 요청 양식 1클릭 복사기 */}
              <div className="collab-template-card">
                <div className="collab-template-header">
                  <div className="collab-template-title">
                    <MessageSquare size={16} className="overview-section-icon" /> 사내 메신저(잔디) / 이메일 공식 요청 템플릿
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(collab.requestTemplate, selectedDeptId)}
                    className={`btn collab-copy-btn ${copiedKey === selectedDeptId ? 'copied' : ''}`}
                  >
                    {copiedKey === selectedDeptId ? (
                      <>
                        <Check size={15} /> 양식 복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> 양식 클립보드 복사
                      </>
                    )}
                  </button>
                </div>

                <pre className="collab-template-pre">{collab.requestTemplate}</pre>
              </div>

              {/* 자주 묻는 질문(FAQ) 아코디언 */}
              {collab.faq && collab.faq.length > 0 && (
                <div>
                  <div className="collab-sub-title">
                    <HelpCircle size={16} color="#64748b" /> 자주 묻는 질문 (FAQ)
                  </div>
                  <div className="collab-faq-list">
                    {collab.faq.map((item, fIdx) => {
                      const isExpanded = expandedFaqIndex === fIdx;
                      return (
                        <div key={fIdx} className="collab-faq-item">
                          <div
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : fIdx)}
                            className="collab-faq-question"
                          >
                            <span>Q. {item.q}</span>
                            <ChevronRight
                              size={16}
                              className={`collab-faq-chevron ${isExpanded ? 'expanded' : ''}`}
                            />
                          </div>
                          {isExpanded && <div className="collab-faq-answer">A. {item.a}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 공식 소통 창구 바 */}
              <div className="collab-contact-bar">
                <span className="collab-contact-label">공식 소통 및 요청 담당:</span>
                <strong className="collab-contact-value">{collab.mainContact}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 6. 국내외 서비스기획 & 프로덕트 벤치마킹 허브 */}
      <div id="benchmark-hub" className="card overview-card-padded">
        <div className="overview-section-header-between">
          <div className="overview-section-title-group">
            <Sparkles size={22} className="overview-section-icon" />
            <h2 className="overview-section-title">국내외 서비스기획/프로덕트 벤치마킹 레퍼런스</h2>
          </div>
          <span className="benchmark-header-badge">
            Toss · Shopify · Linear · 29CM 디자인 시스템 분석
          </span>
        </div>

        <p className="overview-section-desc">
          서비스기획팀이 지향하는 최상위 프로덕트 기준을 제공하기 위해, 글로벌 및 국내 1위 테크 기업들의 기획·디자인 시스템을 벤치마킹하여 시선닷컴에 도입하고 있습니다.
        </p>

        {/* 4대 벤치마크 사이트 카드 그리드 */}
        <div className="benchmark-grid">
          {BENCHMARK_SITES.map((site) => (
            <div key={site.id} className="interactive-card benchmark-card">
              <div className="benchmark-card-top">
                <span className={`benchmark-tag ${site.tagClass}`}>{site.tag}</span>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="benchmark-link"
                >
                  공식 사이트 <ArrowUpRight size={15} />
                </a>
              </div>

              <h4 className="benchmark-name">{site.name}</h4>
              <p className="benchmark-summary">{site.summary}</p>

              <div className="benchmark-points-section">
                <div className="benchmark-points-title">시선닷컴 적용 벤치마킹 포인트</div>
                <div className="benchmark-points-list">
                  {site.benchmarkingPoints.map((pt, pIdx) => (
                    <div key={pIdx} className="benchmark-point-item">
                      <CheckCircle2 size={15} className="benchmark-point-icon" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. 공식 협업 창구 & 팀원 명단 */}
      <div className="overview-bottom-grid">
        {/* 공식 협업 창구 */}
        <div className="card overview-subcard">
          <div className="overview-subcard-header">
            <MessageSquare size={18} className="overview-section-icon" />
            <h3 className="overview-subcard-title">공식 기획 문의 & 정기 회의체</h3>
          </div>
          <div className="channel-list">
            {TEAM_GUIDE_DATA.collaborationChannels.map((ch, idx) => (
              <div key={idx} className="channel-item">
                <div className="channel-item-top">
                  <span className="channel-name">{ch.name}</span>
                  <span className="channel-type-badge">{ch.type}</span>
                </div>
                <div className="channel-purpose">{ch.purpose}</div>
                <div className="channel-contact">{ch.linkOrContact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 서비스기획팀 조직 R&R 및 다짐 */}
        <div className="card overview-subcard">
          <div className="overview-subcard-header">
            <Users size={18} className="overview-section-icon" />
            <h3 className="overview-subcard-title">서비스기획팀 R&R 조직 구성</h3>
          </div>
          <div className="team-org-body">
            <div className="team-org-banner">
              <div className="team-org-avatar">기획</div>
              <div className="team-org-info">
                <div className="team-org-name">시선인터내셔널 디지털서비스기획팀</div>
                <div className="team-org-roles">
                  시선닷컴 UI/UX 화면설계 · 비주얼 디자인 · 퍼블리싱 · 백오피스 어드민 효율화 · 이커머스 정책
                </div>
              </div>
            </div>

            <div className="team-org-notice">
              <strong>협업 안내:</strong> 담당 기획자별 개별 연락은 사내 메신저(잔디) 검색 또는 상단 <strong>#sisun-service-planning</strong> 채널을 이용해 주시면 가장 빠르고 체계적으로 소통하실 수 있습니다.
            </div>

            <div className="team-org-actions">
              <button
                type="button"
                onClick={onNavigateToTasks}
                className="btn btn-primary team-org-tasks-btn"
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
