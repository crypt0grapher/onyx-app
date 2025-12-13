# Deploying Your Website

This guide will walk you through deploying your new website. We'll cover two popular options: Vercel (the easiest) and a traditional dedicated server.

## Before You Start

Make sure your project code is uploaded to a GitHub, GitLab, or Bitbucket account. This is the simplest way to get your site online.

### Environment Variables

Your application requires the following environment variables to be set:

-   `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Required for WalletConnect functionality. Get this from [WalletConnect Cloud](https://cloud.walletconnect.com/).
-   `NEXT_PUBLIC_INFURA_API_KEY`: Required for Ethereum network connectivity. Get this from [Infura](https://infura.io/).
-   `NEXT_PUBLIC_POINTS_API_URL`: Optional. URL for the points API. Defaults to `https://pnt.onyx.org/api/v1` if not set.
-   `NEXT_PUBLIC_POINTS_SQUID_URL`: Optional. URL for the points Squid GraphQL endpoint. Defaults to `https://pnt-squid.onyx.org/graphql` if not set.

Create a `.env.local` file in your project root with these variables:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
NEXT_PUBLIC_POINTS_API_URL=https://pnt.onyx.org/api/v1
NEXT_PUBLIC_POINTS_SQUID_URL=https://pnt-squid.onyx.org/graphql
```

For Vercel deployment, you can set these in your Vercel project settings under "Environment Variables".

---
Patched for CVE-2025-55183 & CVE-2025-55184
---

## Option 1: Deploying with Vercel (Recommended)

Vercel is a platform created by the makers of Next.js, and it's the simplest way to deploy your site.

### Steps:

1.  **Sign up for Vercel**: Go to [vercel.com](https://vercel.com) and sign up for a free account using your GitHub, GitLab, or Bitbucket account.
2.  **Import Your Project**:
    -   Once you're logged in, click the "Add New..." button and select "Project".
    -   Find your project's repository and click "Import".
3.  **Deploy**: Vercel will automatically detect that you're using Next.js and configure everything for you. You can leave the settings as they are and click the "Deploy" button.

That's it! Vercel will build and deploy your site, giving you a live URL to share. It will also automatically redeploy your site whenever you push new changes to your repository.

---

## Option 2: Deploying on a Dedicated Server

If you have a dedicated server (from a provider like DigitalOcean, Linode, or AWS), you can deploy your site there. This requires a bit more technical setup.

### Server Prerequisites:

You'll need `Node.js` and `npm` (which comes with Node.js) installed on your server. Your hosting provider will have instructions on how to do this.

### Steps:

1.  **Get Your Code on the Server**:

    -   The easiest way is to use `git`. Install `git` on your server and then run `git clone <your-repository-url>` to download your code.

2.  **Install Dependencies**:

    -   Navigate into your project's directory with `cd <your-project-directory>`.
    -   Run the command `npm install` to download all the necessary packages for your project.

3.  **Build Your Site**:

    -   Run the command `npm run build`. This will create an optimized version of your site that's ready for production.

4.  **Start the Server**:
    -   Run the command `npm start`. This will start the Next.js server, and your site will be live.

### Keeping it Running:

If you close your terminal, the server will stop. To keep it running permanently, you can use a tool like `pm2`.

1.  **Install pm2**: `npm install pm2 -g`
2.  **Start your app with pm2**: `pm2 start npm --name "my-website" -- start`

Your website is now deployed and running!
