import { useState } from "react";

export function useLoading() {
  const [loading, setLoading] = useState({
    loading: false,
    message: "",
    progress: 0,
  });

  return {
    loading,
    setLoading,
  };
}
