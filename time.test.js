import {test} from 'node:test';import assert from 'node:assert/strict';import {net,HOUR,validState} from './time.js';
const start=new Date('2026-01-04T22:00:00Z').getTime();
test('running shift excludes an open unpaid break',()=>{assert.equal(net({start,end:null,breaks:[{start:start+HOUR,end:null}]},-Infinity,Infinity,start+3*HOUR),HOUR);});
test('week boundary splits work and break exactly',()=>{const boundary=start+2*HOUR,s={start,end:start+4*HOUR,breaks:[{start:start+1.5*HOUR,end:start+2.5*HOUR}]};assert.equal(net(s,-Infinity,boundary),1.5*HOUR);assert.equal(net(s,boundary,Infinity),1.5*HOUR);});
test('reject overlapping shifts and invalid break backup',()=>{const s={id:'a',start,end:start+HOUR,breaks:[]},v={theme:'beige',target:40,weekStart:1,active:null,shifts:[s]};assert.equal(validState(v),true);assert.equal(validState({...v,shifts:[s,{...s,id:'b'}]}),false);assert.equal(validState({...v,shifts:[{...s,breaks:[{start:start-1,end:start+1}]}]}),false);});
