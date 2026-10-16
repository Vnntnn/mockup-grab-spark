import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] border border-transparent bg-clip-padding text-[17px] font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--dur-instant)] ease-[var(--ease-out)] outline-none select-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:not-aria-[haspopup]:translate-y-[2px] active:not-aria-[haspopup]:scale-[0.985] motion-reduce:active:translate-y-0 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        outline:
          "border-border bg-card text-ink hover:bg-secondary hover:text-ink shadow-xs",
        secondary:
          "bg-secondary text-ink hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary text-ink hover:text-ink",
        destructive:
          "bg-danger-soft text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40",
        link: "text-link underline-offset-4 hover:underline font-medium p-0 h-auto min-h-0",
      },
      size: {
        default:
          "h-12 min-h-[48px] gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        sm: "h-11 min-h-[44px] gap-1.5 px-4 text-[15px] font-semibold has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 min-h-[56px] gap-2 px-7 text-[17px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-12 min-h-[48px] min-w-[48px] p-0",
        "icon-sm": "size-11 min-h-[44px] min-w-[44px] p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14 min-h-[56px] min-w-[56px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
