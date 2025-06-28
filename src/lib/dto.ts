// DTO（データ転送オブジェクト）パターン
// Client Componentに渡すデータを安全に制御

export interface UserDTO {
  name: string | null;
  level: number;
  exp: number;
  email: string;
}

export interface QuestDTO {
  id: number;
  title: string;
  description: string;
  imgUrl: string | null;
}

export interface ReviewDTO {
  id: number;
  rating: number;
  comment: string;
  created_at: Date;
  user: {
    name: string | null;
  };
}

export interface CompletionDTO {
  id: number;
  completion_date: Date;
  media: string | null;
  user: {
    name: string | null;
    email: string;
  };
  quest: {
    id: number;
    title: string;
    description: string;
  };
}

// 型定義
interface UserInput {
  name: string | null;
  level: number;
  exp: number;
  email: string;
}

interface QuestInput {
  id: number;
  title: string;
  description: string;
  imgUrl: string | null;
}

interface ReviewInput {
  id: number;
  rating: number;
  comment: string;
  created_at: Date;
  user: {
    name: string | null;
  };
}

interface CompletionInput {
  id: number;
  completion_date: Date;
  media: string | null;
  user: {
    name: string | null;
    email: string;
  };
  quest: {
    id: number;
    title: string;
    description: string;
  };
}

// DTO変換関数
export function toUserDTO(user: UserInput): UserDTO {
  return {
    name: user.name,
    level: user.level,
    exp: user.exp,
    email: user.email,
  };
}

export function toQuestDTO(quest: QuestInput): QuestDTO {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    imgUrl: quest.imgUrl,
  };
}

export function toReviewDTO(review: ReviewInput): ReviewDTO {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at,
    user: {
      name: review.user.name,
    },
  };
}

export function toCompletionDTO(completion: CompletionInput): CompletionDTO {
  return {
    id: completion.id,
    completion_date: completion.completion_date,
    media: completion.media,
    user: {
      name: completion.user.name,
      email: completion.user.email,
    },
    quest: {
      id: completion.quest.id,
      title: completion.quest.title,
      description: completion.quest.description,
    },
  };
}
