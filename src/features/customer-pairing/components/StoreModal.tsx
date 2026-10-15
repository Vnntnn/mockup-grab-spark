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
          <DialogTitle>{storeTitle}</DialogTitle>
          <DialogDescription>
            ระบบนี้เป็นต้นแบบจำลอง (Prototype Demonstration) เพื่อแสดงแนวคิดการจับคู่เมนูข้ามร้าน ไม่ได้เชื่อมต่อกับระบบสั่งอาหารจริง และไม่มีการตัดเงินหรือส่งอาหารจริง
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="default"
            onClick={onClose}
            className="min-h-[48px] px-6"
          >
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
