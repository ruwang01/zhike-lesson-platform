import type {Knowledge} from './lesson';
/** Materialize defaults on confirmation so summaries and saved drafts use the same selection. */
export function confirmKnowledge(item:Knowledge):Knowledge{
 const rawMeaning=item.rawDetail??item.detail;
 const meaning=item.selectedMeanings?.length?item.selectedMeanings.join('\n'):item.selectedMeaning||rawMeaning||'';
 return {...item,selectedMeaning:meaning.slice(0,2500),selectedExamples:(item.selectedExamples||[]).slice(0,5),scopeConfirmed:true};
}
