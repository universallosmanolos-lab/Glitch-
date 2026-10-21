// Ads management utility for libtl SDK tag (show_12089328)

declare global {
  interface Window {
    show_12089328?: () => Promise<any>;
  }
}

export interface AdResult {
  success: boolean;
  reason?: 'SDK_NOT_LOADED' | 'REJECTED_OR_CANCELLED' | 'UNKNOWN_ERROR';
  details?: any;
}

/**
 * Executes show_12089328() from the installed libtl SDK tag.
 * Replaces the test alert with a verified reward callback.
 * 
 * Strict compliance:
 * - If the provider function is not defined/loaded: fails cleanly without granting reward or freezing.
 * - If the promise rejects or indicates incomplete viewing: fails cleanly without granting reward.
 * - Only upon genuine resolution of the SDK's promise does it return success: true.
 * - No mock or artificial simulation fallback is used.
 */
export async function requestRewardedAd(): Promise<AdResult> {
  if (typeof window === 'undefined' || typeof window.show_12089328 !== 'function') {
    console.warn('[Ads SDK] show_12089328 is not loaded or blocked by browser/ad-blocker.');
    return {
      success: false,
      reason: 'SDK_NOT_LOADED',
    };
  }

  try {
    const result = await window.show_12089328();

    // Check if the provider returns a specific payload indicating incomplete or dismissed view
    if (result === false || (result && typeof result === 'object' && (result.status === 'dismissed' || result.status === 'error' || result.rewarded === false))) {
      return {
        success: false,
        reason: 'REJECTED_OR_CANCELLED',
        details: result,
      };
    }

    return {
      success: true,
      details: result,
    };
  } catch (error) {
    console.warn('[Ads SDK] show_12089328 rejected or encountered an error:', error);
    return {
      success: false,
      reason: 'REJECTED_OR_CANCELLED',
      details: error,
    };
  }
}
