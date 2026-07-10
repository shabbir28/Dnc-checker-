const axios = require("axios");

/**
 * Sends a DNC check summary to the CRM backend.
 * Never throws — CRM unavailability must not break the main DNC flow.
 *
 * @param {Object} payload  - Summary data to POST to CRM
 * @param {boolean} isSingle - True if sending a single DNC check result
 * @returns {{ success: boolean, data?: any, message?: string }}
 */
const syncDncResultToCrm = async (payload, isSingle = false) => {
  let url = process.env.CRM_SYNC_URL;
  const secret = process.env.CRM_SYNC_SECRET;

  if (!url || !secret) {
    console.warn("[CRM Sync] CRM_SYNC_URL or CRM_SYNC_SECRET not set. Skipping sync.");
    return { success: false, message: "CRM sync not configured." };
  }

  if (isSingle) {
    url = url.replace(/\/results\/?$/, "/single-result");
  }

  const attemptPost = async () => {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
    return response;
  };

  // First attempt
  try {
    const response = await attemptPost();
    return { success: true, data: response.data };
  } catch (firstErr) {
    console.warn(
      "[CRM Sync] First attempt failed:",
      firstErr.response?.data || firstErr.message
    );
  }

  // Retry after 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const response = await attemptPost();
    console.log("[CRM Sync] Retry succeeded.");
    return { success: true, data: response.data };
  } catch (retryErr) {
    const message =
      retryErr.response?.data?.message ||
      retryErr.message ||
      "CRM sync failed after retry.";
    console.error("[CRM Sync] Retry also failed:", message);
    return { success: false, message };
  }
};

module.exports = { syncDncResultToCrm };
