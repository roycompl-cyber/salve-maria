import { DEFAULT_BASE_URL } from "@/lib/polskakatolicka";

export interface SourceConfig {
  articles_url: string;
  petitions_url: string;
  videos_url: string;
}

export const DEFAULT_SOURCE_CONFIG: SourceConfig = {
  articles_url: DEFAULT_BASE_URL,
  petitions_url: DEFAULT_BASE_URL,
  videos_url: DEFAULT_BASE_URL,
};
