"use client";
import AmazonIcon from "@/components/icons/amazon";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLoginWithAmazon = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/amazon/login', {
        credentials: 'include', // sends localhost cookie if present
      });

      if (!res.ok) {
        throw new Error(`Failed to initiate login: ${res.status}`);
      }

      const { url } = await res.json();

      window.location.href = url; // navigate to Amazon
    } catch (err) {
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
        </div>
      </div>
    </div>
  );
}