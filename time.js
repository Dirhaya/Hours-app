export const HOUR=3600000;
export function net(s,lo=-Infinity,hi=Infinity,now=Date.now()){
 const a=Math.max(s.start,lo),b=Math.min(s.end??now,hi);if(b<=a)return 0;
 return Math.max(0,b-a-(s.breaks||[]).reduce((v,r)=>v+Math.max(0,Math.min(b,r.end??now)-Math.max(a,r.start)),0));
}
export function duration(ms){const m=Math.floor(Math.max(0,ms)/60000);return Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':'');}
export function validState(v){
 if(!v||!['beige','white','black'].includes(v.theme)||!Number.isFinite(v.target)||v.target<1||v.target>168||![0,1,6].includes(v.weekStart)||!Array.isArray(v.shifts))return false;
 if(v.workDays!==undefined&&(!Array.isArray(v.workDays)||!v.workDays.length||v.workDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(v.workDays).size!==v.workDays.length))return false;
 const all=[...v.shifts,...(v.active?[v.active]:[])],ids=new Set();
 for(const s of all){if(!s||typeof s.id!=='string'||ids.has(s.id)||!Number.isFinite(s.start)||s.start<0||s.start>Date.now()||!Array.isArray(s.breaks))return false;ids.add(s.id);if(s===v.active){if(s.end!==null)return false;}else if(!Number.isFinite(s.end)||s.end<=s.start||s.end>Date.now())return false;
 let last=s.start;for(const b of s.breaks){if(!b||!Number.isFinite(b.start)||b.start<last||b.start>(s.end??Date.now()))return false;if(b.end===null){if(s!==v.active||b!==s.breaks.at(-1))return false;last=Infinity;}else{if(!Number.isFinite(b.end)||b.end<b.start||b.end>(s.end??Date.now()))return false;last=b.end;}}
 }
 all.sort((a,b)=>a.start-b.start);return all.every((s,i)=>!i||s.start>=(all[i-1].end??Infinity));
}

// Apply a manual entry atomically: a failed edit never changes saved shifts.
export function saveManualShift(state,{id,start,end}){
 const candidate=JSON.parse(JSON.stringify(state));
 const existing=[...candidate.shifts,...(candidate.active?[candidate.active]:[])].find(s=>s.id===id);
 if(end===null&&candidate.active&&candidate.active.id!==id)
  throw new Error('A shift is already running. Use Edit times on that shift, or clock out first.');
 const shift=existing??{id,breaks:[]};
 shift.start=start;shift.end=end;
 if(end!==null)for(const b of shift.breaks)if(b.end===null)b.end=end;
 candidate.shifts=candidate.shifts.filter(s=>s.id!==id);
 if(candidate.active?.id===id)candidate.active=null;
 if(end===null)candidate.active=shift;else candidate.shifts.push(shift);
 if(!validState(candidate))throw new Error('Use past times, clock out after clock in, avoid overlapping shifts, and keep recorded breaks inside the shift.');
 return candidate;
}

export const DEFAULT_WORK_DAYS=[1,2,3,4,5];
export function workDaysFor(state){return state.workDays??DEFAULT_WORK_DAYS;}
export function weekInsights(state,lo,hi,now=Date.now()){
 const shifts=[...state.shifts,...(state.active?[state.active]:[])];
 const days=[];
 for(let day=new Date(lo);+day<hi;day.setDate(day.getDate()+1)){
  const next=new Date(day);next.setDate(next.getDate()+1);
  days.push({start:+day,end:Math.min(+next,hi),worked:shifts.reduce((sum,s)=>sum+net(s,+day,Math.min(+next,hi),now),0),weekday:day.getDay()});
 }
 const worked=days.reduce((sum,d)=>sum+d.worked,0),workedDays=days.filter(d=>d.worked>0).length;
 const remaining=Math.max(0,state.target*HOUR-worked),current=now>=lo&&now<hi;
 const scheduled=workDaysFor(state);
 const available=days.filter(d=>d.end>now&&(scheduled.includes(d.weekday)||(current&&state.active&&d.start<=now&&now<d.end)));
 const remainingDays=available.length,includesToday=available.some(d=>d.start<=now&&now<d.end);
 const finishAt=current&&remaining>0?now+remaining:null;
 return {worked,workedDays,average:workedDays?worked/workedDays:null,remaining,remainingDays,includesToday,neededPerDay:remainingDays?remaining/remainingDays:null,current,finishAt,finishWithinWeek:finishAt!==null&&finishAt<=hi,paused:!!state.active?.breaks.some(b=>b.end===null)};
}
