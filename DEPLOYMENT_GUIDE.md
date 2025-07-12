# Deployment and Secrets Management Guide

This guide provides instructions for deploying the application to Google Cloud Run and managing secrets securely using Google Secret Manager.

## Summary of Best Practices

For handling sensitive information like API keys, database passwords, etc., the recommended best practice is to use **Google Secret Manager**.

-   **DO NOT** store secrets in your source code.
-   **DO NOT** store secrets in `cloudbuild.yaml` or other configuration files in your repository.
-   **DO** use Secret Manager to store all sensitive data.
-   **DO** grant your Cloud Run service's service account IAM permissions to access specific secrets.
-   **DO** mount secrets as volumes or environment variables in your Cloud Run service.

## Step 1: Create Secrets in Secret Manager

You only need to create a secret for the URL of your Gemini-powered microservice.

1.  **Enable the Secret Manager API**:
    ```bash
    gcloud services enable secretmanager.googleapis.com
    ```

2.  **Create a secret for the Cloud Run URL**:
    ```bash
    gcloud secrets create weather-gemini-service-url --replication-policy="automatic"
    ```

3.  **Add the Cloud Run URL value**:
    ```bash
    echo -n "[YOUR_GEMINI_SERVICE_URL]" | gcloud secrets versions add weather-gemini-service-url --data-file=-
    ```

## Step 2: Grant Cloud Run Access to Services

Your Cloud Run service needs permission to access secrets and other Google Cloud services.

1.  Find your service account email in the Google Cloud Console for your `weatherwise-ai` service.

2.  **Grant access to the Cloud Run URL secret**:
    ```bash
    gcloud secrets add-iam-policy-binding weather-gemini-service-url \
      --member="serviceAccount:[SERVICE_ACCOUNT_EMAIL]" \
      --role="roles/secretmanager.secretAccessor"
    ```

3.  **Grant access to the Gemini (Vertex AI) API**:
    This allows your service to authenticate directly without an API key.
    ```bash
    gcloud projects add-iam-policy-binding [YOUR_PROJECT_ID] \
      --member="serviceAccount:[SERVICE_ACCOUNT_EMAIL]" \
      --role="roles/aiplatform.user"
    ```
    Replace `[YOUR_PROJECT_ID]` with your Google Cloud project ID.

## Step 3: Use Secrets in `cloudbuild.yaml`

I have updated your `cloudbuild.yaml` to inject the necessary secret. It now looks like this:

```yaml
# ... (previous steps) ...
      - 'NODE_ENV=production'
      # Replace "cloud-run-url" with the name
      # of your secret in Google Secret Manager if you named it differently.
      - '--set-secrets=CLOUD_RUN_URL=weather-gemini-service-url:latest'

# ... (rest of the file) ...
```

This configuration tells Cloud Run to create an environment variable named `CLOUD_RUN_URL` with the value from the `weather-gemini-service-url` secret.

After following these steps, you are ready to deploy. 