# KimpAI - Kimchi Premium Analytics Dashboard

A Next.js 14 SaaS platform for tracking and analyzing the Kimchi Premium (price difference between Korean and global cryptocurrency exchanges).

## Quick Start (Replit Environment)

### 1. Install Dependencies
```bash
npm install
```

### 2. Port Configuration
- **Dev Server Port**: Defaults to `5000`
- **Dynamic Port**: Set `PORT` environment variable if needed
  ```bash
  PORT=3000 npm run dev
  ```

### 3. Run Development Server
```bash
npm run dev
```

If you get `EADDRINUSE: address already in use :::5000` error:

**Option A: Kill existing process**
```bash
# Find process using port 5000
ps aux | grep -E "next|node" | grep -v grep

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Then run again
npm run dev
```

**Option B: Use different port**
```bash
PORT=3001 npm run dev
```

**Option C: Restart Replit workflows**
- Click "Run" button in Replit to restart all workflows cleanly

---

## Scripts

### Development
```bash
npm run dev          # Start Next.js dev server (port 5000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Data Management
```bash
npm run update:prices     # Fetch and update cryptocurrency prices
npm run price:worker      # Continuous price update worker (5-second interval)
npm run update:notices    # Fetch Korean exchange listing notices
npm run backfill:korean-names  # Backfill Korean names in master_symbols
npm run update:icons      # Download coin icons
```

---

## Korean Name Backfill Script

### Purpose
Automatically populates missing Korean coin names (`ko_name`) in the `master_symbols` table from Korean exchange APIs (Upbit, Bithumb, Coinone).

### Prerequisites
- Supabase environment variables must be set:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ```
- `master_symbols` table must exist in Supabase (id, symbol, ko_name columns)

### Usage
```bash
npm run backfill:korean-names
```

### What It Does
1. Fetches Korean coin names from:
   - **Upbit API** (primary source, highest priority)
   - **Bithumb API** (secondary source)
   - **Coinone API** (fallback for English names only)

2. Updates only rows where `ko_name` is:
   - `NULL` (empty)
   - Equal to `symbol` (placeholder value)

3. Skips rows that already have proper Korean names set

4. Processes updates in 100-row chunks for stability

5. **Idempotent**: Safe to run multiple times - won't overwrite good data

### Example Output
```
[BackfillKoreanNames] Starting Korean name backfill...
[BackfillKoreanNames] Loading exchange names for Korean backfill...
[BackfillKoreanNames] Upbit map size: 500
[BackfillKoreanNames] Bithumb map size: 450
[BackfillKoreanNames] Combined map size: 520
[BackfillKoreanNames] Found 520 total rows in master_symbols
[BackfillKoreanNames] Prepared updates: 35
[BackfillKoreanNames] Updated 35/35
✅ Backfill complete!
```

### Safety Notes
- **No data loss**: Only updates NULL or placeholder values
- **Priority-based**: Uses best available source (Upbit > Bithumb > Coinone)
- **Reversible**: Can be run multiple times without side effects
- **Chunked**: Large updates are split into 100-row batches

---

## Environment Variables

### Required for Development
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional
```env
PORT=5000  # Default port (if not set, uses 5000)
```

---

## Troubleshooting

### Port 5000 Already in Use
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or restart workflows from Replit UI
```

### Backfill Script Fails
- Check environment variables are set
- Verify Supabase connection
- Check `master_symbols` table exists
- Review error logs in terminal

### Dev Server Won't Start
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check Node.js version: `node --version`

---

## Project Structure

```
├── src/
│   ├── pages/          # Next.js pages & API routes
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities & helpers
├── scripts/            # Standalone utility scripts
│   ├── priceWorker.ts
│   ├── backfillKoreanNames.ts
│   └── ...
├── public/             # Static assets
└── package.json        # Dependencies & scripts
```

---

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **APIs**: Upbit, Bithumb, Coinone, Binance, OKX, and more

---

## Deployment

For production deployment, use Replit's built-in deployment features or export to Vercel.

---

## Notes for Developers

- Use `Fast Mode` for single-file edits
- Request permission before multi-file refactors
- Keep `replit.md` updated with architecture changes
- Do not modify the `Z` folder or `Y` file without explicit permission
