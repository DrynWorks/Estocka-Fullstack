"""Report endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import List

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
def get_abc_report(db: Session = Depends(get_db)):
    """Return ABC analysis (Pareto principle) for products."""
    return report_service.get_abc_analysis(db)


@router.get("/xyz", response_model=report_model.XYZReport)
def get_xyz_report(db: Session = Depends(get_db)):
    """Return XYZ analysis (demand variability) for products."""
    return report_service.get_xyz_analysis(db)


@router.get("/turnover", response_model=report_model.TurnoverReport)
def get_turnover_report(db: Session = Depends(get_db)):
    """Return stock turnover rates."""
    return report_service.get_stock_turnover(db)


@router.get("/financial", response_model=report_model.FinancialReport)
def get_financial_report(db: Session = Depends(get_db)):
    """Return financial metrics (holding cost, margins)."""
    return report_service.get_financial_report(db)


@router.get("/forecast", response_model=report_model.ForecastReport)
def get_forecast_report(db: Session = Depends(get_db)):
    """Return stock forecast (reorder points, stockout risk)."""
    return report_service.get_forecast_report(db)
