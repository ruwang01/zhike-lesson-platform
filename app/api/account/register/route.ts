import {body,json,failure,AppError} from '@/lib/server';
import {newAccount,createAccount} from '@/lib/accounts';
import {limitRequest} from '@/lib/site-rate-limit';
import {POST as login} from '../login/route';
export async function POST(req:Request){try{
 const b=await body(req,10000);await limitRequest(req,'register',3);
 if(b.password!==b.confirmPassword)throw new AppError('两次密码不一致。',422);
 const parsed=newAccount.safeParse({username:b.username,password:b.password,name:typeof b.username==='string'?b.username.trim():''});if(!parsed.success)throw new AppError('用户名需3–32位字母、数字、下划线或短横线，字母开头；密码需15–128位。',422);
 if(parsed.data.username==='admin')throw new AppError('该用户名保留给网站管理员，请使用其他用户名。',409);
 await createAccount(parsed.data,'user');
 return login(new Request(new URL('/api/account/login',req.url),{method:'POST',headers:req.headers,body:JSON.stringify({username:parsed.data.username,password:parsed.data.password})}));
}catch(error){return failure(error)}}
