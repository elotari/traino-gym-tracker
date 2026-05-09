-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  current_weight DECIMAL,
  goal_weight DECIMAL,
  body_fat_percentage DECIMAL,
  goal_description TEXT,
  challenge_start_date DATE,
  challenge_end_date DATE,
  tdee INTEGER, -- Total Daily Energy Expenditure
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table (simplified for challenge tracking)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  -- Challenge criteria
  calorie_deficit_achieved BOOLEAN DEFAULT FALSE,
  water_goal_achieved BOOLEAN DEFAULT FALSE,
  steps INTEGER DEFAULT 0,
  sleep_good BOOLEAN DEFAULT FALSE,
  -- Workout
  workout_types TEXT[] DEFAULT '{}',
  cardio_type TEXT,
  cardio_duration INTEGER, -- minutes
  -- Supplements
  supplements_taken BOOLEAN DEFAULT FALSE,
  supplement_list TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily logs policies
CREATE POLICY "Users can view all logs" ON daily_logs FOR SELECT USING (true);
CREATE POLICY "Users can manage own logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view all streaks" ON streaks FOR SELECT USING (true);
CREATE POLICY "Users can manage own streak" ON streaks FOR ALL USING (auth.uid() = user_id);

-- Storage bucket for avatars
-- Run in Supabase Dashboard > Storage: create bucket "avatars" (public)
