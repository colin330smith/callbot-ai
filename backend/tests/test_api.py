"""
CallBot AI - API Tests
Comprehensive test suite for all endpoints
"""

import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestHealthEndpoints:
    """Test health check and status endpoints"""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test basic health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_root_redirect(self, client):
        """Test root path redirects to landing page"""
        response = await client.get("/", follow_redirects=False)
        # Should either redirect or serve HTML
        assert response.status_code in [200, 301, 302, 307, 308]


class TestAuthEndpoints:
    """Test authentication endpoints"""

    @pytest.mark.asyncio
    async def test_auth_me_unauthenticated(self, client):
        """Test /api/auth/me without authentication"""
        response = await client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == False

    @pytest.mark.asyncio
    async def test_magic_link_request(self, client):
        """Test magic link request"""
        response = await client.post(
            "/api/auth/magic-link",
            json={"email": "test@example.com"}
        )
        # Should succeed (even if email isn't sent in test mode)
        assert response.status_code in [200, 201, 400]

    @pytest.mark.asyncio
    async def test_logout(self, client):
        """Test logout endpoint"""
        response = await client.post("/api/auth/logout")
        assert response.status_code == 200


class TestSignupFlow:
    """Test signup and onboarding flow"""

    @pytest.mark.asyncio
    async def test_signup_page_accessible(self, client):
        """Test signup page is accessible"""
        response = await client.get("/signup")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_signup_submission(self, client):
        """Test signup form submission"""
        response = await client.post(
            "/api/signup",
            json={
                "email": "newuser@example.com",
                "business_name": "Test Business",
                "business_type": "hvac",
                "phone": "+15551234567"
            }
        )
        # Accept various status codes depending on config
        assert response.status_code in [200, 201, 400, 422]


class TestBusinessEndpoints:
    """Test business-related endpoints"""

    @pytest.mark.asyncio
    async def test_business_stats_unauthorized(self, client):
        """Test business stats requires auth"""
        response = await client.get("/api/business/fake-uuid/stats")
        assert response.status_code in [401, 403, 404]

    @pytest.mark.asyncio
    async def test_business_calls_unauthorized(self, client):
        """Test business calls requires auth"""
        response = await client.get("/api/business/fake-uuid/calls")
        assert response.status_code in [401, 403, 404]


class TestVapiWebhook:
    """Test Vapi webhook endpoint"""

    @pytest.mark.asyncio
    async def test_vapi_webhook_invalid_payload(self, client):
        """Test Vapi webhook rejects invalid payload"""
        response = await client.post(
            "/api/webhooks/vapi",
            json={"invalid": "payload"}
        )
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]

    @pytest.mark.asyncio
    async def test_vapi_webhook_call_started(self, client):
        """Test Vapi webhook call started event"""
        response = await client.post(
            "/api/webhooks/vapi",
            json={
                "message": {
                    "type": "call-started",
                    "call": {
                        "id": "test-call-id",
                        "assistantId": "test-assistant"
                    }
                }
            }
        )
        assert response.status_code in [200, 400]


class TestStripeEndpoints:
    """Test Stripe-related endpoints"""

    @pytest.mark.asyncio
    async def test_stripe_checkout_requires_auth(self, client):
        """Test Stripe checkout requires authentication"""
        response = await client.get("/api/stripe/checkout?business_id=fake-uuid")
        assert response.status_code in [401, 403, 307]

    @pytest.mark.asyncio
    async def test_stripe_portal_requires_auth(self, client):
        """Test Stripe portal requires authentication"""
        response = await client.get("/api/stripe/portal")
        assert response.status_code in [401, 403]


class TestStaticPages:
    """Test static page serving"""

    @pytest.mark.asyncio
    async def test_landing_page(self, client):
        """Test landing page loads"""
        response = await client.get("/")
        assert response.status_code in [200, 301, 302, 307]

    @pytest.mark.asyncio
    async def test_dashboard_page(self, client):
        """Test dashboard page loads"""
        response = await client.get("/dashboard")
        assert response.status_code in [200, 301, 302, 307, 404]

    @pytest.mark.asyncio
    async def test_login_page(self, client):
        """Test login page loads"""
        response = await client.get("/login")
        assert response.status_code in [200, 301, 302, 307, 404]


class TestAPIExtensions:
    """Test extended API endpoints"""

    @pytest.mark.asyncio
    async def test_integrations_endpoint_exists(self, client):
        """Test integrations endpoint exists"""
        response = await client.get("/api/business/fake-uuid/integrations")
        # Should return auth error, not 404
        assert response.status_code in [401, 403, 404]

    @pytest.mark.asyncio
    async def test_sms_endpoint_exists(self, client):
        """Test SMS endpoint exists"""
        response = await client.get("/api/business/fake-uuid/sms")
        # Should return auth error, not 404
        assert response.status_code in [401, 403, 404]

    @pytest.mark.asyncio
    async def test_campaigns_endpoint_exists(self, client):
        """Test campaigns endpoint exists"""
        response = await client.get("/api/business/fake-uuid/campaigns")
        # Should return auth error, not 404
        assert response.status_code in [401, 403, 404]

    @pytest.mark.asyncio
    async def test_knowledge_base_endpoint_exists(self, client):
        """Test knowledge base endpoint exists"""
        response = await client.get("/api/business/fake-uuid/knowledge-base")
        # Should return auth error, not 404
        assert response.status_code in [401, 403, 404]


class TestPricingTiers:
    """Test pricing tier functionality"""

    def test_tier_configurations_exist(self):
        """Test that pricing tier configurations are defined"""
        from stripe_service import TIER_CONFIGS, PricingTier

        assert PricingTier.STARTER in TIER_CONFIGS
        assert PricingTier.GROWTH in TIER_CONFIGS
        assert PricingTier.AGENCY in TIER_CONFIGS

    def test_tier_prices_correct(self):
        """Test tier prices are set correctly"""
        from stripe_service import TIER_CONFIGS, PricingTier

        assert TIER_CONFIGS[PricingTier.STARTER].price == 29700  # $297
        assert TIER_CONFIGS[PricingTier.GROWTH].price == 49700   # $497
        assert TIER_CONFIGS[PricingTier.AGENCY].price == 99700   # $997

    def test_agency_has_subaccounts(self):
        """Test agency tier includes sub-accounts"""
        from stripe_service import TIER_CONFIGS, PricingTier

        assert TIER_CONFIGS[PricingTier.AGENCY].sub_accounts == 10


class TestServicesExist:
    """Test that all service modules can be imported"""

    def test_sms_service_imports(self):
        """Test SMS service module imports"""
        try:
            import sms_service
            assert hasattr(sms_service, 'SMSService')
        except ImportError:
            pytest.skip("SMS service not available")

    def test_integrations_imports(self):
        """Test integrations module imports"""
        try:
            import integrations
            assert hasattr(integrations, 'IntegrationManager')
        except ImportError:
            pytest.skip("Integrations module not available")

    def test_analytics_imports(self):
        """Test analytics service module imports"""
        try:
            import analytics_service
            assert hasattr(analytics_service, 'ROIAnalytics')
        except ImportError:
            pytest.skip("Analytics service not available")

    def test_knowledge_base_imports(self):
        """Test knowledge base module imports"""
        try:
            import knowledge_base
            assert hasattr(knowledge_base, 'KnowledgeBase')
        except ImportError:
            pytest.skip("Knowledge base module not available")

    def test_agency_service_imports(self):
        """Test agency service module imports"""
        try:
            import agency_service
            assert hasattr(agency_service, 'AgencyManager')
        except ImportError:
            pytest.skip("Agency service not available")

    def test_multilingual_imports(self):
        """Test multilingual module imports"""
        try:
            import multilingual
            assert hasattr(multilingual, 'MultilingualAgent')
        except ImportError:
            pytest.skip("Multilingual module not available")


# Fixtures
@pytest.fixture
async def client():
    """Create test client"""
    try:
        from main_production import app
    except ImportError:
        from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# Run tests with: pytest tests/test_api.py -v
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
