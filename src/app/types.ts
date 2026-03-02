export type SpeakerGender = "male" | "female" | "unknown";

export type TextBlock = {
  id: string;
  original: string;
  translated: string;
  x: number; // percentage of image width (0-100)
  y: number; // percentage of image height (0-100)
  width: number; // percentage of image width
  height: number; // percentage of image height
  fontSize: number;
  color: string;
  bgColor: string;
  speakerGender: SpeakerGender;
};

export type Page = {
  id: string;
  name: string;
  imageDataUrl: string;
  textBlocks: TextBlock[];
  aiTranslated: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  pages: Page[];
  targetLanguage: string;
  coverImage?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type AppSettings = {
  openRouterApiKey: string;
  theme: "dark" | "light";
  defaultFont: string;
};
