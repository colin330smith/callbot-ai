"""
Email Service for CallBotAI
Supports multiple providers: SMTP, Resend, SendGrid
"""

import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict
from datetime import datetime
import httpx

# Configuration
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "smtp")  # smtp, resend, sendgrid
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@callbotai.com")
FROM_NAME = os.getenv("FROM_NAME", "CallBot AI")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


# =============================================================================
# Email Templates
# =============================================================================

def get_base_template(content: str, preview_text: str = "") -> str:
    """Base email template with consistent styling"""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CallBot AI</title>
    <!--[if mso]>
    <style type="text/css">
        table {{border-collapse:collapse;border-spacing:0;margin:0;}}
        div, td {{padding:0;}}
        div {{margin:0 !important;}}
    </style>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body {{ margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background-color: #4f46e5; padding: 24px; text-align: center; }}
        .header img {{ height: 32px; }}
        .header h1 {{ color: #ffffff; font-size: 24px; margin: 0; }}
        .content {{ padding: 32px 24px; }}
        .button {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }}
        .button:hover {{ background-color: #4338ca; }}
        .footer {{ padding: 24px; text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #e4e4e7; }}
        .stat-box {{ background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 8px 0; }}
        .stat-value {{ font-size: 24px; font-weight: 700; color: #18181b; }}
        .stat-label {{ font-size: 14px; color: #71717a; }}
        .transcript {{ background-color: #f4f4f5; border-radius: 8px; padding: 16px; font-size: 14px; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }}
        @media only screen and (max-width: 600px) {{
            .container {{ width: 100% !important; }}
            .content {{ padding: 24px 16px !important; }}
        }}
    </style>
</head>
<body>
    <div style="display:none;max-height:0;overflow:hidden;">{preview_text}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <tr>
                        <td class="header">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CallBot AI</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            {content}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p style="margin: 0;">© {datetime.now().year} CallBot AI. All rights reserved.</p>
                            <p style="margin: 8px 0 0 0;">
                                <a href="{BASE_URL}" style="color: #4f46e5; text-decoration: none;">Visit Dashboard</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def template_welcome(business_name: str, dashboard_url: str) -> tuple[str, str]:
    """Welcome email template"""
    subject = "Welcome to CallBot AI!"
    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">Welcome to CallBot AI!</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            You're just a few steps away from having your own AI phone receptionist for <strong>{business_name}</strong>.
        </p>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Complete the setup wizard to configure your AI agent and start capturing every call.
        </p>
        <div style="text-align: center;">
            <a href="{dashboard_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Complete Setup
            </a>
        </div>
        <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
            Questions? Just reply to this email and we'll help you out.
        </p>
    """
    return subject, get_base_template(content, "Welcome! Complete your AI setup")


def template_agent_live(business_name: str, phone_number: str, dashboard_url: str) -> tuple[str, str]:
    """Agent is live email template"""
    subject = f"Your AI Receptionist is Live!"
    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">🎉 Your AI is Ready!</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            Great news! Your AI receptionist for <strong>{business_name}</strong> is now live and ready to take calls.
        </p>
        <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="color: #71717a; font-size: 14px; margin: 0 0 4px 0;">Your AI Phone Number</p>
            <p style="font-size: 24px; font-weight: 700; color: #18181b; margin: 0; font-family: monospace;">{phone_number}</p>
        </div>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Try calling this number to hear how your AI answers. You can also make test calls from your dashboard.
        </p>
        <div style="text-align: center;">
            <a href="{dashboard_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View Dashboard
            </a>
        </div>
    """
    return subject, get_base_template(content, f"Your AI is live at {phone_number}")


def template_new_call(
    business_name: str,
    caller_phone: str,
    duration: int,
    summary: str,
    appointment_booked: bool,
    dashboard_url: str
) -> tuple[str, str]:
    """New call notification template"""
    subject = f"New Call - {business_name}"
    appointment_badge = '<span style="background-color: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">APPOINTMENT BOOKED</span>' if appointment_booked else ''

    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">New Call Received {appointment_badge}</h2>
        <div style="display: flex; gap: 16px; margin: 16px 0;">
            <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; flex: 1; text-align: center;">
                <p class="stat-label" style="font-size: 12px; color: #71717a; margin: 0 0 4px 0;">Caller</p>
                <p class="stat-value" style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0;">{caller_phone or 'Unknown'}</p>
            </div>
            <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; flex: 1; text-align: center;">
                <p class="stat-label" style="font-size: 12px; color: #71717a; margin: 0 0 4px 0;">Duration</p>
                <p class="stat-value" style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0;">{duration}s</p>
            </div>
        </div>
        <div style="margin: 24px 0;">
            <h3 style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">Summary</h3>
            <div class="transcript" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; font-size: 14px; color: #52525b; line-height: 1.6;">
                {summary or 'No summary available'}
            </div>
        </div>
        <div style="text-align: center;">
            <a href="{dashboard_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View Full Details
            </a>
        </div>
    """
    return subject, get_base_template(content, f"New call from {caller_phone}")


def template_password_reset(reset_url: str) -> tuple[str, str]:
    """Password reset email template"""
    subject = "Reset Your Password"
    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">Reset Your Password</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            We received a request to reset your password. Click the button below to choose a new password.
        </p>
        <div style="text-align: center; margin: 24px 0;">
            <a href="{reset_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #71717a; font-size: 12px; margin: 16px 0 0 0;">
            Or copy this link: <a href="{reset_url}" style="color: #4f46e5;">{reset_url}</a>
        </p>
    """
    return subject, get_base_template(content, "Reset your CallBot AI password")


def template_trial_ending(business_name: str, days_remaining: int, billing_url: str) -> tuple[str, str]:
    """Trial ending soon template"""
    subject = f"Your Trial Ends in {days_remaining} Days"
    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">Your Trial is Ending Soon</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            Your free trial for <strong>{business_name}</strong> ends in <strong>{days_remaining} days</strong>.
        </p>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Your card will be charged $497/month to continue your AI receptionist service. No action needed if you want to continue.
        </p>
        <div style="text-align: center;">
            <a href="{billing_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Manage Subscription
            </a>
        </div>
        <p style="color: #71717a; font-size: 14px; margin: 24px 0 0 0;">
            Want to cancel? You can do so anytime from your billing portal.
        </p>
    """
    return subject, get_base_template(content, f"Trial ends in {days_remaining} days")


def template_payment_failed(business_name: str, billing_url: str) -> tuple[str, str]:
    """Payment failed template"""
    subject = "Payment Failed - Action Required"
    content = f"""
        <h2 style="color: #dc2626; margin: 0 0 16px 0;">⚠️ Payment Failed</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            We couldn't process your payment for <strong>{business_name}</strong>.
        </p>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Please update your payment method to keep your AI receptionist active. Your service may be interrupted if payment isn't received.
        </p>
        <div style="text-align: center;">
            <a href="{billing_url}" class="button" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Update Payment Method
            </a>
        </div>
    """
    return subject, get_base_template(content, "Please update your payment method")


def template_subscription_cancelled(business_name: str, reactivate_url: str) -> tuple[str, str]:
    """Subscription cancelled template"""
    subject = "Your Subscription Has Ended"
    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">Subscription Cancelled</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            Your AI receptionist for <strong>{business_name}</strong> has been suspended.
        </p>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            We're sorry to see you go! If you change your mind, you can reactivate your account anytime.
        </p>
        <div style="text-align: center;">
            <a href="{reactivate_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Reactivate Account
            </a>
        </div>
    """
    return subject, get_base_template(content, "Your CallBot AI subscription has ended")


def template_weekly_summary(
    business_name: str,
    total_calls: int,
    appointments_booked: int,
    avg_duration: float,
    top_topics: List[str],
    dashboard_url: str
) -> tuple[str, str]:
    """Weekly summary template"""
    subject = f"Weekly Summary - {business_name}"
    topics_html = "".join([f"<li style='margin: 4px 0;'>{topic}</li>" for topic in top_topics[:5]]) if top_topics else "<li>No data yet</li>"

    content = f"""
        <h2 style="color: #18181b; margin: 0 0 16px 0;">📊 Your Weekly Summary</h2>
        <p style="color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
            Here's how your AI receptionist performed this week for <strong>{business_name}</strong>.
        </p>
        <div style="display: table; width: 100%; margin: 16px 0;">
            <div style="display: table-row;">
                <div style="display: table-cell; width: 33%; padding: 8px;">
                    <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
                        <p class="stat-value" style="font-size: 32px; font-weight: 700; color: #4f46e5; margin: 0;">{total_calls}</p>
                        <p class="stat-label" style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Calls</p>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 8px;">
                    <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
                        <p class="stat-value" style="font-size: 32px; font-weight: 700; color: #22c55e; margin: 0;">{appointments_booked}</p>
                        <p class="stat-label" style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Appointments</p>
                    </div>
                </div>
                <div style="display: table-cell; width: 33%; padding: 8px;">
                    <div class="stat-box" style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center;">
                        <p class="stat-value" style="font-size: 32px; font-weight: 700; color: #18181b; margin: 0;">{avg_duration:.0f}s</p>
                        <p class="stat-label" style="font-size: 12px; color: #71717a; margin: 4px 0 0 0;">Avg Duration</p>
                    </div>
                </div>
            </div>
        </div>
        <div style="margin: 24px 0;">
            <h3 style="color: #18181b; font-size: 14px; margin: 0 0 8px 0;">Common Topics</h3>
            <ul style="color: #52525b; padding-left: 20px; margin: 0;">
                {topics_html}
            </ul>
        </div>
        <div style="text-align: center;">
            <a href="{dashboard_url}" class="button" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View Full Report
            </a>
        </div>
    """
    return subject, get_base_template(content, f"This week: {total_calls} calls, {appointments_booked} appointments")


# =============================================================================
# Email Sending Functions
# =============================================================================

async def send_email_smtp(to: str, subject: str, html: str, text: str = None) -> bool:
    """Send email via SMTP"""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL] SMTP not configured. Would send to {to}: {subject}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to

        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        context = ssl.create_default_context()

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to, msg.as_string())

        print(f"[EMAIL] Sent to {to}: {subject}")
        return True

    except Exception as e:
        print(f"[EMAIL] Error sending to {to}: {e}")
        return False


async def send_email_resend(to: str, subject: str, html: str) -> bool:
    """Send email via Resend API"""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Resend not configured. Would send to {to}: {subject}")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": f"{FROM_NAME} <{FROM_EMAIL}>",
                    "to": [to],
                    "subject": subject,
                    "html": html
                }
            )

            if response.status_code == 200:
                print(f"[EMAIL] Sent via Resend to {to}: {subject}")
                return True
            else:
                print(f"[EMAIL] Resend error: {response.text}")
                return False

    except Exception as e:
        print(f"[EMAIL] Resend error: {e}")
        return False


async def send_email(to: str, subject: str, html: str, text: str = None) -> bool:
    """Send email using configured provider"""
    if EMAIL_PROVIDER == "resend" and RESEND_API_KEY:
        return await send_email_resend(to, subject, html)
    else:
        return await send_email_smtp(to, subject, html, text)


# =============================================================================
# High-Level Email Functions
# =============================================================================

async def send_welcome_email(to: str, business_name: str):
    """Send welcome email"""
    dashboard_url = f"{BASE_URL}/onboarding"
    subject, html = template_welcome(business_name, dashboard_url)
    return await send_email(to, subject, html)


async def send_agent_live_email(to: str, business_name: str, phone_number: str):
    """Send agent is live email"""
    dashboard_url = f"{BASE_URL}/dashboard"
    subject, html = template_agent_live(business_name, phone_number, dashboard_url)
    return await send_email(to, subject, html)


async def send_new_call_email(
    to: str,
    business_name: str,
    caller_phone: str,
    duration: int,
    summary: str,
    appointment_booked: bool
):
    """Send new call notification email"""
    dashboard_url = f"{BASE_URL}/dashboard"
    subject, html = template_new_call(
        business_name, caller_phone, duration, summary, appointment_booked, dashboard_url
    )
    return await send_email(to, subject, html)


async def send_password_reset_email(to: str, token: str):
    """Send password reset email"""
    reset_url = f"{BASE_URL}/reset-password?token={token}"
    subject, html = template_password_reset(reset_url)
    return await send_email(to, subject, html)


async def send_trial_ending_email(to: str, business_name: str, days_remaining: int):
    """Send trial ending email"""
    billing_url = f"{BASE_URL}/api/stripe/portal"
    subject, html = template_trial_ending(business_name, days_remaining, billing_url)
    return await send_email(to, subject, html)


async def send_payment_failed_email(to: str, business_name: str):
    """Send payment failed email"""
    billing_url = f"{BASE_URL}/api/stripe/portal"
    subject, html = template_payment_failed(business_name, billing_url)
    return await send_email(to, subject, html)


async def send_subscription_cancelled_email(to: str, business_name: str):
    """Send subscription cancelled email"""
    reactivate_url = f"{BASE_URL}/signup"
    subject, html = template_subscription_cancelled(business_name, reactivate_url)
    return await send_email(to, subject, html)


async def send_weekly_summary_email(
    to: str,
    business_name: str,
    total_calls: int,
    appointments_booked: int,
    avg_duration: float,
    top_topics: List[str] = None
):
    """Send weekly summary email"""
    dashboard_url = f"{BASE_URL}/dashboard"
    subject, html = template_weekly_summary(
        business_name, total_calls, appointments_booked, avg_duration, top_topics or [], dashboard_url
    )
    return await send_email(to, subject, html)
