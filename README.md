# Minds on the Gap

Groups submit free-text critiques of three infographics. The facilitator signs in and
Claude derives the accessibility-wheel axes from the language used.

## Deploy to Netlify (needs Functions + Blobs, so not drag-and-drop)

1. Install the CLI and sign in:  `npm i -g netlify-cli` then `netlify login`
2. In this folder:  `npm install`  then  `netlify init`  (create a new site)
3. Set two environment variables (Site configuration > Environment variables, or CLI):
   - `ADMIN_PASSWORD`   a password only you know (facilitator sign-in)
   - `ANTHROPIC_API_KEY`  your key from console.anthropic.com (mark it as a secret)
   Optional: `ANTHROPIC_MODEL` (defaults to `claude-sonnet-5-5`).
4. Deploy:  `netlify deploy --prod`
5. Share the site URL with the groups. Open it yourself, choose **Facilitator**, sign in.

Local test: `netlify dev` (with the variables in a `.env` file or linked site).

## Notes
- Critiques and the saved analysis live in Netlify Blobs. No accounts needed for groups.
- Anyone with the link can submit (text is length-limited). Only the password unlocks
  reading critiques and running the analysis.
- To start a fresh session, delete the `critiques` and `meta` stores in the Netlify UI
  (Blobs section), or deploy to a new site.
