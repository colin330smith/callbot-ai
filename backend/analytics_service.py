"""
Advanced Analytics Service for CallBot AI
ROI metrics, conversion tracking, and business intelligence
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from enum import Enum
from collections import defaultdict
import statistics


class TimeRange(Enum):
    TODAY = "today"
    YESTERDAY = "yesterday"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_QUARTER = "this_quarter"
    THIS_YEAR = "this_year"
    CUSTOM = "custom"


def get_date_range(time_range: TimeRange, custom_start: datetime = None, custom_end: datetime = None) -> tuple:
    """Get start and end dates for a time range"""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if time_range == TimeRange.TODAY:
        return today, now
    elif time_range == TimeRange.YESTERDAY:
        yesterday = today - timedelta(days=1)
        return yesterday, today
    elif time_range == TimeRange.LAST_7_DAYS:
        return today - timedelta(days=7), now
    elif time_range == TimeRange.LAST_30_DAYS:
        return today - timedelta(days=30), now
    elif time_range == TimeRange.THIS_MONTH:
        month_start = today.replace(day=1)
        return month_start, now
    elif time_range == TimeRange.LAST_MONTH:
        month_start = today.replace(day=1)
        last_month_end = month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return last_month_start, month_start
    elif time_range == TimeRange.THIS_QUARTER:
        quarter = (today.month - 1) // 3
        quarter_start = today.replace(month=quarter * 3 + 1, day=1)
        return quarter_start, now
    elif time_range == TimeRange.THIS_YEAR:
        year_start = today.replace(month=1, day=1)
        return year_start, now
    elif time_range == TimeRange.CUSTOM and custom_start and custom_end:
        return custom_start, custom_end

    return today - timedelta(days=30), now


class CallAnalytics:
    """Analytics calculations for calls"""

    @staticmethod
    def calculate_metrics(calls: List[Dict]) -> Dict:
        """Calculate comprehensive call metrics"""
        if not calls:
            return {
                "total_calls": 0,
                "answered_calls": 0,
                "missed_calls": 0,
                "answer_rate": 0,
                "total_duration_minutes": 0,
                "avg_call_duration_seconds": 0,
                "appointments_booked": 0,
                "conversion_rate": 0
            }

        total = len(calls)
        answered = sum(1 for c in calls if c.get("status") == "completed" or c.get("duration", 0) > 0)
        missed = sum(1 for c in calls if c.get("status") == "missed" or c.get("duration", 0) == 0)

        durations = [c.get("duration", 0) for c in calls if c.get("duration", 0) > 0]
        total_duration = sum(durations)
        avg_duration = statistics.mean(durations) if durations else 0

        appointments = sum(1 for c in calls if c.get("appointment_booked", False))

        return {
            "total_calls": total,
            "answered_calls": answered,
            "missed_calls": missed,
            "answer_rate": round((answered / total * 100) if total > 0 else 0, 2),
            "total_duration_minutes": round(total_duration / 60, 2),
            "avg_call_duration_seconds": round(avg_duration, 2),
            "appointments_booked": appointments,
            "conversion_rate": round((appointments / answered * 100) if answered > 0 else 0, 2)
        }

    @staticmethod
    def calculate_hourly_distribution(calls: List[Dict]) -> Dict[int, int]:
        """Calculate call distribution by hour"""
        distribution = defaultdict(int)
        for call in calls:
            if call.get("created_at"):
                hour = call["created_at"].hour if isinstance(call["created_at"], datetime) else 0
                distribution[hour] += 1
        return dict(distribution)

    @staticmethod
    def calculate_daily_distribution(calls: List[Dict]) -> Dict[str, int]:
        """Calculate call distribution by day of week"""
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        distribution = defaultdict(int)
        for call in calls:
            if call.get("created_at"):
                day = call["created_at"].weekday() if isinstance(call["created_at"], datetime) else 0
                distribution[days[day]] += 1
        return dict(distribution)


class ROIAnalytics:
    """ROI and revenue calculations"""

    def __init__(
        self,
        monthly_subscription_cost: float = 497,
        avg_customer_value: float = 500,
        avg_lead_value: float = 100
    ):
        self.subscription_cost = monthly_subscription_cost
        self.avg_customer_value = avg_customer_value
        self.avg_lead_value = avg_lead_value

    def calculate_roi(
        self,
        calls: List[Dict],
        appointments: List[Dict],
        closed_deals: int = 0,
        revenue_generated: float = 0
    ) -> Dict:
        """Calculate comprehensive ROI metrics"""

        # Call stats
        total_calls = len(calls)
        answered = sum(1 for c in calls if c.get("duration", 0) > 0)
        total_minutes = sum(c.get("duration", 0) for c in calls) / 60

        # Appointment stats
        total_appointments = len(appointments)
        confirmed_appointments = sum(1 for a in appointments if a.get("status") == "confirmed")

        # Calculate estimated values
        estimated_lead_value = total_calls * self.avg_lead_value * 0.3  # 30% of calls are quality leads
        estimated_appointment_value = total_appointments * self.avg_customer_value * 0.4  # 40% close rate

        # Use actual revenue if provided, otherwise estimate
        total_value = revenue_generated if revenue_generated > 0 else estimated_appointment_value

        # Cost calculations
        # Estimate Vapi costs (~$0.05/min average)
        vapi_cost = total_minutes * 0.05

        total_cost = self.subscription_cost + vapi_cost

        # ROI calculation
        net_profit = total_value - total_cost
        roi_percentage = (net_profit / total_cost * 100) if total_cost > 0 else 0

        # Cost per metrics
        cost_per_call = total_cost / total_calls if total_calls > 0 else 0
        cost_per_appointment = total_cost / total_appointments if total_appointments > 0 else 0

        return {
            "summary": {
                "total_investment": round(total_cost, 2),
                "estimated_value_generated": round(total_value, 2),
                "net_profit": round(net_profit, 2),
                "roi_percentage": round(roi_percentage, 2)
            },
            "call_metrics": {
                "total_calls": total_calls,
                "answered_calls": answered,
                "total_talk_time_minutes": round(total_minutes, 2),
                "cost_per_call": round(cost_per_call, 2)
            },
            "conversion_metrics": {
                "appointments_booked": total_appointments,
                "appointments_confirmed": confirmed_appointments,
                "deals_closed": closed_deals,
                "call_to_appointment_rate": round((total_appointments / answered * 100) if answered > 0 else 0, 2),
                "appointment_to_close_rate": round((closed_deals / total_appointments * 100) if total_appointments > 0 else 0, 2)
            },
            "cost_analysis": {
                "subscription_cost": self.subscription_cost,
                "usage_cost": round(vapi_cost, 2),
                "cost_per_appointment": round(cost_per_appointment, 2),
                "cost_per_qualified_lead": round(cost_per_call / 0.3, 2) if cost_per_call > 0 else 0
            },
            "projections": {
                "monthly_calls_estimate": total_calls * (30 / 7),  # Extrapolate weekly to monthly
                "monthly_appointments_estimate": total_appointments * (30 / 7),
                "monthly_revenue_estimate": round(total_value * (30 / 7), 2)
            }
        }

    def compare_periods(
        self,
        current_period_data: Dict,
        previous_period_data: Dict
    ) -> Dict:
        """Compare metrics between two periods"""

        def calc_change(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return round(((current - previous) / previous) * 100, 2)

        return {
            "calls_change": calc_change(
                current_period_data.get("total_calls", 0),
                previous_period_data.get("total_calls", 0)
            ),
            "appointments_change": calc_change(
                current_period_data.get("appointments_booked", 0),
                previous_period_data.get("appointments_booked", 0)
            ),
            "conversion_rate_change": calc_change(
                current_period_data.get("conversion_rate", 0),
                previous_period_data.get("conversion_rate", 0)
            ),
            "revenue_change": calc_change(
                current_period_data.get("revenue", 0),
                previous_period_data.get("revenue", 0)
            )
        }


class LeadScoring:
    """Lead scoring based on call interactions"""

    SCORING_RULES = {
        "call_duration": {
            "weight": 20,
            "thresholds": [
                (300, 20),   # 5+ min = 20 points
                (180, 15),   # 3+ min = 15 points
                (60, 10),    # 1+ min = 10 points
                (30, 5),     # 30+ sec = 5 points
            ]
        },
        "appointment_booked": {
            "weight": 30,
            "value": 30
        },
        "callback_requested": {
            "weight": 15,
            "value": 15
        },
        "questions_asked": {
            "weight": 10,
            "per_question": 2,
            "max": 10
        },
        "pricing_discussed": {
            "weight": 15,
            "value": 15
        },
        "urgency_expressed": {
            "weight": 10,
            "value": 10
        }
    }

    @classmethod
    def score_lead(cls, call_data: Dict) -> Dict:
        """Score a lead based on call data"""
        score = 0
        breakdown = {}

        # Duration score
        duration = call_data.get("duration", 0)
        duration_score = 0
        for threshold, points in cls.SCORING_RULES["call_duration"]["thresholds"]:
            if duration >= threshold:
                duration_score = points
                break
        score += duration_score
        breakdown["call_duration"] = duration_score

        # Appointment booked
        if call_data.get("appointment_booked"):
            points = cls.SCORING_RULES["appointment_booked"]["value"]
            score += points
            breakdown["appointment_booked"] = points

        # Callback requested
        if call_data.get("callback_requested"):
            points = cls.SCORING_RULES["callback_requested"]["value"]
            score += points
            breakdown["callback_requested"] = points

        # Analyze transcript for signals
        transcript = call_data.get("transcript", "").lower()

        # Pricing discussed
        pricing_keywords = ["price", "cost", "how much", "fee", "rate", "quote"]
        if any(kw in transcript for kw in pricing_keywords):
            points = cls.SCORING_RULES["pricing_discussed"]["value"]
            score += points
            breakdown["pricing_discussed"] = points

        # Urgency signals
        urgency_keywords = ["urgent", "asap", "emergency", "today", "right away", "immediately"]
        if any(kw in transcript for kw in urgency_keywords):
            points = cls.SCORING_RULES["urgency_expressed"]["value"]
            score += points
            breakdown["urgency_expressed"] = points

        # Determine grade
        if score >= 80:
            grade = "A"
            label = "Hot Lead"
        elif score >= 60:
            grade = "B"
            label = "Warm Lead"
        elif score >= 40:
            grade = "C"
            label = "Interested"
        elif score >= 20:
            grade = "D"
            label = "Cool Lead"
        else:
            grade = "F"
            label = "Cold Lead"

        return {
            "score": min(score, 100),
            "grade": grade,
            "label": label,
            "breakdown": breakdown,
            "priority": "high" if grade in ["A", "B"] else "medium" if grade == "C" else "low"
        }


class DashboardMetrics:
    """Generate dashboard-ready metrics"""

    @staticmethod
    def generate_overview(
        calls: List[Dict],
        appointments: List[Dict],
        time_range: TimeRange = TimeRange.LAST_30_DAYS
    ) -> Dict:
        """Generate overview metrics for dashboard"""

        call_metrics = CallAnalytics.calculate_metrics(calls)

        # Appointment metrics
        total_appointments = len(appointments)
        pending = sum(1 for a in appointments if a.get("status") == "pending")
        confirmed = sum(1 for a in appointments if a.get("status") == "confirmed")
        completed = sum(1 for a in appointments if a.get("status") == "completed")
        cancelled = sum(1 for a in appointments if a.get("status") == "cancelled")

        return {
            "calls": {
                "total": call_metrics["total_calls"],
                "answered": call_metrics["answered_calls"],
                "missed": call_metrics["missed_calls"],
                "answer_rate": call_metrics["answer_rate"],
                "avg_duration": call_metrics["avg_call_duration_seconds"]
            },
            "appointments": {
                "total": total_appointments,
                "pending": pending,
                "confirmed": confirmed,
                "completed": completed,
                "cancelled": cancelled,
                "show_rate": round((completed / (completed + cancelled) * 100) if (completed + cancelled) > 0 else 0, 2)
            },
            "conversion": {
                "call_to_appointment": call_metrics["conversion_rate"],
                "appointments_per_day": round(total_appointments / 30, 2) if time_range == TimeRange.LAST_30_DAYS else total_appointments
            },
            "time_range": time_range.value
        }

    @staticmethod
    def generate_chart_data(calls: List[Dict], days: int = 30) -> Dict:
        """Generate data for charts"""

        # Daily call counts
        daily_calls = defaultdict(int)
        daily_appointments = defaultdict(int)
        daily_duration = defaultdict(int)

        for call in calls:
            if call.get("created_at"):
                date_key = call["created_at"].strftime("%Y-%m-%d") if isinstance(call["created_at"], datetime) else str(call["created_at"])[:10]
                daily_calls[date_key] += 1
                daily_duration[date_key] += call.get("duration", 0)
                if call.get("appointment_booked"):
                    daily_appointments[date_key] += 1

        # Sort by date
        dates = sorted(daily_calls.keys())

        return {
            "labels": dates,
            "datasets": {
                "calls": [daily_calls[d] for d in dates],
                "appointments": [daily_appointments[d] for d in dates],
                "duration_minutes": [round(daily_duration[d] / 60, 2) for d in dates]
            },
            "hourly_distribution": CallAnalytics.calculate_hourly_distribution(calls),
            "daily_distribution": CallAnalytics.calculate_daily_distribution(calls)
        }

    @staticmethod
    def generate_performance_summary(
        current_metrics: Dict,
        previous_metrics: Dict = None
    ) -> Dict:
        """Generate performance summary with trends"""

        summary = {
            "total_calls": current_metrics.get("total_calls", 0),
            "conversion_rate": current_metrics.get("conversion_rate", 0),
            "appointments_booked": current_metrics.get("appointments_booked", 0),
            "avg_call_duration": current_metrics.get("avg_call_duration_seconds", 0)
        }

        if previous_metrics:
            roi = ROIAnalytics()
            changes = roi.compare_periods(current_metrics, previous_metrics)
            summary["trends"] = {
                "calls_trend": "up" if changes["calls_change"] > 0 else "down" if changes["calls_change"] < 0 else "flat",
                "calls_change_pct": changes["calls_change"],
                "appointments_trend": "up" if changes["appointments_change"] > 0 else "down" if changes["appointments_change"] < 0 else "flat",
                "appointments_change_pct": changes["appointments_change"],
                "conversion_trend": "up" if changes["conversion_rate_change"] > 0 else "down" if changes["conversion_rate_change"] < 0 else "flat",
                "conversion_change_pct": changes["conversion_rate_change"]
            }

        return summary


# Export functions for easy use
def get_analytics_dashboard(calls: List[Dict], appointments: List[Dict], time_range: str = "last_30_days") -> Dict:
    """Get complete analytics dashboard data"""
    tr = TimeRange(time_range)
    start_date, end_date = get_date_range(tr)

    # Filter data by date range
    filtered_calls = [c for c in calls if c.get("created_at") and start_date <= c["created_at"] <= end_date] if calls else []
    filtered_appointments = [a for a in appointments if a.get("created_at") and start_date <= a["created_at"] <= end_date] if appointments else []

    overview = DashboardMetrics.generate_overview(filtered_calls, filtered_appointments, tr)
    charts = DashboardMetrics.generate_chart_data(filtered_calls)
    roi = ROIAnalytics().calculate_roi(filtered_calls, filtered_appointments)

    return {
        "overview": overview,
        "charts": charts,
        "roi": roi,
        "time_range": {
            "label": time_range,
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        }
    }
