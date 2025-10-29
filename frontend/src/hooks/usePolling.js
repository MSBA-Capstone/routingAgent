import { useEffect, useRef } from 'react';

export function usePolling(apiBaseUrl, onComplete, onError, interval = 2000) {
  const intervalRef = useRef(null);
  const jobIdRef = useRef(null);

  const startPolling = (jobId) => {
    jobIdRef.current = jobId;
    intervalRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`${apiBaseUrl}/job_status/${jobId}`);
        const statusData = await statusRes.json();
        if (statusData.status === "completed") {
          stopPolling();
          onComplete(statusData.result);
        } else if (statusData.status === "error") {
          stopPolling();
          onError(statusData.result);
        }
      } catch (pollErr) {
        stopPolling();
        onError(`Error polling status: ${pollErr.message}`);
      }
    }, interval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling(); // Cleanup on unmount
  }, []);

  return { startPolling, stopPolling };
}