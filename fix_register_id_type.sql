-- 修复register_user函数中的id类型问题
-- 删除现有函数
DROP FUNCTION IF EXISTS register_user(text, text, text, text);

-- 修复register_user函数
CREATE OR REPLACE FUNCTION register_user(
    username_in TEXT,
    password_in TEXT,
    device_id_in TEXT,
    name_in TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    user_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_user RECORD;
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- 检查用户名是否已存在
    SELECT u.id, u.username INTO existing_user
    FROM users u
    WHERE u.username = username_in;
    
    IF FOUND THEN
        RETURN QUERY SELECT FALSE, '用户名已存在', NULL::TEXT;
        RETURN;
    END IF;
    
    -- 检查设备ID是否已有用户
    SELECT u.id, u.name INTO existing_user
    FROM users u
    WHERE u.device_id = device_id_in;
    
    IF FOUND THEN
        -- 设备已有用户，更新其用户名和密码
        UPDATE users u
        SET 
            username = username_in,
            password_hash = password_in,
            master_user_id = u.id -- 将自身设为主账户
        WHERE u.id = existing_user.id;
        
        RETURN QUERY SELECT TRUE, '注册成功，现有设备账户已更新', existing_user.id::TEXT;
    ELSE
        -- 设备没有用户，创建新用户
        INSERT INTO users (id, device_id, username, password_hash, name, master_user_id)
        VALUES (new_user_id, device_id_in, username_in, password_in, name_in, new_user_id);
        
        RETURN QUERY SELECT TRUE, '注册成功', new_user_id::TEXT;
    END IF;
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION register_user TO authenticated;
GRANT EXECUTE ON FUNCTION register_user TO anon;