import type React from 'react';
import type { KpiGrade, KpiItem, KpiQuarter, KpiStatus, KpiTrack } from '../../types';
import { isTeamLeadName } from '../../constants/departments';
import { Code, FileText, Palette } from 'lucide-react';

export type KpiModeTab = 'evaluation' | 'peer_feedback';

export interface KpiRouteState {
  mode: KpiModeTab;
  detailId: string | null;
  queryYear?: number;
  queryQuarter?: KpiQuarter;
}

const VALID_QUARTERS = new Set<KpiQuarter>(['Annual', 'Q1', 'Q2', 'Q3', 'Q4']);

export function parseKpiRouteFromHash(
  hash: string = typeof window !== 'undefined' ? window.location.hash : ''
): KpiRouteState {
  const raw = hash.replace(/^#\/?/, '').trim();
  const [pathPart, queryPart] = raw.split('?');
  const clean = (pathPart || '').trim();
  const lower = clean.toLowerCase();

  let queryYear: number | undefined;
  let queryQuarter: KpiQuarter | undefined;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const y = Number(params.get('year'));
    if (Number.isInteger(y) && y >= 2024 && y <= 2035) {
      queryYear = y;
    }
    const q = params.get('quarter') as KpiQuarter | null;
    if (q && VALID_QUARTERS.has(q)) {
      queryQuarter = q;
    }
  }

  if (lower === 'kpi/peer' || lower === 'kpis/peer') {
    return { mode: 'peer_feedback', detailId: null, queryYear, queryQuarter };
  }

  const detailPrefixMatch = clean.match(/^kpis?\/detail\/(.+)$/i);
  if (detailPrefixMatch && detailPrefixMatch[1]) {
    try {
      return {
        mode: 'evaluation',
        detailId: decodeURIComponent(detailPrefixMatch[1].trim()),
        queryYear,
        queryQuarter,
      };
    } catch {
      return {
        mode: 'evaluation',
        detailId: detailPrefixMatch[1].trim(),
        queryYear,
        queryQuarter,
      };
    }
  }

  return { mode: 'evaluation', detailId: null, queryYear, queryQuarter };
}

export const KPI_YEAR_OPTIONS: number[] = [2026, 2027, 2028];

export const QUARTERS: { key: KpiQuarter; label: string; shortLabel: string }[] = [
  { key: 'Annual', label: '연간 종합', shortLabel: '연간' },
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

// 1~3단계 공통 5점 만점 평가 척도 (자가평가 · 협업다면 · 1차 팀장평가 통일)
export const SCORE_5_RUBRIC: {
  score: number;
  label: string;
  shortLabel: string;
  desc: string;
}[] = [
  {
    score: 5,
    label: '5점 (탁월)',
    shortLabel: '5점 · 탁월',
    desc: '합의 일정·품질 초과 완수 및 표준화 기여',
  },
  {
    score: 4,
    label: '4점 (우수 · 기준)',
    shortLabel: '4점 · 우수',
    desc: '합의된 일정 및 완료 기준(DoD) 무결점 완수',
  },
  {
    score: 3,
    label: '3점 (보통)',
    shortLabel: '3점 · 보통',
    desc: '기본 목표 완료 (일부 일정·스펙 보완 발생)',
  },
  {
    score: 2,
    label: '2점 (보완 필요)',
    shortLabel: '2점 · 보완',
    desc: '주요 일정 지연 또는 핵심 요구사항 보완 발생',
  },
  {
    score: 1,
    label: '1점 (미흡)',
    shortLabel: '1점 · 미흡',
    desc: '핵심 목표 미달성 또는 중대 차질 발생',
  },
];

// 4단계 실장(유은정 상무) 최종 등급 기준표 (1~3단계 점수를 종합 확인하여 실장이 직접 등급 부여)
export const GRADE_RUBRIC: {
  grade: KpiGrade;
  score: number;
  label: string;
  shortLabel: string;
  rangeGuide: string;
  desc: string;
  classKey: string;
}[] = [
  {
    grade: 'S',
    score: 100,
    label: 'S등급 (탁월)',
    shortLabel: 'S등급 (탁월)',
    rangeGuide: '종합 4.5~5.0점 수준',
    desc: '일정·품질 완수 및 표준 모듈 자산화',
    classKey: 'grade-s',
  },
  {
    grade: 'A',
    score: 90,
    label: 'A등급 (우수 · 기준)',
    shortLabel: 'A등급 (기준)',
    rangeGuide: '종합 3.5~4.4점 수준',
    desc: '합의 일정 내 목표 스펙 무결점 오픈',
    classKey: 'grade-a',
  },
  {
    grade: 'B',
    score: 80,
    label: 'B등급 (보통)',
    shortLabel: 'B등급 (보통)',
    rangeGuide: '종합 2.5~3.4점 수준',
    desc: '일정 일부 지연 또는 오픈 후 보완 발생',
    classKey: 'grade-b',
  },
  {
    grade: 'C',
    score: 70,
    label: 'C등급 (미흡)',
    shortLabel: 'C등급 (미흡)',
    rangeGuide: '종합 1.0~2.4점 수준',
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

// 기존 100점제 레거시 점수 또는 등급을 1~5점(5.0 만점) 점수로 안전 변환
export function normalizeFivePointScore(
  rawScore?: number | null,
  legacyGrade?: KpiGrade | null
): number | null {
  if (typeof rawScore === 'number' && !Number.isNaN(rawScore) && rawScore > 0) {
    if (rawScore <= 5) {
      return Math.round(rawScore * 10) / 10;
    }
    if (rawScore >= 95) return 5;
    if (rawScore >= 85) return 4;
    if (rawScore >= 75) return 3;
    if (rawScore >= 65) return 2;
    return 1;
  }
  if (legacyGrade === 'S') return 5;
  if (legacyGrade === 'A') return 4;
  if (legacyGrade === 'B') return 3;
  if (legacyGrade === 'C') return 2;
  return null;
}

export function recommendGradeFromFiveScore(avg5?: number | null): KpiGrade {
  if (typeof avg5 !== 'number' || Number.isNaN(avg5)) return 'A';
  if (avg5 >= 4.5) return 'S';
  if (avg5 >= 3.5) return 'A';
  if (avg5 >= 2.5) return 'B';
  return 'C';
}

export function resolveGradeFromHundredScore(score100?: number | null): KpiGrade | null {
  if (typeof score100 !== 'number' || Number.isNaN(score100)) return null;
  if (score100 >= 95) return 'S';
  if (score100 >= 85) return 'A';
  if (score100 >= 75) return 'B';
  return 'C';
}

export function getScoreFromGrade(grade?: KpiGrade | null): number | null {
  if (!grade) return null;
  const found = GRADE_RUBRIC.find((r) => r.grade === grade);
  return found ? found.score : null;
}

// 단일 통합 자가평가 코멘트 반환 (레거시 currentValue + selfEvaluation 무손실 병합)
export function resolveUnifiedSelfComment(kpi: KpiItem): string {
  const cur = (kpi.currentValue || '').trim();
  const selfEv = (kpi.selfEvaluation || '').trim();
  if (cur && selfEv) {
    return cur === selfEv ? selfEv : `${cur}\n\n${selfEv}`;
  }
  return selfEv || cur || '';
}

export function checkHasSelfEval(kpi: KpiItem): boolean {
  return (
    (typeof kpi.selfScore === 'number' && !Number.isNaN(kpi.selfScore) && kpi.selfScore > 0) ||
    resolveUnifiedSelfComment(kpi).length > 0
  );
}

export function getSelfScore5(kpi: KpiItem): number | null {
  if (!checkHasSelfEval(kpi)) return null;
  return normalizeFivePointScore(kpi.selfScore) ?? 4;
}

export function getPeerScore5Info(kpi: KpiItem): {
  count: number;
  avg: number | null;
  avgQuality: string;
  avgCollab: string;
} {
  const list = kpi.peerReviews || [];
  const count = list.length;
  if (count === 0) {
    return { count: 0, avg: null, avgQuality: '0.0', avgCollab: '0.0' };
  }
  const qAvg = list.reduce((acc, r) => acc + Number(r.scoreQuality || 5), 0) / count;
  const cAvg = list.reduce((acc, r) => acc + Number(r.scoreCollaboration || 5), 0) / count;
  const totalAvg =
    typeof kpi.peerAvgScore === 'number' && kpi.peerAvgScore > 0 && kpi.peerAvgScore <= 5
      ? Math.round(kpi.peerAvgScore * 10) / 10
      : Math.round(((qAvg + cAvg) / 2) * 10) / 10;

  return {
    count,
    avg: totalAvg,
    avgQuality: qAvg.toFixed(1),
    avgCollab: cAvg.toFixed(1),
  };
}

export function isLeaderOwnedKpiItem(kpi: KpiItem): boolean {
  return kpi.targetScope === 'team' || isTeamLeadName(kpi.ownerName);
}

// 팀장 1차 평가 유효 여부 판별 (5점 척도 점수 기준, 레거시 leaderGrade 호환)
export function getLeaderScore5(kpi: KpiItem): number | null {
  if (isLeaderOwnedKpiItem(kpi)) return null;
  if (!checkHasSelfEval(kpi)) return null;
  return normalizeFivePointScore(kpi.leaderScore, kpi.leaderGrade);
}

// 하위 호환용 헬퍼 (일정 통계 등에서 1차 평가 완료 여부 체크용)
export function getValidLeaderGrade(kpi: KpiItem): KpiGrade | null {
  const s5 = getLeaderScore5(kpi);
  if (s5 === null) return null;
  return kpi.leaderGrade || recommendGradeFromFiveScore(s5);
}

// 1~3단계(자가 · 협업다면 · 팀장1차) 중 입력 완료된 점수의 5.0 만점 종합 평균
export function getThreeStageAvgScore5(kpi: KpiItem): number | null {
  const self5 = getSelfScore5(kpi);
  const peer5 = getPeerScore5Info(kpi).avg;
  const leader5 = getLeaderScore5(kpi);
  const parts = [self5, peer5, leader5].filter((v): v is number => v !== null);
  if (parts.length === 0) return null;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
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
  const leaderScore5 = getLeaderScore5(kpi);
  const finalGrade = getValidFinalGrade(kpi);

  if (finalGrade) {
    if (finalGrade === 'S' || finalGrade === 'A') {
      return { label: `실장 최종 확정 (${finalGrade}등급)`, classKey: 'kpi-status-achieved' };
    }
    if (finalGrade === 'B') {
      return { label: `실장 최종 확정 (${finalGrade}등급)`, classKey: 'kpi-status-partial' };
    }
    return { label: `실장 최종 확정 (${finalGrade}등급)`, classKey: 'kpi-status-missed' };
  }

  if (leaderScore5 !== null) {
    return { label: '1~3단계 점수 입력 완료 · 최종 등급 대기', classKey: 'kpi-status-progress' };
  }

  if (hasSelf) {
    return {
      label: isLeaderOwnedKpiItem(kpi)
        ? '자가평가 완료 · 실장 최종 등급 대기'
        : '자가평가 완료 · 팀장 1차평가 대기',
      classKey: 'kpi-status-progress',
    };
  }

  return { label: '목표 수행중 · 자가평가 대기', classKey: 'kpi-status-planning' };
}

export function getKpiEvalMetrics(kpi: KpiItem) {
  const finalGrade = getValidFinalGrade(kpi);
  const avgScore5 = getThreeStageAvgScore5(kpi);
  const weight = Number(kpi.weight || 0);

  if (finalGrade) {
    const score = kpi.directorScore ?? getScoreFromGrade(finalGrade) ?? 90;
    const weightedPoint = Math.round(((score * weight) / 100) * 10) / 10;
    return {
      source: 'final' as const,
      grade: finalGrade,
      score,
      avgScore5,
      weight,
      weightedPoint,
    };
  }

  if (avgScore5 !== null) {
    return {
      source: 'interim' as const,
      grade: null,
      score: null,
      avgScore5,
      weight,
      weightedPoint: null,
    };
  }

  return {
    source: 'none' as const,
    grade: null,
    score: null,
    avgScore5: null,
    weight,
    weightedPoint: null,
  };
}
