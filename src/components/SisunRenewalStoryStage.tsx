import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

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

  // 좌측 칠판(Zone 1: 기획자 머리 위) 진행률 (0 ~ 100%)
  const plannerBoardProgress =
    pTick < 16
      ? Math.round((pTick / 16) * 20)
      : pTick < 32
      ? Math.round(20 + ((pTick - 16) / 16) * 25)
      : pTick < 58
      ? Math.min(100, Math.round(45 + ((pTick - 32) / 22) * 55))
      : 100;

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

  // 중앙 칠판(Zone 2: 디자이너 머리 위) 진행률 (0 ~ 100%)
  const designerBoardProgress =
    dTick < 14
      ? Math.round((dTick / 14) * 15)
      : dTick < 26
      ? Math.round(15 + ((dTick - 14) / 12) * 20)
      : dTick < 56
      ? Math.min(100, Math.round(35 + ((dTick - 26) / 26) * 65))
      : 100;

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

  // 우측 칠판(Zone 3: 퍼블리셔 머리 위) 진행률 (0 ~ 100%)
  const publisherBoardProgress =
    pubTick < 14
      ? Math.round((pubTick / 14) * 15)
      : pubTick < 26
      ? Math.round(15 + ((pubTick - 14) / 12) * 15)
      : pubTick < 60
      ? Math.min(100, Math.round(30 + ((pubTick - 26) / 30) * 70))
      : 100;

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
        padding: '12px 18px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 우측 상단 미니 플레이/정지 아이콘 버튼 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '6px',
        }}
      >
        <button
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? '정지' : '재생'}
          aria-label={isPlaying ? '정지' : '재생'}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: isPlaying ? '#0f172a' : '#2563eb',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(15, 23, 42, 0.12)',
            transition: 'background 0.2s',
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>

      {/* =======================================================================
          메인 애니메이션 무대 (좌/우 여백 없이 100% 풀와이드 구성)
          - 상단: 원목 프레임 격자 칠판 (높이 392px 완전 고정, 3분할 구역)
          - 하단: 큼직해진 2등신 캐릭터 3총사 (칠판과 가깝게 밀착, 좌측 끝 / 중앙 / 우측 끝에서 동시 액션)
         ======================================================================= */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
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
                [칠판 ZONE 1 · 좌측] 기획자 머리 위: 심플하고 깔끔하게 그려지는 와이어프레임
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '14px 18px',
                boxSizing: 'border-box',
                borderRight: '1.5px dashed rgba(255, 255, 255, 0.14)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Zone 1 심플 헤더 */}
              <div
                style={{
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #5eead4, #0d9488)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#e0f2fe', letterSpacing: '0.2px' }}>
                  01. Wireframe
                </span>
              </div>

              {/* Zone 1 미니멀 와이어프레임 도면 (블록이 순서대로 깔끔하게 그려짐) */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <svg viewBox="0 0 340 270" width="100%" height="100%" style={{ display: 'block' }}>
                  {/* 외곽 브라우저 프레임 */}
                  <rect
                    x="4"
                    y="4"
                    width="332"
                    height="258"
                    rx="10"
                    fill="rgba(255, 255, 255, 0.03)"
                    stroke="rgba(224, 242, 254, 0.55)"
                    strokeWidth="1.6"
                  />

                  {/* 1단계: 상단 GNB 와이어프레임 */}
                  <g style={{ opacity: plannerBoardProgress >= 15 ? 1 : 0.12, transition: 'opacity 0.35s ease' }}>
                    <rect
                      x="16"
                      y="16"
                      width="308"
                      height="28"
                      rx="5"
                      fill="none"
                      stroke="#bae6fd"
                      strokeWidth="1.5"
                    />
                    <rect x="26" y="25" width="46" height="10" rx="2" fill="rgba(186, 230, 253, 0.45)" />
                    <line x1="96" y1="30" x2="132" y2="30" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
                    <line x1="146" y1="30" x2="182" y2="30" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
                    <line x1="196" y1="30" x2="232" y2="30" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="308" cy="30" r="5" fill="none" stroke="#bae6fd" strokeWidth="1.5" />
                  </g>

                  {/* 2단계: 메인 히어로 배너 + 우측 서브 배너 와이어프레임 */}
                  <g style={{ opacity: plannerBoardProgress >= 40 ? 1 : 0.12, transition: 'opacity 0.35s ease' }}>
                    <rect
                      x="16"
                      y="54"
                      width="206"
                      height="110"
                      rx="6"
                      fill="rgba(186, 230, 253, 0.06)"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />
                    <line x1="16" y1="54" x2="222" y2="164" stroke="rgba(125, 211, 252, 0.35)" strokeWidth="1.2" />
                    <line x1="222" y1="54" x2="16" y2="164" stroke="rgba(125, 211, 252, 0.35)" strokeWidth="1.2" />
                    <rect
                      x="74"
                      y="95"
                      width="90"
                      height="28"
                      rx="4"
                      fill="#06462e"
                      stroke="#bae6fd"
                      strokeWidth="1.4"
                    />
                    <text x="119" y="113" fontSize="9.5" fontWeight="bold" fill="#e0f2fe" textAnchor="middle">
                      HERO BANNER
                    </text>

                    {/* 우측 큐레이션 영역 박스 */}
                    <rect
                      x="232"
                      y="54"
                      width="92"
                      height="110"
                      rx="6"
                      fill="rgba(253, 224, 71, 0.05)"
                      stroke="#fde047"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />
                    <line x1="246" y1="74" x2="310" y2="74" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
                    <rect
                      x="244"
                      y="86"
                      width="68"
                      height="48"
                      rx="4"
                      fill="none"
                      stroke="rgba(254, 240, 138, 0.7)"
                      strokeWidth="1.3"
                    />
                    <line x1="256" y1="146" x2="300" y2="146" stroke="rgba(254, 240, 138, 0.6)" strokeWidth="1.8" strokeLinecap="round" />
                  </g>

                  {/* 3단계: 하단 4열 상품 카드 그리드 와이어프레임 */}
                  <g style={{ opacity: plannerBoardProgress >= 72 ? 1 : 0.12, transition: 'opacity 0.35s ease' }}>
                    {[0, 1, 2, 3].map((idx) => {
                      const bx = 16 + idx * 79;
                      return (
                        <g key={idx}>
                          <rect
                            x={bx}
                            y="176"
                            width="71"
                            height="74"
                            rx="5"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="1.4"
                          />
                          <rect
                            x={bx + 7}
                            y="183"
                            width="57"
                            height="40"
                            rx="3"
                            fill="rgba(255,255,255,0.04)"
                            stroke="rgba(203, 213, 225, 0.5)"
                            strokeWidth="1.1"
                          />
                          <line
                            x1={bx + 10}
                            y1="232"
                            x2={bx + 54}
                            y2="232"
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <line
                            x1={bx + 10}
                            y1="241"
                            x2={bx + 38}
                            y2="241"
                            stroke="rgba(203, 213, 225, 0.6)"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            {/* =================================================================
                [칠판 ZONE 2 · 중앙] 디자이너 머리 위: 심플하고 세련되게 완성되는 UI 디자인
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '14px 18px',
                boxSizing: 'border-box',
                borderRight: '1.5px dashed rgba(255, 255, 255, 0.14)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Zone 2 심플 헤더 */}
              <div
                style={{
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #fef08a, #eab308)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fce7f3', letterSpacing: '0.2px' }}>
                  02. UI / UX Design
                </span>
              </div>

              {/* Zone 2 미니멀 컬러 UI 디자인 보드 (와이어프레임과 동일한 구조에 컬러와 비주얼이 입혀짐) */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <svg viewBox="0 0 340 270" width="100%" height="100%" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="cleanHeroGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1e1b4b" />
                      <stop offset="55%" stopColor="#831843" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                    <linearGradient id="cleanSideGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fdf4ff" />
                      <stop offset="100%" stopColor="#f3e8ff" />
                    </linearGradient>
                  </defs>

                  {/* 깔끔한 화이트 UI 캔버스 */}
                  <rect
                    x="4"
                    y="4"
                    width="332"
                    height="258"
                    rx="10"
                    fill="#ffffff"
                    stroke="rgba(244, 114, 182, 0.7)"
                    strokeWidth="1.8"
                  />

                  {/* 1단계: 상단 다크 럭셔리 GNB 디자인 */}
                  <g style={{ opacity: designerBoardProgress >= 15 ? 1 : 0.18, transition: 'opacity 0.35s ease' }}>
                    <rect x="16" y="16" width="308" height="28" rx="6" fill="#0f172a" />
                    <text x="28" y="34" fontSize="10" fontWeight="bold" fill="#ffffff" letterSpacing="1.5">
                      SISUN.COM
                    </text>
                    <line x1="108" y1="30" x2="138" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="152" y1="30" x2="182" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="196" y1="30" x2="226" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <rect x="272" y="22" width="42" height="16" rx="8" fill="#ec4899" />
                    <text x="293" y="32.5" fontSize="7.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      26 FW
                    </text>
                  </g>

                  {/* 2단계: 메인 컬러 히어로 배너 + 우측 큐레이션 카드 디자인 */}
                  <g style={{ opacity: designerBoardProgress >= 42 ? 1 : 0.15, transition: 'opacity 0.35s ease' }}>
                    <rect x="16" y="54" width="206" height="110" rx="8" fill="url(#cleanHeroGrad)" />
                    <circle cx="182" cy="98" r="32" fill="rgba(244, 114, 182, 0.25)" />
                    <circle cx="160" cy="116" r="20" fill="rgba(253, 224, 71, 0.18)" />
                    <text x="30" y="78" fontSize="8" fontWeight="bold" fill="#f9a8d4" letterSpacing="1">
                      NEW COLLECTION
                    </text>
                    <text x="30" y="99" fontSize="14" fontWeight="bold" fill="#ffffff">
                      THE NEW ARCHIVE
                    </text>
                    <rect x="30" y="116" width="76" height="22" rx="11" fill="#ffffff" />
                    <text x="68" y="130" fontSize="8" fontWeight="bold" fill="#831843" textAnchor="middle">
                      LOOKBOOK →
                    </text>

                    {/* 우측 큐레이션 컬러 카드 */}
                    <rect
                      x="232"
                      y="54"
                      width="92"
                      height="110"
                      rx="8"
                      fill="url(#cleanSideGrad)"
                      stroke="#e9d5ff"
                      strokeWidth="1.4"
                    />
                    <rect x="246" y="66" width="64" height="16" rx="8" fill="#9333ea" />
                    <text x="278" y="77" fontSize="7.5" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      AI CURATION
                    </text>
                    <rect x="246" y="90" width="64" height="46" rx="6" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="278" y="119" fontSize="18" textAnchor="middle">
                      🧥
                    </text>
                    <line x1="258" y1="148" x2="298" y2="148" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* 3단계: 하단 4열 컬러 상품 카드 그리드 디자인 */}
                  <g style={{ opacity: designerBoardProgress >= 72 ? 1 : 0.15, transition: 'opacity 0.35s ease' }}>
                    {[
                      { bg: '#fef3c7', accent: '#d97706', icon: '🧥' },
                      { bg: '#fce7f3', accent: '#db2777', icon: '👚' },
                      { bg: '#e0e7ff', accent: '#4f46e5', icon: '👖' },
                      { bg: '#d1fae5', accent: '#059669', icon: '👗' },
                    ].map((card, idx) => {
                      const bx = 16 + idx * 79;
                      return (
                        <g key={idx}>
                          <rect
                            x={bx}
                            y="176"
                            width="71"
                            height="74"
                            rx="6"
                            fill="#ffffff"
                            stroke="#e2e8f0"
                            strokeWidth="1.4"
                          />
                          <rect x={bx + 6} y="182" width="59" height="42" rx="4" fill={card.bg} />
                          <text x={bx + 35.5} y="208" fontSize="15" textAnchor="middle">
                            {card.icon}
                          </text>
                          <line
                            x1={bx + 10}
                            y1="233"
                            x2={bx + 52}
                            y2="233"
                            stroke="#1e293b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          <line
                            x1={bx + 10}
                            y1="242"
                            x2={bx + 36}
                            y2="242"
                            stroke={card.accent}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </div>

            {/* =================================================================
                [칠판 ZONE 3 · 우측] 퍼블리셔 머리 위: 심플하고 깔끔하게 타이핑되는 코딩 화면
               ================================================================= */}
            <div
              style={{
                position: 'relative',
                height: '100%',
                padding: '14px 18px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Zone 3 심플 헤더 (우측 상단 3색 자석 포함) */}
              <div
                style={{
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#ede9fe', letterSpacing: '0.2px' }}>
                  03. HTML / CSS Code
                </span>

                {/* 두 번째 참고 이미지 우측 상단의 초록/노랑/네이비 자석 3개 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #6ee7b7, #059669)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  />
                  <span
                    style={{
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #fef08a, #ca8a04)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  />
                  <span
                    style={{
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, #93c5fd, #1e3a8a)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Zone 3 미니멀 코드 에디터 창 (코드가 한 줄씩 깔끔하게 타이핑됨) */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <svg viewBox="0 0 340 270" width="100%" height="100%" style={{ display: 'block' }}>
                  <rect
                    x="4"
                    y="4"
                    width="332"
                    height="258"
                    rx="10"
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke="rgba(167, 139, 250, 0.65)"
                    strokeWidth="1.6"
                  />
                  {/* 상단 윈도우 타이틀 바 */}
                  <rect x="4" y="4" width="332" height="28" rx="10" fill="#1e293b" />
                  <circle cx="20" cy="18" r="4" fill="#f87171" />
                  <circle cx="33" cy="18" r="4" fill="#fbbf24" />
                  <circle cx="46" cy="18" r="4" fill="#34d399" />
                  <text x="64" y="21" fontSize="9.5" fontWeight="bold" fill="#cbd5e1" fontFamily="monospace">
                    sisun_renewal.html
                  </text>

                  {/* 순차적으로 타이핑되는 심플한 코드 라인 */}
                  <text x="20" y="54" fontSize="9.5" fill="#64748b" fontFamily="monospace">
                    {'<!DOCTYPE html>'}
                  </text>

                  {publisherBoardProgress >= 16 && (
                    <text x="20" y="76" fontSize="9.5" fill="#38bdf8" fontFamily="monospace">
                      {'<header class="sisun-gnb">'}
                    </text>
                  )}
                  {publisherBoardProgress >= 28 && (
                    <text x="34" y="96" fontSize="9.5" fill="#e2e8f0" fontFamily="monospace">
                      {'<nav>SISUN · 26 FW</nav>'}
                    </text>
                  )}
                  {publisherBoardProgress >= 40 && (
                    <text x="20" y="116" fontSize="9.5" fill="#38bdf8" fontFamily="monospace">
                      {'</header>'}
                    </text>
                  )}

                  {publisherBoardProgress >= 52 && (
                    <text x="20" y="142" fontSize="9.5" fill="#f472b6" fontFamily="monospace">
                      {'<section class="hero-archive">'}
                    </text>
                  )}
                  {publisherBoardProgress >= 64 && (
                    <text x="34" y="162" fontSize="9.5" fill="#fde047" fontFamily="monospace">
                      {'<LookbookBanner responsive />'}
                    </text>
                  )}
                  {publisherBoardProgress >= 76 && (
                    <text x="20" y="182" fontSize="9.5" fill="#f472b6" fontFamily="monospace">
                      {'</section>'}
                    </text>
                  )}

                  {publisherBoardProgress >= 86 && (
                    <text x="20" y="208" fontSize="9.5" fill="#34d399" fontFamily="monospace">
                      {'.product-grid { display: grid; }'}
                    </text>
                  )}
                  {publisherBoardProgress >= 95 && (
                    <text x="20" y="232" fontSize="9.5" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                      {'✓ Responsive Web Build Complete'}
                    </text>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. 하단 캐릭터 동시 액션 무대 (칠판과 가깝게 밀착, 점선 및 하단 안내 멘트 제거)
           ===================================================================== */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '248px',
            background: '#ffffff',
            marginTop: '-10px',
            overflow: 'hidden',
          }}
        >
          {/* ---------------- 주인공 1: 기획자 (좌측 끝 0.5%에서부터 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
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
                bottom: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 14px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(30,58,138,0.22)',
                }}
              >
                기획자
              </div>
            </div>
          </div>

          {/* ---------------- 주인공 2: 디자이너 (중앙 칠판 아래 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
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
                bottom: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 14px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(4,120,87,0.22)',
                }}
              >
                디자이너
              </div>
            </div>
          </div>

          {/* ---------------- 주인공 3: 퍼블리셔 (우측 끝 81.5%에서부터 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
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
                bottom: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  background: '#6d28d9',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 14px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(109,40,217,0.22)',
                }}
              >
                퍼블리셔
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
