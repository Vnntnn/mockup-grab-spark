import { isMenuAuditComplete } from './menu-audit'
import { approvedPhotos, approvedSubmissions } from './submissions'
import type { GemHunterCampaign, GraduationCheck, GraduationEvidence, GraduationImprovement } from './types'

/** Up to two decimals, no trailing zeros: 4.2 -> "4.2", 4.25 -> "4.25". */
export const fmtRating = (n: number) => Number(n.toFixed(2)).toString()

/**
 * Only moderator-approved reviews count, whatever their rating (low ratings are kept, there is no positivity filter).
 * Average is sum / n, so exactly 4.2 over 10 reviews is not above 4.2.
 */
export function evidenceOf(campaign: Pick<GemHunterCampaign, 'submissions' | 'menuAudit' | 'config'>): GraduationEvidence {
  const { minValidReviews, minAverageRatingExclusive } = campaign.config
  const reviews = approvedSubmissions(campaign.submissions)
  const validReviews = reviews.length
  const averageRating = validReviews === 0 ? null : reviews.reduce((sum, s) => sum + s.rating, 0) / validReviews
  const menuAuditComplete = isMenuAuditComplete(campaign.menuAudit)
  const decided = campaign.menuAudit.items.filter((i) => i.decision !== 'pending').length
  const totalItems = campaign.menuAudit.items.length

  const reviewsOk = validReviews >= minValidReviews
  const ratingOk = averageRating !== null && averageRating > minAverageRatingExclusive

  const checks: GraduationCheck[] = [
    {
      id: 'reviews',
      label: `รีวิวที่ผ่านการตรวจสอบอย่างน้อย ${minValidReviews} รีวิว`,
      passed: reviewsOk,
      detail: reviewsOk ? `มี ${validReviews} รีวิว` : `ยังมีรีวิวที่ผ่านการตรวจสอบ ${validReviews} จาก ${minValidReviews}`,
    },
    {
      id: 'rating',
      label: `คะแนนเฉลี่ยมากกว่า ${minAverageRatingExclusive}`,
      passed: ratingOk,
      detail:
        averageRating === null
          ? 'ยังไม่มีรีวิวที่ผ่านการตรวจสอบ จึงยังคำนวณคะแนนเฉลี่ยไม่ได้'
          : ratingOk
            ? `คะแนนเฉลี่ย ${fmtRating(averageRating)}`
            : `คะแนนเฉลี่ยตอนนี้ ${fmtRating(averageRating)} ต้องมากกว่า ${minAverageRatingExclusive}`,
    },
    {
      id: 'menu',
      label: 'ตัดสินใจชื่อเมนูครบทุกรายการ',
      passed: menuAuditComplete,
      detail: menuAuditComplete ? `ตัดสินใจแล้ว ${decided} จาก ${totalItems} รายการ` : `ยังตัดสินใจชื่อเมนูไม่ครบ (${decided} จาก ${totalItems} รายการ)`,
    },
  ]

  const improvement = improvementFor(checks, { validReviews, minValidReviews, averageRating, decided, totalItems })

  return {
    validReviews,
    averageRating,
    approvedPhotos: approvedPhotos(campaign).length,
    menuAuditComplete,
    checks,
    eligible: checks.every((c) => c.passed),
    unmet: checks.filter((c) => !c.passed).map((c) => c.detail),
    improvement,
  }
}

/**
 * Guidance for a check that is not met yet. Assumptions: the thresholds are a configurable demo rule, a miss is never permanent
 * (reviews keep arriving, the menu can still be decided), and the advice never asks anyone to collect better ratings.
 */
function improvementFor(
  checks: GraduationCheck[],
  n: { validReviews: number; minValidReviews: number; averageRating: number | null; decided: number; totalItems: number },
): GraduationImprovement {
  const unmet = checks.filter((c) => !c.passed)
  if (unmet.length === 0) return { permanent: false, text: 'ครบเกณฑ์ตัวอย่างแล้ว', nextSteps: [] }
  const text: Record<GraduationCheck['id'], string> = {
    reviews: `รอรีวิวที่ผ่านการตรวจสอบเพิ่มอีก ${Math.max(0, n.minValidReviews - n.validReviews)} รีวิว`,
    rating:
      n.averageRating === null
        ? 'เมื่อมีรีวิวที่ผ่านการตรวจสอบ ระบบจะคำนวณคะแนนเฉลี่ยให้เอง'
        : 'คะแนนเฉลี่ยเปลี่ยนได้เมื่อมีรีวิวใหม่ที่ผ่านการตรวจสอบ ระบบไม่ได้คัดรีวิวคะแนนต่ำออก',
    menu: `ตัดสินใจชื่อเมนูที่เหลืออีก ${n.totalItems - n.decided} รายการ`,
  }
  return {
    permanent: false,
    text: 'ยังไม่ครบเกณฑ์ตัวอย่าง ไม่ใช่การตัดสิทธิ์ถาวร กลับมาตรวจใหม่ได้เมื่อมีข้อมูลเพิ่ม',
    nextSteps: unmet.map((c) => ({ checkId: c.id, text: text[c.id] })),
  }
}
