export const HOUR=3600000;
export function net(s,lo=-Infinity,hi=Infinity,now=Date.now()){
 const a=Math.max(s.start,lo),b=Math.min(s.end??now,hi);if(b<=a)return 0;
 return Math.max(0,b-a-(s.breaks||[]).reduce((v,r)=>v+Math.max(0,Math.min(b,r.end??now)-Math.max(a,r.start)),0));
}
export function duration(ms){const m=Math.floor(Math.max(0,ms)/60000);return Math.floor(m/60)+'h'+(m%60?' '+m%60+'m':'');}
export function validState(v){
 if(!v||!['beige','white','black'].includes(v.theme)||!Number.isFinite(v.target)||v.target<1||v.target>168||![0,1,6].includes(v.weekStart)||!Array.isArray(v.shifts))return false;
 const all=[...v.shifts,...(v.active?[v.active]:[])],ids=new Set();
 for(const s of all){if(!s||typeof s.id!=='string'||ids.has(s.id)||!Number.isFinite(s.start)||s.start<0||s.start>Date.now()||!Array.isArray(s.breaks))return false;ids.add(s.id);if(s===v.active){if(s.end!==null)return false;}else if(!Number.isFinite(s.end)||s.end<=s.start||s.end>Date.now())return false;
 let last=s.start;for(const b of s.breaks){if(!b||!Number.isFinite(b.start)||b.start<last||b.start>(s.end??Date.now()))return false;if(b.end===null){if(s!==v.active||b!==s.breaks.at(-1))return false;last=Infinity;}else{if(!Number.isFinite(b.end)||b.end<b.start||b.end>(s.end??Date.now()))return false;last=b.end;}}
 }
 all.sort((a,b)=>a.start-b.start);return all.every((s,i)=>!i||s.start>=(all[i-1].end??Infinity));
}
