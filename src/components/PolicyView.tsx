import React, { useState, useMemo } from 'react';
import type { User, PolicyDomain, PolicyRuleRow, SisunPolicyItem } from '../types';
import { PlanningStorageService, generateUniqueId } from '../services/storage';
import {
  Package,
  Users,
  ShoppingBag,
  LayoutGrid,
  RefreshCcw,
  Search,
  Globe,
  ExternalLink,
  FileText,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';

interface PolicyViewProps {
  currentUser: User;
  isViewer: boolean;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface DomainMeta {
  key: PolicyDomain;
  label: string;
  enLabel: string;
  desc: string;
  codePrefix: string;
}

const DOMAIN_META_LIST: DomainMeta[] = [
  {
    key: 'product',
    label: '상품',
    enLabel: 'Product',
    desc: '상품 코드 체계 · 상품 상세(PDP) UI/공지 · 물류/매장 이원화 재고 및 출고 리드타임',
    codePrefix: 'POL-PRD',
  },
  {
    key: 'member',
    label: '회원',
    enLabel: 'Member',
    desc: '신규 가입/APP 첫 로그인 혜택 · 6단계 멤버십 등급 산정 기준 · 쿠폰/마일리지 중복 제한 및 소멸',
    codePrefix: 'POL-MEM',
  },
  {
    key: 'order',
    label: '주문',
    enLabel: 'Order',
    desc: '전 상품 무료배송(CJ대한통운) · 복수 상품 개별 선출고 · 단계별 배송지 변경 조건 · 결제/제휴 프로모션',
    codePrefix: 'POL-ORD',
  },
  {
    key: 'display',
    label: '전시',
    enLabel: 'Display',
    desc: '통합몰/브랜드관(E.B.M · MICHAA · IT MICHAA) · 표준 카테고리 · 기획전 배너 슬롯/정렬 · LIVE 연동',
    codePrefix: 'POL-DSP',
  },
  {
    key: 'claim',
    label: '클레임',
    enLabel: 'Claim',
    desc: '배송완료 7일 이내 반품/교환 · 7일 경과 자동 구매확정 · 왕복배송비(5,000원) 및 합포장 1건 차감 · 수선(AS)',
    codePrefix: 'POL-CLM',
  },
  {
    key: 'search',
    label: '검색',
    enLabel: 'Search',
    desc: '브랜드 범위 통합 검색 레이어 · 최근/추천(#해시태그)/인기 검색어 · 검색 결과 상세 필터 및 정렬',
    codePrefix: 'POL-SRC',
  },
  {
    key: 'common',
    label: '공통',
    enLabel: 'Common',
    desc: '상단 헤더(GNB) 유틸리티 · 다국어 전환(한/영/중) · APP 다운로드 SMS 일 5회 제한/번호 미저장 · 고객센터',
    codePrefix: 'POL-CMN',
  },
];

const DOMAIN_MAP: Record<PolicyDomain, DomainMeta> = {
  product: DOMAIN_META_LIST[0],
  member: DOMAIN_META_LIST[1],
  order: DOMAIN_META_LIST[2],
  display: DOMAIN_META_LIST[3],
  claim: DOMAIN_META_LIST[4],
  search: DOMAIN_META_LIST[5],
  common: DOMAIN_META_LIST[6],
};

function renderDomainIcon(domain: PolicyDomain, size = 16) {
  switch (domain) {
    case 'product':
      return <Package size={size} />;
    case 'member':
      return <Users size={size} />;
    case 'order':
      return <ShoppingBag size={size} />;
    case 'display':
      return <LayoutGrid size={size} />;
    case 'claim':
      return <RefreshCcw size={size} />;
    case 'search':
      return <Search size={size} />;
    case 'common':
      return <Globe size={size} />;
  }
}

export const PolicyView: React.FC<PolicyViewProps> = ({
  isViewer,
  onShowToast,
}) => {
  const [items, setItems] = useState<SisunPolicyItem[]>(() =>
    PlanningStorageService.getPolicies()
  );
  // 도메인 단위 전용 TAB 상태 (기본값: 'product' 상품 도메인)
  const [activeDomain, setActiveDomain] = useState<PolicyDomain>('product');
  // 도메인 내 세부 중분류 퀵 필터 ('all' 또는 subCategory)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SisunPolicyItem | null>(null);

  // 폼 입력 상태
  const [formDomain, setFormDomain] = useState<PolicyDomain>('product');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formWorkspaceUrl, setFormWorkspaceUrl] = useState('');
  const [formRules, setFormRules] = useState<PolicyRuleRow[]>([]);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  // 도메인별 정책 건수 집계 (검색어 입력 시 검색 매칭 건수 기준)
  const domainCounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const counts: Record<PolicyDomain, number> = {
      product: 0,
      member: 0,
      order: 0,
      display: 0,
      claim: 0,
      search: 0,
      common: 0,
    };
    items.forEach((item) => {
      if (counts[item.domain] === undefined) return;
      if (!q) {
        counts[item.domain] += 1;
        return;
      }
      const matched =
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.rules.some(
          (r) =>
            r.classification.toLowerCase().includes(q) ||
            r.ruleDetail.toLowerCase().includes(q) ||
            (r.exceptionNote || '').toLowerCase().includes(q)
        );
      if (matched) {
        counts[item.domain] += 1;
      }
    });
    return counts;
  }, [items, searchQuery]);

  // 현재 선택된 도메인 탭의 전체 정책 목록
  const currentDomainItems = useMemo(
    () => items.filter((item) => item.domain === activeDomain),
    [items, activeDomain]
  );

  // 현재 도메인 내 중분류(subCategory) 목차 리스트
  const subCategories = useMemo(() => {
    const set = new Set<string>();
    currentDomainItems.forEach((item) => {
      if (item.subCategory?.trim()) {
        set.add(item.subCategory.trim());
      }
    });
    return Array.from(set);
  }, [currentDomainItems]);

  // 현재 탭 + 중분류 + 검색어가 적용된 정책 리스트
  const visiblePolicies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return currentDomainItems.filter((item) => {
      if (
        selectedSubCategory !== 'all' &&
        item.subCategory.trim() !== selectedSubCategory
      ) {
        return false;
      }
      if (!q) return true;

      const inHeader =
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      if (inHeader) return true;

      return item.rules.some(
        (r) =>
          r.classification.toLowerCase().includes(q) ||
          r.ruleDetail.toLowerCase().includes(q) ||
          (r.exceptionNote || '').toLowerCase().includes(q)
      );
    });
  }, [currentDomainItems, selectedSubCategory, searchQuery]);

  // 도메인 탭 전환 핸들러
  const handleSelectDomainTab = (domain: PolicyDomain) => {
    setActiveDomain(domain);
    setSelectedSubCategory('all');
  };

  // 신규 정책 모달 열기
  const handleOpenCreateModal = () => {
    if (isViewer) return;
    const domainList = items.filter((i) => i.domain === activeDomain);
    const nextCode = `${DOMAIN_MAP[activeDomain].codePrefix}-${String(
      domainList.length + 1
    ).padStart(3, '0')}`;

    setEditingItem(null);
    setFormDomain(activeDomain);
    setFormSubCategory(selectedSubCategory !== 'all' ? selectedSubCategory : '');
    setFormCode(nextCode);
    setFormTitle('');
    setFormSummary('');
    setFormWorkspaceUrl('');
    setFormRules([
      {
        id: generateUniqueId('rule'),
        classification: '',
        ruleDetail: '',
        exceptionNote: '',
      },
    ]);
    setIsModalOpen(true);
  };

  // 기존 정책 수정 모달 열기
  const handleOpenEditModal = (item: SisunPolicyItem) => {
    if (isViewer) return;
    setEditingItem(item);
    setFormDomain(item.domain);
    setFormSubCategory(item.subCategory);
    setFormCode(item.code);
    setFormTitle(item.title);
    setFormSummary(item.summary);
    setFormWorkspaceUrl(item.workspaceUrl || '');
    setFormRules(
      item.rules.length > 0
        ? item.rules.map((r) => ({ ...r }))
        : [
            {
              id: generateUniqueId('rule'),
              classification: '',
              ruleDetail: '',
              exceptionNote: '',
            },
          ]
    );
    setIsModalOpen(true);
  };

  // 도메인 변경 시 신규 등록 모드면 정책 코드 프리픽스 자동 갱신
  const handleFormDomainChange = (nextDomain: PolicyDomain) => {
    setFormDomain(nextDomain);
    if (!editingItem) {
      const domainList = items.filter((i) => i.domain === nextDomain);
      setFormCode(
        `${DOMAIN_MAP[nextDomain].codePrefix}-${String(domainList.length + 1).padStart(
          3,
          '0'
        )}`
      );
    }
  };

  // 세부 규칙 행 추가/수정/삭제
  const handleAddRuleRow = () => {
    setFormRules((prev) => [
      ...prev,
      {
        id: generateUniqueId('rule'),
        classification: '',
        ruleDetail: '',
        exceptionNote: '',
      },
    ]);
  };

  const handleUpdateRuleRow = (
    ruleId: string,
    field: keyof Omit<PolicyRuleRow, 'id'>,
    value: string
  ) => {
    setFormRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveRuleRow = (ruleId: string) => {
    setFormRules((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== ruleId);
    });
  };

  // 저장 처리
  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!formTitle.trim()) {
      notify('정책명을 입력해 주세요.', 'error');
      return;
    }
    if (!formSummary.trim()) {
      notify('핵심 정책 요약을 입력해 주세요.', 'error');
      return;
    }

    const cleanedRules = formRules
      .map((r) => ({
        id: r.id || generateUniqueId('rule'),
        classification: r.classification.trim(),
        ruleDetail: r.ruleDetail.trim(),
        exceptionNote: r.exceptionNote?.trim() || undefined,
      }))
      .filter((r) => r.classification || r.ruleDetail);

    try {
      if (editingItem) {
        PlanningStorageService.updatePolicyItem(editingItem.id, {
          domain: formDomain,
          subCategory: formSubCategory.trim() || '기본 정책',
          code: formCode.trim(),
          title: formTitle.trim(),
          summary: formSummary.trim(),
          description: '',
          rules: cleanedRules,
          workspaceUrl: formWorkspaceUrl.trim() || undefined,
        });
        notify(`정책 [${formTitle.trim()}] 항목이 수정되었습니다.`, 'success');
      } else {
        PlanningStorageService.createPolicyItem({
          domain: formDomain,
          subCategory: formSubCategory.trim() || '기본 정책',
          code: formCode.trim(),
          title: formTitle.trim(),
          summary: formSummary.trim(),
          description: '',
          rules: cleanedRules,
          workspaceUrl: formWorkspaceUrl.trim() || undefined,
        });
        notify(`신규 정책 [${formTitle.trim()}] 항목이 등록되었습니다.`, 'success');
      }

      setItems(PlanningStorageService.getPolicies());
      setActiveDomain(formDomain);
      setIsModalOpen(false);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : '정책 저장 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  // 삭제 처리
  const handleDeletePolicy = (item: SisunPolicyItem) => {
    if (isViewer) return;
    if (
      !window.confirm(
        `정말 [${item.code}] '${item.title}' 정책을 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      PlanningStorageService.deletePolicyItem(item.id);
      setItems(PlanningStorageService.getPolicies());
      notify(`정책 [${item.title}] 항목이 삭제되었습니다.`, 'info');
    } catch (err) {
      notify(
        err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  // 순서 이동 처리
  const handleMovePolicy = (id: string, direction: 'up' | 'down') => {
    if (isViewer) return;
    try {
      const updated = PlanningStorageService.movePolicyItem(id, direction);
      setItems(updated);
    } catch (err) {
      notify(
        err instanceof Error ? err.message : '순서 변경 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  const currentMeta = DOMAIN_MAP[activeDomain];

  return (
    <div className="policy-view-container">
      {/* 1. 상단 7대 도메인 전용 TAB 네비게이션 & 검색/액션 바 */}
      <div className="card policy-control-card">
        <div className="policy-top-tabs-row">
          <div
            className="policy-domain-tabs"
            role="tablist"
            aria-label="시선닷컴 도메인 탭"
          >
            {DOMAIN_META_LIST.map((dom) => (
              <button
                key={dom.key}
                type="button"
                role="tab"
                aria-selected={activeDomain === dom.key}
                className={`policy-domain-tab ${
                  activeDomain === dom.key ? 'active' : ''
                }`}
                onClick={() => handleSelectDomainTab(dom.key)}
              >
                {renderDomainIcon(dom.key, 16)}
                <span>{dom.label}</span>
                <span className="policy-domain-tab-count">
                  {domainCounts[dom.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="policy-search-and-action">
            <div className="policy-search-input-wrap">
              <Search size={16} className="policy-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${currentMeta.label} 정책 내 키워드 검색...`}
                className="form-input policy-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="policy-search-clear-btn"
                  aria-label="검색어 지우기"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <a
              href="https://sisun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary policy-external-btn"
            >
              <ExternalLink size={15} /> 시선닷컴
            </a>

            {!isViewer && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="btn btn-primary policy-add-main-btn"
              >
                <Plus size={16} /> {currentMeta.label} 정책 등록
              </button>
            )}
          </div>
        </div>

        {/* 현재 선택된 도메인 헤더 요약 & 세부 영역(중분류) 퀵 탭 */}
        <div className="policy-active-domain-bar">
          <div className="policy-active-domain-info">
            <span className={`policy-domain-pill is-${currentMeta.key}`}>
              {currentMeta.label} ({currentMeta.enLabel})
            </span>
            <span className="policy-active-domain-desc">{currentMeta.desc}</span>
          </div>

          {subCategories.length > 1 && (
            <div className="policy-subcat-chips">
              <button
                type="button"
                className={`policy-subcat-chip ${
                  selectedSubCategory === 'all' ? 'active' : ''
                }`}
                onClick={() => setSelectedSubCategory('all')}
              >
                전체 ({currentDomainItems.length})
              </button>
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  className={`policy-subcat-chip ${
                    selectedSubCategory === sub ? 'active' : ''
                  }`}
                  onClick={() => setSelectedSubCategory(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 선택된 도메인 탭의 정책 목록 */}
      {visiblePolicies.length === 0 ? (
        <div className="card policy-empty-card">
          <p className="policy-empty-text">
            {searchQuery
              ? `'${currentMeta.label}' 도메인 내 '${searchQuery}' 검색 결과가 없습니다.`
              : `등록된 '${currentMeta.label}' 도메인 정책이 없습니다.`}
          </p>
          {(searchQuery || selectedSubCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubCategory('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="policy-cards-list">
          {visiblePolicies.map((item, idx) => (
            <article key={item.id} className="card policy-item-card">
              <div className="policy-item-header">
                <div className="policy-item-title-block">
                  <div className="policy-item-meta-top">
                    <span className="policy-code-badge">{item.code}</span>
                    <span className="policy-subcategory-pill">
                      {item.subCategory}
                    </span>
                  </div>
                  <h3 className="policy-item-title">{item.title}</h3>
                  <p className="policy-item-summary">{item.summary}</p>
                </div>

                <div className="policy-item-header-right">
                  {item.workspaceUrl && (
                    <a
                      href={item.workspaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="policy-link-btn is-workspace"
                      title="기획 워크스페이스 스토리보드 열기"
                    >
                      <FileText size={14} /> 연관 기획서
                    </a>
                  )}

                  {!isViewer && (
                    <div className="policy-item-admin-btns">
                      <button
                        type="button"
                        onClick={() => handleMovePolicy(item.id, 'up')}
                        disabled={idx === 0}
                        className="policy-icon-btn"
                        title="위로 이동"
                        aria-label="위로 이동"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePolicy(item.id, 'down')}
                        disabled={idx === visiblePolicies.length - 1}
                        className="policy-icon-btn"
                        title="아래로 이동"
                        aria-label="아래로 이동"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="policy-icon-btn"
                        title="정책 수정"
                        aria-label="정책 수정"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePolicy(item)}
                        className="policy-icon-btn is-danger"
                        title="정책 삭제"
                        aria-label="정책 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 세부 프론트 정책 기준 테이블 */}
              {item.rules && item.rules.length > 0 && (
                <div className="policy-rules-table-wrap">
                  <table className="policy-rules-table">
                    <thead>
                      <tr>
                        <th className="policy-col-class">구분 / 적용 조건</th>
                        <th className="policy-col-detail">
                          시선닷컴 Front 상세 정책 기준
                        </th>
                        <th className="policy-col-note">
                          예외 처리 및 운영 유의사항
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.rules.map((rule) => (
                        <tr key={rule.id}>
                          <td className="policy-td-class">
                            {rule.classification}
                          </td>
                          <td className="policy-td-detail">
                            {rule.ruleDetail}
                          </td>
                          <td className="policy-td-note">
                            {rule.exceptionNote || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* 3. 정책 등록 / 수정 모달 */}
      {isModalOpen && !isViewer && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="modal-box policy-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem
                  ? '시선닷컴 Front 정책 수정'
                  : '시선닷컴 Front 신규 정책 등록'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="tasks-modal-close-btn"
                aria-label="모달 닫기"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="tasks-modal-form">
              <div className="modal-body policy-modal-body">
                <div className="tasks-form-grid-3">
                  <div className="form-group">
                    <label className="form-label">도메인 탭 분류 *</label>
                    <select
                      value={formDomain}
                      onChange={(e) =>
                        handleFormDomainChange(e.target.value as PolicyDomain)
                      }
                      className="form-select"
                    >
                      {DOMAIN_META_LIST.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label} ({d.enLabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">세부 영역 (중분류) *</label>
                    <input
                      type="text"
                      required
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value)}
                      placeholder="예: 멤버십 등급 산정, 반품 배송비"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">정책 코드 *</label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="예: POL-PRD-004"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">정책명 *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="예: 배송완료 후 7일 이내 반품/교환 접수 및 자동 구매확정 정책"
                    className="form-input"
                  />
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">핵심 정책 한 줄 요약 *</label>
                    <input
                      type="text"
                      required
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="정책의 핵심 기준을 한 문장으로 요약해 주세요."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      연관 기획 워크스페이스 URL (선택)
                    </label>
                    <input
                      type="url"
                      value={formWorkspaceUrl}
                      onChange={(e) => setFormWorkspaceUrl(e.target.value)}
                      placeholder="https://bychoi-space.github.io/workspace/viewer.html?project=..."
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 세부 정책 기준 행 편집기 */}
                <div className="policy-rules-editor-section">
                  <div className="policy-rules-editor-header">
                    <label className="form-label">
                      세부 Front 정책 기준 표 ({formRules.length}개 항목)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRuleRow}
                      className="btn btn-secondary policy-rule-add-btn"
                    >
                      <Plus size={14} /> 세부 기준 행 추가
                    </button>
                  </div>

                  <div className="policy-rules-editor-list">
                    {formRules.map((rule, rIdx) => (
                      <div key={rule.id} className="policy-rule-editor-row">
                        <div className="policy-rule-editor-num">#{rIdx + 1}</div>
                        <div className="policy-rule-editor-fields">
                          <input
                            type="text"
                            value={rule.classification}
                            onChange={(e) =>
                              handleUpdateRuleRow(
                                rule.id,
                                'classification',
                                e.target.value
                              )
                            }
                            placeholder="구분 / 조건 (예: [결제 완료] · [출고지정] 단계)"
                            className="form-input"
                          />
                          <textarea
                            rows={2}
                            value={rule.ruleDetail}
                            onChange={(e) =>
                              handleUpdateRuleRow(
                                rule.id,
                                'ruleDetail',
                                e.target.value
                              )
                            }
                            placeholder="상세 프론트 정책 기준"
                            className="form-textarea"
                          />
                          <input
                            type="text"
                            value={rule.exceptionNote || ''}
                            onChange={(e) =>
                              handleUpdateRuleRow(
                                rule.id,
                                'exceptionNote',
                                e.target.value
                              )
                            }
                            placeholder="예외 처리 및 참고사항 (선택)"
                            className="form-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRuleRow(rule.id)}
                          disabled={formRules.length <= 1}
                          className="policy-icon-btn is-danger"
                          title="행 삭제"
                          aria-label="행 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? '정책 수정 저장' : '신규 정책 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
