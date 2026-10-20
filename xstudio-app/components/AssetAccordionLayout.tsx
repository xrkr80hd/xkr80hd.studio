'use client';
import type {ReactNode} from 'react';
export default function AssetAccordionLayout({label,children,footer}:{label:string;children:ReactNode;footer:ReactNode}){
 return <section className="asset-unified-editor character-creator universal-asset-editor" aria-label={label}><div className="character-creator-body">{children}<footer className="character-creator-footer">{footer}</footer></div></section>;
}
