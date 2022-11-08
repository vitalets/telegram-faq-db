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

export const chats: ChatConfig[] = [
  {
    id: -1001669191797,
    name: 'Переезд в Армению | Взаимопомощь',
    link: 'https://t.me/+szFNNJqf1J42Zjhi',
  },
  {
    id: -1001719695860,
    name: 'Армения — релокация, ВНЖ, переезд. Чат TravelAsk',
    link: 'https://t.me/+9ZZG-ojnofE5Mjdi',
  },
  {
    id: -1001724913396,
    name: 'Ереван 🇦🇲 Чат TravelAsk',
    link: 'https://t.me/+9HMo1MGt1Jc3N2Yy',
  },
];
