import React, { useState, useRef, useEffect } from 'react';
import type { TaskAttachment } from '../../types';
import {
  PlanningStorageService,
  resolveAttachmentViewerUrl,
  resolveAttachmentDownloadUrl,
  isWebViewableAttachment,
  formatAttachmentSize,
  getAttachmentMeta,
} from '../../services/storage';
import { Paperclip, Upload, ExternalLink, Download, Trash2 } from 'lucide-react';

interface AttachmentRowListProps {
  attachments: TaskAttachment[];
  isViewer?: boolean;
  onRemove?: (target: TaskAttachment) => void;
  className?: string;
}

export const AttachmentRowList: React.FC<AttachmentRowListProps> = ({
  attachments,
  isViewer = false,
  onRemove,
  className = '',
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={`tasks-attachments-list ${className}`.trim()}>
      {attachments.map((att) => {
        const attMeta = getAttachmentMeta(att.ext || att.name?.split('.').pop());
        const isViewable = isWebViewableAttachment(att);
        const viewerUrl = resolveAttachmentViewerUrl(att);
        const dlUrl = resolveAttachmentDownloadUrl(att);

        return (
          <div key={att.id} className="tasks-attachment-row">
            <div className="tasks-attachment-info">
              <span className={`tasks-attachment-ext-badge ${attMeta.classKey}`}>
                {attMeta.badge}
              </span>
              <a
                href={viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="tasks-attachment-name is-clickable"
                title={
                  isViewable
                    ? `${att.name} — Google 읽기 전용 뷰어로 새 창에서 열기`
                    : `${att.name} 다운로드`
                }
              >
                {att.name}
              </a>
              <span className="tasks-attachment-size">
                ({formatAttachmentSize(att.size)})
              </span>
            </div>

            <div className="tasks-attachment-actions">
              {isViewable && (
                <a
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="btn btn-secondary tasks-attachment-view-btn"
                  title="Google 읽기 전용 뷰어로 새 창에서 열기"
                >
                  <ExternalLink size={14} /> 새창열기
                </a>
              )}
              <a
                href={dlUrl}
                download={att.name}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn btn-secondary tasks-attachment-dl-btn"
                title="원본 파일 다운로드"
              >
                <Download size={14} /> 다운로드
              </a>
              {!isViewer && onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(att);
                  }}
                  className="btn btn-secondary tasks-attachment-del-btn"
                  title="첨부 파일 삭제"
                  aria-label={`${att.name} 첨부 파일 삭제`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface AttachmentFieldProps {
  attachments: TaskAttachment[];
  isViewer: boolean;
  uploaderName: string;
  storageFolder?: 'tasks' | 'policies';
  label?: string;
  emptyHint?: string;
  onAttachmentsChange: (nextAttachments: TaskAttachment[]) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ACCEPTED_FILE_EXTENSIONS =
  '.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc,.pdf,.hwp,.hwpx,.zip,.png,.jpg,.jpeg,.webp';

export const AttachmentField: React.FC<AttachmentFieldProps> = ({
  attachments,
  isViewer,
  uploaderName,
  storageFolder = 'tasks',
  label = '첨부 파일 (MS Office Excel · PPT · Word · PDF)',
  emptyHint = '엑셀(.xlsx), 파워포인트(.pptx), 워드(.docx), PDF 등 파일을 끌어다 놓거나 클릭하여 첨부하세요.',
  onAttachmentsChange,
  onShowToast,
}) => {
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestAttachmentsRef = useRef<TaskAttachment[]>(attachments);

  useEffect(() => {
    latestAttachmentsRef.current = attachments;
  }, [attachments]);

  const notify = (msg: string, type: 'success' | 'error' | 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || isViewer) return;
    setIsUploadingFile(true);
    try {
      const uploadedItems: TaskAttachment[] = [];
      for (const file of Array.from(fileList)) {
        const item = await PlanningStorageService.uploadTaskAttachment(
          file,
          uploaderName,
          storageFolder
        );
        uploadedItems.push(item);
      }
      const nextAttachments = [...(latestAttachmentsRef.current || []), ...uploadedItems];
      latestAttachmentsRef.current = nextAttachments;
      onAttachmentsChange(nextAttachments);
      notify(
        `${uploadedItems.length}개의 첨부 파일(${uploadedItems.map((u) => u.name).join(', ')})이 업로드되었습니다.`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다.';
      notify(msg, 'error');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = async (target: TaskAttachment) => {
    if (isViewer) return;
    const nextAttachments = (latestAttachmentsRef.current || []).filter(
      (a) => a.id !== target.id
    );
    latestAttachmentsRef.current = nextAttachments;
    onAttachmentsChange(nextAttachments);
    await PlanningStorageService.removeTaskAttachmentFromStorage(target.storagePath);
    notify(`첨부 파일 "${target.name}"이(가) 삭제되었습니다.`, 'info');
  };

  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  return (
    <div className="form-group tasks-attachments-group">
      <div className="tasks-attachments-header">
        <label className="form-label tasks-attachments-label">
          <Paperclip size={15} />
          <span>{label}</span>
          {safeAttachments.length > 0 && (
            <span className="tasks-attachments-count">{safeAttachments.length}개</span>
          )}
        </label>

        {!isViewer && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_EXTENSIONS}
              onChange={(e) => handleFilesUpload(e.target.files)}
              className="tasks-file-input-hidden"
            />
            <button
              type="button"
              disabled={isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary tasks-upload-trigger-btn"
            >
              <Upload size={14} className={isUploadingFile ? 'spin-icon' : ''} />
              <span>{isUploadingFile ? '업로드 중...' : '파일 첨부'}</span>
            </button>
          </>
        )}
      </div>

      <div
        className={`tasks-attachments-dropzone ${isDragOver ? 'is-dragover' : ''} ${
          safeAttachments.length > 0 ? 'has-files' : ''
        }`}
        onDragOver={(e) => {
          if (isViewer) return;
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (isViewer) return;
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          if (isViewer) return;
          e.preventDefault();
          setIsDragOver(false);
          handleFilesUpload(e.dataTransfer.files);
        }}
      >
        {safeAttachments.length === 0 ? (
          <div
            className="tasks-attachments-empty"
            onClick={() => {
              if (!isViewer && !isUploadingFile) {
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload size={16} className="tasks-attachments-empty-icon" />
            <span>
              {isViewer
                ? '등록된 첨부 파일이 없습니다.'
                : isUploadingFile
                  ? '클라우드 스토리지에 파일을 업로드하고 있습니다...'
                  : emptyHint}
            </span>
          </div>
        ) : (
          <AttachmentRowList
            attachments={safeAttachments}
            isViewer={isViewer}
            onRemove={handleRemoveAttachment}
          />
        )}
      </div>
    </div>
  );
};
