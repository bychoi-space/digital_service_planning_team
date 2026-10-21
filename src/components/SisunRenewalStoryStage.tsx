import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Palette, Code2 } from 'lucide-react';

// ============================================================================
// [시선닷컴 UI/UX 전면 개편] 3인 캐릭터 릴레이 스토리보드 타임라인 (총 300틱 = 30초 연속 루프)
// - Scene 1 (기획자 파트: 0 ~ 74틱)
//   0: 좌측에서 기획자가 걸어나옴 (0 ~ 20)
//   1: 멈춰 서서 Mobile & PC 떠올리며 고민 (?) (20 ~ 36)
//   2: 유레카(💡)! 말풍선 속 Mobile & PC에 시선닷컴 UI 와이어프레임 스케치 (36 ~ 74)
// - Scene 2 (디자이너 파트: 74 ~ 172틱)
//   3: 기획자가 우측으로 걸어갈 때, 아래쪽에서 디자이너가 걸어 올라옴 (74 ~ 92)
//   4: 기획자가 화면설계서를 건네고, 디자이너가 두 손으로 산출물을 넘겨받음 (92 ~ 112)
//   5: 말풍선이 디자이너에게 이동하고 Figma 디자인 캔버스 세팅 (112 ~ 126)
//   6: 디자이너가 Figma로 Mobile & PC 와이어프레임을 시선닷컴 고해상도 화보 UI로 리뉴얼 (126 ~ 172)
// - Scene 3 (여성 퍼블리셔 파트: 172 ~ 300틱)
//   7: 디자이너가 우측으로 걸어갈 때, 우측에서 여성 퍼블리셔가 걸어 나옴 (172 ~ 190)
//   8: 디자이너가 UI 디자인 시안을 건네고, 퍼블리셔가 두 손으로 산출물을 넘겨받음 (190 ~ 210)
//   9: 말풍선이 퍼블리셔에게 이동하고 HTML5/CSS3 반응형 퍼블리싱 환경 세팅 (210 ~ 224)
//  10: 퍼블리셔가 노트북으로 HTML/CSS 코딩을 타이핑하여 Mobile·PC 마크업 구현 (224 ~ 274)
//  11: 코딩 완료! 실제 살아 움직이는 시선닷컴(sisun.com) LIVE 웹사이트 완성 & 삼총사 축하! (274 ~ 300)
// ============================================================================
type StorySubStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const STEP_LABELS: Record<StorySubStep, string> = {
  0: 'Scene 1-① 좌측에서 서비스기획자가 총총총 걸어 나옵니다',
  1: 'Scene 1-② Mobile과 PC 디바이스 화면 구성을 골똘히 고민합니다 (?)',
  2: 'Scene 1-③ 유레카(💡)! 말풍선 안의 Mobile·PC 화면에 시선닷컴 와이어프레임을 스케치합니다',
  3: 'Scene 2-④ 기획자가 우측으로 이동할 때, 아래쪽에서 디자이너가 걸어 올라옵니다!',
  4: 'Scene 2-⑤ 기획자가 건넨 화면설계서(산출물)를 디자이너가 두 손으로 넘겨받습니다 ✨',
  5: 'Scene 2-⑥ 말풍선이 디자이너에게 이동하고 Figma 디자인 캔버스가 활성화됩니다',
  6: 'Scene 2-⑦ 디자이너가 Figma로 시선닷컴 Mobile·PC 화면을 감각적인 화보 UI로 리뉴얼합니다 🎨',
  7: 'Scene 3-⑧ 디자이너가 우측으로 이동할 때, 우측에서 여성 퍼블리셔가 총총 걸어 나옵니다!',
  8: 'Scene 3-⑨ 디자이너가 건넨 UI 디자인 시안(산출물)을 퍼블리셔가 두 손으로 넘겨받습니다 ✨',
  9: 'Scene 3-⑩ 말풍선이 퍼블리셔에게 이동하고 HTML/CSS 반응형 코딩 모드가 켜집니다',
  10: 'Scene 3-⑪ 퍼블리셔가 노트북으로 HTML/CSS 코드를 작성해 반응형 웹 화면으로 구현합니다 💻',
  11: 'Scene 3-⑫ 시선닷컴(sisun.com) Mobile & PC 리뉴얼 웹 퍼블리싱 배포 완료! 🎉',
};

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  // 총 300틱 (1틱 = 100ms, 전체 30초 연속 루프: Scene 1 ➔ Scene 2 ➔ Scene 3 순서대로 재생)
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 300);
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // 현재 서브 단계 계산
  const subStep: StorySubStep =
    tick < 20
      ? 0
      : tick < 36
      ? 1
      : tick < 74
      ? 2
      : tick < 92
      ? 3
      : tick < 112
      ? 4
      : tick < 126
      ? 5
      : tick < 172
      ? 6
      : tick < 190
      ? 7
      : tick < 210
      ? 8
      : tick < 224
      ? 9
      : tick < 274
      ? 10
      : 11;

  const currentScene: 1 | 2 | 3 = subStep <= 2 ? 1 : subStep <= 6 ? 2 : 3;

  // 공통 4박자 걸음걸이 인덱스 (0 -> 1 -> 2 -> 1 반복)
  const walkCycleOrder = [0, 1, 2, 1];
  const walkFrameIdx = walkCycleOrder[Math.floor(tick / 2) % 4];
  const stepBounce = Math.floor(tick / 2) % 2 === 0 ? -5 : 0;

  // =========================================================================
  // 1) 기획자(Planner) 위치 및 스프라이트 상태 계산
  // =========================================================================
  const getPlannerLeftPercent = (): number => {
    if (tick < 20) {
      // -6% -> 11% 좌측에서 걸어 나옴
      return -6 + (tick / 20) * 17;
    }
    if (tick < 74) {
      // 11% 자리에서 고민 & 스케치
      return 11;
    }
    if (tick < 92) {
      // 11% -> 27% 디자이너에게 산출물 전달하러 우측 이동
      return 11 + ((tick - 74) / 18) * 16;
    }
    if (tick < 112) {
      // 27% 자리에서 화면설계서 전달
      return 27;
    }
    if (tick < 126) {
      // 전달 후 좌측 자리(11%)로 복귀
      return 27 - ((tick - 112) / 14) * 16;
    }
    return 11;
  };

  const plannerLeft = getPlannerLeftPercent();
  const isPlannerWalking = subStep === 0 || subStep === 3 || subStep === 5;
  const plannerBounceY = isPlannerWalking ? stepBounce : 0;

  const plannerSprite: 'walk1' | 'walk2' | 'walk3' | 'think' | 'sketch' | 'handoff' = isPlannerWalking
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
      : 'sketch'
    : subStep === 4 || subStep === 11
    ? 'handoff'
    : 'sketch';

  const plannerFlipRight =
    (subStep === 0 || subStep === 3) &&
    (plannerSprite === 'walk1' || plannerSprite === 'walk2' || plannerSprite === 'walk3');

  // =========================================================================
  // 2) 디자이너(Designer) 위치 및 스프라이트 상태 계산
  // =========================================================================
  const showDesigner = tick >= 74;

  const getDesignerBottomPx = (): number => {
    if (tick < 74) return -210;
    if (tick < 92) {
      // 아래(-195px)에서 무대 바닥(12px)으로 총총 걸어 올라옴
      const progress = (tick - 74) / 18;
      return -195 + progress * 207;
    }
    return 12;
  };

  const getDesignerLeftPercent = (): number => {
    if (tick < 172) {
      // 중앙(43%) 자리에서 기획서 수령 & Figma 디자인 작업
      return 43;
    }
    if (tick < 190) {
      // 디자인 완성 후 우측 퍼블리셔에게 전달하러 43% -> 56% 이동
      return 43 + ((tick - 172) / 18) * 13;
    }
    if (tick < 210) {
      // 56% 자리에서 퍼블리셔에게 디자인 시안 전달
      return 56;
    }
    if (tick < 224) {
      // 전달 후 다시 중앙 자리(43%)로 복귀
      return 56 - ((tick - 210) / 14) * 13;
    }
    return 43;
  };

  const designerBottom = getDesignerBottomPx();
  const designerLeft = getDesignerLeftPercent();
  const isDesignerWalking = subStep === 3 || subStep === 7 || subStep === 9;
  const designerBounceY = isDesignerWalking ? stepBounce : 0;

  const designerSprite: 'walk1' | 'walk2' | 'walk3' | 'receive' | 'work' | 'handoff' = isDesignerWalking
    ? walkFrameIdx === 0
      ? 'walk1'
      : walkFrameIdx === 1
      ? 'walk2'
      : 'walk3'
    : subStep === 4
    ? 'receive'
    : subStep === 5 || subStep === 6
    ? tick % 6 === 0
      ? 'walk1'
      : 'work'
    : subStep === 8
    ? 'handoff'
    : subStep === 11
    ? 'receive'
    : 'work';

  // 디자이너가 우측으로 걸어갈 때(subStep === 7) 또는 우측으로 시안을 건넬 때(subStep === 8) 좌우 반전
  const designerFlipRight = subStep === 7 || subStep === 8;

  // =========================================================================
  // 3) 여성 퍼블리셔(Publisher) 위치 및 스프라이트 상태 계산
  // =========================================================================
  // 디자이너가 우측으로 걸어갈 때(tick 172) 우측 바깥(98%)에서 퍼블리셔가 걸어 나옴!
  const showPublisher = tick >= 172;

  const getPublisherLeftPercent = (): number => {
    if (tick < 172) return 98;
    if (tick < 190) {
      // 98% -> 74% 우측에서 좌측으로 총총 걸어 나옴
      const progress = (tick - 172) / 18;
      return 98 - progress * 24;
    }
    // 74% 자리에서 디자인 시안 수령 & HTML/CSS 코딩 & 완성 축하
    return 74;
  };

  const publisherLeft = getPublisherLeftPercent();
  const isPublisherWalking = subStep === 7;
  const publisherBounceY = isPublisherWalking ? stepBounce : 0;

  // 코딩 작업 중(subStep === 10)에는 타이핑 포즈(code)와 살짝 움직이는 포즈(walk1)를 교차하여 타다닥 타이핑하는 생동감 연출
  const publisherSprite: 'walk1' | 'walk2' | 'walk3' | 'receive' | 'code' | 'complete' = isPublisherWalking
    ? walkFrameIdx === 0
      ? 'walk1'
      : walkFrameIdx === 1
      ? 'walk2'
      : 'walk3'
    : subStep === 8
    ? 'receive'
    : subStep === 9 || subStep === 10
    ? tick % 5 === 0
      ? 'walk1'
      : 'code'
    : 'complete';

  // =========================================================================
  // 4) 상단 대형 말풍선 진행률 (스케치 ➔ Figma 디자인 ➔ HTML/CSS 코딩)
  // =========================================================================
  // Scene 1: 기획자 와이어프레임 스케치 진행률 (0 ~ 100%)
  const sketchProgress =
    tick < 36 ? 0 : tick < 74 ? Math.min(100, Math.round(((tick - 36) / 32) * 100)) : 100;

  // Scene 2: 디자이너 Figma 컬러 UI 리뉴얼 진행률 (0 ~ 100%)
  const designProgress =
    tick < 120
      ? 0
      : tick < 170
      ? Math.min(100, Math.round(((tick - 120) / 44) * 100))
      : 100;

  // Scene 3: 퍼블리셔 HTML/CSS 반응형 코딩 진행률 (0 ~ 100%)
  const codeProgress =
    tick < 220
      ? 0
      : tick < 272
      ? Math.min(100, Math.round(((tick - 220) / 48) * 100))
      : 100;

  // 퍼블리셔가 코딩 타이핑 중인 구간 (코드 오버레이 드로어가 화면 위에서 작동하는 구간)
  const isCodingOverlayVisible = tick >= 216 && tick < 274;
  const isLiveComplete = tick >= 274;

  // 말풍선 노출 여부
  const showBubble = tick >= 18;

  // 말풍선 꼬리 X 위치: Scene 1(기획자) ➔ Scene 2(디자이너) ➔ Scene 3(퍼블리셔) 머리 위로 이동!
  const bubbleTailLeft =
    tick < 108
      ? Math.min(34, Math.max(14, plannerLeft + 4))
      : tick < 206
      ? Math.min(62, Math.max(45, designerLeft + 4))
      : Math.min(82, Math.max(72, publisherLeft + 4));

  // 말풍선 테마 컬러 (Scene 1: 블루 / Scene 2: 에메랄드 블루 / Scene 3: 퍼블리셔 퍼플-인디고)
  const bubbleBgColor = currentScene === 1 ? '#4a7cc7' : currentScene === 2 ? '#3b6db5' : '#5b4bc4';
  const bubbleBorderColor = currentScene === 1 ? '#2b5494' : currentScene === 2 ? '#1e4278' : '#37298a';

  // GitHub Pages 호환 이미지 경로 헬퍼
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
      {/* 상단 미니 컨트롤 바 (Scene 1 · Scene 2 · Scene 3 단계 표시 및 구간 점프 컨트롤) */}
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
                currentScene === 1 ? '#eff6ff' : currentScene === 2 ? '#ecfdf5' : '#f5f3ff',
              color:
                currentScene === 1 ? '#1d4ed8' : currentScene === 2 ? '#047857' : '#6d28d9',
              border: `1px solid ${
                currentScene === 1 ? '#bfdbfe' : currentScene === 2 ? '#a7f3d0' : '#ddd6fe'
              }`,
              padding: '4px 11px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
              transition: 'all 0.3s',
            }}
          >
            {currentScene === 1 ? (
              <Sparkles size={13} />
            ) : currentScene === 2 ? (
              <Palette size={13} />
            ) : (
              <Code2 size={13} />
            )}
            {currentScene === 1
              ? 'SCENE 01 · 기획자 파트'
              : currentScene === 2
              ? 'SCENE 02 · 디자이너 파트'
              : 'SCENE 03 · 퍼블리셔 파트'}
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
            {STEP_LABELS[subStep]}
          </span>
        </div>

        {/* 재생/일시정지 및 Scene 1 · 2 · 3 구간 바로보기 컨트롤 */}
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
            <RotateCcw size={12} /> 전체 처음부터(1단계)
          </button>

          {[
            { label: 'Scene1 기획자', t: 2, active: currentScene === 1, color: '#dbeafe', text: '#1e3a8a' },
            { label: 'Scene2 디자이너', t: 74, active: currentScene === 2, color: '#d1fae5', text: '#065f46' },
            { label: '⑧ 퍼블리셔 등장', t: 172, active: subStep === 7, color: '#ede9fe', text: '#5b21b6' },
            { label: '⑨ 디자인 수령', t: 192, active: subStep === 8, color: '#ede9fe', text: '#5b21b6' },
            { label: '⑪ HTML/CSS 코딩(💻)', t: 224, active: subStep === 9 || subStep === 10, color: '#ede9fe', text: '#5b21b6' },
            { label: '⑫ 리뉴얼 완성(🎉)', t: 275, active: subStep === 11, color: '#fae8ff', text: '#86198f' },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => setTick(btn.t)}
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: btn.active ? btn.color : '#ffffff',
                color: btn.active ? btn.text : '#475569',
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
          - 상단: 대형 말풍선 (좌측 세로 Mobile 화면 + 우측 가로 PC 화면)
          - 하단: 흰색 무대 위에서 걸어 나와 산출물을 주고받는 2등신 캐릭터 3총사
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
            opacity: showBubble ? 1 : 0.15,
            transform: showBubble ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            transition:
              'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease, border-color 0.4s ease',
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
            {/* 모바일 상단 스피커 노치 & 현재 작업 모드 배지 */}
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
                    currentScene === 1 ? '#64748b' : currentScene === 2 ? '#059669' : '#6d28d9',
                  background:
                    currentScene === 1 ? '#f1f5f9' : currentScene === 2 ? '#ecfdf5' : '#f5f3ff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {currentScene === 1
                  ? '📐 Mobile Wireframe'
                  : currentScene === 2
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
              /* 스케치(Scene 1) ➔ Figma 디자인(Scene 2) ➔ HTML/CSS 퍼블리싱 & LIVE 배포(Scene 3) */
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

                {/* =================================================================
                    [Layer 3] Scene 3 · 퍼블리셔의 HTML/CSS 반응형 코딩 오버레이 & LIVE 완성 배지
                   ================================================================= */}
                {isCodingOverlayVisible && (
                  <g>
                    {/* 모바일 반응형 그리드 가이드 라인 */}
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
                    {/* 반투명 VS Code 코딩 터미널 창 */}
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
                        {'< LookbookHero full />'}
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
                    {/* 코딩 진행 바 */}
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

                {/* 퍼블리싱 완료(LIVE) 상태일 때 상단 인터랙티브 LIVE 뱃지 */}
                {isLiveComplete && (
                  <g>
                    <rect x="26" y="116" width="148" height="22" rx="11" fill="#6d28d9" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="100" y="130" fontSize="8.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      ✨ 모바일 반응형 웹 배포 완료!
                    </text>
                  </g>
                )}
              </svg>
            )}
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
            {/* PC 브라우저 / Figma / VS Code 상단 툴바 */}
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
                      currentScene === 1 ? '#f8fafc' : currentScene === 2 ? '#ecfdf5' : '#f5f3ff',
                    border: `1px solid ${
                      currentScene === 1 ? '#e2e8f0' : currentScene === 2 ? '#a7f3d0' : '#ddd6fe'
                    }`,
                    borderRadius: '6px',
                    padding: '2px 12px',
                    fontSize: '11px',
                    color:
                      currentScene === 1 ? '#64748b' : currentScene === 2 ? '#047857' : '#6d28d9',
                    fontWeight: 700,
                    transition: 'all 0.3s',
                  }}
                >
                  {currentScene === 1
                    ? 'https://www.sisun.com — PC 화면설계서 (Wireframe)'
                    : currentScene === 2
                    ? '🎨 Figma — SISUN.COM 2026 UI/UX 디자인 리뉴얼 (Design System v2.0)'
                    : isLiveComplete
                    ? '🟢 https://www.sisun.com — 반응형 웹 퍼블리싱 배포 완료 (LIVE)'
                    : '💻 VS Code — index.html · sisun-responsive.css (퍼블리싱 마크업 중...)'}
                </div>
              </div>

              {/* Scene 2: 컬러 토큰 / Scene 3: HTML5·CSS3·반응형 상태 배지 */}
              {currentScene === 2 && (
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

              {currentScene === 3 && (
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
              /* 스케치(Scene 1) ➔ Figma 디자인(Scene 2) ➔ HTML/CSS 퍼블리싱 & LIVE 완성(Scene 3) */
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

                    {tick < 112 && (
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

                    {/* Scene 2 디자이너 Figma 마우스 커서 */}
                    {currentScene === 2 && (
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

                {/* =================================================================
                    [Layer 3] Scene 3 · 퍼블리셔의 VS Code HTML/CSS 코딩 에디터 오버레이 & LIVE 완성
                   ================================================================= */}
                {isCodingOverlayVisible && (
                  <g>
                    {/* 우측 반투명 VS Code 에디터 패널 */}
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
                    {/* 에디터 탭 헤더 */}
                    <rect x="185" y="36" width="348" height="24" rx="10" fill="#1e293b" />
                    <text x="200" y="52" fontSize="9" fontWeight="bold" fill="#c4b5fd" fontFamily="monospace">
                      📄 sisun_main_renewal.html &nbsp;|&nbsp; 🎨 responsive_grid.css
                    </text>

                    {/* 타이핑되는 HTML/CSS 코드 라인들 */}
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

                    {/* 하단 컴파일 상태 바 */}
                    <rect x="200" y="176" width="318" height="32" rx="6" fill="#0f172a" stroke="#4c1d95" strokeWidth="1" />
                    <text x="212" y="196" fontSize="9.5" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                      {codeProgress < 100
                        ? `⚡ Compiling HTML5 / CSS3 Markup... (${codeProgress}%)`
                        : '✓ Build Success! Deploying to https://www.sisun.com'}
                    </text>
                  </g>
                )}

                {/* 퍼블리싱 완료(LIVE) 상태일 때 중앙 축하 배지 */}
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
            )}
          </div>

          {/* 말풍선 하단 삼각형 꼬리 (Scene 1: 기획자 ➔ Scene 2: 디자이너 ➔ Scene 3: 퍼블리셔 머리 위로 이동) */}
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
              transition: 'left 0.2s linear, border-top-color 0.4s ease',
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
              transition: 'left 0.2s linear, border-top-color 0.4s ease',
            }}
          />
        </div>

        {/* 2. 하단 캐릭터 워킹 & 바통 터치 무대 (깨끗한 화이트 바닥) */}
        <div
          style={{
            position: 'relative',
            height: '240px',
            background: '#ffffff',
            marginTop: '10px',
            overflow: 'hidden',
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
              background:
                'repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 16px)',
            }}
          />

          {/* ① 좌측 기획자 등장 파란 화살표 안내 (스케치의 좌측 파란색 화살표 ➔ 반영) */}
          <div
            style={{
              position: 'absolute',
              left: '8px',
              bottom: '85px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: subStep === 0 ? 1 : 0.28,
              transition: 'opacity 0.3s',
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '5px 9px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(59,130,246,0.25)',
              }}
            >
              기획자 등장 ➔
            </div>
          </div>

          {/* ② 중앙 하단 디자이너 등장 초록 화살표 안내 (스케치의 하단 초록색 화살표 ⬆️ 반영) */}
          <div
            style={{
              position: 'absolute',
              left: '48%',
              bottom: '4px',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: subStep === 3 ? 1 : 0.28,
              transition: 'opacity 0.3s',
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                boxShadow: '0 4px 10px rgba(16,185,129,0.25)',
              }}
            >
              ⬆️ 디자이너 등장
            </div>
          </div>

          {/* ③ 우측 퍼블리셔 등장 보라 화살표 안내 (스케치의 우측 보라색 화살표 ⬅️ 반영) */}
          <div
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '85px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: subStep === 7 ? 1 : 0.28,
              transition: 'opacity 0.3s',
              zIndex: 2,
            }}
          >
            <div
              style={{
                background: '#7c3aed',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 800,
                padding: '5px 9px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(124,58,237,0.25)',
              }}
            >
              ⬅️ 퍼블리셔 등장
            </div>
          </div>

          {/* ---------------- 주인공 1: 서비스기획자 (6개 프레임 무깜빡임 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: `${plannerLeft}%`,
              width: '175px',
              height: '200px',
              transform: `translateY(${plannerBounceY}px)`,
              transition: 'left 0.1s linear, transform 0.1s ease-in-out',
              zIndex: 5,
            }}
          >
            {[
              { key: 'walk1', file: 'planner-walk-1.jpg' },
              { key: 'walk2', file: 'planner-walk-2.jpg' },
              { key: 'walk3', file: 'planner-walk-3.jpg' },
              { key: 'think', file: 'planner-think.jpg' },
              { key: 'sketch', file: 'planner-sketch.jpg' },
              { key: 'handoff', file: 'planner-handoff.jpg' },
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
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
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

          {/* 기획자 ➔ 디자이너 산출물 바통터치 배지 */}
          {subStep === 4 && (
            <div
              style={{
                position: 'absolute',
                bottom: '185px',
                left: '39%',
                transform: 'translateX(-50%)',
                background: '#fef3c7',
                color: '#92400e',
                border: '1.5px solid #f59e0b',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              📋 화면설계서 바통 터치! ➔
            </div>
          )}

          {/* ---------------- 주인공 2: UI/UX 디자이너 (6개 프레임 무깜빡임 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: `${designerBottom}px`,
              left: `${designerLeft}%`,
              width: '175px',
              height: '200px',
              opacity: showDesigner ? 1 : 0,
              transform: `translateY(${designerBounceY}px)`,
              transition: 'left 0.1s linear, bottom 0.1s linear, transform 0.1s ease-in-out, opacity 0.2s',
              zIndex: 6,
            }}
          >
            {[
              { key: 'walk1', file: 'designer-walk-1.jpg' },
              { key: 'walk2', file: 'designer-walk-2.jpg' },
              { key: 'walk3', file: 'designer-walk-3.jpg' },
              { key: 'receive', file: 'designer-receive.jpg' },
              { key: 'work', file: 'designer-work.jpg' },
              { key: 'handoff', file: 'designer-handoff.jpg' },
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
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#047857',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(4,120,87,0.25)',
              }}
            >
              2. UI/UX 디자이너
            </div>
          </div>

          {/* 디자이너 ➔ 퍼블리셔 UI 디자인 시안 바통터치 배지 */}
          {subStep === 8 && (
            <div
              style={{
                position: 'absolute',
                bottom: '185px',
                left: '68%',
                transform: 'translateX(-50%)',
                background: '#f3e8ff',
                color: '#6b21a8',
                border: '1.5px solid #a855f7',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(168,85,247,0.2)',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              🎨 UI 디자인 시안 바통 터치! ➔
            </div>
          )}

          {/* ---------------- 주인공 3: 웹 퍼블리셔 (여성 캐릭터 6개 프레임 무깜빡임 스왑) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: `${publisherLeft}%`,
              width: '175px',
              height: '200px',
              opacity: showPublisher ? 1 : 0,
              transform: `translateY(${publisherBounceY}px)`,
              transition: 'left 0.1s linear, transform 0.1s ease-in-out, opacity 0.2s',
              zIndex: 7,
            }}
          >
            {[
              { key: 'walk1', file: 'publisher-walk-1.jpg' },
              { key: 'walk2', file: 'publisher-walk-2.jpg' },
              { key: 'walk3', file: 'publisher-walk-3.jpg' },
              { key: 'receive', file: 'publisher-receive.jpg' },
              { key: 'code', file: 'publisher-code.jpg' },
              { key: 'complete', file: 'publisher-complete.jpg' },
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
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                  }}
                />
              );
            })}

            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#6d28d9',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(109,40,217,0.25)',
              }}
            >
              3. 웹 퍼블리셔
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
