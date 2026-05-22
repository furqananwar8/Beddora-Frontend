"use client";

import * as React from "react";
import * as DialogPrimitive from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

function Dialog({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Root>) {
  return <DialogPrimitive.Dialog.Root {...props}>{children}</DialogPrimitive.Dialog.Root>;
}

function DialogTrigger({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Trigger>) {
  return <DialogPrimitive.Dialog.Trigger className={cn(className)} {...props} />;
}

function DialogPortal({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Portal>) {
  return (
    <DialogPrimitive.Dialog.Portal className={cn(className)} {...props}>
      {children}
    </DialogPrimitive.Dialog.Portal>
  );
}

function DialogBackdrop({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Backdrop>) {
  return (
    <DialogPrimitive.Dialog.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Popup>) {
  return (
    <DialogPrimitive.Dialog.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Dialog.Popup
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[min(95vw,32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-2xl shadow-zinc-950/10 outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Popup>
    </DialogPrimitive.Dialog.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Title>) {
  return (
    <DialogPrimitive.Dialog.Title
      className={cn("text-lg font-semibold text-zinc-900 dark:text-zinc-100", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Description>) {
  return (
    <DialogPrimitive.Dialog.Description className={cn("text-sm leading-6 text-zinc-500 dark:text-zinc-400", className)} {...props} />
  );
}

function DialogClose({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Dialog.Close>) {
  return <DialogPrimitive.Dialog.Close className={cn(className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
