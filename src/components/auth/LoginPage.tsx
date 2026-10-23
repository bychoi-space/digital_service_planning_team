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
}

function LoginSpriteCanvas({ fileName, fallbackFileName }: SpriteCanvasProps) {
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
      className="login-sprite-canvas"
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
  const [prevInitialMode, setPrevInitialMode] = useState<'login' | 'register'>(initialMode);

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

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    setLoginPassword('');
    setRegPassword('');
    setRegPasswordConfirm('');
  }

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
    window.scrollTo(0, 0);

    LOGIN_EXCLUSIVE_SPRITES.forEach(preloadLoginSprite);
    const interval = window.setInterval(() => {
      setFrameTick((prev) => prev + 1);
    }, 150);
    return () => window.clearInterval(interval);
  }, []);

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
    <div className="login-page-shell">
      {/* 배경 전용 클리핑 래퍼 (가로/세로 스크롤 오버플로우 원천 차단) */}
      <div className="login-bg-clip">
        <img src={studioBgUrl} alt="" className="login-studio-bg-layer" />
        <div className="login-studio-vignette-layer" />
      </div>

      {/* 중앙 스테이지 래퍼 (메인 로그인 카드 + 로그인 전용 신규 캐릭터 3종 반응형 배치) */}
      <div className="login-stage">
        {/* 1. [웹 퍼블리셔 - 신규 전용 일러스트] */}
        <div className="login-char-publisher">
          <div className="login-char-sprite-wrap is-publisher">
            <LoginSpriteCanvas
              fileName={`login-publisher-lean-${frame8}.png`}
              fallbackFileName="login-publisher-lean.png"
            />
          </div>
          <div className="login-char-shadow is-publisher" />
        </div>

        {/* 2. [UI 디자이너 - 신규 전용 일러스트] */}
        <div className="login-char-designer">
          <div className="login-designer-wire is-left" />
          <div className="login-designer-wire is-right" />

          <div className="login-char-sprite-wrap is-designer">
            <LoginSpriteCanvas
              fileName={`login-designer-hang-${frame8}.png`}
              fallbackFileName="login-designer-hang.png"
            />
          </div>
        </div>

        {/* 3. [서비스기획자 - 신규 전용 일러스트] */}
        <div className="login-char-planner">
          <div className="login-char-sprite-wrap is-planner">
            <LoginSpriteCanvas
              fileName={`login-planner-sit-${frame8}.png`}
              fallbackFileName="login-planner-sit.png"
            />
          </div>
          <div className="login-char-shadow is-planner" />
        </div>

        {/* 메인 로그인 카드 본체 (PC/노트북 2단 · 태블릿/모바일 1단 자동 전환) */}
        <div className="login-card">
          {/* 좌측(태블릿/모바일 상단): 서비스기획팀 브랜딩 영역 */}
          <div className="login-brand-panel">
            <div>
              <div className="login-brand-badge">
                <Sparkles size={14} /> 서비스기획팀 업무 포털
              </div>

              <h2 className="login-brand-title">
                서비스 기획과 협업의 모든 것,<br />하나의 포털에서
              </h2>

              <p className="login-brand-desc">
                일상 기획 업무(Task), 팀원 휴가 일정, 분기/연간 KPI 목표 및 달성 평가를 투명하게 공유하고 관리합니다.
              </p>
            </div>

            <div className="login-brand-footer">
              서비스기획팀 업무 포털 v1.0
            </div>
          </div>

          {/* 우측(태블릿/모바일 하단): 폼 영역 (로그인 / 회원가입) */}
          <div className="login-form-panel">
            {/* 상단 탭 전환 바 */}
            <div className="login-tab-bar">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`login-tab-btn ${mode === 'login' ? 'active' : ''}`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                className={`login-tab-btn ${mode === 'register' ? 'active' : ''}`}
              >
                신규 등록 (회원가입)
              </button>
            </div>

            {/* 에러 메시지 알림 박스 */}
            {errorMessage && (
              <div className="login-error-alert">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* A. 로그인 폼 */}
            {mode === 'login' ? (
              <form
                onSubmit={handleLoginSubmit}
                autoComplete="off"
                className="login-form"
              >
                <div className="form-group login-form-group">
                  <label className="form-label login-form-label">
                    <UserIcon size={14} className="login-label-icon" /> 이름 (사용자명) *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="등록된 성명 입력"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group login-form-group">
                  <label className="form-label login-form-label">
                    <Lock size={14} className="login-label-icon" /> 비밀번호 *
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
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                >
                  포털 접속하기 <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* B. 신규 등록 (회원가입) 폼 */
              <form
                onSubmit={handleRegisterSubmit}
                autoComplete="off"
                className="login-form login-form-register"
              >
                <div className="form-group login-form-group">
                  <label className="form-label login-form-label">
                    <UserIcon size={14} className="login-label-icon" /> 성명 (이름) *
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
                <div className="form-group login-form-group">
                  <label className="form-label login-form-label">
                    <Building2 size={14} className="login-label-icon" /> 소속 부서 선택 *
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
                  <div className="login-dept-hint">
                    * 서비스기획팀 선택 시 [편집 권한], 유관부서 선택 시 [읽기 전용 모드]가 적용됩니다.
                  </div>
                </div>

                <div className="login-pw-grid">
                  <div className="form-group login-form-group">
                    <label className="form-label login-form-label">
                      <KeyRound size={14} className="login-label-icon" /> 비밀번호 *
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

                  <div className="form-group login-form-group">
                    <label className="form-label login-form-label">
                      <CheckCircle2 size={14} className="login-label-icon" /> 비밀번호 확인 *
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
                  className="btn btn-primary login-submit-btn"
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
