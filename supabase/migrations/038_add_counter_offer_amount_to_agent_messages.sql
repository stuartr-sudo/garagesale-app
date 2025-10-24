-- Add missing counter_offer_amount column to agent_messages table
-- This column is used by the agent chat system to track counter-offer amounts

ALTER TABLE agent_messages 
ADD COLUMN counter_offer_amount DECIMAL(10,2);

-- Add comment for clarity
COMMENT ON COLUMN agent_messages.counter_offer_amount IS 'The counter-offer amount made by the agent in this message';
