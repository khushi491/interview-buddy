"use client"

import { useState, useCallback } from "react"

type LoaderState =
  | "pre_interview"
  | "waiting_room"
  | "interviewer_prep"
  | "first_impression"
  | "deep_dive"
  | "evaluation"
  | "decision_making"

interface UseInterviewLoaderReturn {
  isLoading: boolean
  loaderState: LoaderState
  showLoader: (state?: LoaderState, duration?: number) => void
  hideLoader: () => void
  setLoaderState: (state: LoaderState) => void
}

export function useInterviewLoader(): UseInterviewLoaderReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [loaderState, setLoaderState] = useState<LoaderState>("pre_interview")

  const showLoader = useCallback((state: LoaderState = "pre_interview", duration?: number) => {
    setLoaderState(state)
    setIsLoading(true)

    if (duration) {
      setTimeout(() => {
        setIsLoading(false)
      }, duration)
    }
  }, [])

  const hideLoader = useCallback(() => {
    setIsLoading(false)
  }, [])

  return {
    isLoading,
    loaderState,
    showLoader,
    hideLoader,
    setLoaderState,
  }
}
