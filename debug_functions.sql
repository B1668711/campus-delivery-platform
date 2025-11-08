-- 检查所有存在的函数
SELECT proname, proargtypes FROM pg_proc WHERE proname = 'modify_order';

-- 检查delivery_orders表的实际结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_orders' 
ORDER BY ordinal_position;

-- 检查errand_orders表的实际结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'errand_orders' 
ORDER BY ordinal_position;

-- 完全删除modify_order函数
DROP FUNCTION IF EXISTS modify_order(text, text, text, text, text, text, text, timestamp with time zone, numeric, text, text, text, text);

-- 创建一个简单的测试函数来查看表结构
CREATE OR REPLACE FUNCTION test_table_structure()
RETURNS table(table_name text, column_name text, data_type text)
AS $$
BEGIN
    RETURN QUERY
    SELECT 'delivery_orders'::text, column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'delivery_orders'
    
    UNION ALL
    
    SELECT 'errand_orders'::text, column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'errand_orders';
END;
$$ LANGUAGE plpgsql;