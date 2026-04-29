import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

type OverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, OverlayProps>(
  function DialogOverlay({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Overlay
        ref={ref}
        className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm", className)}
        {...props}
      />
    )
  }
)

type ContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ContentProps>(
  function DialogContent({ className, children, ...props }, ref) {
    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg sm:rounded-lg max-h-[90vh] overflow-y-auto",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  }
)

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
)

type TitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
const DialogTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, TitleProps>(
  function DialogTitle({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Title
        ref={ref}
        className={cn("text-2xl font-display font-semibold", className)}
        {...props}
      />
    )
  }
)

type DescProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
const DialogDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, DescProps>(
  function DialogDescription({ className, ...props }, ref) {
    return (
      <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    )
  }
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose }
