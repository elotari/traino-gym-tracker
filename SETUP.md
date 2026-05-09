# Traino - Gym Tracker Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Get your **Project URL** and **anon public key** from Settings → API

## 2. Configure Environment Variables

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_USER1_EMAIL=elotari.business@gmail.com
NEXT_PUBLIC_USER2_EMAIL=your-cousins-email@example.com
```

## 3. Run Database Schema

In Supabase Dashboard → SQL Editor, run the entire contents of `supabase-schema.sql`

## 4. Create Storage Bucket

In Supabase Dashboard → Storage:
- Create a new bucket named `avatars`
- Make it **Public**

## 5. Install & Run

```bash
cd gym-tracker
npm install
npm run dev
```

Open http://localhost:3000

## 6. First Use

1. Go to `/login` and sign up with your email
2. Complete the onboarding (profile, measurements, goal, deadline)
3. Start logging your workouts!
4. Your cousin does the same with their email
5. Check `/competition` to see who's winning 🏆

## App Features

| Route | Description |
|-------|-------------|
| `/login` | Auth page (email whitelist enforced) |
| `/dashboard` | Today's stats + streak + roast/praise |
| `/log` | Daily logger (Workout / Nutrition / Vitals) |
| `/competition` | Side-by-side comparison with charts |
| `/profile` | Your profile + weight history |
| `/onboarding` | Setup wizard |
