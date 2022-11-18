/**
 * Список чатов, где ищем сообщения без ответа.
 * Пока только Армения.
 */

export type ChatConfig = {
  id: number;
  name: string;
  link: string;
}

export const noAnswerConfig = {
  // time offset (minutes) to load no-answer messages
  noAnswerMessagesOffsetSince: -2 * 60,
  noAnswerMessagesOffsetTo: -1 * 60,
  // chat to post digest
  digestChatId: -1001875278358,
  // max questions in digest
  digestItemsMaxCount: 15,
  // max question text length
  digestItemMaxLength: 150,
  // minutes offset for digests to update
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
  },
  {
    id: -1001446616598,
    name: 'РУССКИЕ В АРМЕНИИ',
    link: 'https://t.me/RusArmenia',
  },
  {
    id: -1001600851043,
    name: 'IT в Ереване',
    link: 'https://t.me/iterevan',
  },
  {
    id: -1001735630504,
    name: 'гайд ✈️ армения',
    link: 'https://t.me/+jIxd02OP4LtmYTcy',
  },
  {
    id: -1001511363519,
    name: 'Медицина в Армении',
    link: 'https://t.me/armenianmedicine',
  },
];
