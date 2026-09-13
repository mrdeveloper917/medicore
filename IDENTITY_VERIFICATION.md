# MediCore identity verification

This feature does not implement Aadhaar authentication itself. `services/aadhaar` is an adapter boundary for an authorized AUA/KUA/Sub-AUA provider and `services/face` is an adapter boundary for the provider's approved face-authentication channel. Both fail closed until URLs and client IDs are supplied.

## Development

1. Copy `.env.example` to `.env` and set normal application settings.
2. Obtain sandbox credentials and callback contract from an authorized provider; set only the `AADHAAR_SANDBOX_*` variables.
3. Configure the sandbox to return a non-reversible `aadhaarReferenceId` (never an Aadhaar number) after verified authentication.
4. Configure `FACE_AUTH_*` for the provider's sandbox or approved SDK gateway.

## Production gate

Do not set `AADHAAR_ENV=production` until the organisation has the required AUA/KUA/Sub-AUA arrangement, ASA connectivity, provider agreement, approval, certificate/device/SDK requirements, privacy review, and retention policy. A production Aadhaar Data Vault is an isolated, HSM-backed service: this application only stores its opaque reference key in `User`.

Before release, replace Express's default memory session store with a secure managed store, terminate TLS at the deployment boundary, configure `CORS_ORIGIN`, use managed secrets/KMS, and have security and legal teams review consent text, audit retention, access policy, incident response, and data lifecycle.

## Render deployment

Set `NODE_ENV=production`, a strong `SESSION_SECRET`, and `CORS_ORIGIN=https://medicore-7uhh.onrender.com` in the Render service environment. The app trusts Render's single reverse proxy in production so secure session cookies and CSRF-protected identity form submissions work over HTTPS. Do not run multiple instances or rely on the default in-memory session store in production; use a managed shared session store before scaling or handling real verification traffic.
