-- 创建一个更简单的修改订单函数，使用条件逻辑而不是动态SQL
CREATE OR REPLACE FUNCTION update_order_info(
    order_id_in text,
    user_id_in text,
    order_type_in text,
    title_in text DEFAULT null,
    description_in text DEFAULT null,
    pickup_location_in text DEFAULT null,
    delivery_location_in text DEFAULT null,
    deadline_in timestamp with time zone DEFAULT null,
    reward_in numeric DEFAULT null,
    contact_name_in text DEFAULT null,
    contact_info_in text DEFAULT null,
    contact_type_in text DEFAULT null,
    notes_in text DEFAULT null
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record RECORD;
    is_taken boolean := false;
    taker_contact_info text;
BEGIN
    -- 获取订单当前状态
    IF order_type_in = 'delivery' THEN
        SELECT id, status, taken_by, taker_contact INTO order_record 
        FROM delivery_orders 
        WHERE id = order_id_in::uuid;
    ELSIF order_type_in = 'errand' THEN
        SELECT id, status, taken_by, taker_contact INTO order_record 
        FROM errand_orders 
        WHERE id = order_id_in::uuid;
    ELSE
        RETURN 'INVALID_ORDER_TYPE';
    END IF;
    
    -- 检查订单是否存在
    IF NOT FOUND THEN
        RETURN 'ORDER_NOT_FOUND';
    END IF;
    
    -- 检查用户是否有权限修改订单（必须是发布者）
    DECLARE
        creator_id text;
    BEGIN
        IF order_type_in = 'delivery' THEN
            SELECT created_by INTO creator_id FROM delivery_orders WHERE id = order_id_in::uuid;
        ELSIF order_type_in = 'errand' THEN
            SELECT created_by INTO creator_id FROM errand_orders WHERE id = order_id_in::uuid;
        END IF;
        
        IF creator_id != user_id_in THEN
            RETURN 'NO_PERMISSION';
        END IF;
    END;
    
    -- 检查订单状态是否可以被修改
    IF order_record.status IN ('delivered', 'completed', 'cancelled') THEN
        RETURN 'WRONG_STATUS';
    END IF;
    
    -- 记录订单是否已被接单
    is_taken := order_record.status = 'taken';
    taker_contact_info := order_record.taker_contact;
    
    -- 使用CASE语句和IF条件更新订单信息，避免列不存在的问题
    IF order_type_in = 'delivery' THEN
        -- 先检查是否存在title列
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'title') THEN
            UPDATE delivery_orders SET title = COALESCE(title_in, title) WHERE id = order_id_in::uuid;
        END IF;
        
        -- 检查其他列
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'description') THEN
            UPDATE delivery_orders SET description = COALESCE(description_in, description) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'pickup_location') THEN
            UPDATE delivery_orders SET pickup_location = COALESCE(pickup_location_in, pickup_location) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'delivery_location') THEN
            UPDATE delivery_orders SET delivery_location = COALESCE(delivery_location_in, delivery_location) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'deadline') THEN
            UPDATE delivery_orders SET deadline = COALESCE(deadline_in, deadline) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'reward') THEN
            UPDATE delivery_orders SET reward = COALESCE(reward_in, reward) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'contact_name') THEN
            UPDATE delivery_orders SET contact_name = COALESCE(contact_name_in, contact_name) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'contact_info') THEN
            UPDATE delivery_orders SET contact_info = COALESCE(contact_info_in, contact_info) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'contact_type') THEN
            UPDATE delivery_orders SET contact_type = COALESCE(contact_type_in, contact_type) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'delivery_orders' AND column_name = 'notes') THEN
            UPDATE delivery_orders SET notes = COALESCE(notes_in, notes) WHERE id = order_id_in::uuid;
        END IF;
        
        -- 更新时间戳
        UPDATE delivery_orders SET updated_at = NOW() WHERE id = order_id_in::uuid;
        
    ELSIF order_type_in = 'errand' THEN
        -- 对errand_orders表执行类似的操作
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'title') THEN
            UPDATE errand_orders SET title = COALESCE(title_in, title) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'description') THEN
            UPDATE errand_orders SET description = COALESCE(description_in, description) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'pickup_location') THEN
            UPDATE errand_orders SET pickup_location = COALESCE(pickup_location_in, pickup_location) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'delivery_location') THEN
            UPDATE errand_orders SET delivery_location = COALESCE(delivery_location_in, delivery_location) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'deadline') THEN
            UPDATE errand_orders SET deadline = COALESCE(deadline_in, deadline) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'reward') THEN
            UPDATE errand_orders SET reward = COALESCE(reward_in, reward) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'contact_name') THEN
            UPDATE errand_orders SET contact_name = COALESCE(contact_name_in, contact_name) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'contact_info') THEN
            UPDATE errand_orders SET contact_info = COALESCE(contact_info_in, contact_info) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'contact_type') THEN
            UPDATE errand_orders SET contact_type = COALESCE(contact_type_in, contact_type) WHERE id = order_id_in::uuid;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'errand_orders' AND column_name = 'notes') THEN
            UPDATE errand_orders SET notes = COALESCE(notes_in, notes) WHERE id = order_id_in::uuid;
        END IF;
        
        -- 更新时间戳
        UPDATE errand_orders SET updated_at = NOW() WHERE id = order_id_in::uuid;
    END IF;
    
    -- 如果订单已被接单，需要通知接单者
    IF is_taken AND taker_contact_info IS NOT NULL THEN
        -- 这里可以添加通知逻辑，例如发送消息给接单者
        -- 由于这是一个数据库函数，我们可以返回一个特殊状态
        RETURN 'SUCCESS_WITH_NOTIFICATION';
    END IF;
    
    RETURN 'SUCCESS';
END;
$$;

-- 设置权限
GRANT EXECUTE ON FUNCTION update_order_info TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_info TO anon;