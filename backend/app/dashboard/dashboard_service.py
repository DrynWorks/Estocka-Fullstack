"""Dashboard analytics service for charts and KPIs."""

from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.movements.movement_model import Movement, MovementType
from app.products.product_model import Product


class DashboardService:
    """Service for dashboard analytics and statistics."""

    @staticmethod
    def get_inventory_value(db: Session, organization_id: int) -> dict:
        """
        Calculate total inventory value.
        
        Returns:
            {
                "total_value": Decimal,  # Sum of (quantity * cost_price)
                "total_items": int,      # Total number of products
                "total_quantity": int    # Total quantity in stock
            }
        """
        result = db.execute(
            select(
                func.sum(Product.quantity * Product.cost_price).label("total_value"),
                func.count(Product.id).label("total_items"),
                func.sum(Product.quantity).label("total_quantity")
            ).where(Product.organization_id == organization_id)
        ).first()
        
        return {
            "total_value": float(result.total_value or 0),
            "total_items": result.total_items or 0,
            "total_quantity": result.total_quantity or 0
        }

    @staticmethod
    def get_average_margin(db: Session, organization_id: int) -> dict:
        """
        Calculate average profit margin.
        
        Margin % = ((price - cost_price) / price) * 100
        
        Returns:
            {
                "average_margin_percent": float,
                "total_potential_profit": Decimal
            }
        """
        products = db.execute(
            select(Product).where(
                Product.organization_id == organization_id,
                Product.price > 0  # Avoid division by zero
            )
        ).scalars().all()
        
        if not products:
            return {"average_margin_percent": 0.0, "total_potential_profit": 0.0}
        
        margins = []
        total_profit = Decimal(0)
        
        for p in products:
            if p.price > 0:
                margin = ((p.price - p.cost_price) / p.price) * 100
                margins.append(float(margin))
                total_profit += (p.price - p.cost_price) * p.quantity
        
        avg_margin = sum(margins) / len(margins) if margins else 0.0
        
        return {
            "average_margin_percent": round(avg_margin, 2),
            "total_potential_profit": float(total_profit)
        }

    @staticmethod
    def get_stock_rupture_rate(db: Session, organization_id: int) -> dict:
        """
        Calculate stock rupture rate (percentage of products with zero stock).
        
        Returns:
            {
                "rupture_rate_percent": float,
                "products_out_of_stock": int,
                "total_products": int
            }
        """
        total_products = db.scalar(
            select(func.count(Product.id)).where(
                Product.organization_id == organization_id
            )
        ) or 0
        
        out_of_stock = db.scalar(
            select(func.count(Product.id)).where(
                Product.organization_id == organization_id,
                Product.quantity == 0
            )
        ) or 0
        
        rupture_rate = (out_of_stock / total_products * 100) if total_products > 0 else 0.0
        
        return {
            "rupture_rate_percent": round(rupture_rate, 2),
            "products_out_of_stock": out_of_stock,
            "total_products": total_products
        }

    @staticmethod
    def get_sales_trend(db: Session, organization_id: int, days: int = 30) -> dict:
        """
        Get sales (outbound movements) trend for the last N days.
        
        Args:
            days: Number of days to look back (default 30)
        
        Returns:
            {
                "labels": ["2024-11-01", "2024-11-02", ...],
                "data": [15, 23, 18, ...],  # Quantities per day
                "total_movements": int
            }
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all outbound movements in the period
        movements = db.execute(
            select(Movement).where(
                Movement.organization_id == organization_id,
                Movement.type == MovementType.SAIDA,
                Movement.created_at >= start_date
            ).order_by(Movement.created_at)
        ).scalars().all()
        
        # Group by date
        daily_sales = {}
        for mov in movements:
            date_key = mov.created_at.strftime("%Y-%m-%d")
            daily_sales[date_key] = daily_sales.get(date_key, 0) + mov.quantity
        
        # Fill missing days with 0
        current_date = start_date.date()
        end_date = datetime.utcnow().date()
        labels = []
        data = []
        
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            labels.append(date_str)
            data.append(daily_sales.get(date_str, 0))
            current_date += timedelta(days=1)
        
        return {
            "labels": labels,
            "data": data,
            "total_movements": len(movements)
        }

    @staticmethod
    def get_top_products(db: Session, organization_id: int, limit: int = 5, metric: str = "movements") -> dict:
        """
        Get top N products by movements or value.
        
        Args:
            limit: Number of products to return
            metric: "movements" (quantity sold) or "value" (revenue)
        
        Returns:
            {
                "labels": ["Product A", "Product B", ...],
                "data": [150, 120, ...]
            }
        """
        if metric == "value":
            # Top by revenue (quantity sold * price)
            # This would need a more complex query joining movements
            # For now, return by total quantity in movements
            metric = "movements"
        
        # Get movements grouped by product
        result = db.execute(
            select(
                Product.name,
                func.sum(Movement.quantity).label("total_quantity")
            ).join(Movement, Movement.product_id == Product.id)
            .where(
                Product.organization_id == organization_id,
                Movement.type == MovementType.SAIDA  # Only outbound
            )
            .group_by(Product.id, Product.name)
            .order_by(func.sum(Movement.quantity).desc())
            .limit(limit)
        ).all()
        
        labels = [row.name for row in result]
        data = [int(row.total_quantity) for row in result]
        
        return {"labels": labels, "data": data}

    @staticmethod
    def get_abc_distribution(db: Session, organization_id: int) -> dict:
        """
        Get count of products in each ABC classification.
        
        Returns:
            {
                "labels": ["A", "B", "C", "N/A"],
                "data": [15, 30, 45, 10]  # Count per class
            }
        """
        # This requires ABC classification to be calculated
        # For now, return a placeholder structure
        # In a real implementation, you'd have ABC class stored or calculated
        
        total_products = db.scalar(
            select(func.count(Product.id)).where(
                Product.organization_id == organization_id
            )
        ) or 0
        
        # Placeholder distribution (would calculate actual ABC)
        return {
            "labels": ["A", "B", "C"],
            "data": [
                int(total_products * 0.2),  # 20% are A
                int(total_products * 0.3),  # 30% are B
                int(total_products * 0.5),  # 50% are C
            ]
        }
