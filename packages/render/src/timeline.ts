import type { PromoProject, PromoScene } from '@shared/index';

export type TimelineClip = {
  id: string;
  sceneId: string;
  fromFrame: number;
  durationFrames: number;
  assetPath?: string;
  assetType: PromoScene['assetType'];
  voiceoverText: string;
  textOverlay: string;
};

export type TimelinePlan = {
  fps: number;
  width: number;
  height: number;
  durationFrames: number;
  clips: TimelineClip[];
  musicPath?: string;
  musicVolume: number;
  voiceoverPath?: string;
  voiceoverVolume: number;
  overlayPaths: string[];
  endVideoPath?: string;
};

export function buildTimelinePlan(project: PromoProject): TimelinePlan {
  const fps = project.renderPreset.fps;
  const clips = project.scenes.map((scene) => ({
    id: `clip-${scene.id}`,
    sceneId: scene.id,
    fromFrame: Math.round(scene.startSec * fps),
    durationFrames: Math.max(1, Math.round(scene.durationSec * fps)),
    assetPath: scene.asset?.path,
    assetType: scene.assetType,
    voiceoverText: scene.voiceoverText,
    textOverlay: scene.textOverlay,
  }));

  const sceneFrames = clips.reduce((max, clip) => Math.max(max, clip.fromFrame + clip.durationFrames), 0);
  const targetFrames = Math.round(project.durationSec * fps);

  return {
    fps,
    width: project.renderPreset.width,
    height: project.renderPreset.height,
    durationFrames: Math.max(sceneFrames, targetFrames),
    clips,
    musicPath: project.music?.path,
    musicVolume: project.music?.volume ?? 45,
    voiceoverPath: project.voiceover?.path,
    voiceoverVolume: project.voiceover?.volume ?? 100,
    overlayPaths: project.overlays.map((overlay) => overlay.path),
    endVideoPath: project.endVideo.enabled ? project.endVideo.path : undefined,
  };
}
