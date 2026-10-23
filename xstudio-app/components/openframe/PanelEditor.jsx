// Adapted from kazim-45/openframe (MIT). See LICENSE in this directory.
'use client';
import OverlaySelect from '../OverlaySelect';
import { useState, useRef, useEffect } from 'react'
import { ShotTemplateGrid, ShotTemplateSVG } from './ShotTemplates'



const SHOT_TYPES = ['ECU','CU','MCU','MS','MWS','WS','EWS','OTS','POV','AERIAL','2-SHOT','INSERT']
const CAM_MOVES  = ['STATIC','PAN LEFT','PAN RIGHT','TILT UP','TILT DOWN','DOLLY IN','DOLLY OUT','TRACKING','HANDHELD','CRANE UP','CRANE DOWN','ZOOM IN','ZOOM OUT']
const LENSES     = ['18mm','24mm','28mm','35mm','50mm','85mm','100mm','135mm','200mm']

export default function PanelEditor({ panel, sceneNumber, onSave, onClose, extraContent }) {
  const dialogRef=useRef(null);
  useEffect(()=>{const dialog=dialogRef.current;dialog?.showModal();return()=>dialog?.close()},[]);
  const [data, setData] = useState({
    shotType:    panel?.shotType    || 'WS',
    cameraMove:  panel?.cameraMove  || 'STATIC',
    lens:        panel?.lens        || '35mm',
    duration:    panel?.duration    || 3,
    dialogue:    panel?.dialogue    || '',
    action:      panel?.action      || '',
    notes:       panel?.notes       || '',
    visualMode:  panel?.visualMode  || 'template',
    templateKey: panel?.templateKey || 'WS',
    canvasData:  panel?.canvasData  || null,
    imageData:   panel?.imageData   || null,
    aiPrompt:    panel?.aiPrompt    || '',
    aiImageUrl:  panel?.aiImageUrl  || null,
  })
  const [tab,       setTab]      = useState('info')
  const set = (k,v) => setData(d=>({...d,[k]:v}))

  const VisualPreview = () => (
    <div className="w-full aspect-video bg-[#111] rounded border border-[#2a2a2a] overflow-hidden">
      {data.visualMode==='template' && <ShotTemplateSVG templateKey={data.templateKey||data.shotType}/>}
      {data.visualMode==='canvas'   && data.canvasData   && <img src={data.canvasData}  alt="sketch" className="w-full h-full object-contain"/>}
      {data.visualMode==='upload'   && data.imageData    && <img src={data.imageData}   alt="ref"    className="w-full h-full object-cover"/>}
      {data.visualMode==='ai'       && data.aiImageUrl   && <img src={data.aiImageUrl}  alt="AI"     className="w-full h-full object-cover"/>}
    </div>
  )

  return (
    <dialog ref={dialogRef} className="xce-shot-modal" aria-label="Shot editor" onCancel={e=>{e.preventDefault();onClose()}} onClick={onClose} onKeyDown={e=>{if(e.key==='Escape')onClose()}}>
      <div className="bg-[#141414] border border-[#333] rounded w-full max-w-4xl max-h-[92vh] flex flex-col fade-up mx-2 sm:mx-4" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bebas text-xl sm:text-2xl text-[#65dcff] tracking-widest">Shot Editor</span>
            <span className="text-xs sm:text-sm text-[#555]">Scene {sceneNumber} · Shot {panel?.number}</span>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#d8d6cc] text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a] flex-shrink-0">
          {[{id:'info',l:'📋 Info'},{id:'visual',l:'🎨 Visual'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm border-b-2 transition-all ${tab===t.id?'border-[#65dcff] text-[#65dcff]':'border-transparent text-[#555] hover:text-[#d8d6cc]'}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          {/* INFO TAB */}
          {tab==='info' && (
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left */}
              <div className="flex flex-col gap-4 lg:w-1/2">
                <VisualPreview/>
                <div>
                  <label className="block text-xs text-[#555] uppercase tracking-widest mb-2">Shot Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SHOT_TYPES.map(s=>(
                      <button key={s} onClick={()=>{set('shotType',s);if(data.visualMode==='template')set('templateKey',s)}}
                        className={`px-2.5 py-1.5 rounded text-xs border transition-all ${data.shotType===s?'bg-[#65dcff] text-black border-[#65dcff] font-medium':'border-[#333] text-[#555] hover:text-[#d8d6cc]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{label:'Camera',field:'cameraMove',opts:CAM_MOVES},{label:'Lens',field:'lens',opts:LENSES}].map(({label,field,opts})=>(
                    <div key={field}>
                      <label className="block text-xs text-[#555] uppercase tracking-widest mb-1.5">{label}</label>
                      <OverlaySelect value={data[field]} onChange={e=>set(field,e.target.value)}
                        className="w-full bg-[#1c1c1c] border border-[#333] text-[#d8d6cc] text-sm rounded px-2 py-2 outline-none focus:border-[#65dcff]">
                        {opts.map(o=><option key={o} value={o}>{o}</option>)}
                      </OverlaySelect>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-[#555] uppercase tracking-widest mb-1.5">Duration — {data.duration}s</label>
                  <input type="range" min="1" max="60" value={data.duration} onChange={e=>set('duration',Number(e.target.value))} className="w-full"/>
                </div>
              </div>
              {/* Right */}
              <div className="flex flex-col gap-4 lg:w-1/2">
                {[{l:'Action',f:'action',p:'What happens in this shot…'},{l:'Dialogue',f:'dialogue',p:'What is said…'},{l:'Notes',f:'notes',p:'Technical notes, lighting, props…'}].map(({l,f,p})=>(
                  <div key={f}>
                    <label className="block text-xs text-[#555] uppercase tracking-widest mb-1.5">{l}</label>
                    <textarea value={data[f]} onChange={e=>set(f,e.target.value)} placeholder={p} rows={3}
                      className="w-full bg-[#1c1c1c] border border-[#333] text-[#d8d6cc] text-sm rounded px-3 py-2 font-courier outline-none focus:border-[#65dcff] resize-none"/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='visual' && <ShotTemplateGrid selected={data.templateKey} onSelect={k=>{set('templateKey',k);set('shotType',k)}}/>}
          {extraContent}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-[#2a2a2a] flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#555] hover:text-[#d8d6cc]">Cancel</button>
          <button onClick={()=>onSave(data)} className="px-5 sm:px-6 py-2 bg-[#65dcff] text-black text-sm font-medium rounded hover:opacity-85 active:scale-95">
            Save shot
          </button>
        </div>
      </div>
    </dialog>
  )
}
