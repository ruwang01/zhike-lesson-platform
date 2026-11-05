// Vercel receives sensitive credentials directly. Never read them back or print them.
if(process.env.VERCEL_ENV==='production'){
 if(!process.env.DATABASE_URL||!process.env.DATABASE_AUTH_TOKEN)throw Error('正式环境缺少数据库连接配置。');
 if(!/^(libsql|https):\/\//.test(process.env.DATABASE_URL))throw Error('数据库地址与当前 libSQL 驱动不兼容，请核对数据库类型。');
 const {spawnSync}=await import('node:child_process');
 const result=spawnSync(process.execPath,['scripts/migrate.mjs'],{stdio:['ignore','pipe','pipe'],env:process.env});
 if(result.status!==0){console.error('正式数据库迁移失败，发布已阻止。请核对连接地址、读写 Token、数据库类型及网络可达性。');process.exit(1)}
 console.log('正式数据库连接与迁移已通过。');console.log(result.stdout.toString());
}
