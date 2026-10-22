import { useState } from 'react';
import { TEAM_GUIDE_DATA } from '../constants/teamGuide';
import { SisunRenewalStoryStage } from './SisunRenewalStoryStage';
import {
  Compass,
  Layers,
} from 'lucide-react';

export function OverviewView() {
  // 3대 핵심 업무 탭 상태 (0: UI/UX개편, 1: 어드민효율화, 2: 이커머스정책)
  const [activePillar, setActivePillar] = useState<number>(0);

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
    </div>
  );
}
