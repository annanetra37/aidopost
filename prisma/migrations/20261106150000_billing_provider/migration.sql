-- Payment provider–neutral billing columns (Paddle or Stripe).
ALTER TABLE "subscriptions" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'paddle';
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_customer_id" TO "provider_customer_id";
ALTER TABLE "subscriptions" RENAME COLUMN "stripe_subscription_id" TO "provider_subscription_id";
ALTER INDEX "subscriptions_stripe_customer_id_key" RENAME TO "subscriptions_provider_customer_id_key";
ALTER INDEX "subscriptions_stripe_subscription_id_key" RENAME TO "subscriptions_provider_subscription_id_key";

ALTER TABLE "purchases" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'paddle';
ALTER TABLE "purchases" RENAME COLUMN "stripe_session_id" TO "provider_ref";
ALTER TABLE "purchases" RENAME COLUMN "stripe_payment_intent" TO "provider_payment_id";
ALTER INDEX "purchases_stripe_session_id_key" RENAME TO "purchases_provider_ref_key";
