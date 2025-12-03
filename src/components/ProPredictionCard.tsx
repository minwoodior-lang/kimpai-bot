/**
 * PRO 전용 48시간 김프 예측 - 중앙 카드
 * AI 분석 페이지와 100% 동일한 스타일
 */

export function ProPredictionCard() {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "16px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
      }}
    >
      {/* 타이틀 */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#EDEDED",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>🔒</span>
        <span>PRO 전용 48시간 김프 예측</span>
      </div>

      {/* 블러 처리된 설명 텍스트 박스 */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(6px)",
          borderRadius: "12px",
          padding: "16px 18px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.4,
            color: "rgba(255, 255, 255, 0.55)",
            margin: 0,
            textAlign: "center",
          }}
        >
          최근 30일 기준, 이 예측은 김프 2% 이상 급변 구간의
          <br />
          90% 이상을 사전에 포착했습니다.
          <br />
          <br />
          <span style={{ fontSize: "12px" }}>* 전체 예측 데이터는 PRO 구독 시 이용할 수 있습니다.</span>
        </p>
      </div>

      {/* PRO 버튼 */}
      <button
        style={{
          width: "100%",
          background: "linear-gradient(90deg, #8155FF, #5D3DFF)",
          height: "40px",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <span>🔒</span>
        <span>PRO 분석 전체 보기</span>
      </button>
    </div>
  );
}

export default ProPredictionCard;
