// City centres: GeoNames geographical database (https://www.geonames.org/).
// McMurdo: NSF, 77°50.89′ S, 166°40.11′ E:
// https://www.nsf.gov/od/opp/ail/mcmurdo-station
export const loginPlaces = [
  {id:'beijing',name:'北京',timeZone:'Asia/Shanghai',lat:39.9042,lng:116.4074},
  {id:'london',name:'伦敦',timeZone:'Europe/London',lat:51.5074,lng:-0.1278},
  {id:'newyork',name:'纽约',timeZone:'America/New_York',lat:40.7128,lng:-74.006},
  {id:'saopaulo',name:'圣保罗',timeZone:'America/Sao_Paulo',lat:-23.5505,lng:-46.6333},
  {id:'nairobi',name:'内罗毕',timeZone:'Africa/Nairobi',lat:-1.2921,lng:36.8219},
  {id:'sydney',name:'悉尼',timeZone:'Australia/Sydney',lat:-33.8688,lng:151.2093},
  {id:'mcmurdo',name:'麦克默多站',timeZone:'Antarctica/McMurdo',lat:-77.84817,lng:166.6685},
] as const;
export type LoginPlace = typeof loginPlaces[number];
const clocks = new Map<string,Intl.DateTimeFormat>();
export function placeTime(instant:Date,timeZone:string){
  let formatter=clocks.get(timeZone);
  if(!formatter){formatter=new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});clocks.set(timeZone,formatter)}
  return formatter.format(instant);
}
