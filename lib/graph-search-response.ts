import {type GraphResult} from './independent-search';
const timeoutMessage='知识图谱响应超时，请稍后重试；检索关键词已保留。';
function responseError(response:Response){
 if(response.redirected)return '检索请求被重定向，请刷新页面后重试；如仍失败，请重新连接图谱账号。';
 if(response.status===401)return '图谱会话已失效，请重新连接知识图谱账号。';
 if(response.status===403)return '检索请求未获允许，请重新连接图谱账号后重试。';
 if(response.status===404)return '知识检索接口暂不可用，请刷新页面后重试。';
 if(response.status===408||response.status===504)return timeoutMessage;
 return '知识检索服务暂时不可用，请稍后重试；检索关键词已保留。';
}
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export async function graphSearchResponse(response:Response):Promise<{results:GraphResult[];hasMore:boolean}>{
 const text=await response.text();let data:unknown;
 try{data=JSON.parse(text)}catch{throw Error(responseError(response))}
 if(response.redirected)throw Error(responseError(response));
 if(!response.ok){const message=record(data)&&typeof data.error==='string'?data.error.trim():'';throw Error(message&&!/^\s*</.test(message)?message:responseError(response))}
 if(!record(data)||!Array.isArray(data.results)||typeof data.hasMore!=='boolean'||!data.results.every(item=>record(item)&&typeof item.id==='string'&&typeof item.name==='string'&&typeof item.kind==='string'&&typeof item.detail==='string'&&typeof item.example==='string'&&Array.isArray(item.relations)&&item.relations.every(relation=>record(relation)&&typeof relation.type==='string'&&typeof relation.name==='string'&&typeof relation.detail==='string')))throw Error('知识检索返回的数据格式异常，请重试；检索关键词已保留。');
 return data as {results:GraphResult[];hasMore:boolean};
}
export function graphSearchError(error:unknown):string{
 if(error instanceof Error){if(error.name==='TimeoutError'||error.name==='AbortError')return timeoutMessage;if(error instanceof TypeError)return '网络连接失败，请检查网络后重试；检索关键词已保留。';return error.message}
 return '检索失败，请稍后重试；检索关键词已保留。';
}
