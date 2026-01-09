"""
CallBot AI - Stripe Billing Service
Multi-tier subscription management with trials and webhooks
"""

import os
import stripe
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# =============================================================================
# Pricing Tiers Configuration
# =============================================================================

class PricingTier(str, Enum):
    STARTER = "starter"
    GROWTH = "growth"
    AGENCY = "agency"

@dataclass
class TierConfig:
    name: str
    price: int  # Monthly price in cents
    price_id: str  # Stripe Price ID
    calls_limit: Optional[int]  # None = unlimited
    sub_accounts: int
    features: List[str]

# Tier configurations - Price IDs should be set via environment variables
TIER_CONFIGS = {
    PricingTier.STARTER: TierConfig(
        name="Starter",
        price=29700,  # $297
        price_id=os.getenv("STRIPE_STARTER_PRICE_ID", ""),
        calls_limit=100,
        sub_accounts=0,
        features=[
            "Up to 100 calls/month",
            "24/7 AI answering",
            "Appointment booking",
            "SMS notifications",
            "Call transcripts",
            "Email support"
        ]
    ),
    PricingTier.GROWTH: TierConfig(
        name="Growth",
        price=49700,  # $497
        price_id=os.getenv("STRIPE_GROWTH_PRICE_ID", os.getenv("STRIPE_PRICE_ID", "")),
        calls_limit=None,  # Unlimited
        sub_accounts=0,
        features=[
            "Unlimited calls",
            "Everything in Starter",
            "Missed call text-back",
            "CRM integrations",
            "Lead scoring & analytics",
            "Knowledge base uploads",
            "Priority support"
        ]
    ),
    PricingTier.AGENCY: TierConfig(
        name="Agency",
        price=99700,  # $997
        price_id=os.getenv("STRIPE_AGENCY_PRICE_ID", ""),
        calls_limit=None,  # Unlimited
        sub_accounts=10,
        features=[
            "Everything in Growth",
            "10 sub-accounts included",
            "White-label branding",
            "Custom domain",
            "Outbound campaigns",
            "Client rebilling via Stripe",
            "Dedicated success manager"
        ]
    )
}

# =============================================================================
# Stripe Customer Management
# =============================================================================

class StripeService:
    """Comprehensive Stripe billing management"""

    @staticmethod
    async def create_customer(
        email: str,
        name: str,
        user_id: str,
        business_id: str,
        metadata: Optional[Dict] = None
    ) -> stripe.Customer:
        """Create a new Stripe customer"""
        customer_metadata = {
            "user_id": user_id,
            "business_id": business_id,
            **(metadata or {})
        }

        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=customer_metadata
        )

        return customer

    @staticmethod
    async def get_customer(customer_id: str) -> Optional[stripe.Customer]:
        """Retrieve a Stripe customer"""
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.InvalidRequestError:
            return None

    @staticmethod
    async def update_customer(
        customer_id: str,
        email: Optional[str] = None,
        name: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> stripe.Customer:
        """Update a Stripe customer"""
        update_data = {}
        if email:
            update_data["email"] = email
        if name:
            update_data["name"] = name
        if metadata:
            update_data["metadata"] = metadata

        return stripe.Customer.modify(customer_id, **update_data)

    # =========================================================================
    # Checkout Sessions
    # =========================================================================

    @staticmethod
    async def create_checkout_session(
        customer_id: str,
        tier: PricingTier,
        business_id: str,
        user_id: str,
        success_url: str,
        cancel_url: str,
        trial_days: int = 7,
        promotion_code: Optional[str] = None
    ) -> stripe.checkout.Session:
        """Create a checkout session for subscription"""
        tier_config = TIER_CONFIGS[tier]

        if not tier_config.price_id:
            raise ValueError(f"Price ID not configured for tier: {tier.value}")

        session_params = {
            "customer": customer_id,
            "payment_method_types": ["card"],
            "line_items": [{
                "price": tier_config.price_id,
                "quantity": 1
            }],
            "mode": "subscription",
            "subscription_data": {
                "trial_period_days": trial_days,
                "metadata": {
                    "business_id": business_id,
                    "tier": tier.value
                }
            },
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "business_id": business_id,
                "user_id": user_id,
                "tier": tier.value
            },
            "allow_promotion_codes": True
        }

        # Add specific promotion code if provided
        if promotion_code:
            session_params["discounts"] = [{"promotion_code": promotion_code}]
            del session_params["allow_promotion_codes"]

        return stripe.checkout.Session.create(**session_params)

    @staticmethod
    async def get_checkout_session(session_id: str) -> stripe.checkout.Session:
        """Retrieve a checkout session"""
        return stripe.checkout.Session.retrieve(session_id)

    # =========================================================================
    # Subscription Management
    # =========================================================================

    @staticmethod
    async def get_subscription(subscription_id: str) -> Optional[stripe.Subscription]:
        """Retrieve a subscription"""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.InvalidRequestError:
            return None

    @staticmethod
    async def cancel_subscription(
        subscription_id: str,
        immediately: bool = False
    ) -> stripe.Subscription:
        """Cancel a subscription"""
        if immediately:
            return stripe.Subscription.delete(subscription_id)
        else:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )

    @staticmethod
    async def reactivate_subscription(subscription_id: str) -> stripe.Subscription:
        """Reactivate a cancelled subscription (before period end)"""
        return stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )

    @staticmethod
    async def change_subscription_tier(
        subscription_id: str,
        new_tier: PricingTier,
        prorate: bool = True
    ) -> stripe.Subscription:
        """Change subscription to a different tier"""
        subscription = stripe.Subscription.retrieve(subscription_id)
        tier_config = TIER_CONFIGS[new_tier]

        if not tier_config.price_id:
            raise ValueError(f"Price ID not configured for tier: {new_tier.value}")

        # Update the subscription with the new price
        return stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": subscription["items"]["data"][0]["id"],
                "price": tier_config.price_id
            }],
            proration_behavior="create_prorations" if prorate else "none",
            metadata={"tier": new_tier.value}
        )

    @staticmethod
    async def get_subscription_status(subscription_id: str) -> Dict[str, Any]:
        """Get detailed subscription status"""
        subscription = stripe.Subscription.retrieve(subscription_id)

        return {
            "id": subscription.id,
            "status": subscription.status,
            "tier": subscription.metadata.get("tier", "growth"),
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "cancel_at": datetime.fromtimestamp(subscription.cancel_at) if subscription.cancel_at else None,
            "trial_end": datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
            "days_until_renewal": (datetime.fromtimestamp(subscription.current_period_end) - datetime.now()).days
        }

    # =========================================================================
    # Customer Portal
    # =========================================================================

    @staticmethod
    async def create_portal_session(
        customer_id: str,
        return_url: str
    ) -> stripe.billing_portal.Session:
        """Create a customer portal session for self-service billing management"""
        return stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )

    # =========================================================================
    # Usage & Metering (for future usage-based pricing)
    # =========================================================================

    @staticmethod
    async def report_usage(
        subscription_item_id: str,
        quantity: int,
        timestamp: Optional[int] = None,
        action: str = "increment"
    ):
        """Report usage for metered billing"""
        usage_record = stripe.SubscriptionItem.create_usage_record(
            subscription_item_id,
            quantity=quantity,
            timestamp=timestamp or int(datetime.now().timestamp()),
            action=action
        )
        return usage_record

    # =========================================================================
    # Invoices
    # =========================================================================

    @staticmethod
    async def get_invoices(
        customer_id: str,
        limit: int = 10
    ) -> List[stripe.Invoice]:
        """Get customer invoices"""
        invoices = stripe.Invoice.list(
            customer=customer_id,
            limit=limit
        )
        return invoices.data

    @staticmethod
    async def get_upcoming_invoice(customer_id: str) -> Optional[stripe.Invoice]:
        """Get upcoming invoice for a customer"""
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.InvalidRequestError:
            return None

    # =========================================================================
    # Payment Methods
    # =========================================================================

    @staticmethod
    async def get_payment_methods(customer_id: str) -> List[stripe.PaymentMethod]:
        """Get customer payment methods"""
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id,
            type="card"
        )
        return payment_methods.data

    @staticmethod
    async def set_default_payment_method(
        customer_id: str,
        payment_method_id: str
    ) -> stripe.Customer:
        """Set default payment method for a customer"""
        return stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )

    # =========================================================================
    # Coupons & Promotions
    # =========================================================================

    @staticmethod
    async def create_coupon(
        percent_off: Optional[int] = None,
        amount_off: Optional[int] = None,
        currency: str = "usd",
        duration: str = "once",
        duration_in_months: Optional[int] = None,
        name: Optional[str] = None,
        max_redemptions: Optional[int] = None
    ) -> stripe.Coupon:
        """Create a coupon"""
        coupon_params = {
            "duration": duration,
            "currency": currency
        }

        if percent_off:
            coupon_params["percent_off"] = percent_off
        elif amount_off:
            coupon_params["amount_off"] = amount_off

        if duration_in_months:
            coupon_params["duration_in_months"] = duration_in_months
        if name:
            coupon_params["name"] = name
        if max_redemptions:
            coupon_params["max_redemptions"] = max_redemptions

        return stripe.Coupon.create(**coupon_params)

    @staticmethod
    async def create_promotion_code(
        coupon_id: str,
        code: str,
        max_redemptions: Optional[int] = None,
        expires_at: Optional[int] = None
    ) -> stripe.PromotionCode:
        """Create a promotion code from a coupon"""
        promo_params = {
            "coupon": coupon_id,
            "code": code
        }

        if max_redemptions:
            promo_params["max_redemptions"] = max_redemptions
        if expires_at:
            promo_params["expires_at"] = expires_at

        return stripe.PromotionCode.create(**promo_params)

    # =========================================================================
    # Webhook Handling
    # =========================================================================

    @staticmethod
    def construct_webhook_event(
        payload: bytes,
        signature: str,
        webhook_secret: str
    ) -> stripe.Event:
        """Construct and verify a webhook event"""
        return stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )


# =============================================================================
# Agency Rebilling Service
# =============================================================================

class AgencyBillingService:
    """Handle agency client billing and rebilling"""

    @staticmethod
    async def create_client_subscription(
        agency_stripe_account: str,
        client_email: str,
        client_name: str,
        price_amount: int,  # In cents
        agency_id: str,
        sub_account_id: str
    ) -> Dict[str, Any]:
        """Create a subscription for an agency's client (Connect)"""
        # Create customer on connected account
        customer = stripe.Customer.create(
            email=client_email,
            name=client_name,
            metadata={
                "agency_id": agency_id,
                "sub_account_id": sub_account_id
            },
            stripe_account=agency_stripe_account
        )

        # Create a price for this client
        price = stripe.Price.create(
            unit_amount=price_amount,
            currency="usd",
            recurring={"interval": "month"},
            product_data={"name": f"CallBot AI - {client_name}"},
            stripe_account=agency_stripe_account
        )

        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": price.id}],
            stripe_account=agency_stripe_account
        )

        return {
            "customer_id": customer.id,
            "subscription_id": subscription.id,
            "price_id": price.id
        }

    @staticmethod
    async def create_connect_account(
        email: str,
        business_name: str,
        agency_id: str
    ) -> stripe.Account:
        """Create a Stripe Connect account for an agency"""
        account = stripe.Account.create(
            type="express",
            email=email,
            business_profile={"name": business_name},
            metadata={"agency_id": agency_id},
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True}
            }
        )
        return account

    @staticmethod
    async def create_connect_onboarding_link(
        account_id: str,
        refresh_url: str,
        return_url: str
    ) -> stripe.AccountLink:
        """Create onboarding link for Connect account"""
        return stripe.AccountLink.create(
            account=account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding"
        )

    @staticmethod
    async def create_connect_login_link(account_id: str) -> stripe.LoginLink:
        """Create a login link for the Express dashboard"""
        return stripe.Account.create_login_link(account_id)


# =============================================================================
# Utility Functions
# =============================================================================

def get_tier_config(tier: PricingTier) -> TierConfig:
    """Get configuration for a specific tier"""
    return TIER_CONFIGS[tier]

def get_all_tiers() -> Dict[str, Dict[str, Any]]:
    """Get all tier configurations for pricing page"""
    return {
        tier.value: {
            "name": config.name,
            "price": config.price / 100,  # Convert to dollars
            "calls_limit": config.calls_limit,
            "sub_accounts": config.sub_accounts,
            "features": config.features
        }
        for tier, config in TIER_CONFIGS.items()
    }

def is_feature_available(tier: PricingTier, feature: str) -> bool:
    """Check if a feature is available for a tier"""
    tier_config = TIER_CONFIGS[tier]
    return feature in tier_config.features

def get_calls_limit(tier: PricingTier) -> Optional[int]:
    """Get calls limit for a tier (None = unlimited)"""
    return TIER_CONFIGS[tier].calls_limit

def can_access_feature(current_tier: PricingTier, required_tier: PricingTier) -> bool:
    """Check if current tier can access features of required tier"""
    tier_order = [PricingTier.STARTER, PricingTier.GROWTH, PricingTier.AGENCY]
    return tier_order.index(current_tier) >= tier_order.index(required_tier)
