import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import { Film, FileText, WandSparkles, Mic2, Music2, Upload, Save, Play, Download, Settings } from 'lucide-react';
import {
  AssetSnapshot,
  PromoProject,
  PromoScene,
  ProviderSettings,
  createEmptyProject,
  estimateArabicVoiceoverDurationSec,
  mockTextAnalysisProvider,
} from '@shared/index';
import { buildTimelinePlan } from '@render/index';
import './styles.css';

type Tab = 'input' | 'scripts' | 'scenes' | 'assets' | 'export' | 'settings';

const defaultSettings: ProviderSettings = {
  textProvider: 'mock',
  ttsProvider: 'mock',
  apiKeys: {},
  textModel: 'mock-documentary-writer',
  ttsModel: 'mock-tts',
  ttsVoice: 'mock-ar-doc',
  defaultVoiceStyle: 'Calm Arabic documentary narrator, serious and escalating.',
  defaultAspectRatio: '16:9',
  defaultExportFolder: '',
  defaultMusicFolder: '',
  defaultOverlayFolder: '',
  renderQuality: 'standard',
};

function App() {
  const [tab, setTab] = useState<Tab>('input');
  const [project, setProject] = useState<PromoProject>(() => createEmptyProject());
  const [assets, setAssets] = useState<AssetSnapshot>({ music: [], overlays: [], endVideos: [], titleCards: [] });
  const [settings, setSettings] = useState<ProviderSettings>(defaultSettings);
  const [status, setStatus] = useState('جاهز');

  useEffect(() => {
    invoke<{ assets: AssetSnapshot }>('bootstrap')
      .then((data) => setAssets(data.assets))
      .catch((error) => setStatus(String(error)));
    invoke<Partial<ProviderSettings>>('get_settings')
      .then((saved) => setSettings({ ...defaultSettings, ...saved }))
      .catch(() => undefined);
  }, []);

  const selectedScript = useMemo(
    () => project.scriptVersions.find((script) => script.id === project.selectedScriptId) || project.scriptVersions[0],
    [project.scriptVersions, project.selectedScriptId],
  );

  async function generateScripts() {
    setStatus('جاري توليد 3 نسخ سكربت...');
    const scripts = await mockTextAnalysisProvider.generatePromoScripts({
      title: project.title,
      sourceScript: project.documentaryScript,
      durationSec: project.durationSec,
      tone: project.tone,
    });
    setProject((current) => ({ ...current, scriptVersions: scripts, selectedScriptId: scripts[0]?.id, updatedAt: new Date().toISOString() }));
    setTab('scripts');
    setStatus('تم توليد السكربتات');
  }

  async function generateScenes() {
    if (!selectedScript) return;
    setStatus('جاري بناء المشاهد والبرومبتات...');
    const scenes = await mockTextAnalysisProvider.generateSceneBreakdown({
      title: project.title,
      sourceScript: project.documentaryScript,
      durationSec: project.durationSec,
      tone: project.tone,
      selectedScript: selectedScript.text,
    });
    setProject((current) => ({ ...current, scenes, updatedAt: new Date().toISOString() }));
    setTab('scenes');
    setStatus('تم إنشاء Scene Board');
  }

  async function saveProject() {
    const result = await invoke<{ path: string }>('save_project', { project });
    setStatus(`تم الحفظ: ${result.path}`);
  }

  async function saveSettings() {
    await invoke('save_settings', { settings });
    setStatus('تم حفظ الإعدادات');
  }

  async function exportDraftPlan() {
    const timeline = buildTimelinePlan(project);
    const result = await invoke<{ path: string }>('export_draft_plan', { timeline });
    setStatus(`تم إنشاء draft timeline: ${result.path}`);
  }

  function updateScene(sceneId: string, patch: Partial<PromoScene>) {
    setProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene)),
      updatedAt: new Date().toISOString(),
    }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Film size={26} />
          <div>
            <strong>YPROMO</strong>
            <span>Documentary Promo Builder</span>
          </div>
        </div>
        <NavButton active={tab === 'input'} icon={<FileText size={18} />} label="Input" onClick={() => setTab('input')} />
        <NavButton active={tab === 'scripts'} icon={<WandSparkles size={18} />} label="Scripts" onClick={() => setTab('scripts')} />
        <NavButton active={tab === 'scenes'} icon={<Film size={18} />} label="Scene Board" onClick={() => setTab('scenes')} />
        <NavButton active={tab === 'assets'} icon={<Music2 size={18} />} label="Assets" onClick={() => setTab('assets')} />
        <NavButton active={tab === 'export'} icon={<Download size={18} />} label="Export" onClick={() => setTab('export')} />
        <NavButton active={tab === 'settings'} icon={<Settings size={18} />} label="Settings" onClick={() => setTab('settings')} />
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{project.title}</h1>
            <p>{status}</p>
          </div>
          <button className="icon-text" onClick={saveProject}><Save size={17} /> حفظ المشروع</button>
        </header>

        {tab === 'input' && (
          <section className="workspace two-col">
            <div className="panel">
              <h2>المدخلات</h2>
              <label>عنوان البرومو</label>
              <input value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />
              <label>سكريبت الفيلم الوثائقي</label>
              <textarea rows={15} value={project.documentaryScript} onChange={(e) => setProject({ ...project, documentaryScript: e.target.value })} />
            </div>
            <div className="panel compact">
              <h2>إعداد البرومو</h2>
              <label>المدة</label>
              <select value={project.durationSec} onChange={(e) => setProject({ ...project, durationSec: Number(e.target.value) as 30 | 45 | 60 })}>
                <option value={60}>60 ثانية</option>
                <option value={45}>45 ثانية</option>
                <option value={30}>30 ثانية</option>
              </select>
              <label>النبرة</label>
              <select value={project.tone} onChange={(e) => setProject({ ...project, tone: e.target.value as PromoProject['tone'] })}>
                <option value="historical_serious">تاريخي جاد</option>
                <option value="political_teaser">سياسي تشويقي</option>
                <option value="investigative">تحقيقي</option>
                <option value="emotional_dramatic">درامي عاطفي</option>
              </select>
              <label>المقاس</label>
              <select value={project.aspectRatio} onChange={(e) => setProject({ ...project, aspectRatio: e.target.value as PromoProject['aspectRatio'] })}>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="both">كلاهما</option>
              </select>
              <button className="primary" onClick={generateScripts} disabled={!project.documentaryScript.trim()}>
                <WandSparkles size={18} /> توليد السكربتات
              </button>
            </div>
          </section>
        )}

        {tab === 'scripts' && (
          <section className="workspace">
            <div className="section-head">
              <h2>Script Options</h2>
              <button className="primary" onClick={generateScenes} disabled={!selectedScript}>بناء المشاهد</button>
            </div>
            <div className="script-grid">
              {project.scriptVersions.map((script) => (
                <article key={script.id} className={`script-card ${script.id === project.selectedScriptId ? 'selected' : ''}`}>
                  <button className="select-btn" onClick={() => setProject({ ...project, selectedScriptId: script.id })}>اختيار</button>
                  <h3>{script.label}</h3>
                  <textarea value={script.text} onChange={(e) => setProject((current) => ({
                    ...current,
                    scriptVersions: current.scriptVersions.map((item) => item.id === script.id ? {
                      ...item,
                      text: e.target.value,
                      wordCount: e.target.value.trim().split(/\s+/).filter(Boolean).length,
                      estimatedDurationSec: estimateArabicVoiceoverDurationSec(e.target.value),
                    } : item),
                  }))} />
                  <footer>{script.wordCount} كلمة · ~{script.estimatedDurationSec}ث</footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'scenes' && (
          <section className="workspace">
            <div className="section-head">
              <h2>Scene Board</h2>
              <button onClick={() => setTab('assets')}>التالي: الصوت والأصول</button>
            </div>
            <div className="scene-list">
              {project.scenes.map((scene) => (
                <article className="scene-row" key={scene.id}>
                  <div className="scene-time">{scene.sceneNumber}<span>{scene.startSec}s / {scene.durationSec}s</span></div>
                  <div className="scene-edit">
                    <textarea value={scene.voiceoverText} onChange={(e) => updateScene(scene.id, { voiceoverText: e.target.value })} />
                    <input value={scene.textOverlay} onChange={(e) => updateScene(scene.id, { textOverlay: e.target.value })} />
                  </div>
                  <div className="scene-prompts">
                    <p>{scene.visualIntent}</p>
                    <button onClick={() => navigator.clipboard.writeText(scene.videoPrompt.detailedPrompt)}>Copy video prompt</button>
                    <button onClick={() => navigator.clipboard.writeText(scene.imagePrompt.detailedPrompt)}>Copy image prompt</button>
                    <label className="check"><input type="checkbox" checked={scene.approved} onChange={(e) => updateScene(scene.id, { approved: e.target.checked })} /> Approved</label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'assets' && (
          <section className="workspace two-col">
            <div className="panel">
              <h2><Mic2 size={18} /> Voiceover</h2>
              <textarea rows={8} value={selectedScript?.text || ''} readOnly />
              <p>Mock TTS يقدّر المدة فقط في MVP. استيراد وتوليد فعلي سيضافان في مرحلة الربط.</p>
            </div>
            <div className="panel">
              <h2><Music2 size={18} /> Assets</h2>
              <AssetList title="Music" count={assets.music.length} />
              <AssetList title="Overlays" count={assets.overlays.length} />
              <AssetList title="End Videos" count={assets.endVideos.length} />
              <AssetList title="Title Cards" count={assets.titleCards.length} />
              <button onClick={() => invoke<AssetSnapshot>('list_assets').then(setAssets)}><Upload size={17} /> تحديث الأصول</button>
            </div>
          </section>
        )}

        {tab === 'export' && (
          <section className="workspace two-col">
            <div className="panel preview-panel">
              <h2><Play size={18} /> Preview</h2>
              <div className="preview-box">
                <strong>{project.title}</strong>
                <span>{project.scenes.length} scenes · {project.durationSec}s · {project.aspectRatio}</span>
              </div>
            </div>
            <div className="panel compact">
              <h2>Export</h2>
              <p>الرندر النهائي سيُفعّل في Milestone 6 عبر Rust command يشغّل Remotion/FFmpeg.</p>
              <button onClick={exportDraftPlan}><FileText size={18} /> حفظ خطة الرندر JSON</button>
              <button className="primary" onClick={() => invoke('open_exports_folder')}><Download size={18} /> فتح مجلد التصدير</button>
            </div>
          </section>
        )}

        {tab === 'settings' && (
          <section className="workspace">
            <div className="panel settings-panel">
              <h2>Settings</h2>
              <label>Text Provider</label>
              <select value={settings.textProvider} onChange={(e) => setSettings({ ...settings, textProvider: e.target.value as ProviderSettings['textProvider'] })}>
                <option value="mock">Mock</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
              <label>Text model</label>
              <input value={settings.textModel} onChange={(e) => setSettings({ ...settings, textModel: e.target.value })} />
              <label>Gemini API key</label>
              <input
                type="password"
                placeholder="AIza..."
                value={settings.apiKeys.gemini || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  apiKeys: { ...settings.apiKeys, gemini: e.target.value.trim() },
                })}
              />
              <label>TTS provider</label>
              <select value={settings.ttsProvider} onChange={(e) => setSettings({ ...settings, ttsProvider: e.target.value as ProviderSettings['ttsProvider'] })}>
                <option value="mock">Mock</option>
                <option value="gemini">Gemini</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="manual">Manual</option>
              </select>
              <label>Voice style</label>
              <textarea value={settings.defaultVoiceStyle} onChange={(e) => setSettings({ ...settings, defaultVoiceStyle: e.target.value })} />
              <button className="primary" onClick={saveSettings}>حفظ الإعدادات</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function NavButton(props: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-btn ${props.active ? 'active' : ''}`} onClick={props.onClick}>{props.icon}<span>{props.label}</span></button>;
}

function AssetList(props: { title: string; count: number }) {
  return <div className="asset-line"><span>{props.title}</span><strong>{props.count}</strong></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
