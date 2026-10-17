import LocalWorkspace from '../components/LocalWorkspace';
import CinematicStudio from './CinematicStudio';
import { redirect } from 'next/navigation';
import { requireOwner } from '../lib/xstudio-server';
export const dynamic='force-dynamic';
export default async function HomePage(){if(process.env.NODE_ENV==='development'&&process.env.XSTUDIO_LOCAL_PREVIEW==='true')return <CinematicStudio ownerId="local-preview"/>;const context=await requireOwner();if(context.response?.status===503)return <LocalWorkspace/>;if(context.response)redirect('/login');return <CinematicStudio ownerId={context.user.id}/>;}
