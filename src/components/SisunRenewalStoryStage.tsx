import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

// ============================================================================
// ★ [Zero-Flicker 하드웨어 가속 Canvas 스프라이트 캐시 & 프리로더 엔진] ★
// - 164개 개별 <img> DOM 노드의 opacity 전환 시 발생하는 브라우저 GPU 텍스처 Eviction 및
//   네트워크/디코딩 지연 구간의 투명 깜빡임(Blank Frame)을 원천 차단합니다.
// - 모든 프레임은 백그라운드 우선순위 큐에서 img.decode()까지 완료한 뒤 Ready 상태로 등록되며,
//   Canvas는 새 프레임이 100% 디코딩 완료된 경우에만 단일 동기 작업(clearRect + drawImage)으로
//   교체하고, 미완료 시 직전 유효 프레임을 그대로 유지하여 단 1ms의 깜빡임도 허용하지 않습니다.
// ============================================================================
const SPRITE_IMAGE_CACHE = new Map<string, HTMLImageElement>();
const SPRITE_READY_SET = new Set<string>();
const SPRITE_LOADING_SET = new Set<string>();
const SPRITE_LISTENERS = new Set<() => void>();

// GitHub Pages 호환 투명 PNG 이미지 경로 헬퍼 (모듈 레벨 고정)
const BASE_URL = import.meta.env.BASE_URL || './';
function charImgUrl(fileName: string): string {
  return `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}images/characters/${fileName}`;
}

function notifySpriteListeners() {
  SPRITE_LISTENERS.forEach((listener) => listener());
}

function loadAndDecodeSprite(url: string): Promise<void> {
  if (SPRITE_READY_SET.has(url)) {
    return Promise.resolve();
  }
  const existing = SPRITE_IMAGE_CACHE.get(url);
  if (existing && SPRITE_LOADING_SET.has(url)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const img = existing ?? new Image();
    img.decoding = 'async';
    if (!existing) {
      SPRITE_IMAGE_CACHE.set(url, img);
    }
    SPRITE_LOADING_SET.add(url);

    let settled = false;
    const finalize = (ok: boolean) => {
      if (settled) return;
      settled = true;
      SPRITE_LOADING_SET.delete(url);
      if (ok && img.naturalWidth > 0) {
        SPRITE_READY_SET.add(url);
        notifySpriteListeners();
      }
      resolve();
    };

    const onLoaded = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => finalize(true))
          .catch(() => finalize(img.complete && img.naturalWidth > 0));
      } else {
        finalize(true);
      }
    };

    img.onload = onLoaded;
    img.onerror = () => finalize(false);

    if (!img.src) {
      img.src = url;
    } else if (img.complete && img.naturalWidth > 0) {
      onLoaded();
    }
  });
}

function getReadySpriteImage(url: string): HTMLImageElement | null {
  const img = SPRITE_IMAGE_CACHE.get(url);
  if (img && (SPRITE_READY_SET.has(url) || (img.complete && img.naturalWidth > 0))) {
    SPRITE_READY_SET.add(url);
    return img;
  }
  // 아직 로드되지 않은 프레임이 요청되면 즉시 최우선 로드 트리거
  void loadAndDecodeSprite(url);
  return null;
}

// 타임라인 등장 순서에 맞춘 순차 프리로드 목록 (왜곡 없는 18종 클린 스탠딩 스프라이트만 사용)
const CHRONOLOGICAL_SPRITE_FILES: string[] = [
  // 0. 마스터 기본 폴백 스프라이트
  'character-1-planner.png',
  'character-2-designer.png',
  'character-3-publisher.png',
  // 1. 기획자 클린 스탠딩 스프라이트
  'planner-think-1.png',
  'planner-sketch-1.png',
  'planner-walk-1.png',
  'planner-walk-2.png',
  'planner-walk-3.png',
  'planner-handoff.png',
  // 2. 디자이너 클린 스탠딩 스프라이트
  'designer-work-1.png',
  'designer-paint-1.png',
  'designer-walk-1.png',
  'designer-walk-2.png',
  'designer-walk-3.png',
  'designer-receive-1.png',
  'designer-handoff.png',
  // 3. 퍼블리셔 클린 스탠딩 스프라이트
  'publisher-code-1.png',
  'publisher-complete.png',
  'publisher-walk-1.png',
  'publisher-walk-2.png',
  'publisher-walk-3.png',
  'publisher-receive-1.png',
];

let preloadStarted = false;
function startChronologicalPreload() {
  if (preloadStarted) return;
  preloadStarted = true;

  const queue = CHRONOLOGICAL_SPRITE_FILES.map((file) => charImgUrl(file));
  let cursor = 0;
  const concurrency = 8;

  const worker = async () => {
    while (cursor < queue.length) {
      const nextUrl = queue[cursor++];
      await loadAndDecodeSprite(nextUrl);
    }
  };

  for (let i = 0; i < concurrency; i++) {
    void worker();
  }
}

interface CharacterSpriteCanvasProps {
  spriteUrl: string;
  fallbackUrl: string;
  flipRight: boolean;
  alt: string;
}

function CharacterSpriteCanvas({
  spriteUrl,
  fallbackUrl,
  flipRight,
  alt,
}: CharacterSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastValidImgRef = useRef<HTMLImageElement | null>(null);
  const lastDrawnRef = useRef<{ img: HTMLImageElement | null; flipRight: boolean }>({
    img: null,
    flipRight: false,
  });
  const [readyTick, setReadyTick] = useState<number>(0);

  useEffect(() => {
    const onReady = () => {
      setReadyTick((v) => v + 1);
    };
    SPRITE_LISTENERS.add(onReady);
    return () => {
      SPRITE_LISTENERS.delete(onReady);
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const primaryImg = getReadySpriteImage(spriteUrl);
    const fallbackImg = primaryImg ? null : getReadySpriteImage(fallbackUrl);
    const targetImg = primaryImg ?? lastValidImgRef.current ?? fallbackImg;

    if (!targetImg) return;
    lastValidImgRef.current = targetImg;

    // 동일한 비트맵과 동일한 방향이면 불필요한 캔버스 재드로잉 생략 (GPU 텍스처 100% 보존)
    if (
      lastDrawnRef.current.img === targetImg &&
      lastDrawnRef.current.flipRight === flipRight
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, 440, 440);
    if (flipRight) {
      ctx.translate(440, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(targetImg, 0, 0, 440, 440);
    ctx.restore();

    lastDrawnRef.current = { img: targetImg, flipRight };
  }, [spriteUrl, fallbackUrl, flipRight, readyTick]);

  return (
    <canvas
      ref={canvasRef}
      width={440}
      height={440}
      aria-label={alt}
      className="story-sprite-canvas"
    />
  );
}

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // 60fps requestAnimationFrame 연속 모션 타이머 (1초 = 20 subTick = 10 tick)
  const [subTick, setSubTick] = useState<number>(0);

  useEffect(() => {
    startChronologicalPreload();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(64, Math.max(0, now - lastTime));
      lastTime = now;
      setSubTick((prev) => prev + dt / 50);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying]);

  // 연속 타임라인 틱 (1초 = 10 tick)
  const tick = subTick / 2;

  // 부드러운 가감속(Ease-In-Out Sine) 보간 헬퍼
  const easeInOut = (progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    return -(Math.cos(Math.PI * clamped) - 1) / 2;
  };

  // 클린 3프레임 스탠딩 보행 사이클 (메시 워핑이 전혀 없는 원본 walk-1 -> walk-2 -> walk-3 -> walk-2 교차)
  const WALK_CYCLE_FRAMES = ['walk-1', 'walk-2', 'walk-3', 'walk-2'] as const;
  const getCleanWalkSprite = (st: number, offset: number): string => {
    const idx = Math.floor((st + offset) / 3) % WALK_CYCLE_FRAMES.length;
    return WALK_CYCLE_FRAMES[idx];
  };

  // 어색한 꿀렁임(scaleX/scaleY 스쿼시·스트레치 및 회전 흔들림)을 완전히 제거한 정밀 수직 호흡·보행 모션
  const getCharacterMotion = (
    isWalking: boolean,
    st: number,
    phaseOffset: number
  ) => {
    if (isWalking) {
      const stepPhase = (((st + phaseOffset) % 6) / 6) * Math.PI;
      const arch = Math.abs(Math.sin(stepPhase));
      const bounceY = -Math.round(arch * 2.5 * 2) / 2;
      const shadowScale = Number((1 - arch * 0.04).toFixed(3));
      return { bounceY, scaleX: 1, scaleY: 1, rotateDeg: 0, shadowScale };
    }
    const breath = (Math.sin((st + phaseOffset) * 0.18) + 1) / 2;
    const bounceY = -Math.round(breath * 1.5 * 2) / 2;
    const shadowScale = Number((1 - breath * 0.02).toFixed(3));
    return { bounceY, scaleX: 1, scaleY: 1, rotateDeg: 0, shadowScale };
  };

  // =========================================================================
  // ★ [3인 전원 서있는 자세(Standing) 통일 + 왜곡 없는 120틱(12초) 파이프라인 협업 루프] ★
  // - Stage 1 (0 ~ 32틱)  : [기획] 기획자가 서서 구조 구상(think-1) 및 화면설계서 스케치(sketch-1)
  // - Stage 2 (32 ~ 50틱) : [1차 핸드오프] 기획자·디자이너 마중 이동 -> 기획자 전달(38~42) -> 디자이너 수령(42~46) -> 복귀
  // - Stage 3 (50 ~ 78틱) : [디자인] 디자이너가 서서 UI 컬러 시안 채색(paint-1) 및 팔레트 점검(work-1)
  // - Stage 4 (78 ~ 96틱) : [2차 핸드오프] 디자이너·퍼블리셔 마중 이동 -> 디자이너 전달(84~88) -> 퍼블리셔 수령(88~92) -> 복귀
  // - Stage 5 (96 ~ 120틱): [퍼블리싱] 퍼블리셔가 헤드셋을 착용한 채 코딩(code-1, 96~112) 및 빌드 완료 환호(complete, 112~120)
  // =========================================================================
  const loopTick = tick % 120;
  const isFirstCycle = tick < 120;

  const plannerVisible = true;
  const designerVisible = true;
  const publisherVisible = true;

  // ---------------- 1) 기획자 (Planner · 전원 서있는 자세 통일) ----------------
  const isPlannerWalkToDesigner = loopTick >= 32 && loopTick < 38;
  const isPlannerGiveBlueprint = loopTick >= 38 && loopTick < 42;
  const isPlannerAfterGiveWait = loopTick >= 42 && loopTick < 46;
  const isPlannerWalkBack = loopTick >= 46 && loopTick < 50;
  const isPlannerWalking = isPlannerWalkToDesigner || isPlannerWalkBack;

  const plannerLeft: number = isPlannerWalkToDesigner
    ? 10.5 + easeInOut((loopTick - 32) / 6) * 13.0 // 10.5% -> 23.5%
    : isPlannerGiveBlueprint || isPlannerAfterGiveWait
    ? 23.5
    : isPlannerWalkBack
    ? 23.5 - easeInOut((loopTick - 46) / 4) * 13.0 // 23.5% -> 10.5%
    : 10.5;

  const plannerSprite: string = isPlannerWalking
    ? getCleanWalkSprite(subTick, 0)
    : isPlannerGiveBlueprint
    ? 'handoff' // planner-handoff.png (원본 자체가 우측을 향해 두 손으로 설계도를 건네는 클린 포즈)
    : isPlannerAfterGiveWait
    ? 'walk-2' // 디자이너가 설계도를 수령하는 동안 마주보며 미소
    : loopTick < 10
    ? 'think-1' // 서서 IA/구조 구상
    : loopTick < 32
    ? 'sketch-1' // 서서 태블릿에 화면설계서(SB) 작성
    : Math.floor(loopTick / 12) % 2 === 0
    ? 'sketch-1'
    : 'walk-2';

  // planner-handoff.png는 원본이 이미 우측 방향이므로 flipRight = false 유지,
  // walk-* 스프라이트는 원본이 좌측 방향이므로 우측 이동/대기 시에만 flipRight = true
  const plannerFlipRight: boolean = isPlannerWalkToDesigner || isPlannerAfterGiveWait;
  const plannerMotion = getCharacterMotion(isPlannerWalking, subTick, 0);

  const isPlannerErasing = !isFirstCycle && loopTick < 6;
  const plannerBoardFade = isPlannerErasing
    ? 0.3 + 0.7 * Math.abs(Math.cos((loopTick / 6) * Math.PI))
    : 1;
  const plannerBoardProgress: number =
    loopTick < 3 && !isFirstCycle
      ? 100
      : loopTick < 32
      ? Math.min(100, Math.round((loopTick / 30) * 100))
      : 100;

  // ---------------- 2) 디자이너 (Designer · 산출물 교차 수령/전달 정밀 동기화) ----------------
  const isDesignerWalkToPlanner = loopTick >= 32 && loopTick < 38;
  const isDesignerWaitBlueprint = loopTick >= 38 && loopTick < 42;
  const isDesignerReceiveBlueprint = loopTick >= 42 && loopTick < 46;
  const isDesignerWalkToCenter = loopTick >= 46 && loopTick < 50;
  const isDesignerDesigning = loopTick >= 50 && loopTick < 78;
  const isDesignerWalkToPublisher = loopTick >= 78 && loopTick < 84;
  const isDesignerGiveDesign = loopTick >= 84 && loopTick < 88;
  const isDesignerAfterGiveWait = loopTick >= 88 && loopTick < 92;
  const isDesignerWalkBackCenter = loopTick >= 92 && loopTick < 96;

  const isDesignerWalking =
    isDesignerWalkToPlanner ||
    isDesignerWalkToCenter ||
    isDesignerWalkToPublisher ||
    isDesignerWalkBackCenter;

  const designerLeft: number = isDesignerWalkToPlanner
    ? 41.5 - easeInOut((loopTick - 32) / 6) * 9.0 // 41.5% -> 32.5%
    : isDesignerWaitBlueprint || isDesignerReceiveBlueprint
    ? 32.5
    : isDesignerWalkToCenter
    ? 32.5 + easeInOut((loopTick - 46) / 4) * 9.0 // 32.5% -> 41.5%
    : isDesignerWalkToPublisher
    ? 41.5 + easeInOut((loopTick - 78) / 6) * 10.0 // 41.5% -> 51.5%
    : isDesignerGiveDesign || isDesignerAfterGiveWait
    ? 51.5
    : isDesignerWalkBackCenter
    ? 51.5 - easeInOut((loopTick - 92) / 4) * 10.0 // 51.5% -> 41.5%
    : 41.5;

  const designerSprite: string = isDesignerWalking
    ? getCleanWalkSprite(subTick, 4)
    : isDesignerWaitBlueprint
    ? 'walk-2' // 기획자가 설계도를 건네는 순간 마주보며 대기
    : isDesignerReceiveBlueprint
    ? 'receive-1' // 왜곡 없는 클린 설계도 수령 포즈 (designer-receive-1.png)
    : isDesignerDesigning
    ? loopTick < 68
      ? 'paint-1' // 왜곡 없는 클린 UI 시안 채색 포즈 (designer-paint-1.png)
      : 'work-1' // 팔레트 & 스타일러스 점검 포즈 (designer-work-1.png)
    : isDesignerGiveDesign
    ? 'handoff' // 왜곡 없는 클린 디자인 시안 전달 포즈 (designer-handoff.png)
    : isDesignerAfterGiveWait
    ? 'walk-2' // 퍼블리셔가 시안을 수령하는 동안 마주보며 미소
    : 'work-1';

  // 우측으로 걸어갈 때(32.5->41.5, 41.5->51.5) 및 우측 퍼블리셔에게 산출물 전달/대기할 때 우측 반전
  const designerFlipRight: boolean =
    isDesignerWalkToCenter ||
    isDesignerWalkToPublisher ||
    isDesignerGiveDesign ||
    isDesignerAfterGiveWait;
  const designerMotion = getCharacterMotion(isDesignerWalking, subTick, 7);

  const isDesignerErasing = !isFirstCycle && loopTick >= 46 && loopTick < 52;
  const designerBoardFade = isDesignerErasing
    ? 0.3 + 0.7 * Math.abs(Math.cos(((loopTick - 46) / 6) * Math.PI))
    : 1;
  const designerBoardProgress: number =
    loopTick < 49
      ? isFirstCycle
        ? 0
        : 100
      : loopTick < 50
      ? 0
      : loopTick < 78
      ? Math.min(100, Math.round(((loopTick - 50) / 26) * 100))
      : 100;

  // ---------------- 3) 퍼블리셔 (Publisher · 헤드셋 탈착 왜곡 제거 & 클린 코딩) ----------------
  const isPubWalkToDesigner = loopTick >= 78 && loopTick < 84;
  const isPubWaitDesign = loopTick >= 84 && loopTick < 88;
  const isPubReceiveDesign = loopTick >= 88 && loopTick < 92;
  const isPubWalkToDesk = loopTick >= 92 && loopTick < 96;
  const isPubCoding = loopTick >= 96 && loopTick < 112;
  const isPubCelebrating = loopTick >= 112;

  const isPublisherWalking = isPubWalkToDesigner || isPubWalkToDesk;

  const publisherLeft: number = isPubWalkToDesigner
    ? 73.0 - easeInOut((loopTick - 78) / 6) * 12.5 // 73.0% -> 60.5%
    : isPubWaitDesign || isPubReceiveDesign
    ? 60.5
    : isPubWalkToDesk
    ? 60.5 + easeInOut((loopTick - 92) / 4) * 12.5 // 60.5% -> 73.0%
    : 73.0;

  const publisherSprite: string = isPublisherWalking
    ? getCleanWalkSprite(subTick, 8)
    : isPubWaitDesign
    ? 'walk-2' // 디자이너가 시안을 건네는 순간 마주보며 대기
    : isPubReceiveDesign
    ? 'receive-1' // 왜곡 없는 클린 디자인 시안 수령 포즈 (publisher-receive-1.png)
    : isPubCoding
    ? 'code-1' // 헤드셋을 착용한 채 안정적으로 타이핑하는 클린 포즈 (publisher-code-1.png)
    : isPubCelebrating
    ? 'complete' // 반응형 웹 빌드 완료 환호 포즈 (publisher-complete.png)
    : 'code-1';

  const publisherFlipRight: boolean = isPubWalkToDesk;
  const publisherMotion = getCharacterMotion(isPublisherWalking, subTick, 13);

  const isPublisherErasing = !isFirstCycle && loopTick >= 92 && loopTick < 98;
  const publisherBoardFade = isPublisherErasing
    ? 0.3 + 0.7 * Math.abs(Math.cos(((loopTick - 92) / 6) * Math.PI))
    : 1;
  const publisherBoardProgress: number =
    loopTick < 95
      ? isFirstCycle
        ? 0
        : 100
      : loopTick < 96
      ? 0
      : loopTick < 112
      ? Math.min(100, Math.round(((loopTick - 96) / 15) * 100))
      : 100;

  // 60fps 동적 모션/좌표를 컨테이너 CSS Custom Properties로 동기화 (인라인 스타일 0% 원칙 준수)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    el.style.setProperty('--planner-board-fade', String(plannerBoardFade));
    el.style.setProperty('--designer-board-fade', String(designerBoardFade));
    el.style.setProperty('--publisher-board-fade', String(publisherBoardFade));

    el.style.setProperty('--planner-left', `${plannerLeft}%`);
    el.style.setProperty('--planner-opacity', plannerVisible ? '1' : '0');
    el.style.setProperty(
      '--planner-shadow-transform',
      `translateX(-50%) scale(${plannerMotion.shadowScale})`
    );
    el.style.setProperty(
      '--planner-body-transform',
      `translateY(${plannerMotion.bounceY}px) scaleX(${plannerMotion.scaleX}) scaleY(${plannerMotion.scaleY}) rotate(${plannerMotion.rotateDeg}deg)`
    );

    el.style.setProperty('--designer-left', `${designerLeft}%`);
    el.style.setProperty('--designer-opacity', designerVisible ? '1' : '0');
    el.style.setProperty(
      '--designer-shadow-transform',
      `translateX(-50%) scale(${designerMotion.shadowScale})`
    );
    el.style.setProperty(
      '--designer-body-transform',
      `translateY(${designerMotion.bounceY}px) scaleX(${designerMotion.scaleX}) scaleY(${designerMotion.scaleY}) rotate(${designerMotion.rotateDeg}deg)`
    );
    el.style.setProperty(
      '--designer-badge-transform',
      `translateX(-50%) translateY(${Math.max(0, designerMotion.bounceY)}px)`
    );

    el.style.setProperty('--publisher-left', `${publisherLeft}%`);
    el.style.setProperty('--publisher-opacity', publisherVisible ? '1' : '0');
    el.style.setProperty(
      '--publisher-shadow-transform',
      `translateX(-50%) scale(${publisherMotion.shadowScale})`
    );
    el.style.setProperty(
      '--publisher-body-transform',
      `translateY(${publisherMotion.bounceY}px) scaleX(${publisherMotion.scaleX}) scaleY(${publisherMotion.scaleY}) rotate(${publisherMotion.rotateDeg}deg)`
    );
  }, [
    plannerBoardFade,
    designerBoardFade,
    publisherBoardFade,
    plannerLeft,
    plannerVisible,
    plannerMotion,
    designerLeft,
    designerVisible,
    designerMotion,
    publisherLeft,
    publisherVisible,
    publisherMotion,
  ]);

  return (
    <div ref={stageRef} className="story-stage-card">
      {/* 우측 상단 미니 플레이/정지 아이콘 버튼 */}
      <div className="story-stage-controls">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? '정지' : '재생'}
          aria-label={isPlaying ? '정지' : '재생'}
          className={`story-stage-play-btn ${isPlaying ? 'playing' : 'paused'}`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      {/* 메인 애니메이션 무대 (상단 모던 다크 슬레이트 디스플레이 보드 + 하단 스튜디오 협업 무대) */}
      <div className="story-stage-body">
        {/* 1. 상단 풀와이드 모던 스튜디오 다크 슬레이트 보드 판넬 (높이 392px 고정) */}
        <div className="story-board-frame">
          <div className="story-board-inner-trim" />
          <div className="story-board-ledge" />

          {/* 보드 내부 다크 네이비/슬레이트 모눈(Grid) 3분할 영역 */}
          <div className="story-board-grid">
            {/* [ZONE 1 · 좌측] 화면설계 (SB) */}
            <div className="story-board-zone story-board-zone-divider">
              <div className="story-zone-header">
                <span className="story-zone-dot story-zone-dot-blue" />
                <span className="story-zone-title story-zone-title-blue">01. 화면설계 (SB)</span>
              </div>

              <div className="story-zone-canvas story-zone-fade-planner">
                <svg viewBox="0 0 340 270" width="100%" height="100%" className="story-zone-svg">
                  {/* 외곽 브라우저 프레임 */}
                  <rect
                    x="4"
                    y="4"
                    width="332"
                    height="258"
                    rx="10"
                    fill="rgba(255, 255, 255, 0.03)"
                    stroke="rgba(186, 230, 253, 0.55)"
                    strokeWidth="1.6"
                  />

                  {/* 1단계: 상단 GNB 와이어프레임 */}
                  <g className={plannerBoardProgress >= 15 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
                    <rect
                      x="16"
                      y="16"
                      width="308"
                      height="28"
                      rx="5"
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                    />
                    <rect x="26" y="25" width="46" height="10" rx="2" fill="rgba(147, 197, 253, 0.45)" />
                    <line x1="96" y1="30" x2="132" y2="30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                    <line x1="146" y1="30" x2="182" y2="30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                    <line x1="196" y1="30" x2="232" y2="30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="308" cy="30" r="5" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
                  </g>

                  {/* 2단계: 메인 히어로 배너 + 우측 서브 배너 와이어프레임 */}
                  <g className={plannerBoardProgress >= 40 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
                    <rect
                      x="16"
                      y="54"
                      width="206"
                      height="110"
                      rx="6"
                      fill="rgba(147, 197, 253, 0.06)"
                      stroke="#60a5fa"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />
                    <line x1="16" y1="54" x2="222" y2="164" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.2" />
                    <line x1="222" y1="54" x2="16" y2="164" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="1.2" />
                    <rect
                      x="68"
                      y="95"
                      width="102"
                      height="28"
                      rx="4"
                      fill="#0f172a"
                      stroke="#93c5fd"
                      strokeWidth="1.4"
                    />
                    <text x="119" y="113" fontSize="10" fontWeight="bold" fill="#e0f2fe" textAnchor="middle">
                      HERO BANNER
                    </text>

                    {/* 우측 큐레이션 영역 박스 */}
                    <rect
                      x="232"
                      y="54"
                      width="92"
                      height="110"
                      rx="6"
                      fill="rgba(148, 163, 184, 0.06)"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                    />
                    <line x1="246" y1="74" x2="310" y2="74" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                    <rect
                      x="244"
                      y="86"
                      width="68"
                      height="48"
                      rx="4"
                      fill="none"
                      stroke="rgba(203, 213, 225, 0.7)"
                      strokeWidth="1.3"
                    />
                    <line x1="256" y1="146" x2="300" y2="146" stroke="rgba(203, 213, 225, 0.6)" strokeWidth="1.8" strokeLinecap="round" />
                  </g>

                  {/* 3단계: 하단 4열 상품 카드 그리드 와이어프레임 */}
                  <g className={plannerBoardProgress >= 72 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
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
                            stroke="#94a3b8"
                            strokeWidth="1.4"
                          />
                          <rect
                            x={bx + 7}
                            y="183"
                            width="57"
                            height="40"
                            rx="3"
                            fill="rgba(255,255,255,0.04)"
                            stroke="rgba(148, 163, 184, 0.5)"
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
                            stroke="rgba(148, 163, 184, 0.6)"
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

            {/* [ZONE 2 · 중앙] UI/UX 디자인 (의류 이모지 제거 & 모던 에디토리얼 룩북 시안) */}
            <div className="story-board-zone story-board-zone-divider">
              <div className="story-zone-header">
                <span className="story-zone-dot story-zone-dot-emerald" />
                <span className="story-zone-title story-zone-title-emerald">02. UI/UX 디자인</span>
              </div>

              <div className="story-zone-canvas story-zone-fade-designer">
                <svg viewBox="0 0 340 270" width="100%" height="100%" className="story-zone-svg">
                  <defs>
                    <linearGradient id="cleanHeroGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="55%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="cleanSideGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#eff6ff" />
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
                    stroke="rgba(52, 211, 153, 0.65)"
                    strokeWidth="1.8"
                  />

                  {/* 1단계: 상단 다크 럭셔리 GNB 디자인 */}
                  <g className={designerBoardProgress >= 15 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
                    <rect x="16" y="16" width="308" height="28" rx="6" fill="#0f172a" />
                    <text x="28" y="34" fontSize="10" fontWeight="bold" fill="#ffffff" letterSpacing="1.5">
                      SISUN.COM
                    </text>
                    <line x1="108" y1="30" x2="138" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="152" y1="30" x2="182" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <line x1="196" y1="30" x2="226" y2="30" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    <rect x="272" y="22" width="42" height="16" rx="8" fill="#2563eb" />
                    <text x="293" y="32.5" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      26 FW
                    </text>
                  </g>

                  {/* 2단계: 메인 컬러 히어로 배너 + 우측 룩북 카드 디자인 */}
                  <g className={designerBoardProgress >= 42 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
                    <rect x="16" y="54" width="206" height="110" rx="8" fill="url(#cleanHeroGrad)" />
                    <circle cx="182" cy="98" r="32" fill="rgba(96, 165, 250, 0.22)" />
                    <circle cx="160" cy="116" r="20" fill="rgba(167, 243, 208, 0.16)" />
                    <text x="30" y="78" fontSize="8.5" fontWeight="bold" fill="#93c5fd" letterSpacing="1">
                      NEW COLLECTION
                    </text>
                    <text x="30" y="99" fontSize="14" fontWeight="bold" fill="#ffffff">
                      THE NEW ARCHIVE
                    </text>
                    <rect x="30" y="116" width="82" height="22" rx="11" fill="#ffffff" />
                    <text x="71" y="130" fontSize="8.5" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                      LOOKBOOK →
                    </text>

                    {/* 우측 브랜드 큐레이션 카드 (이모지 대신 세련된 에디토리얼 프레임) */}
                    <rect
                      x="232"
                      y="54"
                      width="92"
                      height="110"
                      rx="8"
                      fill="url(#cleanSideGrad)"
                      stroke="#bfdbfe"
                      strokeWidth="1.4"
                    />
                    <rect x="244" y="65" width="68" height="16" rx="8" fill="#1e3a8a" />
                    <text x="278" y="76" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                      EDITORIAL
                    </text>
                    <rect x="246" y="88" width="64" height="48" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
                    <circle cx="278" cy="106" r="9" fill="#1e40af" opacity="0.85" />
                    <path d="M263 130 C263 118, 293 118, 293 130" fill="#1e40af" opacity="0.85" />
                    <line x1="258" y1="148" x2="298" y2="148" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* 3단계: 하단 4열 모던 상품 카드 그리드 디자인 (이모지 없이 미니멀 컬러 블록 표현) */}
                  <g className={designerBoardProgress >= 72 ? 'story-svg-step-on' : 'story-svg-step-dim'}>
                    {[
                      { bg: '#eff6ff', bar: '#3b82f6', accent: '#1d4ed8' },
                      { bg: '#ecfdf5', bar: '#10b981', accent: '#047857' },
                      { bg: '#f5f3ff', bar: '#8b5cf6', accent: '#6d28d9' },
                      { bg: '#f1f5f9', bar: '#64748b', accent: '#334155' },
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
                          <rect x={bx + 20} y="191" width="31" height="24" rx="3" fill={card.bar} opacity="0.28" />
                          <circle cx={bx + 35.5} cy="203" r="6" fill={card.bar} opacity="0.75" />
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

            {/* [ZONE 3 · 우측] 웹 퍼블리싱 */}
            <div className="story-board-zone">
              <div className="story-zone-header story-zone-header-between">
                <div className="story-zone-title-wrap">
                  <span className="story-zone-dot story-zone-dot-purple" />
                  <span className="story-zone-title story-zone-title-purple">03. 웹 퍼블리싱</span>
                </div>

                <div className="story-zone-pins">
                  <span className="story-zone-pin story-zone-dot-blue" />
                  <span className="story-zone-pin story-zone-dot-emerald" />
                  <span className="story-zone-pin story-zone-dot-purple" />
                </div>
              </div>

              <div className="story-zone-canvas story-zone-fade-publisher">
                <svg viewBox="0 0 340 270" width="100%" height="100%" className="story-zone-svg">
                  <rect
                    x="4"
                    y="4"
                    width="332"
                    height="258"
                    rx="10"
                    fill="rgba(9, 13, 22, 0.92)"
                    stroke="rgba(167, 139, 250, 0.65)"
                    strokeWidth="1.6"
                  />
                  {/* 상단 윈도우 타이틀 바 */}
                  <rect x="4" y="4" width="332" height="28" rx="10" fill="#1e293b" />
                  <circle cx="20" cy="18" r="4" fill="#f87171" />
                  <circle cx="33" cy="18" r="4" fill="#fbbf24" />
                  <circle cx="46" cy="18" r="4" fill="#34d399" />
                  <text x="64" y="21" fontSize="10" fontWeight="bold" fill="#cbd5e1" fontFamily="monospace">
                    sisun_renewal.html
                  </text>

                  {/* 순차적으로 타이핑되는 심플한 코드 라인 */}
                  <text x="20" y="54" fontSize="10" fill="#64748b" fontFamily="monospace">
                    {'<!DOCTYPE html>'}
                  </text>

                  {publisherBoardProgress >= 16 && (
                    <text x="20" y="76" fontSize="10" fill="#38bdf8" fontFamily="monospace">
                      {'<header class="sisun-gnb">'}
                    </text>
                  )}
                  {publisherBoardProgress >= 28 && (
                    <text x="34" y="96" fontSize="10" fill="#e2e8f0" fontFamily="monospace">
                      {'<nav>SISUN · 26 FW</nav>'}
                    </text>
                  )}
                  {publisherBoardProgress >= 40 && (
                    <text x="20" y="116" fontSize="10" fill="#38bdf8" fontFamily="monospace">
                      {'</header>'}
                    </text>
                  )}

                  {publisherBoardProgress >= 52 && (
                    <text x="20" y="142" fontSize="10" fill="#a78bfa" fontFamily="monospace">
                      {'<section class="hero-archive">'}
                    </text>
                  )}
                  {publisherBoardProgress >= 64 && (
                    <text x="34" y="162" fontSize="10" fill="#93c5fd" fontFamily="monospace">
                      {'<LookbookBanner responsive />'}
                    </text>
                  )}
                  {publisherBoardProgress >= 76 && (
                    <text x="20" y="182" fontSize="10" fill="#a78bfa" fontFamily="monospace">
                      {'</section>'}
                    </text>
                  )}

                  {publisherBoardProgress >= 86 && (
                    <text x="20" y="208" fontSize="10" fill="#34d399" fontFamily="monospace">
                      {'.product-grid { display: grid; }'}
                    </text>
                  )}
                  {publisherBoardProgress >= 95 && (
                    <text x="20" y="232" fontSize="10" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
                      {'✓ Responsive Web Build Complete'}
                    </text>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 하단 캐릭터 동시 액션 무대 (모던 스튜디오 월 & 라이트 슬레이트 플로어 + 3인 협업) */}
        <div className="story-floor-stage">
          {/* [스튜디오 배경 레이어 1] 모던 오피스 벽면 웨인스코팅 패널 & 소품 */}
          <svg
            viewBox="0 0 1200 190"
            preserveAspectRatio="none"
            className="story-wall-svg"
          >
            {/* 은은한 벽면 웨인스코팅 몰딩 라인 */}
            <rect
              x="24"
              y="18"
              width="356"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.55)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x="404"
              y="18"
              width="392"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.55)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x="820"
              y="18"
              width="356"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.55)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />

            {/* [좌측 · 기획 구역 벽면 소품] */}
            <g opacity="0.85">
              <rect
                x="48"
                y="32"
                width="96"
                height="94"
                rx="6"
                fill="#eff6ff"
                stroke="#cbd5e1"
                strokeWidth="3"
              />
              <line x1="96" y1="32" x2="96" y2="126" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="48" y1="79" x2="144" y2="79" stroke="#cbd5e1" strokeWidth="2.5" />
              <polygon points="56,118 82,42 92,42 66,118" fill="rgba(255,255,255,0.6)" />
              <circle cx="332" cy="54" r="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
              <line x1="332" y1="54" x2="332" y2="43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <line x1="332" y1="54" x2="341" y2="54" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="332" cy="54" r="2" fill="#2563eb" />
              <rect x="250" y="76" width="62" height="44" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.8" />
              <rect x="257" y="83" width="14" height="13" rx="1.5" fill="#dbeafe" />
              <rect x="275" y="83" width="14" height="13" rx="1.5" fill="#e0e7ff" />
              <rect x="293" y="83" width="12" height="13" rx="1.5" fill="#d1fae5" />
              <rect x="257" y="100" width="22" height="12" rx="1.5" fill="#ede9fe" />
            </g>

            {/* [중앙 · 디자인 구역 벽면 소품] */}
            <g opacity="0.88">
              <rect x="546" y="72" width="118" height="6" rx="3" fill="#94a3b8" />
              <rect x="558" y="42" width="28" height="30" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="572" cy="54" r="6" fill="#059669" />
              <rect x="564" y="63" width="16" height="4" rx="1" fill="#3b82f6" />
              <rect x="596" y="50" width="8" height="22" rx="1.5" fill="#3b82f6" />
              <rect x="605" y="53" width="8" height="19" rx="1.5" fill="#10b981" />
              <rect x="615" y="48" width="9" height="24" rx="1.5" fill="#8b5cf6" />
              <rect x="636" y="58" width="14" height="14" rx="3" fill="#64748b" />
              <circle cx="643" cy="54" r="7" fill="#34d399" />
              <ellipse cx="392" cy="144" rx="14" ry="8" fill="#6ee7b7" />
              <ellipse cx="382" cy="150" rx="11" ry="6" fill="#34d399" transform="rotate(-18 382 150)" />
              <ellipse cx="402" cy="150" rx="11" ry="6" fill="#10b981" transform="rotate(18 402 150)" />
              <polygon points="382,155 402,155 398,184 386,184" fill="#64748b" />
              <rect x="380" y="152" width="24" height="5" rx="2" fill="#475569" />
            </g>

            {/* [우측 · 퍼블리싱 구역 벽면 소품] */}
            <g opacity="0.88">
              <rect x="965" y="72" width="114" height="6" rx="3" fill="#94a3b8" />
              <rect x="980" y="56" width="14" height="16" rx="2.5" fill="#6366f1" />
              <path d="M994 59 H998 A3 3 0 0 1 998 68 H994" fill="none" stroke="#6366f1" strokeWidth="2" />
              <rect x="1010" y="48" width="9" height="24" rx="1.5" fill="#3b82f6" />
              <rect x="1020" y="51" width="9" height="21" rx="1.5" fill="#8b5cf6" />
              <rect x="1030" y="46" width="10" height="26" rx="1.5" fill="#10b981" />
              <ellipse cx="1138" cy="132" rx="15" ry="9" fill="#34d399" />
              <ellipse cx="1126" cy="142" rx="13" ry="7" fill="#10b981" transform="rotate(-22 1126 142)" />
              <ellipse cx="1150" cy="142" rx="13" ry="7" fill="#6ee7b7" transform="rotate(22 1150 142)" />
              <polygon points="1126,150 1150,150 1146,184 1130,184" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          </svg>

          {/* [스튜디오 배경 레이어 2] 모던 슬레이트 걸레받이 몰딩 (Baseboard) */}
          <div className="story-baseboard" />

          {/* [스튜디오 배경 레이어 3] 모던 애쉬/슬레이트 플로어 & 3인 작업 구역 러그 */}
          <div className="story-floor-surface">
            <svg
              viewBox="0 0 1200 58"
              preserveAspectRatio="none"
              className="story-floor-svg"
            >
              <line x1="180" y1="0" x2="110" y2="58" stroke="rgba(100, 116, 139, 0.16)" strokeWidth="1.5" />
              <line x1="390" y1="0" x2="345" y2="58" stroke="rgba(100, 116, 139, 0.16)" strokeWidth="1.5" />
              <line x1="600" y1="0" x2="600" y2="58" stroke="rgba(100, 116, 139, 0.16)" strokeWidth="1.5" />
              <line x1="810" y1="0" x2="855" y2="58" stroke="rgba(100, 116, 139, 0.16)" strokeWidth="1.5" />
              <line x1="1020" y1="0" x2="1090" y2="58" stroke="rgba(100, 116, 139, 0.16)" strokeWidth="1.5" />

              {/* 1) 기획자 매트 (블루) */}
              <ellipse
                cx="228"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(219, 234, 254, 0.8)"
                stroke="rgba(147, 197, 253, 0.9)"
                strokeWidth="2"
              />
              {/* 2) 디자이너 매트 (에메랄드) */}
              <ellipse
                cx="616"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(209, 250, 229, 0.8)"
                stroke="rgba(110, 231, 183, 0.9)"
                strokeWidth="2"
              />
              {/* 3) 퍼블리셔 매트 (퍼플) */}
              <ellipse
                cx="994"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(237, 233, 254, 0.8)"
                stroke="rgba(196, 181, 253, 0.9)"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* [스튜디오 배경 레이어 4] 은은한 스튜디오 채광 */}
          <div className="story-sunlight" />

          {/* ---------------- 주인공 1: 기획자 ---------------- */}
          <div className="story-char-slot story-char-planner">
            <div className="story-char-shadow story-shadow-planner" />

            <div className="story-char-body story-body-planner">
              <CharacterSpriteCanvas
                spriteUrl={charImgUrl(`planner-${plannerSprite}.png`)}
                fallbackUrl={charImgUrl('character-1-planner.png')}
                flipRight={plannerFlipRight}
                alt={`기획자 ${plannerSprite}`}
              />
            </div>

            <div className="story-char-badge-wrap">
              <div className="story-char-badge story-char-badge-planner">기획자</div>
            </div>
          </div>

          {/* ---------------- 주인공 2: 디자이너 ---------------- */}
          <div className="story-char-slot story-char-designer">
            <div className="story-char-shadow story-shadow-designer" />

            <div className="story-char-body story-body-designer">
              <CharacterSpriteCanvas
                spriteUrl={charImgUrl(`designer-${designerSprite}.png`)}
                fallbackUrl={charImgUrl('character-2-designer.png')}
                flipRight={designerFlipRight}
                alt={`디자이너 ${designerSprite}`}
              />
            </div>

            <div className="story-char-badge-wrap story-badge-wrap-designer">
              <div className="story-char-badge story-char-badge-designer">디자이너</div>
            </div>
          </div>

          {/* ---------------- 주인공 3: 퍼블리셔 ---------------- */}
          <div className="story-char-slot story-char-publisher">
            <div className="story-char-shadow story-shadow-publisher" />

            <div className="story-char-body story-body-publisher">
              <CharacterSpriteCanvas
                spriteUrl={charImgUrl(`publisher-${publisherSprite}.png`)}
                fallbackUrl={charImgUrl('character-3-publisher.png')}
                flipRight={publisherFlipRight}
                alt={`퍼블리셔 ${publisherSprite}`}
              />
            </div>

            <div className="story-char-badge-wrap">
              <div className="story-char-badge story-char-badge-publisher">퍼블리셔</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
