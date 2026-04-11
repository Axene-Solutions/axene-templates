<script lang="ts">
	import { page } from '$app/state';

	const error = $derived(page.url.searchParams.get('error'));

	const errorMessages: Record<string, string> = {
		invalid_state: 'Authentication failed. Please try again.',
		token_exchange_failed: 'Could not complete sign in. Please try again.',
		profile_fetch_failed: 'Could not fetch your profile. Please try again.',
		no_email: 'No email address found on your Google account.'
	};
</script>

<div class="login-page">
	<div class="login-card">
		<img src="https://mail.axene.io/email-assets/logo.png" alt="Axene" width="80" height="80" style="border-radius:8px;" />

		<h1>Sign in to Axene Templates</h1>
		<p class="subtitle">
			Auth is required to enable us to provide a personalized experience and sync your work across devices.
		</p>

		{#if error}
			<div class="error">
				{errorMessages[error] || 'An error occurred. Please try again.'}
			</div>
		{/if}

		<a href="/auth/google" class="google-btn">
			<svg viewBox="0 0 24 24" width="20" height="20">
				<path
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
					fill="#4285F4"
				/>
				<path
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					fill="#34A853"
				/>
				<path
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					fill="#FBBC05"
				/>
				<path
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					fill="#EA4335"
				/>
			</svg>
			Sign in with Google
		</a>

		<a href="/" class="back-link">Back to home</a>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		background: #101010;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.login-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		max-width: 400px;
		width: 100%;
	}

	.logo {
		height: 32px;
		margin-bottom: 8px;
	}

	h1 {
		color: #fff;
		font-size: 24px;
		font-weight: 700;
		margin: 0;
		text-align: center;
		font-family: 'Figtree', sans-serif;
	}

	.subtitle {
		color: #666;
		font-size: 14px;
		margin: 0;
		text-align: center;
	}

	.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 14px;
		width: 100%;
		text-align: center;
	}

	.google-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #fff;
		color: #000;
		font-size: 15px;
		font-weight: 500;
		padding: 12px 28px;
		border-radius: 9999px;
		text-decoration: none;
		transition: background 0.15s;
		margin-top: 8px;
	}

	.google-btn:hover {
		background: #f0f0f0;
	}

	.back-link {
		color: #666;
		font-size: 14px;
		text-decoration: none;
		margin-top: 8px;
	}

	.back-link:hover {
		color: #999;
	}
</style>
