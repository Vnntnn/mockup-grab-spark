import { ok, reject } from './types'
import type { GemHunterCampaign, MenuAudit, MenuAuditItem, MenuHistoryEntry, Result, Validation } from './types'

export const MAX_TITLE_LENGTH = 60

/** An attribute counts only if it is in the verified list AND has a provenance tag. Widening the list alone is not enough. */
export function unverifiedAttributes(item: MenuAuditItem): string[] {
  return item.suggestionAttributes.filter((a) => !item.verifiedAttributes.includes(a) || !item.attributeSource[a])
}

/** A suggestion may only describe attributes that were verified or confirmed by the merchant. No attributes means nothing backs the claim. */
export function validateSuggestion(item: MenuAuditItem): Validation<'invalid_attributes'> {
  const bad = unverifiedAttributes(item)
  if (bad.length > 0) return reject('invalid_attributes', `ชื่อที่แนะนำใช้ข้อมูลที่ยังไม่ได้ยืนยัน: ${bad.join(', ')}`)
  if (item.suggestionAttributes.length === 0) return reject('invalid_attributes', 'ชื่อที่แนะนำยังไม่มีข้อมูลที่ยืนยันแล้วรองรับ')
  return { ok: true }
}

export function validateEditedTitle(title: string): Result<string, 'empty_title' | 'title_too_long'> {
  const t = title.trim()
  if (t.length === 0) return reject('empty_title', 'กรุณาพิมพ์ชื่อเมนู')
  if ([...t].length > MAX_TITLE_LENGTH) return reject('title_too_long', `ชื่อเมนูยาวเกิน ${MAX_TITLE_LENGTH} ตัวอักษร`)
  return ok(t)
}

type MenuCode = 'unknown_item' | 'invalid_attributes' | 'empty_title' | 'title_too_long'

/** Appends to the trail from the title the storefront had to the one it has now. Nothing is written for a refused decision. */
const withHistory = (item: MenuAuditItem, next: MenuAuditItem, action: MenuHistoryEntry['action']): MenuAuditItem => ({
  ...next,
  history: [...item.history, { action, from: item.publishedTitle, to: next.publishedTitle }],
})

function updateItem(audit: MenuAudit, itemId: string, fn: (item: MenuAuditItem) => Result<MenuAuditItem, MenuCode>): Result<MenuAudit, MenuCode> {
  const item = audit.items.find((i) => i.id === itemId)
  if (!item) return reject('unknown_item', 'ไม่พบเมนูนี้')
  const r = fn(item)
  if (!r.ok) return r
  return ok({ items: audit.items.map((i) => (i.id === itemId ? r.value : i)) })
}

/** Accept publishes the suggestion; keep leaves the storefront title as it was. Neither happens without the merchant's explicit call. */
export function decideMenuItem(audit: MenuAudit, itemId: string, decision: 'accepted' | 'kept'): Result<MenuAudit, MenuCode> {
  return updateItem(audit, itemId, (item) => {
    if (decision === 'kept') return ok(withHistory(item, { ...item, decision, editedTitle: undefined, publishedTitle: item.currentTitle }, 'kept'))
    const v = validateSuggestion(item)
    if (!v.ok) return v
    return ok(withHistory(item, { ...item, decision, editedTitle: undefined, publishedTitle: item.suggestedTitle }, 'accepted'))
  })
}

export function editMenuItem(audit: MenuAudit, itemId: string, title: string): Result<MenuAudit, MenuCode> {
  return updateItem(audit, itemId, (item) => {
    const t = validateEditedTitle(title)
    if (!t.ok) return t
    return ok(withHistory(item, { ...item, decision: 'edited' as const, editedTitle: t.value, publishedTitle: t.value }, 'edited'))
  })
}

/** Items the one-click approve would accept: still pending and the suggestion passes validation. */
export const approvableItems = (audit: MenuAudit): MenuAuditItem[] => audit.items.filter((i) => i.decision === 'pending' && validateSuggestion(i).ok)

/**
 * One-click approve: accepts every approvable item and skips the rest (invalid suggestions, decisions the merchant already made).
 * Refused when there is nothing to approve. Each accept goes through the same path as a single decision, so it is just as reversible.
 */
export function approveAllSuggestions(audit: MenuAudit): Result<MenuAudit, 'nothing_to_approve'> {
  const ids = new Set(approvableItems(audit).map((i) => i.id))
  if (ids.size === 0) return reject('nothing_to_approve', 'ไม่มีชื่อเมนูที่แนะนำและรอการอนุมัติ')
  let next = audit
  for (const id of ids) {
    const r = decideMenuItem(next, id, 'accepted')
    if (r.ok) next = r.value
  }
  return ok(next)
}

export function isMenuAuditComplete(audit: MenuAudit): boolean {
  return audit.items.length > 0 && audit.items.every((i) => i.decision !== 'pending')
}

/** The title customers see for this item right now. */
export function storefrontTitle(campaign: Pick<GemHunterCampaign, 'menuAudit'>, item: MenuAuditItem): string {
  return campaign.menuAudit.items.find((i) => i.id === item.id)?.publishedTitle ?? item.publishedTitle
}
