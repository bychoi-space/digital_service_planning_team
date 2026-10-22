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

// 타임라인 등장 순서에 맞춘 순차 프리로드 목록
const CHRONOLOGICAL_SPRITE_FILES: string[] = [
  // 0. 마스터 기본 폴백 스프라이트 (최우선)
  'character-1-planner.png',
  'character-2-designer.png',
  'character-3-publisher.png',
  // 1. 기획자 초반 등장 (0~26틱: peek -> think-walk)
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `planner-peek-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `planner-think-walk-${n}.png`),
  // 2. 기획자 착석 설계 & 디자이너 등반 등장 (26~50틱)
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `planner-sit-sketch-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `designer-climb-${n}.png`),
  // 3. 기획자·디자이너 보행 및 1차 핸드오프 (48~72틱)
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `designer-walk-s${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `planner-walk-s${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `planner-handoff-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `designer-receive-${n}.png`),
  // 4. 디자이너 채색 작업 & 퍼블리셔 콧노래 등장 (72~126틱)
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `designer-paint-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `publisher-hum-walk-${n}.png`),
  // 5. 2차 핸드오프 & 퍼블리셔 코딩/완료 (126틱 이후)
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `designer-handoff-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `publisher-receive-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `publisher-walk-s${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `publisher-headset-off-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `publisher-code-focus-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `publisher-complete-${n}.png`),
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

  // 12프레임 360° 스켈레탈 교차 보행 사이클 (100ms(10fps)마다 한 프레임씩 깜빡임 없이 전환)
  const getWalkSubSprite = (st: number, offset: number) =>
    `walk-s${(Math.floor((st + offset) / 2) % 12) + 1}`;

  // 12프레임 360° 스켈레탈 메인 액션 사이클 (1 -> 2 -> ... -> 12 -> 1)
  const getWorkSubFrame = (st: number, offset: number) =>
    (Math.floor((st + offset) / 2) % 12) + 1;

  // 8프레임 360° 스켈레탈 인터랙션 사이클 (1 -> 2 -> ... -> 8 -> 1)
  const getInteractSubFrame = (st: number, offset: number) =>
    (Math.floor((st + offset) / 2) % 8) + 1;

  // 12프레임 왼발·오른발 교차 주기(F1·F7 착지, F4·F10 교차 정점)와 1:1 동기화된 보행·호흡 물리
  const getCharacterMotion = (
    isWalking: boolean,
    st: number,
    phaseOffset: number,
    walkDir: -1 | 0 | 1 = 0
  ) => {
    if (isWalking) {
      const cyclePos = ((st + phaseOffset) / 2) % 12;
      const stepPhase = (cyclePos / 6) * Math.PI;
      const arch = Math.abs(Math.sin(stepPhase)); // F1(0)·F7(6) 착지(0), F4(3)·F10(9) 다리 교차 정점(1)
      const bounceY = -arch * 3.2;
      const squash = Math.cos(stepPhase * 2) * 0.009;
      const scaleX = 1 - squash * 0.7;
      const scaleY = 1 + squash;
      const velocityLean = walkDir * 1.0;
      const stepSway = Math.cos(stepPhase) * 0.8;
      const rotateDeg = velocityLean + stepSway;
      const shadowScale = 1 - arch * 0.07;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    } else {
      const phase = (st + phaseOffset) * 0.24;
      const bounceY = Math.sin(phase) * 1.1 - 0.5;
      const squash = Math.sin(phase) * 0.005;
      const scaleX = 1 - squash * 0.6;
      const scaleY = 1 + squash;
      const rotateDeg = Math.sin(phase * 0.7) * 0.5;
      const shadowScale = 1 + Math.sin(phase) * 0.02;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    }
  };

  // =========================================================================
  // ★ [순차 등장 + 끊김 없는 88틱 무한 릴레이 협업 아키텍처] ★
  // =========================================================================
  const plannerVisible = true;
  const isPlannerIntro = tick < 72;
  const pLoop = isPlannerIntro ? 0 : (tick - 72) % 88;

  // 초기 진입 시 0~6틱에 부드럽게 고개를 내밀고 멈춤 없이 바로 6~26틱 동안 걸어 들어오도록 연결
  const isPlannerPeek = isPlannerIntro && tick < 6;
  const isPlannerThinkWalkRight = isPlannerIntro && tick >= 6 && tick < 26;
  const isPlannerThinkWalkLeft = !isPlannerIntro && pLoop < 14;
  const isPlannerThinkWalk = isPlannerThinkWalkRight || isPlannerThinkWalkLeft;

  const isPlannerSitSketch =
    (isPlannerIntro && tick >= 26 && tick < 50) || (!isPlannerIntro && pLoop >= 14 && pLoop < 66);
  const sitElapsed = isPlannerIntro ? tick - 26 : pLoop - 14;
  const sitDuration = isPlannerIntro ? 24 : 52;

  const isPlannerWalkToDesigner =
    (isPlannerIntro && tick >= 50 && tick < 60) || (!isPlannerIntro && pLoop >= 66 && pLoop < 76);
  const isPlannerHandoff = !isPlannerPeek && !isPlannerThinkWalk && !isPlannerSitSketch && !isPlannerWalkToDesigner;
  const isPlannerWalking = isPlannerThinkWalk || isPlannerWalkToDesigner;
  const plannerWalkDir: -1 | 0 | 1 =
    isPlannerThinkWalkRight || isPlannerWalkToDesigner ? 1 : isPlannerThinkWalkLeft ? -1 : 0;
  const basePlannerMotion = getCharacterMotion(isPlannerWalking, subTick, 0, plannerWalkDir);

  const getPlannerSpecialMotion = () => {
    if (isPlannerPeek) {
      // 0~6틱: 시작과 끝(tick=6)에서 모두 0으로 수렴하는 종 모양(Bell Curve) 보간으로 포즈 전환 시 각도 점프 원천 차단
      const peekBell = Math.sin((tick / 6) * Math.PI); // 0 -> 1 -> 0
      return {
        bounceY: -peekBell * 2.4,
        scaleX: 1 + peekBell * 0.01,
        scaleY: 1 - peekBell * 0.01,
        rotateDeg: peekBell * 4.5,
        shadowScale: 0.94,
      };
    }
    if (isPlannerThinkWalk) {
      // 고민하며 걷기: 보행 시작/종료 경계에서 바운스와 기울기가 0으로 부드럽게 감쇠되어 착석과 매끄럽게 직결
      const walkProgress = isPlannerThinkWalkRight ? (tick - 6) / 20 : pLoop / 14;
      const walkEnv = Math.sin(Math.max(0, Math.min(1, walkProgress)) * Math.PI);
      const thinkTilt = Math.sin(subTick * 0.28) * 1.4 * walkEnv;
      return {
        bounceY: basePlannerMotion.bounceY * (0.35 + 0.65 * walkEnv),
        scaleX: 1 + (basePlannerMotion.scaleX - 1) * walkEnv,
        scaleY: 1 + (basePlannerMotion.scaleY - 1) * walkEnv,
        rotateDeg: basePlannerMotion.rotateDeg * 0.6 * walkEnv + thinkTilt,
        shadowScale: basePlannerMotion.shadowScale,
      };
    }
    if (isPlannerSitSketch) {
      // 바닥 착석 스케치: 처음 2.5틱 동안 부드럽게 바닥에 내려앉고, 마지막 2.5틱 동안 부드럽게 일어남 (단절 점프 없음)
      const sitIn = easeInOut(Math.min(1, sitElapsed / 2.5));
      const sitOut = easeInOut(Math.min(1, (sitDuration - sitElapsed) / 2.5));
      const sitEnv = sitIn * sitOut;
      const sketchBob = Math.sin(subTick * 0.42) * 1.3 * sitEnv;
      const sketchTilt = Math.sin(subTick * 0.28) * 1.0 * sitEnv;
      return {
        bounceY: 4.5 * sitEnv + sketchBob,
        scaleX: 1 + 0.012 * sitEnv - Math.sin(subTick * 0.42) * 0.005 * sitEnv,
        scaleY: 1 - 0.012 * sitEnv + Math.sin(subTick * 0.42) * 0.005 * sitEnv,
        rotateDeg: sketchTilt,
        shadowScale: 1 + 0.08 * sitEnv,
      };
    }
    if (isPlannerHandoff) {
      const handoffWave = Math.sin(subTick * 0.45);
      return {
        bounceY: -Math.abs(handoffWave) * 2.6,
        scaleX: 1 - handoffWave * 0.008,
        scaleY: 1 + handoffWave * 0.008,
        rotateDeg: 1.4 + handoffWave * 1.1,
        shadowScale: 1 - Math.abs(handoffWave) * 0.04,
      };
    }
    return basePlannerMotion;
  };

  const plannerMotion = getPlannerSpecialMotion();

  const getPlannerLeft = (): number => {
    if (isPlannerIntro) {
      // 0~26틱 전체를 하나의 단일 연속 곡선(-4.5% -> 9.5%)으로 이동하여 중간에 멈칫거리거나 끊기는 현상 완벽 제거!
      if (tick < 26) return -4.5 + easeInOut(tick / 26) * 14.0;
      if (tick < 50) return 9.5; // 바닥에 앉아 첫 설계
      if (tick < 60) return 9.5 + easeInOut((tick - 50) / 10) * 14.0; // 9.5% -> 23.5%(디자이너에게 밀착 이동)
      return 23.5; // 60~72: 첫 산출물 전달
    }
    if (pLoop < 14) return 23.5 - easeInOut(pLoop / 14) * 14.0; // 23.5% -> 9.5%(왼쪽으로 고민하며 걸어감)
    if (pLoop < 66) return 9.5; // 바닥에 앉아 새로운 설계
    if (pLoop < 76) return 9.5 + easeInOut((pLoop - 66) / 10) * 14.0; // 9.5% -> 23.5%(디자이너에게 밀착 이동)
    return 23.5; // 76~88: 디자이너에게 새로운 산출물 전달
  };

  const plannerLeft = getPlannerLeft();

  const plannerSprite: string = isPlannerPeek
    ? `peek-${getInteractSubFrame(subTick, 0)}`
    : isPlannerThinkWalk
    ? `think-walk-${getWorkSubFrame(subTick, 0)}`
    : isPlannerSitSketch
    ? `sit-sketch-${getWorkSubFrame(subTick, 0)}`
    : isPlannerWalkToDesigner
    ? getWalkSubSprite(subTick, 0)
    : `handoff-${getInteractSubFrame(subTick, 0)}`;

  // 우측을 바라봐야 하는 구간: 빼꼼 등장(0~12), 초기 우측으로 고민하며 걸어올 때(12~26), 디자이너에게 다가갈 때
  // (산출물 전달 후 왼쪽으로 고민하며 돌아갈 때(isPlannerThinkWalkLeft)는 plannerFlipRight = false가 되어 자연스럽게 왼쪽을 보며 고민하며 걸어감!)
  const plannerFlipRight = isPlannerPeek || isPlannerThinkWalkRight || isPlannerWalkToDesigner;

  // 좌측 칠판(Zone 1: 기획자 머리 위) 진행률 및 새 사이클 전환 시 부드러운 지우개 페이드
  const isPlannerErasing = !isPlannerIntro && pLoop < 10;
  const plannerBoardFade = isPlannerErasing
    ? 0.25 + 0.75 * Math.abs(Math.cos((pLoop / 10) * Math.PI))
    : 1;
  const plannerBoardProgress = isPlannerIntro
    ? tick < 12
      ? Math.round((tick / 12) * 12)
      : tick < 26
      ? Math.round(12 + ((tick - 12) / 14) * 28)
      : tick < 50
      ? Math.min(100, Math.round(40 + ((tick - 26) / 22) * 60))
      : 100
    : pLoop < 5
    ? 100 // 지우개가 스윽 지나가는 전반부 동안 이전 도면이 부드럽게 페이드아웃
    : pLoop < 14
    ? Math.round(((pLoop - 5) / 9) * 32)
    : pLoop < 66
    ? Math.min(100, Math.round(32 + ((pLoop - 14) / 46) * 68))
    : 100;

  // =========================================================================
  // 2) 캐릭터 2 · 디자이너 (기획자가 설계 중인 28틱에 등장 후 화면에서 사라지지 않고 무한 협업 루프!)
  //    [최초 등장 (0 ~ 60틱)]
  //      - 0 ~ 28: 무대 아래에서 대기 (기획자가 먼저 등장해 설계를 시작할 때까지 대기)
  //      - 28 ~ 48: 기획자가 한창 설계 중인 타이밍에 뒤돌은 상태로 밑에서부터 기어올라오듯 등장 (climb-1..12)
  //      - 48 ~ 60: 올라와서 좌측 기획자 쪽(32.5%)으로 다가가기 (walk-s1..s12, 41.5% -> 32.5%)
  //    [연속 루프 (60틱 이후, 88틱 주기: dLoop = (tick - 60) % 88)]
  //      - 0 ~ 12 (12틱): [1차 핸드오프 밀착!] 기획자(23.5%)가 건네주는 설계도를 바로 앞에서 전달받음 (receive-1..8, 32.5%)
  //      - 12 ~ 18 (6틱): 전달받은 설계도를 들고 중앙 작업 위치(41.5%)로 이동 (walk-s1..s12, 32.5% -> 41.5%)
  //      - 18 ~ 58 (40틱): 전달받은 설계 도면에 직접 알록달록 색칠(디자인) 진행 (paint-1..12, 41.5%)
  //      - 58 ~ 66 (8틱): 완료되면 우측 퍼블리셔 쪽(51.5%)으로 가까이 다가가기 (walk-s1..s12, 41.5% -> 51.5%)
  //      - 66 ~ 78 (12틱): [2차 핸드오프 밀착!] 퍼블리셔(60.5%)에게 완성된 디자인 산출물 전달 (handoff-1..8, 51.5%)
  //      - 78 ~ 88 (10틱): 사라지지 않고 다시 왼쪽(51.5% -> 32.5%)으로 걸어가 기획자의 새 산출물 맞이 준비! -> 0틱(수령) 직결
  // =========================================================================
  const isDesignerIntro = tick < 60;
  const dLoop = isDesignerIntro ? -1 : (tick - 60) % 88;

  const designerVisible = tick >= 28;
  const isDesignerClimbing = isDesignerIntro && tick >= 28 && tick < 48;
  const isDesignerWalkToPlanner =
    (isDesignerIntro && tick >= 48 && tick < 60) || (!isDesignerIntro && dLoop >= 78);
  const isDesignerReceiving = !isDesignerIntro && dLoop >= 0 && dLoop < 12;
  const isDesignerWalkToCenter = !isDesignerIntro && dLoop >= 12 && dLoop < 18;
  const isDesignerPainting = !isDesignerIntro && dLoop >= 18 && dLoop < 58;
  const isDesignerWalkToPublisher = !isDesignerIntro && dLoop >= 58 && dLoop < 66;
  const isDesignerHandoff = !isDesignerIntro && dLoop >= 66 && dLoop < 78;

  const isDesignerWalking =
    isDesignerWalkToPlanner || isDesignerWalkToCenter || isDesignerWalkToPublisher;
  const designerWalkDir: -1 | 0 | 1 = isDesignerWalkToPlanner
    ? -1
    : isDesignerWalkToCenter || isDesignerWalkToPublisher
    ? 1
    : 0;
  const baseDesignerMotion = getCharacterMotion(isDesignerWalking, subTick, 7, designerWalkDir);

  // 디자이너 특수 모션: 과도한 흔들거림이나 단절 점프 없이 60fps 연속 사인파로 부드럽게 이어지는 클라이밍·색칠·핸드오프
  const getDesignerSpecialMotion = () => {
    if (!designerVisible) {
      return { bounceY: 220, scaleX: 1, scaleY: 1, rotateDeg: 0, shadowScale: 0 };
    }
    if (isDesignerClimbing) {
      const climbProgress = easeInOut((tick - 28) / 20); // 0.0 -> 1.0
      const climbEnv = 1 - climbProgress;
      const climbY = climbEnv * 155;
      const stepLift = Math.sin(subTick * 0.45) * -2.6 * climbEnv;
      const swayDeg = Math.sin(subTick * 0.35) * 1.4 * climbEnv;
      const stretch = Math.sin(subTick * 0.45) * 0.01 * climbEnv;
      return {
        bounceY: climbY + stepLift,
        scaleX: 1 - stretch * 0.7,
        scaleY: 1 + stretch,
        rotateDeg: swayDeg,
        shadowScale: Math.max(0.2, climbProgress * 0.96),
      };
    }
    if (isDesignerPainting) {
      const paintWave = Math.sin(subTick * 0.42);
      const bodySwayDeg = Math.cos(subTick * 0.32) * 1.2;
      const squash = paintWave * 0.008;
      return {
        bounceY: paintWave * 1.4 - 0.8,
        scaleX: 1 - squash * 0.7,
        scaleY: 1 + squash,
        rotateDeg: bodySwayDeg,
        shadowScale: 1 - Math.abs(paintWave) * 0.02,
      };
    }
    if (isDesignerReceiving || isDesignerHandoff) {
      const bowWave = Math.sin(subTick * 0.45);
      const dirSign = isDesignerHandoff ? 1 : -1;
      return {
        bounceY: -Math.abs(bowWave) * 2.6,
        scaleX: 1 - bowWave * 0.008,
        scaleY: 1 + bowWave * 0.008,
        rotateDeg: dirSign * (1.2 + Math.abs(bowWave) * 1.1),
        shadowScale: 1 - Math.abs(bowWave) * 0.04,
      };
    }
    return baseDesignerMotion;
  };

  const designerMotion = getDesignerSpecialMotion();

  const getDesignerLeft = (): number => {
    if (isDesignerIntro) {
      if (tick < 48) return 41.5; // 중앙 아래에서 기어올라옴
      return 41.5 - easeInOut((tick - 48) / 12) * 9.0; // 41.5% -> 32.5%(기획자 마중 밀착)
    }
    if (dLoop < 12) return 32.5; // 32.5% 기획자(23.5%)와 9.0% 간격으로 밀착해 설계도 수령!
    if (dLoop < 18) return 32.5 + easeInOut((dLoop - 12) / 6) * 9.0; // 32.5% -> 41.5%
    if (dLoop < 58) return 41.5; // 받은 설계도에 색칠하기
    if (dLoop < 66) return 41.5 + easeInOut((dLoop - 58) / 8) * 10.0; // 41.5% -> 51.5%(퍼블리셔에게 밀착 이동)
    if (dLoop < 78) return 51.5; // 51.5% 퍼블리셔(60.5%)와 9.0% 간격으로 밀착해 디자인 전달!
    return 51.5 - easeInOut((dLoop - 78) / 10) * 19.0; // 51.5% -> 32.5%(다시 왼쪽으로 걸어가 기획자의 새 산출물 받기!)
  };

  const designerLeft = getDesignerLeft();

  const designerSprite: string = !designerVisible
    ? 'climb-1'
    : isDesignerClimbing
    ? `climb-${getWorkSubFrame(subTick, 2)}`
    : isDesignerWalking
    ? getWalkSubSprite(subTick, 5)
    : isDesignerReceiving
    ? `receive-${getInteractSubFrame(subTick, 3)}`
    : isDesignerPainting
    ? `paint-${getWorkSubFrame(subTick, 3)}`
    : `handoff-${getInteractSubFrame(subTick, 3)}`;

  // 우측으로 이동할 때(32.5->41.5, 41.5->51.5) 또는 우측 퍼블리셔에게 산출물을 건넬 때만 우측 방향 반전
  const designerFlipRight =
    isDesignerWalkToCenter || isDesignerWalkToPublisher || isDesignerHandoff;

  // 중앙 칠판(Zone 2: 디자이너 머리 위) 진행률 및 새 사이클 전환 시 부드러운 지우개 페이드
  const isFirstDesignerLoop = !isDesignerIntro && tick < 148;
  const isDesignerErasing = !isDesignerIntro && !isFirstDesignerLoop && dLoop < 10;
  const designerBoardFade = isDesignerErasing
    ? 0.25 + 0.75 * Math.abs(Math.cos((dLoop / 10) * Math.PI))
    : 1;
  const designerBoardProgress = isDesignerIntro
    ? 0
    : dLoop < 5
    ? isFirstDesignerLoop
      ? 0
      : 100 // 2번째 루프부터는 지우개가 지나가는 전반부 동안 이전 컬러 시안이 부드럽게 페이드아웃
    : dLoop < 12
    ? 0
    : dLoop < 18
    ? Math.round(((dLoop - 12) / 6) * 18)
    : dLoop < 58
    ? Math.min(100, Math.round(18 + ((dLoop - 18) / 36) * 82))
    : 100;

  // =========================================================================
  // 3) 캐릭터 3 · 퍼블리셔 (디자이너가 디자인 중인 94틱에 등장 후 화면에서 사라지지 않고 무한 협업 루프!)
  // =========================================================================
  const isPubIntro = tick < 126;
  const pubLoop = isPubIntro ? -1 : (tick - 126) % 88;

  const publisherVisible = tick >= 94;
  const isPubWalkToDesigner = !isPubIntro && pubLoop >= 78;
  // 최초 등장할 때(94~126)뿐 아니라, 완료 후 새 산출물을 받으러 왼쪽으로 걸어갈 때(pubLoop >= 78)도 헤드셋을 끼고 흥얼거리며 이동!
  const isPubHumWalk = (isPubIntro && tick >= 94 && tick < 126) || isPubWalkToDesigner;
  const isPubReceive = !isPubIntro && pubLoop >= 0 && pubLoop < 12;
  const isPubWalkToDesk = !isPubIntro && pubLoop >= 12 && pubLoop < 18;
  const isPubHeadsetOff = !isPubIntro && pubLoop >= 18 && pubLoop < 28;
  const isPubCodingNoHeadset = !isPubIntro && pubLoop >= 28 && pubLoop < 66;
  const isPubCelebrating = !isPubIntro && pubLoop >= 66 && pubLoop < 78;

  const isPublisherWalking = isPubHumWalk || isPubWalkToDesk;
  const pubWalkDir: -1 | 0 | 1 = isPubWalkToDesk ? 1 : isPubHumWalk ? -1 : 0;
  const basePublisherMotion = getCharacterMotion(isPublisherWalking, subTick, 13, pubWalkDir);

  // 퍼블리셔 특수 모션: 과도한 흔들림 없이 리드미컬하고 부드럽게 이어지는 콧노래 걸음·헤드셋 탈착·코딩·완료 모션
  const getPublisherSpecialMotion = () => {
    if (isPubHumWalk) {
      const stepPhase = (((subTick + 3) % 6) / 6) * Math.PI;
      const grooveArch = Math.sin(stepPhase);
      const bounceY = -grooveArch * 4.0;
      const swayDeg = Math.sin(subTick * 0.36) * 1.4 - 0.8;
      const squash = Math.cos(stepPhase * 2) * 0.011;
      return {
        bounceY,
        scaleX: 1 - squash * 0.7,
        scaleY: 1 + squash,
        rotateDeg: swayDeg,
        shadowScale: 1 - grooveArch * 0.08,
      };
    }
    if (isPubReceive) {
      const bowWave = Math.sin(subTick * 0.45);
      return {
        bounceY: -Math.abs(bowWave) * 2.6,
        scaleX: 1 - bowWave * 0.008,
        scaleY: 1 + bowWave * 0.008,
        rotateDeg: -1.2 - Math.abs(bowWave) * 1.1,
        shadowScale: 1 - Math.abs(bowWave) * 0.04,
      };
    }
    if (isPubHeadsetOff) {
      const t = Math.max(0, Math.min(1, (pubLoop - 18) / 10));
      const liftY = -Math.sin(t * Math.PI) * 2.8;
      return {
        bounceY: liftY,
        scaleX: 1 - liftY * 0.003,
        scaleY: 1 + liftY * 0.003,
        rotateDeg: Math.sin(t * Math.PI * 2) * 1.1,
        shadowScale: 1,
      };
    }
    if (isPubCodingNoHeadset) {
      const codeWave = Math.sin(subTick * 0.55);
      const tiltWave = Math.sin(subTick * 0.32) * 0.85;
      return {
        bounceY: codeWave * 1.1 - 0.6,
        scaleX: 1 - codeWave * 0.006,
        scaleY: 1 + codeWave * 0.006,
        rotateDeg: tiltWave,
        shadowScale: 1.01,
      };
    }
    if (isPubCelebrating) {
      const celPhase = ((pubLoop - 66) / 6) * Math.PI;
      const jumpArch = Math.abs(Math.sin(celPhase));
      const jumpY = -jumpArch * 5.2;
      const stretch = Math.cos(celPhase * 2) * -0.012;
      return {
        bounceY: jumpY,
        scaleX: 1 - stretch * 0.7,
        scaleY: 1 + stretch,
        rotateDeg: Math.sin(celPhase) * 1.4,
        shadowScale: Math.max(0.82, 1 - jumpArch * 0.12),
      };
    }
    return basePublisherMotion;
  };

  const publisherMotion = getPublisherSpecialMotion();

  const getPublisherLeft = (): number => {
    if (isPubIntro) {
      if (tick < 94) return 92.0; // 우측 화면 밖 대기
      return 92.0 - easeInOut((tick - 94) / 32) * 31.5; // 92.0%(우측 끝) -> 60.5%(디자이너 앞으로 흥얼거리며 밀착 등장)
    }
    if (pubLoop < 12) return 60.5; // 60.5% 디자이너(51.5%)와 9.0% 간격으로 밀착해 디자인 산출물 수령!
    if (pubLoop < 18) return 60.5 + easeInOut((pubLoop - 12) / 6) * 12.5; // 60.5% -> 73.0%(Zone 3 중앙)
    if (pubLoop < 78) return 73.0; // 헤드셋 벗고 코딩 & 완료
    return 73.0 - easeInOut((pubLoop - 78) / 10) * 12.5; // 73.0% -> 60.5%(헤드셋 끼고 흥얼거리며 디자이너의 새 산출물 받으러 이동!)
  };

  const publisherLeft = getPublisherLeft();

  const publisherSprite: string = !publisherVisible
    ? 'hum-walk-1'
    : isPubHumWalk
    ? `hum-walk-${getWorkSubFrame(subTick, 4)}`
    : isPubReceive
    ? `receive-${getInteractSubFrame(subTick, 7)}`
    : isPubWalkToDesk
    ? getWalkSubSprite(subTick, 11)
    : isPubHeadsetOff
    ? `headset-off-${getInteractSubFrame(subTick, 5)}`
    : isPubCodingNoHeadset
    ? `code-focus-${getWorkSubFrame(subTick, 7)}`
    : `complete-${getInteractSubFrame(subTick, 7)}`;

  // 우측 작업석(60.5% -> 73.0%)으로 이동할 때만 우측 방향 반전 (흥얼거리며 왼쪽으로 이동·수령할 때는 왼쪽을 바라봄)
  const publisherFlipRight = isPubWalkToDesk;

  // 우측 칠판(Zone 3: 퍼블리셔 머리 위) 진행률 및 새 사이클 전환 시 부드러운 지우개 페이드
  const isFirstPubLoop = !isPubIntro && tick < 214;
  const isPublisherErasing = !isPubIntro && !isFirstPubLoop && pubLoop < 10;
  const publisherBoardFade = isPublisherErasing
    ? 0.25 + 0.75 * Math.abs(Math.cos((pubLoop / 10) * Math.PI))
    : 1;
  const publisherBoardProgress = isPubIntro
    ? 0
    : pubLoop < 5
    ? isFirstPubLoop
      ? 0
      : 100 // 2번째 루프부터는 지우개가 지나가는 전반부 동안 이전 코드가 부드럽게 페이드아웃
    : pubLoop < 12
    ? 0
    : pubLoop < 18
    ? Math.round(((pubLoop - 12) / 6) * 15)
    : pubLoop < 28
    ? Math.round(15 + ((pubLoop - 18) / 10) * 15)
    : pubLoop < 66
    ? Math.min(100, Math.round(30 + ((pubLoop - 28) / 34) * 70))
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

            {isPlannerThinkWalk && (
              <div className="story-vfx-layer">
                <div
                  className={`story-vfx-question-lg ${
                    plannerFlipRight ? 'flip-right' : 'flip-left'
                  }`}
                >
                  ?
                </div>
                <div
                  className={`story-vfx-question-sm ${
                    plannerFlipRight ? 'flip-right' : 'flip-left'
                  }`}
                >
                  ?
                </div>
              </div>
            )}

            {isPlannerSitSketch && (
              <div className="story-vfx-layer">
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 54 54"
                  className="story-vfx-bulb"
                >
                  <g stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="27" y1="4" x2="27" y2="9" />
                    <line x1="10" y1="11" x2="14" y2="15" />
                    <line x1="44" y1="11" x2="40" y2="15" />
                    <line x1="5" y1="26" x2="10" y2="26" />
                    <line x1="49" y1="26" x2="44" y2="26" />
                  </g>
                  <circle cx="27" cy="25" r="11" fill="#fde047" stroke="#4a3525" strokeWidth="2.2" />
                  <rect x="22" y="35" width="10" height="6" rx="2" fill="#e2e8f0" stroke="#4a3525" strokeWidth="2" />
                  <path d="M24 27 Q27 20 30 27" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            )}

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

            {isDesignerPainting && (
              <div className="story-vfx-layer">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  className="story-vfx-swatch"
                >
                  <rect x="10" y="8" width="10" height="24" rx="2.5" fill="#3b82f6" stroke="#4a3525" strokeWidth="1.8" transform="rotate(-18 15 28)" />
                  <rect x="16" y="8" width="10" height="24" rx="2.5" fill="#10b981" stroke="#4a3525" strokeWidth="1.8" transform="rotate(6 21 28)" />
                  <rect x="20" y="10" width="10" height="24" rx="2.5" fill="#8b5cf6" stroke="#4a3525" strokeWidth="1.8" transform="rotate(28 25 28)" />
                </svg>
              </div>
            )}

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

            {isPubCodingNoHeadset && (
              <div className="story-vfx-layer">
                <div className="story-vfx-code-tag">{'</>'}</div>
                <div className="story-vfx-brace-tag">{'{ }'}</div>
              </div>
            )}

            {isPubCelebrating && (
              <div className="story-vfx-layer">
                <div className="story-vfx-html-badge">{'<HTML/>'}</div>
              </div>
            )}

            <div className="story-char-badge-wrap">
              <div className="story-char-badge story-char-badge-publisher">퍼블리셔</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
