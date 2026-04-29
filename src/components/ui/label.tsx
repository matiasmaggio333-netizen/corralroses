import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn("text-sm font-medium leading-none", className)}
        {...props}
      />
    )
  }
)

export { Label }
