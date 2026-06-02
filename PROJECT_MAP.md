# YPROMO Project Map

## [TECH_STACK]
Tauri 2, React 19, TypeScript 6, Rust backend commands, Vite 8, Remotion 4 where useful for timeline rendering, FFmpeg/FFprobe, local JSON storage.

## [SYSTEM_FLOW]
Input documentary footage/script -> generate promo scripts -> select/edit script -> generate scene breakdown -> assign assets/voice/music/overlays -> preview -> export MP4.

Current implemented flow: input -> mock script options -> editable selected script -> mock scene board -> copyable image/video prompts -> asset snapshot -> draft timeline JSON export.

## [ARCHITECTURE]
Tauri/Rust backend owns filesystem, settings, dialogs, local command execution, and future render orchestration. Renderer owns the production workflow UI. Shared packages define models, validation, duration helpers, and provider interfaces. Render package maps a `PromoProject` into Remotion compositions when the render milestone is active.

## [DATA_MODELS]
Core models live in `packages/shared/src/models.ts`: `PromoProject`, `PromoScriptVersion`, `PromoScene`, `SceneAsset`, `VoiceoverTrack`, `MusicTrack`, `OverlayLayer`, `TextLayer`, `EndVideo`, `RenderPreset`, `ProviderSettings`.

## [PROVIDER_INTERFACES]
Provider contracts live in `packages/shared/src/providers.ts`. MVP starts with deterministic mock providers, then adds real adapters behind the same interfaces.

Implemented: `mockTextAnalysisProvider` and `mockTtsProvider` in `packages/shared/src/mockProviders.ts`.

## [ASSET_STRUCTURE]
`assets/music`, `assets/overlays`, `assets/end-videos`, `assets/fonts`, `assets/title-cards`, `assets/generated/images`, `assets/generated/videos`, `assets/generated/voiceovers`, `assets/exports`.

## [RENDER_PIPELINE]
Milestone 6 adds preview/export through Rust commands that invoke Node/Remotion and FFmpeg as child processes. Output targets: 1920x1080, 1080x1920, H.264/AAC MP4.

Implemented so far: `packages/render/src/timeline.ts` builds a frame-accurate timeline plan. Tauri command `export_draft_plan` writes this plan to `assets/exports` for verification before MP4 rendering.

## [KNOWN_LIMITATIONS]
MVP uses manual footage assignment and mock AI providers until real adapters are configured. It is not a full NLE.

Local Rust/Tauri verification is currently blocked by the Windows MSVC linker missing `msvcrt.lib`; TypeScript, Vite build, and provider/timeline tests pass.

## [ORPHANS & PENDING]
No orphan modules yet. Pending: real AI adapters, true voiceover import/generation, Remotion MP4 render command, packaged app validation after MSVC linker is fixed.
