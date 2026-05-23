'use client'
import { ArrowRight, GitBranchPlusIcon, GitPullRequest, Loader2, ShieldCheck, Sparkles, Stars } from 'lucide-react'
import React, { useState } from 'react'

import { signIn } from "@repo/auth/client"

const GithubLoginUI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const handleGithubLogin = async () => {
    setIsLoading(true);

    try {
      await signIn.social({
        provider: "github",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="min-h-screen overflow-hidden bg-black text-white">
      <div className="relative flex min-h-screen">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute left-[-10%] top-[-10%] h-125 w-125 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] h-125 w-125 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
        </div>

        {/* Left Side */}
        <div className="relative hidden w-[55%] border-r border-white/10 lg:flex">
          <div className="flex w-full flex-col justify-between p-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-2xl shadow-white/20">
                <GitPullRequest className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  CodeRabbit
                </h1>
                <p className="text-sm text-zinc-400">
                  AI code review platform
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Faster reviews. Cleaner merges.
              </div>

              <h2 className="text-6xl font-semibold leading-[1.05] tracking-tight">
                Review pull requests
                <span className="block text-zinc-500">
                  with AI precision.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
                Automatically detect bugs, improve code quality, and speed up
                engineering workflows with intelligent pull request reviews.
              </p>

              {/* Features */}
            </div>

            {/* Bottom */}
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck
                 className="h-4 w-4" />
                Enterprise-grade security
              </div>

              <div className="flex items-center gap-2">
                <Stars className="h-4 w-4" />
                Trusted by modern dev teams
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="relative flex w-full items-center justify-center px-6 py-10 lg:w-[45%]">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                <GitPullRequest className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold">CodeRabbit</h1>
                <p className="text-sm text-zinc-500">
                  AI code review platform
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/4 p-8 shadow-2xl backdrop-blur-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Welcome back
                </h2>

                <p className="mt-3 text-zinc-400">
                  Sign in with GitHub to continue to your dashboard.
                </p>
              </div>

              {/* Login Button */}
              <button
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white font-medium text-black transition-all duration-300 hover:scale-[1.01] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <GitBranchPlusIcon className="h-5 w-5" />
                    Continue with GitHub
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="mt-6 text-center text-sm leading-6 text-zinc-500">
                By continuing, you agree to our{" "}
                <span className="cursor-pointer text-zinc-300 hover:text-white">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="cursor-pointer text-zinc-300 hover:text-white">
                  Privacy Policy
                </span>
                .
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-zinc-600">
              Built for developers who care about code quality.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GithubLoginUI
