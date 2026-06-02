import { describe, expect, it } from 'vitest';
import { createEmptyProject, mockTextAnalysisProvider } from '@shared/index';
import { buildTimelinePlan } from '@render/index';

describe('buildTimelinePlan', () => {
  it('creates a frame timeline for a 60-second promo', async () => {
    const project = createEmptyProject();
    const scripts = await mockTextAnalysisProvider.generatePromoScripts({
      title: 'وثائقي اختباري',
      sourceScript: 'نص وثائقي طويل يكشف تسلسل الأحداث ونتائجها السياسية والاجتماعية.',
      durationSec: 60,
      tone: 'investigative',
    });
    project.scriptVersions = scripts;
    project.selectedScriptId = scripts[0].id;
    project.scenes = await mockTextAnalysisProvider.generateSceneBreakdown({
      title: project.title,
      sourceScript: project.documentaryScript,
      durationSec: 60,
      tone: project.tone,
      selectedScript: scripts[0].text,
    });

    const timeline = buildTimelinePlan(project);
    expect(timeline.fps).toBe(25);
    expect(timeline.durationFrames).toBeGreaterThanOrEqual(1500);
    expect(timeline.clips).toHaveLength(9);
  });
});
