import type {
  User,
  TaskItem,
  VacationItem,
  KpiItem,
  AuditLog,
  UserRole,
} from '../types';
import { getSupabaseClient, isSupabaseEnabled } from './supabase';

const STORAGE_KEYS = {
  USERS: 'ds_planning_users_v2',
  TASKS: 'ds_planning_tasks_clean_v1',
  VACATIONS: 'ds_planning_vacations_clean_v1',
  KPIS: 'ds_planning_kpis_clean_v1',
  AUDIT_LOGS: 'ds_planning_audit_logs_clean_v1',
  CURRENT_USER_ID: 'ds_planning_current_user_id_v2',
};

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
      // 0. users 동기화 (클라우드 회원 DB - 시퀀스 ID 및 표준 회원 구조)
      const { data: remoteUsers, error: userErr } = await client.from('users').select('*').order('id', { ascending: true });
      if (!userErr && remoteUsers && remoteUsers.length > 0) {
        const mappedUsers: User[] = remoteUsers.map((row) => ({
          id: String(row.id),
          name: row.name,
          password: row.password || '1234',
          role: row.role as UserRole,
          department: row.department,
          position: row.position || (row.role === 'admin' ? '팀장 / 수석기획자' : row.role === 'member' ? '서비스기획자' : '유관부서 담당자'),
          email: row.email || `${row.name.replace(/\s+/g, '').toLowerCase()}@company.com`,
          avatarColor: row.avatar_color || '#2563eb',
        }));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mappedUsers));
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
          figmaUrl: row.figma_url || undefined,
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
          ownerName: row.owner_name,
          title: row.title,
          targetMetric: row.target_metric,
          targetValue: row.target_value,
          currentValue: row.current_value || '',
          weight: Number(row.weight || 0),
          achievementRate: Number(row.achievement_rate || 0),
          status: row.status,
          selfEvaluation: row.self_evaluation || '',
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
        localKpis.forEach((k) => kpiMap.set(k.id, k));
        mappedRemoteKpis.forEach((r) => kpiMap.set(r.id, r));

        localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(Array.from(kpiMap.values())));
      }

      // 4. audit_logs 동기화
      const { data: remoteLogs, error: logErr } = await client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
      if (!logErr && remoteLogs && remoteLogs.length > 0) {
        const mappedLogs: AuditLog[] = remoteLogs.map((row) => ({
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

  public static isLoggedIn(): boolean {
    return localStorage.getItem('ds_planning_is_logged_in_v1') === 'true';
  }

  public static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const found = users.find((u) => u.id === currentId || u.name === '최범열');
    if (found) {
      if (currentId !== found.id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
      }
      return found;
    }
    if (users.length > 0) return users[0];
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
    const target = users.find((u) => u.id === userId);
    if (target) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      localStorage.setItem('ds_planning_is_logged_in_v1', 'true');
      this.recordAuditLog({
        entityType: 'auth',
        entityId: target.id,
        entityTitle: target.name,
        action: 'LOGIN',
        summary: `${target.name}(${target.role === 'viewer' ? '유관부서 뷰어' : '기획팀원'}) 계정으로 전환/로그인`,
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

    // 비밀번호가 설정되어 있는 경우 검증
    if (found.password && password && found.password !== password) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');

    this.recordAuditLog({
      entityType: 'auth',
      entityId: found.id,
      entityTitle: found.name,
      action: 'LOGIN',
      summary: `${found.name} (${found.department}) 포털 로그인 성공`,
    });

    return { success: true, user: found };
  }

  // 신규 회원가입 처리 (DB 자동 증가 시퀀스 PK 채번 및 표준 구조)
  public static async registerUser(params: {
    name: string;
    password: string;
    department: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    const users = this.getUsers();
    const trimmedName = params.name.trim();

    // 중복 체크
    if (users.some((u) => u.name.trim() === trimmedName)) {
      return { success: false, message: '이미 동일한 이름으로 등록된 사용자가 있습니다.' };
    }

    // 역할 자동 결정: 서비스기획팀이면 member, 그 외 유관부서는 viewer
    const isPlanTeam = params.department.includes('서비스기획') || params.department.includes('기획');
    const role: UserRole = isPlanTeam ? 'member' : 'viewer';

    const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // 기본 시퀀스 ID 계산 (로컬 오프라인 대비: 기존 최대 숫자 ID + 1)
    const existingNumericIds = users.map((u) => parseInt(u.id, 10)).filter((n) => !isNaN(n));
    let assignedId = String(existingNumericIds.length > 0 ? Math.max(...existingNumericIds) + 1 : users.length + 1);

    // Supabase DB 비동기 등록 (DB의 BIGINT IDENTITY 시퀀스 채번)
    if (isSupabaseEnabled()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client.from('users').insert({
            name: trimmedName,
            password: params.password,
            role,
            department: params.department,
            position: isPlanTeam ? '서비스기획자' : '유관부서 담당자',
            email: `${trimmedName.replace(/\s+/g, '').toLowerCase()}@company.com`,
            avatar_color: randomColor,
          }).select().single();

          if (error) {
            console.warn('Supabase user register note:', error.message);
          } else if (data?.id) {
            assignedId = String(data.id);
          }
        }
      } catch (err) {
        console.warn('Supabase insert skipped or failed:', err);
      }
    }

    const newUser: User = {
      id: assignedId,
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
    localStorage.setItem('ds_planning_is_logged_in_v1', 'true');

    this.recordAuditLog({
      entityType: 'auth',
      entityId: newUser.id,
      entityTitle: newUser.name,
      action: 'CREATE',
      summary: `신규 회원가입: ${newUser.name} (${newUser.department}, ${role === 'member' ? '기획팀원' : '유관부서 뷰어'}) [ID: ${newUser.id}]`,
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

  public static isViewer(): boolean {
    return this.getCurrentUser().role === 'viewer';
  }

  // --- 감사 로그 (Audit Logs) 기록 유틸리티 ---
  public static getAuditLogs(): AuditLog[] {
    this.initialize();
    const logs = safeJsonParse<AuditLog[]>(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS), []);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static recordAuditLog(params: {
    entityType: 'task' | 'vacation' | 'kpi' | 'auth';
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
    // track 필드 기본값 보정 (하위 호환 및 무오류 보장)
    return stored.map((t) => ({
      ...t,
      track: t.track || '기획',
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
      figma_url: task.figmaUrl || null,
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

  public static createTask(data: Omit<TaskItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
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
    });

    // Supabase DB 비동기 반영 (스마트 2단계 전송)
    this.pushTaskToRemote(newTask);

    return newTask;
  }

  public static updateTask(taskId: string, changes: Partial<TaskItem>): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 수정할 수 없습니다.');
    }
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error('수정할 업무 항목을 찾을 수 없습니다.');
    }

    const currentUser = this.getCurrentUser();
    const original = tasks[index];
    const now = new Date().toISOString();

    const updatedTask: TaskItem = {
      ...original,
      ...changes,
      track: changes.track || original.track || '기획',
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

  // --- 3. KPI 관리 CRUD ---
  public static getKpis(): KpiItem[] {
    this.initialize();
    return safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), []);
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
      createdBy: currentUser.name,
      createdAt: now,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    const kpis = this.getKpis();
    const updated = [newKpi, ...kpis];
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(updated));

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: newKpi.id,
      entityTitle: newKpi.title,
      action: 'CREATE',
      summary: `KPI 목표 등록: [${newKpi.quarter}] ${newKpi.title} (가중치: ${newKpi.weight}%)`,
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
    const updated: KpiItem = {
      ...kpis[index],
      ...changes,
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    kpis[index] = updated;
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(kpis));

    this.recordAuditLog({
      entityType: 'kpi',
      entityId: updated.id,
      entityTitle: updated.title,
      action: 'UPDATE',
      summary: `KPI 갱신/평가: ${updated.title} (달성률: ${updated.achievementRate}%, 상태: ${updated.status})`,
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

  public static deleteKpi(id: string): void {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 KPI를 삭제할 수 없습니다.');
    }
    const kpis = this.getKpis();
    const target = kpis.find((k) => k.id === id);
    if (!target) return;

    const filtered = kpis.filter((k) => k.id !== id);
    localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(filtered));

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

  // 데이터 전체 리셋 (테스트용)
  public static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.VACATIONS);
    localStorage.removeItem(STORAGE_KEYS.KPIS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.initialize();
  }
}
