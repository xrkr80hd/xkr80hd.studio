import {redirect} from 'next/navigation';
import {requireOwner} from '../../lib/xstudio-server';
import CinematicStudio from '../CinematicStudio';
export const dynamic='force-dynamic';
export const metadata={title:'XCE_COMPOSER | XSTUDIO'};
export default async function ComposerPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const context=await requireOwner();if(context.response)redirect('/login');
 const query=await searchParams,project=typeof query.project==='string'&&/^[\w-]{1,80}$/.test(query.project)?query.project:'';
 return <CinematicStudio ownerId={context.user!.id} initialComposerProject={project}/>;
}
