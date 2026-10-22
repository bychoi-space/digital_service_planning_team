import { useState } from 'react';
import { TEAM_GUIDE_DATA } from '../constants/teamGuide';
import { COMPANY_DEPARTMENTS } from '../constants/departments';
import { SisunRenewalStoryStage } from './SisunRenewalStoryStage';
import {
  Compass,
  ArrowRight,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  Palette,
  Sliders,
  BookOpen,
  Laptop,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Copy,
  Check,
  Zap,
  Clock,
  ArrowUpRight,
  HelpCircle,
  Eye,
  FolderGit2,
  FileText,
  Smartphone,
  Monitor,
  ShieldCheck,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateToTasks: () => void;
}

export function OverviewView({ onNavigateToTasks }: OverviewViewProps) {
  // 3대 핵심 업무 탭 상태 (0: UI/UX개편, 1: 어드민효율화, 2: 이커머스정책)
  const [activePillar, setActivePillar] = useState<number>(0);

  // Pillar 1: UI/UX 개편 세부 산출물 탭 (sb: 기획서, ui: 비주얼디자인, pub: 반응형퍼블리싱)
  const [pillar1SubTab, setPillar1SubTab] = useState<'sb' | 'ui' | 'pub'>('sb');

  // Pillar 2: 어드민 효율화 Before/After 토글 상태 ('after' | 'before')
  const [adminComparisonMode, setAdminComparisonMode] = useState<'after' | 'before'>('after');

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

  // 3대 핵심 업무 상세 데이터
  const PILLARS_DATA = [
    {
      id: 0,
      badge: 'PILLAR 01',
      title: '시선닷컴 (sisun.com) UI/UX 전면 개편',
      subtitle: '기획서(화면설계/SB) 작성 · 프리미엄 UI 디자인 · 반응형 퍼블리싱 총괄',
      color: '#2563eb',
      glowClass: 'interactive-glow-blue',
      bgGradient: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.01) 100%)',
      borderColor: '#93c5fd',
      icon: <Palette size={22} color="#2563eb" />,
      description:
        '미샤(MICHAA), 잇미샤(it MICHAA), E.B.M 등 시선인터내셔널의 대표 프리미엄 패션 브랜드 감성을 온전히 전달할 수 있도록 고객 경험(CX)을 혁신합니다.',
      pipelineSteps: [
        {
          name: '1. 기획서(화면설계서/SB) 작성',
          desc: '고객 여정(CJM) 분석을 바탕으로 메인, 상품상세, 룩북, 주문/결제 화면설계 및 정책 명세',
        },
        {
          name: '2. UI/UX 비주얼 디자인',
          desc: '브랜드 아이덴티티와 최신 트렌드를 반영한 고해상도 디자인 시스템 및 피그마 컴포넌트화',
        },
        {
          name: '3. 반응형 웹 퍼블리싱',
          desc: '모바일 웹, PC 브라우저, 앱 웹뷰 어디서나 완벽한 비율과 속도를 보장하는 정밀 퍼블리싱',
        },
      ],
      keyMetrics: '모바일 이탈률 15%p 감축 / 상품 상세 페이지 체류 시간 25% 증가 목표',
    },
    {
      id: 1,
      badge: 'PILLAR 02',
      title: '시선닷컴 어드민(백오피스) 운영 효율화',
      subtitle: 'MD/영업팀 작업 능률 극대화 · 상품 및 프로모션 세팅 자동화',
      color: '#059669',
      glowClass: 'interactive-glow-emerald',
      bgGradient: 'linear-gradient(135deg, rgba(5,150,105,0.06) 0%, rgba(5,150,105,0.01) 100%)',
      borderColor: '#86efac',
      icon: <Sliders size={22} color="#059669" />,
      description:
        '온라인MD, 운영팀이 매일 반복하는 비효율적인 수기 작업을 제거하고, 대량 상품 등록 및 기획전 세팅을 직관적으로 수행할 수 있도록 어드민 사용성을 개선합니다.',
      pipelineSteps: [
        {
          name: '1. 상품 대량 일괄 관리 개선',
          desc: '옵션/재고/가격 엑셀 일괄 등록 속도 개선 및 오류 검증 프리뷰 제공',
        },
        {
          name: '2. 프로모션/기획전 세팅 간소화',
          desc: '쿠폰 발급 조건 및 타임세일 자동 스케줄링 어드민 UI 전면 직관화',
        },
        {
          name: '3. 주문/클레임 처리 워크플로우 단축',
          desc: '교환/반품 승인 및 물류 연동 단계 간소화로 VOC 처리 속도 50% 단축',
        },
      ],
      keyMetrics: '온라인MD 일상 세팅 공수 40% 절감 / 휴먼 에러 제로화',
    },
    {
      id: 2,
      badge: 'PILLAR 03',
      title: '시선인터내셔널 이커머스 정책 & 프로세스 정의',
      subtitle: '전사 온·오프라인 연계 표준 수립 · 6대 사내 부서간 협업 매트릭스',
      color: '#7c3aed',
      glowClass: 'interactive-glow-purple',
      bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(124,58,237,0.01) 100%)',
      borderColor: '#c4b5fd',
      icon: <BookOpen size={22} color="#7c3aed" />,
      description:
        '브랜드 사업부, 온라인몰, 물류, 마케팅, IT 간의 업무 경계를 허물고, 누구나 명확한 기준에 따라 일할 수 있도록 전사 이커머스 운영 규정을 정립합니다.',
      pipelineSteps: [
        {
          name: '1. 온·오프라인 통합 멤버십 규정',
          desc: '오프라인 매장 고객과 시선닷컴 온라인 고객의 포인트/등급/쿠폰 통합 정책 수립',
        },
        {
          name: '2. 브랜드별 온라인 판매 및 반품 규정',
          desc: '패션 상품군별(의류, 잡화) 검품 기준 및 왕복 배송비, 환불 정책 표준화',
        },
        {
          name: '3. 사내 유관부서 협업 R&R 정의',
          desc: '요구사항 접수부터 릴리즈까지 각 부서(MN, MD, 마케팅, 정보실)의 명확한 역할 매트릭스',
        },
      ],
      keyMetrics: '부서간 커뮤니케이션 비용 60% 단축 / 전사 이커머스 표준 매뉴얼 구축',
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
4. 기대 효과: 일일 상품 등록 작업 시간 약 1시간 단축 예상`,
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
2. 검증 가설: (예: 장바구니 첫 구매 10% 할인 팝업 노출 시 CVR 1.8% 상승)
3. 타겟 모수 및 기간: 2주간 전체 유입자의 50% 분할`,
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
4. 관련 산출물 링크: (피그마 SB 링크)`,
      faq: [
        {
          q: '피그마 화면설계서 버전 관리 원칙은 무엇인가요?',
          a: '모든 컴포넌트는 TDS(Team Design System) 라이브러리를 바인딩하며, 브랜치 머지 전 팀 리뷰를 필수로 거칩니다.',
        },
      ],
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* 1. 최상단 히어로 비주얼 배너 (시선인터내셔널 프리미엄 비전 + 글로벌 벤치마킹 모션) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090d16 0%, #0f1f3d 40%, #1e3a8a 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 38px',
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
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '880px', position: 'relative', zIndex: 2 }}>
          {/* 배지 태그 라인 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#93c5fd',
                border: '1px solid rgba(147, 197, 253, 0.3)',
              }}
            >
              <Sparkles size={14} color="#60a5fa" /> SISUN INTERNATIONAL · SERVICE PLANNING TEAM
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#6ee7b7',
              }}
            >
              <Zap size={13} /> Toss × Shopify × Linear 글로벌 벤치마크 철학 탑재
            </div>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.8px',
              lineHeight: 1.35,
              marginBottom: '14px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {TEAM_GUIDE_DATA.vision}
          </h1>

          <p style={{ fontSize: '15.5px', color: '#cbd5e1', lineHeight: 1.65, marginBottom: '28px', maxWidth: '820px' }}>
            {TEAM_GUIDE_DATA.mission}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onNavigateToTasks}
              className="btn interactive-card"
              style={{
                background: '#ffffff',
                color: '#1d4ed8',
                fontWeight: 700,
                padding: '12px 22px',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              현재 진행 업무(Tasks) 현황 보기 <ArrowRight size={16} />
            </button>

            <a
              href="https://sisun.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary interactive-card"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '12px 20px',
                fontSize: '14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShoppingBag size={16} /> 시선닷컴 (sisun.com) 공식몰 방문 <ExternalLink size={14} />
            </a>

            <a
              href="#benchmark-hub"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('benchmark-hub')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-secondary"
              style={{
                background: 'transparent',
                color: '#93c5fd',
                border: '1px dashed rgba(147, 197, 253, 0.4)',
                padding: '11px 18px',
                fontSize: '13.5px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={15} /> 벤치마킹 레퍼런스 가이드 <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* 2. 3인 캐릭터 [시선닷컴 UI/UX 개편] 릴레이 애니메이션 쇼케이스 */}
      <SisunRenewalStoryStage />

      {/* 2. 서비스기획팀 3대 집중 추진 영역 (인터랙티브 쇼케이스 & 마이크로 모션) */}
      <div id="pillars-section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="#2563eb" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>서비스기획팀 3대 집중 추진 영역</h2>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            * 각 카드를 클릭하면 상세 추진 파이프라인 및 인터랙티브 시뮬레이터를 확인하실 수 있습니다.
          </span>
        </div>

        {/* 3대 영역 탭 카드 그리드 (Hover Glow 및 승강 모션 적용) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
            marginBottom: '20px',
          }}
        >
          {PILLARS_DATA.map((pillar) => {
            const isSelected = activePillar === pillar.id;
            return (
              <div
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                className={`interactive-card ${pillar.glowClass}`}
                style={{
                  background: '#ffffff',
                  border: isSelected ? `2px solid ${pillar.color}` : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? `0 10px 25px -4px ${pillar.color}35` : 'var(--shadow-sm)',
                  transform: isSelected ? 'translateY(-4px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 선택 활성화 인디케이터 라인 */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: pillar.color,
                    }}
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: pillar.color,
                      letterSpacing: '0.8px',
                      padding: '4px 10px',
                      background: `${pillar.color}15`,
                      borderRadius: '6px',
                    }}
                  >
                    {pillar.badge}
                  </span>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: `${pillar.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pillar.icon}
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {pillar.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {pillar.subtitle}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: pillar.color,
                  }}
                >
                  <span>{isSelected ? '상세 프로세스 열람 중' : '클릭하여 상세 보기'}</span>
                  <ChevronRight size={15} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 영역의 세부 쇼케이스 패널 */}
        {(() => {
          const selected = PILLARS_DATA[activePillar];
          return (
            <div
              className="card"
              style={{
                padding: '30px 32px',
                background: selected.bgGradient,
                border: `1.5px solid ${selected.borderColor}`,
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.25s ease-out',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: selected.color,
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {selected.badge} 상세 추진 전략 & 산출물
                </span>
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                {selected.title}
              </h3>

              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                {selected.description}
              </p>

              {/* 3대 중점 영역별 특화 인터랙티브 위젯 */}
              {activePillar === 0 && (
                /* Pillar 1: UI/UX 개편 3대 산출물 갤러리/탭 (스토리보드 vs UI디자인 vs 퍼블리싱) */
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Palette size={18} color="#2563eb" />
                      <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>
                        시선닷컴 개편 3단계 제작 파이프라인 미리보기
                      </strong>
                    </div>

                    {/* 서브탭 버튼 */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setPillar1SubTab('sb')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: pillar1SubTab === 'sb' ? 700 : 500,
                          background: pillar1SubTab === 'sb' ? '#eff6ff' : '#f8fafc',
                          color: pillar1SubTab === 'sb' ? '#1d4ed8' : '#64748b',
                          border: pillar1SubTab === 'sb' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <FileText size={13} /> 1. 화면설계서(SB)
                      </button>

                      <button
                        onClick={() => setPillar1SubTab('ui')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: pillar1SubTab === 'ui' ? 700 : 500,
                          background: pillar1SubTab === 'ui' ? '#eff6ff' : '#f8fafc',
                          color: pillar1SubTab === 'ui' ? '#1d4ed8' : '#64748b',
                          border: pillar1SubTab === 'ui' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Palette size={13} /> 2. 비주얼 UI 디자인
                      </button>

                      <button
                        onClick={() => setPillar1SubTab('pub')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: pillar1SubTab === 'pub' ? 700 : 500,
                          background: pillar1SubTab === 'pub' ? '#eff6ff' : '#f8fafc',
                          color: pillar1SubTab === 'pub' ? '#1d4ed8' : '#64748b',
                          border: pillar1SubTab === 'pub' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Monitor size={13} /> 3. 반응형 웹 퍼블리싱
                      </button>
                    </div>
                  </div>

                  {/* 서브탭 상세 컨텐츠 */}
                  {pillar1SubTab === 'sb' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                        📋 피그마(Figma) 표준 화면설계서(Storyboard) 작성 규격
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                        시선닷컴 개편의 모든 화면은 디바이스별 반응형 와이어프레임과 함께 상세 정책 번호(Policy Code), 예외 케이스(품절/네트워크 에러/마일리지 한도 초과 등)를 명확히 문서화합니다.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• IA 및 유저 플로우:</strong> 고객 탐색 ➔ 결제 전환 경로 30% 단축
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• 정책 명세(Description):</strong> 결제 PG/쿠폰 복합 결제 룰 상세 정의
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• 컴포넌트 규격화:</strong> 버튼, 뱃지, 모달 표준 컴포넌트 100% 매핑
                        </div>
                      </div>
                    </div>
                  )}

                  {pillar1SubTab === 'ui' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                        🎨 미샤(MICHAA) · 잇미샤 · E.B.M 고유의 프리미엄 비주얼 디자인
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                        프리미엄 패션 브랜드의 감성을 극대화하기 위해 여백의 미학(Negative Space), 섬세한 타이포그래피 계층, 고해상도 화보 최적화 뷰어를 제공합니다.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• 브랜드 테마 시스템:</strong> 미샤(클래식 모던), 잇미샤(영 페미닌)
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• 룩북 인터랙티브 뷰:</strong> 화보 내 착장 상품 태깅 팝업
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                          <strong>• 다크/라이트 대비:</strong> 패션 컬러 왜곡 없는 고품질 색상 재현
                        </div>
                      </div>
                    </div>
                  )}

                  {pillar1SubTab === 'pub' && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                        💻 모바일 앱 & PC 크로스 브라우징 반응형 퍼블리싱
                      </div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                        모든 화면은 W3C 웹 표준을 준수하며 모바일 웹, PC 브라우저, iOS/안드로이드 웹뷰 어디서든 버벅임 없는 60fps 마이크로 인터랙션을 보장합니다.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Smartphone size={15} color="#2563eb" /> 모바일 퍼스트 최적화 퍼블리싱
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={15} color="#059669" /> WebP/AVIF 이미지 레이지 로딩
                        </div>
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={15} color="#7c3aed" /> 웹 접근성 및 SEO 메타태그 완비
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activePillar === 1 && (
                /* Pillar 2: 어드민 효율화 Before vs After 인터랙티브 비교 위젯 */
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="#059669" />
                      <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>
                        어드민(백오피스) 운영 효율화: AS-IS vs TO-BE 인터랙티브 비교
                      </strong>
                    </div>

                    {/* 비교 모드 전환 토글 스위치 */}
                    <div
                      style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: '3px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <button
                        onClick={() => setAdminComparisonMode('before')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: adminComparisonMode === 'before' ? 700 : 500,
                          background: adminComparisonMode === 'before' ? '#ffffff' : 'transparent',
                          color: adminComparisonMode === 'before' ? '#ef4444' : '#64748b',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: adminComparisonMode === 'before' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        과거 방식 (AS-IS)
                      </button>
                      <button
                        onClick={() => setAdminComparisonMode('after')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: adminComparisonMode === 'after' ? 700 : 500,
                          background: adminComparisonMode === 'after' ? '#059669' : 'transparent',
                          color: adminComparisonMode === 'after' ? '#ffffff' : '#64748b',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: adminComparisonMode === 'after' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ✨ 기획팀 개선안 (TO-BE)
                      </button>
                    </div>
                  </div>

                  {adminComparisonMode === 'before' ? (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '16px',
                        borderRadius: '8px',
                        animation: 'fadeIn 0.2s ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 700, marginBottom: '8px' }}>
                        <span>⚠️ 기존 어드민의 비효율 및 작업 병목 (개선 전)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '12.5px', color: '#7f1d1d' }}>
                          <strong>• 상품 등록 소요:</strong> 100개 기준 약 3.5~4시간 (건별 수기 등록 및 엑셀 에러 잦음)
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '12.5px', color: '#7f1d1d' }}>
                          <strong>• 기획전 세팅:</strong> 상품 일괄 추가 시 페이징 렉, 시작 시간 수동 배포 대기
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '12.5px', color: '#7f1d1d' }}>
                          <strong>• 오류 검증 불가:</strong> 등록 버튼 누른 후 뒤늦게 옵션 불일치 팝업 발생
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '16px',
                        borderRadius: '8px',
                        animation: 'fadeIn 0.2s ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
                        <span>🚀 서비스기획팀 개선 후: 운영 공수 93% 단축 혁신</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12.5px', color: '#14532d' }}>
                          <strong>• 상품 등록 소요:</strong> 스마트 일괄 파싱으로 <strong style={{ color: '#059669' }}>15분 내 완료 (93% 절감)</strong>
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12.5px', color: '#14532d' }}>
                          <strong>• 스마트 스케줄러:</strong> 타임세일 자동 온/오프 및 대용량 엑셀 드래그 앤 드롭
                        </div>
                        <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '12.5px', color: '#14532d' }}>
                          <strong>• 실시간 프리뷰:</strong> 업로드 즉시 오류 셀 하이라이트 표시로 재작업 0건화
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activePillar === 2 && (
                /* Pillar 3: 이커머스 정책 & 프로세스 RACI 매트릭스 */
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <BookOpen size={18} color="#7c3aed" />
                    <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>
                      시선인터내셔널 전사 이커머스 3대 핵심 정책 표준서
                    </strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b21a8', marginBottom: '4px' }}>
                        1. 온·오프라인 옴니 멤버십 규정
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        오프라인 백화점/아울렛 매장 포인트와 시선닷컴 온라인 마일리지의 1:1 교차 사용 및 승급 기준 표준화
                      </p>
                    </div>

                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b21a8', marginBottom: '4px' }}>
                        2. 패션 상품 반품/교환 CS 규정
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        프리미엄 패션 특성에 따른 단순 변심 왕복 택배비, 불량 판정 검품 프로세스 및 반품 자동 환불 승인 기준
                      </p>
                    </div>

                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#6b21a8', marginBottom: '4px' }}>
                        3. 6대 부서별 RACI 책임 매트릭스
                      </div>
                      <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                        기획 승인(기획팀) ➔ 상품 세팅(MD) ➔ 비주얼 에셋(MN) ➔ API 연동(정보실) ➔ 홍보(마케팅) R&R 정의
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3단계 파이프라인 프로세스 카드 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px',
                  marginBottom: '20px',
                }}
              >
                {selected.pipelineSteps.map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="interactive-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: selected.color, marginBottom: '6px' }}>
                      {step.name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* 핵심 기대 지표 바 */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '13.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                <TrendingUp size={18} color={selected.color} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>핵심 기대 목표 지표:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selected.keyMetrics}</strong>
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
