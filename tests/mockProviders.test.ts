import { describe, expect, it } from 'vitest';
import { createEmptyProject, mockTextAnalysisProvider } from '@shared/index';

describe('mockTextAnalysisProvider', () => {
  it('generates editable script options and a scene board', async () => {
    const project = createEmptyProject();
    const scripts = await mockTextAnalysisProvider.generatePromoScripts({
      title: 'اختبار وثائقي',
      sourceScript: 'بدأت الحكاية بقرار سياسي ترك أثرًا طويلًا في المجتمع.',
      durationSec: 60,
      tone: 'historical_serious',
    });

    expect(scripts).toHaveLength(3);
    expect(scripts[0].wordCount).toBeGreaterThan(10);

    const scenes = await mockTextAnalysisProvider.generateSceneBreakdown({
      title: project.title,
      sourceScript: 'بدأت الحكاية بقرار سياسي ترك أثرًا طويلًا في المجتمع.',
      durationSec: 60,
      tone: 'historical_serious',
      selectedScript: scripts[0].text,
    });

    expect(scenes).toHaveLength(9);
    expect(scenes[0].imagePrompt.detailedPrompt).toContain('documentary');
  });
});
