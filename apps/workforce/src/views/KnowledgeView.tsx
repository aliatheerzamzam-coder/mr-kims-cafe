import { ComingSoon } from './ComingSoon';

export default function KnowledgeView() {
  return (
    <ComingSoon
      ko="지식 베이스 / Knowledge"
      en="Knowledge Base"
      reason="진짜 KB는 RAG/임베딩 + 문서 업로드가 필요합니다. 가짜 위키 카드는 검색되지도 편집되지도 않으므로 의미 없습니다."
      whenItWouldHelp="레시피/SOP/매장 매뉴얼이 PDF/MD로 정리되면, 이를 인덱싱해서 직원이 답변할 때 인용할 수 있게 만듭니다."
    />
  );
}
