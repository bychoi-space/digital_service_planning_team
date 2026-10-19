import type {
  User,
  TaskItem,
  VacationItem,
  KpiItem,
  AuditLog,
  UserRole,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_TASKS,
  INITIAL_VACATIONS,
  INITIAL_KPIS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const STORAGE_KEYS = {
  USERS: 'ds_planning_users_v1',
  TASKS: 'ds_planning_tasks_v1',
  VACATIONS: 'ds_planning_vacations_v1',
  KPIS: 'ds_planning_kpis_v1',
  AUDIT_LOGS: 'ds_planning_audit_logs_v1',
  CURRENT_USER_ID: 'ds_planning_current_user_id_v1',
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
  // 1. 초기 시드 데이터 검증 및 초기화
  public static initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VACATIONS)) {
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(INITIAL_VACATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.KPIS)) {
      localStorage.setItem(STORAGE_KEYS.KPIS, JSON.stringify(INITIAL_KPIS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
    }
  }

  // --- 사용자 및 인증 관리 ---
  public static getUsers(): User[] {
    this.initialize();
    return safeJsonParse<User[]>(localStorage.getItem(STORAGE_KEYS.USERS), INITIAL_USERS);
  }

  public static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || users[0]?.id;
    const found = users.find((u) => u.id === currentId);
    return found || users[0] || INITIAL_USERS[0];
  }

  public static setCurrentUser(userId: string): User {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (target) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
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

  public static isViewer(): boolean {
    return this.getCurrentUser().role === 'viewer';
  }

  // --- 감사 로그 (Audit Logs) 기록 유틸리티 ---
  public static getAuditLogs(): AuditLog[] {
    this.initialize();
    const logs = safeJsonParse<AuditLog[]>(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS), INITIAL_AUDIT_LOGS);
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
    const updated = [newLog, ...logs].slice(0, 200); // 최근 200건 보존
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
  }

  // --- 1. 업무 관리 (Task) CRUD ---
  public static getTasks(): TaskItem[] {
    this.initialize();
    return safeJsonParse<TaskItem[]>(localStorage.getItem(STORAGE_KEYS.TASKS), INITIAL_TASKS);
  }

  public static createTask(data: Omit<TaskItem, 'id' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>): TaskItem {
    if (this.isViewer()) {
      throw new Error('유관부서(읽기 전용) 모드에서는 업무를 등록할 수 없습니다.');
    }
    const currentUser = this.getCurrentUser();
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...data,
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
      summary: `새 업무 등록: [${newTask.category}] ${newTask.title} (담당: ${newTask.assigneeName})`,
    });

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
      updatedBy: currentUser.name,
      updatedAt: now,
    };

    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // 변경 요약 메시지 생성
    const changeNotes: string[] = [];
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
  }

  // --- 2. 휴가 관리 (Vacation) CRUD ---
  public static getVacations(): VacationItem[] {
    this.initialize();
    return safeJsonParse<VacationItem[]>(localStorage.getItem(STORAGE_KEYS.VACATIONS), INITIAL_VACATIONS);
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
  }

  // --- 3. KPI 관리 CRUD ---
  public static getKpis(): KpiItem[] {
    this.initialize();
    return safeJsonParse<KpiItem[]>(localStorage.getItem(STORAGE_KEYS.KPIS), INITIAL_KPIS);
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
