import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-pulse">
      {/* 6 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="bg-neutral-900/30 border-neutral-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-20 bg-neutral-800" />
              <Skeleton className="h-4 w-4 rounded-full bg-neutral-800" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-32 bg-neutral-800" />
                <Skeleton className="h-3.5 w-24 bg-neutral-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control and Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Control Panel Skeleton */}
        <div className="lg:col-span-2">
          <Card className="bg-neutral-900/20 border-neutral-800 h-full">
            <CardHeader className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28 bg-neutral-800" />
              <Skeleton className="h-6 w-44 bg-neutral-800" />
              <Skeleton className="h-4 w-72 bg-neutral-800" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-4">
              <Skeleton className="h-20 w-full rounded-xl bg-neutral-800" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Skeleton className="h-6 w-40 bg-neutral-800" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Skeleton className="h-10 w-28 bg-neutral-800" />
                  <Skeleton className="h-10 w-28 bg-neutral-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Panel Skeleton */}
        <div>
          <Card className="bg-neutral-900/20 border-neutral-800 h-full">
            <CardHeader className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24 bg-neutral-800" />
              <Skeleton className="h-6 w-36 bg-neutral-800" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-850 last:border-0">
                  <Skeleton className="h-4 w-28 bg-neutral-800" />
                  <Skeleton className="h-4 w-16 bg-neutral-800" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
