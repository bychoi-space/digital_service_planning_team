import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // 1서브틱 = 50ms (20fps 안정적인 모션 타이머, 스프라이트는 100ms(10fps) 주기로 깜빡임 없이 전환)
  const [subTick, setSubTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      // 초기 등장 이후 3인이 사라지지 않고 영구적으로 협업 루프를 이어가도록 연속 증가
      setSubTick((prev) => prev + 1);
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

  // 12프레임 360° 연속 사인파 워킹 사이클 (100ms마다 한 프레임씩 부드럽게 순환)
  const getWalkSubSprite = (st: number, offset: number) =>
    `walk-s${(Math.floor((st + offset) / 2) % 12) + 1}`;

  // 12프레임 360° 연속 사인파 메인 액션 사이클 (1 -> 2 -> ... -> 12 -> 1)
  const getWorkSubFrame = (st: number, offset: number) =>
    (Math.floor((st + offset) / 2) % 12) + 1;

  // 8프레임 360° 연속 사인파 인터랙션 사이클 (1 -> 2 -> ... -> 8 -> 1)
  const getInteractSubFrame = (st: number, offset: number) =>
    (Math.floor((st + offset) / 2) % 8) + 1;

  // 극장판 애니메이션 물리 엔진: 보행 방향 기울기(Velocity Lean) + 착지 탄성(Snap & Squash) + 비대칭 리듬
  const getCharacterMotion = (
    isWalking: boolean,
    st: number,
    phaseOffset: number,
    walkDir: -1 | 0 | 1 = 0
  ) => {
    if (isWalking) {
      // 6서브틱(300ms) = 1보행 스텝 사이클 (스프라이트 멀티포즈 다리 교차와 100% 동기화!)
      const stepPhase = (((st + phaseOffset) % 6) / 6) * Math.PI;
      const arch = Math.sin(stepPhase); // 0 -> 1(공중 정점) -> 0(착지)
      const isContact = arch < 0.28;
      const bounceY = -Math.pow(arch, 0.85) * 10.5 + (isContact ? 1.8 : 0);
      const squash = isContact ? -0.038 : arch * 0.028;
      const scaleX = 1 - squash * 0.8;
      const scaleY = 1 + squash;
      // 진행 방향으로 몸을 살짝 기울이는 추진력(Velocity Lean) + 발걸음 리듬 스웨이
      const velocityLean = walkDir * 2.8;
      const stepSway = Math.cos(((st + phaseOffset) / 6) * Math.PI) * 2.2;
      const rotateDeg = velocityLean + stepSway;
      const shadowScale = 1 - arch * 0.24 + (isContact ? 0.06 : 0);
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    } else {
      const phase = (st + phaseOffset) * 0.28;
      const bounceY = Math.sin(phase) * 2.2 - 1.2;
      const squash = Math.sin(phase) * 0.014;
      const scaleX = 1 - squash * 0.65;
      const scaleY = 1 + squash;
      const rotateDeg = Math.sin(phase * 0.7) * 1.1;
      const shadowScale = 1 + Math.sin(phase) * 0.04;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    }
  };

  // =========================================================================
  // ★ [순차 등장 + 끊김 없는 88틱 무한 릴레이 협업 아키텍처] ★
  // =========================================================================
  const plannerVisible = true;
  const isPlannerIntro = tick < 72;
  const pLoop = isPlannerIntro ? 0 : (tick - 72) % 88;

  const isPlannerPeek = isPlannerIntro && tick < 12;
  const isPlannerThinkWalkRight = isPlannerIntro && tick >= 12 && tick < 26;
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
      // 빼꼼 등장: 두 번 갸우뚱하며 주변을 살피는 Snap & Hold 모션
      const peekProgress = easeInOut(Math.min(1, tick / 8));
      const snapLook = tick > 5 && tick < 8.5 ? -4.5 : 0;
      const peekBob = -Math.abs(Math.sin(subTick * 0.45)) * 4.5;
      return {
        bounceY: peekBob,
        scaleX: 1.02,
        scaleY: 0.98,
        rotateDeg: 14 * peekProgress + snapLook + Math.sin(subTick * 0.4) * 2.5,
        shadowScale: 0.88,
      };
    }
    if (isPlannerThinkWalk) {
      // 골똘히 고민하며 걷기: 고개를 갸우뚱하며 걷다가 착석 직전(마지막 2틱) "유레카(💡)!" 폴짝 점프!
      const walkRemain = isPlannerThinkWalkRight ? 26 - tick : 14 - pLoop;
      if (walkRemain <= 2.2) {
        const eurekaT = (2.2 - walkRemain) / 2.2;
        const jumpY = -Math.sin(eurekaT * Math.PI) * 14.0;
        return {
          bounceY: jumpY,
          scaleX: 0.96,
          scaleY: 1.05,
          rotateDeg: 0,
          shadowScale: Math.max(0.65, 1 + jumpY * 0.02),
        };
      }
      const thinkTilt = Math.sin(subTick * 0.32) * 3.8;
      return {
        ...basePlannerMotion,
        rotateDeg: basePlannerMotion.rotateDeg * 0.5 + thinkTilt,
      };
    }
    if (isPlannerSitSketch) {
      // 착석 직후 4틱 구간: "털푸덕!" 바닥에 주저앉는 탄성 스쿼시 모션
      if (sitElapsed < 4) {
        const t = sitElapsed / 4;
        const dropY = t < 0.45 ? -9 * (1 - t / 0.45) : 10 * Math.sin(((t - 0.45) / 0.55) * Math.PI);
        const plopSquash = t >= 0.4 ? Math.sin(((t - 0.4) / 0.6) * Math.PI) * 0.095 : -0.045;
        return {
          bounceY: dropY + 6,
          scaleX: 1 + plopSquash,
          scaleY: 1 - plopSquash,
          rotateDeg: Math.sin(t * Math.PI * 2) * 3.0,
          shadowScale: 1.16 + plopSquash * 0.85,
        };
      }
      // 기상 직전 3틱 구간: 바닥에서 폴짝 일어나는 예비 동작(Stand-up Hop)
      if (sitElapsed >= sitDuration - 3) {
        const standT = (sitElapsed - (sitDuration - 3)) / 3;
        const hopY = standT < 0.38 ? 9 : -11 * Math.sin(((standT - 0.38) / 0.62) * Math.PI);
        const stretch = standT < 0.38 ? -0.06 : 0.055 * Math.sin(((standT - 0.38) / 0.62) * Math.PI);
        return {
          bounceY: hopY,
          scaleX: 1 - stretch,
          scaleY: 1 + stretch,
          rotateDeg: (1 - standT) * 2.5,
          shadowScale: 1.0 - Math.max(0, -hopY) * 0.022,
        };
      }
      // 스케치 본 구간: 빠른 펜 드로잉(Snap) 11서브틱 + 위쪽 칠판 올려다보기(Hold) 5서브틱 비대칭 리듬!
      const cyclePos = subTick % 16;
      const isLookingUp = cyclePos >= 11;
      const rapidStroke = isLookingUp ? 0 : Math.sin(subTick * 1.45) * 2.6;
      const lookUpLift = isLookingUp ? -3.5 : 1.5;
      const lookUpTilt = isLookingUp ? -3.2 : 2.2 + Math.sin(subTick * 0.9) * 1.6;
      return {
        bounceY: 6 + lookUpLift + rapidStroke,
        scaleX: isLookingUp ? 0.985 : 1.015 + Math.sin(subTick * 1.45) * 0.014,
        scaleY: isLookingUp ? 1.018 : 0.988 - Math.sin(subTick * 1.45) * 0.014,
        rotateDeg: lookUpTilt,
        shadowScale: 1.15,
      };
    }
    if (isPlannerHandoff) {
      // 산출물 전달: 디자이너를 향해 두 손으로 도면을 내밀며 반갑게 두 번 까딱 인사하는 모션
      const handoffWave = Math.sin(subTick * 0.65);
      return {
        bounceY: -Math.abs(handoffWave) * 5.5,
        scaleX: 1 - handoffWave * 0.018,
        scaleY: 1 + handoffWave * 0.018,
        rotateDeg: 2.5 + handoffWave * 2.4,
        shadowScale: 1 - Math.abs(handoffWave) * 0.1,
      };
    }
    return basePlannerMotion;
  };

  const plannerMotion = getPlannerSpecialMotion();

  const getPlannerLeft = (): number => {
    if (isPlannerIntro) {
      if (tick < 12) return -4.5 + easeInOut(tick / 12) * 5.0; // -4.5% -> 0.5%(빼꼼)
      if (tick < 26) return 0.5 + easeInOut((tick - 12) / 14) * 9.0; // 0.5% -> 9.5%(고민하며 걸어옴)
      if (tick < 50) return 9.5; // 바닥에 앉아 첫 설계
      if (tick < 60) return 9.5 + easeInOut((tick - 50) / 10) * 14.0; // 9.5% -> 23.5%(디자이너에게 더 가까이 밀착!)
      return 23.5; // 60~72: 첫 산출물 전달 (디자이너 32.5%와 9.0% 간격으로 밀착)
    }
    if (pLoop < 14) return 23.5 - easeInOut(pLoop / 14) * 14.0; // 23.5% -> 9.5%(왼쪽으로 고민하며 걸어감!)
    if (pLoop < 66) return 9.5; // 바닥에 털푸덕 앉아 새로운 설계
    if (pLoop < 76) return 9.5 + easeInOut((pLoop - 66) / 10) * 14.0; // 9.5% -> 23.5%(디자이너에게 밀착 이동)
    return 23.5; // 76~88: 디자이너(32.5%)에게 새로운 산출물 전달
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

  // 디자이너 특수 모션: 기어올라오기 + 수령/전달 인사 + 역동적인 붓질 스윙(Snap & Hold)
  const getDesignerSpecialMotion = () => {
    if (!designerVisible) {
      return { bounceY: 220, scaleX: 1, scaleY: 1, rotateDeg: 0, shadowScale: 0 };
    }
    if (isDesignerClimbing) {
      // "영차! 영차!" 힘을 주어 턱을 짚고 올라오는 비대칭 클라이밍 텐션
      const climbProgress = easeInOut((tick - 28) / 20); // 0.0 -> 1.0
      const climbY = (1 - climbProgress) * 165;
      const pullCycle = (subTick % 8) / 8;
      const pullSnap = pullCycle < 0.45 ? Math.sin((pullCycle / 0.45) * Math.PI) * -9.5 : 0;
      const swayDeg = Math.sin(subTick * 0.65) * 4.2;
      const stretchY = 1 + (pullSnap < -3 ? 0.045 : -0.02);
      return {
        bounceY: climbY + pullSnap,
        scaleX: 2 - stretchY,
        scaleY: stretchY,
        rotateDeg: swayDeg,
        shadowScale: Math.max(0.15, climbProgress * 0.95),
      };
    }
    if (isDesignerPainting) {
      // 붓으로 도면을 휙휙 칠하는 3연속 붓질(Snap) + 한 발 물러서서 색감 감상(Hold) 리듬!
      const paintCycle = subTick % 14;
      const isAdmiring = paintCycle >= 10;
      const brushSwing = isAdmiring ? 0 : Math.sin(subTick * 1.35) * 4.2;
      const bodySwayDeg = isAdmiring ? 2.8 : Math.cos(subTick * 1.35) * 3.4;
      const squash = isAdmiring ? -0.015 : Math.sin(subTick * 1.35) * 0.024;
      return {
        bounceY: (isAdmiring ? -2.5 : -Math.abs(brushSwing)) - 1.0,
        scaleX: 1 - squash * 0.8,
        scaleY: 1 + squash,
        rotateDeg: bodySwayDeg,
        shadowScale: 1 - Math.abs(brushSwing) * 0.025,
      };
    }
    if (isDesignerReceiving || isDesignerHandoff) {
      // 산출물 수령/전달 시 반갑게 몸을 숙여 인사하며 주고받는 탄성 모션
      const bowWave = Math.sin(subTick * 0.65);
      const dirSign = isDesignerHandoff ? 1 : -1;
      return {
        bounceY: -Math.abs(bowWave) * 5.8,
        scaleX: 1 - bowWave * 0.02,
        scaleY: 1 + bowWave * 0.02,
        rotateDeg: dirSign * (2.2 + Math.abs(bowWave) * 2.5),
        shadowScale: 1 - Math.abs(bowWave) * 0.1,
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

  const designerSprite: string = isDesignerClimbing
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

  // 퍼블리셔 특수 모션 (그루브 넘치는 콧노래 걸음 + 헤드셋 탈착 + 초집중 폭풍 타이핑 + 완료 점프 환호!)
  const getPublisherSpecialMotion = () => {
    if (isPubHumWalk) {
      // 콧노래 그루브: 6서브틱 스텝마다 신나게 통통 튀며 좌우로 리듬을 타는 댄스 워킹!
      const stepPhase = (((subTick + 3) % 6) / 6) * Math.PI;
      const grooveArch = Math.sin(stepPhase);
      const bounceY = -Math.pow(grooveArch, 0.8) * 11.5;
      const swayDeg = Math.sin(subTick * 0.55) * 4.5 - 2.0;
      const squash = grooveArch < 0.25 ? -0.036 : grooveArch * 0.03;
      return {
        bounceY,
        scaleX: 1 - squash * 0.75,
        scaleY: 1 + squash,
        rotateDeg: swayDeg,
        shadowScale: 1 - grooveArch * 0.24,
      };
    }
    if (isPubReceive) {
      const bowWave = Math.sin(subTick * 0.65);
      return {
        bounceY: -Math.abs(bowWave) * 5.5,
        scaleX: 1 - bowWave * 0.018,
        scaleY: 1 + bowWave * 0.018,
        rotateDeg: -2.2 - Math.abs(bowWave) * 2.2,
        shadowScale: 1 - Math.abs(bowWave) * 0.1,
      };
    }
    if (isPubHeadsetOff) {
      const t = (pubLoop - 18) / 10;
      const liftY =
        t < 0.45
          ? -7.5 * Math.sin((t / 0.45) * Math.PI)
          : 4.5 * Math.sin(((t - 0.45) / 0.55) * Math.PI);
      return {
        bounceY: liftY,
        scaleX: 1 - liftY * 0.005,
        scaleY: 1 + liftY * 0.005,
        rotateDeg: Math.sin(t * Math.PI * 2) * 3.0,
        shadowScale: 1,
      };
    }
    if (isPubCodingNoHeadset) {
      // 초집중 폭풍 코딩: 빠른 타건 진동(Burst) 10서브틱 + 엔터 키 타격(Snap!) 리듬
      const codeCycle = subTick % 12;
      const isEnterHit = codeCycle === 10 || codeCycle === 11;
      const rapidTap = isEnterHit ? 3.5 : Math.sin(subTick * 1.8) * 2.4;
      const enterTilt = isEnterHit ? -3.0 : Math.sin(subTick * 0.9) * 1.8;
      return {
        bounceY: rapidTap - 1.5,
        scaleX: isEnterHit ? 1.032 : 1 - Math.sin(subTick * 1.8) * 0.015,
        scaleY: isEnterHit ? 0.968 : 1 + Math.sin(subTick * 1.8) * 0.015,
        rotateDeg: enterTilt,
        shadowScale: 1.04,
      };
    }
    if (isPubCelebrating) {
      // 퍼블리싱 완료 환호: 제자리에서 신나게 두 번 폴짝! 점프하며 만세!
      const celPhase = ((pubLoop - 66) / 6) * Math.PI;
      const jumpArch = Math.abs(Math.sin(celPhase));
      const jumpY = - jumpArch * 15.5;
      const stretch = jumpArch > 0.3 ? jumpArch * 0.045 : -0.035;
      return {
        bounceY: jumpY,
        scaleX: 1 - stretch * 0.75,
        scaleY: 1 + stretch,
        rotateDeg: Math.sin(celPhase * 2) * 3.5,
        shadowScale: Math.max(0.6, 1 - jumpArch * 0.32),
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

  const publisherSprite: string = isPubHumWalk
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

              {/* Zone 1 미니멀 와이어프레임 도면 (블록이 순서대로 깔끔하게 그려짐 + 새 사이클 시 부드러운 페이드 전환) */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  opacity: plannerBoardFade,
                  transition: 'opacity 0.22s ease',
                }}
              >
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

              {/* Zone 2 미니멀 컬러 UI 디자인 보드 (와이어프레임과 동일한 구조에 컬러와 비주얼이 입혀짐 + 부드러운 페이드 전환) */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  opacity: designerBoardFade,
                  transition: 'opacity 0.22s ease',
                }}
              >
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

              {/* Zone 3 미니멀 코드 에디터 창 (코드가 한 줄씩 깔끔하게 타이핑됨 + 부드러운 페이드 전환) */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  opacity: publisherBoardFade,
                  transition: 'opacity 0.22s ease',
                }}
              >
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
            2. 하단 캐릭터 동시 액션 무대 (따뜻하고 세련된 사무실 벽면·우드 바닥 배경 + 3인 협업)
           ===================================================================== */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '248px',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 68%, #e2e8f0 100%)',
            borderRadius: '0 0 16px 16px',
            marginTop: '-10px',
            overflow: 'hidden',
          }}
        >
          {/* ---------------- [사무실 배경 레이어 1] 스튜디오 벽면 웨인스코팅 패널 & 소품 ---------------- */}
          <svg
            viewBox="0 0 1200 190"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '188px',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {/* 은은한 벽면 웨인스코팅(Wainscoting) 몰딩 라인 */}
            <rect
              x="24"
              y="18"
              width="356"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.45)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x="404"
              y="18"
              width="392"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.45)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />
            <rect
              x="820"
              y="18"
              width="356"
              height="152"
              rx="6"
              fill="rgba(255,255,255,0.45)"
              stroke="#e2e8f0"
              strokeWidth="1.5"
            />

            {/* [좌측 · 기획 구역 벽면 소품] 채광 창문 + 미니 벽시계 + 포스트잇 메모 보드 */}
            <g opacity="0.85">
              {/* 스튜디오 채광 창문 */}
              <rect
                x="48"
                y="32"
                width="96"
                height="94"
                rx="6"
                fill="#e0f2fe"
                stroke="#cbd5e1"
                strokeWidth="3"
              />
              <line x1="96" y1="32" x2="96" y2="126" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="48" y1="79" x2="144" y2="79" stroke="#cbd5e1" strokeWidth="2.5" />
              <polygon points="56,118 82,42 92,42 66,118" fill="rgba(255,255,255,0.55)" />
              {/* 원형 벽시계 */}
              <circle cx="332" cy="54" r="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
              <line x1="332" y1="54" x2="332" y2="43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <line x1="332" y1="54" x2="341" y2="54" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="332" cy="54" r="2" fill="#ef4444" />
              {/* 미니 아이디어 메모 보드 */}
              <rect x="250" y="76" width="62" height="44" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.8" />
              <rect x="257" y="83" width="14" height="13" rx="1.5" fill="#fef08a" />
              <rect x="275" y="83" width="14" height="13" rx="1.5" fill="#bfdbfe" />
              <rect x="293" y="83" width="12" height="13" rx="1.5" fill="#fbcfe8" />
              <rect x="257" y="100" width="22" height="12" rx="1.5" fill="#bbf7d0" />
            </g>

            {/* [중앙 · 디자인 구역 벽면 소품] 우드 선반 + 컬러 프레임 액자 + 스튜디오 화분 */}
            <g opacity="0.88">
              {/* 월넛 우드 벽선반 */}
              <rect x="546" y="72" width="118" height="6" rx="3" fill="#caa074" />
              <rect x="558" y="42" width="28" height="30" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="572" cy="54" r="6" fill="#f472b6" />
              <rect x="564" y="63" width="16" height="4" rx="1" fill="#38bdf8" />
              {/* 선반 위 디자인 북 & 미니 다육이 */}
              <rect x="596" y="50" width="8" height="22" rx="1.5" fill="#60a5fa" />
              <rect x="605" y="53" width="8" height="19" rx="1.5" fill="#fbbf24" />
              <rect x="615" y="48" width="9" height="24" rx="1.5" fill="#a78bfa" />
              <rect x="636" y="58" width="14" height="14" rx="3" fill="#f97316" />
              <circle cx="643" cy="54" r="7" fill="#34d399" />
              {/* 바닥 쪽 아늑한 스튜디오 몬스테라 화분 (기획-디자인 사이 공간) */}
              <ellipse cx="392" cy="144" rx="14" ry="8" fill="#6ee7b7" />
              <ellipse cx="382" cy="150" rx="11" ry="6" fill="#34d399" transform="rotate(-18 382 150)" />
              <ellipse cx="402" cy="150" rx="11" ry="6" fill="#10b981" transform="rotate(18 402 150)" />
              <polygon points="382,155 402,155 398,184 386,184" fill="#d97706" />
              <rect x="380" y="152" width="24" height="5" rx="2" fill="#b45309" />
            </g>

            {/* [우측 · 퍼블리싱 구역 벽면 소품] 우드 선반 + 머그컵/개발서적 + 우측 코너 화분 */}
            <g opacity="0.88">
              <rect x="965" y="72" width="114" height="6" rx="3" fill="#caa074" />
              {/* 선반 위 커피 머그컵 & 북엔드 */}
              <rect x="980" y="56" width="14" height="16" rx="2.5" fill="#818cf8" />
              <path d="M994 59 H998 A3 3 0 0 1 998 68 H994" fill="none" stroke="#818cf8" strokeWidth="2" />
              <rect x="1010" y="48" width="9" height="24" rx="1.5" fill="#38bdf8" />
              <rect x="1020" y="51" width="9" height="21" rx="1.5" fill="#f472b6" />
              <rect x="1030" y="46" width="10" height="26" rx="1.5" fill="#34d399" />
              {/* 우측 코너 키 큰 오피스 화분 */}
              <ellipse cx="1138" cy="132" rx="15" ry="9" fill="#34d399" />
              <ellipse cx="1126" cy="142" rx="13" ry="7" fill="#10b981" transform="rotate(-22 1126 142)" />
              <ellipse cx="1150" cy="142" rx="13" ry="7" fill="#6ee7b7" transform="rotate(22 1150 142)" />
              <polygon points="1126,150 1150,150 1146,184 1130,184" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          </svg>

          {/* ---------------- [사무실 배경 레이어 2] 원목 걸레받이 몰딩 (Baseboard) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '58px',
              left: 0,
              right: 0,
              height: '8px',
              background: 'linear-gradient(180deg, #e2c6a6 0%, #c8a074 100%)',
              borderTop: '1px solid rgba(255, 255, 255, 0.7)',
              borderBottom: '1px solid #a67c52',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.08)',
              zIndex: 2,
            }}
          />

          {/* ---------------- [사무실 배경 레이어 3] 따뜻한 오크 우드 플로어 & 3인 작업 구역 러그 ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '58px',
              background:
                'repeating-linear-gradient(180deg, rgba(166, 124, 82, 0.10) 0px, rgba(166, 124, 82, 0.10) 1px, transparent 1px, transparent 14px), linear-gradient(180deg, #f3e7d8 0%, #ead8c3 52%, #dfcaa9 100%)',
              zIndex: 2,
            }}
          >
            {/* 우드 플로어 원근감 이음선 & 각 캐릭터 작업석 바닥 포인트 매트 */}
            <svg
              viewBox="0 0 1200 58"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
            >
              {/* 마루바닥 원근 구분선 */}
              <line x1="180" y1="0" x2="110" y2="58" stroke="rgba(146, 102, 58, 0.16)" strokeWidth="1.5" />
              <line x1="390" y1="0" x2="345" y2="58" stroke="rgba(146, 102, 58, 0.16)" strokeWidth="1.5" />
              <line x1="600" y1="0" x2="600" y2="58" stroke="rgba(146, 102, 58, 0.16)" strokeWidth="1.5" />
              <line x1="810" y1="0" x2="855" y2="58" stroke="rgba(146, 102, 58, 0.16)" strokeWidth="1.5" />
              <line x1="1020" y1="0" x2="1090" y2="58" stroke="rgba(146, 102, 58, 0.16)" strokeWidth="1.5" />

              {/* 1) 기획자 바닥 착석 매트 (털푸덕 앉아 설계하는 9.5% 구역) */}
              <ellipse
                cx="228"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(224, 242, 254, 0.72)"
                stroke="rgba(125, 211, 252, 0.85)"
                strokeWidth="2"
              />
              {/* 2) 디자이너 작업 구역 매트 (41.5% 구역) */}
              <ellipse
                cx="616"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(209, 250, 229, 0.72)"
                stroke="rgba(110, 231, 183, 0.85)"
                strokeWidth="2"
              />
              {/* 3) 퍼블리셔 코딩 구역 매트 (73.0% 구역) */}
              <ellipse
                cx="994"
                cy="34"
                rx="88"
                ry="15"
                fill="rgba(237, 233, 254, 0.75)"
                stroke="rgba(196, 181, 253, 0.85)"
                strokeWidth="2"
              />
            </svg>
          </div>
          {/* ---------------- [사무실 배경 레이어 4] 창문에서 쏟아지는 따뜻한 대각선 햇살 채광 (Volumetric Sunlight) ---------------- */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '2%',
              width: '26%',
              height: '100%',
              background:
                'linear-gradient(118deg, rgba(254, 249, 195, 0.28) 0%, rgba(224, 242, 254, 0.14) 55%, rgba(255, 255, 255, 0) 85%)',
              transform: 'skewX(-18deg)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* ---------------- 주인공 1: 기획자 (좌측 끝에서 가장 먼저 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: `${plannerLeft}%`,
              width: '236px',
              height: '268px',
              opacity: plannerVisible ? 1 : 0,
              transition: plannerVisible ? 'left 0.055s linear' : 'none',
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
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${plannerMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 보행 시 발뒤꿈치에서 포슬포슬 피어오르는 귀여운 스텝 먼지 이펙트 */}
            {isPlannerWalking && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: plannerWalkDir > 0 ? '26%' : '70%',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'rgba(203, 213, 225, 0.65)',
                  transform: `translateY(${-((subTick % 6) * 2.5)}px) scale(${1.2 - (subTick % 6) * 0.16})`,
                  opacity: 1 - (subTick % 6) * 0.16,
                  pointerEvents: 'none',
                }}
              />
            )}

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
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `peek-${n}`,
                  file: `planner-peek-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `think-walk-${n}`,
                  file: `planner-think-walk-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `sit-sketch-${n}`,
                  file: `planner-sit-sketch-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `walk-s${n}`,
                  file: `planner-walk-s${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `handoff-${n}`,
                  file: `planner-handoff-${n}.png`,
                })),
              ].map((sprite) => {
                const isCurrent = plannerSprite === sprite.key;
                return (
                  <img
                    key={sprite.key}
                    src={charImgUrl(sprite.file)}
                    alt={`기획자 ${sprite.key}`}
                    loading="eager"
                    decoding="sync"
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

            {/* ★ [기획자 독립 VFX 레이어] 캐릭터 몸통과 분리되어 공중에서 살아 움직이는 이펙트 ★ */}
            {isPlannerThinkWalk && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '26px',
                    left: plannerFlipRight ? '28px' : '176px',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#4a3525',
                    transform: `translateY(${Math.sin(subTick * 0.5) * -9}px) rotate(${Math.cos(subTick * 0.4) * 14}deg) scale(${0.95 + Math.sin(subTick * 0.5) * 0.15})`,
                    transition: 'transform 0.055s linear',
                    textShadow: '0 2px 4px rgba(255,255,255,0.9)',
                  }}
                >
                  ?
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: plannerFlipRight ? '54px' : '152px',
                    fontSize: '15px',
                    fontWeight: 900,
                    color: '#2563eb',
                    opacity: 0.55 + Math.sin(subTick * 0.6 + 1.5) * 0.4,
                    transform: `translateY(${-((subTick % 10) * 1.8)}px) rotate(${-12 + (subTick % 10) * 2}deg)`,
                    transition: 'transform 0.055s linear',
                  }}
                >
                  ?
                </div>
              </div>
            )}

            {isPlannerSitSketch && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* 반짝이며 살아 숨쉬는 아이디어 전구 이펙트 */}
                <svg
                  width="54"
                  height="54"
                  viewBox="0 0 54 54"
                  style={{
                    position: 'absolute',
                    top: '78px',
                    left: '26px',
                    transform: `translateY(${Math.sin(subTick * 0.55) * -6}px) scale(${0.92 + Math.abs(Math.sin(subTick * 0.55)) * 0.18}) rotate(${Math.sin(subTick * 0.35) * 8}deg)`,
                    transition: 'transform 0.055s linear',
                    filter: 'drop-shadow(0 3px 6px rgba(250, 204, 21, 0.45))',
                  }}
                >
                  {/* 전구 빛줄기 */}
                  <g opacity={0.45 + Math.abs(Math.sin(subTick * 0.8)) * 0.55} stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round">
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
                {/* 태블릿 펜 끝에서 톡톡 튀는 설계 스파크 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '142px',
                    left: '132px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#38bdf8',
                    boxShadow: '0 0 8px #38bdf8',
                    transform: `translate(${Math.cos(subTick * 1.6) * 9}px, ${Math.sin(subTick * 1.6) * -8}px) scale(${0.6 + (subTick % 3) * 0.35})`,
                    opacity: subTick % 16 < 11 ? 0.9 : 0.2,
                  }}
                />
              </div>
            )}

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

          {/* ---------------- 주인공 2: 디자이너 (기획자가 설계 중일 때 밑에서부터 기어올라와 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: `${designerLeft}%`,
              width: '236px',
              height: '268px',
              opacity: designerVisible ? 1 : 0,
              transition: designerVisible ? 'left 0.055s linear' : 'none',
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
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${designerMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 보행 시 발뒤꿈치 스텝 먼지 이펙트 */}
            {isDesignerWalking && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: designerWalkDir > 0 ? '26%' : '70%',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'rgba(203, 213, 225, 0.65)',
                  transform: `translateY(${-(((subTick + 3) % 6) * 2.5)}px) scale(${1.2 - ((subTick + 3) % 6) * 0.16})`,
                  opacity: 1 - ((subTick + 3) % 6) * 0.16,
                  pointerEvents: 'none',
                }}
              />
            )}

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
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `climb-${n}`,
                  file: `designer-climb-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `walk-s${n}`,
                  file: `designer-walk-s${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `receive-${n}`,
                  file: `designer-receive-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `paint-${n}`,
                  file: `designer-paint-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `handoff-${n}`,
                  file: `designer-handoff-${n}.png`,
                })),
              ].map((sprite) => {
                const isCurrent = designerSprite === sprite.key;
                return (
                  <img
                    key={sprite.key}
                    src={charImgUrl(sprite.file)}
                    alt={`디자이너 ${sprite.key}`}
                    loading="eager"
                    decoding="sync"
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

            {/* ★ [디자이너 독립 VFX 레이어] 수령 반짝이 & 붓질 시 사방으로 튀는 컬러 물방울/스와치 ★ */}
            {(isDesignerReceiving || isDesignerHandoff) && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  left: isDesignerHandoff ? '168px' : '38px',
                  fontSize: '20px',
                  transform: `translateY(${Math.sin(subTick * 0.8) * -6}px) scale(${0.9 + Math.abs(Math.sin(subTick * 0.8)) * 0.3})`,
                  transition: 'transform 0.055s linear',
                  pointerEvents: 'none',
                }}
              >
                ✨
              </div>
            )}

            {isDesignerPainting && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* 둥실 떠서 회전하는 컬러 스와치 팬 */}
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 44 44"
                  style={{
                    position: 'absolute',
                    top: '88px',
                    left: '20px',
                    transform: `translateY(${Math.sin(subTick * 0.5) * -7}px) rotate(${Math.cos(subTick * 0.45) * 12}deg)`,
                    transition: 'transform 0.055s linear',
                  }}
                >
                  <rect x="10" y="8" width="10" height="24" rx="2.5" fill="#fb7185" stroke="#4a3525" strokeWidth="1.8" transform="rotate(-18 15 28)" />
                  <rect x="16" y="8" width="10" height="24" rx="2.5" fill="#fde047" stroke="#4a3525" strokeWidth="1.8" transform="rotate(6 21 28)" />
                  <rect x="20" y="10" width="10" height="24" rx="2.5" fill="#34d399" stroke="#4a3525" strokeWidth="1.8" transform="rotate(28 25 28)" />
                </svg>
                {/* 붓질할 때마다 도면 위에서 톡톡 튀어오르는 3색 물방울 파티클 */}
                {[
                  { color: '#ec4899', x: 52, y: 132, phase: 0 },
                  { color: '#f59e0b', x: 76, y: 120, phase: 2 },
                  { color: '#10b981', x: 38, y: 152, phase: 4 },
                ].map((p, idx) => {
                  const t = (subTick + p.phase) % 8;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${p.x + Math.cos(t * 0.8) * 10}px`,
                        top: `${p.y - t * 3.2}px`,
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: p.color,
                        border: '1.5px solid #4a3525',
                        opacity: 1 - t / 8,
                        transform: `scale(${1.15 - t * 0.1})`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                bottom: '0px',
                left: '50%',
                transform: `translateX(-50%) translateY(${Math.max(0, designerMotion.bounceY)}px)`,
                transition: 'transform 0.055s linear',
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

          {/* ---------------- 주인공 3: 퍼블리셔 (디자이너가 디자인 중일 때 우측 끝에서 흥얼거리며 등장 · 236x268 확대) ---------------- */}
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: `${publisherLeft}%`,
              width: '236px',
              height: '268px',
              opacity: publisherVisible ? 1 : 0,
              transition: publisherVisible ? 'left 0.055s linear' : 'none',
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
                  'radial-gradient(ellipse at center, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0) 75%)',
                transform: `translateX(-50%) scale(${publisherMotion.shadowScale})`,
                transition: 'transform 0.055s linear',
                pointerEvents: 'none',
              }}
            />

            {/* 보행 시 발뒤꿈치 스텝 먼지 이펙트 */}
            {isPublisherWalking && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: pubWalkDir > 0 ? '26%' : '70%',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'rgba(203, 213, 225, 0.65)',
                  transform: `translateY(${-(((subTick + 1) % 6) * 2.5)}px) scale(${1.2 - ((subTick + 1) % 6) * 0.16})`,
                  opacity: 1 - ((subTick + 1) % 6) * 0.16,
                  pointerEvents: 'none',
                }}
              />
            )}

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
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `hum-walk-${n}`,
                  file: `publisher-hum-walk-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `walk-s${n}`,
                  file: `publisher-walk-s${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `receive-${n}`,
                  file: `publisher-receive-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `headset-off-${n}`,
                  file: `publisher-headset-off-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
                  key: `code-focus-${n}`,
                  file: `publisher-code-focus-${n}.png`,
                })),
                ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
                  key: `complete-${n}`,
                  file: `publisher-complete-${n}.png`,
                })),
              ].map((sprite) => {
                const isCurrent = publisherSprite === sprite.key;
                return (
                  <img
                    key={sprite.key}
                    src={charImgUrl(sprite.file)}
                    alt={`퍼블리셔 ${sprite.key}`}
                    loading="eager"
                    decoding="sync"
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

            {/* ★ [퍼블리셔 독립 VFX 레이어] 멜로디 음표 웨이브 · 홀로그램 코드 태그 · 완료 폭죽 ★ */}
            {isPubHumWalk && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[
                  { note: '♪', baseX: 38, baseY: 52, color: '#8b5cf6', delay: 0 },
                  { note: '♫', baseX: 58, baseY: 36, color: '#ec4899', delay: 4 },
                  { note: '♬', baseX: 24, baseY: 30, color: '#10b981', delay: 8 },
                ].map((item, idx) => {
                  const age = (subTick + item.delay) % 12;
                  const floatY = -age * 2.6;
                  const waveX = Math.sin((subTick + item.delay) * 0.55) * 8;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: `${item.baseX + waveX}px`,
                        top: `${item.baseY + floatY}px`,
                        fontSize: idx === 1 ? '20px' : '17px',
                        fontWeight: 900,
                        color: item.color,
                        textShadow: '0 2px 4px rgba(255,255,255,0.95)',
                        opacity: age < 2 ? age * 0.5 : Math.max(0, 1 - (age - 2) / 10),
                        transform: `rotate(${Math.sin((subTick + item.delay) * 0.5) * 16}deg) scale(${0.85 + (age / 12) * 0.35})`,
                      }}
                    >
                      {item.note}
                    </div>
                  );
                })}
              </div>
            )}

            {isPubReceive && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: '166px',
                  fontSize: '20px',
                  transform: `translateY(${Math.sin(subTick * 0.8) * -6}px) scale(${0.9 + Math.abs(Math.sin(subTick * 0.8)) * 0.3})`,
                  transition: 'transform 0.055s linear',
                  pointerEvents: 'none',
                }}
              >
                ✨
              </div>
            )}

            {isPubCodingNoHeadset && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* 노트북 화면에서 피어오르는 독립 코드 심볼 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '96px',
                    left: '26px',
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: '#4a3525',
                    background: 'rgba(255,255,255,0.88)',
                    padding: '1px 5px',
                    borderRadius: '6px',
                    border: '1.5px solid #4a3525',
                    transform: `translateY(${Math.sin(subTick * 0.7) * -8}px) rotate(-8deg)`,
                    transition: 'transform 0.055s linear',
                  }}
                >
                  {'</>'}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '70px',
                    left: '44px',
                    fontSize: '14px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: '#6d28d9',
                    transform: `translateY(${Math.cos(subTick * 0.7) * -8}px) rotate(8deg)`,
                    transition: 'transform 0.055s linear',
                  }}
                >
                  {'{ }'}
                </div>
              </div>
            )}

            {isPubCelebrating && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '76px',
                    left: '10px',
                    background: '#f3e8ff',
                    color: '#4a3525',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    border: '2px solid #4a3525',
                    boxShadow: '0 3px 8px rgba(109, 40, 217, 0.22)',
                    transform: `translateY(${Math.sin(subTick * 0.85) * -9}px) rotate(-10deg) scale(${1 + Math.abs(Math.sin(subTick * 0.85)) * 0.12})`,
                    transition: 'transform 0.055s linear',
                  }}
                >
                  {'<HTML/> ✨'}
                </div>
              </div>
            )}

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
