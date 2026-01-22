'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-800',
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header skeleton */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-24 h-6" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section skeleton */}
        <div className="mb-8">
          <Skeleton className="w-64 h-9 mb-2" />
          <Skeleton className="w-96 h-5" />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 rounded-xl p-6 border border-slate-800">
              <Skeleton className="w-24 h-4 mb-4" />
              <Skeleton className="w-16 h-9 mb-4" />
              <Skeleton className="w-full h-2" />
            </div>
          ))}
        </div>

        {/* Recent contracts skeleton */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <Skeleton className="w-40 h-6" />
          </div>
          <div className="divide-y divide-slate-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="w-48 h-5 mb-2" />
                    <Skeleton className="w-32 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-8" />
                  <Skeleton className="w-20 h-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function VaultSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header skeleton */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-24 h-6" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Skeleton className="w-48 h-9 mb-2" />
            <Skeleton className="w-32 h-5" />
          </div>
          <Skeleton className="w-48 h-10 rounded-lg" />
        </div>

        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="w-36 h-10 rounded-lg" />
          <Skeleton className="w-40 h-10 rounded-lg" />
        </div>

        {/* Contracts grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="w-20 h-6 rounded-full" />
              </div>
              <Skeleton className="w-full h-5 mb-2" />
              <Skeleton className="w-3/4 h-4 mb-4" />
              <Skeleton className="w-full h-10 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-16 h-4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header skeleton */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-24 h-6" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="w-32 h-9 mb-8" />

        <div className="space-y-8">
          {/* Profile section skeleton */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <Skeleton className="w-20 h-6 mb-2" />
              <Skeleton className="w-48 h-4" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="w-24 h-4 mb-2" />
                  <Skeleton className="w-full h-10 rounded-lg" />
                </div>
              ))}
              <Skeleton className="w-32 h-10 rounded-lg" />
            </div>
          </div>

          {/* Subscription section skeleton */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <Skeleton className="w-28 h-6 mb-2" />
              <Skeleton className="w-56 h-4" />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                  <Skeleton className="w-48 h-4" />
                </div>
                <Skeleton className="w-24 h-10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ContractDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header skeleton */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-24 h-6" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link skeleton */}
        <Skeleton className="w-28 h-5 mb-6" />

        {/* Contract header skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
          <div>
            <Skeleton className="w-80 h-9 mb-2" />
            <Skeleton className="w-48 h-5 mb-1" />
            <Skeleton className="w-32 h-4" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="w-32 h-24 rounded-xl" />
            <Skeleton className="w-28 h-10 rounded-full" />
          </div>
        </div>

        {/* Executive summary skeleton */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 mb-8">
          <Skeleton className="w-40 h-6 mb-4" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-3/4 h-4" />
        </div>

        {/* Tabs skeleton */}
        <div className="border-b border-slate-800 mb-6">
          <div className="flex gap-8">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-24 h-6" />
            <Skeleton className="w-24 h-6" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <Skeleton className="w-24 h-4 mb-2" />
              <Skeleton className="w-full h-5" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function AnalyzeSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header skeleton */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-24 h-6" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="w-56 h-9 mb-2" />
        <Skeleton className="w-96 h-5 mb-8" />

        {/* Upload area skeleton */}
        <div className="bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 p-12">
          <div className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="w-48 h-6 mx-auto mb-2" />
            <Skeleton className="w-64 h-4 mx-auto" />
          </div>
        </div>
      </main>
    </div>
  );
}
