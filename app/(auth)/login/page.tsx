"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/schemas";
import { loginAction } from "@/actions/auth";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { z } from "zod";
import { motion } from "motion/react";
import { ChefHat, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Owner", email: "owner@queenskitchen.com" },
  { role: "Operations Manager", email: "manager@queenskitchen.com" },
  { role: "Head Chef", email: "headchef@queenskitchen.com" },
  { role: "Chef", email: "chef1@queenskitchen.com" },
  { role: "Inventory Manager", email: "inventory@queenskitchen.com" },
  { role: "Packing Staff", email: "packer@queenskitchen.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "password123",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await loginAction(data.email);
      if (res.success && res.user) {
        setUser(res.user);
        toast.success(`Welcome back, ${res.user.name}!`);
        router.push("/dashboard");
      } else {
        toast.error(res.error || "Login failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (email: string) => {
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Brand Logo & Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20"
        >
          <ChefHat className="h-8 w-8" />
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl font-extrabold tracking-tight text-foreground"
        >
          Queen's Cloud Kitchen
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          Enterprise Kitchen OS & Operations Platform
        </motion.p>
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-8 shadow-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-label uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </span>
              <input
                {...register("email")}
                type="email"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                placeholder="you@queenskitchen.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-label uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <input
                {...register("password")}
                type="password"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Accounts Selector */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Demo Portal Access (Click to autofill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleDemoClick(acc.email)}
                className="text-left px-3 py-2 bg-muted/60 hover:bg-muted border border-border hover:border-emerald-500/30 rounded-lg text-xs text-foreground transition-all duration-150 truncate"
              >
                <span className="block font-semibold text-emerald-500 truncate">{acc.role}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
