// Rewarded interstitial implementation for libtl / Monetag SDK (show_12089328)

declare global {
  interface Window {
    show_12089328?: () => Promise<any>;
  }
  function show_12089328(): Promise<any>;
}

export interface AdResult {
  success: boolean;
  reason?: 'SDK_NOT_LOADED' | 'REJECTED_OR_CANCELLED' | 'UNKNOWN_ERROR';
  details?: any;
}

export interface AdDiagnostics {
  tagPresent: boolean;
  tagSrc: string | null;
  tagZone: string | null;
  tagSdk: string | null;
  isFunctionDefined: boolean;
  origin: string;
  hostname: string;
  isSandboxedIframe: boolean;
  recommendation: string;
}

/**
 * Plantilla oficial del proveedor de anuncios:
 * 
 * // Rewarded interstitial
 * 
 * show_12089328().then(() => {
 *     // You need to add your user reward function here, which will be executed after the user watches the ad.
 *     // For more details, please refer to the detailed instructions.
 *     alert('You have seen an ad!');
 * })
 */

/**
 * Ejecución directa del snippet de Rewarded Interstitial del proveedor.
 * Ejecuta la función de recompensa del usuario al completar el anuncio.
 */
export function executeRewardedInterstitialSnippet(onUserReward: () => void, onError?: (err: any) => void): void {
  if (typeof window !== 'undefined' && typeof window.show_12089328 === 'function') {
    // Rewarded interstitial
    show_12089328().then(() => {
      // You need to add your user reward function here, which will be executed after the user watches the ad.
      // For more details, please refer to the detailed instructions.
      try {
        console.log('[Rewarded Interstitial] You have seen an ad! Recompensa entregada.');
      } catch (e) {
        // En navegadores o iframes que restrinjan alert(), se registra en consola sin bloquear
      }
      onUserReward();
    }).catch((err: any) => {
      console.warn('[Rewarded Interstitial Error]', err);
      if (onError) onError(err);
    });
  } else {
    console.warn('[Rewarded Interstitial] show_12089328 no está disponible en este momento.');
    if (onError) onError(new Error('SDK_NOT_LOADED'));
  }
}

/**
 * Robustly checks if 'show_12089328' is defined in the global window scope as an executable function.
 */
export function isSdkFunctionDefined(): boolean {
  return (
    typeof window !== 'undefined' &&
    'show_12089328' in window &&
    typeof (window as any).show_12089328 === 'function'
  );
}

/**
 * Ensures the SDK script tag is present in the document head with exact required attributes.
 */
export function ensureSdkTagInHead(): HTMLScriptElement | null {
  if (typeof document === 'undefined') return null;
  
  let existing = document.querySelector('script[data-zone="12089328"]') as HTMLScriptElement | null;
  if (!existing) {
    existing = document.createElement('script');
    existing.src = '//libtl.com/sdk.js';
    existing.setAttribute('data-zone', '12089328');
    existing.setAttribute('data-sdk', 'show_12089328');
    document.head.appendChild(existing);
  }
  return existing;
}

/**
 * Runs a comprehensive health check on the Ad SDK setup and logs clear diagnostic output.
 */
export function getAdDiagnostics(): AdDiagnostics {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const tag = isBrowser ? (document.querySelector('script[data-zone="12089328"]') as HTMLScriptElement | null) : null;
  const funcExists = isSdkFunctionDefined();
  const origin = isBrowser ? window.location.origin : '';
  const hostname = isBrowser ? window.location.hostname : '';
  
  let inIframe = false;
  try {
    inIframe = isBrowser && window.self !== window.top;
  } catch {
    inIframe = true;
  }

  let recommendation = 'SDK inicializado correctamente.';
  if (!tag) {
    recommendation = 'Falta la etiqueta <script> en <head>. Debe incluir data-zone="12089328" y data-sdk="show_12089328".';
  } else if (!funcExists) {
    recommendation =
      'El script está en el DOM pero window.show_12089328 no está definido. Causas comunes:\n' +
      '1. Bloqueador de anuncios (uBlock, AdGuard, Brave Shields) bloqueando libtl.com (net::ERR_BLOCKED_BY_CLIENT).\n' +
      '2. El dominio actual (' + (hostname || 'localhost') + ') no está dado de alta o verificado en el panel de Monetag para la zona 12089328.\n' +
      '3. Entorno iframe con restricciones de sandbox o CSP que bloquean scripts externos.';
  }

  return {
    tagPresent: !!tag,
    tagSrc: tag ? tag.getAttribute('src') : null,
    tagZone: tag ? tag.getAttribute('data-zone') : null,
    tagSdk: tag ? tag.getAttribute('data-sdk') : null,
    isFunctionDefined: funcExists,
    origin,
    hostname,
    isSandboxedIframe: inIframe,
    recommendation,
  };
}

/**
 * Polls for show_12089328 to finish initializing in the global scope up to timeoutMs.
 */
export async function waitForSdk(timeoutMs = 2500): Promise<boolean> {
  if (isSdkFunctionDefined()) {
    return true;
  }
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
    if (isSdkFunctionDefined()) {
      return true;
    }
  }
  return isSdkFunctionDefined();
}

/**
 * Executes show_12089328() from the installed libtl SDK tag.
 * Replaces the test alert with genuine reward resolution.
 *
 * Strict compliance:
 * - If the provider function is not defined/loaded: fails cleanly without granting reward or freezing.
 * - If the promise rejects or indicates incomplete viewing: fails cleanly without granting reward.
 * - Only upon genuine resolution of the SDK's promise does it return success: true.
 * - No mock or artificial simulation fallback is used.
 */
export async function requestRewardedAd(): Promise<AdResult> {
  ensureSdkTagInHead();

  const isReady = await waitForSdk(2500);
  if (!isReady || !isSdkFunctionDefined()) {
    const diag = getAdDiagnostics();
    console.warn('[Ads SDK Diagnosis]', diag);
    return {
      success: false,
      reason: 'SDK_NOT_LOADED',
      details: diag.recommendation,
    };
  }

  return new Promise<AdResult>((resolve) => {
    try {
      // Rewarded interstitial
      show_12089328().then((result: any) => {
        // You need to add your user reward function here, which will be executed after the user watches the ad.
        // For more details, please refer to the detailed instructions.
        
        // Validación en caso de que el proveedor devuelva un estado explícito de cierre anticipado:
        if (
          result === false ||
          (result && typeof result === 'object' && (result.status === 'dismissed' || result.status === 'error' || result.rewarded === false))
        ) {
          resolve({
            success: false,
            reason: 'REJECTED_OR_CANCELLED',
            details: 'El anuncio fue cerrado antes de finalizar o cancelado.',
          });
          return;
        }

        // Recompensa confirmada al usuario (Núcleo de Sobrecarga o Revivida)
        resolve({
          success: true,
          details: result,
        });
      }).catch((error: any) => {
        console.warn('[Ads SDK] show_12089328 rejected or encountered an error:', error);
        resolve({
          success: false,
          reason: 'REJECTED_OR_CANCELLED',
          details: error?.message || 'Error durante la reproducción del anuncio.',
        });
      });
    } catch (error: any) {
      console.warn('[Ads SDK] Error calling show_12089328:', error);
      resolve({
        success: false,
        reason: 'UNKNOWN_ERROR',
        details: error?.message || 'Error inesperado al invocar el anuncio.',
      });
    }
  });
}

