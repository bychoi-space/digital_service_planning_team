import React, { useState } from 'react';
import type {
  TaskAttachment,
  TaskCategory,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskTrack,
  User,
} from '../../types';
import {
  PlanningStorageService,
  computeTaskStatusByDates,
  getTodayDateString,
} from '../../services/storage';
import { AttachmentField } from './AttachmentField';
import {
  CheckCircle2,
  Code,
  ExternalLink,
  FileText,
  Palette,
  X,
} from 'lucide-react';

interface TaskQuickDetailModalProps {
  task: TaskItem;
  currentUser: User;
  isViewer: boolean;
  onClose: () => void;
  onTaskSaved?: (updated: TaskItem) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const TRACK_CONFIG: Record<
  TaskTrack,
  {
    label: string;
    enLabel: string;
    classKey: string;
    icon: React.FC<{ size?: number; className?: string }>;
  }
> = {
  기획: { label: '기획', enLabel: 'Planning', classKey: 'track-planning', icon: FileText },
  디자인: { label: '디자인', enLabel: 'Design', classKey: 'track-design', icon: Palette },
  퍼블리싱: { label: '퍼블리싱', enLabel: 'Publishing', classKey: 'track-publishing', icon: Code },
};

const TRACK_LIST: TaskTrack[] = ['기획', '디자인', '퍼블리싱'];

const CATEGORIES: TaskCategory[] = [
  '신규기획',
  '기능개선',
  '서비스운영',
  '데이터분석',
  '협업지원',
  '정책수립',
  '기획전',
];

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'urgent', label: '긴급' },
  { key: 'high', label: '높음' },
  { key: 'medium', label: '보통' },
  { key: 'low', label: '낮음' },
];

const STATUSES: { key: TaskStatus; label: string; classKey: string }[] = [
  { key: 'backlog', label: '대기', classKey: 'status-backlog' },
  { key: 'in_progress', label: '진행중', classKey: 'status-in_progress' },
  { key: 'done', label: '완료', classKey: 'status-done' },
];

function resolvePlanningLinkUrl(task: TaskItem): string {
  if (task.artifactUrl && !task.artifactUrl.includes('figma.com')) {
    return task.artifactUrl;
  }
  const nonFigmaLink = task.links?.find((l) => l.url && !l.url.includes('figma.com'));
  return nonFigmaLink?.url || '';
}

function resolveWorkspaceProjectId(task: TaskItem, linkUrl: string): string | null {
  const match = linkUrl.trim().match(/[?&]project=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (task.workspaceProjectId) return task.workspaceProjectId;
  return null;
}

function resolveWorkspaceViewerUrl(task: TaskItem, linkUrl: string): string | null {
  const wpId = resolveWorkspaceProjectId(task, linkUrl);
  if (!wpId) return null;
  return `https://bychoi-space.github.io/workspace/viewer.html?project=${wpId}`;
}

function resolveFigmaUrl(task: TaskItem, figmaInput?: string): string | null {
  if (figmaInput !== undefined) {
    const trimmed = figmaInput.trim();
    return trimmed ? trimmed : null;
  }
  if (task.figmaUrl && task.figmaUrl.trim()) return task.figmaUrl.trim();
  const figmaFromLinks = task.links?.find((l) => l.url && l.url.includes('figma.com'))?.url;
  if (figmaFromLinks) return figmaFromLinks;
  if (task.artifactUrl && task.artifactUrl.includes('figma.com')) return task.artifactUrl;
  return null;
}

function resolveFigmaMetaLabel(figmaUrl: string): string {
  let fileLabel = 'Figma 디자인 시안';
  if (figmaUrl.includes('l9Zw8nYYaKBs1mmAqxx5ZF')) {
    fileLabel = '100. 운영';
  } else if (figmaUrl.includes('5tx1QKw7gAPwrJy4DlC3FD')) {
    fileLabel = '01. 상품';
  }
  const nodeMatch = figmaUrl.match(/[?&]node-id=([0-9]+-[0-9]+)/);
  return nodeMatch ? `${fileLabel} · 노드 #${nodeMatch[1]}` : fileLabel;
}

export const TaskQuickDetailModal: React.FC<TaskQuickDetailModalProps> = ({
  task,
  currentUser,
  isViewer,
  onClose,
  onTaskSaved,
  onShowToast,
}) => {
  const [teamMembers] = useState<User[]>(() =>
    PlanningStorageService.getServicePlanningMembers()
  );

  const [formData, setFormData] = useState(() => {
    const matchedAssignee = teamMembers.find(
      (m) =>
        String(m.id) === String(task.assigneeId) ||
        m.name.trim() === task.assigneeName?.trim()
    );
    const isAlreadyNotionLinked =
      String(task.id).startsWith('notion-') || Boolean(task.notionUrl);

    return {
      title: task.title,
      category: task.category,
      track: (task.track || '기획') as TaskTrack,
      assigneeId: matchedAssignee ? matchedAssignee.id : task.assigneeId,
      assigneeName: matchedAssignee ? matchedAssignee.name : task.assigneeName,
      priority: task.priority,
      startDate: task.startDate || '',
      dueDate: task.dueDate || '',
      description: task.description || '',
      linkUrl: resolvePlanningLinkUrl(task),
      figmaUrl: resolveFigmaUrl(task) || '',
      attachments: Array.isArray(task.attachments) ? task.attachments : ([] as TaskAttachment[]),
      syncToNotion: isAlreadyNotionLinked,
    };
  });

  const handleAttachmentsChange = (nextAttachments: TaskAttachment[]) => {
    setFormData((prev) => ({
      ...prev,
      attachments: nextAttachments,
    }));
    if (!isViewer) {
      const updated = PlanningStorageService.updateTask(
        task.id,
        { attachments: nextAttachments },
        currentUser,
        { syncToNotion: false }
      );
      onTaskSaved?.(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      onClose();
      return;
    }
    if (!formData.title.trim()) {
      onShowToast?.('업무 제목을 입력해 주세요.', 'error');
      return;
    }
    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      onShowToast?.('마감일은 시작일보다 이전일 수 없습니다.', 'error');
      return;
    }

    const autoStatus = computeTaskStatusByDates(
      formData.startDate,
      formData.dueDate,
      getTodayDateString(),
      task.status
    );
    const trimmedUrl = formData.linkUrl.trim();
    const trimmedFigma = formData.figmaUrl.trim();
    const normalizedLinks: { title: string; url: string }[] = [];
    if (trimmedUrl) {
      normalizedLinks.push({
        title: trimmedUrl.includes('workspace') ? '기획서 뷰어' : '산출물 링크',
        url: trimmedUrl,
      });
    }
    if (trimmedFigma) {
      normalizedLinks.push({
        title: 'Figma 디자인 시안',
        url: trimmedFigma,
      });
    }

    try {
      const updated = PlanningStorageService.updateTask(
        task.id,
        {
          title: formData.title.trim(),
          category: formData.category,
          track: formData.track,
          assigneeId: formData.assigneeId,
          assigneeName: formData.assigneeName,
          priority: formData.priority,
          status: autoStatus,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          description: formData.description,
          artifactUrl: trimmedUrl || undefined,
          figmaUrl: trimmedFigma || undefined,
          links: normalizedLinks,
          attachments: formData.attachments,
        },
        currentUser,
        { syncToNotion: formData.syncToNotion }
      );
      onTaskSaved?.(updated);
      onShowToast?.(`[${formData.track}] 업무 정보가 수정되었습니다.`, 'success');
      onClose();
    } catch (err) {
      onShowToast?.(
        err instanceof Error ? err.message : '업무 수정 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  const autoStatus = computeTaskStatusByDates(
    formData.startDate,
    formData.dueDate,
    getTodayDateString(),
    task.status
  );
  const autoStatusCfg = STATUSES.find((s) => s.key === autoStatus) || STATUSES[1];
  const activeWpId = resolveWorkspaceProjectId(task, formData.linkUrl);
  const activeWpViewerUrl = resolveWorkspaceViewerUrl(task, formData.linkUrl);
  const activeFigmaUrl = resolveFigmaUrl(task, formData.figmaUrl);
  const isNotionLinked =
    Boolean(task.notionUrl) || String(task.id).startsWith('notion-');

  const visibleCardsCount = (activeWpId ? 1 : 0) + (activeFigmaUrl ? 1 : 0) + 1;
  const gridColClass =
    visibleCardsCount === 3
      ? 'is-three-col'
      : visibleCardsCount === 2
        ? 'is-two-col'
        : 'is-single-col';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box tasks-detail-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="tasks-modal-header-left">
            <h3 className="modal-title">업무 상세</h3>
            {isViewer && <span className="tasks-viewer-chip">조회 전용</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tasks-modal-close-btn"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="tasks-modal-form">
          <div className="modal-body">
            <div className="form-group tasks-modal-track-group">
              <label className="form-label">업무 파트 구분 *</label>
              <div className="tasks-modal-track-grid">
                {TRACK_LIST.map((trackKey) => {
                  const config = TRACK_CONFIG[trackKey];
                  const isSelected = formData.track === trackKey;
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={trackKey}
                      type="button"
                      disabled={isViewer}
                      onClick={() => setFormData({ ...formData, track: trackKey })}
                      className={`tasks-modal-track-btn ${config.classKey} ${
                        isSelected ? 'active' : ''
                      }`}
                    >
                      <div className="tasks-modal-track-info">
                        <div className="tasks-modal-track-icon-box">
                          <IconComponent size={16} />
                        </div>
                        <div className="tasks-modal-track-text">
                          <div className="tasks-modal-track-name">{config.label}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={16} className="tasks-modal-track-check" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">업무명 *</label>
              <input
                type="text"
                disabled={isViewer}
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="tasks-form-grid-3">
              <div className="form-group">
                <label className="form-label">카테고리</label>
                <select
                  disabled={isViewer}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as TaskCategory })
                  }
                  className="form-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">담당자</label>
                <select
                  disabled={isViewer}
                  value={formData.assigneeId}
                  onChange={(e) => {
                    const targetUser = teamMembers.find(
                      (m) => String(m.id) === String(e.target.value)
                    );
                    setFormData({
                      ...formData,
                      assigneeId: e.target.value,
                      assigneeName: targetUser ? targetUser.name : formData.assigneeName,
                    });
                  }}
                  className="form-select"
                >
                  {!teamMembers.some((m) => String(m.id) === String(formData.assigneeId)) &&
                    formData.assigneeName && (
                      <option value={formData.assigneeId}>{formData.assigneeName}</option>
                    )}
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">우선순위</label>
                <select
                  disabled={isViewer}
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as TaskPriority })
                  }
                  className="form-select"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tasks-form-grid-3">
              <div className="form-group">
                <label className="form-label">시작일</label>
                <input
                  type="date"
                  disabled={isViewer}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">마감일</label>
                <input
                  type="date"
                  disabled={isViewer}
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">진행 상태</label>
                <div className={`tasks-auto-status-box ${autoStatusCfg.classKey}`}>
                  <span className="tasks-auto-status-main">
                    <span className={`tasks-status-dot ${autoStatusCfg.classKey}`} />
                    <span>{autoStatusCfg.label}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">상세 기획 내용 및 요구사항</label>
              <textarea
                disabled={isViewer}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="등록된 상세 내용이 없습니다."
                className="form-textarea"
              />
            </div>

            <div className="tasks-form-grid-2">
              <div className="form-group">
                <label className="form-label">기획서 / 산출물 링크 (Workspace)</label>
                <div className="tasks-single-link-row">
                  <input
                    type="url"
                    disabled={isViewer}
                    placeholder="https://bychoi-space.github.io/workspace/viewer.html?project=..."
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="form-input tasks-single-link-input"
                  />
                  {formData.linkUrl.trim() && !activeWpId && (
                    <a
                      href={formData.linkUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary tasks-single-link-open-btn"
                    >
                      <ExternalLink size={15} /> 열기
                    </a>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">디자인 시안 링크 (Figma)</label>
                <div className="tasks-single-link-row">
                  <input
                    type="url"
                    disabled={isViewer}
                    placeholder="https://www.figma.com/design/..."
                    value={formData.figmaUrl}
                    onChange={(e) => setFormData({ ...formData, figmaUrl: e.target.value })}
                    className="form-input tasks-single-link-input"
                  />
                </div>
              </div>
            </div>

            <AttachmentField
              attachments={formData.attachments}
              isViewer={isViewer}
              uploaderName={currentUser.name || '시스템'}
              storageFolder="tasks"
              onAttachmentsChange={handleAttachmentsChange}
              onShowToast={onShowToast}
            />

            <div className={`tasks-integrations-grid ${gridColClass}`}>
              {activeWpId && activeWpViewerUrl && (
                <div className="tasks-integration-card is-workspace">
                  <div className="tasks-integration-card-top">
                    <span className="tasks-badge-workspace">
                      기획서 v{task.version || '0.1'}
                    </span>
                    <span className="tasks-integration-meta">
                      워크스페이스 ({activeWpId})
                      {task.period ? ` · ${task.period}` : ''}
                    </span>
                  </div>
                  <div className="tasks-integration-card-actions">
                    <a
                      href={activeWpViewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary tasks-single-link-open-btn"
                    >
                      <ExternalLink size={14} /> 기획서 뷰어
                    </a>
                    <a
                      href="https://bychoi-space.github.io/workspace/index.html"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary tasks-single-link-open-btn"
                    >
                      <ExternalLink size={14} /> 워크스페이스
                    </a>
                  </div>
                </div>
              )}

              {activeFigmaUrl && (
                <div className="tasks-integration-card is-figma">
                  <div className="tasks-integration-card-top">
                    <span className="tasks-badge-figma">Figma 시안</span>
                    <span className="tasks-integration-meta">
                      {resolveFigmaMetaLabel(activeFigmaUrl)}
                    </span>
                  </div>
                  <div className="tasks-integration-card-actions">
                    <a
                      href={activeFigmaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary tasks-single-link-open-btn"
                    >
                      <ExternalLink size={14} /> Figma 시안 열기
                    </a>
                  </div>
                </div>
              )}

              <div className="tasks-integration-card is-notion">
                {isNotionLinked ? (
                  <>
                    <div className="tasks-integration-card-top">
                      <span className="tasks-badge-notion">Notion 연동</span>
                      <span className="tasks-integration-meta">
                        Sisun-Tasks 양방향 동기화 적용됨
                      </span>
                    </div>
                    {task.notionUrl && (
                      <div className="tasks-integration-card-actions">
                        <a
                          href={task.notionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary tasks-single-link-open-btn"
                        >
                          <ExternalLink size={14} /> Notion 열기
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <label className="tasks-notion-checkbox-label">
                    <input
                      type="checkbox"
                      disabled={isViewer}
                      checked={formData.syncToNotion}
                      onChange={(e) =>
                        setFormData({ ...formData, syncToNotion: e.target.checked })
                      }
                      className="tasks-notion-checkbox"
                    />
                    <span>
                      저장 시 Notion (Sisun-Tasks)에 과제를 동시 생성하고 양방향 동기화 연결
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="tasks-audit-bar">
              <span>
                최초 등록: {task.createdBy} ({new Date(task.createdAt).toLocaleDateString()})
              </span>
              <span>
                최종 수정: {task.updatedBy} ({new Date(task.updatedAt).toLocaleTimeString()})
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              닫기
            </button>
            {!isViewer && (
              <button type="submit" className="btn btn-primary">
                변경사항 저장
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
