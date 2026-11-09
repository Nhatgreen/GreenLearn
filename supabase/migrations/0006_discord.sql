-- Migration 0006: Discord Embedded Activity, Discord ID Link & Activity Rooms

-- 1. Bổ sung trường discord_id duy nhất vào profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_id TEXT UNIQUE;

-- Bảo vệ discord_id: client không được phép tự UPDATE qua RLS, chỉ Edge Function/Service Role quản lý
REVOKE UPDATE (discord_id) ON profiles FROM authenticated;

-- 2. Bảng quản lý phòng học theo Discord Activity instance_id
CREATE TABLE IF NOT EXISTS activity_rooms (
  instance_id TEXT PRIMARY KEY,
  space_id UUID REFERENCES study_spaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_rooms_select" ON activity_rooms
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "activity_rooms_insert" ON activity_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 3. RPC tham gia phòng học Discord theo instance_id
CREATE OR REPLACE FUNCTION join_activity_room(
  p_instance_id TEXT,
  p_space_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_space_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  -- Kiểm tra phòng đã tồn tại theo instance_id chưa
  SELECT space_id INTO v_space_id
  FROM activity_rooms
  WHERE instance_id = p_instance_id;

  IF v_space_id IS NOT NULL THEN
    -- Thêm người gọi vào space_members nếu chưa có
    INSERT INTO space_members (space_id, user_id, role)
    VALUES (v_space_id, v_user_id, 'editor')
    ON CONFLICT (space_id, user_id) DO NOTHING;

    RETURN v_space_id;
  END IF;

  -- Nếu phòng chưa tồn tại: dùng p_space_id hoặc tạo bàn học mới
  IF p_space_id IS NOT NULL THEN
    v_space_id := p_space_id;
  ELSE
    INSERT INTO study_spaces (user_id, name, desk_state)
    VALUES (v_user_id, 'Discord Study Space', '{"zoom":1,"panX":0,"panY":0}'::jsonb)
    RETURNING id INTO v_space_id;
  END IF;

  -- Tạo liên kết phòng Discord
  INSERT INTO activity_rooms (instance_id, space_id, created_by)
  VALUES (p_instance_id, v_space_id, v_user_id)
  ON CONFLICT (instance_id) DO UPDATE SET space_id = EXCLUDED.space_id
  RETURNING space_id INTO v_space_id;

  -- Gán người tạo làm owner trong space_members
  INSERT INTO space_members (space_id, user_id, role)
  VALUES (v_space_id, v_user_id, 'owner')
  ON CONFLICT (space_id, user_id) DO NOTHING;

  RETURN v_space_id;
END;
$$;
