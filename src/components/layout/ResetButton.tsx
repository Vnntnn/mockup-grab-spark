import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useApp } from '@/app/store'
import { todayISO } from '@/lib/dates'

export function ResetButton({ variant = 'outline', className }: { variant?: 'outline' | 'ghost'; className?: string }) {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <>
      <Button variant={variant} className={`h-11 px-4 text-[15px] ${className ?? ''}`} onClick={() => setOpen(true)}>
        <RotateCcw data-icon="inline-start" />
        รีเซ็ตข้อมูลตัวอย่าง
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตข้อมูลตัวอย่าง</DialogTitle>
            <DialogDescription>
              สิ่งที่คุณลองทำในต้นแบบนี้ทั้งหมด (การยืนยัน แคมเปญ ข้อมูลร้านที่แก้ไข) จะกลับเป็นค่าเริ่มต้น ไม่มีข้อมูลจริงถูกลบ
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-11 text-[15px]" onClick={() => setOpen(false)}>
              ไม่รีเซ็ต
            </Button>
            <Button
              className="h-11 text-[15px]"
              onClick={() => {
                dispatch({ type: 'reset', today: todayISO() })
                setOpen(false)
                navigate('/dashboard')
                toast.success('รีเซ็ตข้อมูลตัวอย่างแล้ว')
              }}
            >
              รีเซ็ตข้อมูลตัวอย่าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
