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
// 로그인 화면 전용 신규 캐릭터 스프라이트 프리로더 & 고해상도(560x560) 무깜빡임 Canvas 렌더러
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

const LOGIN_EXCLUSIVE_SPRITES = [
  'login-publisher-lean.png',
  'login-designer-hang.png',
  'login-planner-sit.png',
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `login-publisher-lean-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `login-designer-hang-${n}.png`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `login-planner-sit-${n}.png`),
];

interface SpriteCanvasProps {
  fileName: string;
  fallbackFileName: string;
  size: number;
  style?: React.CSSProperties;
}

function LoginSpriteCanvas({ fileName, fallbackFileName, size, style }: SpriteCanvasProps) {
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
        ctx.clearRect(0, 0, 560, 560);
        ctx.drawImage(chosenImg, 0, 0, 560, 560);
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
      width={560}
      height={560}
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

  // 로그인 화면 전용 8프레임 루프 틱
  const [frameTick, setFrameTick] = useState(0);

  useEffect(() => {
    LOGIN_EXCLUSIVE_SPRITES.forEach(preloadLoginSprite);
    const interval = window.setInterval(() => {
      setFrameTick((prev) => prev + 1);
    }, 150);
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

  const frame8 = (frameTick % 8) + 1;
  const studioBgUrl = `${BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`}images/login-studio-bg.jpg`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1120',
        padding: '160px 260px 90px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 1. 서비스기획팀 크리에이티브 스튜디오 & 라운지 아웃포커싱(Depth-of-Field) 배경 레이어 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${studioBgUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(5px) brightness(0.76) saturate(1.08)',
          transform: 'scale(1.03)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2. 공간감 비네팅 & 컬러 톤 매칭 오버레이 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.14) 0%, rgba(11, 17, 32, 0.52) 100%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* =====================================================================
          중앙 스테이지 래퍼 (메인 로그인 카드 + 로그인 전용 신규 캐릭터 3종 확대 배치)
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
            1. [웹 퍼블리셔 - 신규 전용 일러스트]
               - 로그인 카드 좌측 바깥 벽면에 오른쪽 어깨·등을 기대고 발목을 교차해 서 있는 포즈
               - 크기 228px로 확대, left: -192px 배치로 카드 외벽에 밀착되면서 가려짐 제로(zIndex: 20)
            ----------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            left: '-192px',
            bottom: '4px',
            width: '228px',
            height: '228px',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              filter: 'drop-shadow(-10px 12px 18px rgba(0, 0, 0, 0.48))',
            }}
          >
            <LoginSpriteCanvas
              fileName={`login-publisher-lean-${frame8}.png`}
              fallbackFileName="login-publisher-lean.png"
              size={228}
            />
          </div>
          {/* 바닥 접지 그림자 */}
          <div
            style={{
              width: '124px',
              height: '16px',
              margin: '-14px auto 0',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)',
            }}
          />
        </div>

        {/* -----------------------------------------------------------------
            2. [UI 디자이너 - 신규 전용 일러스트]
               - 정면을 바라보며 상단 가로바를 두 손으로 잡고 대롱대롱 매달려 있는 포즈
               - 크기 224px로 확대, 카드 우측 상단 바깥 여백(top: -214px, right: -52px, zIndex: 20)
            ----------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            top: '-214px',
            right: '-52px',
            width: '224px',
            height: '224px',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {/* 화면 천장에서 가로바 양손 위치(30.5%, 69.5%)로 내려오는 2줄 와이어 */}
          <div
            style={{
              position: 'absolute',
              top: '-240px',
              left: '30.5%',
              width: '2px',
              height: '258px',
              background: 'linear-gradient(180deg, rgba(148,163,184,0.05) 0%, rgba(203,213,225,0.45) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '-240px',
              right: '30.5%',
              width: '2px',
              height: '258px',
              background: 'linear-gradient(180deg, rgba(148,163,184,0.05) 0%, rgba(203,213,225,0.45) 100%)',
            }}
          />

          <div
            style={{
              position: 'relative',
              filter: 'drop-shadow(0 14px 20px rgba(0, 0, 0, 0.48))',
            }}
          >
            <LoginSpriteCanvas
              fileName={`login-designer-hang-${frame8}.png`}
              fallbackFileName="login-designer-hang.png"
              size={224}
            />
          </div>
        </div>

        {/* -----------------------------------------------------------------
            3. [서비스기획자 - 신규 전용 일러스트]
               - 우측 하단 구석 여백 바닥에 태블릿을 내려놓고 한 손으로 턱을 괴고 귀찮은 듯 앉아 있는 포즈
               - 크기 232px로 확대, right: -248px, bottom: -36px 배치(zIndex: 20)
            ----------------------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            right: '-248px',
            bottom: '-36px',
            width: '232px',
            height: '232px',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              filter: 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.5))',
            }}
          >
            <LoginSpriteCanvas
              fileName={`login-planner-sit-${frame8}.png`}
              fallbackFileName="login-planner-sit.png"
              size={232}
            />
          </div>
          {/* 구석 바닥 접지 그림자 */}
          <div
            style={{
              width: '176px',
              height: '18px',
              margin: '-16px auto 0',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)',
            }}
          />
        </div>

        {/* =================================================================
            메인 2단 로그인 카드 본체 (zIndex: 10)
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
          {/* 좌측: 서비스기획팀 브랜딩 영역 */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
              padding: '44px 36px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
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
                  marginBottom: '16px',
                }}
              >
                서비스 기획과 협업의 모든 것,<br />하나의 포털에서
              </h2>

              <p style={{ fontSize: '14px', color: '#e0e7ff', lineHeight: 1.6, marginBottom: 0 }}>
                일상 기획 업무(Task), 팀원 휴가 일정, 분기/연간 KPI 목표 및 달성 평가를 투명하게 공유하고 관리합니다.
              </p>
            </div>

            <div
              style={{
                marginTop: '36px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '12px',
                color: '#bfdbfe',
              }}
            >
              서비스기획팀 업무 포털 v1.0
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
                    onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
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
                      onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
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
                      onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
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
