import { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Smartphone,
  Monitor,
  Code2,
  Palette,
  FileCode2,
  Eye,
  Layers,
  CheckCircle2,
  Wand2,
  PenTool,
} from 'lucide-react';

type DisplayMode = 'compare' | 'styleA' | 'styleB';
type StoryPhase = 0 | 1 | 2 | 3; // 0: 기획자, 1: 디자이너, 2: 퍼블리셔, 3: 피날레(전체 완성)

const PHASE_META: {
  phase: StoryPhase;
  roleBadge: string;
  roleTitle: string;
  actionCaption: string;
  color: string;
  glow: string;
}[] = [
  {
    phase: 0,
    roleBadge: 'STEP 01 · PLANNER',
    roleTitle: '기획자 · 모바일 & PC 화면설계',
    actionCaption: '고객 동선 고민(? ➔ 💡) 후 모바일·PC 최적 UI 와이어프레임 스케치',
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.45)',
  },
  {
    phase: 1,
    roleBadge: 'STEP 02 · DESIGNER',
    roleTitle: '디자이너 · Figma 시선닷컴 리뉴얼',
    actionCaption: '기획서를 받아 Figma 툴로 시선닷컴 브랜드 감성 UI 컬러링 & 그래픽 리뉴얼',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.45)',
  },
  {
    phase: 2,
    roleBadge: 'STEP 03 · PUBLISHER',
    roleTitle: '퍼블리셔 · 웹 퍼블리싱 & HTML 변환',
    actionCaption: '디자인 시안을 받아 HTML/CSS 반응형 코딩 후 실제 sisun.com 웹 화면 구현',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  {
    phase: 3,
    roleBadge: 'MISSION COMPLETE ✨',
    roleTitle: '시선닷컴 (sisun.com) UI/UX 개편 완성!',
    actionCaption: '기획 ➔ 디자인 ➔ 퍼블리싱 3인 트리오 협업으로 완성된 프리미엄 패션 플랫폼',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
];

export function SisunRenewalStoryStage() {
  // 기본값을 'compare'로 두어 사용자가 접속 즉시 스타일 A와 스타일 B를 한눈에 비교 가능
  const [displayMode, setDisplayMode] = useState<DisplayMode>('compare');
  const [activePhase, setActivePhase] = useState<StoryPhase>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hoveredRole, setHoveredRole] = useState<number | null>(null);

  // 자동 시퀀스 타이머 (3.2초 간격으로 0 -> 1 -> 2 -> 3 순환)
  useEffect(() => {
    if (!isPlaying || hoveredRole !== null) return;
    const timer = window.setInterval(() => {
      setActivePhase((prev) => ((prev + 1) % 4) as StoryPhase);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [isPlaying, hoveredRole]);

  const currentPhase: StoryPhase =
    hoveredRole !== null ? (hoveredRole as StoryPhase) : activePhase;

  const isRoleSpotlight = (roleIndex: number) =>
    currentPhase === roleIndex || currentPhase === 3;

  // GitHub Pages 서브패스 호환 이미지 경로 헬퍼
  const baseUrl = import.meta.env.BASE_URL || './';
  const charImgUrl = (fileName: string) =>
    `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}images/characters/${fileName}`;

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #070b14 0%, #0f172a 55%, #172554 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 30px',
        color: '#ffffff',
        boxShadow: '0 22px 45px -12px rgba(15, 23, 42, 0.45)',
        border: '1px solid rgba(148, 163, 184, 0.22)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 은은한 오로라 조명 */}
      <div
        style={{
          position: 'absolute',
          top: '-90px',
          left: '12%',
          width: '340px',
          height: '340px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '10%',
          width: '360px',
          height: '360px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* 상단 컨트롤 헤더: 스토리 타이틀 + 스타일 A/B 전환 탭 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 11px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #2563eb, #ec4899, #10b981)',
                color: '#ffffff',
                letterSpacing: '0.5px',
              }}
            >
              <Sparkles size={12} /> MISSION 01 · VISUAL STORYTELLING
            </span>
            <span
              style={{
                fontSize: '11.5px',
                color: '#93c5fd',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(147, 197, 253, 0.3)',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
            >
              텍스트 없이 한눈에 보는 [시선닷컴 (sisun.com) UI/UX 개편] 여정
            </span>
          </div>
          <h2 style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.4px', color: '#ffffff' }}>
            기획자 ➔ 디자이너 ➔ 퍼블리셔 3인 캐릭터 릴레이 애니메이션 쇼케이스
          </h2>
        </div>

        {/* 스타일 비교 선택 스위치 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(15, 23, 42, 0.85)',
            padding: '5px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setDisplayMode('compare')}
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: displayMode === 'compare' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'transparent',
              color: displayMode === 'compare' ? '#ffffff' : '#94a3b8',
              boxShadow: displayMode === 'compare' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Eye size={13} /> A + B 동시 비교 보기
          </button>
          <button
            onClick={() => setDisplayMode('styleA')}
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: displayMode === 'styleA' ? '#2563eb' : 'transparent',
              color: displayMode === 'styleA' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            <PenTool size={13} /> 스타일 A (순수 SVG 벡터 모션)
          </button>
          <button
            onClick={() => setDisplayMode('styleB')}
            style={{
              padding: '7px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: displayMode === 'styleB' ? '#ec4899' : 'transparent',
              color: displayMode === 'styleB' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            <Wand2 size={13} /> 스타일 B (3D 일러스트 + 라이브 홀로그램)
          </button>
        </div>
      </div>

      {/* 시퀀스 타임라인 컨트롤 바 (자동 릴레이 + 수동 단계 클릭) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '22px',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.2)',
              background: isPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isPlaying ? '#6ee7b7' : '#fcd34d',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? '자동 릴레이 재생중' : '일시정지됨 (클릭시 재생)'}
          </button>

          {PHASE_META.map((item) => {
            const isActive = currentPhase === item.phase;
            return (
              <button
                key={item.phase}
                onClick={() => {
                  setActivePhase(item.phase);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                  border: isActive ? `1.5px solid ${item.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? `${item.color}28` : 'rgba(15, 23, 42, 0.5)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? `0 0 14px ${item.glow}` : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isActive ? item.color : '#475569',
                    boxShadow: isActive ? `0 0 8px ${item.color}` : 'none',
                  }}
                />
                {item.roleTitle}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
          💡 <span style={{ color: '#93c5fd', fontWeight: 700 }}>{PHASE_META[currentPhase].actionCaption}</span>
        </div>
      </div>

      {/* =====================================================================
          [스타일 A] 100% 순수 SVG 벡터 캐릭터 관절 & 실시간 드로잉 시어터
         ===================================================================== */}
      {(displayMode === 'compare' || displayMode === 'styleA') && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1.5px solid rgba(96, 165, 250, 0.35)',
            borderRadius: '16px',
            padding: '22px',
            marginBottom: displayMode === 'compare' ? '26px' : '0',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 스타일 A 배지 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                STYLE A · 순수 코드 기반 SVG 벡터 & 관절 모션
              </span>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
                외부 이미지 없이 100% SVG 벡터 파츠(팔·손·펜·커서·코드)가 실시간으로 그려지고 움직이는 방식
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              * 캐릭터 위에 마우스를 올리면 해당 역할이 집중 조명됩니다
            </span>
          </div>

          {/* 3인 캐릭터 릴레이 그리드 (Style A) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
              alignItems: 'stretch',
            }}
          >
            {/* ---------------- 1. 기획자 (Planner SVG Stage) ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(0)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(0)}
              style={{
                background: isRoleSpotlight(0)
                  ? 'linear-gradient(180deg, rgba(37,99,235,0.22) 0%, rgba(15,23,42,0.92) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isRoleSpotlight(0)
                  ? '2px solid #3b82f6'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isRoleSpotlight(0) ? '0 12px 30px -6px rgba(37, 99, 235, 0.35)' : 'none',
                transform: isRoleSpotlight(0) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(0) ? 1 : 0.65,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* 상단 미니 라벨 (최소 텍스트, 아이콘 중심) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.18)',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Smartphone size={12} /> <Monitor size={12} /> 01. PLANNER (기획)
                </span>
                <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 700 }}>
                  Mobile & PC UX 설계
                </span>
              </div>

              {/* SVG 애니메이션 캔버스: 기획자 캐릭터 + 모바일/PC 와이어프레임 드로잉 */}
              <div style={{ width: '100%', height: '230px', position: 'relative' }}>
                <svg viewBox="0 0 320 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="plannerSuit" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#1e3a8a" />
                    </linearGradient>
                    <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* [우측 상단] 홀로그램 PC & 모바일 듀얼 화면설계서 (실시간 선 드로잉 모션) */}
                  <g style={{ animation: 'floatHoloCard 3.2s ease-in-out infinite' }}>
                    {/* 1) 모바일 프레임 */}
                    <rect
                      x="142"
                      y="18"
                      width="58"
                      height="108"
                      rx="9"
                      fill="#0f172a"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      filter="url(#glowBlue)"
                    />
                    {/* 모바일 노치 */}
                    <rect x="162" y="23" width="18" height="3" rx="1.5" fill="#60a5fa" />
                    {/* 모바일 와이어프레임 실시간 스케치 선들 */}
                    <rect
                      x="149"
                      y="32"
                      width="44"
                      height="24"
                      rx="3"
                      fill="rgba(59,130,246,0.15)"
                      stroke="#93c5fd"
                      strokeWidth="1.5"
                      strokeDasharray="240"
                      style={{ animation: 'strokeDrawLoop 2.8s ease-in-out infinite' }}
                    />
                    <line x1="149" y1="32" x2="193" y2="56" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" />
                    <rect
                      x="149"
                      y="62"
                      width="20"
                      height="24"
                      rx="2"
                      fill="rgba(59,130,246,0.1)"
                      stroke="#93c5fd"
                      strokeWidth="1.2"
                      strokeDasharray="240"
                      style={{ animation: 'strokeDrawLoop 2.8s ease-in-out 0.3s infinite' }}
                    />
                    <rect
                      x="173"
                      y="62"
                      width="20"
                      height="24"
                      rx="2"
                      fill="rgba(59,130,246,0.1)"
                      stroke="#93c5fd"
                      strokeWidth="1.2"
                      strokeDasharray="240"
                      style={{ animation: 'strokeDrawLoop 2.8s ease-in-out 0.5s infinite' }}
                    />
                    {/* 하단 구매 CTA 버튼 와이어프레임 */}
                    <rect x="149" y="94" width="44" height="10" rx="5" fill="#3b82f6" />
                    <text x="171" y="101.5" fontSize="6" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                      MOBILE UX
                    </text>

                    {/* 2) PC 와이드 프레임 */}
                    <rect
                      x="212"
                      y="26"
                      width="98"
                      height="76"
                      rx="6"
                      fill="#0f172a"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* PC 브라우저 상단 점 3개 */}
                    <circle cx="220" cy="33" r="2" fill="#f87171" />
                    <circle cx="226" cy="33" r="2" fill="#fbbf24" />
                    <circle cx="232" cy="33" r="2" fill="#34d399" />
                    <text x="268" y="35" fontSize="6.5" fill="#93c5fd" textAnchor="middle" fontWeight="bold">
                      sisun.com [PC SB]
                    </text>
                    {/* PC 내부 레이아웃 그리드 스케치 */}
                    <rect
                      x="219"
                      y="41"
                      width="84"
                      height="22"
                      rx="3"
                      fill="rgba(56,189,248,0.15)"
                      stroke="#7dd3fc"
                      strokeWidth="1.3"
                      strokeDasharray="240"
                      style={{ animation: 'strokeDrawLoop 2.8s ease-in-out 0.2s infinite' }}
                    />
                    <rect x="219" y="68" width="25" height="24" rx="2" stroke="#7dd3fc" strokeWidth="1.1" fill="none" />
                    <rect x="248" y="68" width="25" height="24" rx="2" stroke="#7dd3fc" strokeWidth="1.1" fill="none" />
                    <rect x="277" y="68" width="26" height="24" rx="2" stroke="#7dd3fc" strokeWidth="1.1" fill="none" />

                    {/* 모바일 <-> PC 반응형 유저 플로우 연결 화살표 */}
                    <path
                      d="M 196 112 Q 235 135 262 106"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                    <polygon points="262,104 266,110 258,109" fill="#fbbf24" />
                    <rect x="206" y="122" width="56" height="16" rx="8" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
                    <text x="234" y="133" fontSize="7.5" fill="#fde047" textAnchor="middle" fontWeight="bold">
                      효율적 동선 설계!
                    </text>
                  </g>

                  {/* [좌측] 귀여운 기획자 캐릭터 일러스트 (머리 + 안경 + 움직이는 팔 & 펜) */}
                  <g style={{ animation: 'charBob 2.4s ease-in-out infinite' }}>
                    {/* 고민 ? ➔ 유레카 💡 말풍선 */}
                    <g style={{ animation: 'ideaPop 2.8s ease-in-out infinite', transformOrigin: '45px 38px' }}>
                      <circle cx="42" cy="36" r="18" fill="rgba(254, 240, 138, 0.2)" stroke="#facc15" strokeWidth="1.5" />
                      <text x="42" y="42" fontSize="16" textAnchor="middle">
                        💡
                      </text>
                    </g>

                    {/* 몸통 (네이비 자켓 & 셔츠) */}
                    <path d="M 38 148 C 38 122, 102 122, 102 148 L 108 205 L 32 205 Z" fill="url(#plannerSuit)" />
                    <polygon points="62,128 78,128 70,156" fill="#ffffff" />
                    <polygon points="67,136 73,136 71,160 69,160" fill="#3b82f6" />

                    {/* 얼굴 */}
                    <circle cx="70" cy="92" r="30" fill="#fde68a" />
                    {/* 귀여운 볼터치 */}
                    <ellipse cx="50" cy="98" rx="5" ry="3" fill="#fca5a5" opacity="0.7" />
                    <ellipse cx="90" cy="98" rx="5" ry="3" fill="#fca5a5" opacity="0.7" />

                    {/* 헤어스타일 (단정한 가르마 소프트 헤어) */}
                    <path
                      d="M 38 86 C 36 56, 104 56, 102 86 C 96 68, 75 66, 58 72 C 48 75, 42 80, 38 86 Z"
                      fill="#1e293b"
                    />

                    {/* 스마트 둥근 안경 & 반짝이는 눈 */}
                    <circle cx="58" cy="90" r="9" fill="rgba(255,255,255,0.35)" stroke="#1e293b" strokeWidth="2.4" />
                    <circle cx="82" cy="90" r="9" fill="rgba(255,255,255,0.35)" stroke="#1e293b" strokeWidth="2.4" />
                    <line x1="67" y1="90" x2="73" y2="90" stroke="#1e293b" strokeWidth="2.2" />
                    <circle cx="59" cy="90" r="3.5" fill="#0f172a" />
                    <circle cx="83" cy="90" r="3.5" fill="#0f172a" />
                    <circle cx="60.5" cy="88.5" r="1.2" fill="#ffffff" />
                    <circle cx="84.5" cy="88.5" r="1.2" fill="#ffffff" />

                    {/* 밝은 미소 입 */}
                    <path d="M 63 104 Q 70 111 77 104" fill="none" stroke="#991b1b" strokeWidth="2.4" strokeLinecap="round" />

                    {/* 움직이는 오른팔 + 디지털 스타일러스 펜 (와이어프레임 그리는 동작!) */}
                    <g
                      style={{
                        transformOrigin: '94px 142px',
                        animation: 'plannerArmDraw 1.6s ease-in-out infinite',
                      }}
                    >
                      <path
                        d="M 94 142 Q 124 128 138 96"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      {/* 손 */}
                      <circle cx="140" cy="94" r="7" fill="#fde68a" />
                      {/* 빛나는 스마트 펜 */}
                      <line x1="134" y1="102" x2="154" y2="76" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
                      <circle cx="155" cy="75" r="3.5" fill="#fde047" filter="url(#glowBlue)" />
                    </g>
                  </g>

                  {/* 디자이너에게 날아가는 기획서(SB) 바통 아이콘 */}
                  <g style={{ animation: 'batonFlyRight 2.4s ease-in-out infinite' }}>
                    <rect x="262" y="168" width="44" height="28" rx="6" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
                    <text x="284" y="185" fontSize="8.5" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                      SB ➔
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* ---------------- 2. 디자이너 (Designer SVG Stage) ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(1)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(1)}
              style={{
                background: isRoleSpotlight(1)
                  ? 'linear-gradient(180deg, rgba(236,72,153,0.22) 0%, rgba(15,23,42,0.92) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isRoleSpotlight(1)
                  ? '2px solid #ec4899'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isRoleSpotlight(1) ? '0 12px 30px -6px rgba(236, 72, 153, 0.35)' : 'none',
                transform: isRoleSpotlight(1) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(1) ? 1 : 0.65,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#f472b6',
                    background: 'rgba(236, 72, 153, 0.18)',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Palette size={12} /> 02. DESIGNER (디자인)
                </span>
                <span style={{ fontSize: '11px', color: '#f9a8d4', fontWeight: 700 }}>
                  Figma 시선닷컴 리뉴얼
                </span>
              </div>

              {/* SVG 애니메이션 캔버스: 디자이너 캐릭터 + Figma 캔버스 채색 모션 */}
              <div style={{ width: '100%', height: '230px', position: 'relative' }}>
                <svg viewBox="0 0 320 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="sisunFashionGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="designerOutfit" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#db2777" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>

                  {/* [우측] Figma 디자인 리뉴얼 아트보드 */}
                  <g style={{ animation: 'floatHoloCard 3s ease-in-out infinite' }}>
                    {/* Figma 윈도우 프레임 */}
                    <rect
                      x="138"
                      y="16"
                      width="172"
                      height="122"
                      rx="8"
                      fill="#1e1e2e"
                      stroke="#f472b6"
                      strokeWidth="2"
                    />
                    {/* Figma 상단 툴바 & 4색 로고 도트 */}
                    <rect x="138" y="16" width="172" height="18" rx="8" fill="#2d2d44" />
                    <circle cx="148" cy="25" r="3" fill="#f24e1e" />
                    <circle cx="155" cy="25" r="3" fill="#a259ff" />
                    <circle cx="162" cy="25" r="3" fill="#1abcfe" />
                    <circle cx="169" cy="25" r="3" fill="#0acf83" />
                    <text x="232" y="28" fontSize="7" fill="#fbcfe8" textAnchor="middle" fontWeight="bold">
                      Figma · SISUN.COM Renewal
                    </text>

                    {/* 바탕: 흑백 기획서 와이어프레임 상태 */}
                    <rect x="148" y="40" width="152" height="42" rx="4" fill="#334155" stroke="#64748b" strokeDasharray="3 2" />
                    <rect x="148" y="88" width="46" height="40" rx="4" fill="#334155" />
                    <rect x="201" y="88" width="46" height="40" rx="4" fill="#334155" />
                    <rect x="254" y="88" width="46" height="40" rx="4" fill="#334155" />

                    {/* 오버레이: Figma 컬러 리뉴얼 채색 레이어 (클립 애니메이션으로 마법처럼 색칠됨) */}
                    <g style={{ animation: 'figmaColorWipe 3.2s ease-in-out infinite' }}>
                      {/* 시선닷컴 프리미엄 히어로 화보 배너 */}
                      <rect x="148" y="40" width="152" height="42" rx="4" fill="url(#sisunFashionGrad)" />
                      <text x="224" y="59" fontSize="10" fill="#ffffff" textAnchor="middle" fontWeight="bold" letterSpacing="1.5">
                        SISUN.COM
                      </text>
                      <text x="224" y="71" fontSize="6.5" fill="#fce7f3" textAnchor="middle">
                        2026 PREMIUM LOOKBOOK COLLECTION
                      </text>

                      {/* 리뉴얼된 패션 상품 카드 3개 */}
                      <rect x="148" y="88" width="46" height="40" rx="4" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1.2" />
                      <text x="171" y="108" fontSize="12" textAnchor="middle">👗</text>
                      <text x="171" y="121" fontSize="6" fill="#be185d" textAnchor="middle" fontWeight="bold">MICHAA</text>

                      <rect x="201" y="88" width="46" height="40" rx="4" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.2" />
                      <text x="224" y="108" fontSize="12" textAnchor="middle">🧥</text>
                      <text x="224" y="121" fontSize="6" fill="#6d28d9" textAnchor="middle" fontWeight="bold">it MICHAA</text>

                      <rect x="254" y="88" width="46" height="40" rx="4" fill="#eff6ff" stroke="#60a5fa" strokeWidth="1.2" />
                      <text x="277" y="108" fontSize="12" textAnchor="middle">👜</text>
                      <text x="277" y="121" fontSize="6" fill="#1d4ed8" textAnchor="middle" fontWeight="bold">E.B.M</text>
                    </g>

                    {/* 살아 움직이는 Figma 마우스 커서 + 이름표 */}
                    <g style={{ animation: 'figmaCursorMove 2.6s ease-in-out infinite' }}>
                      <polygon points="195,65 195,81 200,77 205,83 207,81 202,75 208,75" fill="#ec4899" stroke="#ffffff" strokeWidth="1" />
                      <rect x="205" y="76" width="44" height="13" rx="4" fill="#ec4899" />
                      <text x="227" y="85" fontSize="6.5" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                        UI Designer
                      </text>
                    </g>
                  </g>

                  {/* [좌측] 귀여운 디자이너 캐릭터 (베레모 + 컬러 팔레트 + 스타일러스 모션) */}
                  <g style={{ animation: 'charBob 2.2s ease-in-out 0.3s infinite' }}>
                    {/* 몸통 */}
                    <path d="M 36 148 C 36 122, 100 122, 100 148 L 106 205 L 30 205 Z" fill="url(#designerOutfit)" />
                    {/* 왼손에 든 컬러 팔레트 */}
                    <ellipse cx="32" cy="156" rx="16" ry="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="26" cy="153" r="3" fill="#ef4444" />
                    <circle cx="34" cy="150" r="3" fill="#3b82f6" />
                    <circle cx="39" cy="156" r="3" fill="#10b981" />
                    <circle cx="31" cy="161" r="3" fill="#ec4899" />

                    {/* 얼굴 */}
                    <circle cx="68" cy="94" r="29" fill="#fde68a" />
                    <ellipse cx="49" cy="100" rx="5" ry="3" fill="#f472b6" opacity="0.65" />
                    <ellipse cx="87" cy="100" rx="5" ry="3" fill="#f472b6" opacity="0.65" />

                    {/* 아티스트 퍼플/핑크 베레모 모자 */}
                    <ellipse cx="68" cy="67" rx="34" ry="14" fill="#a855f7" transform="rotate(-8 68 67)" />
                    <line x1="66" y1="53" x2="70" y2="47" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />

                    {/* 반짝이는 눈 & 윙크/미소 */}
                    <circle cx="57" cy="92" r="3.8" fill="#0f172a" />
                    <circle cx="79" cy="92" r="3.8" fill="#0f172a" />
                    <circle cx="58.5" cy="90.5" r="1.4" fill="#ffffff" />
                    <circle cx="80.5" cy="90.5" r="1.4" fill="#ffffff" />
                    <path d="M 61 105 Q 68 113 75 105" fill="none" stroke="#be185d" strokeWidth="2.4" strokeLinecap="round" />

                    {/* 움직이는 오른팔 (피그마 캔버스 컬러링 모션) */}
                    <g
                      style={{
                        transformOrigin: '92px 142px',
                        animation: 'designerArmPaint 1.5s ease-in-out infinite',
                      }}
                    >
                      <path
                        d="M 92 142 Q 118 128 134 100"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="13"
                        strokeLinecap="round"
                      />
                      <circle cx="136" cy="98" r="6.5" fill="#fde68a" />
                      <line x1="132" y1="104" x2="150" y2="80" stroke="#f472b6" strokeWidth="4.5" strokeLinecap="round" />
                      <circle cx="151" cy="79" r="4" fill="#a855f7" />
                    </g>
                  </g>

                  {/* 퍼블리셔에게 전달되는 Figma 디자인 바통 */}
                  <g style={{ animation: 'batonFlyRight 2.4s ease-in-out 0.6s infinite' }}>
                    <rect x="256" y="168" width="52" height="28" rx="6" fill="#ec4899" stroke="#fbcfe8" strokeWidth="1.5" />
                    <text x="282" y="185" fontSize="8.5" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                      UI 시안 ➔
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* ---------------- 3. 퍼블리셔 (Publisher SVG Stage) ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(2)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(2)}
              style={{
                background: isRoleSpotlight(2)
                  ? 'linear-gradient(180deg, rgba(16,185,129,0.22) 0%, rgba(15,23,42,0.92) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isRoleSpotlight(2)
                  ? '2px solid #10b981'
                  : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '14px',
                padding: '18px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isRoleSpotlight(2) ? '0 12px 30px -6px rgba(16, 185, 129, 0.35)' : 'none',
                transform: isRoleSpotlight(2) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(2) ? 1 : 0.65,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.18)',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Code2 size={12} /> 03. PUBLISHER (퍼블리싱)
                </span>
                <span style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700 }}>
                  HTML 코딩 & 반응형 배포
                </span>
              </div>

              {/* SVG 애니메이션 캔버스: 퍼블리셔 캐릭터 양손 키보드 타이핑 + HTML 코드 ➔ 웹사이트 완성 */}
              <div style={{ width: '100%', height: '230px', position: 'relative' }}>
                <svg viewBox="0 0 320 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="pubHoodie" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>

                  {/* [우측 상단] 코드 에디터(IDE) ➔ index.html ➔ 시선닷컴 라이브 웹 조립 */}
                  <g style={{ animation: 'floatHoloCard 3.1s ease-in-out infinite' }}>
                    {/* 1) 다크 코드 에디터 창 */}
                    <rect
                      x="136"
                      y="14"
                      width="92"
                      height="84"
                      rx="6"
                      fill="#090d16"
                      stroke="#34d399"
                      strokeWidth="1.8"
                    />
                    <text x="144" y="26" fontSize="6.5" fill="#6ee7b7" fontWeight="bold">
                      &lt;/&gt; sisun.html
                    </text>
                    {/* 실시간 타이핑되는 코드 라인들 */}
                    <rect x="144" y="33" width="52" height="4" rx="2" fill="#f472b6" />
                    <rect x="148" y="42" width="66" height="4" rx="2" fill="#38bdf8" />
                    <rect x="152" y="51" width="58" height="4" rx="2" fill="#a78bfa" />
                    <rect x="152" y="60" width="68" height="4" rx="2" fill="#34d399" />
                    <rect x="148" y="69" width="44" height="4" rx="2" fill="#fbbf24" />
                    <rect x="144" y="78" width="36" height="4" rx="2" fill="#f472b6" />

                    {/* 화살표: 코드 ➔ HTML 웹페이지 */}
                    <path d="M 230 56 L 244 56" stroke="#34d399" strokeWidth="2.2" />
                    <polygon points="244,52 250,56 244,60" fill="#34d399" />

                    {/* 2) 완성된 index.html & LIVE 시선닷컴 웹 카드 */}
                    <rect
                      x="252"
                      y="14"
                      width="62"
                      height="112"
                      rx="8"
                      fill="#ffffff"
                      stroke="#10b981"
                      strokeWidth="2.2"
                    />
                    <rect x="252" y="14" width="62" height="16" rx="6" fill="#065f46" />
                    <text x="283" y="25" fontSize="6.5" fill="#6ee7b7" textAnchor="middle" fontWeight="bold">
                      LIVE · HTML5
                    </text>
                    {/* 완성된 시선닷컴 미니 프리뷰 */}
                    <rect x="257" y="34" width="52" height="28" rx="4" fill="url(#sisunFashionGrad)" />
                    <text x="283" y="51" fontSize="7" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                      SISUN.COM
                    </text>
                    <rect x="257" y="66" width="24" height="26" rx="3" fill="#fce7f3" />
                    <rect x="285" y="66" width="24" height="26" rx="3" fill="#ede9fe" />
                    <rect x="257" y="98" width="52" height="18" rx="4" fill="#10b981" />
                    <text x="283" y="110" fontSize="6.5" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                      OPEN ✨
                    </text>
                  </g>

                  {/* [좌측] 귀여운 퍼블리셔 캐릭터 (헤드셋 + 민트 후드 + 초고속 키보드 타이핑) */}
                  <g style={{ animation: 'charBob 2.3s ease-in-out 0.5s infinite' }}>
                    {/* 몸통 (민트 후드티) */}
                    <path d="M 32 148 C 32 122, 98 122, 98 148 L 104 192 L 26 192 Z" fill="url(#pubHoodie)" />
                    {/* 후드 끈 */}
                    <line x1="58" y1="132" x2="58" y2="156" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="72" y1="132" x2="72" y2="156" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

                    {/* 헤드셋 아치 */}
                    <path d="M 34 90 C 32 50, 98 50, 96 90" fill="none" stroke="#34d399" strokeWidth="5" />
                    <rect x="28" y="80" width="10" height="22" rx="5" fill="#059669" stroke="#6ee7b7" strokeWidth="1.5" />
                    <rect x="92" y="80" width="10" height="22" rx="5" fill="#059669" stroke="#6ee7b7" strokeWidth="1.5" />

                    {/* 얼굴 */}
                    <circle cx="65" cy="92" r="28" fill="#fde68a" />
                    {/* 헤어 */}
                    <path d="M 38 84 C 40 58, 90 58, 92 84 C 82 70, 52 70, 38 84 Z" fill="#0f172a" />

                    {/* 집중하는 반짝 눈 & 신난 입 */}
                    <circle cx="55" cy="92" r="3.6" fill="#0f172a" />
                    <circle cx="75" cy="92" r="3.6" fill="#0f172a" />
                    <circle cx="56.2" cy="90.5" r="1.3" fill="#34d399" />
                    <circle cx="76.2" cy="90.5" r="1.3" fill="#34d399" />
                    <path d="M 59 103 Q 65 110 71 103" fill="none" stroke="#065f46" strokeWidth="2.4" strokeLinecap="round" />

                    {/* 게이밍/기계식 키보드 */}
                    <rect x="24" y="182" width="96" height="16" rx="4" fill="#1e293b" stroke="#34d399" strokeWidth="1.8" />
                    <line x1="32" y1="188" x2="112" y2="188" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="5 3" />

                    {/* 양손 초고속 교차 타이핑 모션! */}
                    <circle
                      cx="52"
                      cy="178"
                      r="7.5"
                      fill="#fde68a"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      style={{ animation: 'pubHandLeft 0.28s ease-in-out infinite' }}
                    />
                    <circle
                      cx="86"
                      cy="178"
                      r="7.5"
                      fill="#fde68a"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      style={{ animation: 'pubHandRight 0.28s ease-in-out infinite' }}
                    />

                    {/* 키보드 위로 튀어오르는 코드 스파크 (< />, { }) */}
                    <text x="42" y="164" fontSize="9" fill="#34d399" fontWeight="bold">
                      &lt;div&gt;
                    </text>
                    <text x="82" y="160" fontSize="9" fill="#38bdf8" fontWeight="bold">
                      {`{css}`}
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          [스타일 B] 3D 픽사풍 일러스트 캐릭터 에셋 + 라이브 홀로그램 UI 합성 시어터
         ===================================================================== */}
      {(displayMode === 'compare' || displayMode === 'styleB') && (
        <div
          style={{
            background: 'rgba(11, 19, 37, 0.92)',
            border: '1.5px solid rgba(236, 72, 153, 0.38)',
            borderRadius: '16px',
            padding: '22px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 스타일 B 배지 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                }}
              >
                STYLE B · 3D 픽사풍 캐릭터 일러스트 + 라이브 홀로그램 UI 합성
              </span>
              <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>
                고퀄리티 3D 클레이풍 캐릭터 일러스트 위에 살아 움직이는 기획서·Figma·HTML 코드 홀로그램을 결합한 방식
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#f9a8d4' }}>
              * 시선닷컴 리뉴얼 스토리 전용 3D 캐릭터 에셋 적용
            </span>
          </div>

          {/* 3인 캐릭터 릴레이 그리드 (Style B) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
              alignItems: 'stretch',
            }}
          >
            {/* ---------------- 1. 3D 기획자 + 모바일/PC 라이브 와이어프레임 홀로그램 ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(0)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(0)}
              style={{
                background: '#0b1528',
                border: isRoleSpotlight(0) ? '2px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                height: '310px',
                boxShadow: isRoleSpotlight(0) ? '0 14px 34px -6px rgba(59, 130, 246, 0.45)' : 'none',
                transform: isRoleSpotlight(0) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(0) ? 1 : 0.68,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* 3D 캐릭터 이미지 (숨쉬듯 둥실거리는 모션) */}
              <img
                src={charImgUrl('char-planner.jpg')}
                alt="서비스기획팀 기획자 캐릭터"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  animation: 'charBob 3s ease-in-out infinite',
                  filter: isRoleSpotlight(0) ? 'brightness(1.06)' : 'brightness(0.8)',
                }}
              />

              {/* 상단 역할 배지 오버레이 */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(96, 165, 250, 0.5)',
                    color: '#93c5fd',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  01 · 기획자 (UX Planner)
                </span>
                <span
                  style={{
                    background: 'rgba(250, 204, 21, 0.2)',
                    border: '1px solid #facc15',
                    color: '#fef08a',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    animation: 'ideaPop 2.4s ease-in-out infinite',
                  }}
                >
                  💡 Mobile · PC 설계
                </span>
              </div>

              {/* 하단 플로팅 홀로그램 오버레이: 실시간 모바일 & PC 와이어프레임 설계 위젯 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.86)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(96, 165, 250, 0.45)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  animation: 'floatHoloCard 2.8s ease-in-out infinite',
                }}
              >
                {/* 미니 모바일 + PC 반응형 모핑 프리뷰 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '44px',
                      borderRadius: '6px',
                      border: '1.5px solid #60a5fa',
                      background: 'rgba(37, 99, 235, 0.18)',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    <div style={{ height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', flex: 1 }}>
                      <div style={{ border: '1px dashed #93c5fd', borderRadius: '2px' }} />
                      <div style={{ border: '1px dashed #93c5fd', borderRadius: '2px' }} />
                    </div>
                  </div>
                  <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 800 }}>⇄</span>
                  <div
                    style={{
                      width: '58px',
                      height: '44px',
                      borderRadius: '6px',
                      border: '1.5px solid #38bdf8',
                      background: 'rgba(56, 189, 248, 0.14)',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    <div style={{ height: '10px', background: '#0284c7', borderRadius: '2px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', flex: 1 }}>
                      <div style={{ border: '1px dashed #7dd3fc', borderRadius: '2px' }} />
                      <div style={{ border: '1px dashed #7dd3fc', borderRadius: '2px' }} />
                      <div style={{ border: '1px dashed #7dd3fc', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd' }}>화면설계서 (SB)</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>고객 동선 스케치 ➔</div>
                </div>
              </div>
            </div>

            {/* ---------------- 2. 3D 디자이너 + Figma 컬러 리뉴얼 홀로그램 ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(1)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(1)}
              style={{
                background: '#0b1528',
                border: isRoleSpotlight(1) ? '2px solid #ec4899' : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                height: '310px',
                boxShadow: isRoleSpotlight(1) ? '0 14px 34px -6px rgba(236, 72, 153, 0.45)' : 'none',
                transform: isRoleSpotlight(1) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(1) ? 1 : 0.68,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <img
                src={charImgUrl('char-designer.jpg')}
                alt="서비스기획팀 디자이너 캐릭터"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  animation: 'charBob 3s ease-in-out 0.4s infinite',
                  filter: isRoleSpotlight(1) ? 'brightness(1.06)' : 'brightness(0.8)',
                }}
              />

              {/* 상단 역할 배지 오버레이 */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(244, 114, 182, 0.5)',
                    color: '#f9a8d4',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  02 · 디자이너 (UI Designer)
                </span>
                <span
                  style={{
                    background: 'rgba(236, 72, 153, 0.25)',
                    border: '1px solid #f472b6',
                    color: '#fce7f3',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                  }}
                >
                  🎨 Figma 리뉴얼
                </span>
              </div>

              {/* 날아다니는 Figma 라이브 커서 오버레이 */}
              <div
                style={{
                  position: 'absolute',
                  top: '110px',
                  left: '42%',
                  animation: 'figmaCursorMove 2.5s ease-in-out infinite',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    background: '#ec4899',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 10px rgba(236,72,153,0.6)',
                  }}
                >
                  ↖ Figma · SISUN UI
                </span>
              </div>

              {/* 하단 플로팅 홀로그램 오버레이: Figma 시선닷컴 브랜드 컬러링 바 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.86)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(244, 114, 182, 0.45)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  animation: 'floatHoloCard 2.8s ease-in-out 0.3s infinite',
                }}
              >
                {/* 흑백 설계도 ➔ 컬러 화보 변환 프리뷰 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div
                    style={{
                      width: '96px',
                      height: '42px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 55%, #2563eb 100%)',
                      padding: '5px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(236,72,153,0.4)',
                    }}
                  >
                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.8px' }}>
                      SISUN.COM
                    </div>
                    <div style={{ fontSize: '7.5px', color: '#fce7f3' }}>MICHAA · it MICHAA</div>
                  </div>
                  {/* 컬러 스와치 */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ec4899', border: '1px solid #fff' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6', border: '1px solid #fff' }} />
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8', border: '1px solid #fff' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#f9a8d4' }}>Figma UI 디자인</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>시선닷컴 리뉴얼 ➔</div>
                </div>
              </div>
            </div>

            {/* ---------------- 3. 3D 퍼블리셔 + HTML 코드 ➔ 반응형 웹 완성 홀로그램 ---------------- */}
            <div
              onMouseEnter={() => setHoveredRole(2)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => setActivePhase(2)}
              style={{
                background: '#0b1528',
                border: isRoleSpotlight(2) ? '2px solid #10b981' : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                height: '310px',
                boxShadow: isRoleSpotlight(2) ? '0 14px 34px -6px rgba(16, 185, 129, 0.45)' : 'none',
                transform: isRoleSpotlight(2) ? 'translateY(-4px)' : 'scale(0.98)',
                opacity: isRoleSpotlight(2) ? 1 : 0.68,
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <img
                src={charImgUrl('char-publisher.jpg')}
                alt="서비스기획팀 퍼블리셔 캐릭터"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  animation: 'charBob 3s ease-in-out 0.8s infinite',
                  filter: isRoleSpotlight(2) ? 'brightness(1.06)' : 'brightness(0.8)',
                }}
              />

              {/* 상단 역할 배지 오버레이 */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(52, 211, 153, 0.5)',
                    color: '#6ee7b7',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  03 · 퍼블리셔 (Web Publisher)
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.25)',
                    border: '1px solid #34d399',
                    color: '#d1fae5',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '9999px',
                  }}
                >
                  💻 &lt;html/&gt; 빌드 완료
                </span>
              </div>

              {/* 하단 플로팅 홀로그램 오버레이: 실시간 HTML 코드 타이핑 & sisun.com 완성 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(52, 211, 153, 0.45)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  animation: 'floatHoloCard 2.8s ease-in-out 0.6s infinite',
                }}
              >
                {/* 미니 코드 블록 ➔ HTML 파일 변환 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      background: '#090d16',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontFamily: 'monospace',
                      fontSize: '9.5px',
                      color: '#34d399',
                      lineHeight: 1.35,
                    }}
                  >
                    <div>&lt;header class="sisun"&gt;</div>
                    <div style={{ color: '#38bdf8' }}>&nbsp;&nbsp;&lt;main ui="renewal"/&gt;</div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#065f46',
                      color: '#ecfdf5',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 800,
                    }}
                  >
                    <FileCode2 size={13} color="#34d399" /> index.html
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#6ee7b7' }}>웹 퍼블리싱 완성</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>sisun.com LIVE ✨</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 스토리 요약 결과 배너: 3인의 작업이 모여 [시선닷컴 UI/UX 개편]이 됨을 한 줄로 직관화 */}
      <div
        style={{
          marginTop: '18px',
          padding: '14px 18px',
          borderRadius: '12px',
          background:
            'linear-gradient(90deg, rgba(37,99,235,0.2) 0%, rgba(236,72,153,0.2) 50%, rgba(16,185,129,0.2) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Layers size={13} color="#2563eb" /> 첫번째 핵심 업무
          </span>
          <strong style={{ fontSize: '14.5px', color: '#ffffff' }}>
            [시선닷컴 (sisun.com) UI/UX 개편]
          </strong>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
            = <strong>기획자</strong>(모바일·PC 화면설계) + <strong>디자이너</strong>(Figma 비주얼 리뉴얼) +{' '}
            <strong>퍼블리셔</strong>(HTML 반응형 웹 코딩)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6ee7b7', fontWeight: 700 }}>
          <CheckCircle2 size={15} /> 무언극 애니메이션 루프 가동중
        </div>
      </div>
    </div>
  );
}
