import {inflateRawSync} from 'node:zlib';
export function docxMember(data,name='word/document.xml'){
 const bytes=Buffer.from(data);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65558);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break}
 if(end<0)throw Error('Not a ZIP document');
 let offset=bytes.readUInt32LE(end+16);
 for(let i=0;i<bytes.readUInt16LE(end+10);i++){
  if(bytes.readUInt32LE(offset)!==0x02014b50)throw Error('Invalid ZIP directory');
  const method=bytes.readUInt16LE(offset+10),size=bytes.readUInt32LE(offset+20),nl=bytes.readUInt16LE(offset+28),el=bytes.readUInt16LE(offset+30),cl=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42);
  const entry=bytes.subarray(offset+46,offset+46+nl).toString();
  if(entry===name){const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),body=bytes.subarray(start,start+size);return(method===8?inflateRawSync(body):body).toString('utf8')}
  offset+=46+nl+el+cl;
 }
 throw Error('Missing '+name);
}
