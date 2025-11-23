"""Report endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user, require_role
from app.database import get_db
from . import report_model, report_service

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_user), Depends(require_role("admin"))],
)



def get_date_range(
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> tuple[datetime, datetime]:
    """
    Return date range based on period or custom dates.
    period: '7d', '30d', '90d', '365d' (days)
    start_date/end_date: 'YYYY-MM-DD'
    """
    now = datetime.now()
    
    if period:
        days_map = {'7d': 7, '30d': 30, '90d': 90, '365d': 365}
        days = days_map.get(period, 30)
        start = now - timedelta(days=days)
        end = now
    elif start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            # Adjust end date to end of day if it's just a date
            if end.hour == 0 and end.minute == 0:
                end = end.replace(hour=23, minute=59, second=59)
        except ValueError:
            # Fallback to default if parsing fails
            start = now - timedelta(days=30)
            end = now
    else:
        # Default: last 30 days
        start = now - timedelta(days=30)
        end = now
    
    return start, end

@router.get("/overview", response_model=report_model.StockOverview)
def get_overview_report(db: Session = Depends(get_db)):
    """Return the stock overview report."""
    return report_service.get_stock_overview(db)


@router.get("/categories", response_model=List[report_model.CategoryReportItem])
def get_category_report(db: Session = Depends(get_db)):
    """Return totals grouped by category."""
    return report_service.get_category_breakdown(db)


@router.get("/alerts", response_model=report_model.AlertsReport)
def get_alerts_report(db: Session = Depends(get_db)):
    """Return critical stock alerts."""
    return report_service.get_alerts_report(db)


@router.get("/movements", response_model=report_model.MovementReport)
def get_movement_report(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500, description="Number of records to return"),
    offset: int = Query(default=0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db),
):
    """Return movement history within the requested window."""
    return report_service.get_movement_history(
        db,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


@router.get("/abc", response_model=report_model.ABCReport)
def get_abc_report(
    period: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """Return ABC analysis (Pareto principle) for products."""
    start, end = get_date_range(period, start_date, end_date)
    return report_service.get_abc_analysis(db, start_date=start, end_date=end)


@router.get("/xyz", response_model=report_model.XYZReport)
def get_xyz_report(
    period: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """Return XYZ analysis (demand variability) for products."""
    start, end = get_date_range(period, start_date, end_date)
    return report_service.get_xyz_analysis(db, start_date=start, end_date=end)


@router.get("/turnover", response_model=report_model.TurnoverReport)
def get_turnover_report(
    period: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """Return stock turnover rates."""
    start, end = get_date_range(period, start_date, end_date)
    return report_service.get_stock_turnover(db, start_date=start, end_date=end)


@router.get("/financial", response_model=report_model.FinancialReport)
def get_financial_report(
    period: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """Return financial metrics (holding cost, margins)."""
    start, end = get_date_range(period, start_date, end_date)
    return report_service.get_financial_report(db, start_date=start, end_date=end)


@router.get("/forecast", response_model=report_model.ForecastReport)
def get_forecast_report(
    period: str | None = Query(default=None),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    """Return stock forecast (reorder points, stockout risk)."""
    start, end = get_date_range(period, start_date, end_date)
    return report_service.get_forecast_report(db, start_date=start, end_date=end)
