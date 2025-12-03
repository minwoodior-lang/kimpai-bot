import { FC } from "react";

interface ChatFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const ChatFloatingButton: FC<ChatFloatingButtonProps> = ({ isOpen, onClick }) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-900/50 hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-110"
      aria-label="채팅 열기"
      title="채팅"
    >
      <span className="text-2xl">💬</span>
    </button>
  );
};

export default ChatFloatingButton;
