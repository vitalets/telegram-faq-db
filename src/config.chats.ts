/**
 * Список чатов, где проверяем сообщения.
 * Пока только Армения.
 *
 * todo: Чаты по остальным странам мира: t.me/travelask_all_chats
 */

export type ChatConfig = {
  id: number;
  name: string;
  link: string;
}

// Channel to post digest
export const digestChatId = -1001890247727;

export const chats: ChatConfig[] = [
  {
    id: -1001669191797,
    name: 'Переезд в Армению | Взаимопомощь',
    link: 'https://t.me/+szFNNJqf1J42Zjhi',
  },
  {
    id: -1001719695860,
    name: 'Армения — релокация, ВНЖ, переезд',
    link: 'https://t.me/+9ZZG-ojnofE5Mjdi',
  },
  {
    id: -1001426091267,
    name: 'Ереван 🇦🇲 Чат TravelAsk',
    link: 'https://t.me/+9HMo1MGt1Jc3N2Yy',
  },
  {
    id: -1001698392658,
    name: 'Банки в Армении',
    link: 'https://t.me/+s2_G3BHv0E4xNjNi',
  }
];
