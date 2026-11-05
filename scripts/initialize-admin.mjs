// Operator-only setup. Uses the same Better Auth hash format; no password in command arguments.
import {createClient} from '@libsql/client';
import {hashPassword} from 'better-auth/crypto';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL 未配置，请先运行迁移。');
const db=createClient({url:process.env.DATABASE_URL,authToken:process.env.DATABASE_AUTH_TOKEN});
const rl=createInterface({input:stdin,output:stdout});
async function secret(prompt){stdout.write(prompt);const previous=rl._writeToOutput;rl._writeToOutput=()=>{};try{return await rl.question('')}finally{rl._writeToOutput=previous;stdout.write('\n')}}
try{if((await db.execute("SELECT key FROM admin_setup_lock WHERE key='first-admin'")).rows.length)throw Error('管理员已经初始化。');const password=await secret('设置 admin 密码（15–128位，输入不显示）：');const confirm=await secret('再次输入密码：');if(password.length<15||password.length>128||password!==confirm)throw Error('密码长度有误或两次不一致。');const id=crypto.randomUUID(),now=Date.now();await db.batch([{sql:'INSERT INTO admin_setup_lock(key,created_at) VALUES(?,?)',args:['first-admin',now]},{sql:'INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?)',args:[id,'管理员',id+'@accounts.invalid',0,now,now]},{sql:'INSERT INTO auth_account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',args:[id,id,'credential',id,await hashPassword(password),now,now]},{sql:'INSERT INTO site_accounts(user_id,username,role,enabled,created_at) VALUES(?,?,?,?,?)',args:[id,'admin','admin',1,now]}],'write');console.log('管理员 admin 已创建。')}finally{rl.close();db.close()}
