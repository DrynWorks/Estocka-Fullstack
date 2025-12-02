"""Dashboard API endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.auth_service import get_current_user
from app.database import get_db
from app.organizations.organization_helpers import get_organization_id
from app.users.user_model import User
from .dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
def get_dashboard_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    org_id: Annotated[int, Depends(get_organization_id)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get dashboard overview with main KPIs.
    
    Returns all key metrics in a single call for dashboard page.
    """
    inventory_value = DashboardService.get_inventory_value(db, org_id)
    margin = DashboardService.get_average_margin(db, org_id)
    rupture = DashboardService.get_stock_rupture_rate(db, org_id)
    
    return {
        "inventory": inventory_value,
        "profitability": margin,
        "stock_health": rupture
    }


@router.get("/sales-trend")
def get_sales_trend(
    current_user: Annotated[User, Depends(get_current_user)],
    org_id: Annotated[int, Depends(get_organization_id)],
    db: Annotated[Session, Depends(get_db)],
    days: int = Query(30, ge=7, le=365, description="Number of days")
):
    """
    Get sales trend (outbound movements) for chart.
    
    Query params:
        days: Number of days to look back (default 30, max 365)
    
    Returns:
        {
            "labels": ["2024-11-01", ...],
            "data": [15, 23, ...],
            "total_movements": 150
        }
    """
    return DashboardService.get_sales_trend(db, org_id, days)


@router.get("/top-products")
def get_top_products(
    current_user: Annotated[User, Depends(get_current_user)],
    org_id: Annotated[int, Depends(get_organization_id)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(5, ge=1, le=20, description="Number of products"),
    metric: str = Query("movements", regex="^(movements|value)$")
):
    """
    Get top N products by movements or value.
    
    Query params:
        limit: Number of products (default 5, max 20)
        metric: "movements" or "value"
    
    Returns:
        {
            "products": [
                {"name": "Product A", "value": 150},
                ...
            ]
        }
    """
    return DashboardService.get_top_products(db, org_id, limit, metric)


@router.get("/abc-distribution")
def get_abc_distribution(
    current_user: Annotated[User, Depends(get_current_user)],
    org_id: Annotated[int, Depends(get_organization_id)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Get ABC classification distribution for pie/donut chart.
    
    Returns:
        {
            "A": 15,
            "B": 30,
            "C": 45
        }
    """
    return DashboardService.get_abc_distribution(db, org_id)
