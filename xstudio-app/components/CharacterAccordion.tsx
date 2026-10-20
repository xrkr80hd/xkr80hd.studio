'use client';
import {useId,useState,type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';

export default function CharacterAccordion({number,title,defaultOpen=false,children}:{number:number;title:string;defaultOpen?:boolean;children:ReactNode}){
 const [open,setOpen]=useState(defaultOpen),id=useId();
 return <section className={'character-accordion'+(open?' is-open':'')}>
  <h3><button type="button" id={id+'-heading'} aria-expanded={open} aria-controls={id+'-body'} onClick={()=>setOpen(value=>!value)}><span>{number}. {title}</span><ChevronDown size={18} aria-hidden="true"/></button></h3>
  <div className="character-accordion-reveal" id={id+'-body'} role="region" aria-labelledby={id+'-heading'} inert={!open}><div><div className="character-accordion-fields">{children}</div></div></div>
 </section>;
}
