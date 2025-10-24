/*
  # Create orders table for food and ticket bookings

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `order_type` (text) - 'food' or 'ticket'
      - `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
      - `details` (jsonb) - stores order-specific details
      - `total_amount` (numeric) - order total
      - `user_session` (text) - tracks anonymous user sessions
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `orders` table
    - Add policy for users to read their own orders based on session
    - Add policy for creating new orders

  3. Notes
    - JSONB field stores flexible order details like:
      - Food orders: restaurant, items, delivery address
      - Ticket orders: event, venue, seat details, date
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type text NOT NULL CHECK (order_type IN ('food', 'ticket')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  details jsonb NOT NULL DEFAULT '{}',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  user_session text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  USING (user_session = current_setting('app.user_session', true));

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (user_session = current_setting('app.user_session', true));

CREATE INDEX IF NOT EXISTS idx_orders_user_session ON orders(user_session);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);