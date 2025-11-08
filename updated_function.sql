-- 删除现有的函数
DROP FUNCTION IF EXISTS take_order_atomic(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS take_order_atomic(uuid, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS take_order_atomic(text, text, text, text, text, text);

-- 创建新的原子接单函数，使用正确的列名
CREATE FUNCTION take_order_atomic(
    order_id_in text,
    taker_id_in text,
    taker_name_in text,
    taker_contact_in text,
    taker_contact_type_in text,
    order_type_in text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- 获取订单当前状态
    IF order_type_in = 'delivery' THEN
        SELECT id, status INTO order_record FROM delivery_orders WHERE id = order_id_in::uuid FOR UPDATE;
    ELSIF order_type_in = 'errand' THEN
        SELECT id, status INTO order_record FROM errand_orders WHERE id = order_id_in::uuid FOR UPDATE;
    ELSE
        RETURN 'INVALID_ORDER_TYPE';
    END IF;
    
    -- 检查订单是否存在
    IF NOT FOUND THEN
        RETURN 'ORDER_NOT_FOUND';
    END IF;
    
    -- 检查订单状态
    IF order_record.status != 'pending' THEN
        RETURN 'ALREADY_TAKEN';
    END IF;
    
    -- 更新订单状态
    IF order_type_in = 'delivery' THEN
        UPDATE delivery_orders 
        SET 
            status = 'taken',
            taken_by = taker_id_in,
            taker_name = taker_name_in,
            taker_contact = taker_contact_in,
            taker_contact_type = taker_contact_type_in,
            updated_at = NOW()
        WHERE id = order_id_in::uuid;
    ELSIF order_type_in = 'errand' THEN
        UPDATE errand_orders 
        SET 
            status = 'taken',
            taken_by = taker_id_in,
            taker_name = taker_name_in,
            taker_contact = taker_contact_in,
            taker_contact_type = taker_contact_type_in,
            updated_at = NOW()
        WHERE id = order_id_in::uuid;
    END IF;
    
    RETURN 'SUCCESS';
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION take_order_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION take_order_atomic TO anon;

-- 测试函数是否能正确调用
SELECT take_order_atomic('00000000-0000-0000-0000-000000000000', 'test-taker-id', 'test-name', 'test-contact', 'wechat', 'delivery');