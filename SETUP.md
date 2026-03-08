# Fix "command not found: npm" and run AnimeVerse

## Option 1: You use nvm (Node Version Manager)

If you've used nvm before, load it in this terminal:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install
npm run dev
```

## Option 2: Install Node.js (if not installed)

**On Mac (easiest):**

1. Go to https://nodejs.org
2. Download the **LTS** version and run the installer
3. **Quit and reopen Cursor** (or open a new terminal tab)
4. Then run:
   ```bash
   cd /Users/rajatsodhi/Downloads/animeverse-discovery
   npm install
   npm run dev
   ```

**Or install via Homebrew** (if you have `brew`):

```bash
brew install node
```

Then in a **new terminal**:

```bash
cd /Users/rajatsodhi/Downloads/animeverse-discovery
npm install
npm run dev
```

## After npm works

1. Set your Gemini API key in `.env.local` (see README)
2. Open http://localhost:3000 in your browser
