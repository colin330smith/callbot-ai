"""
Agency/White-Label Service for CallBot AI
Enables agencies to resell with sub-accounts and custom branding
"""

import os
import stripe
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from enum import Enum
import hashlib
import secrets

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


class AgencyTier(Enum):
    STARTER = "starter"       # Up to 5 sub-accounts
    PROFESSIONAL = "professional"  # Up to 25 sub-accounts
    ENTERPRISE = "enterprise"     # Unlimited sub-accounts


class SubAccountStatus(Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    TRIAL = "trial"


# Agency tier limits and pricing
AGENCY_TIERS = {
    AgencyTier.STARTER: {
        "max_sub_accounts": 5,
        "monthly_price": 997,
        "included_minutes": 5000,
        "per_minute_overage": 0.08,
        "white_label": False,
        "custom_domain": False,
        "api_access": True,
        "priority_support": False
    },
    AgencyTier.PROFESSIONAL: {
        "max_sub_accounts": 25,
        "monthly_price": 2497,
        "included_minutes": 15000,
        "per_minute_overage": 0.06,
        "white_label": True,
        "custom_domain": True,
        "api_access": True,
        "priority_support": True
    },
    AgencyTier.ENTERPRISE: {
        "max_sub_accounts": -1,  # Unlimited
        "monthly_price": 4997,
        "included_minutes": 50000,
        "per_minute_overage": 0.04,
        "white_label": True,
        "custom_domain": True,
        "api_access": True,
        "priority_support": True,
        "dedicated_account_manager": True
    }
}


class Agency:
    """Agency account that can manage sub-accounts"""

    def __init__(
        self,
        agency_id: str,
        user_id: str,
        name: str,
        tier: AgencyTier = AgencyTier.STARTER
    ):
        self.id = agency_id
        self.user_id = user_id
        self.name = name
        self.tier = tier
        self.created_at = datetime.utcnow()

        # Branding
        self.branding = {
            "logo_url": None,
            "primary_color": "#4F46E5",
            "secondary_color": "#10B981",
            "company_name": name,
            "support_email": None,
            "custom_domain": None
        }

        # Billing
        self.stripe_customer_id = None
        self.stripe_subscription_id = None
        self.billing_status = "active"

        # Sub-accounts
        self.sub_accounts: List[str] = []

        # Usage tracking
        self.total_minutes_used = 0
        self.current_period_minutes = 0
        self.period_start = datetime.utcnow()

    @property
    def tier_config(self) -> Dict:
        return AGENCY_TIERS[self.tier]

    @property
    def can_add_sub_account(self) -> bool:
        max_accounts = self.tier_config["max_sub_accounts"]
        if max_accounts == -1:
            return True
        return len(self.sub_accounts) < max_accounts

    @property
    def remaining_minutes(self) -> int:
        included = self.tier_config["included_minutes"]
        return max(0, included - self.current_period_minutes)

    def calculate_overage(self) -> Dict:
        """Calculate overage charges for current period"""
        included = self.tier_config["included_minutes"]
        overage_minutes = max(0, self.current_period_minutes - included)
        overage_rate = self.tier_config["per_minute_overage"]
        overage_amount = overage_minutes * overage_rate

        return {
            "included_minutes": included,
            "used_minutes": self.current_period_minutes,
            "overage_minutes": overage_minutes,
            "overage_rate": overage_rate,
            "overage_amount": round(overage_amount, 2)
        }


class SubAccount:
    """Sub-account managed by an agency"""

    def __init__(
        self,
        sub_account_id: str,
        agency_id: str,
        business_id: str,
        client_name: str
    ):
        self.id = sub_account_id
        self.agency_id = agency_id
        self.business_id = business_id
        self.client_name = client_name
        self.status = SubAccountStatus.ACTIVE
        self.created_at = datetime.utcnow()

        # Agency can set custom pricing for their clients
        self.client_monthly_price = 0  # What the agency charges their client
        self.margin = 0

        # Usage
        self.minutes_used = 0
        self.calls_count = 0

    def set_pricing(self, monthly_price: float, base_cost: float):
        """Set pricing for this sub-account"""
        self.client_monthly_price = monthly_price
        self.margin = monthly_price - base_cost


class AgencyManager:
    """Manages agencies and their sub-accounts"""

    def __init__(self):
        self.agencies: Dict[str, Agency] = {}
        self.sub_accounts: Dict[str, SubAccount] = {}

    def create_agency(
        self,
        user_id: str,
        name: str,
        tier: AgencyTier = AgencyTier.STARTER
    ) -> Agency:
        """Create a new agency"""
        agency_id = f"agency_{secrets.token_hex(8)}"
        agency = Agency(agency_id, user_id, name, tier)
        self.agencies[agency_id] = agency
        return agency

    def get_agency(self, agency_id: str) -> Optional[Agency]:
        return self.agencies.get(agency_id)

    def get_agency_by_user(self, user_id: str) -> Optional[Agency]:
        for agency in self.agencies.values():
            if agency.user_id == user_id:
                return agency
        return None

    def create_sub_account(
        self,
        agency_id: str,
        business_id: str,
        client_name: str
    ) -> Optional[SubAccount]:
        """Create a sub-account under an agency"""
        agency = self.get_agency(agency_id)
        if not agency:
            return None

        if not agency.can_add_sub_account:
            return None

        sub_id = f"sub_{secrets.token_hex(8)}"
        sub_account = SubAccount(sub_id, agency_id, business_id, client_name)

        self.sub_accounts[sub_id] = sub_account
        agency.sub_accounts.append(sub_id)

        return sub_account

    def get_sub_account(self, sub_id: str) -> Optional[SubAccount]:
        return self.sub_accounts.get(sub_id)

    def get_agency_sub_accounts(self, agency_id: str) -> List[SubAccount]:
        agency = self.get_agency(agency_id)
        if not agency:
            return []

        return [self.sub_accounts[sid] for sid in agency.sub_accounts if sid in self.sub_accounts]

    def record_usage(self, agency_id: str, sub_account_id: str, minutes: int):
        """Record usage for a sub-account"""
        agency = self.get_agency(agency_id)
        sub_account = self.get_sub_account(sub_account_id)

        if agency and sub_account:
            agency.current_period_minutes += minutes
            agency.total_minutes_used += minutes
            sub_account.minutes_used += minutes
            sub_account.calls_count += 1

    def get_agency_dashboard_stats(self, agency_id: str) -> Dict:
        """Get dashboard stats for agency"""
        agency = self.get_agency(agency_id)
        if not agency:
            return {}

        sub_accounts = self.get_agency_sub_accounts(agency_id)

        total_calls = sum(s.calls_count for s in sub_accounts)
        total_minutes = sum(s.minutes_used for s in sub_accounts)
        active_accounts = sum(1 for s in sub_accounts if s.status == SubAccountStatus.ACTIVE)

        # Calculate revenue
        monthly_revenue = sum(s.client_monthly_price for s in sub_accounts if s.status == SubAccountStatus.ACTIVE)
        monthly_cost = agency.tier_config["monthly_price"]
        overage = agency.calculate_overage()

        return {
            "agency_name": agency.name,
            "tier": agency.tier.value,
            "sub_accounts": {
                "total": len(sub_accounts),
                "active": active_accounts,
                "limit": agency.tier_config["max_sub_accounts"]
            },
            "usage": {
                "total_calls": total_calls,
                "total_minutes": total_minutes,
                "included_minutes": agency.tier_config["included_minutes"],
                "remaining_minutes": agency.remaining_minutes
            },
            "financials": {
                "monthly_revenue": monthly_revenue,
                "platform_cost": monthly_cost,
                "overage_amount": overage["overage_amount"],
                "net_profit": monthly_revenue - monthly_cost - overage["overage_amount"]
            }
        }


# Stripe integration for agency billing
async def create_agency_subscription(
    agency: Agency,
    email: str,
    payment_method_id: str
) -> Dict:
    """Create Stripe subscription for agency"""
    if not STRIPE_SECRET_KEY:
        return {"success": False, "error": "Stripe not configured"}

    try:
        # Create customer if needed
        if not agency.stripe_customer_id:
            customer = stripe.Customer.create(
                email=email,
                name=agency.name,
                metadata={
                    "agency_id": agency.id,
                    "tier": agency.tier.value
                }
            )
            agency.stripe_customer_id = customer.id

        # Attach payment method
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=agency.stripe_customer_id
        )

        # Set as default payment method
        stripe.Customer.modify(
            agency.stripe_customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )

        # Create subscription (you'd need to create these prices in Stripe)
        price_map = {
            AgencyTier.STARTER: os.getenv("STRIPE_AGENCY_STARTER_PRICE_ID", ""),
            AgencyTier.PROFESSIONAL: os.getenv("STRIPE_AGENCY_PRO_PRICE_ID", ""),
            AgencyTier.ENTERPRISE: os.getenv("STRIPE_AGENCY_ENTERPRISE_PRICE_ID", "")
        }

        price_id = price_map.get(agency.tier)
        if not price_id:
            return {"success": False, "error": "Agency tier price not configured"}

        subscription = stripe.Subscription.create(
            customer=agency.stripe_customer_id,
            items=[{"price": price_id}],
            metadata={"agency_id": agency.id}
        )

        agency.stripe_subscription_id = subscription.id
        agency.billing_status = subscription.status

        return {
            "success": True,
            "subscription_id": subscription.id,
            "status": subscription.status
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


async def charge_agency_overage(agency: Agency) -> Dict:
    """Create invoice for overage charges"""
    if not STRIPE_SECRET_KEY or not agency.stripe_customer_id:
        return {"success": False, "error": "Stripe not configured or no customer"}

    overage = agency.calculate_overage()
    if overage["overage_amount"] <= 0:
        return {"success": True, "message": "No overage to charge"}

    try:
        # Create invoice item for overage
        stripe.InvoiceItem.create(
            customer=agency.stripe_customer_id,
            amount=int(overage["overage_amount"] * 100),  # cents
            currency="usd",
            description=f"Usage overage: {overage['overage_minutes']} minutes @ ${overage['overage_rate']}/min"
        )

        # Create and finalize invoice
        invoice = stripe.Invoice.create(
            customer=agency.stripe_customer_id,
            auto_advance=True  # Auto-finalize
        )

        return {
            "success": True,
            "invoice_id": invoice.id,
            "amount": overage["overage_amount"]
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def generate_agency_api_key(agency_id: str) -> str:
    """Generate API key for agency"""
    random_bytes = secrets.token_bytes(32)
    key = f"cb_agency_{hashlib.sha256(f'{agency_id}{random_bytes.hex()}'.encode()).hexdigest()[:32]}"
    return key


def generate_sub_account_invite_link(agency: Agency, base_url: str) -> str:
    """Generate invite link for new sub-accounts"""
    token = secrets.token_urlsafe(32)
    return f"{base_url}/agency/invite/{agency.id}?token={token}"


# White-label customization
def get_white_label_config(agency: Agency) -> Dict:
    """Get white-label configuration for agency"""
    if not agency.tier_config.get("white_label"):
        return {"enabled": False}

    return {
        "enabled": True,
        "logo_url": agency.branding.get("logo_url"),
        "primary_color": agency.branding.get("primary_color"),
        "secondary_color": agency.branding.get("secondary_color"),
        "company_name": agency.branding.get("company_name"),
        "support_email": agency.branding.get("support_email"),
        "custom_domain": agency.branding.get("custom_domain"),
        "powered_by": False if agency.tier == AgencyTier.ENTERPRISE else True
    }


def update_agency_branding(agency: Agency, branding_updates: Dict) -> Dict:
    """Update agency branding"""
    if not agency.tier_config.get("white_label"):
        return {"success": False, "error": "White-label not available in current tier"}

    allowed_fields = ["logo_url", "primary_color", "secondary_color", "company_name", "support_email"]

    for field in allowed_fields:
        if field in branding_updates:
            agency.branding[field] = branding_updates[field]

    # Custom domain only for pro+
    if "custom_domain" in branding_updates and agency.tier_config.get("custom_domain"):
        agency.branding["custom_domain"] = branding_updates["custom_domain"]

    return {"success": True, "branding": agency.branding}


# Global agency manager
agency_manager = AgencyManager()
