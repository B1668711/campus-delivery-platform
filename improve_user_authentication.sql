-- 用户账户同步功能改进
-- 添加用户名字段到users表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
END $$;

-- 添加密码字段到users表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
END $$;

-- 添加主账户字段到users表（用于标识用户的主账户）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'master_user_id'
    ) THEN
        ALTER TABLE users ADD COLUMN master_user_id TEXT;
    END IF;
END $$;

-- 创建用户登录函数
CREATE OR REPLACE FUNCTION login_user(
    username_in TEXT,
    password_in TEXT
)
RETURNS TABLE (
    user_id TEXT,
    device_id TEXT,
    name TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- 查找用户
    SELECT id, device_id, name, password_hash INTO user_record
    FROM users
    WHERE username = username_in;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT, 
            FALSE, 
            '用户名或密码错误';
        RETURN;
    END IF;
    
    -- 验证密码（简化处理，实际应用中应使用bcrypt等安全哈希）
    IF user_record.password_hash IS NULL OR user_record.password_hash != password_in THEN
        RETURN QUERY SELECT 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT, 
            FALSE, 
            '用户名或密码错误';
        RETURN;
    END IF;
    
    -- 返回用户信息
    RETURN QUERY SELECT 
        user_record.id, 
        user_record.device_id, 
        user_record.name, 
        TRUE, 
            '登录成功';
    RETURN;
END;
$$;

-- 创建合并用户账户函数（用于同一用户在不同设备的账户合并）
CREATE OR REPLACE FUNCTION merge_user_accounts(
    username_in TEXT,
    password_in TEXT,
    current_device_id_in TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    master_user_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    device_records RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- 查找用户
    SELECT id, name, password_hash INTO user_record
    FROM users
    WHERE username = username_in;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, '用户名或密码错误', NULL;
        RETURN;
    END IF;
    
    -- 验证密码
    IF user_record.password_hash IS NULL OR user_record.password_hash != password_in THEN
        RETURN QUERY SELECT FALSE, '用户名或密码错误', NULL;
        RETURN;
    END IF;
    
    -- 将当前设备关联到该用户
    UPDATE users
    SET master_user_id = user_record.id
    WHERE device_id = current_device_id_in;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- 返回结果
    IF updated_count > 0 THEN
        RETURN QUERY SELECT TRUE, '账户合并成功', user_record.id;
    ELSE
        RETURN QUERY SELECT FALSE, '没有找到需要合并的设备账户', NULL;
    END IF;
    RETURN;
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION login_user TO authenticated;
GRANT EXECUTE ON FUNCTION login_user TO anon;
GRANT EXECUTE ON FUNCTION merge_user_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION merge_user_accounts TO anon;