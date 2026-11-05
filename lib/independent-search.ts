export const searchKinds={characters:'汉字检索',vocabulary:'词汇检索',grammar:'语法检索',culture:'文化检索'} as const;
export type SearchKind=keyof typeof searchKinds;
export function searchKind(value:unknown):SearchKind{return typeof value==='string'&&Object.hasOwn(searchKinds,value)?value as SearchKind:'characters'}
export type GraphResult={id:string;name:string;kind:string;detail:string;example:string;relations:{type:string;name:string;detail:string}[]};
export const searchLabels:Record<SearchKind,string[]>={characters:['Character'],vocabulary:['Word','Idiom'],grammar:['Grammar'],culture:['CulturalStage','Cultural','CulturalLevel1','CulturalLevel2']};
export function independentQuery(kind:SearchKind){return `MATCH (n) WHERE (${searchLabels[kind].map(label=>`n:${label}`).join(' OR ')}) AND n.name CONTAINS $keyword RETURN n ORDER BY n.name SKIP $offset LIMIT 21`}
