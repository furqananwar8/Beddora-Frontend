"use client";

import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { GlobalForm } from "../common/GlobalForm";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { inviteUser } from "@/api/user.api";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

type InviteUserFormValues = {
  email: string;
};

export function InviteUserModal() {
  const [open, setOpen] = useState(false);

  const schema = yup.object({
    email: yup.string().email("Invalid email").required("Email required"),
  });

  const form = useForm<InviteUserFormValues>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (data) => {
      toast.success(data.message || `Invitation sent to ${data.invitedUser.email}`);
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send invitation. Please try again.";
      toast.error(message);
    },
  });

  const onSubmit = (values: InviteUserFormValues) => {
    inviteUserMutation.mutate({ email: values.email });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="cursor-pointer inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 dark:ring-offset-zinc-950">
        Invite User
      </DialogTrigger>

      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>Send an invitation via email.</DialogDescription>
          </div>

          <DialogClose className="cursor-pointer rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <X />
          </DialogClose>
        </div>

        {inviteUserMutation.isPending ? (
          <Spinner />
        ) : (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <GlobalForm
                formWrapperClassName="flex flex-col gap-4"
                fields={[
                  {
                    name: "email",
                    label: "Email",
                    placeholder: "Enter email",
                    type: "email",
                    rules: {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    },
                  },
                ]}
              />

              <DialogFooter>
                <DialogClose
                  type="button"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </DialogClose>

                <Button
                  type="submit"
                  disabled={!form.formState.isValid}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send invite
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}