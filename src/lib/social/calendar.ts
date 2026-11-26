export const MAX_BATCH = 100
export type DeliveryKind = "post" | "reel" | "video" | "short"
export function deliveryKinds(platform?:string,format?:string):DeliveryKind[] {
 if(platform==="facebook") return format==="video"?["video","reel"]:format==="text"||format==="image"?["post"]:[]
 if(platform==="instagram") return format==="video"?["reel"]:format==="image"?["post"]:[]
 if(platform==="youtube"&&format==="video") return ["video","short"]
 if(platform==="google_business"&&(format==="text"||format==="image")) return ["post"]
 return []
}
export function localInput(date:Date):string {
 const pad=(n:number)=>String(n).padStart(2,"0")
 return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
export function toFutureUtc(value:string,now=Date.now()):string {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choose a date and time.")
 const d=new Date(value)
 if(!Number.isFinite(d.getTime())||localInput(d)!==value) throw new Error("Invalid or nonexistent local time (DST).")
 // Reject ambiguous DST fold times; choose an unambiguous minute instead.
 for(let offset=15;offset<=180;offset+=15){
  if(localInput(new Date(d.getTime()+offset*60000))===value||localInput(new Date(d.getTime()-offset*60000))===value) throw new Error("Ambiguous local time (DST); choose another minute.")
 }
 if(d.getTime()<=now) throw new Error("Choose a future date and time.")
 return d.toISOString()
}
export function spacedTimes(value:string,interval:number,count:number,now=Date.now()):string[] {
 if(!Number.isInteger(count)||count<1||count>MAX_BATCH) throw new Error("Select 1–100 posts.")
 if(!Number.isInteger(interval)||interval<0||interval>10080) throw new Error("Interval must be 0–10080 minutes.")
 const first=Date.parse(toFutureUtc(value,now))
 return Array.from({length:count},(_,i)=>localInput(new Date(first+i*interval*60000)))
}
