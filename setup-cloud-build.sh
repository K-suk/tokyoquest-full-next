#!/bin/bash

# Google Cloud Build trigger setup script for TokyoQuest
# Run this script to set up automatic deployment from GitHub

# Set your project ID
PROJECT_ID="your-project-id"
REPO_NAME="tokyoquest-full-next"
REPO_OWNER="your-github-username"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Google Cloud Build trigger for TokyoQuest...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create Cloud Build trigger
echo -e "${YELLOW}Creating Cloud Build trigger...${NC}"
gcloud builds triggers create github \
    --repo-name=$REPO_NAME \
    --repo-owner=$REPO_OWNER \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml \
    --name="tokyoquest-deploy"

echo -e "${GREEN}✅ Cloud Build trigger created successfully!${NC}"
echo -e "${YELLOW}⚠️  Important: You need to set the following substitution variables in the Cloud Build trigger:${NC}"
echo -e "   - _NEXTAUTH_URL"
echo -e "   - _NEXTAUTH_SECRET"
echo -e "   - _GOOGLE_CLIENT_ID"
echo -e "   - _GOOGLE_CLIENT_SECRET"
echo -e "   - _DATABASE_URL"
echo -e "   - _SUPABASE_URL"
echo -e "   - _SUPABASE_ANON_KEY"
echo -e "   - _ADMIN_SECURITY_TOKEN"
echo -e "   - _SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo -e "${YELLOW}You can set these variables in the Google Cloud Console:${NC}"
echo -e "1. Go to: https://console.cloud.google.com/cloud-build/triggers"
echo -e "2. Click on the 'tokyoquest-deploy' trigger"
echo -e "3. Click 'Edit'"
echo -e "4. Scroll down to 'Substitution variables'"
echo -e "5. Add all the environment variables listed above"
echo ""
echo -e "${GREEN}🚀 Setup complete! Your repository will now auto-deploy to Cloud Run on every push to main branch.${NC}"
