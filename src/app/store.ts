import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project, Page, TextBlock, User, AppSettings } from "./types";

interface AppState {
  user: User | null;
  projects: Project[];
  settings: AppSettings;

  // Auth
  login: (user: User) => void;
  logout: () => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Projects
  createProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, "id">>) => void;
  getProject: (id: string) => Project | undefined;

  // Pages
  addPage: (projectId: string, page: Page) => void;
  deletePage: (projectId: string, pageId: string) => void;
  updatePage: (projectId: string, pageId: string, updates: Partial<Page>) => void;

  // Text Blocks
  addTextBlock: (projectId: string, pageId: string, block: TextBlock) => void;
  updateTextBlock: (projectId: string, pageId: string, blockId: string, updates: Partial<TextBlock>) => void;
  deleteTextBlock: (projectId: string, pageId: string, blockId: string) => void;
  replaceTextBlocks: (projectId: string, pageId: string, blocks: TextBlock[]) => void;
}

const DEMO_PROJECT_IMAGE = "https://images.unsplash.com/photo-1763315371311-f59468cc2ddc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW5nYSUyMGNvbWljJTIwcGFnZSUyMGJsYWNrJTIwd2hpdGV8ZW58MXx8fHwxNzcyNDc0NzU5fDA&ixlib=rb-4.1.0&q=80&w=1080";

const DEMO_BLOCKS: TextBlock[] = [
  {
    id: "demo-block-1",
    original: "お前には絶対に負けない！",
    translated: "ฉันจะไม่แพ้แกอย่างเด็ดขาด!",
    x: 8,
    y: 5,
    width: 35,
    height: 12,
    fontSize: 14,
    color: "#000000",
    bgColor: "#ffffff",
    speakerGender: "male",
  },
  {
    id: "demo-block-2",
    original: "なぜ...こんなことを？",
    translated: "ทำไม... ถึงทำแบบนี้?",
    x: 58,
    y: 8,
    width: 32,
    height: 10,
    fontSize: 14,
    color: "#000000",
    bgColor: "#ffffff",
    speakerGender: "female",
  },
  {
    id: "demo-block-3",
    original: "みんなを守るためだ！",
    translated: "เพื่อปกป้องทุกคนครับ!",
    x: 10,
    y: 55,
    width: 36,
    height: 11,
    fontSize: 14,
    color: "#000000",
    bgColor: "#ffffff",
    speakerGender: "male",
  },
  {
    id: "demo-block-4",
    original: "逃げるんだ！今すぐ！",
    translated: "หนีไปเถอะค่ะ! ตอนนี้เลย!",
    x: 56,
    y: 60,
    width: 33,
    height: 11,
    fontSize: 14,
    color: "#000000",
    bgColor: "#ffffff",
    speakerGender: "female",
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      projects: [],
      settings: {
        openRouterApiKey: "",
        theme: "dark",
        defaultFont: "Sarabun",
      },

      login: (user) => set({ user }),
      logout: () => set({ user: null }),

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      createProject: (name, description = "") => {
        const id = `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();
        const project: Project = {
          id,
          name,
          description,
          createdAt: now,
          updatedAt: now,
          pages: [],
          targetLanguage: "Thai",
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },

      deleteProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      addPage: (projectId, page) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, pages: [...p.pages, page], updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deletePage: (projectId, pageId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.filter((pg) => pg.id !== pageId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      updatePage: (projectId, pageId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((pg) => (pg.id === pageId ? { ...pg, ...updates } : pg)),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      addTextBlock: (projectId, pageId, block) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((pg) =>
                    pg.id === pageId
                      ? { ...pg, textBlocks: [...pg.textBlocks, block] }
                      : pg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      updateTextBlock: (projectId, pageId, blockId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((pg) =>
                    pg.id === pageId
                      ? {
                          ...pg,
                          textBlocks: pg.textBlocks.map((b) =>
                            b.id === blockId ? { ...b, ...updates } : b
                          ),
                        }
                      : pg
                  ),
                }
              : p
          ),
        })),

      deleteTextBlock: (projectId, pageId, blockId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((pg) =>
                    pg.id === pageId
                      ? {
                          ...pg,
                          textBlocks: pg.textBlocks.filter((b) => b.id !== blockId),
                        }
                      : pg
                  ),
                }
              : p
          ),
        })),

      replaceTextBlocks: (projectId, pageId, blocks) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pages: p.pages.map((pg) =>
                    pg.id === pageId
                      ? { ...pg, textBlocks: blocks, aiTranslated: true }
                      : pg
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),
    }),
    {
      name: "comic-trans-studio-v1",
    }
  )
);

// Helper to load demo project
export const loadDemoProject = () => {
  const store = useAppStore.getState();
  const existing = store.projects.find((p) => p.name === "Demo: My First Manga");
  if (existing) return existing;

  const project = store.createProject("Demo: My First Manga", "Sample project with pre-loaded manga page");
  const pageId = `page-${Date.now()}`;
  store.addPage(project.id, {
    id: pageId,
    name: "Page 1",
    imageDataUrl: DEMO_PROJECT_IMAGE,
    textBlocks: DEMO_BLOCKS,
    aiTranslated: true,
  });
  return { ...project, pages: [] };
};
