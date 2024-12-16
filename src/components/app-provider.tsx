'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { Toaster } from "@/components/ui/toaster"
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false
        }
    }
})
export default function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <Toaster />
            {children}
        </QueryClientProvider>
    )
}
