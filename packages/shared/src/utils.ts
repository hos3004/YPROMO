import type { AspectRatio, PromoProject, RenderPreset } from './models';

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function countArabicWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateArabicVoiceoverDurationSec(text: string): number {
  const words = countArabicWords(text);
  return Math.max(1, Math.round((words / 2.35) * 10) / 10);
}

export function renderPresetForAspectRatio(aspectRatio: AspectRatio): RenderPreset {
  const vertical = aspectRatio === '9:16';
  return {
    id: vertical ? 'vertical-standard' : 'wide-standard',
    aspectRatio,
    width: vertical ? 1080 : 1920,
    height: vertical ? 1920 : 1080,
    fps: 25,
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'standard',
  };
}

export function createEmptyProject(): PromoProject {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: createId('project'),
    title: 'Untitled Documentary Promo',
    createdAt: now,
    updatedAt: now,
    documentaryScript: '',
    durationSec: 60,
    tone: 'historical_serious',
    aspectRatio: '16:9',
    scriptVersions: [],
    scenes: [],
    overlays: [],
    endVideo: { enabled: false },
    renderPreset: renderPresetForAspectRatio('16:9'),
  };
}
