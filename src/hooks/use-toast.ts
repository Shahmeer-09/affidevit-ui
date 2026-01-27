import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

function toast({ title, description, variant }: ToastOptions) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
    })
  }
  
  return sonnerToast.success(title, {
    description,
  })
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}

export { useToast, toast }
