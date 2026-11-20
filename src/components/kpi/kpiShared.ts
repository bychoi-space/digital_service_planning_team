import type React from 'react';
import type { KpiGrade, KpiItem, KpiQuarter, KpiStatus, KpiTrack } from '../../types';
import { isTeamLeadName } from '../../constants/departments';
import { Code, FileText, Palette } from 'lucide-react';

export type KpiModeTab = 'evaluation' | 'peer_feedback';

export interface KpiRouteState {
  mode: KpiModeTab;
  detailId: string | null;
}

export function parseKpiRouteFromHash(
  hash: string = typeof window !== 'undefined' ? window.location.hash : ''
): KpiRouteState {
  const clean = hash.replace(/^#\/?/, '').trim();
  const lower = clean.toLowerCase();

  if (lower === 'kpi/peer' || lower === 'kpis/peer') {
    return { mode: 'peer_feedback', detailId: null };
  }

  const detailPrefixMatch = clean.match(/^kpis?\/detail\/(.+)$/i);
  if (detailPrefixMatch && detailPrefixMatch[1]) {
    try {
      return {
        mode: 'evaluation',
        detailId: decodeURIComponent(detailPrefixMatch[1].trim()),
      };
    } catch {
      return {
        mode: 'evaluation',
        detailId: detailPrefixMatch[1].trim(),
      };
    }
  }

  return { mode: 'evaluation', detailId: null };
}

export const QUARTERS: { key: KpiQuarter; label: string; shortLabel: string }[] = [
  { key: 'Annual', label: '2026 연간', shortLabel: '연간' },
  { key: 'Q1', label: '1분기', shortLabel: '1분기' },
  { key: 'Q2', label: '2분기', shortLabel: '2분기' },
  { key: 'Q3', label: '3분기', shortLabel: '3분기' },
  { key: 'Q4', label: '4분기', shortLabel: '4분기' },
];

// 직무 파트 설정 (기획=파란색, 디자인=녹색, 퍼블리싱=보라색 통일)
export const TRACK_CONFIG: Record<
  KpiTrack,
  {
    label: string;
    enLabel: string;
    classKey: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: {
    label: '기획',
    enLabel: 'Planning',
    classKey: 'track-planning',
    icon: FileText,
  },
  디자인: {
    label: '디자인',
    enLabel: 'Design',
    classKey: 'track-design',
    icon: Palette,
  },
  퍼블리싱: {
    label: '퍼블리싱',
    enLabel: 'Publishing',
    classKey: 'track-publishing',
    icon: Code,
  },
};

export const TRACK_LIST: KpiTrack[] = ['기획', '디자인', '퍼블리싱'];

export const STATUS_MAP: Record<KpiStatus, { label: string; classKey: string }> = {
  planning: { label: '목표 수립', classKey: 'kpi-status-planning' },
  in_progress: { label: '수행 · 점검중', classKey: 'kpi-status-progress' },
  achieved: { label: '목표 달성', classKey: 'kpi-status-achieved' },
  partially_achieved: { label: '부분 달성', classKey: 'kpi-status-partial' },
  missed: { label: '미달성 · 보완', classKey: 'kpi-status-missed' },
};

export const GRADE_RUBRIC: {
  grade: KpiGrade;
  score: number;
  label: string;
  shortLabel: string;
  desc: string;
  classKey: string;
}[] = [
  {
    grade: 'S',
    score: 100,
    label: 'S등급 (탁월)',
    shortLabel: 'S등급 (탁월)',
    desc: '일정·품질 완수 및 표준 모듈 자산화',
    classKey: 'grade-s',
  },
  {
    grade: 'A',
    score: 90,
    label: 'A등급 (우수 · 기준)',
    shortLabel: 'A등급 (기준)',
    desc: '합의 일정 내 목표 스펙 무결점 오픈',
    classKey: 'grade-a',
  },
  {
    grade: 'B',
    score: 80,
    label: 'B등급 (보통)',
    shortLabel: 'B등급 (보통)',
    desc: '일정 일부 지연 또는 오픈 후 보완 발생',
    classKey: 'grade-b',
  },
  {
    grade: 'C',
    score: 70,
    label: 'C등급 (미흡)',
    shortLabel: 'C등급 (미흡)',
    desc: '주요 일정 차질 또는 핵심 요구사항 누락',
    classKey: 'grade-c',
  },
];

export function resolveMemberDefaultTrack(name?: string | null): KpiTrack {
  const trimmed = (name || '').trim();
  if (trimmed === '박수민') return '디자인';
  if (trimmed === '김리아') return '퍼블리싱';
  return '기획';
}

export function resolveSelfGrade(selfScore?: number | null): KpiGrade | null {
  if (typeof selfScore !== 'number' || Number.isNaN(selfScore)) return null;
  if (selfScore >= 95) return 'S';
  if (selfScore >= 85) return 'A';
  if (selfScore >= 75) return 'B';
  return 'C';
}

export function getScoreFromGrade(grade?: KpiGrade | null): number | null {
  if (!grade) return null;
  const found = GRADE_RUBRIC.find((r) => r.grade === grade);
  return found ? found.score : null;
}

export function checkHasSelfEval(kpi: KpiItem): boolean {
  return (
    (typeof kpi.selfScore === 'number' && !Number.isNaN(kpi.selfScore)) ||
    Boolean(kpi.selfEvaluation && kpi.selfEvaluation.trim().length > 0) ||
    Boolean(kpi.currentValue && kpi.currentValue.trim().length > 0)
  );
}

export function isLeaderOwnedKpiItem(kpi: KpiItem): boolean {
  return kpi.targetScope === 'team' || isTeamLeadName(kpi.ownerName);
}

export function getValidLeaderGrade(kpi: KpiItem): KpiGrade | null {
  if (isLeaderOwnedKpiItem(kpi)) return null;
  if (!checkHasSelfEval(kpi)) return null;
  return kpi.leaderGrade || null;
}

export function getValidFinalGrade(kpi: KpiItem): KpiGrade | null {
  if (!checkHasSelfEval(kpi)) return null;
  if (!kpi.directorGrade) return null;
  if (kpi.directorEvaluatorName && isTeamLeadName(kpi.directorEvaluatorName)) {
    return null;
  }
  return kpi.directorGrade;
}

export function getValidFinalComment(kpi: KpiItem): string {
  if (!getValidFinalGrade(kpi)) return '';
  return kpi.directorComment || kpi.finalEvaluation || '';
}

export function getKpiLifecycleBadge(kpi: KpiItem): { label: string; classKey: string } {
  const hasSelf = checkHasSelfEval(kpi);
  const leaderGrade = getValidLeaderGrade(kpi);
  const finalGrade = getValidFinalGrade(kpi);

  if (finalGrade) {
    if (finalGrade === 'S' || finalGrade === 'A') {
      return { label: '실장 최종평가 완료 (목표 달성)', classKey: 'kpi-status-achieved' };
    }
    if (finalGrade === 'B') {
      return { label: '실장 최종평가 완료 (부분 달성)', classKey: 'kpi-status-partial' };
    }
    return { label: '실장 최종평가 완료 (보완 필요)', classKey: 'kpi-status-missed' };
  }

  if (leaderGrade) {
    return { label: '팀장 1차평가 완료 · 실장 최종평가 대기', classKey: 'kpi-status-progress' };
  }

  if (hasSelf) {
    return {
      label: isLeaderOwnedKpiItem(kpi)
        ? '자가평가 완료 · 실장 최종평가 대기'
        : '자가평가 완료 · 팀장 1차평가 대기',
      classKey: 'kpi-status-progress',
    };
  }

  return { label: '목표 수행중 · 자가평가 대기', classKey: 'kpi-status-planning' };
}

export function getKpiEvalMetrics(kpi: KpiItem) {
  const hasSelf = checkHasSelfEval(kpi);
  const finalGrade = getValidFinalGrade(kpi);
  const leaderGrade = getValidLeaderGrade(kpi);
  const selfGrade = resolveSelfGrade(kpi.selfScore);
  const weight = Number(kpi.weight || 0);

  if (finalGrade) {
    const score = kpi.directorScore ?? getScoreFromGrade(finalGrade) ?? 90;
    const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
    return {
      source: 'final' as const,
      grade: finalGrade,
      score,
      weight,
      weightedPoint,
    };
  }

  if (leaderGrade) {
    const score = kpi.leaderScore ?? getScoreFromGrade(leaderGrade) ?? 90;
    const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
    return {
      source: 'leader' as const,
      grade: leaderGrade,
      score,
      weight,
      weightedPoint,
    };
  }

  if (hasSelf && selfGrade) {
    const score = kpi.selfScore ?? getScoreFromGrade(selfGrade) ?? 90;
    const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
    return {
      source: 'self' as const,
      grade: selfGrade,
      score,
      weight,
      weightedPoint,
    };
  }

  return {
    source: 'none' as const,
    grade: null,
    score: null,
    weight,
    weightedPoint: null,
  };
}
