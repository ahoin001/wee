# Supabase Setup for Community Presets

## Overview

The WiiDesktop Launcher includes a community preset sharing feature that allows users to upload and download presets. This feature requires Supabase configuration to work properly.

## Why Other Users Can't See Your Uploaded Presets

If you can see 3 presets but other users can't see them, it's because:

1. **You have Supabase configured** - Your environment has the proper Supabase credentials
2. **Other users don't** - They're missing the required environment variables
3. **Community features are disabled** - Without Supabase, the community preset features are disabled

## Required Environment Variables

To enable community preset sharing, you need these environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## How to Set Up Supabase

### Option 1: For Developers (Local Development)

1. **Create a `.env` file** in the project root:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Restart the development server** after adding the environment variables

### Option 2: For Production (Built App)

1. **Set environment variables** in your system:
   ```bash
   # Windows (PowerShell)
   $env:VITE_SUPABASE_URL="https://your-project.supabase.co"
   $env:VITE_SUPABASE_ANON_KEY="your-anon-key"
   
   # Windows (Command Prompt)
   set VITE_SUPABASE_URL=https://your-project.supabase.co
   set VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Launch the app** with the environment variables set

### Option 3: Create a Supabase Project

If you don't have a Supabase project:

1. **Go to [supabase.com](https://supabase.com)** and create an account
2. **Create a new project**
3. **Get your project URL and anon key** from the project settings
4. **Set up the database tables** (see Database Setup below)

## Database Setup

You need these tables in your Supabase project:

### 1. `shared_presets` Table

```sql
CREATE TABLE shared_presets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_name TEXT DEFAULT 'Anonymous',
  creator_email TEXT,
  tags TEXT[],
  preset_file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  screenshot_url TEXT,
  file_size INTEGER,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Storage Buckets

Create these storage buckets:

- **`presets`** - For storing preset JSON files
- **`thumbnails`** - For storing preset thumbnails
- **`screenshots`** - For storing preset screenshots (optional)

### 3. Row Level Security (RLS)

Enable RLS on the `shared_presets` table:

```sql
ALTER TABLE shared_presets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read presets
CREATE POLICY "Allow public read access" ON shared_presets
  FOR SELECT USING (true);

-- Allow anyone to insert presets (for anonymous uploads)
CREATE POLICY "Allow public insert access" ON shared_presets
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update download counts
CREATE POLICY "Allow public update downloads" ON shared_presets
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anyone to delete presets (for anonymous deletion)
CREATE POLICY "Allow public delete access" ON shared_presets
  FOR DELETE USING (true);
```

## Testing the Setup

1. **Check if Supabase is configured**:
   - Open the app
   - Go to Appearance Settings → Themes
   - Click "Browse Community"
   - If you see "Community features are not configured", Supabase is not set up

2. **Test with the provided script**:
   ```bash
   node test-supabase-connection.js
   ```

## Troubleshooting

### "Supabase not configured" Error

This means the environment variables are missing. Check:
- Environment variables are set correctly
- App was restarted after setting variables
- Variables are named exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Database error" or "RLS policy" Error

This means the database setup is incomplete. Check:
- Tables are created correctly
- RLS policies are enabled
- Storage buckets exist and are public

### No Presets Showing

If you see 0 presets but no errors:
- Check if presets were actually uploaded successfully
- Verify the database has data
- Check the console for any errors

## For Distribution

If you want to distribute the app with community features enabled:

1. **Set up a shared Supabase project** for all users
2. **Include the environment variables** in the built app
3. **Document the setup** for users who want to run from source

## Current Status

- ✅ **Upload functionality** - Works when Supabase is configured
- ✅ **Download functionality** - Works when Supabase is configured  
- ✅ **Community browsing** - Works when Supabase is configured
- ❌ **Default configuration** - Users need to set up Supabase manually

## Next Steps

To make community features work for all users:

1. **Set up a shared Supabase project** for the community
2. **Include the environment variables** in the release
3. **Add setup instructions** to the README
4. **Create a configuration wizard** in the app 