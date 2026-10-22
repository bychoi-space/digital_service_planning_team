import type { TeamGuideInfo } from '../types';

export const TEAM_GUIDE_DATA: TeamGuideInfo = {
  vision: '시선인터내셔널의 디지털 커머스 혁신과 고객 경험을 리드하는 서비스기획팀',
  mission: '시선닷컴(sisun.com)의 프리미엄 UI/UX 전면 개편, 어드민 운영 효율화, 그리고 전사 이커머스 표준 프로세스 정립을 통해 브랜드 가치와 비즈니스 성장을 견인합니다.',
  domains: [
    {
      id: 'domain-1',
      title: '시선닷컴 (sisun.com) UI/UX 전면 개편',
      description: '프리미엄 패션 브랜드 감성을 살린 기획서(스토리보드) 작성, 감각적인 비주얼 디자인, 완성도 높은 웹 퍼블리싱 파이프라인 총괄',
      leadName: '서비스기획팀 UI/UX 파트',
      services: ['화면설계서(SB) 작성', '메인/기획전/상세 UI 디자인', '반응형 웹 퍼블리싱', '모바일 웹/앱 웹뷰 최적화'],
      tagColor: '#2563eb',
    },
    {
      id: 'domain-2',
      title: '시선닷컴 어드민(백오피스) 운영 효율화',
      description: '온라인MD 및 유관부서의 업무 생산성 극대화를 위한 상품/프로모션/주문/정산 백오피스 UI 개선 및 운영 자동화',
      leadName: '서비스기획팀 어드민 파트',
      services: ['상품 대량 등록/수정 어드민', '기획전/쿠폰 세팅 간소화', '클레임/반품 처리 자동화', 'MD/영업 운영 공수 절감'],
      tagColor: '#059669',
    },
    {
      id: 'domain-3',
      title: '시선인터내셔널 이커머스 표준 정책 & 프로세스',
      description: '온·오프라인 통합 멤버십, 포인트/마일리지 규정, 물류·배송·CS 연계 및 유관부서 간 표준 협업 매트릭스 정립',
      leadName: '서비스기획팀 정책 파트',
      services: ['온·오프 통합 멤버십 정책', '패션 브랜드 마일리지 규정', '부서간 업무 프로세스 가이드', '배송/교환/환불 정책 표준화'],
      tagColor: '#7c3aed',
    },
  ],
  processSteps: [
    {
      step: 1,
      title: '요구사항 접수 및 검토',
      subtitle: 'Discovery & Feasibility',
      description: '유관부서 개편 니즈 및 VOC 수렴, 우선순위 검토',
      deliverables: ['기획 요구사항 정의서 (PRD)', '화면 개편 타당성 분석서'],
      stakeholders: '온라인MN팀, 온라인MD팀, 마케팅실, 서비스기획팀',
    },
    {
      step: 2,
      title: '화면설계(SB) 및 정책 수립',
      subtitle: 'UX Planning & Policy',
      description: '정보 구조(IA), 화면 와이어프레임 및 예외 정책 정의',
      deliverables: ['화면설계서 (SB)', '이커머스 정책 명세서', 'IA 구조도'],
      stakeholders: '서비스기획팀 전원',
    },
    {
      step: 3,
      title: 'UI 디자인 & 반응형 퍼블리싱',
      subtitle: 'Design & Publishing',
      description: '브랜드 비주얼 UI 디자인 및 크로스 브라우징 퍼블리싱',
      deliverables: ['디자인 컴포넌트 시스템', 'HTML/CSS/JS 퍼블리싱 산출물'],
      stakeholders: '서비스기획팀 디자인/퍼블리싱 파트',
    },
    {
      step: 4,
      title: '개발 협의 & 연동 검수',
      subtitle: 'Development & QA Sync',
      description: 'API 연동 사양 협의 및 프론트엔드·어드민 통합 QA 검수',
      deliverables: ['개발 협의 명세서', '어드민 설정 가이드', 'QA 체크리스트'],
      stakeholders: '서비스기획팀, 디지털정보실, IT팀',
    },
    {
      step: 5,
      title: '배포 및 운영 모니터링',
      subtitle: 'Release & Optimization',
      description: '운영 배포 후 사용성 모니터링 및 지속 고도화',
      deliverables: ['개편 런칭 성과 리포트', '어드민 VOC 개선 백로그'],
      stakeholders: '전사 유관부서, 경영기획 총괄',
    },
  ],
  collaborationChannels: [
    {
      type: '사내 메신저',
      name: '#sisun-service-planning (기획 문의 채널)',
      purpose: '시선닷컴 UI 개편 제안, 어드민 기능 개선 요청 및 정책 문의',
      linkOrContact: '사내 잔디/슬랙 검색: #sisun-service-planning',
    },
    {
      type: '정기 협의체',
      name: '시선닷컴 프로덕트 싱크 (매주 화 14:00)',
      purpose: '온라인MN, 온라인MD, 마케팅, 기획 간 주간 릴리즈 일정 조율',
      linkOrContact: '시선인터내셔널 본사 대회의실 및 화상 회의',
    },
    {
      type: '공식 문서',
      name: '시선닷컴 기획/정책 문서 아카이빙',
      purpose: '시선닷컴 화면설계서, 어드민 매뉴얼, 이커머스 표준 정책서 열람',
      linkOrContact: '사내 지식포털 / 공유 드라이브 링크',
    },
  ],
};
