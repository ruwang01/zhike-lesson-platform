import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loginPlaces,placeTime} from './places.ts';
test('login scene keeps seven ordered, independently selectable places',()=>{
 assert.deepEqual(loginPlaces.map(place=>place.name),['北京','伦敦','纽约','圣保罗','内罗毕','悉尼','麦克默多站']);
 assert.equal(new Set(loginPlaces.map(place=>place.id)).size,7);
});
test('city clocks use the same instant and local daylight-saving rules',()=>{
 const winter=new Date('2026-01-15T12:00:00Z'),summer=new Date('2026-07-15T12:00:00Z');
 const times=date=>Object.fromEntries(loginPlaces.map(place=>[place.id,placeTime(date,place.timeZone)]));
 assert.deepEqual(times(winter),{beijing:'20:00',london:'12:00',newyork:'07:00',saopaulo:'09:00',nairobi:'15:00',sydney:'23:00',mcmurdo:'01:00'});
 assert.deepEqual(times(summer),{beijing:'20:00',london:'13:00',newyork:'08:00',saopaulo:'09:00',nairobi:'15:00',sydney:'22:00',mcmurdo:'00:00'});
});
test('clock output stays in 24-hour hours and minutes without seconds',()=>{
 for(const place of loginPlaces)assert.match(placeTime(new Date('2026-11-05T00:00:00Z'),place.timeZone),/^(?:[01]\d|2[0-3]):[0-5]\d$/);
});
