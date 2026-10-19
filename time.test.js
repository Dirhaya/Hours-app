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
