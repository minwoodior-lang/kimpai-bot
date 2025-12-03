const GUEST_ID_KEY = "kimpai_guest_id";
const GUEST_NICKNAME_KEY = "kimpai_guest_nickname";

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function getOrCreateNickname(): string {
  if (typeof window === "undefined") return "익명";

  let nickname = localStorage.getItem(GUEST_NICKNAME_KEY);
  if (!nickname) {
    nickname = generateRandomNickname();
    localStorage.setItem(GUEST_NICKNAME_KEY, nickname);
  }
  return nickname;
}

function generateRandomNickname(): string {
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `사용자${randomNum}`;
}

export function generateAndSetRandomNickname(): string {
  if (typeof window === "undefined") return "익명";
  const nickname = generateRandomNickname();
  localStorage.setItem(GUEST_NICKNAME_KEY, nickname);
  return nickname;
}

export function setNickname(nickname: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_NICKNAME_KEY, nickname.substring(0, 50));
}
