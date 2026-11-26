export const MAX_QUEUE_BATCH = 100
export type QueuePlan = { content_id: string; revision: number; status: string; planned_at: string }
export type QueueJob = { id: string; content_id: string; plan_revision: number; status: string; planned_at: string }
export function stageablePlans<P extends QueuePlan>(plans: P[], jobs: QueueJob[], now = Date.now()): P[] {
 const staged = new Set(jobs.map(j=>`${j.content_id}:${j.plan_revision}`))
 return plans.filter(p=>p.status === 'planned' && Date.parse(p.planned_at)>now && !staged.has(`${p.content_id}:${p.revision}`))
}
export function stagePayload(plans: QueuePlan[]) {
 if(plans.length<1||plans.length>MAX_QUEUE_BATCH||new Set(plans.map(p=>p.content_id)).size!==plans.length) throw new Error('Select 1–100 unique plans.')
 if(plans.some(p=>p.status!=='planned'||!Number.isSafeInteger(p.revision)||p.revision<1)) throw new Error('Refresh changed plans first.')
 return plans.map(p=>({contentId:p.content_id,revision:p.revision}))
}
export function pausePayload(jobs: QueueJob[]) {
 if(jobs.length<1||jobs.length>MAX_QUEUE_BATCH||new Set(jobs.map(j=>j.id)).size!==jobs.length) throw new Error('Select 1–100 unique jobs.')
 if(jobs.some(j=>j.status!=='held'&&j.status!=='paused')) throw new Error('Only active jobs can be paused or resumed.')
 return jobs.map(j=>({jobId:j.id,status:j.status}))
}
