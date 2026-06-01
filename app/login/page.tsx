"use client";
import AmazonIcon from "@/components/icons/amazon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
// import { AmazonIcon } from "@/components/icons/amazon"

export default function LoginPage() {
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const handleLoginWithAmazon = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/amazon/login`, {
        credentials: "include", // ← critical: sends/receives sid cookie
      });
      if (!res.ok) {
        throw new Error(`Failed to initiate login: ${res.status}`);
      }
      const { url } = await res.json();
      window.location.href = url; // navigate to Amazon
    } catch (err) {
      console.log("Login initiation failed:", err);

      toast.error("Failed to start login. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center space-y-2">
          <div className="flex flex-col items-center">
            <Image
              src="/beddora-logo.svg"
              alt="Beddora"
              width={300}
              height={300}
              className=""
            />
            <p>Campaign Managment Tool</p>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Login to access your campaigns
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            onClick={handleLoginWithAmazon}
            size="lg"
            className="bg-[#FF9900] text-black hover:bg-[#FF9900]/90 border-transparent dark:bg-[#FF9900] dark:text-black dark:hover:bg-[#FF9900]/80 w-full h-12 text-lg font-semibold rounded-xl shadow-lg transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : ""}
            <AmazonIcon />
            Continue with Amazon
          </Button>

          {/* <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm font-medium leading-6">
              <span className="bg-white dark:bg-zinc-900 px-4 text-zinc-400">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
          >
            Email address
          </Button> */}
        </div>

        {/* <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          By signing in, you agree to our{" "}
          <a
            href="#"
            className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="font-semibold text-zinc-900 dark:text-zinc-50 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p> */}
      </div>
    </div>
  );
}
