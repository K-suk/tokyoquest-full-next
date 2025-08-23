# Tokyo Quest - Next.js Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Quest Completion System
- Users can complete quests by uploading photos
- Quest completion data is stored in the database
- Users earn experience points upon completion
- Completion images are stored in Supabase Storage

### Admin Panel
- Staff members can view all quest completions
- Filter completions by Quest ID or User ID
- View and download completion images
- Pagination support for large datasets

## Admin Setup

To give a user admin/staff privileges:

1. Make sure the user has registered and logged in at least once
2. Run the admin promotion script:

```bash
npx tsx scripts/make-admin.ts <user-email>
```

3. The user will now see an "Admin Panel" link in the navigation menu
4. Access the admin panel at `/admin` to manage quest completions

## Database Schema

The application uses PostgreSQL with the following key models:
- `User`: User accounts with staff privileges
- `Quest`: Available quests
- `QuestCompletion`: Quest completion records with images
- `SavedQuest`: User's saved quests
- `Review`: User reviews for quests

## API Endpoints

### Quest Completion
- `POST /api/quests/[id]/complete`: Complete a quest with image
- `GET /api/quests/[id]/status`: Get quest status (saved/completed)

### Admin
- `GET /api/admin/completions`: Get all quest completions (staff only)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
