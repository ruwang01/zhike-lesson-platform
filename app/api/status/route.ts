import {modelInfo} from '@/lib/model';
import {mailReady,requireUser} from '@/lib/auth';
import {sharedGraphSession} from '@/lib/shared-graph-session';
import {json,config,AppError} from '@/lib/server';
export const maxDuration=120;
/** Site authentication and the upstream service connection are separate states. */
export async function GET(req:Request){
 const model=modelInfo();const common={authConfigured:!!config().BETTER_AUTH_SECRET,mailConfigured:mailReady(),modelConfigured:model.configured,provider:model.provider,sessionConfigured:!!config().SESSION_SECRET,model:model.name};
 let user;try{user=await requireUser(req)}catch(error){const status=error instanceof AppError?error.status:503;console.info('[site-status] site session unavailable',{status});return json({...common,authenticated:false,authStatus:status===401?'signed_out':status===403?'disabled':'unavailable',authError:status===401?'本站登录已失效，请重新登录智课。':status===403?'本站账户已停用，请联系管理员。':'本站账户服务暂不可用，请稍后重试。',connected:false,username:'',graphStatus:'not_checked'})}
 try{await sharedGraphSession();console.info('[site-status] graph connected');return json({...common,authenticated:true,authStatus:'signed_in',connected:true,username:user.username,graphStatus:'connected'})}catch(error){const status=error instanceof AppError?error.status:502;console.warn('[site-status] graph connection failed',{status});return json({...common,authenticated:true,authStatus:'signed_in',connected:false,username:user.username,graphStatus:status===401?'credentials_rejected':status===503?'not_configured':'unavailable',graphError:status===401?'服务端图谱账号或密码未通过认证，请管理员核对图谱配置。':status===503?'图谱服务尚未配置，请联系管理员。':'图谱服务暂时连接失败，请重试；持续失败请联系管理员。'})}
}
