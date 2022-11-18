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

export const noAnswerConfig = {
  // Time offset (minutes) to load no-answer messages
  noAnswerMessagesOffsetSince: -2 * 60,
  noAnswerMessagesOffsetTo: -1 * 60,
  // Chat to post digest
  digestChatId: -1001875278358,
  digestItemsMaxCount: 15,
  digestItemMaxLength: 150,
  // Minutes offset for digests to update
  digestUpdateOffsetSince: -6 * 60,
};

// Chats to collect no answer messages
export const noAnswerChats: ChatConfig[] = [
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
