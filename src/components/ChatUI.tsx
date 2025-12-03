import { useState, useEffect, useRef } from "react";
import { useChat, type ChatMessage } from "@/hooks/useChat";

export default function ChatUI({ showNicknameEdit, onToggleNicknameEdit }: { showNicknameEdit: boolean; onToggleNicknameEdit: () => void }) {
  const { messages, systemMessage, isConnected, currentNickname, sendMessage, updateNickname } = useChat();
  const [inputValue, setInputValue] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNicknameInput(currentNickname);
  }, [currentNickname]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    sendMessage(inputValue.trim());
    setInputValue("");
    
    // isSending 복구
    setTimeout(() => setIsSending(false), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveNickname = () => {
    updateNickname(nicknameInput);
    onToggleNicknameEdit();
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      {/* 닉네임 입력 영역 (토글) */}
      {showNicknameEdit && (
        <div className="border-b border-slate-700 px-4 py-3 bg-slate-750 space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">닉네임</label>
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="닉네임 입력"
                maxLength={50}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSaveNickname}
              className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-[11px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <p>대화를 시작해보세요!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg: ChatMessage) => (
              <div key={msg.id} className="space-y-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-blue-400 font-semibold text-[10px]">
                    {msg.nickname}
                  </span>
                  <span className="text-slate-500 text-[9px]">
                    {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-slate-100 break-words text-[11px] leading-tight">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* 시스템 메시지 */}
        {systemMessage && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded px-2 py-1.5 text-yellow-100 text-[10px]">
            {systemMessage}
          </div>
        )}
      </div>

      {/* 입력창 */}
      <div className="border-t border-slate-700 p-2.5 bg-slate-750 space-y-1">
        {!isConnected && (
          <div className="bg-red-900/30 border border-red-700 rounded px-2 py-1 text-red-100 text-[10px]">
            연결 중...
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력..."
            disabled={!isConnected}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-400 disabled:opacity-50 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputValue.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1.5 rounded text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
