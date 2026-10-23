'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Copy,
  Check,
  Play,
  Terminal,
  ShieldAlert,
  Layers,
  ArrowRight,
  ExternalLink,
  Code,
  Flame,
  Film,
  Lock,
  Camera,
  Palette,
  FileText,
  Download
} from 'lucide-react';

interface GeminiSkillsModalProps {
  project: string;
  onClose: () => void;
  onNotice?: (msg: string) => void;
}

export default function GeminiSkillsModal({ project, onClose, onNotice }: GeminiSkillsModalProps) {
  const [commandInput, setCommandInput] = useState('123GO');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'gemini_wiring' | 'modules'>('console');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xstudio.xrkr80hd.studio';
  const endpointUrl = `${baseUrl}/api/gemini/skills`;
  const openApiUrl = `${baseUrl}/api/gemini/skills/openapi`;
  const mcpUrl = `${baseUrl}/mcp`;

  const plugins = [
    { name: 'XCE_UNIFY', icon: Layers, color: '#818cf8', role: 'Production Coordinator', desc: 'Live scene ledger, 4-angle 16:9 coverage override, canonical continuation selection.' },
    { name: 'XCE_FIRESTARTER', icon: Flame, color: '#f59e0b', role: "Writers' Room", desc: 'Anti-cliche analysis, SS, STF, US 6-block handoff, XCE CONTINUE handoff.' },
    { name: 'XCE_SCRIPT', icon: FileText, color: '#38bdf8', role: 'Narrative & Beats', desc: 'Action 1 / Action 2, physical states, 3-6s duration, cast presence rules.' },
    { name: 'XCE_ENGINE', icon: Lock, color: '#10b981', role: 'CREF Asset Manager', desc: 'Exact LOCKED character anchors, original image bytes, 16:9 6-column sheets (0% drift).' },
    { name: 'XCE_COMPOSER', icon: Camera, color: '#a855f7', role: 'Spatial Staging', desc: 'Cast formations, equipment, alternate forms, and lens packages.' },
    { name: 'XCE_MV', icon: Film, color: '#ec4899', role: 'Director 7-Shot', desc: 'SL (SS/AS), 7-shot sequence, FF confirmation, Y/GEN/N/MOD gate.' },
    { name: 'XCE_CGE', icon: Palette, color: '#06b6d4', role: 'Color Grading', desc: '16:9 look previews, STAGED state, immutable factory presets, explicit PUSH GRADE.' },
    { name: 'COMMERCIAL', icon: Sparkles, color: '#eab308', role: 'Storyboard Engine', desc: 'CMPN campaign lock, 30s/60s timing, practical SFX-only sound design.' },
  ];

  const quickCommands = ['123GO', 'SS', 'STF', 'US', 'SL', 'FF', 'CGE', 'CMPN'];

  async function testCommand(cmd: string) {
    setExecuting(true);
    setCommandResult(null);
    try {
      const res = await fetch(`/api/gemini/skills?cmd=${encodeURIComponent(cmd)}`);
      const data = await res.json();
      setCommandResult(data);
    } catch (err: any) {
      setCommandResult({ error: err.message || 'Execution failed' });
    } finally {
      setExecuting(false);
    }
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      onNotice?.('Copied to clipboard');
    } catch {
      onNotice?.('Could not copy to clipboard');
    }
  }

  const gemSystemPrompt = `You are XCE (Cinematic Engine) Neural Director for xrkr80hd studio.
You orchestrate narrative cinematic worldbuilding, 16:9 widescreen composition, and strict continuity across all video beats.

CORE RULES:
1. CHARACTER SHEETS AS SCENE FETCH POINTS:
   - The 6-column 16:9 character turnaround sheet (Front, Side, 3/4, Rear, Front Face CU, Profile Face CU) is the immutable ANCHOR & FETCH POINT for generating scenes.
   - When generating any scene, fetch the character's locked anchor (--cref) and inject their exact facial geometry, species (anthropomorphic/human), attire, and palette into every shot prompt.
   - Zero-drift tolerance (0.00%). Creative edits create a new draft; the master sheet remains locked.
2. VISUAL CANVAS:
   - All cinematic shots are strictly 16:9 widescreen anamorphic.
   - 35mm anamorphic lenses, horizontal flare, volumetric atmosphere.
3. COMMAND ROUTING:
   - SS: Start Story / Initialize clean project
   - STF: Story Thus Far review
   - US: Update Story handoff (WORLD_TYPE, AESTHETIC_TONE, WORLD_BACKGROUND, STORY_SO_FAR, PRODUCTION_BRIEF, WORLD_RULES_CONTINUITY)
   - SL: Shot List progression (1 to 7)
   - FF/LF: First Frame / Last Frame continuity confirmation
   - Y or GEN: Proceed to render
   - MOD: Revise current shot
   - CMPN: Commercial campaign mode (strict SFX-only audio; no dialogue or music)
4. TONE & PACING:
   - Sharp, direct, high-speed, ADHD-optimized execution. No fluff, no lectures.`;

  async function copyRawSchema() {
    try {
      const res = await fetch('/xce-gemini-skills.json');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedKey('raw_schema');
      setTimeout(() => setCopiedKey(null), 2000);
      onNotice?.('Copied full OpenAPI JSON schema to clipboard');
    } catch {
      onNotice?.('Could not load schema');
    }
  }

  function downloadSchemaFile() {
    const a = document.createElement('a');
    a.href = '/xce-gemini-skills.json';
    a.download = 'xce-gemini-skills-openapi.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onNotice?.('Downloaded xce-gemini-skills-openapi.json');
  }

  const pythonSdkCode = `# Connect your external Gemini instance to this XSTUDIO node
from google import genai
import requests

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

# 1. Fetch live declarations from your node
tools_schema = requests.get("${endpointUrl}").json()["tools"]

# 2. Invoke Gemini with full XCE capabilities
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Orchestrate shot list for scene 1 with 16:9 character sheet lock",
    config={"tools": [{"function_declarations": tools_schema}]}
)
print(response.text)`;

  return (
    <div className="gemini-skills-content p-5 space-y-6 max-h-[82vh] overflow-y-auto text-slate-100 font-sans">
      {/* Beast-mode Cyberpunk Header */}
      <div className="flex items-center justify-between pb-4 border-b border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <div className="w-full h-full bg-[#090a0f] rounded-xl flex items-center justify-center text-indigo-400">
              <Cpu size={22} className="animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              <span>XCE GEMINI SKILLS CONNECTOR</span>
              <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                v2.0.0
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Direct FunctionCalling & OpenAPI conduit for Commercial AI Cinematic Production
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            NODE ONLINE
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'console', label: '⚡ Interactive Command Console', icon: Terminal },
          { id: 'gemini_wiring', label: '🔌 Wire Into YOUR Gemini', icon: Code },
          { id: 'modules', label: `📦 Ecosystem Modules (${plugins.length})`, icon: Layers }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/50'
                : 'bg-[#13151f] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <t.icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: CONSOLE */}
      {activeTab === 'console' && (
        <div className="space-y-4">
          {/* Quick Dispatch Chips */}
          <div className="p-3 bg-[#13151f] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-white">⚡ High-Velocity Shorthand Triggers:</span>
              <span>Click to auto-dispatch</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickCommands.map(cmd => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => {
                    setCommandInput(cmd);
                    void testCommand(cmd);
                  }}
                  className="px-2.5 py-1 rounded bg-black/60 hover:bg-indigo-600/30 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-mono font-bold transition-all"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Command Input Form */}
          <div className="p-4 bg-[#13151f] border border-indigo-500/30 rounded-xl space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (commandInput.trim()) void testCommand(commandInput.trim());
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-indigo-400 font-mono text-sm">$</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Enter shorthand command (e.g. 123GO, SS, STF, SL, CGE)..."
                  className="w-full bg-[#090a0f] border border-indigo-500/40 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-400 shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={executing}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50"
              >
                <Play size={14} />
                <span>{executing ? 'Routing…' : 'Execute Command'}</span>
              </button>
            </form>

            {commandResult && (
              <div className="mt-3 p-3.5 bg-[#090a0f] border border-indigo-500/40 rounded-lg font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-white/10 pb-2">
                  <span>Target Plugin: {commandResult.parsed?.targetRole || 'ROUTER'}</span>
                  <span className="text-emerald-400">Approval Gate: {commandResult.parsed?.isApprovalGate ? 'ACTIVE' : 'BYPASS'}</span>
                </div>
                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(commandResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WIRING INTO EXTERNAL GEMINI */}
      {activeTab === 'gemini_wiring' && (
        <div className="space-y-4">
          {/* Status Alert: AI Studio Agent Integration */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Check size={16} />
              <span>1. CURRENT AI STUDIO GEMINI (Already Wired & Native)</span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              In this AI Studio session, the Gemini model talking to you already has the entire XCE system skill loaded directly at:
              <code className="mx-1 px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 font-mono">
                /skills/system_skills/xce_cinematic_studio/SKILL.md
              </code>.
              You do not need to do anything here for this chat.
            </p>
          </div>

          {/* External Personal Gemini (Gemini Advanced / Gems / Custom Apps) */}
          <div className="p-4 bg-[#13151f] border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">2. EXTERNAL GEMINI APPS (Python / TypeScript SDK)</h3>
              </div>
              <button
                type="button"
                onClick={() => copyText(pythonSdkCode, 'python_code')}
                className="px-2.5 py-1 text-xs rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center gap-1.5"
              >
                {copiedKey === 'python_code' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedKey === 'python_code' ? 'Copied' : 'Copy Python Snippet'}</span>
              </button>
            </div>
            <pre className="p-3 bg-[#090a0f] border border-white/10 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto">
              {pythonSdkCode}
            </pre>
          </div>

          {/* Gemini Custom Gems / OpenAPI Action */}
          <div className="p-4 bg-[#13151f] border border-indigo-500/30 rounded-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>3. GEMINI GEMS & CUSTOM ACTIONS</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Direct injection into Gemini Gems without URL crawler blocks</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => copyText(gemSystemPrompt, 'gem_prompt')}
                  className="px-3 py-1.5 text-xs rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'gem_prompt' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === 'gem_prompt' ? 'Copied Prompt' : 'Copy Gem Prompt'}</span>
                </button>
                <button
                  type="button"
                  onClick={copyRawSchema}
                  className="px-3 py-1.5 text-xs rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'raw_schema' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === 'raw_schema' ? 'Copied JSON' : 'Copy Full Schema JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadSchemaFile}
                  className="px-3 py-1.5 text-xs rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Download size={12} />
                  <span>Download .json</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200/90 leading-relaxed">
              <strong>Why Google says &quot;This page is blocked&quot;:</strong> Private preview links (<code className="font-mono text-amber-300">*.run.app</code>) are protected by Google Cloud Run single sign-on. External crawlers cannot fetch them. To configure your Gem with <strong>zero network errors</strong>, paste the <strong>Gem Prompt</strong> into Instructions and paste the <strong>Full Schema JSON</strong> directly into the Gem Schema box.
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Production Public Endpoint (After Push):</label>
              <code className="block p-2.5 bg-[#090a0f] border border-white/10 rounded text-xs font-mono text-indigo-300 truncate select-all">
                https://xstudio.xrkr80hd.studio/api/gemini/skills/openapi
              </code>
            </div>
          </div>

          {/* Model Context Protocol (MCP) */}
          <div className="p-4 bg-[#13151f] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">4. MODEL CONTEXT PROTOCOL (MCP) GATEWAY</h3>
                <p className="text-xs text-slate-400">For Claude Desktop, Cursor, and Gemini CLI MCP clients</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(mcpUrl, 'mcp_url')}
                className="px-3 py-1.5 text-xs rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white flex items-center gap-1.5"
              >
                {copiedKey === 'mcp_url' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedKey === 'mcp_url' ? 'Copied' : 'Copy MCP URL'}</span>
              </button>
            </div>
            <code className="block p-2.5 bg-[#090a0f] border border-white/10 rounded text-xs font-mono text-cyan-300 truncate select-all">
              {mcpUrl}
            </code>
          </div>
        </div>
      )}

      {/* TAB 3: PLUGINS */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins.map((p) => (
            <div
              key={p.name}
              className="p-3.5 bg-[#13151f] border border-white/10 rounded-xl space-y-2 hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}
                  >
                    <p.icon size={15} />
                  </div>
                  <span className="text-xs font-bold text-white font-mono group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 bg-black/40 px-2 py-0.5 rounded border border-white/10 font-mono">
                  {p.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trav's Deployment Gate */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 space-y-1">
          <strong className="block text-amber-300 font-bold">Trav's Deployment Gate Protocol</strong>
          <p>
            Never commit, push, deploy, or migrate Git/Vercel/Supabase without Trav's explicit "push" instruction.
            At code-release checkpoints, ask: <em>"Is there anything else that needs to be done?"</em>
          </p>
        </div>
      </div>
    </div>
  );
}
