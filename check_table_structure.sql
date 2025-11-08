-- 检查delivery_orders表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'delivery_orders' 
ORDER BY ordinal_position;

-- 检查errand_orders表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'errand_orders' 
ORDER BY ordinal_position;