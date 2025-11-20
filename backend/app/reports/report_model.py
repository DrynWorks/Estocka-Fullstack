"""Pydantic schemas dedicated to reporting."""

from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict

from app.categories.category_model import CategoryPublic
from app.movements.movement_model import MovementPublic


class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sku: str
    quantity: int
    alert_level: int
    category: CategoryPublic


class StockOverview(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_products: List[ProductSummary]
    out_of_stock_products: List[ProductSummary]


class CategoryReportItem(BaseModel):
    category: CategoryPublic
    total_quantity: int
    total_value: float


class AlertsReport(BaseModel):
    critical_products: List[ProductSummary]


class MovementReportFilters(BaseModel):
    start_date: datetime | None = None
    end_date: datetime | None = None


class MovementReport(BaseModel):
    filters: MovementReportFilters
    movements: List[MovementPublic]


class ABCItem(BaseModel):
    product_id: int
    product_name: str
    value: float
    percentage: float
    cumulative_percentage: float
    classification: str  # A, B, or C


class ABCReport(BaseModel):
    items: List[ABCItem]


class XYZItem(BaseModel):
    product_id: int
    product_name: str
    cv: float  # Coefficient of Variation
    classification: str  # X, Y, or Z


class XYZReport(BaseModel):
    items: List[XYZItem]


class TurnoverItem(BaseModel):
    product_id: int
    product_name: str
    turnover_rate: float
    avg_inventory: float
    total_sales: int


class TurnoverReport(BaseModel):
    items: List[TurnoverItem]


class FinancialReport(BaseModel):
    total_inventory_value: float
    total_cost_value: float
    potential_profit: float
    average_margin: float


class ForecastItem(BaseModel):
    product_id: int
    product_name: str
    daily_usage: float
    days_until_stockout: float
    reorder_point: int
    status: str  # OK, WARNING, CRITICAL


class ForecastReport(BaseModel):
    items: List[ForecastItem]
