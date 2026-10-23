import {redirect} from 'next/navigation';
import {requireOwner} from '../../lib/xstudio-server';
import ConnectionsPanel from '../../components/ConnectionsPanel';
export const dynamic='force-dynamic';
export default async function Connections(){const context=await requireOwner();if(context.response)redirect('/login');return <ConnectionsPanel/>}
