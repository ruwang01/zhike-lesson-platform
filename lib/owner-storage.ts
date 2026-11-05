export function scopedStorageKey(key:string){if(typeof window==='undefined')return key;const id=window.sessionStorage?.getItem('zhike-owner');return id?key+':'+id:key}
