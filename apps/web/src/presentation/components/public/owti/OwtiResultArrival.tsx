"use client";

import { useEffect } from "react";

import {
  OWTI_ANSWERS_STORAGE_KEY,
  OWTI_LOGIN_PENDING_STORAGE_KEY,
} from "@/presentation/lib/owtiStorage";

/** Clear the completed questionnaire after a successful Kakao round trip. */
export function OwtiResultArrival({ code }: { code: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(OWTI_LOGIN_PENDING_STORAGE_KEY) !== code) {
        return;
      }
      sessionStorage.removeItem(OWTI_ANSWERS_STORAGE_KEY);
      sessionStorage.removeItem(OWTI_LOGIN_PENDING_STORAGE_KEY);
    } catch {
      /* storage disabled — there is nothing to clean up */
    }
  }, [code]);

  return null;
}
