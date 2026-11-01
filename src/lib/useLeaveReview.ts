import { useState } from 'react';
import { useApp } from '../context/AppContext';

/** Approve/reject with a busy flag per request; failures surface in the app-wide error banner. */
export const useLeaveReview = () => {
  const { updateLeaveRequestStatus, showError } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  const review = async (requestId: string, status: 'Approved' | 'Rejected') => {
    if (busyId) return;
    setBusyId(requestId);
    const result = await updateLeaveRequestStatus(requestId, status);
    setBusyId(null);
    if (!result.ok) showError(`Couldn't mark the leave request ${status.toLowerCase()}: ${result.error}`);
  };

  return { review, busyId };
};
