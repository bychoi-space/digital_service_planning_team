import { useState, useEffect, useRef } from 'react';
import type { User } from '../../types';
import { PlanningStorageService } from '../../services/storage';
import { COMPANY_DEPARTMENTS } from '../../constants/departments';
import {
  Sparkles,
  Lock,
  User as UserIcon,
  Building2,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// GitHub Pages 호환 캐릭터 스프라이트 프리로더 & 무깜빡임 Canvas 렌더러
// ============================================================================
const BASE_URL = import.meta.env.BASE_URL || './';
function loginCharUrl(fileName: string): string {
  return `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}images/characters/${fileName}`;
}

const LOGIN_SPRITE_CACHE = new Map<string, HTMLImageElement>();
const LOGIN_SPRITE_READY = new Set<string>();

function preloadLoginSprite(fileName: string): void {
  const url = loginCharUrl(fileName);
  if (LOGIN_SPRITE_READY.has(url) || LOGIN_SPRITE_CACHE.has(url)) return;
  const img = new Image();
  img.decoding = 'async';
  LOGIN_SPRITE_CACHE.set(url, img);
  img.onload = () => {
    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(() => LOGIN_SPRITE_READY.add(url))
        .catch(() => {
          if (img.complete && img.naturalWidth > 0) LOGIN_SPRITE_READY.add(url);
        });
    } else {
      LOGIN_SPRITE_READY.add(url);
    }
  };
  img.src = url;
}

const LOGIN_STAGE_SPRITES = [
  'character-1-planner.png',
  'character-2-designer.png',
  'character-3-publisher.png',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `planner-sit-sketch-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `planner-peek-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `designer-climb-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `designer-paint-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `publisher-code-focus-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `publisher-hum-walk-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `publisher-complete-${n}.png`),
];

interface SpriteCanvasProps {
  fileName: string;
  fallbackFileName: string;
  size?: number;
  style?: React.CSSProperties;
}

function LoginSpriteCanvas({ fileName, fallbackFileName, size = 140, style }: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDrawnRef = useRef<string>('');

  useEffect(() => {
    preloadLoginSprite(fileName);
    preloadLoginSprite(fallbackFileName);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawIfReady = () => {
      const targetUrl = loginCharUrl(fileName);
      const fallbackUrl = loginCharUrl(fallbackFileName);
      const targetImg = LOGIN_SPRITE_CACHE.get(targetUrl);
      const fallbackImg = LOGIN_SPRITE_CACHE.get(fallbackUrl);

      const chosenImg =
        targetImg && (LOGIN_SPRITE_READY.has(targetUrl) || (targetImg.complete && targetImg.naturalWidth > 0))
          ? targetImg
          : fallbackImg && (LOGIN_SPRITE_READY.has(fallbackUrl) || (fallbackImg.complete && fallbackImg.naturalWidth > 0))
          ? fallbackImg
          : null;

      if (chosenImg && chosenImg.src !== lastDrawnRef.current) {
        ctx.clearRect(0, 0, 240, 240);
        ctx.drawImage(chosenImg, 0, 0, 240, 240);
        lastDrawnRef.current = chosenImg.src;
      }
    };

    drawIfReady();
    const timer = window.setInterval(drawIfReady, 60);
    return () => window.clearInterval(timer);
  }, [fileName, fallbackFileName]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
    />
  );
}

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
}

export function LoginPage({ onLoginSuccess, initialMode = 'login', onModeChange }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // 로그인 상태 (초기값 항상 빈 값 유지)
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 회원가입 상태
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regDepartment, setRegDepartment] = useState(COMPANY_DEPARTMENTS[0].name);

  // 에러 및 안내 메시지
  const [errorMessage, setErrorMessage] = useState('');

  // 폼 포커스 상태 (캐릭터 3종이 실시간으로 반응)
  const [focusedField, setFocusedField] = useState<'none' | 'name' | 'password' | 'department'>('none');

  // 애니메이션 프레임 틱 (10fps 부드러운 루프)
  const [frameTick, setFrameTick] = useState(0);
  // 디자이너 상단 매달려 올라오기 연출 타이머 (초기 진입 시 또는 클릭 시 재생)
  const [designerClimbTicks, setDesignerClimbTicks] = useState(22);
  // 기획자 클릭 시 빼꼼 인사 리액션 타이머
  const [plannerWaveTicks, setPlannerWaveTicks] = useState(0);

  useEffect(() => {
    LOGIN_STAGE_SPRITES.forEach(preloadLoginSprite);
    const interval = window.setInterval(() => {
      setFrameTick((prev) => prev + 1);
      setDesignerClimbTicks((prev) => (prev > 0 ? prev - 1 : 0));
      setPlannerWaveTicks((prev) => (prev > 0 ? prev - 1 : 0));
    }, 110);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setLoginPassword('');
    setRegPassword('');
    setRegPasswordConfirm('');
  }, [initialMode]);

  const handleModeSwitch = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setLoginPassword('');
    setRegPassword('');
    setRegPasswordConfirm('');
    setErrorMessage('');
    setDesignerClimbTicks(16); // 탭 전환 시 디자이너가 위에서 다시 매달려 확인하는 모션
    onModeChange?.(nextMode);
  };

  // 1. 로그인 제출 핸들러
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginName.trim()) {
      setErrorMessage('이름을 입력해 주세요.');
      return;
    }

    if (!loginPassword) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    const result = PlanningStorageService.login(loginName.trim(), loginPassword);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || '로그인에 실패했습니다.');
    }
  };

  // 2. 회원가입 제출 핸들러
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('이름을 입력해 주세요.');
      return;
    }

    if (!regPassword) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (!regDepartment) {
      setErrorMessage('소속 부서를 선택해 주세요.');
      return;
    }

    const result = await PlanningStorageService.registerUser({
      name: regName.trim(),
      password: regPassword,
      department: regDepartment,
    });

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.message || '회원가입에 실패했습니다.');
    }
  };

  // ============================================================================
  // 캐릭터 3종 프레임 & 대사 상태 계산
  // ============================================================================
  const frame12 = (frameTick % 12) + 1;
  const frame8 = (frameTick % 8) + 1;

  const isReadyToLogin =
    mode === 'login'
      ? Boolean(loginName.trim() && loginPassword)
      : Boolean(regName.trim() && regPassword && regPassword === regPasswordConfirm);

  // ① 좌측 하단 구석: 기획자 (구석 바닥에 편하게 다리 뻗고 앉아 태블릿 스케치)
  const plannerSprite =
    plannerWaveTicks > 0 ? `planner-peek-${frame8}.png` : `planner-sit-sketch-${frame12}.png`;

  const plannerBubble =
    plannerWaveTicks > 0
      ? '반갑습니다! 오늘도 기분 좋은 하루 되세요 👋'
      : focusedField === 'name'
      ? '성명 입력 감지! 등록된 멤버인지 확인 중 📋'
      : focusedField === 'password'
      ? '보안 정책상 비밀번호는 평문 노출 제로! 🔐'
      : isReadyToLogin
      ? '검증 준비 끝! 파란색 접속 버튼을 눌러주세요 👍'
      : mode === 'register'
      ? '구석에 앉아서 신규 멤버 온보딩 시나리오 점검 중 📝'
      : '구석 자리가 제일 편하네요... 로그인 정책 검수 중 ☕';

  // ② 상단 루프탑 엣지: 디자이너 (카드 위쪽 테두리에 매달려 올라오거나 지붕 위에서 내려다보기)
  const isDesignerClimbing = designerClimbTicks > 0;
  const designerSprite = isDesignerClimbing
    ? `designer-climb-${frame12}.png`
    : `designer-paint-${frame12}.png`;

  const designerBubble = isDesignerClimbing
    ? '영차영차... 로그인 창 지붕 위로 올라가는 중! 🧗‍♀️'
    : focusedField === 'password'
    ? '쉿! 비밀번호 치실 땐 시안 보드로 눈 가릴게요 🙈'
    : focusedField === 'department'
    ? '소속 부서 셀렉트박스 정렬 비율 완벽해요! 🎨'
    : mode === 'register'
    ? '위에서 내려다보니 회원가입 폼 여백 딱 좋네요 ✨'
    : '카드 위에서 폼 간격 16px 맞는지 감수 중 🎨';

  // ③ 우측 외벽: 퍼블리셔 (로그인 영역 오른쪽 벽면에 등을 기대듯 서서 노트북/헤드셋)
  const publisherSprite = isReadyToLogin
    ? `publisher-complete-${frame8}.png`
    : focusedField === 'password' || focusedField === 'name'
    ? `publisher-code-focus-${frame12}.png`
    : `publisher-hum-walk-${frame12}.png`;

  const publisherBubble = isReadyToLogin
    ? '준비 완료! 포털 문 활짝 열어둘게요 🚀'
    : focusedField === 'password'
    ? '패스워드 마스킹 작동 중... 아무도 못 봐요 🔒'
    : focusedField === 'name'
    ? '실시간 입력 바인딩 중... 타이핑 빠르신데요? ⌨️'
    : mode === 'register'
    ? '벽에 기대서 #/register 라우트 대기 중 ♪'
    : '벽에 기대서 #/login 라우트 연결 확인 완료 🎧';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '92px 110px 56px 36px',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* 배경 장식 원형 블러 */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.22) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* =====================================================================
          중앙 스테이지 래퍼 (캐릭터 3종 삼각 균형 배치 + 메인 로그인 카드)
          ===================================================================== */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '960px',
          zIndex: 10,
        }}
      >
        {/* -----------------------------------------------------------------
            [캐릭터 2 · 디자이너] 우측 상단 지붕 테두리에 매달려 올라오거나 걸터앉아 감수
            ----------------------------------------------------------------- */}
        <div
          onClick={() => setDesignerClimbTicks(22)}
          title="클릭하면 디자이너가 다시 지붕 위로 매달려 올라옵니다!"
          style={{
            position: 'absolute',
            top: isDesignerClimbing ? '-62px' : '-96px',
            right: '54px',
            zIndex: isDesignerClimbing ? 25 : 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'top 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* 디자이너 말풍선 */}
          <div
            style={{
              marginBottom: '-6px',
              padding: '6px 12px',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(251, 146, 60, 0.5)',
              borderRadius: '9999px',
              color: '#ffedd5',
              fontSize: '11.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 30,
            }}
          >
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'rgba(249, 115, 22, 0.25)',
                color: '#fdba74',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              UI 디자이너
            </span>
            <span>{designerBubble}</span>
          </div>

          <div
            style={{
              transform: isDesignerClimbing
                ? `translateY(${Math.sin(frameTick * 0.8) * 3}px)`
                : `translateY(${Math.sin(frameTick * 0.35) * 2}px) rotate(-2deg)`,
              filter: 'drop-shadow(0 10px 16px rgba(15, 23, 42, 0.4))',
              transition: 'transform 0.2s ease',
            }}
          >
            <LoginSpriteCanvas
              fileName={designerSprite}
              fallbackFileName="character-2-designer.png"
              size={132}
            />
          </div>
        </div>

        {/* 디자이너가 카드 상단 모서리를 짚고 있는 루프탑 그립/줄자 배지 (카드 테두리 위) */}
        <div
          style={{
            position: 'absolute',
            top: '-11px',
            right: '82px',
            zIndex: 26,
            padding: '2px 10px',
            background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1.5px solid #fdba74',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#c2410c',
            boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
          }}
        >
          📐 ROOFTOP CHECK · 960px
        </div>

        {/* -----------------------------------------------------------------
            [캐릭터 3 · 퍼블리셔] 로그인 카드 우측 외벽에 등을 기대듯 서서 코딩/모니터링
            ----------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            right: '-98px',
            bottom: '18px',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          {/* 퍼블리셔 말풍선 */}
          <div
            style={{
              position: 'absolute',
              top: '-34px',
              right: '4px',
              padding: '6px 12px',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(167, 139, 250, 0.5)',
              borderRadius: '9999px',
              color: '#f3e8ff',
              fontSize: '11.5px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 30,
            }}
          >
            <span
              style={{
                padding: '1px 6px',
                borderRadius: '999px',
                background: 'rgba(139, 92, 246, 0.28)',
                color: '#d8b4fe',
                fontSize: '10px',
                fontWeight: 800,
              }}
            >
              웹 퍼블리셔
            </span>
            <span>{publisherBubble}</span>
          </div>

          {/* 둥실 떠오르는 음표 이펙트 */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              right: '14px',
              fontSize: '13px',
              color: '#6ee7b7',
              fontWeight: 800,
              transform: `translateY(${Math.sin(frameTick * 0.45) * 4}px)`,
              opacity: 0.85,
              pointerEvents: 'none',
            }}
          >
            ♪ ♫
          </div>

          {/* 벽면에 등을 살짝 기댄 각도(scaleX(-1) + rotate(-5deg)) */}
          <div
            style={{
              transform: `translateX(-10px) rotate(-5deg) scaleX(-1) translateY(${
                Math.sin(frameTick * 0.35) * 1.5
              }px)`,
              transformOrigin: 'left bottom',
              filter: 'drop-shadow(6px 10px 18px rgba(0, 0, 0, 0.45))',
            }}
          >
            <LoginSpriteCanvas
              fileName={publisherSprite}
              fallbackFileName="character-3-publisher.png"
              size={146}
            />
          </div>

          {/* 바닥 접지 그림자 */}
          <div
            style={{
              width: '86px',
              height: '12px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 75%)',
              marginTop: '-12px',
              marginLeft: '14px',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* =================================================================
            메인 2단 로그인 카드 본체
            ================================================================= */}
        <div
          style={{
            width: '100%',
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.42)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* 좌측: 서비스기획팀 브랜딩 & 구석에 편하게 앉은 기획자 라운지 */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 52%, #172554 100%)',
              padding: '44px 36px 28px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  background: 'rgba(255, 255, 255, 0.16)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#bfdbfe',
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={13} /> 서비스기획팀 업무 포털
              </div>

              <h2
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  lineHeight: 1.35,
                  letterSpacing: '-0.5px',
                  marginBottom: '14px',
                }}
              >
                서비스 기획과 협업의 모든 것,<br />하나의 포털에서
              </h2>

              <p style={{ fontSize: '14px', color: '#e0e7ff', lineHeight: 1.6, marginBottom: '18px' }}>
                일상 기획 업무(Task), 팀원 휴가 일정, 분기/연간 KPI 목표 및 달성 평가를 투명하게 공유하고 관리합니다.
              </p>
            </div>

            {/* ---------------------------------------------------------------
                [캐릭터 1 · 기획자] 좌측 패널 하단 구석에 다리 뻗고 앉아 있는 라운지 코너
                --------------------------------------------------------------- */}
            <div
              onClick={() => setPlannerWaveTicks(16)}
              title="클릭하면 기획자가 인사합니다!"
              style={{
                position: 'relative',
                marginTop: '8px',
                marginBottom: '6px',
                padding: '14px 16px 10px',
                background: 'rgba(15, 23, 42, 0.28)',
                border: '1px solid rgba(147, 197, 253, 0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              {/* 구석에 앉아 있는 기획자 스프라이트 */}
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  marginLeft: '-6px',
                  marginBottom: '-6px',
                  filter: 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35))',
                }}
              >
                <LoginSpriteCanvas
                  fileName={plannerSprite}
                  fallbackFileName="character-1-planner.png"
                  size={112}
                />
                {/* 바닥 방석/그림자 */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '14px',
                    width: '84px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0) 75%)',
                    zIndex: -1,
                  }}
                />
              </div>

              {/* 기획자 구석 라운지 말풍선 & 소품 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(59, 130, 246, 0.35)',
                      border: '1px solid rgba(147, 197, 253, 0.35)',
                      color: '#dbeafe',
                      fontSize: '10.5px',
                      fontWeight: 800,
                    }}
                  >
                    서비스기획자 · 구석 라운지
                  </span>
                  <span style={{ fontSize: '11px', color: '#93c5fd' }}>☕ 아이스 아메리카노 충전 중</span>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#1e293b',
                    padding: '9px 12px',
                    borderRadius: '12px 12px 12px 2px',
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: 1.45,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  {plannerBubble}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                color: '#bfdbfe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>서비스기획팀 업무 포털 v1.0</span>
              <span style={{ fontSize: '11px', color: '#93c5fd' }}>Planning · Design · Publishing</span>
            </div>
          </div>

          {/* 우측: 폼 영역 (로그인 / 회원가입) */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* 상단 탭 전환 바 */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '28px',
              }}
            >
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                style={{
                  flex: 1,
                  padding: '9px',
                  border: 'none',
                  borderRadius: '6px',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#1e293b' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                style={{
                  flex: 1,
                  padding: '9px',
                  border: 'none',
                  borderRadius: '6px',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#1e293b' : '#64748b',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                신규 등록 (회원가입)
              </button>
            </div>

            {/* 에러 메시지 알림 박스 */}
            {errorMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* A. 로그인 폼 */}
            {mode === 'login' ? (
              <form
                onSubmit={handleLoginSubmit}
                autoComplete="off"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} color="#64748b" /> 이름 (사용자명) *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="등록된 성명 입력"
                    value={loginName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('none')}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="form-input"
                    style={{ padding: '11px 14px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} color="#64748b" /> 비밀번호 *
                  </label>
                  <input
                    type="password"
                    required
                    readOnly
                    onFocus={(e) => {
                      e.currentTarget.removeAttribute('readonly');
                      setFocusedField('password');
                    }}
                    onBlur={() => setFocusedField('none')}
                    autoComplete="new-password"
                    placeholder="비밀번호를 입력해 주세요"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-input"
                    style={{ padding: '11px 14px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    marginTop: '8px',
                  }}
                >
                  포털 접속하기 <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* B. 신규 등록 (회원가입) 폼 */
              <form
                onSubmit={handleRegisterSubmit}
                autoComplete="off"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} color="#64748b" /> 성명 (이름) *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="예: 홍길동"
                    value={regName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('none')}
                    onChange={(e) => setRegName(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* 소속 부서 선택 (Selectbox 구조) */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} color="#64748b" /> 소속 부서 선택 *
                  </label>
                  <select
                    value={regDepartment}
                    onFocus={() => setFocusedField('department')}
                    onBlur={() => setFocusedField('none')}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="form-select"
                  >
                    {COMPANY_DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                    * 서비스기획팀 선택 시 [편집 권한], 유관부서 선택 시 [읽기 전용 모드]가 적용됩니다.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={14} color="#64748b" /> 비밀번호 *
                    </label>
                    <input
                      type="password"
                      required
                      readOnly
                      onFocus={(e) => {
                        e.currentTarget.removeAttribute('readonly');
                        setFocusedField('password');
                      }}
                      onBlur={() => setFocusedField('none')}
                      autoComplete="new-password"
                      placeholder="비밀번호 설정"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} color="#64748b" /> 비밀번호 확인 *
                    </label>
                    <input
                      type="password"
                      required
                      readOnly
                      onFocus={(e) => {
                        e.currentTarget.removeAttribute('readonly');
                        setFocusedField('password');
                      }}
                      onBlur={() => setFocusedField('none')}
                      autoComplete="new-password"
                      placeholder="비밀번호 재입력"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    marginTop: '10px',
                  }}
                >
                  회원가입 및 바로 접속 <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
