import { useState, useEffect } from 'react';
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
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
          background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(0,0,0,0) 70%)',
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
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 중앙 메인 컨테이너 (좌우 2단 레이아웃) */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {/* 좌측: 서비스기획팀 브랜딩 & 가치 소개 영역 */}
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

          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '12px', color: '#bfdbfe' }}>
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
  );
};
