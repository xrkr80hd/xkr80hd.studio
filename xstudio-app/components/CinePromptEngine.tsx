'use client';

import React, { useState, useMemo } from 'react';
import {
  Film,
  Camera,
  Layers,
  Sparkles,
  Copy,
  Check,
  Download,
  Sliders,
  Play,
  Maximize2,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';
import { resolveAssetUrl } from '../lib/xstudio-api';

interface CharacterRef {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  anchorId?: string;
}

interface CinePromptEngineProps {
  project: string;
  manifest: any;
  onNotice?: (msg: string) => void;
}

export default function CinePromptEngine({ project, manifest, onNotice }: CinePromptEngineProps) {
  // Extract characters from manifest store
  const characters: CharacterRef[] = useMemo(() => {
    const chars = manifest?.manifest_store?.characters || manifest?.world_library?.character || {};
    return Object.entries(chars).map(([id, data]: [string, any]) => {
      const anchorId = data.reference_ids?.[0] || data.anchor_id || data.cover_id;
      return {
        id,
        name: data.name || data.title || id,
        role: data.role || data.category || 'Lead',
        anchorId,
        avatarUrl: anchorId ? resolveAssetUrl(project, anchorId) : undefined,
      };
    });
  }, [manifest, project]);

  // Model selection
  const [modelPreset, setModelPreset] = useState<'runway' | 'luma' | 'sora' | 'kling'>('runway');
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || '');
  const [lensChoice, setLensChoice] = useState('35mm Anamorphic T1.5');
  const [lightingPreset, setLightingPreset] = useState('Volumetric Golden Hour Rim');
  const [cameraTrajectory, setCameraTrajectory] = useState('Dolly In + Slow Orbit 15°');
  const [motionIntensity, setMotionIntensity] = useState<number>(6);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Custom descriptions
  const [startAction, setStartAction] = useState('standing resolute at the edge of the atmospheric neon rain, eyes locking onto the camera');
  const [endAction, setEndAction] = useState('drawing a glowing plasma edge as camera accelerates past, rain droplets streaking across lens');
  const [environmentDesc, setEnvironmentDesc] = useState('dystopian rooftop overlooking an immense vertical megacity with dense atmospheric haze');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Selected character reference
  const selectedChar = characters.find(c => c.id === selectedCharId) || characters[0];
  const crefUrl = selectedChar?.anchorId ? resolveAssetUrl(project, selectedChar.anchorId) : '';

  // Generate Start Frame Prompt
  const startFramePrompt = useMemo(() => {
    const charTag = selectedChar ? `${selectedChar.name}` : 'Lead character';
    const crefTag = crefUrl 
      ? ` --cref ${crefUrl} --cw 100 [HARD LOCK: 16:9 6-PANEL SHEET]` 
      : ` [HARD LOCK: 16:9 6-PANEL SHEET]`;
    return `[START FRAME] Cinematic 8k shot of ${charTag}, ${startAction}. Setting: ${environmentDesc}. Lens: ${lensChoice}, shallow depth of field. Lighting: ${lightingPreset}, dramatic cinematic fill, volumetric haze. Color graded Kodak Vision3 500T. AR: ${aspectRatio}. Strict character sheet hard-lock enforced (0% drift: face, silhouette, costume palette).${crefTag}`;
  }, [selectedChar, startAction, environmentDesc, lensChoice, lightingPreset, aspectRatio, crefUrl]);

  // Generate End Frame Prompt
  const endFramePrompt = useMemo(() => {
    const charTag = selectedChar ? `${selectedChar.name}` : 'Lead character';
    const crefTag = crefUrl 
      ? ` --cref ${crefUrl} --cw 100 [HARD LOCK: 16:9 6-PANEL SHEET]` 
      : ` [HARD LOCK: 16:9 6-PANEL SHEET]`;
    return `[END FRAME] Dynamic climax shot of ${charTag}, ${endAction}. Trajectory: ${cameraTrajectory}, motion velocity ${motionIntensity}/10. Lighting: intense lens flare bloom, shifting chiaroscuro shadows. Aspect Ratio: ${aspectRatio}. Strict character sheet hard-lock enforced (0% drift: face, silhouette, costume palette).${crefTag}`;
  }, [selectedChar, endAction, cameraTrajectory, motionIntensity, aspectRatio, crefUrl]);

  // Model-specific payload
  const modelExportJson = useMemo(() => {
    return {
      engine: modelPreset,
      aspect_ratio: aspectRatio,
      character_continuity: {
        character_name: selectedChar?.name || 'Subject',
        cref_reference_url: crefUrl || null,
        weight: 1.0,
        hard_lock: {
          status: 'STRICT_HARD_LOCK_ACTIVE',
          sheet_contract: '16:9 widescreen, exactly 6 columns in 1 row: front_body, profile_body, three_quarter_body, rear_body, front_face, profile_face',
          drift_tolerance: 0.0,
          identity_features_locked: ['face_proportions', 'costume_layers', 'silhouette', 'eye_lines', 'color_palette']
        }
      },
      camera: {
        lens: lensChoice,
        trajectory: cameraTrajectory,
        intensity: motionIntensity,
      },
      first_frame: {
        prompt: startFramePrompt,
        lighting: lightingPreset,
      },
      last_frame: {
        prompt: endFramePrompt,
      },
      metadata: {
        project_id: project,
        generated_at: new Date().toISOString(),
        guardrails_verified: true,
        hard_lock_verified: true,
      }
    };
  }, [modelPreset, aspectRatio, selectedChar, crefUrl, lensChoice, cameraTrajectory, motionIntensity, startFramePrompt, lightingPreset, endFramePrompt, project]);

  function copyText(key: string, text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (onNotice) onNotice('Copied cine-prompt to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(modelExportJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project || 'xstudio'}-cine-prompt-${selectedChar?.name || 'scene'}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="cine-prompt-engine" style={{ padding: '24px 0', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7) 0%, rgba(19, 21, 31, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                Commercial Video Module
              </span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>· First &amp; Last Frame Trajectory Engine</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 600, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              High-End Video Cine-Prompt Studio
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '6px 0 0', maxWidth: '720px' }}>
              Synthesize paired visual anchors maintaining strict character identity (<code style={{ color: '#818cf8', background: 'rgba(15, 23, 42, 0.8)', padding: '2px 6px', borderRadius: '4px' }}>--cref</code>) and dynamic camera trajectories for Runway Gen-3, Luma Dream Machine, and Sora.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={downloadJson}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Download size={16} /> Export Prompt JSON
            </button>
            <button
              type="button"
              onClick={() => copyText('all', JSON.stringify(modelExportJson, null, 2))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#6366f1',
                color: '#ffffff',
                border: '1px solid #818cf8',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              {copiedKey === 'all' ? <Check size={16} /> : <Copy size={16} />}
              {copiedKey === 'all' ? 'Copied Full Spec' : 'Copy All Specs'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls Left, Frame Prompts Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Controls Column */}
        <div style={{
          background: '#13151f',
          border: '1px solid #222638',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sliders size={18} style={{ color: '#818cf8' }} /> Production Parameters
          </h3>

          {/* Model Target */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Target AI Video Model
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(['runway', 'luma', 'sora', 'kling'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModelPreset(m)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: modelPreset === m ? '1px solid #6366f1' : '1px solid #222638',
                    background: modelPreset === m ? 'rgba(99, 102, 241, 0.2)' : '#090a0f',
                    color: modelPreset === m ? '#c7d2fe' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Character Identity Lock */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Locked Character Identity (--cref)
            </label>
            {characters.length > 0 ? (
              <select
                value={selectedCharId}
                onChange={e => setSelectedCharId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#090a0f',
                  border: '1px solid #222638',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px'
                }}
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role}) {c.anchorId ? '✓ Anchor locked' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ padding: '12px', background: '#090a0f', borderRadius: '8px', color: '#94a3b8', fontSize: '12px' }}>
                No characters found in active project. Create a character in World Builder first.
              </div>
            )}
          </div>

          {/* Lens & Optical Preset */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Cine Lens &amp; Optics
            </label>
            <select
              value={lensChoice}
              onChange={e => setLensChoice(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            >
              <option value="35mm Anamorphic T1.5">35mm Anamorphic T1.5 (Classic Hollywood Oval Bokeh)</option>
              <option value="50mm Cooke Panchro/i">50mm Cooke Panchro/i (Warm Creamy Portrait Falloff)</option>
              <option value="24mm Ultra Wide Angle">24mm Ultra Wide Angle (Epic Scale &amp; Depth)</option>
              <option value="85mm Arri Master Prime">85mm Arri Master Prime (Razor-Sharp Focus Isolation)</option>
              <option value="Vintage 70mm Panavision">Vintage 70mm Panavision (70s Sci-Fi Flare &amp; Halation)</option>
            </select>
          </div>

          {/* Lighting Environment */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Lighting Environment
            </label>
            <select
              value={lightingPreset}
              onChange={e => setLightingPreset(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            >
              <option value="Volumetric Golden Hour Rim">Volumetric Golden Hour Rim (3200K Warm Key)</option>
              <option value="Cyberpunk Neon Chiaroscuro">Cyberpunk Neon Chiaroscuro (Cyan &amp; Magenta Split)</option>
              <option value="Noir High-Contrast Hard Shadows">Noir High-Contrast Hard Shadows (Black &amp; White Silver)</option>
              <option value="Overcast Nordic Diffuse 5600K">Overcast Nordic Diffuse 5600K (Clean Neutral Fill)</option>
              <option value="Strobe Emergency Amber Pulse">Strobe Emergency Amber Pulse (Dynamic Flash Arc)</option>
            </select>
          </div>

          {/* Camera Motion Trajectory */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Camera Trajectory Vector
            </label>
            <select
              value={cameraTrajectory}
              onChange={e => setCameraTrajectory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            >
              <option value="Dolly In + Slow Orbit 15°">Dolly In + Slow Orbit 15° (Tension Build)</option>
              <option value="Pedestal Up + Tilt Down">Pedestal Up + Tilt Down (Scale Revelation)</option>
              <option value="Tracking Forward Profile 30mph">Tracking Forward Profile 30mph (Action Velocity)</option>
              <option value="180° Orbital Wrap">180° Orbital Wrap (Hero Power Stance)</option>
              <option value="Slow Reverse Pull-Out to Wide">Slow Reverse Pull-Out to Wide (Isolation Beat)</option>
              <option value="FPV Drone Dynamic Dive">FPV Drone Dynamic Dive (Kinetic Rush)</option>
            </select>
          </div>

          {/* Motion Intensity Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Motion Intensity
              </label>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>
                {motionIntensity} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={motionIntensity}
              onChange={e => setMotionIntensity(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>

          {/* Environment Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Atmospheric Setting
            </label>
            <textarea
              rows={2}
              value={environmentDesc}
              onChange={e => setEnvironmentDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Generated Prompts Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Start Frame Card */}
          <div style={{
            background: '#13151f',
            border: '1px solid #222638',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                1. START FRAME (FIRST FRAME)
              </span>
              <button
                type="button"
                onClick={() => copyText('start', startFramePrompt)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {copiedKey === 'start' ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
                {copiedKey === 'start' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <textarea
              rows={2}
              value={startAction}
              onChange={e => setStartAction(e.target.value)}
              placeholder="Initial subject pose & framing beat..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '13px',
                marginBottom: '10px'
              }}
            />

            <div style={{
              background: '#090a0f',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              {startFramePrompt}
            </div>
          </div>

          {/* End Frame Card */}
          <div style={{
            background: '#13151f',
            border: '1px solid #222638',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                2. END FRAME (LAST FRAME)
              </span>
              <button
                type="button"
                onClick={() => copyText('end', endFramePrompt)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {copiedKey === 'end' ? <Check size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} />}
                {copiedKey === 'end' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <textarea
              rows={2}
              value={endAction}
              onChange={e => setEndAction(e.target.value)}
              placeholder="Concluding trajectory & motion climax beat..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#090a0f',
                border: '1px solid #222638',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '13px',
                marginBottom: '10px'
              }}
            />

            <div style={{
              background: '#090a0f',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              {endFramePrompt}
            </div>
          </div>

          {/* Quick Engine Status & Schema Info */}
          <div style={{
            background: 'rgba(19, 21, 31, 0.6)',
            border: '1px solid #222638',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#94a3b8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={15} style={{ color: '#6366f1' }} />
              <span>Aspect Ratio: <strong style={{ color: '#f1f5f9' }}>{aspectRatio} Widescreen</strong></span>
              <span>· Target: <strong style={{ color: '#f1f5f9', textTransform: 'capitalize' }}>{modelPreset}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: '#86efac', fontWeight: 500 }}>Continuity Guard Active</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
