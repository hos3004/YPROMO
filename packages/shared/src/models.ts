export type PromoDurationSec = 30 | 45 | 60;
export type PromoTone = 'political_teaser' | 'historical_serious' | 'investigative' | 'emotional_dramatic';
export type AspectRatio = '16:9' | '9:16' | 'both';
export type SceneAssetType = 'film_clip' | 'ai_video' | 'ai_image' | 'title_card' | 'overlay_only' | 'placeholder';
export type TextAnimationPreset =
  | 'cinematic_lower_third'
  | 'big_center_question'
  | 'typewriter_historical_text'
  | 'breaking_headline'
  | 'minimal_documentary_caption'
  | 'final_title_card';

export type SceneAsset = {
  id: string;
  type: SceneAssetType;
  path?: string;
  previewUrl?: string;
  label: string;
  trimStartSec?: number;
  trimEndSec?: number;
};

export type PromptPackage = {
  shortPrompt: string;
  detailedPrompt: string;
  negativePrompt: string;
  suggestedDurationSec: number;
  cameraMovement: string;
  suggestedAspectRatio: '16:9' | '9:16';
  disclosureRequired: boolean;
};

export type PromoScene = {
  id: string;
  sceneNumber: number;
  startSec: number;
  durationSec: number;
  voiceoverText: string;
  visualIntent: string;
  suggestedSourceFootage: string;
  assetType: SceneAssetType;
  asset?: SceneAsset;
  videoPrompt: PromptPackage;
  imagePrompt: PromptPackage;
  textOverlay: string;
  textPreset: TextAnimationPreset;
  notes: string;
  approved: boolean;
};

export type PromoScriptVersion = {
  id: string;
  label: string;
  text: string;
  wordCount: number;
  estimatedDurationSec: number;
  selected: boolean;
};

export type VoiceoverTrack = {
  id: string;
  provider: string;
  path?: string;
  text: string;
  durationMs: number;
  volume: number;
  voiceName?: string;
};

export type MusicTrack = {
  id: string;
  path: string;
  name: string;
  volume: number;
  fadeInSec: number;
  fadeOutSec: number;
};

export type OverlayLayer = {
  id: string;
  path: string;
  name: string;
  opacity: number;
  behavior: 'full_video' | 'intro_only' | 'end_only' | 'per_scene';
};

export type TextLayer = {
  id: string;
  sceneId: string;
  text: string;
  preset: TextAnimationPreset;
};

export type EndVideo = {
  enabled: boolean;
  path?: string;
  durationSec?: number;
};

export type RenderPreset = {
  id: string;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  fps: number;
  codec: 'h264';
  audioCodec: 'aac';
  quality: 'draft' | 'standard' | 'high';
};

export type ProviderSettings = {
  textProvider: 'mock' | 'gemini' | 'openai';
  ttsProvider: 'mock' | 'gemini' | 'elevenlabs' | 'manual';
  apiKeys: Record<string, string>;
  textModel: string;
  ttsModel: string;
  ttsVoice: string;
  defaultVoiceStyle: string;
  defaultAspectRatio: AspectRatio;
  defaultExportFolder: string;
  defaultMusicFolder: string;
  defaultOverlayFolder: string;
  defaultEndVideo?: string;
  defaultFont?: string;
  renderQuality: RenderPreset['quality'];
};

export type PromoProject = {
  schemaVersion: 1;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  documentaryVideoPath?: string;
  documentaryScript: string;
  durationSec: PromoDurationSec;
  tone: PromoTone;
  aspectRatio: AspectRatio;
  scriptVersions: PromoScriptVersion[];
  selectedScriptId?: string;
  scenes: PromoScene[];
  voiceover?: VoiceoverTrack;
  music?: MusicTrack;
  overlays: OverlayLayer[];
  endVideo: EndVideo;
  renderPreset: RenderPreset;
};

export type AssetSnapshot = {
  music: Array<{ name: string; path: string; url: string }>;
  overlays: Array<{ name: string; path: string; url: string }>;
  endVideos: Array<{ name: string; path: string; url: string }>;
  titleCards: Array<{ name: string; path: string; url: string }>;
};
