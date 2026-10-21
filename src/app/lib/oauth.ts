import { getAppConfig } from "../config";

/**
 * Start Google sign in. Submits a hidden POST form to OmniAuth's request
 * phase rather than navigating via window.location.href, matching OmniAuth
 * 2.0's POST-only default for resistance to login CSRF.
 */
export function startGoogleAuth(): void {
	postNavigate(`${getAppConfig().apiBaseURL}/auth/google_oauth2`);
}

/**
 * Build and submit a hidden POST form, causing the browser to navigate to
 * the target URL via a POST request. Used by OAuth start flows so OmniAuth
 * sees a POST as it expects in 2.0+.
 *
 * CSRF tradeoff: the canonical defense (`omniauth-rails_csrf_protection` +
 * an `authenticity_token` field) requires a Rails session, which this JSON
 * API does not have. A session-less CSRF flow (mint one-time token via
 * dedicated endpoint, include in form, validate server side) is the right
 * long term fix; tracked as a follow on.
 * The login-CSRF threat is bounded today by AUTHORIZED_EMAILS gating new
 * sign ups (an attacker forcing a sign in still cannot create an account).
 */
export function postNavigate(url: string): void {
	const form = document.createElement("form");
	form.method = "POST";
	form.action = url;
	form.style.display = "none";
	document.body.appendChild(form);
	form.submit();
}
