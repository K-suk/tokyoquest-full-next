declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// Google Analytics 4 のページビューを送信
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_location: url,
    });
  }
};

// Google Analytics 4 のイベントを送信
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// ログインイベントを送信
export const trackLogin = (method: string) => {
  event({
    action: 'login',
    category: 'authentication',
    label: method,
  });
};

// クエスト完了イベントを送信
export const trackQuestCompletion = (questId: number, questTitle: string) => {
  event({
    action: 'quest_complete',
    category: 'quest',
    label: questTitle,
    value: questId,
  });
};

// クエスト保存イベントを送信
export const trackQuestSave = (questId: number, questTitle: string) => {
  event({
    action: 'quest_save',
    category: 'quest',
    label: questTitle,
    value: questId,
  });
};
