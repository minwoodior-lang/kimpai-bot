const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FALLBACK_MESSAGES = {
  FREE_BTC: "김프 변화에 따른 추세 변화를 주시해주세요.",
  FREE_ALT: "변동성 증가 신호가 감지되었습니다. 신중한 접근이 필요합니다.",
  FREE_ETH: "ETH 시장 변동성이 증가하고 있습니다.",
  PRO_BTC: "장기적 관점에서 추세를 확인해주세요.",
  PRO_WHALE: "고래 활동이 감지되었습니다. 추가 분석이 필요합니다.",
  PRO_RISK: "리스크 지표가 상승하고 있습니다. 주의가 필요합니다.",
};

const SYSTEM_PROMPT = `너는 암호화폐 시장을 분석하는 KimpAI의 리서치 어시스턴트다.
출력은 반드시 한국어 한 문장으로만 작성한다.
전략 추천은 간단히 톤만 제시하고, 과도한 확신 표현은 피한다.
데이터에 없는 정보는 임의로 만들지 않는다.`;

async function generateAiLine(signalType, payload) {
  if (!OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY 미설정, fallback 메시지 사용");
    return FALLBACK_MESSAGES[signalType] || FALLBACK_MESSAGES.FREE_BTC;
  }

  const userPrompt = `신호 타입: ${signalType}
데이터: ${JSON.stringify(payload)}

위 데이터를 기반으로, 텔레그램 알림의 "🧠 AI 해석"에 들어갈 한 줄을 작성해줘.
조건:
- 한국어, 최대 1~2문장
- 과거 패턴/확률 언급은 payload에 없으면 임의로 만들지 말 것
- 예: "단기 매수세가 우세하지만, 변동성 확대에 유의가 필요합니다."`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const aiLine = response.data.choices?.[0]?.message?.content?.trim();
    if (aiLine) {
      console.log(`✅ [AI] ${signalType} 해석 생성 완료`);
      return aiLine;
    }

    throw new Error("Empty response from OpenAI");
  } catch (err) {
    console.error(`❌ [AI] ${signalType} GPT 호출 실패:`, err.message);
    return FALLBACK_MESSAGES[signalType] || FALLBACK_MESSAGES.FREE_BTC;
  }
}

module.exports = {
  generateAiLine,
  FALLBACK_MESSAGES,
};
