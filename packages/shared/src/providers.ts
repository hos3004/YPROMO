import type { PromoDurationSec, PromoScene, PromoScriptVersion, PromoTone } from './models';

export type GeneratePromoScriptsInput = {
  title: string;
  sourceScript: string;
  durationSec: PromoDurationSec;
  tone: PromoTone;
};

export type GenerateSceneBreakdownInput = GeneratePromoScriptsInput & {
  selectedScript: string;
};

export type TextAnalysisProvider = {
  id: string;
  analyzeScript(input: { sourceScript: string }): Promise<{ summary: string; factualBoundaries: string[] }>;
  extractPromoAngles(input: { sourceScript: string }): Promise<string[]>;
  generatePromoScripts(input: GeneratePromoScriptsInput): Promise<PromoScriptVersion[]>;
  generateSceneBreakdown(input: GenerateSceneBreakdownInput): Promise<PromoScene[]>;
};

export type TTSProvider = {
  id: string;
  listVoices(): Promise<Array<{ id: string; name: string; language: string }>>;
  estimateDuration(input: { text: string }): Promise<{ durationMs: number; words: number }>;
  synthesizeVoiceover(input: {
    text: string;
    voiceName: string;
    styleInstruction: string;
    outputDir: string;
  }): Promise<{ path: string; durationMs: number }>;
};

export type ImageGenerationPromptProvider = {
  id: string;
  generateImagePromptForScene(input: { scene: PromoScene; aspectRatio: '16:9' | '9:16' }): Promise<PromoScene['imagePrompt']>;
};

export type VideoGenerationPromptProvider = {
  id: string;
  generateVideoPromptForScene(input: { scene: PromoScene; aspectRatio: '16:9' | '9:16' }): Promise<PromoScene['videoPrompt']>;
};

export type RenderProvider = {
  id: string;
  renderPreview(input: { projectPath?: string }): Promise<{ previewUrl?: string }>;
  renderFinal(input: { projectPath?: string; outputDir: string }): Promise<{ outputPaths: string[] }>;
};
