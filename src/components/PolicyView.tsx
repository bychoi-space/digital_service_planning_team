import React, { useState, useMemo } from 'react';
import type { User, PolicyDomain, PolicyRuleRow, SisunPolicyItem } from '../types';
import { PlanningStorageService, generateUniqueId } from '../services/storage';
import {
  BookMarked,
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
  RotateCcw,
  X,
  Layers,
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
    desc: '신규 가입/APP 첫 로그인 혜택 · 6단계 멤버십 등급 산정 주기/기준 · 쿠폰/마일리지 중복 제한 및 소멸',
    codePrefix: 'POL-MEM',
  },
  {
    key: 'order',
    label: '주문',
    enLabel: 'Order & Delivery',
    desc: '전 상품 무료배송(CJ대한통운) · 복수 상품 개별 선출고 · 단계별 배송지 변경 가능 조건 · 결제/제휴 프로모션',
    codePrefix: 'POL-ORD',
  },
  {
    key: 'display',
    label: '전시',
    enLabel: 'Display & Brand',
    desc: '통합몰/브랜드관(E.B.M · MICHAA · IT MICHAA) · 표준 카테고리 · 기획전 배너 슬롯/정렬 · LIVE 방송 연동',
    codePrefix: 'POL-DSP',
  },
  {
    key: 'claim',
    label: '클레임',
    enLabel: 'Claim & AS',
    desc: '배송완료 7일 이내 반품/교환 · 7일 경과 자동 구매확정 · 왕복배송비(5,000원) 및 합포장 반품 1건 차감 · 수선(AS)',
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
    enLabel: 'Common & Global',
    desc: '상단 헤더(GNB) 유틸리티 · 다국어 전환(한/영/중) · APP 다운로드 SMS 일 5회 제한/번호 미저장 · 고객센터/트래킹',
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
  const [selectedDomain, setSelectedDomain] = useState<'all' | PolicyDomain>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'updated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 등록/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SisunPolicyItem | null>(null);

  // 폼 입력 상태
  const [formDomain, setFormDomain] = useState<PolicyDomain>('product');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'updated'>('active');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFrontScreenPath, setFormFrontScreenPath] = useState('');
  const [formWorkspaceUrl, setFormWorkspaceUrl] = useState('');
  const [formRules, setFormRules] = useState<PolicyRuleRow[]>([]);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  // 도메인별 정책 건수 집계
  const domainCounts = useMemo(() => {
    const counts: Record<'all' | PolicyDomain, number> = {
      all: items.length,
      product: 0,
      member: 0,
      order: 0,
      display: 0,
      claim: 0,
      search: 0,
      common: 0,
    };
    items.forEach((item) => {
      if (counts[item.domain] !== undefined) {
        counts[item.domain] += 1;
      }
    });
    return counts;
  }, [items]);

  // 필터링된 정책 목록
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedDomain !== 'all' && item.domain !== selectedDomain) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;

      const inHeader =
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.subCategory.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (inHeader) return true;

      return item.rules.some(
        (r) =>
          r.classification.toLowerCase().includes(q) ||
          r.ruleDetail.toLowerCase().includes(q) ||
          (r.exceptionNote || '').toLowerCase().includes(q)
      );
    });
  }, [items, selectedDomain, statusFilter, searchQuery]);

  // 도메인 그룹핑
  const groupedDomains = useMemo(() => {
    const targetDomains =
      selectedDomain === 'all'
        ? DOMAIN_META_LIST
        : DOMAIN_META_LIST.filter((d) => d.key === selectedDomain);

    return targetDomains
      .map((meta) => ({
        meta,
        policies: filteredItems.filter((item) => item.domain === meta.key),
      }))
      .filter((group) => group.policies.length > 0);
  }, [filteredItems, selectedDomain]);

  // 신규 정책 모달 열기
  const handleOpenCreateModal = (defaultDomain?: PolicyDomain) => {
    if (isViewer) return;
    const targetDomain: PolicyDomain =
      defaultDomain || (selectedDomain === 'all' ? 'product' : selectedDomain);
    const domainList = items.filter((i) => i.domain === targetDomain);
    const nextCode = `${DOMAIN_MAP[targetDomain].codePrefix}-${String(
      domainList.length + 1
    ).padStart(3, '0')}`;

    setEditingItem(null);
    setFormDomain(targetDomain);
    setFormSubCategory('');
    setFormCode(nextCode);
    setFormStatus('active');
    setFormTitle('');
    setFormSummary('');
    setFormDescription('');
    setFormFrontScreenPath('https://sisun.com/');
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
    setFormStatus(item.status);
    setFormTitle(item.title);
    setFormSummary(item.summary);
    setFormDescription(item.description);
    setFormFrontScreenPath(item.frontScreenPath || '');
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
      notify('핵심 정책 한 줄 요약을 입력해 주세요.', 'error');
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
          status: formStatus,
          title: formTitle.trim(),
          summary: formSummary.trim(),
          description: formDescription.trim(),
          rules: cleanedRules,
          frontScreenPath: formFrontScreenPath.trim() || undefined,
          workspaceUrl: formWorkspaceUrl.trim() || undefined,
        });
        notify(`정책 [${formTitle.trim()}] 항목이 수정되었습니다.`, 'success');
      } else {
        PlanningStorageService.createPolicyItem({
          domain: formDomain,
          subCategory: formSubCategory.trim() || '기본 정책',
          code: formCode.trim(),
          status: formStatus,
          title: formTitle.trim(),
          summary: formSummary.trim(),
          description: formDescription.trim(),
          rules: cleanedRules,
          frontScreenPath: formFrontScreenPath.trim() || undefined,
          workspaceUrl: formWorkspaceUrl.trim() || undefined,
        });
        notify(`신규 정책 [${formTitle.trim()}] 항목이 등록되었습니다.`, 'success');
      }

      setItems(PlanningStorageService.getPolicies());
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

  // 표준 기본값 복원
  const handleResetDefault = () => {
    if (isViewer) return;
    if (
      !window.confirm(
        '시선닷컴 7대 도메인 표준 정책 데이터를 초기 기준값으로 복원하시겠습니까?'
      )
    ) {
      return;
    }
    try {
      const restored = PlanningStorageService.resetPoliciesToDefault();
      setItems(restored);
      notify('시선닷컴 7대 도메인 표준 정책 데이터가 복원되었습니다.', 'info');
    } catch (err) {
      notify(
        err instanceof Error ? err.message : '초기화 중 오류가 발생했습니다.',
        'error'
      );
    }
  };

  return (
    <div className="policy-view-container">
      {/* 1. 상단 히어로 & 컨트롤 헤더 카드 */}
      <div className="card policy-hero-card">
        <div className="policy-hero-top">
          <div className="policy-hero-title-group">
            <div className="policy-hero-icon">
              <BookMarked size={24} />
            </div>
            <div className="policy-hero-text">
              <div className="policy-hero-badge-row">
                <span className="policy-system-badge">SISUN.COM FRONT POLICY</span>
                <span className="policy-count-chip">
                  7대 도메인 · 총 {items.length}개 표준 정책
                </span>
              </div>
              <h2 className="policy-hero-title">
                시선닷컴 Front 서비스 운영 및 화면 설계 표준 정책서
              </h2>
              <p className="policy-hero-desc">
                시선닷컴(sisun.com) 통합몰 및 브랜드관(E.B.M · MICHAA · IT MICHAA)의 상품, 회원, 주문, 전시, 클레임, 검색, 공통 도메인별 실제 운영 기준과 기획 워크스페이스 개편 정책을 통합 관리합니다.
              </p>
            </div>
          </div>

          <div className="policy-hero-actions">
            <a
              href="https://sisun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary policy-external-btn"
            >
              <ExternalLink size={15} /> 시선닷컴 바로가기
            </a>
            {!isViewer && (
              <>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="btn btn-secondary"
                  title="기본 표준 정책 데이터 복원"
                >
                  <RotateCcw size={15} /> 표준 정책 복원
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> 정책 등록
                </button>
              </>
            )}
          </div>
        </div>

        {/* 도메인 탭 네비게이션 */}
        <div className="policy-domain-tabs" role="tablist" aria-label="시선닷컴 도메인 분류">
          <button
            type="button"
            role="tab"
            aria-selected={selectedDomain === 'all'}
            className={`policy-domain-tab ${selectedDomain === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDomain('all')}
          >
            <Layers size={16} />
            <span>전체 도메인</span>
            <span className="policy-domain-tab-count">{domainCounts.all}</span>
          </button>

          {DOMAIN_META_LIST.map((dom) => (
            <button
              key={dom.key}
              type="button"
              role="tab"
              aria-selected={selectedDomain === dom.key}
              className={`policy-domain-tab ${selectedDomain === dom.key ? 'active' : ''}`}
              onClick={() => setSelectedDomain(dom.key)}
            >
              {renderDomainIcon(dom.key, 16)}
              <span>{dom.label}</span>
              <span className="policy-domain-tab-count">{domainCounts[dom.key]}</span>
            </button>
          ))}
        </div>

        {/* 검색 및 상태 필터 바 */}
        <div className="policy-filter-bar">
          <div className="policy-search-input-wrap">
            <Search size={16} className="policy-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="정책 코드(POL-xxx), 정책명, 세부 조건(예: 무료배송, 합포장, 마일리지, 구매확정, 아울렛) 검색..."
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

          <div className="policy-status-filter-group">
            <button
              type="button"
              className={`policy-status-chip ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              전체 상태
            </button>
            <button
              type="button"
              className={`policy-status-chip ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              상시 운영 정책
            </button>
            <button
              type="button"
              className={`policy-status-chip ${statusFilter === 'updated' ? 'active' : ''}`}
              onClick={() => setStatusFilter('updated')}
            >
              최근 개편/고도화
            </button>
          </div>
        </div>
      </div>

      {/* 2. 도메인별 정책 리스트 섹션 */}
      {groupedDomains.length === 0 ? (
        <div className="card policy-empty-card">
          <p className="policy-empty-text">
            조건에 일치하는 시선닷컴 Front 정책 항목이 없습니다.
          </p>
          {searchQuery || statusFilter !== 'all' || selectedDomain !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setSelectedDomain('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary"
            >
              필터 초기화
            </button>
          ) : null}
        </div>
      ) : (
        <div className="policy-domains-stack">
          {groupedDomains.map(({ meta, policies }) => (
            <section key={meta.key} className="policy-domain-section">
              {/* 도메인 섹션 헤더 */}
              <div className="policy-domain-section-header">
                <div className="policy-domain-header-left">
                  <div className={`policy-domain-icon-box is-${meta.key}`}>
                    {renderDomainIcon(meta.key, 20)}
                  </div>
                  <div className="policy-domain-header-titles">
                    <div className="policy-domain-title-row">
                      <h3 className="policy-domain-title">{meta.label} 도메인</h3>
                      <span className="policy-domain-en-badge">{meta.enLabel}</span>
                      <span className="policy-domain-count-badge">
                        {policies.length}개 정책
                      </span>
                    </div>
                    <p className="policy-domain-desc">{meta.desc}</p>
                  </div>
                </div>

                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(meta.key)}
                    className="btn btn-secondary policy-domain-add-btn"
                  >
                    <Plus size={15} /> {meta.label} 정책 추가
                  </button>
                )}
              </div>

              {/* 도메인 내 개별 정책 카드 목록 */}
              <div className="policy-cards-list">
                {policies.map((item, idx) => (
                  <article key={item.id} className="card policy-item-card">
                    <div className="policy-item-header">
                      <div className="policy-item-meta-top">
                        <span className="policy-code-badge">{item.code}</span>
                        <span className={`policy-domain-pill is-${item.domain}`}>
                          {DOMAIN_MAP[item.domain].label}
                        </span>
                        <span className="policy-subcategory-pill">
                          {item.subCategory}
                        </span>
                        <span
                          className={`policy-status-badge ${
                            item.status === 'updated' ? 'is-updated' : 'is-active'
                          }`}
                        >
                          {item.status === 'updated' ? '최근 개편·고도화' : '상시 운영중'}
                        </span>
                      </div>

                      <div className="policy-item-header-right">
                        {item.frontScreenPath && (
                          <a
                            href={item.frontScreenPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="policy-link-btn is-sisun"
                            title="시선닷컴 실제 적용 화면 열기"
                          >
                            <ExternalLink size={14} /> 시선닷컴 화면
                          </a>
                        )}
                        {item.workspaceUrl && (
                          <a
                            href={item.workspaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="policy-link-btn is-workspace"
                            title="기획 워크스페이스 스토리보드 열기"
                          >
                            <FileText size={14} /> 연관 기획서(Workspace)
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
                              disabled={idx === policies.length - 1}
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

                    <h4 className="policy-item-title">{item.title}</h4>
                    <p className="policy-item-summary">{item.summary}</p>
                    {item.description && (
                      <p className="policy-item-description">{item.description}</p>
                    )}

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

                    <div className="policy-item-footer">
                      <span>
                        최종 업데이트: <strong>{item.updatedBy}</strong> (
                        {new Date(item.updatedAt).toLocaleDateString('ko-KR')})
                      </span>
                      {item.frontScreenPath && (
                        <span className="policy-item-path-text">
                          적용 경로: {item.frontScreenPath}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
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
                {editingItem ? '시선닷컴 Front 정책 수정' : '시선닷컴 Front 신규 정책 등록'}
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
                <div className="tasks-form-grid-4">
                  <div className="form-group">
                    <label className="form-label">도메인 분류 *</label>
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

                  <div className="form-group">
                    <label className="form-label">운영 상태 *</label>
                    <select
                      value={formStatus}
                      onChange={(e) =>
                        setFormStatus(e.target.value as 'active' | 'updated')
                      }
                      className="form-select"
                    >
                      <option value="active">상시 운영중</option>
                      <option value="updated">최근 개편·고도화</option>
                    </select>
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
                  <label className="form-label">정책 배경 및 상세 설명</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="프론트 화면 노출 원리 및 운영 배경 설명을 입력해 주세요."
                    className="form-textarea"
                  />
                </div>

                <div className="tasks-form-grid-2">
                  <div className="form-group">
                    <label className="form-label">시선닷컴 적용 URL (선택)</label>
                    <input
                      type="url"
                      value={formFrontScreenPath}
                      onChange={(e) => setFormFrontScreenPath(e.target.value)}
                      placeholder="https://sisun.com/..."
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
