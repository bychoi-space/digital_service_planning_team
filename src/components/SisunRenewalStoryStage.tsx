import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Palette, Code2 } from 'lucide-react';

// 상단 말풍선(Mobile & PC 화면) 프리뷰 모드
type ScreenStageMode = 'auto' | 'wireframe' | 'design' | 'publishing';

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [screenMode, setScreenMode] = useState<ScreenStageMode>('auto');
  // 1서브틱 = 50ms (20fps 고주사율 애니메이션 타이머)
  // 기존 100ms(10fps) 대비 2배 세밀한 시간 해상도로 캐릭터의 이동·보폭·손동작·호흡을 부드럽게 보간
  const [subTick, setSubTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setSubTick((prev) => (prev + 1) % 2400);
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // 기존 타임라인 호환용 연속 틱 (0.0, 0.5, 1.0, 1.5 ...)
  const tick = subTick / 2;

  // 부드러운 가감속(Ease-In-Out Sine) 이동 보간 헬퍼
  const easeInOut = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    return -(Math.cos(Math.PI * clamped) - 1) / 2;
  };

  // 8박자 세밀 보행 사이클 (6종의 세분화된 워킹 서브프레임을 왕복·순환하여 끊김 없는 발걸음 연출)
  const walkSubCycle = [
    'walk-s1',
    'walk-s2',
    'walk-s3',
    'walk-s4',
    'walk-s5',
    'walk-s6',
    'walk-s4',
    'walk-s2',
  ] as const;

  const getWalkSubSprite = (st: number, offset: number) =>
    walkSubCycle[Math.floor((st + offset) / 2) % walkSubCycle.length];

  // 6프레임 연속 업무 사이클 (1->2->3->4->5->6->4->2 부드러운 루프)
  const workLoopOrder = [1, 2, 3, 4, 5, 6, 4, 2] as const;
  const getWorkSubFrame = (st: number, offset: number) =>
    workLoopOrder[Math.floor((st + offset) / 2) % workLoopOrder.length];

  // 4프레임 연속 인터랙션(고민/수령/전달/완료) 사이클 (1->2->3->4->3->2 부드러운 루프)
  const interactLoopOrder = [1, 2, 3, 4, 3, 2] as const;
  const getInteractSubFrame = (st: number, offset: number) =>
    interactLoopOrder[Math.floor((st + offset) / 2) % interactLoopOrder.length];

  // 연속 사인파 기반 자연스러운 보행 바운스 & 스쿼시-스트레치(Squash & Stretch) 물리 계수
  const getCharacterMotion = (isWalking: boolean, st: number, phaseOffset: number) => {
    if (isWalking) {
      const phase = (st + phaseOffset) * 0.55;
      const bounceY = -Math.abs(Math.sin(phase)) * 6.5; // 0px ~ -6.5px 연속 아치형 발걸음
      const squash = Math.sin(phase * 2) * 0.022;
      const scaleX = 1 - squash * 0.75;
      const scaleY = 1 + squash;
      const rotateDeg = Math.cos(phase) * 1.6;
      const shadowScale = 1 - Math.abs(Math.sin(phase)) * 0.18;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    } else {
      const phase = (st + phaseOffset) * 0.28;
      const bounceY = Math.sin(phase) * 2.0 - 1.5; // 업무 중 살아있는 미세 호흡 리듬
      const squash = Math.sin(phase) * 0.012;
      const scaleX = 1 - squash * 0.65;
      const scaleY = 1 + squash;
      const rotateDeg = Math.sin(phase * 0.7) * 0.9;
      const shadowScale = 1 + Math.sin(phase) * 0.05;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    }
  };

  // =========================================================================
  // 1) 캐릭터 1 · 서비스기획자 (좌측 영역에서 독립 주기 90틱으로 상시 움직임)
  //    - 0 ~ 16: 좌측(8%)에서 중앙 쪽(15%)으로 총총 걸어 이동
  //    - 16 ~ 32: 멈춰 서서 Mobile & PC 화면 구성 골똘히 고민 (?)
  //    - 32 ~ 58: 유레카(💡)! 태블릿에 시선닷컴 와이어프레임 스케치
  //    - 58 ~ 70: 우측(22%)으로 걸어가 디자이너 쪽으로 이동
  //    - 70 ~ 80: 두 손으로 화면설계서(산출물) 전달 포즈
  //    - 80 ~ 90: 다시 좌측(8%) 자리로 총총 걸어 복귀
  // =========================================================================
  const pTick = tick % 90;
  const isPlannerWalking = pTick < 16 || (pTick >= 58 && pTick < 70) || pTick >= 80;
  const plannerMotion = getCharacterMotion(isPlannerWalking, subTick, 0);

  const getPlannerLeft = (): number => {
    if (pTick < 16) return 8 + easeInOut(pTick / 16) * 7; // 8% -> 15%
    if (pTick < 58) return 15;
    if (pTick < 70) return 15 + easeInOut((pTick - 58) / 12) * 7; // 15% -> 22%
    if (pTick < 80) return 22;
    return 22 - easeInOut((pTick - 80) / 10) * 14; // 22% -> 8%
  };

  const plannerLeft = getPlannerLeft();

  const plannerSprite: string = isPlannerWalking
    ? getWalkSubSprite(subTick, 0)
    : pTick < 32
    ? `think-${getInteractSubFrame(subTick, 0)}`
    : pTick < 58
    ? `sketch-${getWorkSubFrame(subTick, 0)}`
    : `handoff-${getInteractSubFrame(subTick, 0)}`;

  // 우측으로 걸어갈 때(0~16, 58~70)는 scaleX(-1)로 우측을 바라봄
  const plannerFlipRight = isPlannerWalking && (pTick < 16 || (pTick >= 58 && pTick < 70));

  const plannerActionLabel =
    pTick < 16
      ? '총총 걸어 이동 중'
      : pTick < 32
      ? 'Mobile·PC UX 고민 중 (?)'
      : pTick < 58
      ? '와이어프레임 스케치 중 (💡)'
      : pTick < 70
      ? '디자이너에게 이동 중'
      : pTick < 80
      ? '화면설계서 전달! 📋'
      : '자리로 이동 중';

  // =========================================================================
  // 2) 캐릭터 2 · UI/UX 디자이너 (중앙 영역에서 독립 주기 90틱으로 동시에 상시 움직임)
  //    - 0 ~ 14: 중앙 좌측(40%)으로 총총 걸어 이동
  //    - 14 ~ 26: 좌측 기획자로부터 화면설계서 두 손으로 수령 (✨)
  //    - 26 ~ 56: 팔레트와 펜툴로 시선닷컴 Figma 고해상도 UI 디자인 작업 (🎨)
  //    - 56 ~ 68: 우측 퍼블리셔 쪽(49%)으로 총총 걸어 이동
  //    - 68 ~ 80: 완성된 컬러 UI 디자인 시안 보드 전달 포즈
  //    - 80 ~ 90: 다시 중앙(44%)으로 총총 걸어 이동
  // =========================================================================
  const dTick = (tick + 22) % 90; // 위상을 다르게 하여 3명이 동시에 다채롭게 움직이도록 구성
  const isDesignerWalking = dTick < 14 || (dTick >= 56 && dTick < 68) || dTick >= 80;
  const designerMotion = getCharacterMotion(isDesignerWalking, subTick, 7);

  const getDesignerLeft = (): number => {
    if (dTick < 14) return 44 - easeInOut(dTick / 14) * 4; // 44% -> 40%
    if (dTick < 56) return 40 + easeInOut((dTick - 14) / 42) * 3; // 40% -> 43%
    if (dTick < 68) return 43 + easeInOut((dTick - 56) / 12) * 6; // 43% -> 49%
    if (dTick < 80) return 49;
    return 49 - easeInOut((dTick - 80) / 10) * 5; // 49% -> 44%
  };

  const designerLeft = getDesignerLeft();

  const designerSprite: string = isDesignerWalking
    ? getWalkSubSprite(subTick, 5)
    : dTick < 26
    ? `receive-${getInteractSubFrame(subTick, 3)}`
    : dTick < 56
    ? `work-${getWorkSubFrame(subTick, 3)}`
    : `handoff-${getInteractSubFrame(subTick, 3)}`;

  // 우측으로 걸어갈 때(56~68) 또는 우측 퍼블리셔에게 디자인 시안을 건넬 때(68~80) 좌우 반전
  const designerFlipRight = dTick >= 56 && dTick < 80;

  const designerActionLabel =
    dTick < 14
      ? '총총 걸어 이동 중'
      : dTick < 26
      ? '화면설계서 수령 완료 ✨'
      : dTick < 56
      ? 'Figma UI 디자인 리뉴얼 중 🎨'
      : dTick < 68
      ? '퍼블리셔에게 이동 중'
      : dTick < 80
      ? 'UI 디자인 시안 전달! 🎨'
      : '중앙으로 이동 중';

  // =========================================================================
  // 3) 캐릭터 3 · 여성 웹 퍼블리셔 (우측 영역에서 독립 주기 90틱으로 동시에 상시 움직임)
  //    - 0 ~ 14: 우측(78%)에서 디자이너 쪽(70%)으로 노트북 들고 총총 걸어옴
  //    - 14 ~ 26: 디자이너가 건넨 컬러 UI 디자인 시안 보드 수령 (✨)
  //    - 26 ~ 60: 노트북으로 HTML5/CSS3 반응형 마크업 코딩 타이핑 (</> { })
  //    - 60 ~ 78: 시선닷컴(sisun.com) 반응형 웹 배포 완료 환호! (<HTML/> 🎉)
  //    - 78 ~ 90: 우측(78%)으로 다시 총총 걸어 이동
  // =========================================================================
  const pubTick = (tick + 48) % 90;
  const isPublisherWalking = pubTick < 14 || pubTick >= 78;
  const publisherMotion = getCharacterMotion(isPublisherWalking, subTick, 13);

  const getPublisherLeft = (): number => {
    if (pubTick < 14) return 78 - easeInOut(pubTick / 14) * 8; // 78% -> 70%
    if (pubTick < 26) return 70 + easeInOut((pubTick - 14) / 12) * 2; // 70% -> 72%
    if (pubTick < 78) return 72;
    return 72 + easeInOut((pubTick - 78) / 12) * 6; // 72% -> 78%
  };

  const publisherLeft = getPublisherLeft();

  const publisherSprite: string = isPublisherWalking
    ? getWalkSubSprite(subTick, 11)
    : pubTick < 26
    ? `receive-${getInteractSubFrame(subTick, 7)}`
    : pubTick < 60
    ? `code-${getWorkSubFrame(subTick, 7)}`
    : `complete-${getInteractSubFrame(subTick, 7)}`;

  // 우측으로 걸어 돌아갈 때(78~90)만 우측 방향으로 반전
  const publisherFlipRight = pubTick >= 78;

  const publisherActionLabel =
    pubTick < 14
      ? '노트북 들고 걸어오는 중'
      : pubTick < 26
      ? '디자인 시안 수령 완료 ✨'
      : pubTick < 60
      ? 'HTML/CSS 반응형 코딩 중 💻'
      : pubTick < 78
      ? '시선닷컴 LIVE 배포 완료! 🎉'
      : '자리로 이동 중';

  // =========================================================================
  // 4) 상단 대형 말풍선 (Mobile & PC 화면) 상태 계산
  //    - 'auto' 모드일 때는 150틱(15초) 주기로 [기획 와이어프레임 ➔ Figma 디자인 ➔ HTML/CSS 코딩 & LIVE] 자연 전환
  //    - 사용자가 상단 버튼을 누르면 해당 화면 모드를 고정해서 볼 수도 있음
  // =========================================================================
  const autoCycleTick = tick % 150;
  const activeStage: 1 | 2 | 3 =
    screenMode === 'wireframe'
      ? 1
      : screenMode === 'design'
      ? 2
      : screenMode === 'publishing'
      ? 3
      : autoCycleTick < 50
      ? 1
      : autoCycleTick < 100
      ? 2
      : 3;

  // 각 단계 내부 진행률 (0 ~ 100%)
  const sketchProgress =
    screenMode === 'wireframe'
      ? 100
      : activeStage === 1
      ? Math.min(100, Math.round((autoCycleTick / 35) * 100))
      : 100;

  const designProgress =
    screenMode === 'design'
      ? 100
      : activeStage === 1
      ? 0
      : activeStage === 2
      ? Math.min(100, Math.round(((autoCycleTick - 50) / 35) * 100))
      : 100;

  const codeProgress =
    screenMode === 'publishing'
      ? 100
      : activeStage < 3
      ? 0
      : Math.min(100, Math.round(((autoCycleTick - 100) / 32) * 100));

  const isCodingOverlayVisible =
    activeStage === 3 && (screenMode === 'publishing' ? tick % 60 < 40 : autoCycleTick < 134);
  const isLiveComplete = activeStage === 3 && !isCodingOverlayVisible;

  // 말풍선 꼬리 위치 (현재 상단 화면 단계의 주인공 위치를 자연스럽게 가리킴)
  const bubbleTailLeft =
    activeStage === 1 ? plannerLeft + 5 : activeStage === 2 ? designerLeft + 5 : publisherLeft + 4;

  const bubbleBgColor = activeStage === 1 ? '#4a7cc7' : activeStage === 2 ? '#3b6db5' : '#5b4bc4';
  const bubbleBorderColor = activeStage === 1 ? '#2b5494' : activeStage === 2 ? '#1e4278' : '#37298a';

  // GitHub Pages 호환 투명 PNG 이미지 경로 헬퍼
  const baseUrl = import.meta.env.BASE_URL || './';
  const charImgUrl = (fileName: string) =>
    `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}images/characters/${fileName}`;

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
      {/* 상단 미니 컨트롤 바 */}
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
              background:
                activeStage === 1 ? '#eff6ff' : activeStage === 2 ? '#ecfdf5' : '#f5f3ff',
              color:
                activeStage === 1 ? '#1d4ed8' : activeStage === 2 ? '#047857' : '#6d28d9',
              border: `1px solid ${
                activeStage === 1 ? '#bfdbfe' : activeStage === 2 ? '#a7f3d0' : '#ddd6fe'
              }`,
              padding: '4px 11px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              transition: 'all 0.3s',
            }}
          >
            {activeStage === 1 ? (
              <Sparkles size={13} />
            ) : activeStage === 2 ? (
              <Palette size={13} />
            ) : (
              <Code2 size={13} />
            )}
            시선닷컴(sisun.com) UI/UX 개편 라이브 무대
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            기획자 · 디자이너 · 퍼블리셔 3인이 동시에 협업하며 Mobile & PC 화면을 완성합니다
          </span>
        </div>

        {/* 재생/일시정지 및 상단 말풍선 화면 모드 선택 버튼 */}
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
              setSubTick(0);
              setScreenMode('auto');
              setIsPlaying(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: screenMode === 'auto' ? '#e2e8f0' : '#f8fafc',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> 자동 순환
          </button>

          {[
            { mode: 'wireframe' as const, label: '① 기획 스케치 화면', color: '#dbeafe', text: '#1e3a8a' },
            { mode: 'design' as const, label: '② Figma 디자인 화면', color: '#d1fae5', text: '#065f46' },
            { mode: 'publishing' as const, label: '③ HTML/CSS 퍼블리싱 화면', color: '#ede9fe', text: '#5b21b6' },
          ].map((btn) => {
            const isSelected = screenMode === btn.mode;
            return (
              <button
                key={btn.mode}
                onClick={() => setScreenMode(btn.mode)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: isSelected ? btn.color : '#ffffff',
                  color: isSelected ? btn.text : '#475569',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          메인 애니메이션 무대
          - 상단: 대형 말풍선 (좌측 세로 Mobile 화면 + 우측 가로 PC 화면)
          - 하단: 투명 PNG 배경의 2등신 캐릭터 3총사가 동시에 각자의 업무 동작을 수행
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
            background: bubbleBgColor,
            border: `3px solid ${bubbleBorderColor}`,
            borderRadius: '38px',
            padding: '22px 26px',
            minHeight: '335px',
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: '22px',
            boxShadow: '0 12px 28px rgba(43, 84, 148, 0.18)',
            transition: 'background 0.4s ease, border-color 0.4s ease',
          }}
        >
          {/* ---------------- 좌측 세로 창: Mobile 디바이스 화면 ---------------- */}
          <div
            style={{
              background: '#ffffff',
              border: `3px solid ${bubbleBorderColor}`,
              borderRadius: '26px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color:
                    activeStage === 1 ? '#1d4ed8' : activeStage === 2 ? '#059669' : '#6d28d9',
                  background:
                    activeStage === 1 ? '#eff6ff' : activeStage === 2 ? '#ecfdf5' : '#f5f3ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {activeStage === 1
                  ? '📐 Mobile Wireframe'
                  : activeStage === 2
                  ? '🎨 Figma · Mobile_UI'
                  : isLiveComplete
                  ? '🟢 LIVE · m.sisun.com'
                  : '💻 HTML/CSS · 390px'}
              </span>
              <div
                style={{
                  width: '36px',
                  height: '4px',
                  background: '#cbd5e1',
                  borderRadius: '999px',
                }}
              />
            </div>

            <svg viewBox="0 0 200 260" width="100%" height="100%">
              <defs>
                <linearGradient id="sisunMobileHeroGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fdf2f8" />
                  <stop offset="50%" stopColor="#fce7f3" />
                  <stop offset="100%" stopColor="#f3e8ff" />
                </linearGradient>
                <linearGradient id="sisunCoatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="100%" stopColor="#fde68a" />
                </linearGradient>
                <linearGradient id="sisunTweedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0e7ff" />
                  <stop offset="100%" stopColor="#c7d2fe" />
                </linearGradient>
              </defs>

              {/* [Layer 1] 기획자가 그린 와이어프레임 스케치 레이어 */}
              <g style={{ opacity: designProgress >= 85 ? 0.12 : 1, transition: 'opacity 0.4s' }}>
                <g style={{ opacity: sketchProgress >= 10 ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <rect x="4" y="2" width="192" height="24" rx="4" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
                  <line x1="12" y1="10" x2="24" y2="10" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="14" x2="24" y2="14" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="18" x2="20" y2="18" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                  <text x="100" y="18" fontSize="11" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                    SISUN.COM
                  </text>
                  <circle cx="182" cy="14" r="5" fill="none" stroke="#334155" strokeWidth="1.8" />
                </g>

                <g style={{ opacity: sketchProgress >= 30 ? 1 : 0, transition: 'opacity 0.35s' }}>
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

                <g style={{ opacity: sketchProgress >= 60 ? 1 : 0, transition: 'opacity 0.35s' }}>
                  <rect x="4" y="136" width="91" height="72" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" />
                  <line x1="4" y1="136" x2="95" y2="188" stroke="#cbd5e1" strokeWidth="1.2" />
                  <rect x="105" y="136" width="91" height="72" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="1.8" />
                  <line x1="105" y1="136" x2="196" y2="188" stroke="#cbd5e1" strokeWidth="1.2" />
                </g>

                <g style={{ opacity: sketchProgress >= 85 ? 1 : 0, transition: 'opacity 0.35s' }}>
                  <rect x="4" y="218" width="192" height="34" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                  <text x="100" y="239" fontSize="10" fontWeight="bold" fill="#1e3a8a" textAnchor="middle">
                    ✓ 엄지손가락 원클릭 구매 동선
                  </text>
                </g>
              </g>

              {/* [Layer 2] 디자이너의 Figma 고해상도 컬러 UI 레이어 */}
              {designProgress > 0 && (
                <g>
                  <g style={{ opacity: designProgress >= 15 ? 1 : 0, transition: 'opacity 0.35s' }}>
                    <rect x="4" y="2" width="192" height="26" rx="6" fill="#0f172a" />
                    <text x="16" y="19" fontSize="10.5" fontWeight="bold" fill="#ffffff" letterSpacing="1.5">
                      SISUN
                    </text>
                    <rect x="78" y="8" width="34" height="14" rx="7" fill="#f43f5e" />
                    <text x="95" y="18" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      26 FW
                    </text>
                    <circle cx="168" cy="15" r="4" fill="none" stroke="#f8fafc" strokeWidth="1.5" />
                    <rect x="179" y="11" width="8" height="8" rx="1.5" fill="none" stroke="#f8fafc" strokeWidth="1.5" />
                  </g>

                  <g style={{ opacity: designProgress >= 40 ? 1 : 0, transition: 'opacity 0.4s' }}>
                    <rect
                      x="4"
                      y="34"
                      width="192"
                      height="94"
                      rx="8"
                      fill="url(#sisunMobileHeroGrad)"
                      stroke={isLiveComplete ? '#8b5cf6' : '#ec4899'}
                      strokeWidth="1.8"
                    />
                    <circle cx="152" cy="64" r="14" fill="#f9a8d4" />
                    <path d="M132 122 C134 86, 170 86, 172 122 Z" fill="#be185d" />
                    <text x="16" y="54" fontSize="8.5" fontWeight="bold" fill="#9d174d">
                      MICHAA · it MICHAA
                    </text>
                    <text x="16" y="72" fontSize="12" fontWeight="bold" fill="#0f172a">
                      TIMELESS
                    </text>
                    <text x="16" y="87" fontSize="12" fontWeight="bold" fill="#be185d">
                      ELEGANCE
                    </text>
                    <rect x="16" y="97" width="76" height="20" rx="10" fill="#0f172a" />
                    <text x="54" y="110" fontSize="8.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      화보 컬렉션 보기 →
                    </text>
                  </g>

                  <g style={{ opacity: designProgress >= 65 ? 1 : 0, transition: 'opacity 0.4s' }}>
                    <rect x="4" y="135" width="91" height="76" rx="7" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                    <rect x="8" y="139" width="83" height="44" rx="5" fill="url(#sisunCoatGrad)" />
                    <text x="50" y="165" fontSize="16" textAnchor="middle">
                      🧥
                    </text>
                    <text x="10" y="195" fontSize="8.5" fontWeight="bold" fill="#1e293b">
                      캐시미어 벨티드 코트
                    </text>
                    <circle cx="14" cy="204" r="3" fill="#d97706" />
                    <circle cx="23" cy="204" r="3" fill="#1e293b" />
                    <text x="88" y="206" fontSize="8" fontWeight="bold" fill="#e11d48" textAnchor="end">
                      ♥ 1.2k
                    </text>

                    <rect x="105" y="135" width="91" height="76" rx="7" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
                    <rect x="109" y="139" width="83" height="44" rx="5" fill="url(#sisunTweedGrad)" />
                    <text x="150" y="165" fontSize="16" textAnchor="middle">
                      👗
                    </text>
                    <text x="111" y="195" fontSize="8.5" fontWeight="bold" fill="#1e293b">
                      시그니처 트위드 셋업
                    </text>
                    <circle cx="115" cy="204" r="3" fill="#6366f1" />
                    <circle cx="124" cy="204" r="3" fill="#f43f5e" />
                    <text x="189" y="206" fontSize="8" fontWeight="bold" fill="#e11d48" textAnchor="end">
                      ♥ 980
                    </text>
                  </g>

                  <g style={{ opacity: designProgress >= 85 ? 1 : 0, transition: 'opacity 0.4s' }}>
                    <rect x="4" y="218" width="192" height="34" rx="10" fill="#0f172a" />
                    <rect x="12" y="224" width="82" height="22" rx="6" fill="#ec4899" />
                    <text x="53" y="238" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      ⚡ AI 사이즈 추천
                    </text>
                    <text x="145" y="238" fontSize="9" fontWeight="bold" fill="#f8fafc" textAnchor="middle">
                      🛍️ 원클릭 구매
                    </text>
                  </g>
                </g>
              )}

              {/* [Layer 3] 퍼블리셔의 HTML/CSS 반응형 코딩 오버레이 */}
              {isCodingOverlayVisible && (
                <g>
                  <rect
                    x="4"
                    y="2"
                    width="192"
                    height="250"
                    rx="6"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  <rect
                    x="8"
                    y="42"
                    width="184"
                    height="138"
                    rx="8"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke="#a78bfa"
                    strokeWidth="1.5"
                  />
                  <text x="16" y="58" fontSize="8" fontWeight="bold" fill="#a78bfa" fontFamily="monospace">
                    {'<!-- mobile_sisun.html -->'}
                  </text>
                  {codeProgress >= 15 && (
                    <text x="16" y="74" fontSize="8.5" fill="#38bdf8" fontFamily="monospace">
                      {'<header class="m-gnb">'}
                    </text>
                  )}
                  {codeProgress >= 30 && (
                    <text x="22" y="88" fontSize="8" fill="#f472b6" fontFamily="monospace">
                      {'<LookbookHero full />'}
                    </text>
                  )}
                  {codeProgress >= 50 && (
                    <text x="16" y="104" fontSize="8" fill="#34d399" fontFamily="monospace">
                      {'@media (max-width:768px){'}
                    </text>
                  )}
                  {codeProgress >= 65 && (
                    <text x="22" y="118" fontSize="8" fill="#fde047" fontFamily="monospace">
                      {'grid-template: 1fr 1fr;'}
                    </text>
                  )}
                  {codeProgress >= 80 && (
                    <text x="22" y="132" fontSize="8" fill="#fde047" fontFamily="monospace">
                      {'touch-action: manipulation;'}
                    </text>
                  )}
                  {codeProgress >= 90 && (
                    <text x="16" y="148" fontSize="8.5" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                      {'✓ Responsive Build 100%'}
                    </text>
                  )}
                  <rect x="16" y="160" width="168" height="6" rx="3" fill="#334155" />
                  <rect
                    x="16"
                    y="160"
                    width={Math.max(8, (168 * codeProgress) / 100)}
                    height="6"
                    rx="3"
                    fill="#a855f7"
                  />
                </g>
              )}

              {isLiveComplete && (
                <g>
                  <rect x="26" y="116" width="148" height="22" rx="11" fill="#6d28d9" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="100" y="130" fontSize="8.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                    ✨ 모바일 반응형 웹 배포 완료!
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* ---------------- 우측 가로 창: PC 와이드 디바이스 화면 ---------------- */}
          <div
            style={{
              background: '#ffffff',
              border: `3px solid ${bubbleBorderColor}`,
              borderRadius: '26px',
              padding: '14px 20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                marginBottom: '8px',
                borderBottom: '2px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34d399' }} />
                <div
                  style={{
                    marginLeft: '8px',
                    background:
                      activeStage === 1 ? '#f8fafc' : activeStage === 2 ? '#ecfdf5' : '#f5f3ff',
                    border: `1px solid ${
                      activeStage === 1 ? '#e2e8f0' : activeStage === 2 ? '#a7f3d0' : '#ddd6fe'
                    }`,
                    borderRadius: '6px',
                    padding: '2px 12px',
                    fontSize: '11px',
                    color:
                      activeStage === 1 ? '#64748b' : activeStage === 2 ? '#047857' : '#6d28d9',
                    fontWeight: 700,
                    transition: 'all 0.3s',
                  }}
                >
                  {activeStage === 1
                    ? 'https://www.sisun.com — PC 화면설계서 (Wireframe)'
                    : activeStage === 2
                    ? '🎨 Figma — SISUN.COM 2026 UI/UX 디자인 리뉴얼 (Design System v2.0)'
                    : isLiveComplete
                    ? '🟢 https://www.sisun.com — 반응형 웹 퍼블리싱 배포 완료 (LIVE)'
                    : '💻 VS Code — index.html · sisun-responsive.css (퍼블리싱 마크업 중...)'}
                </div>
              </div>

              {activeStage === 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>
                    Color Tokens
                  </span>
                  {['#0f172a', '#be185d', '#ec4899', '#10b981', '#f59e0b'].map((hex) => (
                    <span
                      key={hex}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '4px',
                        background: hex,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
              )}

              {activeStage === 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: '#ede9fe',
                      color: '#5b21b6',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {'<HTML5 />'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    ⚡ 웹표준·반응형 {codeProgress}%
                  </span>
                </div>
              )}
            </div>

            <svg viewBox="0 0 540 230" width="100%" height="100%">
              <defs>
                <linearGradient id="pcLookbookGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="55%" stopColor="#831843" />
                  <stop offset="100%" stopColor="#be185d" />
                </linearGradient>
                <linearGradient id="pcCurationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fdf4ff" />
                  <stop offset="100%" stopColor="#fae8ff" />
                </linearGradient>
              </defs>

              {/* [Layer 1] 기획자가 그린 PC 와이어프레임 스케치 레이어 */}
              <g style={{ opacity: designProgress >= 85 ? 0.12 : 1, transition: 'opacity 0.4s' }}>
                <g style={{ opacity: sketchProgress >= 15 ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <rect x="4" y="2" width="532" height="28" rx="5" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
                  <text x="24" y="20" fontSize="12" fontWeight="bold" fill="#0f172a">
                    SISUN.COM
                  </text>
                  <text x="145" y="20" fontSize="10" fontWeight="bold" fill="#475569">
                    MICHAA &nbsp;&nbsp;|&nbsp;&nbsp; it MICHAA &nbsp;&nbsp;|&nbsp;&nbsp; E.B.M &nbsp;&nbsp;|&nbsp;&nbsp; LOOKBOOK &nbsp;&nbsp;|&nbsp;&nbsp; CURATION
                  </text>
                </g>

                <g style={{ opacity: sketchProgress >= 40 ? 1 : 0, transition: 'opacity 0.35s' }}>
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

                  <rect x="350" y="38" width="186" height="102" rx="6" fill="#f8fafc" stroke="#475569" strokeWidth="2" />
                  <text x="443" y="62" fontSize="10.5" fontWeight="bold" fill="#334155" textAnchor="middle">
                    [기획] AI 맞춤 코디 추천 영역
                  </text>
                  <rect x="366" y="72" width="70" height="54" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="448" y="72" width="70" height="54" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                </g>

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
                      </g>
                    );
                  })}

                  {activeStage === 1 && (
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
                  )}
                </g>
              </g>

              {/* [Layer 2] 디자이너의 Figma 고해상도 PC 와이드 리뉴얼 레이어 */}
              {designProgress > 0 && (
                <g>
                  <g style={{ opacity: designProgress >= 15 ? 1 : 0, transition: 'opacity 0.35s' }}>
                    <rect x="4" y="2" width="532" height="28" rx="6" fill="#0f172a" />
                    <text x="22" y="20" fontSize="12" fontWeight="bold" fill="#ffffff" letterSpacing="2">
                      SISUN.COM
                    </text>
                    <text x="145" y="20" fontSize="10" fontWeight="bold" fill="#cbd5e1">
                      MICHAA &nbsp;&nbsp;·&nbsp;&nbsp; it MICHAA &nbsp;&nbsp;·&nbsp;&nbsp; E.B.M &nbsp;&nbsp;·&nbsp;&nbsp; S SOLEZIA &nbsp;&nbsp;·&nbsp;&nbsp; 26 FW LOOKBOOK
                    </text>
                    <rect x="466" y="7" width="58" height="18" rx="9" fill="#ec4899" />
                    <text x="495" y="19" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      LIVE 룩북
                    </text>
                  </g>

                  <g style={{ opacity: designProgress >= 45 ? 1 : 0, transition: 'opacity 0.4s' }}>
                    <rect
                      x="4"
                      y="38"
                      width="336"
                      height="102"
                      rx="8"
                      fill="url(#pcLookbookGrad)"
                      stroke={isLiveComplete ? '#8b5cf6' : '#ec4899'}
                      strokeWidth="1.8"
                    />
                    <circle cx="280" cy="78" r="38" fill="rgba(244, 114, 182, 0.22)" />
                    <circle cx="255" cy="95" r="24" fill="rgba(251, 191, 36, 0.18)" />
                    <text x="26" y="62" fontSize="9.5" fontWeight="bold" fill="#f9a8d4" letterSpacing="1.2">
                      2026 FALL / WINTER CAMPAIGN
                    </text>
                    <text x="26" y="86" fontSize="17" fontWeight="bold" fill="#ffffff">
                      THE NEW ARCHIVE : 시선닷컴 리뉴얼
                    </text>
                    <text x="26" y="104" fontSize="10" fill="#fce7f3">
                      브랜드 정체성을 살린 몰입형 화보와 직관적인 쇼핑 UX의 결합
                    </text>
                    <rect x="26" y="112" width="108" height="20" rx="10" fill="#ffffff" />
                    <text x="80" y="125" fontSize="9" fontWeight="bold" fill="#831843" textAnchor="middle">
                      캠페인 화보 감상하기 →
                    </text>

                    <rect
                      x="350"
                      y="38"
                      width="186"
                      height="102"
                      rx="8"
                      fill="url(#pcCurationGrad)"
                      stroke="#c084fc"
                      strokeWidth="1.8"
                    />
                    <rect x="362" y="47" width="84" height="16" rx="8" fill="#9333ea" />
                    <text x="404" y="58" fontSize="8.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      ✨ AI 스타일 큐레이션
                    </text>
                    <rect x="362" y="69" width="76" height="62" rx="6" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
                    <text x="400" y="94" fontSize="16" textAnchor="middle">
                      🧥+👜
                    </text>
                    <text x="400" y="112" fontSize="8.5" fontWeight="bold" fill="#581c87" textAnchor="middle">
                      #오피스_캐시미어룩
                    </text>
                    <text x="400" y="124" fontSize="8" fontWeight="bold" fill="#9333ea" textAnchor="middle">
                      매칭률 98%
                    </text>

                    <rect x="448" y="69" width="76" height="62" rx="6" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.5" />
                    <text x="486" y="94" fontSize="16" textAnchor="middle">
                      👗+👠
                    </text>
                    <text x="486" y="112" fontSize="8.5" fontWeight="bold" fill="#581c87" textAnchor="middle">
                      #주말_트위드셋업
                    </text>
                    <text x="486" y="124" fontSize="8" fontWeight="bold" fill="#9333ea" textAnchor="middle">
                      매칭률 95%
                    </text>
                  </g>

                  <g style={{ opacity: designProgress >= 75 ? 1 : 0, transition: 'opacity 0.4s' }}>
                    {[
                      { brand: 'MICHAA', name: '핸드메이드 캐시미어 코트', price: '1,290,000', bg: '#fef3c7', icon: '🧥', accent: '#d97706' },
                      { brand: 'it MICHAA', name: '펄 버튼 크롭 트위드 자켓', price: '459,000', bg: '#fce7f3', icon: '👚', accent: '#db2777' },
                      { brand: 'E.B.M', name: '와이드 턱 울 슬랙스 셋업', price: '289,000', bg: '#e0e7ff', icon: '👖', accent: '#4f46e5' },
                      { brand: 'S SOLEZIA', name: '실크 블렌드 플리츠 드레스', price: '529,000', bg: '#d1fae5', icon: '👗', accent: '#059669' },
                    ].map((item, idx) => {
                      const xPos = 4 + idx * 135;
                      return (
                        <g key={item.brand}>
                          <rect
                            x={xPos}
                            y="148"
                            width="126"
                            height="78"
                            rx="7"
                            fill="#ffffff"
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                          />
                          <rect x={xPos + 5} y="153" width="116" height="40" rx="5" fill={item.bg} />
                          <text x={xPos + 63} y="178" fontSize="16" textAnchor="middle">
                            {item.icon}
                          </text>
                          <rect x={xPos + 9} y="157" width="44" height="12" rx="4" fill="#0f172a" />
                          <text x={xPos + 31} y="166" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                            {item.brand}
                          </text>
                          <text x={xPos + 8} y="206" fontSize="8.5" fontWeight="bold" fill="#0f172a">
                            {item.name}
                          </text>
                          <text x={xPos + 8} y="219" fontSize="8.5" fontWeight="bold" fill={item.accent}>
                            ₩{item.price}
                          </text>
                          <text x={xPos + 118} y="219" fontSize="8" fontWeight="bold" fill="#e11d48" textAnchor="end">
                            ♥
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {activeStage === 2 && (
                    <g
                      style={{
                        transform: `translate(${Math.min(410, 40 + designProgress * 3.8)}px, ${
                          designProgress < 50 ? 65 : 155
                        }px)`,
                        transition: 'transform 0.2s ease-out',
                      }}
                    >
                      <rect x="10" y="8" width="92" height="20" rx="10" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="56" y="21" fontSize="9.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        🎨 UI Designer
                      </text>
                      <polygon
                        points="0,0 0,14 5,10 10,16 13,14 8,8 14,8"
                        fill="#059669"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* [Layer 3] 퍼블리셔의 VS Code HTML/CSS 코딩 에디터 오버레이 */}
              {isCodingOverlayVisible && (
                <g>
                  <rect
                    x="185"
                    y="36"
                    width="348"
                    height="186"
                    rx="10"
                    fill="rgba(15, 23, 42, 0.94)"
                    stroke="#a78bfa"
                    strokeWidth="2"
                  />
                  <rect x="185" y="36" width="348" height="24" rx="10" fill="#1e293b" />
                  <text x="200" y="52" fontSize="9" fontWeight="bold" fill="#c4b5fd" fontFamily="monospace">
                    📄 sisun_main_renewal.html &nbsp;|&nbsp; 🎨 responsive_grid.css
                  </text>

                  {codeProgress >= 10 && (
                    <text x="200" y="76" fontSize="9.5" fill="#94a3b8" fontFamily="monospace">
                      {'01  <!DOCTYPE html><html lang="ko">'}
                    </text>
                  )}
                  {codeProgress >= 22 && (
                    <text x="200" y="93" fontSize="9.5" fill="#38bdf8" fontFamily="monospace">
                      {'02  <main class="sisun-2026-renewal-container">'}
                    </text>
                  )}
                  {codeProgress >= 36 && (
                    <text x="200" y="110" fontSize="9.5" fill="#f472b6" fontFamily="monospace">
                      {'03    <section class="hero-lookbook-split" data-aos="fade-up">'}
                    </text>
                  )}
                  {codeProgress >= 50 && (
                    <text x="200" y="127" fontSize="9.5" fill="#fde047" fontFamily="monospace">
                      {'04    <aside class="ai-curation-widget" aria-label="AI 코디 추천">'}
                    </text>
                  )}
                  {codeProgress >= 65 && (
                    <text x="200" y="144" fontSize="9.5" fill="#34d399" fontFamily="monospace">
                      {'05    .product-grid { display: grid; grid-template-columns: repeat(4, 1fr); }'}
                    </text>
                  )}
                  {codeProgress >= 80 && (
                    <text x="200" y="161" fontSize="9.5" fill="#c084fc" fontFamily="monospace">
                      {'06    </main> <!-- 웹표준 · 크로스브라우징 · 성능 최적화 완료 -->'}
                    </text>
                  )}

                  <rect x="200" y="176" width="318" height="32" rx="6" fill="#0f172a" stroke="#4c1d95" strokeWidth="1" />
                  <text x="212" y="196" fontSize="9.5" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                    {codeProgress < 100
                      ? `⚡ Compiling HTML5 / CSS3 Markup... (${codeProgress}%)`
                      : '✓ Build Success! Deploying to https://www.sisun.com'}
                  </text>
                </g>
              )}

              {isLiveComplete && (
                <g>
                  <rect
                    x="130"
                    y="102"
                    width="280"
                    height="34"
                    rx="17"
                    fill="#5b21b6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text x="270" y="123" fontSize="11" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                    🎉 시선닷컴(sisun.com) 기획·디자인·퍼블리싱 완성!
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* 말풍선 하단 삼각형 꼬리 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-24px',
              left: `${bubbleTailLeft}%`,
              width: 0,
              height: 0,
              borderLeft: '18px solid transparent',
              borderRight: '28px solid transparent',
              borderTop: `24px solid ${bubbleBorderColor}`,
              transition: 'left 0.25s ease, border-top-color 0.4s ease',
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
              borderTop: `21px solid ${bubbleBgColor}`,
              transition: 'left 0.25s ease, border-top-color 0.4s ease',
            }}
          />
        </div>

        {/* 2. 하단 캐릭터 동시 액션 무대 (투명 배경 PNG 3인이 개별로 동시에 움직임) */}
        <div
          style={{
            position: 'relative',
            height: '245px',
            background: '#ffffff',
            marginTop: '10px',
            overflow: 'hidden',
          }}
        >
          {/* 바닥 가이드 라인 (은은한 점선) */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '5%',
              right: '5%',
              height: '2px',
              background:
                'repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 16px)',
            }}
          />

          {/* ---------------- 주인공 1: 서비스기획자 (세분화 서브프레임 20종 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${plannerLeft}%`,
              width: '175px',
              height: '205px',
              transition: 'left 0.055s linear',
              zIndex: 5,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                width: '74px',
                height: '12px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${plannerMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 연속 바운스 · 스쿼시&스트레치 · 미세 회전이 적용되는 캐릭터 바디 컨테이너 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '50% 92%',
                transform: `translateY(${plannerMotion.bounceY}px) scaleX(${plannerMotion.scaleX}) scaleY(${plannerMotion.scaleY}) rotate(${plannerMotion.rotateDeg}deg)`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            >
              {[
                { key: 'walk-s1', file: 'planner-walk-s1.png' },
                { key: 'walk-s2', file: 'planner-walk-s2.png' },
                { key: 'walk-s3', file: 'planner-walk-s3.png' },
                { key: 'walk-s4', file: 'planner-walk-s4.png' },
                { key: 'walk-s5', file: 'planner-walk-s5.png' },
                { key: 'walk-s6', file: 'planner-walk-s6.png' },
                { key: 'think-1', file: 'planner-think-1.png' },
                { key: 'think-2', file: 'planner-think-2.png' },
                { key: 'think-3', file: 'planner-think-3.png' },
                { key: 'think-4', file: 'planner-think-4.png' },
                { key: 'sketch-1', file: 'planner-sketch-1.png' },
                { key: 'sketch-2', file: 'planner-sketch-2.png' },
                { key: 'sketch-3', file: 'planner-sketch-3.png' },
                { key: 'sketch-4', file: 'planner-sketch-4.png' },
                { key: 'sketch-5', file: 'planner-sketch-5.png' },
                { key: 'sketch-6', file: 'planner-sketch-6.png' },
                { key: 'handoff-1', file: 'planner-handoff-1.png' },
                { key: 'handoff-2', file: 'planner-handoff-2.png' },
                { key: 'handoff-3', file: 'planner-handoff-3.png' },
                { key: 'handoff-4', file: 'planner-handoff-4.png' },
              ].map((sprite) => {
                const isCurrent = plannerSprite === sprite.key;
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
                      transform: plannerFlipRight ? 'scaleX(-1)' : 'none',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <div
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(30,58,138,0.2)',
                }}
              >
                1. 서비스기획자
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>
                {plannerActionLabel}
              </span>
            </div>
          </div>

          {/* ---------------- 주인공 2: UI/UX 디자이너 (세분화 서브프레임 20종 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${designerLeft}%`,
              width: '175px',
              height: '205px',
              transition: 'left 0.055s linear',
              zIndex: 6,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                width: '74px',
                height: '12px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${designerMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 연속 바운스 · 스쿼시&스트레치 · 미세 회전이 적용되는 캐릭터 바디 컨테이너 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '50% 92%',
                transform: `translateY(${designerMotion.bounceY}px) scaleX(${designerMotion.scaleX}) scaleY(${designerMotion.scaleY}) rotate(${designerMotion.rotateDeg}deg)`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            >
              {[
                { key: 'walk-s1', file: 'designer-walk-s1.png' },
                { key: 'walk-s2', file: 'designer-walk-s2.png' },
                { key: 'walk-s3', file: 'designer-walk-s3.png' },
                { key: 'walk-s4', file: 'designer-walk-s4.png' },
                { key: 'walk-s5', file: 'designer-walk-s5.png' },
                { key: 'walk-s6', file: 'designer-walk-s6.png' },
                { key: 'receive-1', file: 'designer-receive-1.png' },
                { key: 'receive-2', file: 'designer-receive-2.png' },
                { key: 'receive-3', file: 'designer-receive-3.png' },
                { key: 'receive-4', file: 'designer-receive-4.png' },
                { key: 'work-1', file: 'designer-work-1.png' },
                { key: 'work-2', file: 'designer-work-2.png' },
                { key: 'work-3', file: 'designer-work-3.png' },
                { key: 'work-4', file: 'designer-work-4.png' },
                { key: 'work-5', file: 'designer-work-5.png' },
                { key: 'work-6', file: 'designer-work-6.png' },
                { key: 'handoff-1', file: 'designer-handoff-1.png' },
                { key: 'handoff-2', file: 'designer-handoff-2.png' },
                { key: 'handoff-3', file: 'designer-handoff-3.png' },
                { key: 'handoff-4', file: 'designer-handoff-4.png' },
              ].map((sprite) => {
                const isCurrent = designerSprite === sprite.key;
                return (
                  <img
                    key={sprite.key}
                    src={charImgUrl(sprite.file)}
                    alt={`디자이너 ${sprite.key}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: isCurrent ? 1 : 0,
                      transform: designerFlipRight ? 'scaleX(-1)' : 'none',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <div
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(4,120,87,0.2)',
                }}
              >
                2. UI/UX 디자이너
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                {designerActionLabel}
              </span>
            </div>
          </div>

          {/* ---------------- 주인공 3: 웹 퍼블리셔 (여성 캐릭터 세분화 서브프레임 20종 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${publisherLeft}%`,
              width: '175px',
              height: '205px',
              transition: 'left 0.055s linear',
              zIndex: 7,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                width: '74px',
                height: '12px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${publisherMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 연속 바운스 · 스쿼시&스트레치 · 미세 회전이 적용되는 캐릭터 바디 컨테이너 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '50% 92%',
                transform: `translateY(${publisherMotion.bounceY}px) scaleX(${publisherMotion.scaleX}) scaleY(${publisherMotion.scaleY}) rotate(${publisherMotion.rotateDeg}deg)`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            >
              {[
                { key: 'walk-s1', file: 'publisher-walk-s1.png' },
                { key: 'walk-s2', file: 'publisher-walk-s2.png' },
                { key: 'walk-s3', file: 'publisher-walk-s3.png' },
                { key: 'walk-s4', file: 'publisher-walk-s4.png' },
                { key: 'walk-s5', file: 'publisher-walk-s5.png' },
                { key: 'walk-s6', file: 'publisher-walk-s6.png' },
                { key: 'receive-1', file: 'publisher-receive-1.png' },
                { key: 'receive-2', file: 'publisher-receive-2.png' },
                { key: 'receive-3', file: 'publisher-receive-3.png' },
                { key: 'receive-4', file: 'publisher-receive-4.png' },
                { key: 'code-1', file: 'publisher-code-1.png' },
                { key: 'code-2', file: 'publisher-code-2.png' },
                { key: 'code-3', file: 'publisher-code-3.png' },
                { key: 'code-4', file: 'publisher-code-4.png' },
                { key: 'code-5', file: 'publisher-code-5.png' },
                { key: 'code-6', file: 'publisher-code-6.png' },
                { key: 'complete-1', file: 'publisher-complete-1.png' },
                { key: 'complete-2', file: 'publisher-complete-2.png' },
                { key: 'complete-3', file: 'publisher-complete-3.png' },
                { key: 'complete-4', file: 'publisher-complete-4.png' },
              ].map((sprite) => {
                const isCurrent = publisherSprite === sprite.key;
                return (
                  <img
                    key={sprite.key}
                    src={charImgUrl(sprite.file)}
                    alt={`퍼블리셔 ${sprite.key}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: isCurrent ? 1 : 0,
                      transform: publisherFlipRight ? 'scaleX(-1)' : 'none',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <div
                style={{
                  background: '#6d28d9',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(109,40,217,0.2)',
                }}
              >
                3. 웹 퍼블리셔
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                {publisherActionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
