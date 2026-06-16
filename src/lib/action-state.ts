// Shared form-action state. Kept out of actions.ts because a 'use server'
// module may only export async functions (not values/types).

export type ActionState = { ok: boolean; error: string | null }

export const initialActionState: ActionState = { ok: false, error: null }
