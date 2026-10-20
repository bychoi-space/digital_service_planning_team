import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

// Scene 1 (기획자 파트) 세부 타임라인 단계
// 0: 좌측에서 걸어나옴 (0.0s ~ 2.2s)
// 1: 멈춰 서서 Mobile & PC 떠올리며 고민 (?) (2.2s ~ 3.8s)
// 2: 유레카(💡)! 말풍선 속 Mobile & PC에 시선닷컴 UI 와이어프레임 스케치 (3.8s ~ 7.6s)
// 3: 스케치 완료 후 우측(디자이너 방향)으로 걸어감 (7.6s ~ 9.4s)
// 4: 두 손으로 기획서 산출물 건네주기 (9.4s ~ 11.5s)
type PlannerSubStep = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS: Record<PlannerSubStep, string> = {
  0: '1단계: 좌측에서 기획자가 총총총 걸어 나옵니다',
  1: '2단계: Mobile과 PC 디바이스 화면 구성을 골똘히 고민합니다 (?)',
  2: '3단계: 유레카(💡)! 말풍선 안의 Mobile·PC 화면에 시선닷컴 UI를 스케치합니다',
  3: '4단계: 완성된 기획서를 들고 우측(디자이너 쪽)으로 걸어갑니다',
  4: '5단계: 디자이너에게 화면설계서(산출물)를 건네줍니다!',
};

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  // 0 ~ 115 틱 (1틱 = 100ms, 총 11.5초 루프)
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 115);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // 현재 서브 단계 계산
  const subStep: PlannerSubStep =
    tick < 22 ? 0 : tick < 38 ? 1 : tick < 76 ? 2 : tick < 94 ? 3 : 4;

  // 기획자 X 좌표 (%) 계산 (스케치와 동일하게 좌측 등장 -> 좌측 자리 정지 -> 중앙으로 이동)
  const getPlannerLeftPercent = (): number => {
    if (tick < 22) {
      // -6% 에서 14% 까지 부드럽게 걸어 나옴
      const progress = tick / 22;
      return -6 + progress * 20;
    }
    if (tick < 76) {
      // 14% 위치에 서서 고민 & 스케치
      return 14;
    }
    if (tick < 94) {
      // 14% 에서 36% (디자이너가 올라올 중앙 자리 왼쪽)까지 걸어감
      const progress = (tick - 76) / 18;
      return 14 + progress * 22;
    }
    // 36% 위치에서 산출물 전달 포즈
    return 36;
  };

  const plannerLeft = getPlannerLeftPercent();
  const isWalking = subStep === 0 || subStep === 3;

  // 걷기 사이클 인덱스 (0 -> 1 -> 2 -> 1 반복으로 자연스러운 4박자 걸음걸이)
  const walkCycleOrder = [0, 1, 2, 1];
  const walkFrameIdx = walkCycleOrder[Math.floor(tick / 2) % 4];

  // 걸을 때 발걸음에 맞춘 자연스러운 상하 바운스 (총총걸음 효과)
  const walkBounceY = isWalking ? (Math.floor(tick / 2) % 2 === 0 ? -5 : 0) : 0;

  // 스케치 진행률 (0 ~ 100%)
  const sketchProgress =
    tick < 38 ? 0 : tick < 76 ? Math.min(100, Math.round(((tick - 38) / 32) * 100)) : 100;

  // 말풍선 노출 여부 (고민 시작할 때 퐁! 하고 등장)
  const showBubble = tick >= 20;

  // 말풍선 꼬리 X 위치 (기획자 머리 위를 자연스럽게 따라감)
  const bubbleTailLeft = Math.min(42, Math.max(16, plannerLeft + 4));

  // GitHub Pages 호환 이미지 경로 헬퍼
  const baseUrl = import.meta.env.BASE_URL || './';
  const charImgUrl = (fileName: string) =>
    `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}images/characters/${fileName}`;

  // 현재 활성화할 스프라이트 키 결정
  // walk-1, walk-2, walk-3는 원본이 좌측 반측면이므로 우측으로 걸어갈 때 scaleX(-1)로 방향 맞춤
  const activeSprite: 'walk1' | 'walk2' | 'walk3' | 'think' | 'sketch' | 'handoff' = isWalking
    ? walkFrameIdx === 0
      ? 'walk1'
      : walkFrameIdx === 1
      ? 'walk2'
      : 'walk3'
    : subStep === 1
    ? 'think'
    : subStep === 2
    ? tick % 6 === 0
      ? 'think'
      : 'sketch' // 스케치 중 살짝살짝 움직이는 생동감
    : 'handoff';

  const flipRight = activeSprite === 'walk1' || activeSprite === 'walk2' || activeSprite === 'walk3';

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '24px',
        border: '2px solid #e2e8f0',
        boxShadow: '0 16px 40px -12px rgba(15, 23, 42, 0.08)',
        padding: '24px 28px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 상단 미니 컨트롤 바 (현재 제작 단계 안내 및 재생/구간 이동 컨트롤) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '4px 11px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <Sparkles size={13} /> SCENE 01 · 기획자 파트 애니메이션
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
            {STEP_LABELS[subStep]}
          </span>
        </div>

        {/* 단계별 바로보기 & 재생 컨트롤 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: isPlaying ? '#0f172a' : '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? '일시정지' : '재생'}
          </button>

          <button
            onClick={() => {
              setTick(0);
              setIsPlaying(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> 처음부터
          </button>

          {[
            { label: '① 걸어나옴', t: 2 },
            { label: '② 고민(?)', t: 25 },
            { label: '③ UI 스케치(💡)', t: 45 },
            { label: '④ 우측 이동', t: 78 },
            { label: '⑤ 산출물 전달', t: 96 },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => setTick(btn.t)}
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background:
                  (btn.t === 2 && subStep === 0) ||
                  (btn.t === 25 && subStep === 1) ||
                  (btn.t === 45 && subStep === 2) ||
                  (btn.t === 78 && subStep === 3) ||
                  (btn.t === 96 && subStep === 4)
                    ? '#dbeafe'
                    : '#ffffff',
                color: '#1e3a8a',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* =======================================================================
          메인 애니메이션 무대 (사용자 스케치 레이아웃 100% 반영)
          - 상단: 파란색 대형 말풍선 (좌측 세로 Mobile 화면 + 우측 가로 PC 화면)
          - 하단: 흰색 무대 위를 실제로 발을 움직여 걸어 다니는 2등신 캐릭터
         ======================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '980px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* 1. 상단 대형 말풍선 영역 (좌측 Mobile + 우측 PC) */}
        <div
          style={{
            position: 'relative',
            background: '#4a7cc7',
            border: '3px solid #2b5494',
            borderRadius: '38px',
            padding: '22px 26px',
            minHeight: '330px',
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: '22px',
            boxShadow: '0 12px 28px rgba(43, 84, 148, 0.18)',
            opacity: showBubble ? 1 : 0.15,
            transform: showBubble ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* ---------------- 좌측 세로 창: Mobile 디바이스 화면 ---------------- */}
          <div
            style={{
              background: '#ffffff',
              border: '3px solid #2b5494',
              borderRadius: '26px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 모바일 상단 스피커 노치 */}
            <div
              style={{
                width: '48px',
                height: '5px',
                background: '#cbd5e1',
                borderRadius: '999px',
                margin: '0 auto 10px',
              }}
            />

            {/* 고민 단계(subStep === 1)일 때: 빈 화면에 모바일 아이콘이 떠오름 */}
            {subStep < 2 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '28px' }}>📱</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Mobile 화면</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center' }}>
                  어떻게 설계하면 모바일에서
                  <br />
                  쇼핑하기 편할까? 🤔
                </div>
              </div>
            ) : (
              /* 스케치 단계(subStep >= 2): 시선닷컴 모바일 UI 와이어프레임이 손그림으로 그려짐! */
              <svg viewBox="0 0 200 260" width="100%" height="100%">
                {/* 1) 모바일 상단 GNB 헤더 스케치 (진행률 10% 이상) */}
                <g
                  style={{
                    opacity: sketchProgress >= 10 ? 1 : 0,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <rect
                    x="4"
                    y="2"
                    width="192"
                    height="24"
                    rx="4"
                    fill="#f8fafc"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <line x1="12" y1="10" x2="24" y2="10" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="14" x2="24" y2="14" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="20" y2="18" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <text x="100" y="18" fontSize="11" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                    SISUN.COM
                  </text>
                  <circle cx="182" cy="14" r="5" fill="none" stroke="#334155" strokeWidth="1.8" />
                </g>

                {/* 2) 모바일 메인 룩북 배너 와이어프레임 (진행률 30% 이상) */}
                <g
                  style={{
                    opacity: sketchProgress >= 30 ? 1 : 0,
                    transition: 'opacity 0.35s',
                  }}
                >
                  <rect
                    x="4"
                    y="34"
                    width="192"
                    height="92"
                    rx="6"
                    fill="#eff6ff"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <line x1="4" y1="34" x2="196" y2="126" stroke="#93c5fd" strokeWidth="1.5" />
                  <line x1="196" y1="34" x2="4" y2="126" stroke="#93c5fd" strokeWidth="1.5" />
                  <rect x="42" y="66" width="116" height="26" rx="5" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                  <text x="100" y="83" fontSize="9.5" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">
                    모바일 풀스크린 룩북
                  </text>
                </g>

                {/* 3) 모바일 2단 상품 그리드 스케치 (진행률 60% 이상) */}
                <g
                  style={{
                    opacity: sketchProgress >= 60 ? 1 : 0,
                    transition: 'opacity 0.35s',
                  }}
                >
                  <rect x="4" y="136" width="91" height="72" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" />
                  <line x1="4" y1="136" x2="95" y2="188" stroke="#cbd5e1" strokeWidth="1.2" />
                  <line x1="12" y1="195" x2="68" y2="195" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="202" x2="48" y2="202" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

                  <rect x="105" y="136" width="91" height="72" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" />
                  <line x1="105" y1="136" x2="196" y2="188" stroke="#cbd5e1" strokeWidth="1.2" />
                  <line x1="113" y1="195" x2="169" y2="195" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                  <line x1="113" y1="202" x2="149" y2="202" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* 4) 모바일 하단 원클릭 구매 탭바 & 기획 포인트 (진행률 85% 이상) */}
                <g
                  style={{
                    opacity: sketchProgress >= 85 ? 1 : 0,
                    transition: 'opacity 0.35s',
                  }}
                >
                  <rect x="4" y="218" width="192" height="34" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                  <text x="100" y="239" fontSize="10" fontWeight="bold" fill="#1e3a8a" textAnchor="middle">
                    ✓ 엄지손가락 원클릭 구매 동선
                  </text>
                </g>
              </svg>
            )}
          </div>

          {/* ---------------- 우측 가로 창: PC 와이드 디바이스 화면 ---------------- */}
          <div
            style={{
              background: '#ffffff',
              border: '3px solid #2b5494',
              borderRadius: '26px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* PC 브라우저 상단 주소창 바 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingBottom: '10px',
                marginBottom: '10px',
                borderBottom: '2px solid #f1f5f9',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
              <div
                style={{
                  marginLeft: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '2px 12px',
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: 600,
                }}
              >
                https://www.sisun.com — PC 화면설계서 (Wireframe)
              </div>
            </div>

            {subStep < 2 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '32px' }}>🖥️</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>PC 와이드 화면</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                  넓은 PC 모니터에서는 브랜드 화보와 상품을 어떻게 배치할까? 🤔
                </div>
              </div>
            ) : (
              /* 스케치 단계(subStep >= 2): 시선닷컴 PC 와이드 화면설계서가 단계별로 스케치됨 */
              <svg viewBox="0 0 540 230" width="100%" height="100%">
                {/* 1) PC GNB 네비게이션 스케치 (진행률 15% 이상) */}
                <g style={{ opacity: sketchProgress >= 15 ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <rect x="4" y="2" width="532" height="28" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
                  <text x="24" y="20" fontSize="12" fontWeight="bold" fill="#0f172a">
                    SISUN.COM
                  </text>
                  <text x="145" y="20" fontSize="10" fontWeight="bold" fill="#475569">
                    MICHAA &nbsp;&nbsp;|&nbsp;&nbsp; it MICHAA &nbsp;&nbsp;|&nbsp;&nbsp; E.B.M &nbsp;&nbsp;|&nbsp;&nbsp; LOOKBOOK &nbsp;&nbsp;|&nbsp;&nbsp; CURATION
                  </text>
                </g>

                {/* 2) PC 와이드 분할 히어로 배너 스케치 (진행률 40% 이상) */}
                <g style={{ opacity: sketchProgress >= 40 ? 1 : 0, transition: 'opacity 0.35s' }}>
                  {/* 좌측 메인 화보 영역 */}
                  <rect
                    x="4"
                    y="38"
                    width="336"
                    height="102"
                    rx="6"
                    fill="#eff6ff"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                  />
                  <line x1="4" y1="38" x2="340" y2="140" stroke="#93c5fd" strokeWidth="1.5" />
                  <line x1="340" y1="38" x2="4" y2="140" stroke="#93c5fd" strokeWidth="1.5" />
                  <rect x="92" y="73" width="160" height="30" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.8" />
                  <text x="172" y="92" fontSize="11" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">
                    PC 와이드 브랜드 화보 배너
                  </text>

                  {/* 우측 개인화 추천 큐레이션 박스 */}
                  <rect
                    x="350"
                    y="38"
                    width="186"
                    height="102"
                    rx="6"
                    fill="#f8fafc"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  <text x="443" y="62" fontSize="10.5" fontWeight="bold" fill="#334155" textAnchor="middle">
                    [기획] AI 맞춤 코디 추천 영역
                  </text>
                  <rect x="366" y="72" width="70" height="54" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="448" y="72" width="70" height="54" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                </g>

                {/* 3) PC 하단 4단 상품 리스트 그리드 & 동선 화살표 (진행률 75% 이상) */}
                <g style={{ opacity: sketchProgress >= 75 ? 1 : 0, transition: 'opacity 0.35s' }}>
                  {[0, 1, 2, 3].map((idx) => {
                    const xPos = 4 + idx * 135;
                    return (
                      <g key={idx}>
                        <rect
                          x={xPos}
                          y="150"
                          width="126"
                          height="74"
                          rx="5"
                          fill="#f8fafc"
                          stroke="#475569"
                          strokeWidth="1.8"
                        />
                        <line x1={xPos} y1="150" x2={xPos + 126} y2="198" stroke="#cbd5e1" strokeWidth="1.2" />
                        <text x={xPos + 63} y="180" fontSize="9.5" fill="#64748b" textAnchor="middle" fontWeight="bold">
                          상품 카드 0{idx + 1}
                        </text>
                        <line
                          x1={xPos + 12}
                          y1="210"
                          x2={xPos + 88}
                          y2="210"
                          stroke="#334155"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}

                  {/* 스케치 펜슬 커서 & 기획 완료 스탬프 */}
                  <g
                    style={{
                      transform: `translate(${Math.min(420, sketchProgress * 4.2)}px, 0px)`,
                      transition: 'transform 0.15s linear',
                    }}
                  >
                    <circle cx="45" cy="135" r="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                    <text x="45" y="139" fontSize="12" textAnchor="middle">
                      ✏️
                    </text>
                  </g>
                </g>
              </svg>
            )}
          </div>

          {/* 말풍선 하단 삼각형 꼬리 (기획자가 걸어가는 위치를 따라 이동) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-24px',
              left: `${bubbleTailLeft}%`,
              width: 0,
              height: 0,
              borderLeft: '18px solid transparent',
              borderRight: '28px solid transparent',
              borderTop: '24px solid #2b5494',
              transition: 'left 0.15s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-19px',
              left: `calc(${bubbleTailLeft}% + 3px)`,
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '24px solid transparent',
              borderTop: '21px solid #4a7cc7',
              transition: 'left 0.15s linear',
            }}
          />
        </div>

        {/* 2. 하단 캐릭터 워킹 & 바통 터치 무대 (깨끗한 화이트 바닥) */}
        <div
          style={{
            position: 'relative',
            height: '235px',
            background: '#ffffff',
            marginTop: '10px',
          }}
        >
          {/* 바닥 가이드 라인 (은은한 점선) */}
          <div
            style={{
              position: 'absolute',
              bottom: '22px',
              left: '5%',
              right: '5%',
              height: '2px',
              background: 'repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 16px)',
            }}
          />

          {/* 좌측 등장 화살표 안내 (스케치의 파란색 화살표 반영) */}
          <div
            style={{
              position: 'absolute',
              left: '10px',
              bottom: '85px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: subStep === 0 ? 1 : 0.35,
              transition: 'opacity 0.3s',
            }}
          >
            <div
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '5px 10px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(59,130,246,0.25)',
              }}
            >
              기획자 등장 ➔
            </div>
          </div>

          {/* ---------------- 주인공 1: 서비스기획자 (6개 프레임 무깜빡임 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: `${plannerLeft}%`,
              width: '185px',
              height: '210px',
              transform: `translateY(${walkBounceY}px)`,
              transition: 'left 0.1s linear, transform 0.1s ease-in-out',
              zIndex: 5,
            }}
          >
            {/* 6개의 스프라이트 프레임을 미리 겹쳐 렌더링하고 opacity만 즉시 전환하여 깜빡임 제로 보장 */}
            {[
              { key: 'walk1', file: 'planner-walk-1.jpg', flip: true },
              { key: 'walk2', file: 'planner-walk-2.jpg', flip: true },
              { key: 'walk3', file: 'planner-walk-3.jpg', flip: true },
              { key: 'think', file: 'planner-think.jpg', flip: false },
              { key: 'sketch', file: 'planner-sketch.jpg', flip: false },
              { key: 'handoff', file: 'planner-handoff.jpg', flip: false },
            ].map((sprite) => {
              const isCurrent = activeSprite === sprite.key;
              return (
                <img
                  key={sprite.key}
                  src={charImgUrl(sprite.file)}
                  alt={`기획자 ${sprite.key}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: isCurrent ? 1 : 0,
                    transform: sprite.flip && flipRight ? 'scaleX(-1)' : 'none',
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            {/* 캐릭터 하단 이름표 */}
            <div
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1e3a8a',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(30,58,138,0.25)',
              }}
            >
              1. 서비스기획자
            </div>
          </div>

          {/* 다음 단계(디자이너 & 퍼블리셔) 등장 예정 위치 가이드 표시 */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              left: '52%',
              transform: 'translateX(-50%)',
              border: subStep === 4 ? '2px dashed #10b981' : '1.5px dashed #cbd5e1',
              background: subStep === 4 ? '#ecfdf5' : '#f8fafc',
              borderRadius: '16px',
              padding: '12px 18px',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: subStep === 4 ? '#059669' : '#94a3b8' }}>
              ⬆️ 다음 Step 2: 여기서 디자이너가 걸어 올라와
            </div>
            <div style={{ fontSize: '11px', color: subStep === 4 ? '#047857' : '#94a3b8', marginTop: '2px' }}>
              기획자가 건네준 설계도를 받아 Figma 디자인을 시작합니다!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
