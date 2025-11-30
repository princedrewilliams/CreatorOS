# Google Search Console Verification Setup

## Steps to Verify Your Domain with Google Search Console

1. **Download the Verification File:**
   - Sign in to [Google Search Console](https://search.google.com/search-console/)
   - Add your property: `https://creatoros.online`
   - Choose "HTML file" verification method
   - Download the HTML verification file (typically named `google[verification-code].html`)

2. **Get the Verification Code:**
   - Open the downloaded HTML file
   - Find the meta tag: `<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />`
   - Copy the `content` value (this is your verification code)

3. **Update the Route Handler:**
   - The verification file handler is in `app/[...slug]/route.ts`
   - It automatically extracts the verification code from the filename
   - If the filename is `google[code].html`, it will work automatically
   - Alternatively, you can place the file in the `public/` directory with the exact filename

4. **Verify in Google Search Console:**
   - Return to Google Search Console
   - Click "Verify"
   - Google will check for the file at `https://creatoros.online/google[code].html`
   - If successful, your domain will be verified

## File Location Options

### Option 1: Use the Catch-All Route (Recommended)
The catch-all route at `app/[...slug]/route.ts` automatically handles Google verification files with the pattern `google[verification-code].html`. Just ensure the file is accessible at the root URL.

### Option 2: Place File in Public Directory
If you have the exact HTML file from Google, you can:
1. Place it in the `public/` directory
2. Ensure it's named exactly as Google provided (e.g., `google1234567890abcdef.html`)
3. It will be accessible at `https://creatoros.online/google1234567890abcdef.html`

## Testing

After deployment, test the verification file by visiting:
- `https://creatoros.online/google[your-verification-code].html`

The file should return HTML with the correct meta tag containing your verification code.

