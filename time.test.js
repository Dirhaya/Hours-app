import {test} from 'node:test';import assert from 'node:assert/strict';import {net,HOUR,validState} from './time.js';
const start=new Date('2026-01-04T22:00:00Z').getTime();
test('running shift excludes an open unpaid break',()=>{assert.equal(net({start,end:null,breaks:[{start:start+HOUR,end:null}]},-Infinity,Infinity,start+3*HOUR),HOUR);});
test('week boundary splits work and break exactly',()=>{const boundary=start+2*HOUR,s={start,end:start+4*HOUR,breaks:[{start:start+1.5*HOUR,end:start+2.5*HOUR}]};assert.equal(net(s,-Infinity,boundary),1.5*HOUR);assert.equal(net(s,boundary,Infinity),1.5*HOUR);});
test('reject overlapping shifts and invalid break backup',()=>{const s={id:'a',start,end:start+HOUR,breaks:[]},v={theme:'beige',target:40,weekStart:1,active:null,shifts:[s]};assert.equal(validState(v),true);assert.equal(validState({...v,shifts:[s,{...s,id:'b'}]}),false);assert.equal(validState({...v,shifts:[{...s,breaks:[{start:start-1,end:start+1}]}]}),false);});

import {saveManualShift} from './time.js';
const empty=()=>({theme:'beige',target:40,weekStart:1,active:null,shifts:[]});
test('manual clock-in alone runs and survives backup round trip',()=>{
 const v=saveManualShift(empty(),{id:'manual',start,end:null});
 assert.equal(v.active.start,start);assert.equal(v.shifts.length,0);
 assert.equal(net(v.active,-Infinity,Infinity,start+HOUR),HOUR);
 assert.equal(validState(JSON.parse(JSON.stringify(v))),true);
});
test('manual clock-out finishes existing shift without changing its start',()=>{
 const v=saveManualShift(empty(),{id:'manual',start,end:null});
 const done=saveManualShift(v,{id:'manual',start,end:start+2*HOUR});
 assert.equal(done.active,null);assert.equal(done.shifts.length,1);
 assert.equal(done.shifts[0].start,start);assert.equal(net(done.shifts[0]),2*HOUR);
 assert.equal(v.active.end,null);
});
test('manual clock-out closes a current break and preserves earlier breaks',()=>{
 const v=saveManualShift(empty(),{id:'manual',start,end:null});
 v.active.breaks=[{start:start+HOUR,end:start+1.5*HOUR},{start:start+2*HOUR,end:null}];
 const done=saveManualShift(v,{id:'manual',start,end:start+3*HOUR});
 assert.equal(net(done.shifts[0]),1.5*HOUR);assert.equal(v.active.breaks[1].end,null);
 assert.throws(()=>saveManualShift(v,{id:'manual',start,end:start+1.75*HOUR}));
});
test('second running shift, future times, overlaps and reversed times are rejected',()=>{
 const v=saveManualShift(empty(),{id:'manual',start,end:null});
 assert.throws(()=>saveManualShift(v,{id:'second',start:start+HOUR,end:null}),/already running/);
 assert.throws(()=>saveManualShift(empty(),{id:'future',start:Date.now()+HOUR,end:null}));
 assert.throws(()=>saveManualShift(v,{id:'second',start:start-HOUR,end:start+HOUR}));
 assert.throws(()=>saveManualShift(v,{id:'manual',start,end:start-1}));
 assert.equal(v.active.id,'manual');assert.equal(v.shifts.length,0);
});
test('completed shift can be reopened without duplicating history',()=>{
 const v=saveManualShift(empty(),{id:'manual',start,end:start+HOUR});
 const open=saveManualShift(v,{id:'manual',start,end:null});
 assert.equal(open.active.id,'manual');assert.equal(open.shifts.length,0);
});

import {weekInsights,workDaysFor} from './time.js';
// Local constructors make the date-boundary tests valid in UTC and Dubai.
const at=(day,h=0,m=0)=>+new Date(2026,0,day,h,m);
const weekStart=at(5),weekEnd=at(12);
const logged=(id,day,begin,end)=>({id,start:at(day,begin),end:at(day,end),breaks:[]});
test('10:56 plus four remaining hours gives 14:56; running finish stays stable',()=>{
 const now=at(9,10,56),v={...empty(),target:10,shifts:[logged('past',8,8,12)],active:{id:'live',start:now-2*HOUR,end:null,breaks:[]}};
 const result=weekInsights(v,weekStart,weekEnd,now);
 assert.equal(result.remaining,4*HOUR);assert.equal(result.finishAt,at(9,14,56));
 assert.equal(result.remainingDays,1);assert.equal(result.neededPerDay,4*HOUR);
 assert.equal(weekInsights(v,weekStart,weekEnd,now+HOUR).finishAt,result.finishAt);
});
test('average counts days, not shifts, and includes current hours',()=>{
 const v={...empty(),shifts:[logged('a',5,8,10),logged('b',5,12,14),logged('c',6,8,10)],active:{id:'d',start:at(7,8),end:null,breaks:[]}};
 const r=weekInsights(v,weekStart,weekEnd,at(7,11));
 assert.equal(r.worked,9*HOUR);assert.equal(r.workedDays,3);assert.equal(r.average,3*HOUR);
 assert.equal(r.remainingDays,3);assert.equal(r.includesToday,true);
});
test('unpaid break delays finish without increasing work',()=>{
 const now=at(9,10,56),v={...empty(),target:6,active:{id:'live',start:now-2*HOUR,end:null,breaks:[{start:now,end:null}]}};
 const a=weekInsights(v,weekStart,weekEnd,now),b=weekInsights(v,weekStart,weekEnd,now+HOUR/2);
 assert.equal(a.paused,true);assert.equal(b.worked,a.worked);assert.equal(b.finishAt,a.finishAt+HOUR/2);
});
test('workdays support custom schedules and old backups',()=>{
 assert.deepEqual(workDaysFor(empty()),[1,2,3,4,5]);assert.equal(validState(empty()),true);
 assert.equal(validState({...empty(),workDays:[0,2,4]}),true);
 assert.equal(validState({...empty(),workDays:[]}),false);assert.equal(validState({...empty(),workDays:[1,1]}),false);
 const r=weekInsights({...empty(),workDays:[0,2,4]},weekStart,weekEnd,at(8,10));
 assert.equal(r.remainingDays,2);
 const weekend=weekInsights(empty(),weekStart,weekEnd,at(10,10));assert.equal(weekend.remainingDays,0);assert.equal(weekend.neededPerDay,null);
 const extra=weekInsights({...empty(),active:{id:'extra',start:at(10,9),end:null,breaks:[]}},weekStart,weekEnd,at(10,10));assert.equal(extra.remainingDays,1);
});
test('empty, completed, past week, midnight and weekly reset cases',()=>{
 assert.equal(weekInsights(empty(),weekStart,weekEnd,at(5,8)).average,null);
 const complete=weekInsights({...empty(),target:2,shifts:[logged('a',5,8,11)]},weekStart,weekEnd,at(5,12));assert.equal(complete.remaining,0);assert.equal(complete.finishAt,null);
 assert.equal(weekInsights(empty(),weekStart,weekEnd,at(13,12)).current,false);
 const overnight=weekInsights({...empty(),target:4},weekStart,weekEnd,at(8,23));assert.equal(overnight.finishAt,at(9,3));assert.equal(overnight.finishWithinWeek,true);
 const tooLate=weekInsights({...empty(),target:4},weekStart,weekEnd,at(11,23));assert.equal(tooLate.finishWithinWeek,false);
});
test('overnight logged work is averaged across local days, subtracting breaks',()=>{
 const v={...empty(),shifts:[{id:'night',start:at(5,22),end:at(6,2),breaks:[{start:at(5,23),end:at(6,1)}]}]};
 const r=weekInsights(v,weekStart,weekEnd,at(6,10));assert.equal(r.workedDays,2);assert.equal(r.average,HOUR);
});
