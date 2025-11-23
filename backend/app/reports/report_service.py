"""Services responsible for building API reports."""

from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Iterable, List
import statistics

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.categories import category_service
from app.movements import movement_model, movement_service
from app.products import product_repository, product_service
from app.products.product_model import Product
from app.movements.movement_model import Movement, MovementType
from . import report_model


def _to_product_summary(products: Iterable) -> List[report_model.ProductSummary]:
    """Convert Product ORM instances into summary schemas."""
    return [report_model.ProductSummary.model_validate(product) for product in products]


def get_stock_overview(db: Session) -> report_model.StockOverview:
    """Return consolidated stock metrics."""
    products = product_service.list_products(db)
    total_products = len(products)
    total_value = sum(
        (product.quantity or 0) * Decimal(product.price or 0) for product in products
    )

    low_stock = [product for product in products if product.quantity <= product.alert_level]
    out_of_stock = [product for product in products if product.quantity == 0]

    return report_model.StockOverview(
        total_products=total_products,
        total_stock_value=float(total_value),
        low_stock_products=_to_product_summary(low_stock),
        out_of_stock_products=_to_product_summary(out_of_stock),
    )


def get_category_breakdown(db: Session) -> List[report_model.CategoryReportItem]:
    """Return quantity and value totals grouped by category."""
    categories = category_service.list_categories(db)
    aggregated = product_repository.get_products_by_category(db)
    totals_map = {
        row.category_id: {
            "total_quantity": int(row.total_quantity or 0),
            "total_value": float(row.total_value or 0),
        }
        for row in aggregated
    }

    report_items: List[report_model.CategoryReportItem] = []
    for category in categories:
        totals = totals_map.get(category.id, {"total_quantity": 0, "total_value": 0.0})
        report_items.append(
            report_model.CategoryReportItem(
                category=category,
                total_quantity=totals["total_quantity"],
                total_value=totals["total_value"],
            )
        )
    return report_items


def get_alerts_report(db: Session) -> report_model.AlertsReport:
    """Return the list of critical products."""
    low_stock_products = product_service.get_low_stock_products(db)
    return report_model.AlertsReport(critical_products=_to_product_summary(low_stock_products))


def get_movement_history(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    *,
    limit: int = 100,
    offset: int = 0,
) -> report_model.MovementReport:
    """Return movement history constrained by the requested time window."""
    filters = movement_model.MovementFilter(start_date=start_date, end_date=end_date)
    movements = movement_service.filter_movements(
        db,
        filters,
        limit=limit,
        offset=offset,
    )
    return report_model.MovementReport(
        filters=report_model.MovementReportFilters(start_date=start_date, end_date=end_date),
        movements=[movement_model.MovementPublic.model_validate(movement) for movement in movements],
    )


def get_abc_analysis(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> report_model.ABCReport:
    """
    Perform ABC Analysis based on consumption value (quantity consumed * price).
    A: Top 80% of value
    B: Next 15% of value
    C: Bottom 5% of value
    """
    # Default to last 90 days if not provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=90)
    
    query = select(
        Movement.product_id,
        func.sum(Movement.quantity).label("total_qty")
    ).where(
        Movement.type == MovementType.SAIDA,
        Movement.created_at >= start_date
    )

    if end_date:
        query = query.where(Movement.created_at <= end_date)

    results = db.execute(
        query.group_by(Movement.product_id)
    ).all()

    product_consumption = {r.product_id: r.total_qty for r in results}
    products = product_service.list_products(db)
    
    abc_items = []
    total_value_all = 0.0

    for product in products:
        qty = product_consumption.get(product.id, 0)
        value = float(qty * product.price)
        total_value_all += value
        abc_items.append({
            "product": product,
            "value": value
        })

    # Sort by value descending
    abc_items.sort(key=lambda x: x["value"], reverse=True)

    accumulated_value = 0.0
    report_items = []

    for item in abc_items:
        value = item["value"]
        accumulated_value += value
        percentage = (value / total_value_all * 100) if total_value_all > 0 else 0
        cumulative_percentage = (accumulated_value / total_value_all * 100) if total_value_all > 0 else 0

        if cumulative_percentage <= 80:
            classification = "A"
        elif cumulative_percentage <= 95:
            classification = "B"
        else:
            classification = "C"

        report_items.append(report_model.ABCItem(
            product_id=item["product"].id,
            product_name=item["product"].name,
            value=value,
            percentage=percentage,
            cumulative_percentage=cumulative_percentage,
            classification=classification
        ))

    return report_model.ABCReport(items=report_items)


def get_xyz_analysis(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> report_model.XYZReport:
    """
    Perform XYZ Analysis based on demand variability (Coefficient of Variation).
    X: Very stable (CV <= 0.5)
    Y: Moderately stable (0.5 < CV <= 1.0)
    Z: Volatile (CV > 1.0)
    """
    # Default to last 12 weeks if not provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(weeks=12)
    
    query = select(Movement).where(
        Movement.type == MovementType.SAIDA,
        Movement.created_at >= start_date
    )

    if end_date:
        query = query.where(Movement.created_at <= end_date)

    movements = db.execute(query).scalars().all()

    # Group by product and week
    product_weekly_demand = {}
    for m in movements:
        week_key = m.created_at.strftime("%Y-%U")
        if m.product_id not in product_weekly_demand:
            product_weekly_demand[m.product_id] = {}
        product_weekly_demand[m.product_id][week_key] = product_weekly_demand[m.product_id].get(week_key, 0) + m.quantity

    products = product_service.list_products(db)
    report_items = []

    for product in products:
        demands = list(product_weekly_demand.get(product.id, {}).values())
        # Fill missing weeks with 0
        demands += [0] * (weeks_to_analyze - len(demands))
        
        if not demands or sum(demands) == 0:
            cv = 0.0
            classification = "Z" # No demand is considered volatile/unpredictable or dead stock
        else:
            mean = statistics.mean(demands)
            stdev = statistics.stdev(demands) if len(demands) > 1 else 0
            cv = stdev / mean if mean > 0 else 0
            
            if cv <= 0.5:
                classification = "X"
            elif cv <= 1.0:
                classification = "Y"
            else:
                classification = "Z"

        report_items.append(report_model.XYZItem(
            product_id=product.id,
            product_name=product.name,
            cv=cv,
            classification=classification
        ))

    return report_model.XYZReport(items=report_items)


def get_stock_turnover(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> report_model.TurnoverReport:
    """
    Calculate Stock Turnover Rate.
    Turnover = Cost of Goods Sold / Average Inventory
    """
    # Default to last 30 days
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    
    query = select(
        Movement.product_id,
        func.sum(Movement.quantity).label("total_sold")
    ).where(
        Movement.type == MovementType.SAIDA,
        Movement.created_at >= start_date
    )

    if end_date:
        query = query.where(Movement.created_at <= end_date)

    sales_results = db.execute(
        query.group_by(Movement.product_id)
    ).all()
    sales_map = {r.product_id: r.total_sold for r in sales_results}

    products = product_service.list_products(db)
    report_items = []

    for product in products:
        total_sold = sales_map.get(product.id, 0)
        # Simplified average inventory: current quantity (ideal would be average over time)
        avg_inventory = float(product.quantity) 
        
        if avg_inventory > 0:
            turnover_rate = total_sold / avg_inventory
        else:
            turnover_rate = 0.0 # Avoid division by zero

        report_items.append(report_model.TurnoverItem(
            product_id=product.id,
            product_name=product.name,
            turnover_rate=turnover_rate,
            avg_inventory=avg_inventory,
            total_sales=total_sold
        ))

    return report_model.TurnoverReport(items=report_items)


def get_financial_report(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> report_model.FinancialReport:
    """Calculate financial metrics: Holding Cost, Potential Profit, Margins."""
    products = product_service.list_products(db)
    
    total_inventory_value = 0.0
    total_cost_value = 0.0
    
    for product in products:
        qty = product.quantity
        price = float(product.price)
        cost = float(product.cost_price)
        
        total_inventory_value += qty * price
        total_cost_value += qty * cost

    potential_profit = total_inventory_value - total_cost_value
    average_margin = (potential_profit / total_inventory_value * 100) if total_inventory_value > 0 else 0

    return report_model.FinancialReport(
        total_inventory_value=total_inventory_value,
        total_cost_value=total_cost_value,
        potential_profit=potential_profit,
        average_margin=average_margin
    )


def get_forecast_report(
    db: Session,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> report_model.ForecastReport:
    """
    Predict stockouts and calculate reorder points.
    Reorder Point = (Average Daily Usage * Lead Time) + Safety Stock
    """
    # Default to last 30 days
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    
    # Calculate duration in days for daily usage
    if end_date:
        duration_days = (end_date - start_date).days
    else:
        duration_days = (datetime.utcnow() - start_date).days
    
    if duration_days < 1:
        duration_days = 1

    query = select(
        Movement.product_id,
        func.sum(Movement.quantity).label("total_used")
    ).where(
        Movement.type == MovementType.SAIDA,
        Movement.created_at >= start_date
    )

    if end_date:
        query = query.where(Movement.created_at <= end_date)

    usage_results = db.execute(
        query.group_by(Movement.product_id)
    ).all()
    usage_map = {r.product_id: r.total_used for r in usage_results}

    products = product_service.list_products(db)
    report_items = []

    for product in products:
        total_used = usage_map.get(product.id, 0)
        daily_usage = total_used / duration_days
        
        lead_time = product.lead_time
        # Safety stock simplified: 50% of lead time demand
        safety_stock = (daily_usage * lead_time) * 0.5
        
        reorder_point = int((daily_usage * lead_time) + safety_stock)
        
        if daily_usage > 0:
            days_until_stockout = product.quantity / daily_usage
        else:
            days_until_stockout = 999.0 # Infinite

        if product.quantity == 0:
            status = "CRITICAL"
        elif product.quantity <= reorder_point:
            status = "WARNING"
        else:
            status = "OK"

        report_items.append(report_model.ForecastItem(
            product_id=product.id,
            product_name=product.name,
            daily_usage=daily_usage,
            days_until_stockout=days_until_stockout,
            reorder_point=reorder_point,
            status=status
        ))

    return report_model.ForecastReport(items=report_items)
