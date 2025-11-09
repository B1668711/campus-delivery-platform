-- 修复login_user函数的返回类型问题
-- 删除现有函数
DROP FUNCTION IF EXISTS login_user(text, text, text);

-- 修复login_user函数
CREATE OR REPLACE FUNCTION login_user(
    username_in TEXT,
    password_in TEXT,
    device_id_in TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id TEXT,
    device_id TEXT,
    name TEXT,
    username TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- 如果提供了设备ID且没有用户名，则尝试设备ID登录
    IF device_id_in IS NOT NULL AND (username_in IS NULL OR username_in = '') THEN
        SELECT u.id, u.device_id, u.name, u.username INTO user_record
        FROM users u
        WHERE u.device_id = device_id_in;
        
        IF FOUND THEN
            RETURN QUERY SELECT 
                user_record.id::TEXT, 
                user_record.device_id, 
                user_record.name,
                user_record.username,
                TRUE, 
                '设备登录成功';
            RETURN;
        END IF;
    END IF;
    
    -- 用户名密码登录
    SELECT u.id, u.device_id, u.name, u.password_hash INTO user_record
    FROM users u
    WHERE u.username = username_in;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT,
            NULL::TEXT,
            FALSE, 
            '用户名不存在';
        RETURN;
    END IF;
    
    -- 验证密码
    IF user_record.password_hash IS NULL OR user_record.password_hash != password_in THEN
        RETURN QUERY SELECT 
            NULL::TEXT, 
            NULL::TEXT, 
            NULL::TEXT,
            NULL::TEXT,
            FALSE, 
            '密码错误';
        RETURN;
    END IF;
    
    -- 返回用户信息
    RETURN QUERY SELECT 
        user_record.id::TEXT, 
        user_record.device_id, 
        user_record.name,
        username_in,
        TRUE, 
        '登录成功';
    RETURN;
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION login_user TO authenticated;
GRANT EXECUTE ON FUNCTION login_user TO anon;