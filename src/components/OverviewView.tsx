import { useState } from 'react';
import { TEAM_GUIDE_DATA } from '../services/mockData';
import { COMPANY_DEPARTMENTS } from '../constants/departments';
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
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateToTasks: () => void;
}

export function OverviewView({ onNavigateToTasks }: OverviewViewProps) {
  // 3대 핵심 업무 탭 상태
  const [activePillar, setActivePillar] = useState<number>(0);

  // 6대 부서별 협업 가이드 탭 상태
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-online-mn');

  // 3대 핵심 업무 상세 데이터
  const PILLARS_DATA = [
    {
      id: 0,
      badge: 'PILLAR 01',
      title: '시선닷컴 (sisun.com) UI/UX 전면 개편',
      subtitle: '기획서(화면설계/SB) 작성 · 프리미엄 UI 디자인 · 반응형 퍼블리싱 총괄',
      color: '#2563eb',
      bgGradient: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.02) 100%)',
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
      bgGradient: 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(5,150,105,0.02) 100%)',
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
      bgGradient: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(124,58,237,0.02) 100%)',
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

  // 6대 부서별 맞춤 협업 가이드 상세
  const DEPT_COLLAB_INFO: Record<
    string,
    { roleTitle: string; cooperationPoints: string[]; mainContact: string; guideTip: string }
  > = {
    'dept-online-mn': {
      roleTitle: 'MI/MO/EBM 온라인MN팀 협업 가이드',
      cooperationPoints: [
        '브랜드별(MICHAA, it MICHAA, E.B.M) 신규 룩북 및 시즌 메인 비주얼 배너 개편 협의',
        '온라인 전용 프로모션 페이지 레이아웃 및 팝업 정책 기획 지원',
        '모바일 앱 푸시 및 브랜드 스토리텔링 전용 콘텐츠 화면설계 지원',
      ],
      mainContact: '서비스기획팀 UI/UX 기획 파트 (잔디/슬랙: #sisun-service-planning)',
      guideTip: '신규 시즌 런칭 최소 3주 전 요구사항을 접수해 주시면 화면설계와 퍼블리싱이 원활히 진행됩니다.',
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
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* 1. 히어로 비주얼 배너 (시선인터내셔널 프리미엄 비전) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '840px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#93c5fd',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} /> SISUN INTERNATIONAL · SERVICE PLANNING TEAM
          </div>

          <h1
            style={{
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.6px',
              lineHeight: 1.35,
              marginBottom: '14px',
            }}
          >
            {TEAM_GUIDE_DATA.vision}
          </h1>

          <p style={{ fontSize: '15px', color: '#e0e7ff', lineHeight: 1.6, marginBottom: '28px' }}>
            {TEAM_GUIDE_DATA.mission}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateToTasks}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1d4ed8',
                fontWeight: 700,
                padding: '11px 22px',
                fontSize: '14px',
              }}
            >
              현재 진행 업무(Tasks) 현황 보기 <ArrowRight size={16} />
            </button>
            <a
              href="https://sisun.com"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '11px 20px',
                fontSize: '14px',
              }}
            >
              <ShoppingBag size={16} /> 시선닷컴 (sisun.com) 공식몰 방문 <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* 2. 3대 중점 영역 인터랙티브 탭/카드 (벤치마크 모션 적용) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="#2563eb" />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>서비스기획팀 3대 집중 추진 영역</h2>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            * 각 카드를 클릭하면 상세 추진 파이프라인을 확인하실 수 있습니다.
          </span>
        </div>

        {/* 3대 영역 탭 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '18px' }}>
          {PILLARS_DATA.map((pillar) => {
            const isSelected = activePillar === pillar.id;
            return (
              <div
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id)}
                style={{
                  background: isSelected ? '#ffffff' : '#ffffff',
                  border: isSelected ? `2px solid ${pillar.color}` : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? `0 10px 25px -5px ${pillar.color}35`
                    : 'var(--shadow-sm)',
                  transform: isSelected ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: pillar.color,
                      letterSpacing: '0.8px',
                      padding: '3px 8px',
                      background: `${pillar.color}15`,
                      borderRadius: '4px',
                    }}
                  >
                    {pillar.badge}
                  </span>
                  {pillar.icon}
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
                    fontSize: '12px',
                    fontWeight: 600,
                    color: pillar.color,
                  }}
                >
                  <span>{isSelected ? '상세 프로세스 보기 활성화됨' : '클릭하여 상세 보기'}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 영역의 세부 파이프라인 쇼케이스 패널 */}
        {(() => {
          const selected = PILLARS_DATA[activePillar];
          return (
            <div
              className="card"
              style={{
                padding: '28px 32px',
                background: selected.bgGradient,
                border: `1px solid ${selected.borderColor}`,
                boxShadow: 'var(--shadow-md)',
                animation: 'fadeIn 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: selected.color, textTransform: 'uppercase' }}>
                  {selected.badge} 상세 추진 전략
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '10px' }}>
                {selected.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                {selected.description}
              </p>

              {/* 3단계 파이프라인 프로세스 카드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                {selected.pipelineSteps.map((step, sIdx) => (
                  <div
                    key={sIdx}
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
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                }}
              >
                <TrendingUp size={16} color={selected.color} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>핵심 기대 목표:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selected.keyMetrics}</strong>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. 5단계 서비스기획 협업 프로세스 가이드 */}
      <div id="process-guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Compass size={22} color="#2563eb" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>시선닷컴 5단계 기획 & 릴리즈 스프린트</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            (유관부서 요구사항 인입부터 화면설계, 퍼블리싱, 어드민 연동, 릴리즈까지)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {TEAM_GUIDE_DATA.processSteps.map((step) => (
            <div
              key={step.step}
              className="card"
              style={{
                padding: '22px 18px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                  }}
                >
                  {step.step}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                  {step.subtitle}
                </span>
              </div>

              <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {step.title}
              </h4>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {step.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  주요 산출물:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {step.deliverables.map((deliv, dIdx) => (
                    <li key={dIdx} style={{ fontSize: '11.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={12} color="#10b981" /> {deliv}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 6대 사내 부서별 맞춤 협업 가이드 (인터랙티브 탭) */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Laptop size={22} color="#2563eb" />
          <h2 style={{ fontSize: '19px', fontWeight: 800 }}>사내 6대 유관부서별 맞춤 협업 가이드</h2>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          소속 부서 버튼을 클릭하시면, 서비스기획팀과 협업할 수 있는 주요 포인트와 가이드를 확인하실 수 있습니다.
        </p>

        {/* 부서 선택 버튼 바 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {COMPANY_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDeptId === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#475569',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {dept.name} {dept.isPlanningTeam && '⭐'}
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
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '22px',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                {collab.roleTitle}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {collab.cooperationPoints.map((pt, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#334155' }}>
                    <CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <strong>소통 및 요청 채널:</strong> {collab.mainContact}
                </div>
                <div style={{ fontSize: '12.5px', color: '#1e40af', background: '#dbeafe', padding: '6px 12px', borderRadius: '4px', fontWeight: 500 }}>
                  💡 <strong>Tip:</strong> {collab.guideTip}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. 공식 협업 창구 & 팀원 명단 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* 공식 협업 창구 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>공식 기획 문의 & 회의체</h3>
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

        {/* 서비스기획팀 팀원 R&R */}
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
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                기획
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>
                  시선인터내셔널 서비스기획팀
                </div>
                <div style={{ fontSize: '12px', color: '#15803d' }}>
                  시선닷컴 UI/UX 화면설계 · 비주얼 디자인 · 퍼블리싱 · 어드민 효율화 · 이커머스 정책
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, padding: '4px' }}>
              * 담당 기획자별 개별 연락은 사내 메신저(잔디) 또는 상단 기획 문의 채널을 통해 신속하게 답변해 드립니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
