import {config} from './server';
export const activityDay=()=>new Date(Date.now()+8*3600000).toISOString().slice(0,10);
export async function touchActive(id:string){await config().DB.prepare('UPDATE site_accounts SET last_used=? WHERE user_id=?').bind(Date.now(),id).run();await config().DB.prepare('INSERT OR IGNORE INTO site_daily_active(user_id,day) VALUES(?,?)').bind(id,activityDay()).run()}
export async function markUsed(id:string){const now=Date.now();await config().DB.prepare('UPDATE site_accounts SET first_used=COALESCE(first_used,?),last_used=? WHERE user_id=?').bind(now,now,id).run();await touchActive(id)}
