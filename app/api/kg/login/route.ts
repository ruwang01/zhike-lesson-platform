import {requireUser} from '@/lib/auth';
import {body,json,failure} from '@/lib/server';
import {sharedGraphSession} from '@/lib/shared-graph-session';
export async function POST(req:Request){try{await body(req);await requireUser(req);await sharedGraphSession();return json({connected:true})}catch(error){return failure(error)}}
