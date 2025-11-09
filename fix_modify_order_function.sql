-- 修复修改订单功能，确保表单正确填充原有数据

-- 更新delivery_orders表，添加title字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delivery_orders' AND column_name = 'title'
    ) THEN
        ALTER TABLE delivery_orders ADD COLUMN title TEXT DEFAULT '代取快递';
    END IF;
END $$;

-- 更新update_order_info函数，使用正确的字段名
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
    taker_id text;
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
    
    -- 更新订单信息 - 分别处理每种订单类型
    IF order_type_in = 'delivery' THEN
        -- 更新delivery_orders表，使用正确的字段名
        UPDATE delivery_orders 
        SET 
            title = COALESCE(title_in, title),
            description = COALESCE(description_in, description),
            pickup_address = COALESCE(pickup_location_in, pickup_address), -- 使用正确的字段名
            delivery_address = COALESCE(delivery_location_in, delivery_address), -- 使用正确的字段名
            delivery_time = COALESCE(deadline_in, delivery_time), -- 使用正确的字段名
            reward = COALESCE(reward_in, reward),
            contact_name = COALESCE(contact_name_in, contact_name),
            contact_info = COALESCE(contact_info_in, contact_info),
            contact_type = COALESCE(contact_type_in, contact_type),
            notes = COALESCE(notes_in, notes),
            updated_at = NOW()
        WHERE id = order_id_in::uuid;
    ELSIF order_type_in = 'errand' THEN
        UPDATE errand_orders 
        SET 
            title = COALESCE(title_in, title),
            description = COALESCE(description_in, description),
            pickup_location = COALESCE(pickup_location_in, pickup_location),
            delivery_location = COALESCE(delivery_location_in, delivery_location),
            deadline = COALESCE(deadline_in, deadline),
            reward = COALESCE(reward_in, reward),
            contact_name = COALESCE(contact_name_in, contact_name),
            contact_info = COALESCE(contact_info_in, contact_info),
            contact_type = COALESCE(contact_type_in, contact_type),
            notes = COALESCE(notes_in, notes),
            updated_at = NOW()
        WHERE id = order_id_in::uuid;
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