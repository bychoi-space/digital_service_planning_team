import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

export function SisunRenewalStoryStage() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // 1서브틱 = 50ms (20fps 안정적인 모션 타이머, 스프라이트는 100ms(10fps) 주기로 깜빡임 없이 전환)
  const [subTick, setSubTick] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      // 150틱(300서브틱)의 배수인 3000으로 순환시켜 루프 경계에서 끊김이 전혀 없도록 보장
      setSubTick((prev) => (prev + 1) % 3000);
    }, 50);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // 연속 타임라인 틱 (0.0, 0.5, 1.0, 1.5 ... / 150틱 = 15초 통합 협업 스토리 루프)
  const tick = subTick / 2;
  const masterTick = tick % 150;

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

  // 연속 사인파 기반 자연스러운 보행 바운스 & 스쿼시-스트레치(Squash & Stretch) 물리 계수
  const getCharacterMotion = (isWalking: boolean, st: number, phaseOffset: number) => {
    if (isWalking) {
      const phase = (st + phaseOffset) * 0.45;
      const bounceY = -Math.abs(Math.sin(phase)) * 7.2; // 0px ~ -7.2px 연속 아치형 발걸음
      const squash = Math.sin(phase * 2) * 0.022;
      const scaleX = 1 - squash * 0.75;
      const scaleY = 1 + squash;
      const rotateDeg = Math.cos(phase) * 1.6;
      const shadowScale = 1 - Math.abs(Math.sin(phase)) * 0.18;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    } else {
      const phase = (st + phaseOffset) * 0.25;
      const bounceY = Math.sin(phase) * 2.0 - 1.2; // 업무 중 살아있는 미세 호흡 리듬
      const squash = Math.sin(phase) * 0.012;
      const scaleX = 1 - squash * 0.65;
      const scaleY = 1 + squash;
      const rotateDeg = Math.sin(phase * 0.7) * 0.9;
      const shadowScale = 1 + Math.sin(phase) * 0.04;
      return { bounceY, scaleX, scaleY, rotateDeg, shadowScale };
    }
  };

  // =========================================================================
  // ★ 3인 릴레이 협업 통합 타임라인 (masterTick: 0 ~ 150) ★
  // -------------------------------------------------------------------------
  // 1) 캐릭터 1 · 기획자 (0 ~ 78틱 활약)
  //    - 0 ~ 10: 좌측 끝(-4.5% -> 0.5%)에서 고개를 빼꼼 내밀며 가장 먼저 등장 (peek-1..8)
  //    - 10 ~ 24: 골똘히 고민하면서(턱에 손을 대고 ? 띄우며) 걸어오기 (think-walk-1..12)
  //    - 24 ~ 50: 바닥에 털푸덕 주저앉아서 태블릿에 와이어프레임 설계 (sit-sketch-1..12)
  //               (※ 바로 이 설계 중인 28틱에 디자이너가 밑에서부터 기어올라오기 시작!)
  //    - 50 ~ 58: 자리에서 일어나 디자이너 쪽(21.5%)으로 다가가기 (walk-s1..s12)
  //    - 58 ~ 68: [1차 핸드오프 일치!] 디자이너(33.5%)에게 설계 산출물 전달 (handoff-1..8)
  //    - 68 ~ 78: 좌측 끝 화면 밖(-16%)으로 총총 걸어 퇴장 (walk-s1..s12)
  //    - 78 ~ 150: 다음 루프(0틱)까지 좌측 화면 밖 대기
  // =========================================================================
  const pTick = masterTick;
  const plannerVisible = pTick < 78;
  const isPlannerPeek = pTick < 10;
  const isPlannerThinkWalk = pTick >= 10 && pTick < 24;
  const isPlannerSitSketch = pTick >= 24 && pTick < 50;
  const isPlannerWalkToDesigner = pTick >= 50 && pTick < 58;
  const isPlannerHandoff = pTick >= 58 && pTick < 68;
  const isPlannerWalkBack = pTick >= 68 && pTick < 78;

  const isPlannerWalking = isPlannerThinkWalk || isPlannerWalkToDesigner || isPlannerWalkBack;
  const basePlannerMotion = getCharacterMotion(isPlannerWalking, subTick, 0);

  // 기획자 특수 모션 (빼꼼 기울기 & 털푸덕 주저앉기 & 폴짝 일어나기 물리 효과)
  const getPlannerSpecialMotion = () => {
    if (isPlannerPeek) {
      const peekProgress = easeInOut(Math.min(1, pTick / 8));
      const peekBob = Math.sin(subTick * 0.35) * 2.5;
      return {
        bounceY: peekBob,
        scaleX: 1,
        scaleY: 1,
        rotateDeg: 13 * peekProgress + Math.sin(subTick * 0.3) * 2.2,
        shadowScale: 0.85,
      };
    }
    if (isPlannerSitSketch) {
      // 24~28틱 구간: "털푸덕!" 바닥에 주저앉는 탄성 스쿼시 모션
      const sitElapsed = pTick - 24;
      if (sitElapsed < 4) {
        const t = sitElapsed / 4;
        const dropY = t < 0.45 ? -8 * (1 - t / 0.45) : 9 * Math.sin(((t - 0.45) / 0.55) * Math.PI);
        const plopSquash = t >= 0.4 ? Math.sin(((t - 0.4) / 0.6) * Math.PI) * 0.085 : -0.04;
        return {
          bounceY: dropY + 6,
          scaleX: 1 + plopSquash,
          scaleY: 1 - plopSquash,
          rotateDeg: Math.sin(t * Math.PI * 2) * 2.5,
          shadowScale: 1.15 + plopSquash * 0.8,
        };
      }
      // 47~50틱 구간: 바닥에서 폴짝 일어나는 예비 동작(Anticipation & Stand-up Hop)
      if (pTick >= 47) {
        const standT = (pTick - 47) / 3;
        const hopY = standT < 0.4 ? 8 : -7 * Math.sin(((standT - 0.4) / 0.6) * Math.PI);
        const stretch = standT < 0.4 ? -0.05 : 0.045 * Math.sin(((standT - 0.4) / 0.6) * Math.PI);
        return {
          bounceY: hopY,
          scaleX: 1 - stretch,
          scaleY: 1 + stretch,
          rotateDeg: (1 - standT) * 2.0,
          shadowScale: 1.0 - Math.max(0, -hopY) * 0.02,
        };
      }
      // 바닥에 앉아서 열정적으로 태블릿 스케치하는 12프레임 연속 리듬
      const phase = (subTick * Math.PI) / 6;
      return {
        bounceY: 6 + Math.sin(phase) * 1.6,
        scaleX: 1 - Math.sin(phase) * 0.012,
        scaleY: 1 + Math.sin(phase) * 0.012,
        rotateDeg: Math.sin(phase * 0.5) * 1.1,
        shadowScale: 1.14,
      };
    }
    return basePlannerMotion;
  };

  const plannerMotion = getPlannerSpecialMotion();

  const getPlannerLeft = (): number => {
    if (isPlannerPeek) return -4.5 + easeInOut(pTick / 10) * 5.0; // -4.5%(좌측 벽 뒤) -> 0.5%(빼꼼)
    if (isPlannerThinkWalk) return 0.5 + easeInOut((pTick - 10) / 14) * 9.0; // 0.5% -> 9.5%(고민하며 걸어옴)
    if (isPlannerSitSketch) return 9.5; // 9.5% 바닥에 털푸덕 주저앉아 설계
    if (isPlannerWalkToDesigner) return 9.5 + easeInOut((pTick - 50) / 8) * 12.0; // 9.5% -> 21.5%(디자이너에게 다가가기)
    if (isPlannerHandoff) return 21.5; // 21.5% 디자이너(33.5%)와 마주 보고 설계도 전달!
    if (isPlannerWalkBack) return 21.5 - easeInOut((pTick - 68) / 10) * 37.5; // 21.5% -> -16.0%(좌측 화면 밖 퇴장)
    return -16.0;
  };

  const plannerLeft = getPlannerLeft();

  const plannerSprite: string = isPlannerPeek
    ? `peek-${getInteractSubFrame(subTick, 0)}`
    : isPlannerThinkWalk
    ? `think-walk-${getWorkSubFrame(subTick, 0)}`
    : isPlannerSitSketch
    ? `sit-sketch-${getWorkSubFrame(subTick, 0)}`
    : isPlannerWalkToDesigner || isPlannerWalkBack
    ? getWalkSubSprite(subTick, 0)
    : `handoff-${getInteractSubFrame(subTick, 0)}`;

  // 빼꼼 내밀 때(0~10), 고민하며 우측으로 걸어올 때(10~24), 디자이너에게 걸어갈 때(50~58)는 우측을 바라보도록 반전
  const plannerFlipRight = isPlannerPeek || isPlannerThinkWalk || isPlannerWalkToDesigner;

  // 좌측 칠판(Zone 1: 기획자 머리 위) 진행률 (기획자가 설계하는 10~50틱 동안 100% 완성 후 사이클 내내 유지)
  const plannerBoardProgress =
    pTick < 10
      ? Math.round((pTick / 10) * 12)
      : pTick < 24
      ? Math.round(12 + ((pTick - 10) / 14) * 28)
      : pTick < 50
      ? Math.min(100, Math.round(40 + ((pTick - 24) / 22) * 60))
      : pTick < 146
      ? 100
      : 0;

  // =========================================================================
  // 2) 캐릭터 2 · 디자이너 (28 ~ 120틱 활약: 기획자가 설계하고 있는 타이밍에 등장!)
  //    - 0 ~ 28: 무대 아래에서 대기 (기획자가 먼저 등장해 설계를 시작할 때까지 대기)
  //    - 28 ~ 48: 기획자가 한창 설계 중인 타이밍에 뒤돌은 상태로 밑에서부터 기어올라오듯 등장 (climb-1..12)
  //    - 48 ~ 58: 올라와서 좌측 기획자 쪽(33.5%)으로 다가가기 (walk-s1..s12)
  //               (※ 기획자도 50~58틱에 21.5%로 다가와 58틱에 두 사람이 정확히 마주 섬!)
  //    - 58 ~ 68: [1차 핸드오프 일치!] 기획자가 건네주는 설계도를 두 손으로 전달받음 (receive-1..8)
  //    - 68 ~ 74: 전달받은 설계도를 들고 중앙 작업 위치(41.0%)로 이동 (walk-s1..s12)
  //    - 74 ~ 96: 전달받은 설계 도면에 직접 알록달록 색칠(디자인) 진행 (paint-1..12)
  //               (※ 바로 이 디자인 진행 중인 78틱에 퍼블리셔가 우측에서부터 등장 시작!)
  //    - 96 ~ 102: 완료되면 우측 퍼블리셔 쪽(48.5%)으로 다가가기 (walk-s1..s12)
  //    - 102 ~ 112: [2차 핸드오프 일치!] 퍼블리셔(63.5%)에게 완성된 디자인 산출물 전달 (handoff-1..8)
  //    - 112 ~ 120: 중앙(41.0%)으로 돌아가 무대 아래로 내려가며 퇴장
  //    - 120 ~ 150: 무대 아래 대기
  // =========================================================================
  const dTick = masterTick;
  const designerVisible = dTick >= 28 && dTick < 120;
  const isDesignerClimbing = dTick >= 28 && dTick < 48;
  const isDesignerWalkToPlanner = dTick >= 48 && dTick < 58;
  const isDesignerReceiving = dTick >= 58 && dTick < 68;
  const isDesignerWalkToCenter = dTick >= 68 && dTick < 74;
  const isDesignerPainting = dTick >= 74 && dTick < 96;
  const isDesignerWalkToPublisher = dTick >= 96 && dTick < 102;
  const isDesignerHandoff = dTick >= 102 && dTick < 112;
  const isDesignerReturn = dTick >= 112 && dTick < 120;

  const isDesignerWalking =
    isDesignerWalkToPlanner || isDesignerWalkToCenter || isDesignerWalkToPublisher || isDesignerReturn;
  const baseDesignerMotion = getCharacterMotion(isDesignerWalking, subTick, 7);

  // 디자이너 특수 모션: 뒤돌은 상태에서 아래에서부터 영차영차 기어올라오는 수직 오프셋 & 반동
  const getDesignerSpecialMotion = () => {
    if (!designerVisible) {
      return { bounceY: 220, scaleX: 1, scaleY: 1, rotateDeg: 0, shadowScale: 0 };
    }
    if (isDesignerClimbing) {
      const climbProgress = easeInOut((dTick - 28) / 20); // 0.0 -> 1.0
      const climbY = (1 - climbProgress) * 165;
      const pullEffort = Math.abs(Math.sin(subTick * 0.55)) * -6.0;
      const swayDeg = Math.sin(subTick * 0.55) * 3.0;
      const stretchY = 1 + Math.sin(subTick * 0.55) * 0.028;
      return {
        bounceY: climbY + pullEffort,
        scaleX: 2 - stretchY,
        scaleY: stretchY,
        rotateDeg: swayDeg,
        shadowScale: Math.max(0.15, climbProgress * 0.95),
      };
    }
    if (isDesignerReturn && dTick >= 116) {
      const dipProgress = easeInOut((dTick - 116) / 4);
      return {
        ...baseDesignerMotion,
        bounceY: baseDesignerMotion.bounceY + dipProgress * 165,
        shadowScale: Math.max(0.15, (1 - dipProgress) * 0.9),
      };
    }
    return baseDesignerMotion;
  };

  const designerMotion = getDesignerSpecialMotion();

  const getDesignerLeft = (): number => {
    if (dTick < 48) return 41.0; // 중앙 아래에서 기어올라옴
    if (isDesignerWalkToPlanner) return 41.0 - easeInOut((dTick - 48) / 10) * 7.5; // 41.0% -> 33.5%(기획자 마중)
    if (isDesignerReceiving) return 33.5; // 33.5% 기획자(21.5%)에게 설계도 수령!
    if (isDesignerWalkToCenter) return 33.5 + easeInOut((dTick - 68) / 6) * 7.5; // 33.5% -> 41.0%
    if (isDesignerPainting) return 41.0; // 받은 설계도에 색칠하기
    if (isDesignerWalkToPublisher) return 41.0 + easeInOut((dTick - 96) / 6) * 7.5; // 41.0% -> 48.5%(퍼블리셔에게 이동)
    if (isDesignerHandoff) return 48.5; // 48.5% 퍼블리셔(63.5%)에게 완성된 디자인 전달!
    if (isDesignerReturn) return 48.5 - easeInOut((dTick - 112) / 8) * 7.5; // 48.5% -> 41.0%
    return 41.0;
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

  // 우측으로 이동할 때(68~74, 96~102) 또는 우측 퍼블리셔에게 완성된 디자인을 건넬 때(102~112) 좌우 반전
  const designerFlipRight = isDesignerWalkToCenter || isDesignerWalkToPublisher || isDesignerHandoff;

  // 중앙 칠판(Zone 2: 디자이너 머리 위) 진행률 (설계도 수령 후 색칠하는 68~96틱 동안 100% 완성)
  const designerBoardProgress =
    dTick < 58
      ? 0
      : dTick < 68
      ? Math.round(((dTick - 58) / 10) * 18)
      : dTick < 96
      ? Math.min(100, Math.round(18 + ((dTick - 68) / 25) * 82))
      : dTick < 146
      ? 100
      : 0;

  // =========================================================================
  // 3) 캐릭터 3 · 퍼블리셔 (78 ~ 150틱 활약: 디자이너가 디자인을 진행하는 타이밍에 등장!)
  //    - 0 ~ 78: 우측 끝 화면 밖에서 대기
  //    - 78 ~ 102: 디자이너가 한창 색칠(디자인) 중인 타이밍에 우측 끝(92%)에서 음표(♪ ♫)를 띄우며
  //                흥얼거리면서 걸어 나타남 (hum-walk-1..12, 92.0% -> 63.5%)
  //                (※ 디자이너도 96~102틱에 48.5%로 다가와 102틱에 두 사람이 정확히 마주 섬!)
  //    - 102 ~ 112: [2차 핸드오프 일치!] 디자이너가 건네주는 디자인 산출물을 두 손으로 전달받음 (receive-1..8)
  //    - 112 ~ 117: 우측 칠판(Zone 3) 아래 작업 위치(72.5%)로 이동 (walk-s1..s12)
  //    - 117 ~ 124: 코딩에 집중하기 위해 양손으로 헤드셋을 머리에서 목으로 벗는 모션 (headset-off-1..8)
  //    - 124 ~ 140: 헤드셋을 벗어 목에 걸친 채 노트북으로 열정적으로 코딩 진행 (code-focus-1..12)
  //    - 140 ~ 145: 시선닷컴 반응형 웹 퍼블리싱 완료 환호! (complete-1..8)
  //    - 145 ~ 150: 우측 끝 화면 밖(92.0%)으로 총총 걸어 퇴장 (walk-s1..s12) -> 즉시 0틱 기획자 등장으로 이어짐!
  // =========================================================================
  const pubTick = masterTick;
  const publisherVisible = pubTick >= 78;
  const isPubHumWalk = pubTick >= 78 && pubTick < 102;
  const isPubReceive = pubTick >= 102 && pubTick < 112;
  const isPubWalkToDesk = pubTick >= 112 && pubTick < 117;
  const isPubHeadsetOff = pubTick >= 117 && pubTick < 124;
  const isPubCodingNoHeadset = pubTick >= 124 && pubTick < 140;
  const isPubComplete = pubTick >= 140 && pubTick < 145;
  const isPubWalkBack = pubTick >= 145;

  const isPublisherWalking = isPubHumWalk || isPubWalkToDesk || isPubWalkBack;
  const basePublisherMotion = getCharacterMotion(isPublisherWalking, subTick, 13);

  // 퍼블리셔 특수 모션 (흥얼거리며 리듬 타기 & 헤드셋 벗을 때 상체 움직임)
  const getPublisherSpecialMotion = () => {
    if (isPubHumWalk) {
      const phase = (subTick + 13) * 0.48;
      const bounceY = -Math.abs(Math.sin(phase)) * 8.0;
      const swayDeg = Math.sin(phase) * 3.0;
      const squash = Math.sin(phase * 2) * 0.024;
      return {
        bounceY,
        scaleX: 1 - squash * 0.7,
        scaleY: 1 + squash,
        rotateDeg: swayDeg,
        shadowScale: 1 - Math.abs(Math.sin(phase)) * 0.2,
      };
    }
    if (isPubHeadsetOff) {
      const t = (pubTick - 117) / 7;
      const liftY = t < 0.45 ? -5 * Math.sin((t / 0.45) * Math.PI) : 3 * Math.sin(((t - 0.45) / 0.55) * Math.PI);
      return {
        bounceY: liftY,
        scaleX: 1 - liftY * 0.004,
        scaleY: 1 + liftY * 0.004,
        rotateDeg: Math.sin(t * Math.PI * 2) * 2.0,
        shadowScale: 1,
      };
    }
    return basePublisherMotion;
  };

  const publisherMotion = getPublisherSpecialMotion();

  const getPublisherLeft = (): number => {
    if (pubTick < 78) return 92.0; // 우측 화면 밖 대기
    if (isPubHumWalk) return 92.0 - easeInOut((pubTick - 78) / 24) * 28.5; // 92.0%(우측 끝) -> 63.5%(흥얼거리며 등장)
    if (isPubReceive) return 63.5; // 63.5% 디자이너(48.5%)에게 디자인 산출물 수령!
    if (isPubWalkToDesk) return 63.5 + easeInOut((pubTick - 112) / 5) * 9.0; // 63.5% -> 72.5%(Zone 3 중앙)
    if (isPubHeadsetOff || isPubCodingNoHeadset || isPubComplete) return 72.5; // 헤드셋 벗고 코딩 & 완료
    return 72.5 + easeInOut((pubTick - 145) / 5) * 19.5; // 72.5% -> 92.0%(우측 화면 밖 퇴장)
  };

  const publisherLeft = getPublisherLeft();

  const publisherSprite: string = isPubHumWalk
    ? `hum-walk-${getWorkSubFrame(subTick, 4)}`
    : isPubReceive
    ? `receive-${getInteractSubFrame(subTick, 7)}`
    : isPubWalkToDesk || isPubWalkBack
    ? getWalkSubSprite(subTick, 11)
    : isPubHeadsetOff
    ? `headset-off-${getInteractSubFrame(subTick, 5)}`
    : isPubCodingNoHeadset
    ? `code-focus-${getWorkSubFrame(subTick, 7)}`
    : `complete-${getInteractSubFrame(subTick, 7)}`;

  // 우측으로 걸어 이동할 때(112~117, 145~150)만 우측 방향으로 반전
  const publisherFlipRight = isPubWalkToDesk || isPubWalkBack;

  // 우측 칠판(Zone 3: 퍼블리셔 머리 위) 진행률 (퍼블리셔가 산출물 수령 후 코딩하는 112~140틱 동안 100% 완성)
  const publisherBoardProgress =
    pubTick < 102
      ? 0
      : pubTick < 117
      ? Math.round(((pubTick - 102) / 15) * 20)
      : pubTick < 124
      ? Math.round(20 + ((pubTick - 117) / 7) * 12)
      : pubTick < 140
      ? Math.min(100, Math.round(32 + ((pubTick - 124) / 14) * 68))
      : pubTick < 148
      ? 100
      : 0;

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
