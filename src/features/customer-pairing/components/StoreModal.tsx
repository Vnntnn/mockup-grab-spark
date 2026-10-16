import { Store } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface StoreModalProps {
  isOpen: boolean
  onClose: () => void
  merchantName: string
}

export function StoreModal({ isOpen, onClose, merchantName }: StoreModalProps) {
  const storeTitle = merchantName.startsWith('ร้าน') ? merchantName : `ร้าน ${merchantName}`
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <span className="mb-1 grid size-12 place-items-center rounded-full bg-accent text-ink">
            <Store className="size-6" aria-hidden="true" />
          </span>
          <DialogTitle>{storeTitle}</DialogTitle>
          <DialogDescription>
            นี่เป็นต้นแบบจำลอง (Prototype) จึงยังไม่มีลิงก์สั่งอาหารของร้านนี้ ไม่มีการสั่งซื้อ ไม่ชำระเงิน และไม่ส่งอาหารจริง
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="default" onClick={onClose} className="min-h-[48px] px-6 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            กลับไปดูคู่เมนู
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
