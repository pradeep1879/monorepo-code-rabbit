import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from "@/components/ui/card";
import React from 'react'

const RepositorySkeleton = () => {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="space-y-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-full max-w-125" />
              <Skeleton className="h-4 w-[80%]" />
            </div>

            <div className="flex gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>

          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

export default RepositorySkeleton
