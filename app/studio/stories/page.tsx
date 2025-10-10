"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import Image from "next/image";

import { useRouter } from "next/navigation";

import {

  AlertCircle,

  ChevronDown,

  ChevronLeft,

  ChevronRight,

  ChevronUp,

  Loader2,

  PencilLine,

  Plus,

  RefreshCcw,

  Sparkles,

  Trash2,

  Wand2,

  Zap,

} from "lucide-react";



import { StoriesRightPanel } from "@/components/stories-right-panel";

import { StudioSidebar, type StudioNavKey } from "@/components/studio-sidebar";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import { useCredits } from "@/hooks/use-credits";

import { CHARACTER_CONFIG } from "@/lib/character-presets";

import {

  clampSceneCount,

  STORY_NARRATIVE_SCHEMA,

  type StoryNarrative,

  type StoryScene,

} from "@/lib/story-enhancer";

import { cn } from "@/lib/utils";

import type { CharacterId } from "@/types";



type QuickDraftImage = {
  id?: string;
  imagePath: string;
  previewUrl?: string | null;
  shareUrl?: string | null;
  description?: string | null;
  model?: string | null;
};

type StorySceneFrame = {

  id: string;

  sceneIndex: number;

  title: string | null;

  copy: string | null;

  summary: string | null;

  visualPrompt: string;

  imageUrl: string | null;

  previewUrl: string | null;

  shareUrl: string | null;

  backgroundRemovedUrl: string | null;

  metadata: Record<string, unknown> | null;

};



const PROMPT_HISTORY_LIMIT = 20;

type StoryRunView = {

  id: string;

  title: string | null;

  summary: string | null;

  sceneCount: number;

  status: string;

  createdAt: string | null;

  metadata: Record<string, unknown> | null;

  enhancerModel: string | null;

  basePrompt: string | null;

  enhancedPrompt: string | null;

  frames: StorySceneFrame[];

};



type GeneratedFrameResponse = {

  id: string;

  sceneIndex: number;

  title?: string | null;

  copy?: string | null;

  summary?: string | null;

  visualPrompt: string;

  generatedImageId?: string | null;

  urls?: {

    imagePath?: string | null;

    previewUrl?: string | null;

    shareUrl?: string | null;

    backgroundRemovedUrl?: string | null;

  } | null;

};



const DEFAULT_SCENE_COUNT = 4;



const CHARACTER_LIST = (Object.keys(CHARACTER_CONFIG) as CharacterId[])

  .filter((id) => id !== "CUSTOM")

  .map((id) => ({

    id,

    name: CHARACTER_CONFIG[id].name,

    preview:

      CHARACTER_CONFIG[id].references[0] ??

      "/ultragaz-character-in-living-room.jpg",

  }));

export default function StoriesStudioPage() {

  const router = useRouter();

  const { data: creditData, refetch: refetchCredits } = useCredits();



  const [credits, setCredits] = useState<number | null>(null);

  const [totalGenerated, setTotalGenerated] = useState<number | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);



  const [basePrompt, setBasePrompt] = useState("");
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const promptHistoryDraftRef = useRef<string>("");

  const [tone, setTone] = useState("");

  const [sceneCount, setSceneCount] = useState(DEFAULT_SCENE_COUNT);

  const [language, setLanguage] = useState<"pt-BR" | "en-US">("pt-BR");

  const [story, setStory] = useState<StoryNarrative | null>(null);

  const [enhancerModel, setEnhancerModel] = useState<string | null>(null);



  const [isEnhancing, setIsEnhancing] = useState(false);

  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [enhancerDebugRaw, setEnhancerDebugRaw] = useState<string | null>(null);
  const [enhancerDebugSegments, setEnhancerDebugSegments] = useState<string[]>([]);
  const [enhancerInlineDataCount, setEnhancerInlineDataCount] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [generationError, setGenerationError] = useState<string | null>(null);



  const [currentRun, setCurrentRun] = useState<StoryRunView | null>(null);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const [editInstructions, setEditInstructions] = useState("");

  const [isEditingScene, setIsEditingScene] = useState(false);

  const [editError, setEditError] = useState<string | null>(null);



  const [history, setHistory] = useState<StoryRunView[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyError, setHistoryError] = useState<string | null>(null);

  const [quickDraft, setQuickDraft] = useState<QuickDraftImage[] | null>(null);
  const [isQuickGenerating, setIsQuickGenerating] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(

    "ULLY",

  );



  useEffect(() => {

    if (!creditData) return;

    setCredits(creditData.credits);

    setTotalGenerated(creditData.totalGenerated);

    setIsAdmin(creditData.isAdmin);

  }, [creditData]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const response = await fetch("/api/prompt-history", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const json = (await response.json()) as { prompts?: string[] };
        if (!isMounted) {
          return;
        }
        if (Array.isArray(json.prompts)) {
          const sanitized = json.prompts
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, PROMPT_HISTORY_LIMIT);
          setPromptHistory(sanitized);
        }
      } catch (error) {
        if (isMounted) {
          console.error('[stories] failed to load prompt history', error);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasUnlimitedCredits = Boolean(creditData?.hasUnlimitedCredits);

  const resetPromptHistoryNavigation = useCallback(() => {
    setHistoryCursor(null);
    promptHistoryDraftRef.current = "";
  }, []);

  const recordPrompt = useCallback((rawPrompt: string) => {
    const trimmed = rawPrompt.trim();
    if (!trimmed) {
      return;
    }
    setPromptHistory((previous) => {
      const next = [trimmed, ...previous.filter((item) => item !== trimmed)];
      return next.slice(0, PROMPT_HISTORY_LIMIT);
    });

    void fetch("/api/prompt-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: trimmed, source: "stories" }),
    }).catch((error) => {
      console.error('[stories] failed to persist prompt history', error);
    });
  }, []);

  const handlePromptInputChange = useCallback(
    (value: string) => {
      setBasePrompt(value);
      resetPromptHistoryNavigation();
    },
    [resetPromptHistoryNavigation],
  );

  const handlePromptKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }
      if (promptHistory.length === 0) {
        return;
      }
      event.preventDefault();

      if (event.key === "ArrowUp") {
        setHistoryCursor((previous) => {
          const nextCursor = previous === null ? 0 : Math.min(previous + 1, promptHistory.length - 1);
          if (previous === null) {
            promptHistoryDraftRef.current = basePrompt;
          }
          setBasePrompt(promptHistory[nextCursor] ?? "");
          return nextCursor;
        });
        return;
      }

      setHistoryCursor((previous) => {
        if (previous === null) {
          return previous;
        }
        if (previous > 0) {
          const nextCursor = previous - 1;
          setBasePrompt(promptHistory[nextCursor] ?? "");
          return nextCursor;
        }
        setBasePrompt(promptHistoryDraftRef.current);
        promptHistoryDraftRef.current = "";
        return null;
      });
    },
    [promptHistory, basePrompt],
  );



  const handleSidebarSelect = useCallback(

    (key: StudioNavKey) => {

      if (key === "generate") {

        router.push("/studio");

        return;

      }

      if (key === "my-images") {

        router.push("/studio/gallery");

        return;

      }

      if (key === "my-videos") {

        router.push("/studio/videos");

        return;

      }

      if (key === "my-stories") {

        return;

      }

      if (key === "settings") {

        router.push("/profile");

        return;

      }

      if (key === "support") {

        router.push("/support");

      }

    },

    [router],

  );



  const loadHistory = useCallback(async () => {

    setHistoryLoading(true);

    setHistoryError(null);



    try {

      const res = await fetch("/api/stories/history", { cache: "no-store" });

      if (res.status === 401) {

        setHistory([]);

        return;

      }

      if (!res.ok) {

        throw new Error(`HTTP ${res.status}`);

      }

      const json = (await res.json()) as {

        runs?: Array<{

          run: Record<string, unknown>;

          frames: Record<string, unknown>[];

        }>;

      };



      if (!Array.isArray(json.runs)) {

        setHistory([]);

        return;

      }



      const mapped = json.runs

        .map((item) => mapHistoryItem(item))

        .filter((item): item is StoryRunView => Boolean(item));



      setHistory(mapped);

    } catch (error) {

      setHistoryError(

        error instanceof Error ? error.message : "Failed to load story history",

      );

    } finally {

      setHistoryLoading(false);

    }

  }, []);



  useEffect(() => {

    void loadHistory();

  }, [loadHistory]);



  useEffect(() => {

    if (!currentRun || currentRun.frames.length === 0) {

      return;

    }

    if (!selectedSceneId) {

      setSelectedSceneId(currentRun.frames[0].id);

      return;

    }

    const exists = currentRun.frames.some((frame) => frame.id === selectedSceneId);

    if (!exists) {

      setSelectedSceneId(currentRun.frames[0].id);

    }

  }, [currentRun, selectedSceneId]);

  const handleStoryTitleChange = useCallback((value: string) => {

    setStory((prev) => {

      if (!prev) return prev;

      return { ...prev, title: value };

    });

  }, []);



  const handleStorySummaryChange = useCallback((value: string) => {

    setStory((prev) => {

      if (!prev) return prev;

      return { ...prev, summary: value };

    });

  }, []);



  const handleSceneFieldChange = useCallback(

    (

      sceneIndex: number,

      field: "title" | "copy" | "summary" | "visualPrompt",

      value: string,

    ) => {

      setStory((prev) => {

        if (!prev) return prev;

        const scenes = prev.scenes.map((scene) =>

          scene.index === sceneIndex ? { ...scene, [field]: value } : scene,

        );

        return { ...prev, scenes };

      });

    },

    [],

  );



  const handleEnhanceStory = useCallback(async () => {
    const trimmedBasePrompt = basePrompt.trim();
    if (!trimmedBasePrompt) {
      setEnhancementError("Forneca um prompt base para gerar a narrativa.");
      return;
    }

    setIsEnhancing(true);

    setEnhancementError(null);
    setEnhancerDebugRaw(null);
    setEnhancerDebugSegments([]);
    setEnhancerInlineDataCount(null);



    try {

      const res = await fetch("/api/stories/enhance", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          prompt: trimmedBasePrompt,

          sceneCount: clampSceneCount(sceneCount),

          tone: tone.trim() || undefined,

          language,

        }),

      });



      const payload = (await res.json()) as {

        story?: StoryNarrative;

        enhancerModel?: string | null;

        error?: string;

        raw?: string | null;

        rawSegments?: string[] | null;

        inlineDataCount?: number | null;

      };

      const debugRaw =
        typeof payload.raw === "string" && payload.raw.trim().length > 0
          ? payload.raw
          : Array.isArray(payload.rawSegments) && payload.rawSegments.length > 0
            ? payload.rawSegments.join("\n\n")
            : null;
      setEnhancerDebugRaw(debugRaw);
      setEnhancerDebugSegments(Array.isArray(payload.rawSegments) ? payload.rawSegments : []);
      setEnhancerInlineDataCount(
        typeof payload.inlineDataCount === "number"
          ? payload.inlineDataCount
          : Array.isArray(payload.rawSegments)
            ? payload.rawSegments.length
            : null,
      );

      if (!res.ok) {

        throw new Error(payload.error || "Falha ao gerar narrativa");

      }



      if (!payload.story) {

        throw new Error("Resposta invalida do enhancer");

      }



      const normalized = normalizeNarrative(payload.story);

      setStory(normalized);

      setSceneCount(normalized.scenes.length);

      setEnhancerModel(payload.enhancerModel ?? null);
      recordPrompt(trimmedBasePrompt);
      resetPromptHistoryNavigation();

    } catch (error) {

      setEnhancementError(

        error instanceof Error ? error.message : "Nao foi possivel gerar a narrativa",

      );

    } finally {

      setIsEnhancing(false);

    }

  }, [basePrompt, sceneCount, tone, language, refetchCredits, recordPrompt, resetPromptHistoryNavigation]);



  const handleQuickGenerate = useCallback(async () => {
    const trimmedBasePrompt = basePrompt.trim();
    if (!trimmedBasePrompt) {
      setQuickError("Forneca um prompt base para gerar imagens.");
      return;
    }

    const count = clampSceneCount(sceneCount);
    const quickPrompt = [trimmedBasePrompt, tone.trim() ? `Tom: ${tone.trim()}` : null]
      .filter(Boolean)
      .join("\n\n");

    setIsQuickGenerating(true);
    setQuickError(null);

    try {
      const res = await fetch("/api/stories/quick-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: quickPrompt,
          count,
        }),
      });

      const payload = (await res.json()) as {
        images?: QuickDraftImage[];
        error?: string;
        credits?: number | null;
        totalGenerated?: number | null;
      };

      if (!res.ok) {
        throw new Error(payload.error || `Falha ao gerar esboco rapido (HTTP ${res.status})`);
      }

      const images = Array.isArray(payload.images) ? payload.images : [];
      if (images.length === 0) {
        throw new Error("Nenhuma imagem gerada");
      }

      setQuickDraft(images);
      recordPrompt(trimmedBasePrompt);
      resetPromptHistoryNavigation();

      if (typeof payload.credits === "number") {
        setCredits(payload.credits);
      }
      if (typeof payload.totalGenerated === "number") {
        setTotalGenerated(payload.totalGenerated);
      }

      setCurrentRun(null);
      setGenerationError(null);
    } catch (error) {
      setQuickError(error instanceof Error ? error.message : "Nao foi possivel gerar o esboco rapido");
      setQuickDraft(null);
    } finally {
      setIsQuickGenerating(false);
      void refetchCredits();
    }
  }, [basePrompt, sceneCount, tone, refetchCredits, recordPrompt, resetPromptHistoryNavigation]);

  const handleClearQuickDraft = useCallback(() => {
    setQuickDraft(null);
    setQuickError(null);
  }, []);



  const handleGenerateStory = useCallback(async () => {
    if (!story || story.scenes.length === 0) {
      setGenerationError("Gere ou edite a narrativa antes de criar cenas.");
      return;
    }

    const trimmedBasePrompt = basePrompt.trim();
    if (!trimmedBasePrompt) {
      setGenerationError("O prompt base nao pode ficar vazio.");
      return;
    }

    setIsGenerating(true);

    setGenerationError(null);



    const metadata = buildStoryMetadata({

      tone,

      language,

      character: selectedCharacter,

      sceneCount: story.scenes.length,

      storyTitle: story.title ?? null,

    });



    try {

      const res = await fetch("/api/stories/generate", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          basePrompt: trimmedBasePrompt,

          story,

          enhancerModel: enhancerModel ?? undefined,

          tone: tone.trim() || undefined,

          language,

          metadata,

        }),

      });



      const payload = (await res.json()) as {

        run?: Record<string, unknown>;

        frames?: GeneratedFrameResponse[];

        credits?: number | null;

        totalGenerated?: number | null;

        error?: string;

      };



      if (!res.ok) {

        throw new Error(payload.error || "Falha ao gerar as cenas da historia");

      }



      const runId = typeof payload.run?.id === "string" ? payload.run.id : crypto.randomUUID();

      const frames = Array.isArray(payload.frames)

        ? payload.frames.map((frame) => mapGeneratedFrame(frame)).sort((a, b) => a.sceneIndex - b.sceneIndex)

        : [];



      const runView: StoryRunView = {

        id: runId,

        title: (payload.run?.title as string | null) ?? story.title ?? null,

        summary: (payload.run?.summary as string | null) ?? story.summary ?? null,

        sceneCount:

          typeof payload.run?.sceneCount === "number"

            ? (payload.run?.sceneCount as number)

            : story.scenes.length,

        status: (payload.run?.status as string | null) ?? "succeeded",

        createdAt: (payload.run?.createdAt as string | null) ?? new Date().toISOString(),

        metadata:

          (payload.run?.metadata as Record<string, unknown> | null) ?? metadata ?? null,

        enhancerModel: (payload.run?.enhancerModel as string | null) ?? enhancerModel,

        basePrompt: trimmedBasePrompt,

        enhancedPrompt: JSON.stringify(story),

        frames,

      };



      setCurrentRun(runView);

      setSelectedSceneId(frames[0]?.id ?? null);
      recordPrompt(trimmedBasePrompt);
      resetPromptHistoryNavigation();

      setEditInstructions("");



      if (typeof payload.credits === "number") {

        setCredits(payload.credits);

      }

      if (typeof payload.totalGenerated === "number") {

        setTotalGenerated(payload.totalGenerated);

      }



      void refetchCredits();

      await loadHistory();

    } catch (error) {

      setGenerationError(

        error instanceof Error ? error.message : "Nao foi possivel gerar as cenas",

      );

    } finally {

      setIsGenerating(false);

    }

  }, [

    story,

    basePrompt,

    tone,

    language,

    enhancerModel,

    selectedCharacter,

    refetchCredits,

    recordPrompt,

    resetPromptHistoryNavigation,

    loadHistory,

  ]);

  const handleResetStory = useCallback(() => {

    setStory(null);

    setEnhancerModel(null);

    setEnhancementError(null);
    setEnhancerDebugRaw(null);
    setEnhancerDebugSegments([]);
    setEnhancerInlineDataCount(null);

    setGenerationError(null);

    setSceneCount(DEFAULT_SCENE_COUNT);

    setSelectedSceneId(null);

    setCurrentRun(null);

    setEditInstructions("");

    setEditError(null);

  }, []);



  const handleRegenerateScene = useCallback(async () => {

    if (!currentRun || !selectedSceneId) {

      return;

    }

    if (!editInstructions.trim()) {

      setEditError("Descreva como deseja ajustar a cena selecionada.");

      return;

    }



    setIsEditingScene(true);

    setEditError(null);



    try {

      const res = await fetch(`/api/stories/frames/${selectedSceneId}`, {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          instructions: editInstructions.trim(),

        }),

      });



      const payload = (await res.json()) as {

        frame?: GeneratedFrameResponse;

        credits?: number | null;

        totalGenerated?: number | null;

        error?: string;

      };



      if (!res.ok) {

        throw new Error(payload.error || "Falha ao editar a cena");

      }



      if (!payload.frame) {

        throw new Error("Resposta invalida ao editar a cena");

      }



      const updatedFrame = mapGeneratedFrame(payload.frame);



      setCurrentRun((prev) => {

        if (!prev) return prev;

        const frames = prev.frames.map((frame) =>

          frame.id === updatedFrame.id ? { ...frame, ...updatedFrame } : frame,

        );

        return { ...prev, frames };

      });



      setStory((prev) => {

        if (!prev) return prev;

        const scenes = prev.scenes.map((scene) =>

          scene.index === payload.frame?.sceneIndex

            ? { ...scene, visualPrompt: payload.frame?.visualPrompt ?? scene.visualPrompt }

            : scene,

        );

        return { ...prev, scenes };

      });



      setEditInstructions("");



      if (typeof payload.credits === "number") {

        setCredits(payload.credits);

      }

      if (typeof payload.totalGenerated === "number") {

        setTotalGenerated(payload.totalGenerated);

      }



      void refetchCredits();

      await loadHistory();

    } catch (error) {

      setEditError(

        error instanceof Error ? error.message : "Nao foi possivel editar a cena",

      );

    } finally {

      setIsEditingScene(false);

    }

  }, [editInstructions, currentRun, selectedSceneId, refetchCredits, loadHistory]);



  const handleSelectHistoryRun = useCallback(

    (runId: string) => {

      const item = history.find((run) => run.id === runId);

      if (!item) {

        return;

      }



      setCurrentRun(item);

      setSelectedSceneId(item.frames[0]?.id ?? null);



      if (typeof item.basePrompt === "string") {

        handlePromptInputChange(item.basePrompt);

      }



      if (item.enhancedPrompt) {

        const parsed = safeParseEnhancedPrompt(item.enhancedPrompt);

        if (parsed) {

          setStory(parsed);

          setSceneCount(parsed.scenes.length);

        }

      }



      const toneValue = getMetadataString(item.metadata, "tone");

      setTone(toneValue ?? "");



      const languageValue = getMetadataString(item.metadata, "language");

      if (languageValue === "en-US") {

        setLanguage("en-US");

      } else {

        setLanguage("pt-BR");

      }



      const characterValue = getMetadataString(item.metadata, "character");

      if (characterValue && CHARACTER_LIST.some((c) => c.id === characterValue)) {

        setSelectedCharacter(characterValue as CharacterId);

      }



      setEnhancerModel(item.enhancerModel ?? null);
      setEnhancerDebugRaw(null);
      setEnhancerDebugSegments([]);
      setEnhancerInlineDataCount(null);

    },

    [history, handlePromptInputChange],

  );



  const handleDeleteRun = useCallback(

    async (runId: string) => {

      try {

        const res = await fetch(`/api/stories/${runId}`, { method: "DELETE" });

        if (!res.ok) {

          const payload = (await res.json().catch(() => ({}))) as {

            error?: string;

          };

          throw new Error(

            payload.error || `Falha ao excluir historia (HTTP ${res.status})`,

          );

        }

        setHistory((prev) => prev.filter((item) => item.id !== runId));

        if (currentRun?.id === runId) {

          setCurrentRun(null);

          setSelectedSceneId(null);

        }

      } catch (error) {

        setHistoryError(

          error instanceof Error ? error.message : "Nao foi possivel excluir a historia",

        );

      }

    },

    [currentRun],

  );



  const isBusy = isEnhancing || isGenerating || isEditingScene || isQuickGenerating;

  const hasEnhancedStory = Boolean(story && story.scenes.length > 0);



  return (

    <div className="flex h-screen overflow-hidden bg-neutral-950 text-slate-100">

      <StudioSidebar

        credits={credits}

        totalGenerated={totalGenerated}

        isGenerating={isGenerating || isEditingScene}

        onNewChat={undefined}

        onManageCredits={

          isAdmin ? () => router.push("/admin/credits") : undefined

        }

        activeKey="my-stories"

        onSelect={handleSidebarSelect}

        hasUnlimitedCredits={hasUnlimitedCredits}

        isAdmin={isAdmin}

        onAdminNavigate={isAdmin ? () => router.push("/admin") : undefined}

      />



      <div className="flex flex-1 overflow-hidden">

        <div className="flex flex-1 overflow-auto px-6 py-8 lg:px-12">

          <div className="flex h-full w-full flex-col gap-6 xl:flex-row">

            <div className="flex flex-1 flex-col gap-6">

              <StoryComposer

                basePrompt={basePrompt}

                story={story}

                onStoryTitleChange={handleStoryTitleChange}

                onStorySummaryChange={handleStorySummaryChange}

                onSceneFieldChange={handleSceneFieldChange}

                isEnhancing={isEnhancing}

                enhancementError={enhancementError}

                enhancerDebugRaw={enhancerDebugRaw}

                enhancerDebugSegments={enhancerDebugSegments}

                enhancerInlineDataCount={enhancerInlineDataCount}

              />



              <QuickDraftGallery

                draft={quickDraft}

                isLoading={isQuickGenerating}

                error={quickError}

                onClear={handleClearQuickDraft}

              />



              <StorySceneViewer

                run={currentRun}

                selectedSceneId={selectedSceneId}

                onSelectScene={setSelectedSceneId}

                editInstructions={editInstructions}

                onEditInstructionsChange={setEditInstructions}

                onRegenerateScene={handleRegenerateScene}

                isEditing={isEditingScene}

                editError={editError}

                isGenerating={isGenerating}

                generationError={generationError}

                onDeleteStory={currentRun ? () => handleDeleteRun(currentRun.id) : undefined}

              />

              <StoryPromptBar
                basePrompt={basePrompt}
                onBasePromptChange={handlePromptInputChange}
                onPromptKeyDown={handlePromptKeyDown}
                sceneCount={sceneCount}
                onSceneCountChange={(value) => setSceneCount(clampSceneCount(value))}
                isEnhancing={isEnhancing}
                isGenerating={isGenerating}
                isQuickGenerating={isQuickGenerating}
                hasEnhancedStory={hasEnhancedStory}
                onQuickGenerate={handleQuickGenerate}
                onEnhance={handleEnhanceStory}
                onGenerate={handleGenerateStory}
              />



              <StoryHistoryRail

                items={history}

                selectedId={currentRun?.id ?? null}

                onSelect={handleSelectHistoryRun}

                onRefresh={() => void loadHistory()}

                isLoading={historyLoading}

                error={historyError}

                onDelete={handleDeleteRun}

              />

            </div>



            <div className="hidden xl:flex w-[360px] flex-shrink-0">

              <StoriesRightPanel

                className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-[#07070d]"

                basePrompt={basePrompt}

                tone={tone}

                onToneChange={setTone}

                sceneCount={sceneCount}

                onSceneCountChange={(value) => setSceneCount(clampSceneCount(value))}

                onEnhance={handleEnhanceStory}

                onGenerate={handleGenerateStory}

                onQuickGenerate={handleQuickGenerate}

                onReset={handleResetStory}

                isLoading={isBusy}

                isQuickGenerating={isQuickGenerating}

                hasEnhancedStory={hasEnhancedStory}

                enhancerModel={enhancerModel ?? undefined}

                characters={CHARACTER_LIST}

                selectedCharacter={selectedCharacter}

                onCharacterSelect={setSelectedCharacter}

              />

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

interface StoryComposerProps {

  basePrompt: string;

  story: StoryNarrative | null;

  onStoryTitleChange: (value: string) => void;

  onStorySummaryChange: (value: string) => void;

  onSceneFieldChange: (

    sceneIndex: number,

    field: "title" | "copy" | "summary" | "visualPrompt",

    value: string,

  ) => void;

  isEnhancing: boolean;

  enhancementError: string | null;
  enhancerDebugRaw: string | null;
  enhancerDebugSegments: string[];
  enhancerInlineDataCount: number | null;

}



function StoryComposer({
  basePrompt,
  story,
  onStoryTitleChange,
  onStorySummaryChange,
  onSceneFieldChange,
  isEnhancing,
  enhancementError,
  enhancerDebugRaw,
  enhancerDebugSegments,
  enhancerInlineDataCount,
}: StoryComposerProps) {
  const hasBasePrompt = basePrompt.trim().length > 0;

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">Narrativa da historia</h2>
          <p className="text-xs text-white/60">Acompanhe e ajuste o roteiro antes de gerar as cenas.</p>
        </div>
        {isEnhancing && (
          <Badge className="flex items-center gap-2 border border-violet-500/40 bg-violet-500/10 text-[11px] uppercase tracking-[0.2em] text-violet-100">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processando
          </Badge>
        )}
      </header>
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
            Prompt base atual
          </label>
          <div className="min-h-[84px] rounded-xl border border-white/10 bg-white/5 p-4">
            {hasBasePrompt ? (
              <p className="text-sm text-white/80 whitespace-pre-wrap">{basePrompt}</p>
            ) : (
              <p className="text-sm text-white/40">
                Use a barra inferior para definir o prompt base da historia.
              </p>
            )}
          </div>
        </div>

        {enhancementError ? (
          <div className="space-y-2">
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {enhancementError}
            </p>
            {enhancerDebugRaw ? (
              <details className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                <summary className="cursor-pointer text-white/60">Ver saida do modelo</summary>
                {enhancerDebugRaw ? (
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap">{enhancerDebugRaw}</pre>
                ) : null}
                {enhancerDebugSegments.length > 0 ? (
                  <div className="mt-2 space-y-1 rounded-md border border-white/10 bg-black/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Segmentos gerados</p>
                    <ul className="list-disc space-y-1 pl-4 text-[11px] text-white/70">
                      {enhancerDebugSegments.map((segment, index) => (
                        <li key={`segment-${index}`}>{segment}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {typeof enhancerInlineDataCount === "number" && enhancerInlineDataCount > 0 ? (
                  <p className="mt-2 text-[11px] text-white/50">
                    Modelo retornou {enhancerInlineDataCount} anexos inline (imagens ou dados).
                  </p>
                ) : null}
              </details>
            ) : null}
          </div>
        ) : null}

        {story ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Titulo da historia
                </label>
                <Input
                  value={story.title ?? ""}
                  onChange={(event) => onStoryTitleChange(event.target.value)}
                  placeholder="Ultrinho salva o dia"
                  className="border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Resumo
                </label>
                <Textarea
                  value={story.summary ?? ""}
                  onChange={(event) => onStorySummaryChange(event.target.value)}
                  placeholder="Resumo curto do arco narrativo..."
                  className="min-h-[74px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"
                />
              </div>
            </div>

            <div className="space-y-3">
              {story.scenes.map((scene) => (
                <SceneEditorCard
                  key={scene.index}
                  scene={scene}
                  onFieldChange={(field, value) =>
                    onSceneFieldChange(scene.index, field, value)
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <ComposerPlaceholder hasPrompt={hasBasePrompt} />
        )}
      </div>
    </section>
  );
}

interface SceneEditorCardProps {

  scene: StoryScene;

  onFieldChange: (

    field: "title" | "copy" | "summary" | "visualPrompt",

    value: string,

  ) => void;

}



function SceneEditorCard({ scene, onFieldChange }: SceneEditorCardProps) {

  return (

    <article className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">

      <header className="flex items-center justify-between gap-3">

        <Badge className="rounded-full border border-white/10 bg-white/10 text-xs text-white">

          Cena {scene.index}

        </Badge>

        <span className="text-xs text-white/40">Visual + copy</span>

      </header>



      <div className="space-y-2">

        <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">

          Titulo

        </label>

        <Input

          value={scene.title ?? ""}

          onChange={(event) => onFieldChange("title", event.target.value)}

          placeholder="Ultrinho chega com energia"

          className="border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"

        />

      </div>



      <div className="space-y-2">

        <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">

          Visual prompt

        </label>

        <Textarea

          value={scene.visualPrompt}

          onChange={(event) => onFieldChange("visualPrompt", event.target.value)}

          placeholder="Descreva a cena para a IA gerar a imagem..."

          className="min-h-[80px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"

        />

      </div>



      <div className="space-y-2">

        <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">

          Copy

        </label>

        <Textarea

          value={scene.copy ?? ""}

          onChange={(event) => onFieldChange("copy", event.target.value)}

          placeholder="Texto que acompanha a cena..."

          className="min-h-[60px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"

        />

      </div>



      <div className="space-y-2">

        <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">

          Resumo da cena

        </label>

        <Textarea

          value={scene.summary ?? ""}

          onChange={(event) => onFieldChange("summary", event.target.value)}

          placeholder="Resumo curto para referencia..."

          className="min-h-[50px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"

        />

      </div>

    </article>

  );

}



function ComposerPlaceholder({ hasPrompt }: { hasPrompt: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 py-16 text-center text-sm text-white/60">
      <Sparkles className="h-6 w-6 text-white/40" />
      <div className="space-y-1">
        {hasPrompt ? (
          <>
            <p>Gere a narrativa para atualizar as cenas aqui.</p>
            <p className="text-xs text-white/40">Use o botao &quot;Gerar narrativa&quot; na barra inferior.</p>
          </>
        ) : (
          <>
            <p>Use a barra inferior para definir o prompt base da historia.</p>
            <p className="text-xs text-white/40">Depois gere a narrativa e edite cada cena por aqui.</p>
          </>
        )}
      </div>
    </div>
  );
}

interface StorySceneViewerProps {

  run: StoryRunView | null;

  selectedSceneId: string | null;

  onSelectScene: (sceneId: string | null) => void;

  editInstructions: string;

  onEditInstructionsChange: (value: string) => void;

  onRegenerateScene: () => void;

  isEditing: boolean;

  editError: string | null;

  isGenerating: boolean;

  generationError: string | null;

  onDeleteStory?: () => void;

}



function StorySceneViewer({

  run,

  selectedSceneId,

  onSelectScene,

  editInstructions,

  onEditInstructionsChange,

  onRegenerateScene,

  isEditing,

  editError,

  isGenerating,

  generationError,

  onDeleteStory,

}: StorySceneViewerProps) {

  const selectedFrame = useMemo(() => {

    if (!run) return null;

    return (

      run.frames.find((frame) => frame.id === selectedSceneId) ??

      run.frames[0] ??

      null

    );

  }, [run, selectedSceneId]);



  const canRegenerate =

    Boolean(selectedFrame) && editInstructions.trim().length > 3 && !isEditing;



  if (!run) {

    return (

      <section className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/30 p-12 text-center text-sm text-white/60">

        <Sparkles className="h-6 w-6 text-white/40" />

        <p>As imagens da historia aparecerao aqui depois da geracao.</p>

        <p className="text-xs text-white/40">Gere uma narrativa e clique em &quot;Gerar imagens&quot; no painel lateral.</p>

      </section>

    );

  }



  const handlePrev = () => {

    if (!run || !selectedFrame) return;

    const index = run.frames.findIndex((frame) => frame.id === selectedFrame.id);

    if (index > 0) {

      onSelectScene(run.frames[index - 1].id);

    }

  };



  const handleNext = () => {

    if (!run || !selectedFrame) return;

    const index = run.frames.findIndex((frame) => frame.id === selectedFrame.id);

    if (index < run.frames.length - 1) {

      onSelectScene(run.frames[index + 1].id);

    }

  };



  return (

    <section className="flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">

        <div className="space-y-1">

          <h2 className="text-base font-semibold text-white">

            {run.title || "Historia gerada"}

          </h2>

          <p className="text-xs text-white/60">

            {run.summary || "Revise as cenas geradas e ajuste quando necessario."}

          </p>

        </div>

        <div className="flex items-center gap-2">

          <Button

            variant="ghost"

            size="icon"

            className="h-9 w-9 rounded-full border border-white/10 text-white/60 hover:text-white"

            onClick={() => onSelectScene(run.frames[0]?.id ?? null)}

            disabled={run.frames.length === 0}

          >

            <ChevronLeft className="h-4 w-4" />

          </Button>

          <Button

            variant="ghost"

            size="icon"

            className="h-9 w-9 rounded-full border border-white/10 text-white/60 hover:text-white"

            onClick={() => onSelectScene(run.frames[run.frames.length - 1]?.id ?? null)}

            disabled={run.frames.length === 0}

          >

            <ChevronRight className="h-4 w-4" />

          </Button>

          {onDeleteStory && (

            <Button

              variant="ghost"

              size="icon"

              className="h-9 w-9 rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"

              onClick={onDeleteStory}

            >

              <Trash2 className="h-4 w-4" />

            </Button>

          )}

        </div>

      </header>



      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">

        <div className="space-y-4">

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {run.frames.map((frame) => (

              <button

                key={frame.id}

                type="button"

                onClick={() => onSelectScene(frame.id)}

                className={cn(

                  "group relative aspect-[3/4] w-full overflow-hidden rounded-xl border transition",

                  selectedSceneId === frame.id

                    ? "border-[#5b3ef8] shadow-lg shadow-[#5b3ef8]/30"

                    : "border-white/10 hover:border-white/40",

                )}

              >

                {frame.imageUrl ? (

                  <Image

                    src={frame.imageUrl}

                    alt={frame.title || frame.visualPrompt}

                    fill

                    sizes="200px"

                    className="object-cover"

                  />

                ) : (

                  <div className="flex h-full items-center justify-center bg-black/40 text-xs text-white/50">

                    Sem visual

                  </div>

                )}

                <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-2 text-left">

                  <p className="line-clamp-2 text-[11px] text-white/80">

                    {frame.title || frame.visualPrompt}

                  </p>

                </div>

              </button>

            ))}

          </div>



          {generationError ? (

            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">

              {generationError}

            </p>

          ) : null}

        </div>



        <aside className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">

          {selectedFrame ? (

            <div className="space-y-3">

              <div className="flex items-center justify-between gap-3">

                <Badge className="rounded-full border border-white/10 bg-white/10 text-xs text-white">

                  Cena {selectedFrame.sceneIndex}

                </Badge>

                <div className="flex items-center gap-2">

                  <Button

                    variant="ghost"

                    size="icon"

                    className="h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white"

                    onClick={handlePrev}

                    disabled={!run || run.frames.length < 2}

                  >

                    <ChevronLeft className="h-4 w-4" />

                  </Button>

                  <Button

                    variant="ghost"

                    size="icon"

                    className="h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white"

                    onClick={handleNext}

                    disabled={!run || run.frames.length < 2}

                  >

                    <ChevronRight className="h-4 w-4" />

                  </Button>

                </div>

              </div>



              <div className="space-y-1">

                <p className="text-sm font-semibold text-white">

                  {selectedFrame.title || "Cena sem titulo"}

                </p>

                <p className="text-xs text-white/60">{selectedFrame.visualPrompt}</p>

              </div>



              {selectedFrame.copy ? (

                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">

                  {selectedFrame.copy}

                </div>

              ) : null}



              <div className="space-y-2">

                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/60">

                  <PencilLine className="h-3.5 w-3.5" />

                  Ajustar cena

                </label>

                <Textarea

                  value={editInstructions}

                  onChange={(event) => onEditInstructionsChange(event.target.value)}

                  placeholder="Explique como a cena deve mudar..."

                  className="min-h-[90px] border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-2 focus-visible:ring-[#5b3ef8]"

                  disabled={isEditing}

                />

                <Button

                  onClick={onRegenerateScene}

                  disabled={!canRegenerate}

                  className="w-full rounded-xl bg-[#5b3ef8] text-sm font-semibold text-white transition hover:bg-[#6b4ef8]"

                >

                  {isEditing ? (

                    <>

                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                      Editando cena

                    </>

                  ) : (

                    <>

                      <Sparkles className="mr-2 h-4 w-4" />

                      Regenerar cena

                    </>

                  )}

                </Button>

                {editError ? (

                  <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">

                    {editError}

                  </p>

                ) : null}

              </div>

            </div>

          ) : (

            <div className="flex h-full items-center justify-center text-sm text-white/60">

              Nenhuma cena selecionada.

            </div>

          )}



          {isGenerating ? (

            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">

              <span className="flex items-center gap-2">

                <Loader2 className="h-4 w-4 animate-spin" />

                Gerando cenas...

              </span>

            </div>

          ) : null}

        </aside>

      </div>

    </section>

  );

}

interface StoryHistoryRailProps {

  items: StoryRunView[];

  selectedId: string | null;

  onSelect: (runId: string) => void;

  onRefresh: () => void;

  isLoading: boolean;

  error: string | null;

  onDelete: (runId: string) => void;

}



function StoryHistoryRail({

  items,

  selectedId,

  onSelect,

  onRefresh,

  isLoading,

  error,

  onDelete,

}: StoryHistoryRailProps) {

  return (

    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30">

      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">

        <div className="space-y-1">

          <h3 className="text-sm font-semibold text-white">Historias recentes</h3>

          <p className="text-xs text-white/50">Acesse geracoes anteriores e continue a edicao.</p>

        </div>

        <Button

          variant="ghost"

          size="icon"

          className="h-9 w-9 rounded-full border border-white/10 text-white/60 hover:text-white"

          onClick={onRefresh}

          disabled={isLoading}

        >

          <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />

        </Button>

      </header>



      <div className="flex gap-4 overflow-x-auto px-6 py-4">

        {items.length === 0 && !isLoading ? (

          <div className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-white/50">

            Nenhuma historia gerada ainda.

          </div>

        ) : null}



        {items.map((item) => {

          const previewFrame = item.frames[0];

          return (

            <button

              key={item.id}

              type="button"

              onClick={() => onSelect(item.id)}

              className={cn(

                "group relative flex min-w-[220px] flex-col overflow-hidden rounded-xl border bg-black/40 text-left transition",

                selectedId === item.id

                  ? "border-[#5b3ef8] shadow-lg shadow-[#5b3ef8]/30"

                  : "border-white/10 hover:border-white/30",

              )}

            >

              <div className="relative aspect-[3/2]">

                {previewFrame?.imageUrl ? (

                  <Image

                    src={previewFrame.imageUrl}

                    alt={previewFrame.title || item.title || "Story frame"}

                    fill

                    sizes="220px"

                    className="object-cover"

                  />

                ) : (

                  <div className="flex h-full items-center justify-center bg-black/50 text-xs text-white/50">

                    Sem visual

                  </div>

                )}

              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">

                <div className="flex items-start justify-between gap-2">

                  <p className="text-sm font-semibold text-white line-clamp-2">

                    {item.title || "Historia sem titulo"}

                  </p>

                  <Button

                    variant="ghost"

                    size="icon"

                    className="h-7 w-7 rounded-full border border-white/10 text-white/40 opacity-0 transition group-hover:opacity-100"

                    onClick={(event) => {

                      event.stopPropagation();

                      onDelete(item.id);

                    }}

                  >

                    <Trash2 className="h-3.5 w-3.5" />

                  </Button>

                </div>

                <p className="text-xs text-white/50">

                  {formatDateLabel(item.createdAt)}

                </p>

                <p className="text-xs text-white/50">

                  {item.sceneCount} cenas - {item.status}

                </p>

              </div>

            </button>

          );

        })}

      </div>



      {error ? (

        <div className="px-6 pb-4">

          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">

            {error}

          </p>

        </div>

      ) : null}

    </section>

  );

}

interface StoryPromptBarProps {
  basePrompt: string;
  onBasePromptChange: (value: string) => void;
  onPromptKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  sceneCount: number;
  onSceneCountChange: (value: number) => void;
  isEnhancing: boolean;
  isGenerating: boolean;
  isQuickGenerating: boolean;
  hasEnhancedStory: boolean;
  onQuickGenerate: () => void;
  onEnhance: () => void;
  onGenerate: () => void;
}

function StoryPromptBar({
  basePrompt,
  onBasePromptChange,
  onPromptKeyDown,
  sceneCount,
  onSceneCountChange,
  isEnhancing,
  isGenerating,
  isQuickGenerating,
  hasEnhancedStory,
  onQuickGenerate,
  onEnhance,
  onGenerate,
}: StoryPromptBarProps) {
  const trimmedPrompt = basePrompt.trim();
  const actionBusy = hasEnhancedStory ? isGenerating : isEnhancing;
  const isBusy = actionBusy || isQuickGenerating;
  const canSubmit = trimmedPrompt.length > 0 && !isBusy;
  const canQuickGenerate = trimmedPrompt.length > 0 && !isBusy;
  const actionLabel = hasEnhancedStory
    ? isGenerating
      ? "Gerando cenas"
      : "Gerar cenas"
    : isEnhancing
      ? "Processando narrativa"
      : "Gerar narrativa";
  const ActionIcon = hasEnhancedStory ? Sparkles : Wand2;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    if (hasEnhancedStory) {
      onGenerate();
    } else {
      onEnhance();
    }
  };

  const handleQuickSubmit = () => {
    if (!canQuickGenerate) {
      return;
    }
    onQuickGenerate();
  };

  const handleCountChange = (value: number) => {
    onSceneCountChange(clampSceneCount(value));
  };

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-neutral-800/60 backdrop-blur-sm px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-neutral-400 hover:bg-neutral-700/60 hover:text-white"
            title="Adicionar referencia"
            disabled={isBusy}
          >
            <Plus className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 items-center px-3">
            <span className="mr-2 text-xs text-gray-500">/story</span>
            <input
              type="text"
              value={basePrompt}
              onChange={(event) => onBasePromptChange(event.target.value)}
              onKeyDown={(event) => {
                if (onPromptKeyDown) {
                  onPromptKeyDown(event);
                  if (event.defaultPrevented) {
                    return;
                  }
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ultrinho leva novas ofertas para o bairro..."
              className="flex-1 bg-transparent text-base text-white placeholder:text-gray-500 focus:outline-none"
              disabled={isBusy}
            />
          </div>

          <div className="mr-3 flex items-center gap-1">
            <div className="flex items-center rounded-lg bg-neutral-700/40 px-3 py-1">
              <input
                type="number"
                min={2}
                max={10}
                value={sceneCount}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isNaN(value)) {
                    handleCountChange(value);
                  }
                }}
                className="w-10 bg-transparent text-center text-white focus:outline-none"
                disabled={isBusy}
              />
              <div className="ml-1 flex flex-col">
                <button
                  type="button"
                  onClick={() => handleCountChange(sceneCount + 1)}
                  className="h-3 text-neutral-400 transition hover:text-white"
                  disabled={isBusy || sceneCount >= 10}
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCountChange(sceneCount - 1)}
                  className="h-3 text-neutral-400 transition hover:text-white"
                  disabled={isBusy || sceneCount <= 2}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleQuickSubmit}
            disabled={!canQuickGenerate}
            className="h-10 flex-shrink-0 rounded-2xl border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            {isQuickGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando rascunho
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Rascunho rapido
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 flex-shrink-0 rounded-2xl bg-[#5b3ef8] px-6 text-sm font-medium text-white transition hover:bg-[#6b4ef8] disabled:opacity-50"
          >
            {actionBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {hasEnhancedStory ? "Gerando cenas" : "Processando"}
              </>
            ) : (
              <>
                <ActionIcon className="mr-2 h-4 w-4" />
                {actionLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface QuickDraftGalleryProps {
  draft: QuickDraftImage[] | null;
  isLoading: boolean;
  error: string | null;
  onClear: () => void;
}

function QuickDraftGallery({ draft, isLoading, error, onClear }: QuickDraftGalleryProps) {
  if (!draft && !error && !isLoading) {
    return null;
  }

  const hasImages = Array.isArray(draft) && draft.length > 0;

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">Rascunho rapido</h2>
          <p className="text-xs text-white/60">
            Geracao instantanea de imagens com o prompt atual. Use para validar ideias antes de refinar a narrativa.
          </p>
        </div>
        {hasImages ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 rounded-full text-xs text-white/70 hover:text-white"
          >
            Limpar
          </Button>
        ) : null}
      </header>

      <div className="space-y-4 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando imagens...
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {hasImages ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {draft.map((image, index) => {
              const source =
                image.imagePath ||
                image.previewUrl ||
                image.shareUrl ||
                image.description ||
                "";
              if (!source) {
                return null;
              }
              return (
                <div
                  key={image.id ?? `${source}-${index}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <Image
                    src={source}
                    alt={image.description ?? `Imagem rapida ${index + 1}`}
                    width={512}
                    height={512}
                    className="h-full w-full object-cover"
                  />
                  {image.description ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-[11px] text-white/70">
                      {image.description}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {!hasImages && !isLoading && !error ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">
            As imagens aparecerao aqui apos gerar um esboco rapido.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function normalizeNarrative(narrative: StoryNarrative): StoryNarrative {

  return {

    ...narrative,

    scenes: narrative.scenes

      .map((scene, index) => ({

        ...scene,

        index:

          typeof scene.index === "number" && scene.index > 0

            ? scene.index

            : index + 1,

      }))

      .sort((a, b) => a.index - b.index),

  };

}



function mapGeneratedFrame(frame: GeneratedFrameResponse): StorySceneFrame {

  const imageUrl =

    frame.urls?.imagePath ||

    frame.urls?.previewUrl ||

    frame.urls?.shareUrl ||

    null;



  return {

    id: frame.id,

    sceneIndex: frame.sceneIndex,

    title: frame.title ?? null,

    copy: frame.copy ?? null,

    summary: frame.summary ?? null,

    visualPrompt: frame.visualPrompt,

    imageUrl,

    previewUrl: frame.urls?.previewUrl ?? null,

    shareUrl: frame.urls?.shareUrl ?? null,

    backgroundRemovedUrl: frame.urls?.backgroundRemovedUrl ?? null,

    metadata: frame.urls

      ? {

          imagePath: frame.urls.imagePath ?? null,

          previewUrl: frame.urls.previewUrl ?? null,

          shareUrl: frame.urls.shareUrl ?? null,

          backgroundRemovedUrl: frame.urls.backgroundRemovedUrl ?? null,

        }

      : null,

  };

}



function mapHistoryItem(item: {

  run: Record<string, unknown>;

  frames: Record<string, unknown>[];

}): StoryRunView | null {

  if (!item || typeof item !== "object") {

    return null;

  }



  const run = item.run;

  if (!run || typeof run !== "object") {

    return null;

  }



  const frames = Array.isArray(item.frames)

    ? item.frames

        .map((frame) => mapHistoryFrame(frame))

        .filter((frame): frame is StorySceneFrame => Boolean(frame))

        .sort((a, b) => a.sceneIndex - b.sceneIndex)

    : [];



  return {

    id: typeof run.id === "string" ? (run.id as string) : crypto.randomUUID(),

    title: (run.title as string | null) ?? null,

    summary: (run.summary as string | null) ?? null,

    sceneCount: typeof run.sceneCount === "number" ? (run.sceneCount as number) : frames.length,

    status: (run.status as string | null) ?? "succeeded",

    createdAt: (run.createdAt as string | null) ?? null,

    metadata: (run.metadata as Record<string, unknown> | null) ?? null,

    enhancerModel: (run.enhancerModel as string | null) ?? null,

    basePrompt: (run.basePrompt as string | null) ?? null,

    enhancedPrompt: (run.enhancedPrompt as string | null) ?? null,

    frames,

  };

}



function mapHistoryFrame(frame: Record<string, unknown>): StorySceneFrame | null {

  if (!frame || typeof frame !== "object") {

    return null;

  }



  const metadata = (frame.metadata as Record<string, unknown> | null) ?? null;

  const imageUrl = resolveImageUrlFromMetadata(metadata);



  return {

    id: typeof frame.id === "string" ? (frame.id as string) : crypto.randomUUID(),

    sceneIndex: typeof frame.sceneIndex === "number" ? (frame.sceneIndex as number) : 0,

    title: (frame.title as string | null) ?? null,

    copy: (frame.copy as string | null) ?? null,

    summary: (frame.summary as string | null) ?? null,

    visualPrompt: (frame.visualPrompt as string | null) ?? "",

    imageUrl,

    previewUrl: typeof metadata?.previewUrl === "string" ? (metadata.previewUrl as string) : null,

    shareUrl: typeof metadata?.shareUrl === "string" ? (metadata.shareUrl as string) : null,

    backgroundRemovedUrl:

      typeof metadata?.backgroundRemovedUrl === "string"

        ? (metadata.backgroundRemovedUrl as string)

        : null,

    metadata,

  };

}



function resolveImageUrlFromMetadata(

  metadata: Record<string, unknown> | null,

): string | null {

  if (!metadata) return null;

  const candidates = ["imagePath", "previewUrl", "shareUrl", "backgroundRemovedUrl"] as const;

  for (const key of candidates) {

    const value = metadata[key];

    if (typeof value === "string" && value.length > 0) {

      return value;

    }

  }

  return null;

}



function safeParseEnhancedPrompt(raw: string | null): StoryNarrative | null {

  if (!raw) return null;

  try {

    const parsed = JSON.parse(raw);

    const result = STORY_NARRATIVE_SCHEMA.safeParse(parsed);

    if (!result.success) {

      return null;

    }

    return normalizeNarrative(result.data as StoryNarrative);

  } catch {

    return null;

  }

}



function getMetadataString(

  metadata: Record<string, unknown> | null,

  key: string,

): string | null {

  if (!metadata) return null;

  const value = metadata[key];

  return typeof value === "string" ? value : null;

}



function formatDateLabel(value?: string | null) {

  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {

    return "Hoje";

  }

  return new Intl.DateTimeFormat("pt-BR", {

    day: "numeric",

    month: "short",

    hour: "numeric",

    minute: "2-digit",

  }).format(date);

}



function buildStoryMetadata(params: {

  tone: string;

  language: "pt-BR" | "en-US";

  character: CharacterId;

  sceneCount: number;

  storyTitle: string | null;

}) {

  const metadata: Record<string, unknown> = {

    language: params.language,

    character: params.character,

    sceneCount: params.sceneCount,

  };

  if (params.tone.trim()) {

    metadata.tone = params.tone.trim();

  }

  if (params.storyTitle) {

    metadata.storyTitle = params.storyTitle;

  }

  return metadata;

}
















