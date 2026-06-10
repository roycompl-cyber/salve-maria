export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url?: string;
  category: string;
  published_at: string;
  author: string;
}

export interface Prayer {
  id: string;
  title: string;
  content: string;
  category: string;
  language: "pl" | "la" | "en";
  tags: string[];
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  prayer_reminder_enabled: boolean;
  prayer_reminder_time: string;
  news_notifications: boolean;
  action_notifications: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  ends_at?: string;
  image_url?: string;
  active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: "donor" | "admin";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street: string | null;
  house_no: string | null;
  postal: string | null;
  city: string | null;
  profile_complete: boolean;
}
