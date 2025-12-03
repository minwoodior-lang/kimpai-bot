import { FC, ReactNode, useState } from "react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

const ChatPanel: FC<ChatPanelProps> = ({ isOpen, onClose, children }) => {
  const [showNicknameEdit, setShowNicknameEdit] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-96 rounded-2xl bg-slate-800/95 border border-slate-700 shadow-2xl shadow-slate-900/80 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 bg-slate-700/50">
        <h2 className="text-xs font-bold text-white tracking-wider">KIMP CHAT</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setShowNicknameEdit(!showNicknameEdit)}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-600 transition-colors text-slate-300 hover:text-white text-sm"
            title="닉네임 편집"
            aria-label="닉네임 편집"
          >
            🖊
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-600 transition-colors text-slate-300 hover:text-white"
            aria-label="채팅 닫기"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* 채팅 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {typeof children === "function" ? children({ showNicknameEdit, onToggleNicknameEdit: () => setShowNicknameEdit(false) }) : children || (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <p>채팅 준비 중...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
