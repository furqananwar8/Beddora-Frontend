"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

const ROLES: FormSelectOption[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const inviteUserSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email."),
  role: z.enum(["admin", "editor", "viewer"] as const),
  message: z.string().optional(),
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export function InviteUserModal() {
  const { control, register, handleSubmit, formState, reset } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      role: "editor",
      message: "",
    },
  });

  const onSubmit = (values: InviteUserFormValues) => {
    console.log("Invite user:", values);
    alert(`Invitation sent to ${values.email}`);
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 dark:ring-offset-zinc-950">
        Invite User
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              Send a new invitation with role and an optional message.
            </DialogDescription>
          </div>
          <DialogClose className="rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <X />
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 pt-4">
          <label className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <span>Email</span>
            <Input
              type="email"
              aria-invalid={Boolean(formState.errors.email)}
              {...register("email")}
              placeholder="name@example.com"
            />
            {formState.errors.email ? (
              <span className="text-xs text-destructive">{formState.errors.email.message}</span>
            ) : null}
          </label>

          <FormSelect<InviteUserFormValues>
            control={control}
            name="role"
            label="Role / permission level"
            options={ROLES}
            placeholder="Select a role"
          />

          <label className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-200">
              <span>Optional message</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Optional</span>
            </div>
            <textarea
              {...register("message")}
              placeholder="Add a short message to include with the invite"
              className="min-h-30 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-zinc-900 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-zinc-700 dark:bg-input/30 dark:text-zinc-100"
            />
          </label>

          <DialogFooter>
            <DialogClose
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={!formState.isValid && Object.keys(formState.errors).length > 0}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
