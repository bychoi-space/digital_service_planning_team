import React from 'react';
import { TEAM_GUIDE_DATA } from '../services/mockData';
import { PlanningStorageService } from '../services/storage';
import {
  Compass,
  Layers,
  ArrowRight,
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface OverviewViewProps {
  onNavigateToTasks: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateToTasks }) => {
  const users = PlanningStorageService.getUsers().filter((u) => u.role !== 'viewer');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. 히어로 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'rgba(255, 255, 255, 0.18)',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '14px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Sparkles size={14} /> 디지털서비스기획팀 업무 포털
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px' }}>
            {TEAM_GUIDE_DATA.vision}
          </h1>
          <p style={{ fontSize: '15px', color: '#e0e7ff', lineHeight: 1.6, marginBottom: '24px' }}>
            {TEAM_GUIDE_DATA.mission}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigateToTasks}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1d4ed8',
                fontWeight: 700,
                padding: '10px 20px',
              }}
            >
              팀 업무 진행 현황 확인 <ArrowRight size={16} />
            </button>
            <a
              href="#process-guide"
              className="btn btn-secondary"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              기획 프로세스 가이드 보기
            </a>
          </div>
        </div>
      </div>

      {/* 2. 기획 도메인 및 담당 서비스 카드 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layers size={20} color="#2563eb" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>주요 기획 도메인 & 서비스 R&R</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {TEAM_GUIDE_DATA.domains.map((domain) => (
            <div
              key={domain.id}
              className="card"
              style={{
                padding: '24px',
                borderTop: `4px solid ${domain.tagColor}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{domain.title}</h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '18px', flex: 1 }}>
                {domain.description}
              </p>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  담당 서비스 및 영역
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {domain.services.map((srv, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> 담당 리드: <strong style={{ color: 'var(--text-main)' }}>{domain.leadName}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 기획 업무 프로세스 가이드 (5단계) */}
      <div id="process-guide">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Compass size={20} color="#2563eb" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>서비스 기획 5단계 협업 프로세스</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            (유관부서 요구사항 인입부터 릴리즈 후 모니터링까지)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {TEAM_GUIDE_DATA.processSteps.map((step) => (
            <div
              key={step.step}
              className="card"
              style={{
                padding: '20px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {step.step}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>
                  {step.subtitle}
                </span>
              </div>

              <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4 }}>
                {step.title}
              </h4>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {step.description}
              </p>

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  산출물:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {step.deliverables.map((deliv, dIdx) => (
                    <li key={dIdx} style={{ fontSize: '11.5px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={12} color="#10b981" /> {deliv}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 유관부서 협업 창구 & 팀원 소개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* 유관부서 협업 창구 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>유관부서 협업 & 기획 문의 창구</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TEAM_GUIDE_DATA.collaborationChannels.map((ch, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{ch.name}</span>
                  <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {ch.type}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{ch.purpose}</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 500 }}>{ch.linkOrContact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 서비스기획팀 팀원 명단 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Users size={18} color="#2563eb" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>서비스기획팀 팀원 구성</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: u.avatarColor || '#3b82f6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {u.name.substring(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.position}</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
