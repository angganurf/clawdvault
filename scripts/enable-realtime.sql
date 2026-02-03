-- Enable realtime for key tables
-- Run this after Prisma schema is applied:
-- docker exec -i supabase_db_clawdvault psql -U postgres -d postgres -f /path/to/enable-realtime.sql
-- Or: docker exec -i supabase_db_clawdvault psql -U postgres -d postgres -c "ALTER PUBLICATION..."

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE price_candles;

-- Enable replica identity for filtered subscriptions to work
ALTER TABLE tokens REPLICA IDENTITY FULL;
ALTER TABLE trades REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE price_candles REPLICA IDENTITY FULL;
