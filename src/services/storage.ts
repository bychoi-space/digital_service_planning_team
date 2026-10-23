import type {
  User,
  TaskItem,
  VacationItem,
  KpiItem,
  KpiProcessStage,
  KpiQuarterlyCheckin,
  KpiPeerReview,
  KpiGrade,
  AuditLog,
  UserRole,
  WorkInfoItem,
} from '../types';
import { getSupabaseClient, isSupabaseEnabled } from './supabase';

const STORAGE_KEYS = {
  USERS: 'ds_planning_users_v2',
  TASKS: 'ds_planning_tasks_clean_v1',
  VACATIONS: 'ds_planning_vacations_clean_v1',
  KPIS: 'ds_planning_kpis_clean_v1',
  AUDIT_LOGS: 'ds_planning_audit_logs_clean_v1',
  WORK_INFOS: 'ds_planning_work_infos_v1',
  CURRENT_USER_ID: 'ds_planning_current_user_id_v2',
  CURRENT_USER_SNAPSHOT: 'ds_planning_current_user_snapshot_v2',
};

const WORK_INFO_CLOUD_RECORD_ID = 'sys-work-info-store-v1';
const KPI_CLOUD_RECORD_ID = 'sys-kpi-extended-store-v1';

const INITIAL_WORK_INFO_ITEMS: WorkInfoItem[] = [
  {
    id: 'winfo-1',
    category: '기본 사항',
    title: '시선 그룹웨어 (메신저, 메일, 일정)',
    content: 'https://gw.sisun.com/',
    note: '',
    sortOrder: 1,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-2',
    category: '기본 사항',
    title: 'ERP, 나스 폴더 (공유폴더)',
    content: 'ID : 1260808\nPW : sisun65@@',
    note: '',
    sortOrder: 2,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-3',
    category: '기본 사항',
    title: '디지털정보실 업무 담당자',
    content: 'ERP : 김현진 수석부장, 모세 과장\n그룹웨어 / 메신저 : 민상연 대리\n나스 : 김동혁 주임',
    note: '',
    sortOrder: 3,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-4',
    category: '기본 사항',
    title: '와이파이',
    content:
      '1. 게스트 (손님용)\nsisun\nsisun1234\n* 인터넷만 가능\n\n2. 내부 업무용\nsisunin\nsisun12#$\n* 내부 : NAS, ERP 회의실에서 업무사용\n내부업무 접속 가이드 - Hiden 되어 있는 WiFi',
    note: '',
    sortOrder: 4,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-5',
    category: '기본 사항',
    title: '라이브 방송',
    content: '소스라이브',
    note: '',
    sortOrder: 5,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-6',
    category: '참고 정보',
    title: 'QA 서버 Front',
    content: 'https://qas.sisun.com/',
    note: '',
    sortOrder: 6,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
  {
    id: 'winfo-7',
    category: '참고 정보',
    title: 'QA 서버 Admin',
    content: 'https://qasadmin.sisun.com/',
    note: '',
    sortOrder: 7,
    createdBy: '최범열',
    createdAt: '2026-10-23T02:55:00.000Z',
    updatedBy: '최범열',
    updatedAt: '2026-10-23T02:55:00.000Z',
  },
];

// 안전한 JSON 파싱 유틸리티 (무오류 원칙 준수)
function safeJsonParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    return (parsed ?? fallback) as T;
  } catch (error) {
    console.error('Storage JSON parse error:', error);
    return fallback;
  }
}

// 안전한 고유 ID 생성기
export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${randomStr}`;
}

export class PlanningStorageService {
  private static isSyncing = false;

  // 1. 초기 시드 데이터 검증 및 초기화 (Supabase DB 전용)
  public static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VACATIONS)) {
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KPIS)) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORK_INFOS)) {
      localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(INITIAL_WORK_INFO_ITEMS));
    }

    // Supabase가 활성화되어 있으면 백그라운드 원격 동기화 시도
    this.syncFromSupabase();
  }

  // --- Supabase 클라우드 DB 백그라운드 동기화 (무오류 보호) ---
  public static async syncFromSupabase(): Promise<void> {
    if (!isSupabaseEnabled() || this.isSyncing) return;
    const client = getSupabaseClient();
    if (!client) return;

    this.isSyncing = true;
    try {
      // 0. users 동기화 (클라우드 회원 DB - 로컬 가입 회원 안전 병합 및 원격 자동 푸시)
      const { data: remoteUsers, error: userErr } = await client.from('users').select('*').order('created_at', { ascending: true });
      if (!userErr && remoteUsers && remoteUsers.length > 0) {
        const localUsers = safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
        const prevCurrentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        const prevCurrentUser = localUsers.find((u) => String(u.id) === String(prevCurrentId));

        const mappedRemoteUsers: User[] = remoteUsers.map((row) => ({
          id: String(row.id),
          username: row.username || `user_${String(row.id)}`,
          name: row.name,
          password: row.password ?? '',
          role: row.role as UserRole,
          department: row.department,
          position: row.position || (row.role === 'admin' ? '팀장 / 수석기획자' : row.role === 'member' ? '서비스기획자' : '유관부서 담당자'),
          email: row.email || `${row.name.replace(/\s+/g, '').toLowerCase()}@company.com`,
          avatarColor: row.avatar_color || '#2563eb',
        }));

        const userMap = new Map<string, User>();
        mappedRemoteUsers.forEach((u) => userMap.set(u.name.trim(), u));

        for (const localUser of localUsers) {
          const key = localUser.name.trim();
          if (!userMap.has(key)) {
            userMap.set(key, localUser);
            this.pushUserToRemote(localUser);
          } else {
            const remoteUser = userMap.get(key)!;
            if (!remoteUser.password && localUser.password) {
              remoteUser.password = localUser.password;
              this.pushUserToRemote(remoteUser);
            }
          }
        }

        const mergedUsers = Array.from(userMap.values());
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));

        // 로그인된 사용자 세션 ID가 이름 기준으로 매칭되는 원격 회원 ID로 갱신되어야 하는 경우 보정
        if (prevCurrentUser) {
          const matchedMerged = mergedUsers.find((u) => u.name.trim() === prevCurrentUser.name.trim());
          if (matchedMerged && String(matchedMerged.id) !== String(prevCurrentId)) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matchedMerged.id);
          }
        }
      }

      // 1. tasks 동기화 (로컬 데이터 절대 보존 및 안전 병합 정책)
      const { data: remoteTasks, error: taskErr } = await client.from('tasks').select('*');
      if (!taskErr && remoteTasks) {
        const filteredTasks = remoteTasks.filter((row) => !String(row.id).startsWith('task-10'));
        const mappedRemoteTasks: TaskItem[] = filteredTasks.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          track: (row.track as any) || '기획',
          assigneeId: row.assignee_id,
          assigneeName: row.assignee_name,
          priority: row.priority,
          status: row.status,
          startDate: row.start_date,
          dueDate: row.due_date,
          progress: Number(row.progress || 0),
          description: row.description || '',
          links: row.links || [],
          workspaceProjectId: row.workspace_project_id || undefined,
          period: row.period || undefined,
          notionUrl: row.notion_url || undefined,
          jiraUrl: row.jira_url || undefined,
          artifactUrl: row.artifact_url || undefined,
          themeIndex: row.theme_index !== undefined ? Number(row.theme_index) : undefined,
          version: row.version || '0.1',
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }));

        // 로컬에 등록된 기존 데이터 보호 및 안전 병합
        const localTasks = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []).filter(
          (t) => !String(t.id).startsWith('task-10')
        );

        const taskMap = new Map<string, TaskItem>();
        // 1-1. 로컬 데이터 먼저 맵에 등록 (사용자가 새로 등록한 작업 완벽 보존)
        localTasks.forEach((t) => taskMap.set(t.id, t));

        // 1-2. 원격 데이터 병합 (원격 정보 갱신, 단 로컬의 track 정보 보존)
        mappedRemoteTasks.forEach((remote) => {
          const local = taskMap.get(remote.id);
          taskMap.set(remote.id, {
            ...remote,
            track: remote.track || local?.track || '기획',
          });
        });

        const mergedTasks = Array.from(taskMap.values());
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));

        // 1-3. 로컬에만 있고 원격에 아직 반영 안 된 항목이 있으면 자동 백그라운드 푸시
        for (const localTask of localTasks) {
          if (!mappedRemoteTasks.some((r) => r.id === localTask.id)) {
            this.pushTaskToRemote(localTask);
          }
        }
      }

      // 2. vacations 동기화 (로컬 데이터 안전 병합)
      const { data: remoteVac, error: vacErr } = await client.from('vacations').select('*');
      if (!vacErr && remoteVac) {
        const filteredVac = remoteVac.filter((row) => !String(row.id).startsWith('vac-20'));
        const mappedRemoteVac: VacationItem[] = filteredVac.map((row) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          department: row.department,
          type: row.type,
          startDate: row.start_date,
          endDate: row.end_date,
          deputyId: row.deputy_id,
          deputyName: row.deputy_name,
          contact: row.contact || '',
          notes: row.notes || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }));

        const localVac = safeJsonParse<VacationItem[]>(localStorage.getItem(STORAGE_KEYS.VACATIONS), []).filter(
          (v) => !String(v.id).startsWith('vac-20')
        );
        const vacMap = new Map<string, VacationItem>();
        localVac.forEach((v) => vacMap.set(v.id, v));
        mappedRemoteVac.forEach((r) => vacMap.set(r.id, r));

        localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(Array.from(vacMap.values())));
      }

      // 3. kpis 동기화 (로컬 데이터 안전 병합)
      const { data: remoteKpis, error: kpiErr } = await client.from('kpis').select('*');
      if (!kpiErr && remoteKpis) {
        const filteredKpis = remoteKpis.filter((row) => !String(row.id).startsWith('kpi-30'));
        const mappedRemoteKpis: KpiItem[] = filteredKpis.map((row) => ({
          id: row.id,
          year: Number(row.year),
          quarter: row.quarter,
          targetScope: row.target_scope,
          ownerId: row.owner_id || undefined,
          ownerName: row.owner_name,
          track: row.track || '기획',
          title: row.title,
          targetMetric: row.target_metric,
          targetValue: row.target_value,
          currentValue: row.current_value || '',
          weight: Number(row.weight || 0),
          achievementRate: Number(row.achievement_rate || 0),
          status: row.status,
          stage: row.stage || (row.status === 'planning' ? 'draft' : 'aligned'),
          checkins: Array.isArray(row.checkins) ? row.checkins : [],
          peerReviews: Array.isArray(row.peer_reviews) ? row.peer_reviews : [],
          peerAvgScore: row.peer_avg_score ? Number(row.peer_avg_score) : undefined,
          selfEvaluation: row.self_evaluation || '',
          selfScore: row.self_score ? Number(row.self_score) : undefined,
          leaderScore: row.leader_score ? Number(row.leader_score) : undefined,
          leaderGrade: row.leader_grade || undefined,
          leaderComment: row.leader_comment || undefined,
          leaderEvaluatedAt: row.leader_evaluated_at || undefined,
          directorScore: row.director_score ? Number(row.director_score) : undefined,
          directorGrade: row.director_grade || undefined,
          directorComment: row.director_comment || undefined,
          directorEvaluatedAt: row.director_evaluated_at || undefined,
          finalEvaluation: row.final_evaluation || '',
          evaluatorName: row.evaluator_name || '',
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedBy: row.updated_by,
          updatedAt: row.updated_at,
        }));

        const localKpis = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []).filter(
          (k) => !String(k.id).startsWith('kpi-30')
        );
        const kpiMap = new Map<string, KpiItem>();
        mappedRemoteKpis.forEach((r) => kpiMap.set(r.id, r));
        localKpis.forEach((k) => {
          const remote = kpiMap.get(k.id);
          kpiMap.set(k.id, remote ? { ...remote, ...k } : k);
        });

        localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(Array.from(kpiMap.values())));
      }

      // 4. audit_logs, 업무 관련 정보(work_infos), KPI 확장/동료피드백 데이터 동기화
      const { data: remoteLogs, error: logErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      if (!logErr && remoteLogs && remoteLogs.length > 0) {
        const cloudWorkInfoRow = remoteLogs.find((row) => row.id === WORK_INFO_CLOUD_RECORD_ID);
        if (cloudWorkInfoRow && typeof cloudWorkInfoRow.summary === 'string') {
          const parsedWorkInfos = safeJsonParse<WorkInfoItem[]>(cloudWorkInfoRow.summary, []);
          if (Array.isArray(parsedWorkInfos) && parsedWorkInfos.length > 0) {
            localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(parsedWorkInfos));
          }
        }

        const cloudKpiRow = remoteLogs.find((row) => row.id === KPI_CLOUD_RECORD_ID);
        if (cloudKpiRow && typeof cloudKpiRow.summary === 'string') {
          const parsedExtendedKpis = safeJsonParse<KpiItem[]>(cloudKpiRow.summary, []);
          if (Array.isArray(parsedExtendedKpis) && parsedExtendedKpis.length > 0) {
            const currentKpis = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []);
            const mergedMap = new Map<string, KpiItem>();
            currentKpis.forEach((k) => mergedMap.set(k.id, k));
            parsedExtendedKpis.forEach((ext) => {
              const existing = mergedMap.get(ext.id);
              if (existing) {
                mergedMap.set(ext.id, {
                  ...existing,
                  ...ext,
                  peerReviews: Array.isArray(ext.peerReviews) && ext.peerReviews.length > 0
                    ? ext.peerReviews
                    : existing.peerReviews || [],
                  peerAvgScore: ext.peerAvgScore ?? existing.peerAvgScore,
                });
              } else {
                mergedMap.set(ext.id, ext);
              }
            });
            localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(Array.from(mergedMap.values())));
          }
        }

        const mappedLogs: AuditLog[] = remoteLogs
          .filter(
            (row) =>
              row.id !== WORK_INFO_CLOUD_RECORD_ID &&
              row.entity_title !== 'WORK_INFO_STORE' &&
              row.id !== KPI_CLOUD_RECORD_ID &&
              row.entity_title !== 'KPI_EXTENDED_STORE'
          )
          .map((row) => ({
            id: row.id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            entityTitle: row.entity_title,
            action: row.action,
            actorId: row.actor_id,
            actorName: row.actor_name,
            actorRole: row.actor_role,
            timestamp: row.timestamp,
            summary: row.summary,
          }));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(mappedLogs));
      }
    } catch (e) {
      console.warn('Supabase background sync skipped (tables pending creation):', e);
    } finally {
      this.isSyncing = false;
    }
  }

  // --- 사용자 및 인증/세션 관리 (Supabase DB 기반) ---
  public static getUsers(): User[] {
    this.initialize();
    return safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), []);
  }

  // 서비스기획팀 소속으로 가입된 팀원 목록 조회 (담당자/대행자 선택용)
  public static getServicePlanningMembers(): User[] {
    const users = this.getUsers();
    const members = users.filter(
      (u) =>
        u.department === '서비스기획팀' ||
        u.department?.includes('서비스기획') ||
        u.role === 'admin' ||
        u.role === 'member'
    );
    if (members.length > 0) return members;
    const current = this.getCurrentUser();
    return current ? [current] : [];
  }

  // 원격 Supabase users 테이블로 회원 정보 업서트 (id/username 포함 스키마 및 시퀀스 스키마 모두 호환)
  public static async pushUserToRemote(user: User): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const payloadFull = {
      id: user.id,
      username: user.username || `user_${Date.now().toString(36)}`,
      name: user.name,
      password: user.password || '',
      role: user.role,
      department: user.department,
      position: user.position || (user.role === 'viewer' ? '유관부서 담당자' : '서비스기획자'),
      email: user.email || `${user.name.replace(/\s+/g, '').toLowerCase()}@company.com`,
      avatar_color: user.avatarColor || '#2563eb',
    };

    try {
      // 먼저 동일 성명(name)으로 등록된 원격 레코드가 있으면 비밀번호·부서·역할을 즉시 업데이트
      await client
        .from('users')
        .update({
          password: user.password || '',
          department: user.department,
          role: user.role,
          position: user.position || (user.role === 'viewer' ? '유관부서 담당자' : '서비스기획자'),
        })
        .eq('name', user.name.trim());

      const { error } = await client.from('users').upsert(payloadFull);
      if (error) {
        if (error.message.includes('username')) {
          const { username: _unused, ...payloadWithoutUsername } = payloadFull;
          await client.from('users').upsert(payloadWithoutUsername);
        } else {
          console.warn('[Supabase] User upsert note:', error.message);
        }
      }
    } catch (e) {
      console.warn('[Supabase] User push error:', e);
    }
  }

  public static isLoggedIn(): boolean {
    return localStorage.getItem('ds_planning_is_logged_in_v1') === 'true';
  }

  public static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const snapshot = safeJsonParse<User | null>(localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT), null);

    if (currentId) {
      const matchedById = users.find((u) => String(u.id) === String(currentId));
      if (matchedById) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(matchedById));
        return matchedById;
      }
    }

    if (snapshot?.name) {
      const matchedByName = users.find((u) => u.name.trim() === snapshot.name.trim());
      if (matchedByName) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, matchedByName.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(matchedByName));
        return matchedByName;
      }
      return snapshot;
    }

    const fallback = users.find((u) => u.name === '최범열') || users[0];
    if (fallback) {
      if (!currentId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, fallback.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(fallback));
      }
      return fallback;
    }
    // DB 로딩 전 기본 안전 관리자 객체
    return {
      id: 'user-mvfynq9h-dl4un',
      name: '최범열',
      role: 'admin',
      department: '서비스기획팀',
      position: '서비스기획자 / 차장',
      email: 'choi@company.com',
      avatarColor: '#0891b2',
    };
  }

  public static setCurrentUser(userId: string): User {
    const users = this.getUsers();
    const target = users.find((u) => String(u.id) === String(userId));
    if (target) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(target));
      localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
      this.recordAuditLog({
        entityType: 'auth',
        entityId: target.id,
        entityTitle: target.name,
        action: 'LOGIN',
        summary: `${target.name}(${target.role === 'viewer' ? '유관부서 뷰어' : '기획팀원'}) 계정으로 전환/로그인`,
        actorOverride: { id: target.id, name: target.name, role: target.role },
      });
      return target;
    }
    return this.getCurrentUser();
  }

  // 로그인 인증 처리 (이름 + 비밀번호)
  public static login(name: string, password?: string): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const trimmedName = name.trim();
    const found = users.find(
      (u) => u.name.trim() === trimmedName || u.name.startsWith(trimmedName)
    );

    if (!found) {
      return { success: false, message: '등록되지 않은 이름입니다. [회원가입]을 진행해 주세요.' };
    }

    if (!password) {
      return { success: false, message: '비밀번호를 입력해 주세요.' };
    }

    // 비밀번호가 설정되어 있는 경우 검증
    if (found.password && found.password !== password) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    // 비밀번호가 비어있던 복구 계정의 경우 최초 로그인 비밀번호를 저장 및 동기화
    if (!found.password) {
      found.password = password;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.pushUserToRemote(found);
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'LOGIN',
      summary: `${found.name} (${found.department}) 포털 로그인 성공`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return { success: true, user: found };
  }

  // 신규 회원가입 처리 (Supabase users 테이블 스키마 완벽 호환)
  public static async registerUser(params: {
    name: string;
    password: string;
    department: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    const users = this.getUsers();
    const trimmedName = params.name.trim();

    // 역할 자동 결정: 서비스기획팀이면 member, 그 외 유관부서는 viewer
    const isPlanTeam = params.department.includes('서비스기획') || params.department.includes('기획');
    const role: UserRole = isPlanTeam ? 'member' : 'viewer';

    // 이미 동일 이름이 존재하는 경우: 비밀번호 미설정(복구 계정)이면 비밀번호/부서 갱신 허용, 아니면 중복 안내
    const existingUser = users.find((u) => u.name.trim() === trimmedName);
    if (existingUser) {
      if (!existingUser.password) {
        existingUser.password = params.password;
        existingUser.department = params.department;
        existingUser.role = role;
        existingUser.position = isPlanTeam ? '서비스기획자' : '유관부서 담당자';
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existingUser.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(existingUser));
        localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
        await this.pushUserToRemote(existingUser);
        return { success: true, user: existingUser };
      }
      return { success: false, message: '이미 동일한 이름으로 등록된 사용자가 있습니다.' };
    }

    const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const assignedId = generateUniqueId('user');
    const assignedUsername = `user_${Date.now().toString(36)}`;

    const newUser: User = {
      id: assignedId,
      username: assignedUsername,
      name: trimmedName,
      password: params.password,
      role,
      department: params.department,
      position: isPlanTeam ? '서비스기획자' : '유관부서 담당자',
      email: `${trimmedName.replace(/\s+/g, '').toLowerCase()}@company.com`,
      avatarColor: randomColor,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(newUser));
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');

    // Supabase DB 동기화 저장
    await this.pushUserToRemote(newUser);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: newUser.id,
      entityTitle: newUser.name,
      action: 'CREATE',
      summary: `신규 회원가입: ${newUser.name} (${newUser.department}, ${role === 'member' ? '기획팀원' : '유관부서 뷰어'})`,
      actorOverride: { id: newUser.id, name: newUser.name, role: newUser.role },
    });

    return { success: true, user: newUser };
  }

  // 로그아웃 처리
  public static logout(): void {
    const current = this.getCurrentUser();
    localStorage.setItem('ds_planning_is_logged_in_v1', 'false');
    this.recordAuditLog({
      entityType: 'auth',
      entityId: current.id,
      entityTitle: current.name,
      action: 'LOGIN',
      summary: `${current.name} 포털 로그아웃`,
    });
  }

  // [비밀번호 관리 1] 비로그인 상태: 이름 + 가입 소속 부서 일치 검증 후 즉시 새 비밀번호 재설정
  public static async resetPasswordByIdentity(params: {
    name: string;
    department: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers();
    const trimmedName = params.name.trim();
    const trimmedDept = params.department.trim();

    if (!trimmedName) {
      return { success: false, message: '이름(성명)을 입력해 주세요.' };
    }
    if (!trimmedDept) {
      return { success: false, message: '가입 시 선택한 소속 부서를 선택해 주세요.' };
    }
    if (!params.newPassword) {
      return { success: false, message: '새 비밀번호를 입력해 주세요.' };
    }

    const found = users.find((u) => u.name.trim() === trimmedName);
    if (!found) {
      return {
        success: false,
        message: '등록되지 않은 이름입니다. 성명을 다시 확인하거나 [회원가입]을 진행해 주세요.',
      };
    }

    if (found.department.trim() !== trimmedDept) {
      return {
        success: false,
        message: '가입 시 등록된 소속 부서와 일치하지 않습니다. 소속 부서를 다시 확인해 주세요.',
      };
    }

    found.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const currentSnapshot = safeJsonParse<User | null>(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT),
      null
    );
    if (currentSnapshot && currentSnapshot.name.trim() === found.name.trim()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));
    }

    await this.pushUserToRemote(found);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'UPDATE',
      summary: `[비밀번호 재설정] ${found.name} (${found.department}) 본인 확인(성명+소속부서)을 통한 비밀번호 재설정 완료`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return {
      success: true,
      message: `${found.name}님의 비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인해 주세요.`,
    };
  }

  // [비밀번호 관리 2] 로그인 상태: 내 비밀번호 변경 (현재 비밀번호 검증 -> 새 비밀번호 저장)
  public static async changeMyPassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const users = this.getUsers();
    const currentUser = this.getCurrentUser();
    const found =
      users.find((u) => String(u.id) === String(params.userId)) ||
      users.find((u) => u.name.trim() === currentUser.name.trim());

    if (!found) {
      return { success: false, message: '현재 로그인된 계정 정보를 찾을 수 없습니다.' };
    }

    if (!params.currentPassword) {
      return { success: false, message: '현재 비밀번호를 입력해 주세요.' };
    }

    if (found.password && found.password !== params.currentPassword) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }

    if (!params.newPassword) {
      return { success: false, message: '새 비밀번호를 입력해 주세요.' };
    }

    if (found.password && found.password === params.newPassword) {
      return { success: false, message: '새 비밀번호는 기존 비밀번호와 다르게 입력해 주세요.' };
    }

    found.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(found));

    await this.pushUserToRemote(found);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'UPDATE',
      summary: `[내 비밀번호 변경] ${found.name} (${found.department}) 본인이 직접 비밀번호를 변경함`,
      actorOverride: { id: found.id, name: found.name, role: found.role },
    });

    return {
      success: true,
      message: '비밀번호가 안전하게 변경되었습니다.',
    };
  }

  // [비밀번호 관리 3] 관리자(최범열) 전용: 특정 회원의 비밀번호 강제 초기화 또는 임시 비밀번호 지정
  public static async adminResetUserPassword(params: {
    targetUserId: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser();
    const isAdmin = currentUser.role === 'admin' || currentUser.name?.trim() === '최범열';
    if (!isAdmin) {
      return { success: false, message: '관리자만 회원의 비밀번호를 초기화할 수 있습니다.' };
    }

    const users = this.getUsers();
    const target = users.find((u) => String(u.id) === String(params.targetUserId));
    if (!target) {
      return { success: false, message: '대상 회원 정보를 찾을 수 없습니다.' };
    }

    target.password = params.newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    if (target.name.trim() === currentUser.name.trim()) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_SNAPSHOT, JSON.stringify(target));
    }

    await this.pushUserToRemote(target);

    this.recordAuditLog({
      entityType: 'auth',
      entityId: target.id,
      entityTitle: target.name,
      action: 'UPDATE',
      summary: params.newPassword
        ? `[관리자 비밀번호 지정] 관리자(${currentUser.name})가 ${target.name} (${target.department}) 계정의 비밀번호를 재설정함`
        : `[관리자 비밀번호 초기화] 관리자(${currentUser.name})가 ${target.name} (${target.department}) 계정을 최초 로그인 시 비밀번호 재설정 상태로 초기화함`,
    });

    return {
      success: true,
      message: params.newPassword
        ? `${target.name}님의 비밀번호가 지정한 비밀번호로 변경되었습니다.`
        : `${target.name}님의 비밀번호가 초기화되었습니다. (다음 로그인 시 입력하는 비밀번호로 자동 설정됩니다)`,
    };
  }

  public static isViewer(): boolean {
    return this.getCurrentUser().role === 'viewer';
  }

  // --- 감사 로그 (Audit Logs) 기록 유틸리티 ---
  public static getAuditLogs(): AuditLog[] {
    this.initialize();
    const logs = safeJsonParse<AuditLog[]>(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS), []).filter(
      (log) =>
        log.id !== WORK_INFO_CLOUD_RECORD_ID &&
        log.entityTitle !== 'WORK_INFO_STORE' &&
        log.id !== KPI_CLOUD_RECORD_ID &&
        log.entityTitle !== 'KPI_EXTENDED_STORE'
    );
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static recordAuditLog(params: {
    entityType: 'task' | 'vacation' | 'kpi' | 'auth' | 'work_info';
    entityId: string;
    entityTitle: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE';
    summary: string;
    actorOverride?: { id: string; name: string; role: UserRole };
  }): void {
    const actor = params.actorOverride || this.getCurrentUser();
    const newLog: AuditLog = {
      id: generateUniqueId('log'),
      entityType: params.entityType,
      entityId: params.entityId,
      entityTitle: params.entityTitle,
      action: params.action,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      timestamp: new Date().toISOString(),
      summary: params.summary,
    };

    const logs = this.getAuditLogs();
    const updated = [newLog, ...logs].slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    // Supabase DB 비동기 반영
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('audit_logs').insert({
        id: newLog.id,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        entity_title: newLog.entityTitle,
        action: newLog.action,
        actor_id: newLog.actorId,
        actor_name: newLog.actorName,
        actor_role: newLog.actorRole,
        timestamp: newLog.timestamp,
        summary: newLog.summary,
      }).then(({ error }) => {
        if (error) console.warn('Supabase audit log insert note:', error.message);
      });
    }
  }

  // --- 1. 업무 관리 (Task) CRUD ---
  public static getTasks(): TaskItem[] {
    this.initialize();
    const stored = safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), []);
    // track 필드 기본값 및 기존 세션 오류로 잘못 기록된 최초 등록자 보정
    return stored.map((t) => ({
      ...t,
      track: t.track || '기획',
      createdBy: t.id === 'task-mvk8olb8-z6sqd' && t.createdBy === '최범열' ? '박수민' : t.createdBy,
    }));
  }

  // Supabase 원격 DB로 업무 전송 (track 컬럼 유무와 무관한 스마트 2단계 전송)
  public static async pushTaskToRemote(task: TaskItem): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const payloadWithTrack = {
      id: task.id,
      title: task.title,
      category: task.category,
      track: task.track || '기획',
      assignee_id: task.assigneeId,
      assignee_name: task.assigneeName,
      priority: task.priority,
      status: task.status,
      start_date: task.startDate,
      due_date: task.dueDate,
      progress: task.progress,
      description: task.description,
      links: task.links,
      workspace_project_id: task.workspaceProjectId || null,
      period: task.period || null,
      notion_url: task.notionUrl || null,
      jira_url: task.jiraUrl || null,
      artifact_url: task.artifactUrl || null,
      theme_index: task.themeIndex ?? 0,
      version: task.version || '0.1',
      created_by: task.createdBy,
      created_at: task.createdAt,
      updated_by: task.updatedBy,
      updated_at: task.updatedAt,
    };

    try {
      const { error } = await client.from('tasks').upsert(payloadWithTrack);
      if (error) {
        console.warn('[Supabase] Task push error:', error.message);
      } else {
        console.log(`[Supabase] Task [${task.title}] successfully synced to cloud DB.`);
      }
    } catch (e) {
      console.warn('[Supabase] Task push unexpected error:', e);
    }
  }

  public static createTask(
    data: Omit<TaskItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>,
    actor?: User
  ): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 등록할 수 없습니다.');
    }
    const currentUser = actor || this.getCurrentUser();
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...data,
      track: data.track || '기획',
      id: generateUniqueId('task'),
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const tasks = this.getTasks();
    const updated = [newTask, ...tasks];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));

    this.recordAuditLog({
      entityType: 'task',
      entityId: newTask.id,
      entityTitle: newTask.title,
      action: 'CREATE',
      summary: `새 업무 등록: [${newTask.track} · ${newTask.category}] ${newTask.title} (담당: ${newTask.assigneeName})`,
      actorOverride: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    });

    // Supabase DB 비동기 반영 (스마트 2단계 전송)
    this.pushTaskToRemote(newTask);

    return newTask;
  }

  public static updateTask(taskId: string, changes: Partial<TaskItem>, actor?: User): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 수정할 수 없습니다.');
    }
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error('수정할 업무 항목을 찾을 수 없습니다.');
    }

    const currentUser = actor || this.getCurrentUser();
    const original = tasks[index];
    const now = new Date().toISOString();

    const updatedTask: TaskItem = {
      ...original,
      ...changes,
      track: changes.track || original.track || '기획',
      createdBy: original.createdBy,
      createdAt: original.createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    const changeNotes: string[] = [];
    if (changes.track && changes.track !== original.track) {
      changeNotes.push(`파트: ${original.track} → ${changes.track}`);
    }
    if (changes.status && changes.status !== original.status) {
      changeNotes.push(`상태: ${original.status} → ${changes.status}`);
    }
    if (changes.progress !== undefined && changes.progress !== original.progress) {
      changeNotes.push(`진척률: ${original.progress}% → ${changes.progress}%`);
    }
    if (changes.priority && changes.priority !== original.priority) {
      changeNotes.push(`우선순위: ${original.priority} → ${changes.priority}`);
    }
    const summaryText = changeNotes.length > 0 
      ? `업무 변경: ${changeNotes.join(', ')}`
      : `업무 정보 수정: ${updatedTask.title}`;

    this.recordAuditLog({
      entityType: 'task',
      entityId: updatedTask.id,
      entityTitle: updatedTask.title,
      action: 'UPDATE',
      summary: summaryText,
      actorOverride: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    });

    // Supabase DB 비동기 반영 (스마트 2단계 전송)
    this.pushTaskToRemote(updatedTask);

    return updatedTask;
  }

  public static deleteTask(taskId: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 삭제할 수 없습니다.');
    }
    const tasks = this.getTasks();
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const filtered = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));

    this.recordAuditLog({
      entityType: 'task',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `업무 삭제: [${target.category}] ${target.title}`,
    });

    // Supabase DB 삭제
    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('tasks').delete().eq('id', taskId).then(({ error }) => {
        if (error) console.warn('Supabase task delete note:', error.message);
      });
    }
  }

  // --- 2. 휴가 관리 (Vacation) CRUD ---
  public static getVacations(): VacationItem[] {
    this.initialize();
    return safeJsonParse<VacationItem[]>(localStorage.getItem(STORAGE_KEYS.VACATIONS), []);
  }

  public static createVacation(data: Omit<VacationItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): VacationItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newVacation: VacationItem = {
      ...data,
      id: generateUniqueId('vac'),
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const vacations = this.getVacations();
    const updated = [newVacation, ...vacations];
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(updated));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: newVacation.id,
      entityTitle: `${newVacation.userName} 일정`,
      action: 'CREATE',
      summary: `휴가 등록: ${newVacation.userName} (${newVacation.startDate}~${newVacation.endDate}, 대행: ${newVacation.deputyName})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').insert({
        id: newVacation.id,
        user_id: newVacation.userId,
        user_name: newVacation.userName,
        department: newVacation.department,
        type: newVacation.type,
        start_date: newVacation.startDate,
        end_date: newVacation.endDate,
        deputy_id: newVacation.deputyId,
        deputy_name: newVacation.deputyName,
        contact: newVacation.contact,
        notes: newVacation.notes,
        created_by: newVacation.createdBy,
        created_at: newVacation.createdAt,
        updated_by: newVacation.updatedBy,
        updated_at: newVacation.updatedAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase vacation insert note:', error.message);
      });
    }

    return newVacation;
  }

  public static updateVacation(id: string, changes: Partial<VacationItem>): VacationItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 수정할 수 없습니다.');
    }
    const vacations = this.getVacations();
    const index = vacations.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('휴가 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const updated: VacationItem = {
      ...vacations[index],
      ...changes,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    vacations[index] = updated;
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: updated.id,
      entityTitle: `${updated.userName} 일정`,
      action: 'UPDATE',
      summary: `휴가 일정 수정: ${updated.userName} (${updated.startDate}~${updated.endDate})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').update({
        user_id: updated.userId,
        user_name: updated.userName,
        department: updated.department,
        type: updated.type,
        start_date: updated.startDate,
        end_date: updated.endDate,
        deputy_id: updated.deputyId,
        deputy_name: updated.deputyName,
        contact: updated.contact,
        notes: updated.notes,
        updated_by: updated.updatedBy,
        updated_at: updated.updatedAt,
      }).eq('id', updated.id).then(({ error }) => {
        if (error) console.warn('Supabase vacation update note:', error.message);
      });
    }

    return updated;
  }

  public static deleteVacation(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 휴가를 취소할 수 없습니다.');
    }
    const vacations = this.getVacations();
    const target = vacations.find((v) => v.id === id);
    if (!target) return;

    const filtered = vacations.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(filtered));

    this.recordAuditLog({
      entityType: 'vacation',
      entityId: target.id,
      entityTitle: `${target.userName} 일정`,
      action: 'DELETE',
      summary: `휴가 취소/삭제: ${target.userName} (${target.startDate}~${target.endDate})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('vacations').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase vacation delete note:', error.message);
      });
    }
  }

  // --- 3. KPI 관리 CRUD & 4단계 라이프사이클 프로세스 ---
  public static getKpis(): KpiItem[] {
    this.initialize();
    const raw = safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []);
    return raw.map((k) => ({
      ...k,
      stage: k.stage || (k.status === 'planning' ? 'draft' : 'aligned'),
      checkins: Array.isArray(k.checkins) ? k.checkins : [],
      peerReviews: Array.isArray(k.peerReviews)
        ? k.peerReviews.map((pr) => ({
            ...pr,
            reviewerName: '익명 동료',
          }))
        : [],
      track: k.track || '기획',
    }));
  }

  private static async pushExtendedKpisToRemote(kpis: KpiItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: KPI_CLOUD_RECORD_ID,
        entity_type: 'kpi',
        entity_id: 'sys-kpi-extended',
        entity_title: 'KPI_EXTENDED_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: 'SYSTEM',
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(kpis),
      });
    } catch (e) {
      console.warn('Supabase kpi extended sync note:', e);
    }
  }

  public static createKpi(data: Omit<KpiItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): KpiItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newKpi: KpiItem = {
      ...data,
      id: generateUniqueId('kpi'),
      stage: data.stage || 'draft',
      track: data.track || '기획',
      ownerId: data.ownerId || currentUser.id,
      checkins: data.checkins || [],
      peerReviews: data.peerReviews || [],
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const kpis = this.getKpis();
    const updated = [newKpi, ...kpis];
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updated));
    this.pushExtendedKpisToRemote(updated);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: newKpi.id,
      entityTitle: newKpi.title,
      action: 'CREATE',
      summary: `KPI 목표 등록: [${newKpi.quarter} · ${newKpi.track}] ${newKpi.title} (가중치: ${newKpi.weight}%, 담당: ${newKpi.ownerName})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').insert({
        id: newKpi.id,
        year: newKpi.year,
        quarter: newKpi.quarter,
        target_scope: newKpi.targetScope,
        owner_name: newKpi.ownerName,
        title: newKpi.title,
        target_metric: newKpi.targetMetric,
        target_value: newKpi.targetValue,
        current_value: newKpi.currentValue,
        weight: newKpi.weight,
        achievement_rate: newKpi.achievementRate,
        status: newKpi.status,
        self_evaluation: newKpi.selfEvaluation,
        final_evaluation: newKpi.finalEvaluation,
        evaluator_name: newKpi.evaluatorName,
        created_by: newKpi.createdBy,
        created_at: newKpi.createdAt,
        updated_by: newKpi.updatedBy,
        updated_at: newKpi.updatedAt,
      }).then(({ error }) => {
        if (error) console.warn('Supabase kpi insert note:', error.message);
      });
    }

    return newKpi;
  }

  public static updateKpi(id: string, changes: Partial<KpiItem>): KpiItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 수정/평가할 수 없습니다.');
    }
    const kpis = this.getKpis();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) throw new Error('KPI 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const original = kpis[index];
    const updated: KpiItem = {
      ...original,
      ...changes,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    kpis[index] = updated;
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));
    this.pushExtendedKpisToRemote(kpis);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: updated.id,
      entityTitle: updated.title,
      action: 'UPDATE',
      summary: `KPI 갱신/평가: ${updated.title} (단계: ${updated.stage || '미정'}, 달성률: ${updated.achievementRate}%, 상태: ${updated.status})`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').update({
        year: updated.year,
        quarter: updated.quarter,
        target_scope: updated.targetScope,
        owner_name: updated.ownerName,
        title: updated.title,
        target_metric: updated.targetMetric,
        target_value: updated.targetValue,
        current_value: updated.currentValue,
        weight: updated.weight,
        achievement_rate: updated.achievementRate,
        status: updated.status,
        self_evaluation: updated.selfEvaluation,
        final_evaluation: updated.finalEvaluation,
        evaluator_name: updated.evaluatorName,
        updated_by: updated.updatedBy,
        updated_at: updated.updatedAt,
      }).eq('id', updated.id).then(({ error }) => {
        if (error) console.warn('Supabase kpi update note:', error.message);
      });
    }

    return updated;
  }

  // [1단계] 팀장에게 목표 합의 요청
  public static requestKpiAlignment(id: string, comment?: string): KpiItem {
    return this.updateKpi(id, {
      stage: 'alignment_pending',
      alignmentComment: comment || '팀장 목표 합의를 요청합니다.',
    });
  }

  // [1단계] 팀장 목표 합의 승인 (목표 확정 Lock)
  public static approveKpiAlignment(id: string, leaderComment?: string): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'aligned',
      status: 'in_progress',
      alignedBy: currentUser.name,
      alignedAt: now,
      alignmentComment: leaderComment || '목표 합의가 승인되었습니다.',
    });
  }

  // [1단계] 팀장 목표 반려 / 보완 요청
  public static rejectKpiAlignment(id: string, reason: string): KpiItem {
    return this.updateKpi(id, {
      stage: 'draft',
      status: 'planning',
      alignmentComment: `[보완 요청] ${reason}`,
    });
  }

  // [2단계] 분기별 점검 및 목표 조정 (Quarterly Check-in)
  public static addQuarterlyCheckin(
    id: string,
    checkinData: Omit<KpiQuarterlyCheckin, 'id' | 'createdAt'>
  ): KpiItem {
    const kpis = this.getKpis();
    const target = kpis.find((k) => k.id === id);
    if (!target) throw new Error('KPI 항목을 찾을 수 없습니다.');

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newCheckin: KpiQuarterlyCheckin = {
      ...checkinData,
      id: generateUniqueId('chk'),
      createdAt: now,
      reviewedBy: currentUser.name,
      reviewedAt: now,
    };

    const existingCheckins = Array.isArray(target.checkins) ? target.checkins : [];
    // 같은 분기가 있으면 교체, 없으면 추가
    const filteredCheckins = existingCheckins.filter((c) => c.quarter !== checkinData.quarter);
    const updatedCheckins = [...filteredCheckins, newCheckin].sort((a, b) => a.quarter.localeCompare(b.quarter));

    return this.updateKpi(id, {
      stage: target.stage === 'draft' || target.stage === 'alignment_pending' ? 'quarterly_checkin' : target.stage,
      currentValue: checkinData.currentValue || target.currentValue,
      achievementRate: checkinData.progressRate ?? target.achievementRate,
      checkins: updatedCheckins,
    });
  }

  // [3단계] 동료 다면평가 제출 (Peer Review - 타 임직원 전용, 무기명 결과 보장)
  public static submitPeerReview(
    id: string,
    reviewData: Omit<KpiPeerReview, 'id' | 'submittedAt'>
  ): KpiItem {
    const kpis = this.getKpis();
    const index = kpis.findIndex((k) => k.id === id);
    if (index === -1) throw new Error('KPI 항목을 찾을 수 없습니다.');
    const target = kpis[index];

    const currentUser = this.getCurrentUser();
    const isSelfKpi =
      target.ownerName?.trim() === currentUser.name?.trim() ||
      (target.ownerId ? String(target.ownerId) === String(currentUser.id) : false) ||
      (target.targetScope === 'team' && target.createdBy?.trim() === currentUser.name?.trim());

    if (isSelfKpi) {
      throw new Error('본인의 KPI에는 직접 동료 피드백을 등록할 수 없습니다.');
    }

    const now = new Date().toISOString();
    const newReview: KpiPeerReview = {
      ...reviewData,
      reviewerName: '익명 동료',
      id: generateUniqueId('peer'),
      submittedAt: now,
    };

    const existingReviews = Array.isArray(target.peerReviews) ? target.peerReviews : [];
    const filtered = existingReviews.filter(
      (r) => String(r.reviewerId) !== String(reviewData.reviewerId)
    );
    const updatedReviews = [...filtered, newReview];

    // 다면평가 평균점수 계산 (5점 만점 기준)
    const totalScore = updatedReviews.reduce(
      (sum, r) => sum + (Number(r.scoreCollaboration) + Number(r.scoreQuality)) / 2,
      0
    );
    const peerAvgScore =
      updatedReviews.length > 0 ? Number((totalScore / updatedReviews.length).toFixed(1)) : 0;

    // 무기명 보장을 위해 KPI의 최종 수정자(updatedBy)는 변경하지 않음
    const updated: KpiItem = {
      ...target,
      peerReviews: updatedReviews,
      peerAvgScore,
    };

    kpis[index] = updated;
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));
    this.pushExtendedKpisToRemote(kpis);

    return updated;
  }

  // [4단계-자가평가] 팀원 연간 자가평가 제출
  public static submitSelfEvaluation(id: string, selfEvaluation: string, selfScore?: number): KpiItem {
    return this.updateKpi(id, {
      selfEvaluation,
      selfScore: selfScore ?? 80,
      stage: 'leader_eval', // 1차 팀장 평가 단계로 전환
    });
  }

  // [4단계-1차평가] 팀 리더(1차) 평가 및 실장 상신
  public static submitLeaderEvaluation(
    id: string,
    data: { score: number; grade: KpiGrade; comment: string }
  ): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'director_eval', // 2차 실장 평가 단계로 상신
      leaderScore: data.score,
      leaderGrade: data.grade,
      leaderComment: data.comment,
      leaderEvaluatorName: currentUser.name,
      leaderEvaluatedAt: now,
    });
  }

  // [4단계-2차평가] 상위 실장(2차) 최종 평가 및 확정
  public static submitDirectorEvaluation(
    id: string,
    data: { score: number; grade: KpiGrade; comment: string }
  ): KpiItem {
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    return this.updateKpi(id, {
      stage: 'finalized', // 최종 평가 완료
      directorScore: data.score,
      directorGrade: data.grade,
      directorComment: data.comment,
      directorEvaluatorName: currentUser.name,
      directorEvaluatedAt: now,
      finalEvaluation: `[최종등급: ${data.grade} / 점수: ${data.score}점] ${data.comment}`,
      evaluatorName: `${currentUser.name} (실장)`,
      status: data.score >= 90 ? 'achieved' : data.score >= 70 ? 'partially_achieved' : 'missed',
    });
  }

  // 프로세스 단계 일괄/수동 전환 (관리자/팀장 편의용)
  public static advanceKpiStage(id: string, targetStage: KpiProcessStage): KpiItem {
    return this.updateKpi(id, { stage: targetStage });
  }

  public static deleteKpi(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 삭제할 수 없습니다.');
    }
    const kpis = this.getKpis();
    const target = kpis.find((k) => k.id === id);
    if (!target) return;

    const filtered = kpis.filter((k) => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(filtered));
    this.pushExtendedKpisToRemote(filtered);

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `KPI 삭제: ${target.title}`,
    });

    if (isSupabaseEnabled()) {
      const client = getSupabaseClient();
      client?.from('kpis').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase kpi delete note:', error.message);
      });
    }
  }

  // --- 4. 업무 관련 정보 (Work Info) CRUD & 클라우드 동기화 ---
  public static getWorkInfos(): WorkInfoItem[] {
    this.initialize();
    const items = safeJsonParse<WorkInfoItem[]>(
      localStorage.getItem(STORAGE_KEYS.WORK_INFOS),
      INITIAL_WORK_INFO_ITEMS
    );
    if (!Array.isArray(items) || items.length === 0) {
      return INITIAL_WORK_INFO_ITEMS;
    }
    return [...items].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  }

  private static async pushWorkInfosToRemote(items: WorkInfoItem[]): Promise<void> {
    if (!isSupabaseEnabled()) return;
    const client = getSupabaseClient();
    if (!client) return;

    const currentUser = this.getCurrentUser();
    try {
      await client.from('audit_logs').upsert({
        id: WORK_INFO_CLOUD_RECORD_ID,
        entity_type: 'auth',
        entity_id: 'sys-work-info',
        entity_title: 'WORK_INFO_STORE',
        action: 'UPDATE',
        actor_id: currentUser.id,
        actor_name: currentUser.name,
        actor_role: currentUser.role,
        timestamp: new Date().toISOString(),
        summary: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Supabase work_info sync note:', e);
    }
  }

  public static createWorkInfo(data: {
    category: string;
    title: string;
    content: string;
    note: string;
  }): WorkInfoItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 등록할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getWorkInfos();
    const maxOrder = items.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);

    const newItem: WorkInfoItem = {
      id: generateUniqueId('winfo'),
      category: data.category.trim() || '기본 사항',
      title: data.title.trim(),
      content: data.content,
      note: data.note.trim(),
      sortOrder: maxOrder + 1,
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updated = [...items, newItem];
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(updated));
    this.pushWorkInfosToRemote(updated);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: newItem.id,
      entityTitle: newItem.title,
      action: 'CREATE',
      summary: `[업무 관련 정보] 신규 등록: [${newItem.category}] ${newItem.title}`,
    });

    return newItem;
  }

  public static updateWorkInfo(
    id: string,
    updates: Partial<Pick<WorkInfoItem, 'category' | 'title' | 'content' | 'note' | 'sortOrder'>>
  ): WorkInfoItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 수정할 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const items = this.getWorkInfos();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('해당 업무 관련 정보 항목을 찾을 수 없습니다.');
    }

    const updatedItem: WorkInfoItem = {
      ...items[idx],
      ...updates,
      id: items[idx].id,
      createdBy: items[idx].createdBy,
      createdAt: items[idx].createdAt,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const updatedList = [...items];
    updatedList[idx] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(updatedList));
    this.pushWorkInfosToRemote(updatedList);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: updatedItem.id,
      entityTitle: updatedItem.title,
      action: 'UPDATE',
      summary: `[업무 관련 정보] 수정: [${updatedItem.category}] ${updatedItem.title}`,
    });

    return updatedItem;
  }

  public static deleteWorkInfo(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 정보를 삭제할 수 없습니다.');
    }

    const items = this.getWorkInfos();
    const target = items.find((item) => item.id === id);
    if (!target) return;

    const filtered = items.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.WORK_INFOS, JSON.stringify(filtered));
    this.pushWorkInfosToRemote(filtered);

    this.recordAuditLog({
      entityType: 'work_info',
      entityId: target.id,
      entityTitle: target.title,
      action: 'DELETE',
      summary: `[업무 관련 정보] 삭제: [${target.category}] ${target.title}`,
    });
  }

  // 데이터 전체 리셋 (테스트용)
  public static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.VACATIONS);
    localStorage.removeItem(STORAGE_KEYS.KPIS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.initialize();
  }
}
