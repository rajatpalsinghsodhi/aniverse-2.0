#!/usr/bin/env bash
# Start AnimeVerse dev server (run this in your terminal)
# Loads nvm so npm is available, then starts the app
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")"
npm install && npm run dev
