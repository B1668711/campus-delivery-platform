-- 测试login_user函数是否正确返回用户名
-- 删除测试函数（如果存在）
DROP FUNCTION IF EXISTS test_login_function();

-- 创建测试函数
CREATE OR REPLACE FUNCTION test_login_function()
RETURNS TABLE (
    username TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    login_result RECORD;
BEGIN
    -- 调用login_user函数测试
    SELECT * INTO login_result
    FROM login_user('test', '123456', 'test_device');
    
    IF FOUND THEN
        RETURN QUERY SELECT 
            login_result.username, 
            login_result.success, 
            login_result.message;
    ELSE
        RETURN QUERY SELECT 
            NULL::TEXT, 
            FALSE, 
            'No result returned';
    END IF;
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION test_login_function TO authenticated;
GRANT EXECUTE ON FUNCTION test_login_function TO anon;