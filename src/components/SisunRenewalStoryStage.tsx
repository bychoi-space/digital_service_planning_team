import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Palette, Code2 } from 'lucide-react';

// 상단 칠판 포커스 모드 ('auto'일 때는 3개 영역 모두 각 캐릭터와 실시간 동기화, 특정 단계 선택 시 해당 칠판 영역을 100% 완성 상태로 하이라이트)
type ScreenStageMode = 'auto' | 'wireframe' | 'design' | 'publishing';

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [screenMode, setScreenMode] = useState<ScreenStageMode>('auto');

  // 1서브틱 = 50ms (20fps 고주사율 애니메이션 타이머)
  const [subTick, setSubTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setSubTick((prev) => (prev + 1) % 2400);
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // 연속 타임라인 틱 (0.0, 0.5, 1.0, 1.5 ...)
  const tick = subTick / 2;

  // 부드러운 가감속(Ease-In-Out Sine) 보간 헬퍼
  const easeInOut = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    return -(Math.cos(Math.PI * clamped) - 1) / 2;
  };

  // 8박자 세밀 보행 사이클 (6종의 세분화된 워킹 서브프레임 순환)
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

  // 6프레임 연속 업무 사이클 (1->2->3->4->5->6->4->2)
  const workLoopOrder = [1, 2, 3, 4, 5, 6, 4, 2] as const;
  const getWorkSubFrame = (st: number, offset: number) =>
    workLoopOrder[Math.floor((st + offset) / 2) % workLoopOrder.length];

  // 4프레임 연속 인터랙션(고민/수령/전달/완료) 사이클 (1->2->3->4->3->2)
  const interactLoopOrder = [1, 2, 3, 4, 3, 2] as const;
  const getInteractSubFrame = (st: number, offset: number) =>
    interactLoopOrder[Math.floor((st + offset) / 2) % interactLoopOrder.length];

  // 연속 사인파 기반 자연스러운 보행 바운스 & 스쿼시-스트레치(Squash & Stretch) 물리 계수
  const getCharacterMotion = (isWalking: boolean, st: number, phaseOffset: number) => {
    if (isWalking) {
      const phase = (st + phaseOffset) * 0.55;
      const bounceY = -Math.abs(Math.sin(phase)) * 7.5; // 0px ~ -7.5px 연속 아치형 발걸음
      const squash = Math.sin(phase * 2) * 0.024;
      const scaleX = 1 - squash * 0.75;
      const scaleY = 1 + squash;
      const rotateDeg = Math.cos(phase) * 1.7;
      const shadowScale = 1 - Math.abs(Math.sin(phase)) * 0.2;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    } else {
      const phase = (st + phaseOffset) * 0.28;
      const bounceY = Math.sin(phase) * 2.2 - 1.5; // 업무 중 살아있는 미세 호흡 리듬
      const squash = Math.sin(phase) * 0.013;
      const scaleX = 1 - squash * 0.65;
      const scaleY = 1 + squash;
      const rotateDeg = Math.sin(phase * 0.7) * 0.95;
      const shadowScale = 1 + Math.sin(phase) * 0.05;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    }
  };

  // =========================================================================
  // 1) 캐릭터 1 · 서비스기획자 (하얀색 영역의 좌측 끝(0.5%)에서부터 등장!)
  //    - 0 ~ 16: 좌측 끝(0.5%)에서 좌측 칠판(Zone 1) 중앙 아래(9.5%)로 총총 걸어 등장
  //    - 16 ~ 32: 좌측 칠판 아래에서 Mobile & PC 화면 구성 골똘히 고민 (?)
  //    - 32 ~ 58: 유레카(💡)! 태블릿에 시선닷컴 와이어프레임 스케치
  //    - 58 ~ 70: 중앙 디자이너 쪽(20.5%)으로 총총 걸어 이동
  //    - 70 ~ 80: 두 손으로 화면설계서(산출물) 전달 포즈 (📋)
  //    - 80 ~ 90: 다시 좌측 끝(0.5%)으로 총총 걸어 복귀
  // =========================================================================
  const pTick = tick % 90;
  const isPlannerWalking = pTick < 16 || (pTick >= 58 && pTick < 70) || pTick >= 80;
  const plannerMotion = getCharacterMotion(isPlannerWalking, subTick, 0);

  const getPlannerLeft = (): number => {
    if (pTick < 16) return 0.5 + easeInOut(pTick / 16) * 9.0; // 0.5%(좌측 끝) -> 9.5%(Zone 1 중앙)
    if (pTick < 58) return 9.5;
    if (pTick < 70) return 9.5 + easeInOut((pTick - 58) / 12) * 11.0; // 9.5% -> 20.5%
    if (pTick < 80) return 20.5;
    return 20.5 - easeInOut((pTick - 80) / 10) * 20.0; // 20.5% -> 0.5%(좌측 끝)
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
      ? '좌측 끝에서 걸어 등장 중'
      : pTick < 32
      ? 'Mobile·PC UX 고민 중 (?)'
      : pTick < 58
      ? '와이어프레임 스케치 중 (💡)'
      : pTick < 70
      ? '디자이너에게 이동 중'
      : pTick < 80
      ? '화면설계서 전달! 📋'
      : '좌측 자리로 이동 중';

  // 좌측 칠판(Zone 1: 기획자 머리 위) 진행률 (0 ~ 100%)
  const plannerBoardProgress =
    screenMode === 'wireframe'
      ? 100
      : pTick < 16
      ? Math.round((pTick / 16) * 25)
      : pTick < 32
      ? Math.round(25 + ((pTick - 16) / 16) * 25)
      : pTick < 58
      ? Math.min(100, Math.round(50 + ((pTick - 32) / 22) * 50))
      : 100;

  const isPlannerHandoffActive = pTick >= 66 && pTick < 82;

  // =========================================================================
  // 2) 캐릭터 2 · UI/UX 디자이너 (중앙 칠판(Zone 2) 아래에서 독립 주기 90틱으로 상시 움직임)
  //    - 0 ~ 14: 중앙(41%)에서 좌측 기획자 쪽(33.5%)으로 총총 걸어 이동
  //    - 14 ~ 26: 좌측 기획자로부터 화면설계서 두 손으로 수령 (✨)
  //    - 26 ~ 56: 중앙 칠판 아래(41%)에서 팔레트와 펜툴로 시선닷컴 Figma UI 디자인 작업 (🎨)
  //    - 56 ~ 68: 우측 퍼블리셔 쪽(48.5%)으로 총총 걸어 이동
  //    - 68 ~ 80: 완성된 컬러 UI 디자인 시안 보드 전달 포즈
  //    - 80 ~ 90: 다시 중앙(41%)으로 총총 걸어 복귀
  // =========================================================================
  const dTick = (tick + 22) % 90;
  const isDesignerWalking = dTick < 14 || (dTick >= 56 && dTick < 68) || dTick >= 80;
  const designerMotion = getCharacterMotion(isDesignerWalking, subTick, 7);

  const getDesignerLeft = (): number => {
    if (dTick < 14) return 41.0 - easeInOut(dTick / 14) * 7.5; // 41.0% -> 33.5%
    if (dTick < 26) return 33.5;
    if (dTick < 34) return 33.5 + easeInOut((dTick - 26) / 8) * 7.5; // 33.5% -> 41.0%
    if (dTick < 56) return 41.0;
    if (dTick < 68) return 41.0 + easeInOut((dTick - 56) / 12) * 7.5; // 41.0% -> 48.5%
    if (dTick < 80) return 48.5;
    return 48.5 - easeInOut((dTick - 80) / 10) * 7.5; // 48.5% -> 41.0%
  };

  const designerLeft = getDesignerLeft();

  const designerSprite: string =
    isDesignerWalking || (dTick >= 26 && dTick < 32)
      ? getWalkSubSprite(subTick, 5)
      : dTick < 26
      ? `receive-${getInteractSubFrame(subTick, 3)}`
      : dTick < 56
      ? `work-${getWorkSubFrame(subTick, 3)}`
      : `handoff-${getInteractSubFrame(subTick, 3)}`;

  // 우측으로 이동할 때(26~34, 56~68) 또는 우측 퍼블리셔에게 디자인 시안을 건넬 때(68~80) 좌우 반전
  const designerFlipRight = (dTick >= 26 && dTick < 32) || (dTick >= 56 && dTick < 80);

  const designerActionLabel =
    dTick < 14
      ? '기획자에게 걸어가는 중'
      : dTick < 26
      ? '화면설계서 수령 완료 ✨'
      : dTick < 56
      ? 'Figma UI 디자인 리뉴얼 중 🎨'
      : dTick < 68
      ? '퍼블리셔에게 이동 중'
      : dTick < 80
      ? 'UI 디자인 시안 전달! 🎨'
      : '중앙 자리로 이동 중';

  // 중앙 칠판(Zone 2: 디자이너 머리 위) 진행률 (0 ~ 100%)
  const designerBoardProgress =
    screenMode === 'design'
      ? 100
      : dTick < 14
      ? Math.round((dTick / 14) * 20)
      : dTick < 26
      ? Math.round(20 + ((dTick - 14) / 12) * 20)
      : dTick < 56
      ? Math.min(100, Math.round(40 + ((dTick - 26) / 26) * 60))
      : 100;

  const isDesignerHandoffActive = dTick >= 66 && dTick < 82;

  // =========================================================================
  // 3) 캐릭터 3 · 여성 웹 퍼블리셔 (하얀색 영역의 우측 끝(81.5%)에서부터 등장!)
  //    - 0 ~ 14: 우측 끝(81.5%)에서 디자이너 쪽(64.5%)으로 노트북 들고 총총 걸어옴
  //    - 14 ~ 26: 디자이너가 건넨 컬러 UI 디자인 시안 보드 수령 (✨)
  //    - 26 ~ 60: 우측 칠판(Zone 3) 아래(72.5%)에서 HTML5/CSS3 반응형 마크업 코딩 타이핑 (</> { })
  //    - 60 ~ 78: 시선닷컴(sisun.com) 반응형 웹 배포 완료 환호! (<HTML/> 🎉)
  //    - 78 ~ 90: 다시 우측 끝(81.5%)으로 총총 걸어 이동
  // =========================================================================
  const pubTick = (tick + 48) % 90;
  const isPublisherWalking = pubTick < 14 || (pubTick >= 26 && pubTick < 32) || pubTick >= 78;
  const publisherMotion = getCharacterMotion(isPublisherWalking, subTick, 13);

  const getPublisherLeft = (): number => {
    if (pubTick < 14) return 81.5 - easeInOut(pubTick / 14) * 17.0; // 81.5%(우측 끝) -> 64.5%
    if (pubTick < 26) return 64.5;
    if (pubTick < 32) return 64.5 + easeInOut((pubTick - 26) / 6) * 8.0; // 64.5% -> 72.5%(Zone 3 중앙)
    if (pubTick < 78) return 72.5;
    return 72.5 + easeInOut((pubTick - 78) / 12) * 9.0; // 72.5% -> 81.5%(우측 끝)
  };

  const publisherLeft = getPublisherLeft();

  const publisherSprite: string = isPublisherWalking
    ? getWalkSubSprite(subTick, 11)
    : pubTick < 26
    ? `receive-${getInteractSubFrame(subTick, 7)}`
    : pubTick < 60
    ? `code-${getWorkSubFrame(subTick, 7)}`
    : `complete-${getInteractSubFrame(subTick, 7)}`;

  // 우측으로 걸어 이동할 때(26~32, 78~90) 우측 방향으로 반전
  const publisherFlipRight = (pubTick >= 26 && pubTick < 32) || pubTick >= 78;

  const publisherActionLabel =
    pubTick < 14
      ? '우측 끝에서 걸어 등장 중'
      : pubTick < 26
      ? '디자인 시안 수령 완료 ✨'
      : pubTick < 60
      ? 'HTML/CSS 반응형 코딩 중 💻'
      : pubTick < 78
      ? '시선닷컴 LIVE 배포 완료! 🎉'
      : '우측 끝 자리로 이동 중';

  // 우측 칠판(Zone 3: 퍼블리셔 머리 위) 진행률 (0 ~ 100%)
  const publisherBoardProgress =
    screenMode === 'publishing'
      ? 100
      : pubTick < 14
      ? Math.round((pubTick / 14) * 18)
      : pubTick < 26
      ? Math.round(18 + ((pubTick - 14) / 12) * 17)
      : pubTick < 60
      ? Math.min(100, Math.round(35 + ((pubTick - 26) / 30) * 65))
      : 100;

  const isPublisherLiveCelebration =
    screenMode === 'publishing' ? subTick % 80 >= 45 : pubTick >= 60 && pubTick < 80;

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
        padding: '20px 18px 24px',
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
          marginBottom: '14px',
          padding: '0 6px 12px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            <Sparkles size={13} color="#059669" />
            시선닷컴(sisun.com) UI/UX 개편 라이브 칠판 스튜디오
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            각 캐릭터 머리 위의 칠판 구역에서 [① 와이어프레임 설계 · ② Figma 디자인 · ③ HTML/CSS 퍼블리싱]이 동시에 진행됩니다
          </span>
        </div>

        {/* 재생/일시정지 및 칠판 하이라이트 모드 선택 버튼 */}
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
            <RotateCcw size={12} /> 3인 동시 라이브
          </button>

          {[
            { mode: 'wireframe' as const, label: '① 기획 칠판 100%', color: '#dbeafe', text: '#1e3a8a', icon: <Sparkles size={11} /> },
            { mode: 'design' as const, label: '② 디자인 칠판 100%', color: '#d1fae5', text: '#065f46', icon: <Palette size={11} /> },
            { mode: 'publishing' as const, label: '③ 퍼블리싱 칠판 100%', color: '#ede9fe', text: '#5b21b6', icon: <Code2 size={11} /> },
          ].map((btn) => {
            const isSelected = screenMode === btn.mode;
            return (
              <button
                key={btn.mode}
                onClick={() => setScreenMode(btn.mode)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
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
                {btn.icon}
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          메인 애니메이션 무대 (좌/우 여백 없이 100% 풀와이드 구성)
          - 상단: 원목 프레임 격자 칠판 (높이 392px 완전 고정, 3분할 구역)
          - 하단: 큼직해진 2등신 캐릭터 3총사 (좌측 끝 / 중앙 / 우측 끝에서 동시 액션)
         ======================================================================= */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* =====================================================================
            1. 상단 풀와이드 원목 칠판 판넬 (높이 완전 고정: 392px)
               - 두 번째 첨부 이미지의 원목 테두리 + 짙은 녹색 모눈 칠판 + 컬러 자석 완벽 재현
               - 캐릭터 각각의 머리 위 3개 구역(기획 / 디자인 / 퍼블리싱)으로 명확히 구분
           ===================================================================== */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '392px',
            boxSizing: 'border-box',
            // 원목 프레임 질감 (베벨 입체 테두리)
            background:
              'linear-gradient(180deg, #e7c196 0%, #d3a26f 22%, #c5915d 80%, #b37e4a 100%)',
            padding: '13px 14px 16px',
            borderRadius: '12px',
            border: '2px solid #a87442',
            boxShadow:
              '0 14px 32px rgba(15, 23, 42, 0.14), inset 0 2px 2px rgba(255, 255, 255, 0.55), inset 0 -3px 5px rgba(92, 57, 25, 0.45)',
          }}
        >
          {/* 원목 프레임 네 모서리 사선 이음매(Miter Joint) 디테일 */}
          <div
            style={{
              position: 'absolute',
              inset: '3px',
              border: '1px solid rgba(120, 74, 34, 0.28)',
              borderRadius: '9px',
              pointerEvents: 'none',
            }}
          />

          {/* 칠판 하단 분필 받침대 (Wooden Chalk Ledge - 참고 이미지 하단 디테일) */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '14%',
              right: '14%',
              height: '8px',
              background: 'linear-gradient(180deg, #dfb484 0%, #b8824e 100%)',
              border: '1px solid #966536',
              borderRadius: '0 0 5px 5px',
              boxShadow: '0 4px 8px rgba(15, 23, 42, 0.18)',
              zIndex: 4,
            }}
          />
          {/* 받침대 위 작은 흰색/노란색 분필 디테일 */}
          <div
            style={{
              position: 'absolute',
              bottom: '1px',
              left: '28%',
              width: '28px',
              height: '5px',
              borderRadius: '2px',
              background: '#f8fafc',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '1px',
              left: '62%',
              width: '24px',
              height: '5px',
              borderRadius: '2px',
              background: '#fde047',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              zIndex: 5,
            }}
          />

          {/* 칠판 내부 짙은 녹색 모눈(Grid) 보드 영역 (높이 100% 고정, overflow hidden) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#06462e',
              backgroundImage:
                'linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px), radial-gradient(ellipse at 50% 45%, #0a583b 0%, #053b26 100%)',
              backgroundSize: '24px 24px, 24px 24px, 100% 100%',
              boxShadow: 'inset 0 3px 10px rgba(0, 0, 0, 0.55)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {/* =================================================================
                [칠판 ZONE 1 · 좌측] 서비스기획자 머리 위: Mobile & PC 와이어프레임 설계
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '12px 14px',
                boxSizing: 'border-box',
                borderRight: '1.5px dashed rgba(255, 255, 255, 0.16)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  screenMode === 'wireframe'
                    ? 'rgba(56, 189, 248, 0.08)'
                    : 'transparent',
                transition: 'background 0.3s',
              }}
            >
              {/* Zone 1 상단 고정 헤더 (높이 28px 고정) */}
              <div
                style={{
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
                  paddingBottom: '6px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {/* 입체 자석 (민트색) */}
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #5eead4, #0d9488)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.45)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#e0f2fe',
                      letterSpacing: '0.3px',
                    }}
                  >
                    STEP 01 · 기획 와이어프레임 (SB)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#fde047',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid rgba(253, 224, 71, 0.35)',
                  }}
                >
                  설계 {plannerBoardProgress}%
                </span>
              </div>

              {/* Zone 1 메인 칠판 스케치 캔버스 (SVG 고정 뷰박스) */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', paddingTop: '6px' }}>
                <svg viewBox="0 0 360 285" width="100%" height="100%" style={{ display: 'block' }}>
                  {/* 좌측: Mobile 와이어프레임 분필 도면 */}
                  <g>
                    <text x="62" y="13" fontSize="9.5" fontWeight="bold" fill="#93c5fd" textAnchor="middle">
                      📱 Mobile (390px)
                    </text>
                    <rect
                      x="8"
                      y="20"
                      width="108"
                      height="232"
                      rx="12"
                      fill="rgba(15, 23, 42, 0.38)"
                      stroke="#bae6fd"
                      strokeWidth="1.8"
                    />
                    {/* 상단 GNB */}
                    <g style={{ opacity: plannerBoardProgress >= 12 ? 1 : 0.2, transition: 'opacity 0.25s' }}>
                      <rect
                        x="15"
                        y="30"
                        width="94"
                        height="18"
                        rx="3"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth="1.3"
                      />
                      <line x1="20" y1="36" x2="28" y2="36" stroke="#bae6fd" strokeWidth="1.4" />
                      <line x1="20" y1="41" x2="28" y2="41" stroke="#bae6fd" strokeWidth="1.4" />
                      <text x="62" y="42" fontSize="7.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        SISUN.COM
                      </text>
                    </g>

                    {/* 메인 풀스크린 룩북 배너 와이어프레임 */}
                    <g style={{ opacity: plannerBoardProgress >= 30 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      <rect
                        x="15"
                        y="54"
                        width="94"
                        height="76"
                        rx="4"
                        fill="rgba(56, 189, 248, 0.1)"
                        stroke="#7dd3fc"
                        strokeWidth="1.4"
                        strokeDasharray="4 2"
                      />
                      <line x1="15" y1="54" x2="109" y2="130" stroke="rgba(125, 211, 252, 0.45)" strokeWidth="1.1" />
                      <line x1="109" y1="54" x2="15" y2="130" stroke="rgba(125, 211, 252, 0.45)" strokeWidth="1.1" />
                      <rect
                        x="25"
                        y="81"
                        width="74"
                        height="20"
                        rx="3"
                        fill="#06462e"
                        stroke="#fde047"
                        strokeWidth="1.2"
                      />
                      <text x="62" y="94" fontSize="7.5" fontWeight="bold" fill="#fde047" textAnchor="middle">
                        풀스크린 화보 배너
                      </text>
                    </g>

                    {/* 2열 상품 그리드 와이어프레임 */}
                    <g style={{ opacity: plannerBoardProgress >= 55 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      <rect
                        x="15"
                        y="137"
                        width="44"
                        height="64"
                        rx="3"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.3"
                      />
                      <line x1="15" y1="137" x2="59" y2="180" stroke="rgba(203,213,225,0.4)" strokeWidth="1" />
                      <text x="37" y="193" fontSize="6.8" fill="#e2e8f0" textAnchor="middle">
                        상품 01
                      </text>

                      <rect
                        x="65"
                        y="137"
                        width="44"
                        height="64"
                        rx="3"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="1.3"
                      />
                      <line x1="65" y1="137" x2="109" y2="180" stroke="rgba(203,213,225,0.4)" strokeWidth="1" />
                      <text x="87" y="193" fontSize="6.8" fill="#e2e8f0" textAnchor="middle">
                        상품 02
                      </text>
                    </g>

                    {/* 하단 원클릭 구매 고정 바 */}
                    <g style={{ opacity: plannerBoardProgress >= 80 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      <rect
                        x="15"
                        y="208"
                        width="94"
                        height="34"
                        rx="5"
                        fill="rgba(253, 224, 71, 0.14)"
                        stroke="#fde047"
                        strokeWidth="1.4"
                      />
                      <text x="62" y="223" fontSize="7.2" fontWeight="bold" fill="#fef08a" textAnchor="middle">
                        ✓ 엄지 영역 Floating Bar
                      </text>
                      <text x="62" y="235" fontSize="6.8" fill="#bae6fd" textAnchor="middle">
                        [AI 사이즈 추천 / 원클릭 구매]
                      </text>
                    </g>
                  </g>

                  {/* 우측: PC 와이드 화면설계서 분필 도면 */}
                  <g>
                    <text x="242" y="13" fontSize="9.5" fontWeight="bold" fill="#93c5fd" textAnchor="middle">
                      🖥️ PC Wide Wireframe (1440px)
                    </text>
                    <rect
                      x="128"
                      y="20"
                      width="224"
                      height="232"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.38)"
                      stroke="#bae6fd"
                      strokeWidth="1.8"
                    />
                    {/* PC 상단 GNB */}
                    <g style={{ opacity: plannerBoardProgress >= 20 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      <rect
                        x="136"
                        y="28"
                        width="208"
                        height="20"
                        rx="3"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth="1.2"
                      />
                      <text x="144" y="41" fontSize="7.5" fontWeight="bold" fill="#ffffff">
                        SISUN
                      </text>
                      <text x="184" y="41" fontSize="6.8" fill="#bae6fd">
                        MICHAA · it MICHAA · E.B.M · LOOKBOOK
                      </text>
                    </g>

                    {/* PC 히어로 + AI 큐레이션 분할 레이아웃 */}
                    <g style={{ opacity: plannerBoardProgress >= 45 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      <rect
                        x="136"
                        y="55"
                        width="132"
                        height="84"
                        rx="4"
                        fill="rgba(56, 189, 248, 0.1)"
                        stroke="#7dd3fc"
                        strokeWidth="1.4"
                        strokeDasharray="4 2"
                      />
                      <line x1="136" y1="55" x2="268" y2="139" stroke="rgba(125, 211, 252, 0.4)" strokeWidth="1" />
                      <line x1="268" y1="55" x2="136" y2="139" stroke="rgba(125, 211, 252, 0.4)" strokeWidth="1" />
                      <rect
                        x="156"
                        y="85"
                        width="92"
                        height="22"
                        rx="3"
                        fill="#06462e"
                        stroke="#bae6fd"
                        strokeWidth="1.2"
                      />
                      <text x="202" y="99" fontSize="7.5" fontWeight="bold" fill="#e0f2fe" textAnchor="middle">
                        26 FW 캠페인 와이드 배너
                      </text>

                      {/* 우측 AI 코디 추천 위젯 설계 */}
                      <rect
                        x="274"
                        y="55"
                        width="70"
                        height="84"
                        rx="4"
                        fill="rgba(253, 224, 71, 0.1)"
                        stroke="#fde047"
                        strokeWidth="1.4"
                      />
                      <text x="309" y="70" fontSize="7.2" fontWeight="bold" fill="#fde047" textAnchor="middle">
                        [AI 맞춤 코디]
                      </text>
                      <rect x="281" y="77" width="25" height="36" rx="2" fill="none" stroke="#fef08a" strokeWidth="1" />
                      <rect x="312" y="77" width="25" height="36" rx="2" fill="none" stroke="#fef08a" strokeWidth="1" />
                      <text x="309" y="128" fontSize="6.5" fill="#fef08a" textAnchor="middle">
                        개인화 추천 알고리즘
                      </text>
                    </g>

                    {/* PC 4열 상품 그리드 설계 */}
                    <g style={{ opacity: plannerBoardProgress >= 70 ? 1 : 0.15, transition: 'opacity 0.25s' }}>
                      {[0, 1, 2, 3].map((idx) => {
                        const bx = 136 + idx * 53;
                        return (
                          <g key={idx}>
                            <rect
                              x={bx}
                              y="148"
                              width="49"
                              height="62"
                              rx="3"
                              fill="none"
                              stroke="#cbd5e1"
                              strokeWidth="1.2"
                            />
                            <line
                              x1={bx}
                              y1="148"
                              x2={bx + 49}
                              y2="188"
                              stroke="rgba(203,213,225,0.35)"
                              strokeWidth="1"
                            />
                            <text x={bx + 24.5} y="201" fontSize="6.5" fill="#e2e8f0" textAnchor="middle">
                              ITEM 0{idx + 1}
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* 기획 주석(Annotation) 콜아웃 */}
                    <g style={{ opacity: plannerBoardProgress >= 88 ? 1 : 0.2, transition: 'opacity 0.25s' }}>
                      <rect
                        x="136"
                        y="217"
                        width="208"
                        height="26"
                        rx="4"
                        fill="rgba(16, 185, 129, 0.18)"
                        stroke="#6ee7b7"
                        strokeWidth="1.2"
                      />
                      <text x="240" y="234" fontSize="7.8" fontWeight="bold" fill="#a7f3d0" textAnchor="middle">
                        📐 기획 주석: 탐색➔구매 클릭 뎁스 4단계➔2단계 단축 (이탈률 -15%)
                      </text>
                    </g>
                  </g>

                  {/* 실시간 움직이는 분필 스케치 펜 커서 */}
                  <g
                    style={{
                      transform: `translate(${40 + (plannerBoardProgress * 2.4) % 260}px, ${
                        65 + Math.sin(subTick * 0.25) * 45
                      }px)`,
                      transition: 'transform 0.08s linear',
                    }}
                  >
                    <circle cx="0" cy="0" r="11" fill="rgba(253, 224, 71, 0.22)" stroke="#fde047" strokeWidth="1.5" />
                    <text x="0" y="4" fontSize="11" textAnchor="middle">
                      ✏️
                    </text>
                  </g>

                  {/* 하단 상태 바 */}
                  <text x="10" y="274" fontSize="9" fontWeight="bold" fill="#bae6fd">
                    {isPlannerHandoffActive
                      ? '📋 화면설계서(SB v2.4) 작성 완료 ➔ 디자이너에게 인계 중!'
                      : '💡 IA 메뉴 구조도 · 화면설계서(Wireframe) 실시간 드로잉'}
                  </text>
                </svg>
              </div>
            </div>

            {/* =================================================================
                [칠판 ZONE 2 · 중앙] UI/UX 디자이너 머리 위: Figma 고해상도 UI 디자인
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '12px 14px',
                boxSizing: 'border-box',
                borderRight: '1.5px dashed rgba(255, 255, 255, 0.16)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  screenMode === 'design'
                    ? 'rgba(236, 72, 153, 0.08)'
                    : 'transparent',
                transition: 'background 0.3s',
              }}
            >
              {/* Zone 2 상단 고정 헤더 (높이 28px 고정) */}
              <div
                style={{
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
                  paddingBottom: '6px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {/* 입체 자석 (노란색) */}
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #fef08a, #eab308)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.45)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#fce7f3',
                      letterSpacing: '0.3px',
                    }}
                  >
                    STEP 02 · Figma UI/UX 디자인
                  </span>
                </div>

                {/* 컬러 토큰 칩 + 진행률 배지 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {['#0f172a', '#be185d', '#ec4899', '#10b981'].map((hex) => (
                    <span
                      key={hex}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: hex,
                        border: '1px solid rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                  <span
                    style={{
                      marginLeft: '3px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: '#fbcfe8',
                      background: 'rgba(236, 72, 153, 0.22)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      border: '1px solid rgba(244, 114, 182, 0.45)',
                    }}
                  >
                    그래픽 {designerBoardProgress}%
                  </span>
                </div>
              </div>

              {/* Zone 2 메인 Figma 고해상도 컬러 UI 아트보드 (SVG 고정 뷰박스) */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', paddingTop: '6px' }}>
                <svg viewBox="0 0 360 285" width="100%" height="100%" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="boardHeroGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1e1b4b" />
                      <stop offset="55%" stopColor="#831843" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                    <linearGradient id="boardMobileGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fdf2f8" />
                      <stop offset="100%" stopColor="#f3e8ff" />
                    </linearGradient>
                  </defs>

                  {/* 좌측: Mobile Figma 고해상도 컬러 시안 */}
                  <g>
                    <text x="62" y="13" fontSize="9.5" fontWeight="bold" fill="#f9a8d4" textAnchor="middle">
                      🎨 Mobile_UI_v2
                    </text>
                    <rect
                      x="8"
                      y="20"
                      width="108"
                      height="232"
                      rx="12"
                      fill="#ffffff"
                      stroke="#f472b6"
                      strokeWidth="2"
                    />
                    {/* 다크 럭셔리 헤더 */}
                    <rect x="13" y="26" width="98" height="20" rx="5" fill="#0f172a" />
                    <text x="21" y="39" fontSize="8" fontWeight="bold" fill="#ffffff" letterSpacing="1">
                      SISUN
                    </text>
                    <rect x="76" y="30" width="28" height="12" rx="6" fill="#f43f5e" />
                    <text x="90" y="38.5" fontSize="6.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      26 FW
                    </text>

                    {/* 모바일 컬러 룩북 배너 */}
                    <g style={{ opacity: designerBoardProgress >= 25 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                      <rect
                        x="13"
                        y="51"
                        width="98"
                        height="78"
                        rx="6"
                        fill="url(#boardMobileGrad)"
                        stroke="#ec4899"
                        strokeWidth="1.2"
                      />
                      <circle cx="88" cy="78" r="11" fill="#f9a8d4" />
                      <path d="M74 124 C75 94, 101 94, 102 124 Z" fill="#be185d" />
                      <text x="19" y="67" fontSize="6.5" fontWeight="bold" fill="#9d174d">
                        MICHAA · it MICHAA
                      </text>
                      <text x="19" y="81" fontSize="9" fontWeight="bold" fill="#0f172a">
                        TIMELESS
                      </text>
                      <text x="19" y="92" fontSize="9" fontWeight="bold" fill="#be185d">
                        ELEGANCE
                      </text>
                      <rect x="19" y="101" width="52" height="15" rx="7.5" fill="#0f172a" />
                      <text x="45" y="111" fontSize="6.2" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        컬렉션 보기 →
                      </text>
                    </g>

                    {/* 모바일 컬러 상품 카드 2종 */}
                    <g style={{ opacity: designerBoardProgress >= 55 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                      <rect x="13" y="135" width="46" height="68" rx="5" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.2" />
                      <text x="36" y="162" fontSize="15" textAnchor="middle">
                        🧥
                      </text>
                      <text x="36" y="182" fontSize="6.5" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                        캐시미어 코트
                      </text>
                      <text x="36" y="194" fontSize="6.5" fontWeight="bold" fill="#e11d48" textAnchor="middle">
                        ♥ 1.2k
                      </text>

                      <rect x="65" y="135" width="46" height="68" rx="5" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.2" />
                      <text x="88" y="162" fontSize="15" textAnchor="middle">
                        👗
                      </text>
                      <text x="88" y="182" fontSize="6.5" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                        트위드 셋업
                      </text>
                      <text x="88" y="194" fontSize="6.5" fontWeight="bold" fill="#e11d48" textAnchor="middle">
                        ♥ 980
                      </text>
                    </g>

                    {/* 모바일 하단 컬러 CTA 바 */}
                    <g style={{ opacity: designerBoardProgress >= 75 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                      <rect x="13" y="210" width="98" height="34" rx="7" fill="#0f172a" />
                      <rect x="17" y="216" width="46" height="22" rx="5" fill="#ec4899" />
                      <text x="40" y="230" fontSize="6.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        ⚡ AI 사이즈
                      </text>
                      <text x="86" y="230" fontSize="6.5" fontWeight="bold" fill="#f8fafc" textAnchor="middle">
                        🛍️ 바로구매
                      </text>
                    </g>
                  </g>

                  {/* 우측: PC Figma 고해상도 와이드 아트보드 */}
                  <g>
                    <text x="242" y="13" fontSize="9.5" fontWeight="bold" fill="#f9a8d4" textAnchor="middle">
                      ✨ PC_Desktop_Renewal (Design System v2.0)
                    </text>
                    <rect
                      x="128"
                      y="20"
                      width="224"
                      height="232"
                      rx="8"
                      fill="#ffffff"
                      stroke="#f472b6"
                      strokeWidth="2"
                    />
                    {/* PC 다크 GNB */}
                    <rect x="134" y="26" width="212" height="22" rx="4" fill="#0f172a" />
                    <text x="142" y="40" fontSize="8" fontWeight="bold" fill="#ffffff" letterSpacing="1.2">
                      SISUN.COM
                    </text>
                    <text x="196" y="40" fontSize="6.5" fill="#cbd5e1">
                      MICHAA · it MICHAA · E.B.M · S SOLEZIA
                    </text>
                    <rect x="306" y="30" width="34" height="14" rx="7" fill="#ec4899" />
                    <text x="323" y="39.5" fontSize="6.2" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      LOOKBOOK
                    </text>

                    {/* PC 메인 캠페인 화보 + AI 큐레이션 컬러 그래픽 */}
                    <g style={{ opacity: designerBoardProgress >= 35 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                      <rect
                        x="134"
                        y="53"
                        width="138"
                        height="86"
                        rx="6"
                        fill="url(#boardHeroGrad)"
                      />
                      <circle cx="242" cy="86" r="24" fill="rgba(244, 114, 182, 0.25)" />
                      <text x="144" y="70" fontSize="6.8" fontWeight="bold" fill="#f9a8d4" letterSpacing="0.8">
                        2026 FW CAMPAIGN
                      </text>
                      <text x="144" y="87" fontSize="11" fontWeight="bold" fill="#ffffff">
                        THE NEW ARCHIVE
                      </text>
                      <text x="144" y="100" fontSize="7" fill="#fce7f3">
                        시선닷컴 프리미엄 브랜드 화보
                      </text>
                      <rect x="144" y="110" width="72" height="17" rx="8.5" fill="#ffffff" />
                      <text x="180" y="121" fontSize="6.8" fontWeight="bold" fill="#831843" textAnchor="middle">
                        화보 감상하기 →
                      </text>

                      {/* 우측 AI 코디 카드 */}
                      <rect
                        x="277"
                        y="53"
                        width="69"
                        height="86"
                        rx="6"
                        fill="#fdf4ff"
                        stroke="#d8b4fe"
                        strokeWidth="1.4"
                      />
                      <rect x="283" y="59" width="57" height="13" rx="6.5" fill="#9333ea" />
                      <text x="311.5" y="68" fontSize="6.2" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        ✨ AI 스타일링
                      </text>
                      <text x="311.5" y="96" fontSize="16" textAnchor="middle">
                        🧥+👜
                      </text>
                      <text x="311.5" y="115" fontSize="6.8" fontWeight="bold" fill="#581c87" textAnchor="middle">
                        #오피스_캐시미어
                      </text>
                      <text x="311.5" y="128" fontSize="6.5" fontWeight="bold" fill="#9333ea" textAnchor="middle">
                        매칭 98%
                      </text>
                    </g>

                    {/* PC 4열 컬러 상품 카드 */}
                    <g style={{ opacity: designerBoardProgress >= 65 ? 1 : 0.25, transition: 'opacity 0.3s' }}>
                      {[
                        { brand: 'MICHAA', icon: '🧥', price: '1,290,000', bg: '#fef3c7' },
                        { brand: 'it MICHAA', icon: '👚', price: '459,000', bg: '#fce7f3' },
                        { brand: 'E.B.M', icon: '👖', price: '289,000', bg: '#e0e7ff' },
                        { brand: 'SOLEZIA', icon: '👗', price: '529,000', bg: '#d1fae5' },
                      ].map((item, idx) => {
                        const bx = 134 + idx * 54;
                        return (
                          <g key={item.brand}>
                            <rect
                              x={bx}
                              y="146"
                              width="50"
                              height="66"
                              rx="4"
                              fill="#ffffff"
                              stroke="#cbd5e1"
                              strokeWidth="1.1"
                            />
                            <rect x={bx + 3} y="149" width="44" height="34" rx="3" fill={item.bg} />
                            <text x={bx + 25} y="171" fontSize="13" textAnchor="middle">
                              {item.icon}
                            </text>
                            <text x={bx + 6} y="194" fontSize="6.2" fontWeight="bold" fill="#0f172a">
                              {item.brand}
                            </text>
                            <text x={bx + 6} y="205" fontSize="6.2" fontWeight="bold" fill="#be185d">
                              ₩{item.price}
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* Figma 컴포넌트 바운딩 박스 & 디자이너 마우스 커서 */}
                    <rect
                      x="133"
                      y="52"
                      width="140"
                      height="88"
                      rx="6"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <g
                      style={{
                        transform: `translate(${150 + (designerBoardProgress * 1.6) % 160}px, ${
                          85 + Math.cos(subTick * 0.22) * 40
                        }px)`,
                        transition: 'transform 0.08s linear',
                      }}
                    >
                      <polygon
                        points="0,0 0,12 4,9 8,14 10,12 6,7 12,7"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <rect x="8" y="8" width="66" height="15" rx="7.5" fill="#10b981" />
                      <text x="41" y="18" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                        🎨 UI Designer
                      </text>
                    </g>

                    {/* 하단 디자인 시스템 배지 */}
                    <rect
                      x="134"
                      y="218"
                      width="212"
                      height="25"
                      rx="4"
                      fill="#fdf2f8"
                      stroke="#f9a8d4"
                      strokeWidth="1.2"
                    />
                    <text x="240" y="234" fontSize="7.8" fontWeight="bold" fill="#9d174d" textAnchor="middle">
                      ✨ Auto-Layout · 컬러 토큰 · 반응형 브레이크포인트 에셋 완료
                    </text>
                  </g>

                  {/* 하단 상태 바 */}
                  <text x="10" y="274" fontSize="9" fontWeight="bold" fill="#fbcfe8">
                    {isDesignerHandoffActive
                      ? '🎨 Figma 고해상도 UI 시안 완성 ➔ 웹퍼블리셔에게 인계 중!'
                      : '🎨 브랜드 화보 배너 · 컬러 토큰 · Figma UI 컴포넌트 스타일링'}
                  </text>
                </svg>
              </div>
            </div>

            {/* =================================================================
                [칠판 ZONE 3 · 우측] 여성 웹 퍼블리셔 머리 위: HTML/CSS 코딩 & LIVE 배포
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '12px 14px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  screenMode === 'publishing'
                    ? 'rgba(167, 139, 250, 0.09)'
                    : 'transparent',
                transition: 'background 0.3s',
              }}
            >
              {/* Zone 3 상단 고정 헤더 (높이 28px 고정 + 참고 이미지 우측 상단 3색 자석 재현) */}
              <div
                style={{
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
                  paddingBottom: '6px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* 두 번째 참고 이미지 우측 상단의 초록/노랑/네이비 자석 3총사 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #6ee7b7, #059669)',
                        boxShadow: '0 2px 3px rgba(0,0,0,0.45)',
                      }}
                    />
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #fef08a, #ca8a04)',
                        boxShadow: '0 2px 3px rgba(0,0,0,0.45)',
                      }}
                    />
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #93c5fd, #1e3a8a)',
                        boxShadow: '0 2px 3px rgba(0,0,0,0.45)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#ede9fe',
                      letterSpacing: '0.3px',
                    }}
                  >
                    STEP 03 · HTML/CSS 반응형 퍼블리싱
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: isPublisherLiveCelebration ? '#86efac' : '#ddd6fe',
                    background: isPublisherLiveCelebration
                      ? 'rgba(22, 163, 74, 0.35)'
                      : 'rgba(139, 92, 246, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: `1px solid ${
                      isPublisherLiveCelebration
                        ? 'rgba(134, 239, 172, 0.6)'
                        : 'rgba(196, 181, 253, 0.45)'
                    }`,
                  }}
                >
                  {isPublisherLiveCelebration ? '🟢 LIVE 배포완료' : `마크업 ${publisherBoardProgress}%`}
                </span>
              </div>

              {/* Zone 3 메인 VS Code 에디터 + 반응형 멀티 디바이스 LIVE 프리뷰 (SVG 고정 뷰박스) */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', paddingTop: '6px' }}>
                <svg viewBox="0 0 360 285" width="100%" height="100%" style={{ display: 'block' }}>
                  {/* 상단: VS Code 다크 글래스 코드 에디터 창 */}
                  <g>
                    <rect
                      x="6"
                      y="6"
                      width="348"
                      height="142"
                      rx="8"
                      fill="rgba(15, 23, 42, 0.92)"
                      stroke="#a78bfa"
                      strokeWidth="1.6"
                    />
                    {/* 에디터 탭 바 */}
                    <rect x="6" y="6" width="348" height="22" rx="8" fill="#1e293b" />
                    <circle cx="18" cy="17" r="3.5" fill="#f87171" />
                    <circle cx="29" cy="17" r="3.5" fill="#fbbf24" />
                    <circle cx="40" cy="17" r="3.5" fill="#34d399" />
                    <text x="54" y="20" fontSize="8" fontWeight="bold" fill="#c4b5fd" fontFamily="monospace">
                      sisun_main_renewal.html &nbsp;|&nbsp; responsive_grid.css
                    </text>

                    {/* 실시간 타이핑 코드 라인들 */}
                    <text x="16" y="42" fontSize="8.2" fill="#94a3b8" fontFamily="monospace">
                      {'01 <!DOCTYPE html><html lang="ko">'}
                    </text>
                    {publisherBoardProgress >= 18 && (
                      <text x="16" y="56" fontSize="8.2" fill="#38bdf8" fontFamily="monospace">
                        {'02 <main class="sisun-2026-layout" data-theme="luxury">'}
                      </text>
                    )}
                    {publisherBoardProgress >= 34 && (
                      <text x="16" y="70" fontSize="8.2" fill="#f472b6" fontFamily="monospace">
                        {'03   <LookbookHero src="26fw_michaa.webp" priority />'}
                      </text>
                    )}
                    {publisherBoardProgress >= 50 && (
                      <text x="16" y="84" fontSize="8.2" fill="#fde047" fontFamily="monospace">
                        {'04   <AICurationWidget matchRate={98} responsive />'}
                      </text>
                    )}
                    {publisherBoardProgress >= 66 && (
                      <text x="16" y="98" fontSize="8.2" fill="#34d399" fontFamily="monospace">
                        {'05   @media (max-width:768px){ .grid{grid-template:1fr 1fr} }'}
                      </text>
                    )}
                    {publisherBoardProgress >= 82 && (
                      <text x="16" y="112" fontSize="8.2" fill="#c084fc" fontFamily="monospace">
                        {'06 </main> <!-- 웹표준·크로스브라우징·성능 최적화 100% -->'}
                      </text>
                    )}

                    {/* 에디터 하단 컴파일 게이지 바 */}
                    <rect x="16" y="122" width="328" height="16" rx="4" fill="#0f172a" stroke="#4c1d95" strokeWidth="1" />
                    <rect
                      x="18"
                      y="124"
                      width={Math.max(12, (324 * publisherBoardProgress) / 100)}
                      height="12"
                      rx="3"
                      fill="rgba(168, 85, 247, 0.35)"
                    />
                    <text x="24" y="133" fontSize="7.8" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                      {publisherBoardProgress < 100
                        ? `⚡ Compiling Semantic HTML5 & CSS3 Grid... (${publisherBoardProgress}%)`
                        : '✓ Build Success! Deployed to https://www.sisun.com'}
                    </text>
                  </g>

                  {/* 하단: 반응형 웹 렌더링 결과물 (Mobile 390px + PC 1440px 동시 검증 프리뷰) */}
                  <g>
                    {/* 좌측 미니 모바일 LIVE 프리뷰 */}
                    <rect
                      x="6"
                      y="156"
                      width="102"
                      height="96"
                      rx="7"
                      fill="#ffffff"
                      stroke={isPublisherLiveCelebration ? '#4ade80' : '#a78bfa'}
                      strokeWidth="1.8"
                    />
                    <rect x="11" y="161" width="92" height="13" rx="3" fill="#0f172a" />
                    <text x="57" y="170" fontSize="6.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">
                      m.sisun.com (390px)
                    </text>
                    <rect x="11" y="177" width="92" height="36" rx="4" fill="url(#boardMobileGrad)" />
                    <text x="57" y="198" fontSize="7" fontWeight="bold" fill="#be185d" textAnchor="middle">
                      📱 모바일 반응형 OK
                    </text>
                    <rect x="11" y="216" width="44" height="30" rx="3" fill="#fef3c7" />
                    <rect x="59" y="216" width="44" height="30" rx="3" fill="#e0e7ff" />

                    {/* 우측 PC 와이드 LIVE 프리뷰 + Lighthouse 성능 지표 */}
                    <rect
                      x="116"
                      y="156"
                      width="238"
                      height="96"
                      rx="7"
                      fill="#ffffff"
                      stroke={isPublisherLiveCelebration ? '#4ade80' : '#a78bfa'}
                      strokeWidth="1.8"
                    />
                    <rect x="122" y="161" width="226" height="14" rx="3" fill="#0f172a" />
                    <text x="130" y="170.5" fontSize="6.8" fontWeight="bold" fill="#4ade80">
                      🟢 https://www.sisun.com — Responsive Web LIVE
                    </text>

                    <rect x="122" y="179" width="142" height="44" rx="4" fill="url(#boardHeroGrad)" />
                    <text x="193" y="200" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      SISUN 2026 RENEWAL
                    </text>
                    <text x="193" y="213" fontSize="6.5" fill="#fbcfe8" textAnchor="middle">
                      CSS Grid · Flex · WebP 최적화
                    </text>

                    {/* 우측 Lighthouse 100점 게이지 카드 */}
                    <rect
                      x="269"
                      y="179"
                      width="79"
                      height="67"
                      rx="5"
                      fill="#f0fdf4"
                      stroke="#86efac"
                      strokeWidth="1.3"
                    />
                    <circle
                      cx="308.5"
                      cy="204"
                      r="15"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3"
                    />
                    <text x="308.5" y="207.5" fontSize="8.5" fontWeight="bold" fill="#15803d" textAnchor="middle">
                      99점
                    </text>
                    <text x="308.5" y="232" fontSize="6.5" fontWeight="bold" fill="#166534" textAnchor="middle">
                      웹표준·접근성
                    </text>
                    <text x="308.5" y="241" fontSize="6" fill="#15803d" textAnchor="middle">
                      크로스브라우징 PASS
                    </text>

                    {/* 하단 미니 4열 그리드 */}
                    {[0, 1, 2, 3].map((idx) => (
                      <rect
                        key={idx}
                        x={122 + idx * 36}
                        y="227"
                        width="32"
                        height="19"
                        rx="2.5"
                        fill="#f1f5f9"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />
                    ))}

                    {/* 퍼블리셔 배포 완료 시 뜨는 축하 뱃지 */}
                    {isPublisherLiveCelebration && (
                      <g>
                        <rect
                          x="126"
                          y="188"
                          width="218"
                          height="28"
                          rx="14"
                          fill="#5b21b6"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                        />
                        <text x="235" y="206" fontSize="9.2" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                          🎉 시선닷컴(sisun.com) 반응형 배포 완료!
                        </text>
                      </g>
                    )}
                  </g>

                  {/* 하단 상태 바 */}
                  <text x="10" y="274" fontSize="9" fontWeight="bold" fill="#ddd6fe">
                    {isPublisherLiveCelebration
                      ? '🎉 시선닷컴 Mobile & PC 반응형 웹 퍼블리싱 배포 완료!'
                      : '💻 HTML5 시맨틱 마크업 · CSS3 반응형 미디어쿼리 실시간 코딩'}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. 하단 캐릭터 동시 액션 무대 (고정 높이 300px, 캐릭터 35% 확대, 좌측 끝/우측 끝 등장)
           ===================================================================== */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '300px',
            background: '#ffffff',
            marginTop: '6px',
            overflow: 'hidden',
          }}
        >
          {/* 칠판 3개 구역과 캐릭터를 이어주는 은은한 수직 가이드 라인 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: '28px',
              left: '33.33%',
              borderLeft: '1px dashed #f1f5f9',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: '28px',
              left: '66.66%',
              borderLeft: '1px dashed #f1f5f9',
              pointerEvents: 'none',
            }}
          />

          {/* 바닥 가이드 라인 (은은한 점선) */}
          <div
            style={{
              position: 'absolute',
              bottom: '26px',
              left: '1%',
              right: '1%',
              height: '2px',
              background:
                'repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 16px)',
            }}
          />

          {/* ---------------- 주인공 1: 서비스기획자 (좌측 끝 0.5%에서부터 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${plannerLeft}%`,
              width: '236px',
              height: '268px',
              transition: 'left 0.055s linear',
              zIndex: 5,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                width: '96px',
                height: '15px',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0) 75%)',
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
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(30,58,138,0.22)',
                }}
              >
                1. 서비스기획자
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>
                {plannerActionLabel}
              </span>
            </div>
          </div>

          {/* ---------------- 주인공 2: UI/UX 디자이너 (중앙 칠판 아래 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${designerLeft}%`,
              width: '236px',
              height: '268px',
              transition: 'left 0.055s linear',
              zIndex: 6,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                width: '96px',
                height: '15px',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0) 75%)',
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
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(4,120,87,0.22)',
                }}
              >
                2. UI/UX 디자이너
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                {designerActionLabel}
              </span>
            </div>
          </div>

          {/* ---------------- 주인공 3: 웹 퍼블리셔 (우측 끝 81.5%에서부터 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: `${publisherLeft}%`,
              width: '236px',
              height: '268px',
              transition: 'left 0.055s linear',
              zIndex: 7,
            }}
          >
            {/* 발밑 동적 그림자 */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                width: '96px',
                height: '15px',
                borderRadius: '50%',
                background:
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0) 75%)',
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
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(109,40,217,0.22)',
                }}
              >
                3. 웹 퍼블리셔
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                {publisherActionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
