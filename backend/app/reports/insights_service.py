"""Insights service for advanced reports with comparisons and recommendations."""

from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.movements.movement_model import Movement, MovementType
from app.products.product_model import Product


class InsightsService:
    """Service for advanced reporting insights."""

    @staticmethod
    def get_profitability_report(db: Session, organization_id: int) -> dict:
        """
        Get profitability report showing margin and profit per product.
        
        Returns:
            {
                "products": [
                    {
                        "name": "Product A",
                        "margin_percent": 35.5,
                        "profit_per_unit": 5.50,
                        "total_profit_potential": 275.00,
                        "quantity": 50
                    },
                    ...
                ]
            }
        """
        products = db.scalars(
            select(Product).where(
                Product.organization_id == organization_id,
                Product.price > 0
            )
        ).all()
        
        report = []
        for p in products:
            margin = ((p.price - p.cost_price) / p.price) * 100 if p.price > 0 else 0
            profit_per_unit = p.price - p.cost_price
            total_profit = profit_per_unit * p.quantity
            
            report.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "margin_percent": round(float(margin), 2),
                "profit_per_unit": float(profit_per_unit),
                "total_profit_potential": float(total_profit),
                "quantity": p.quantity,
                "price": float(p.price),
                "cost_price": float(p.cost_price)
            })
        
        # Sort by profit potential (highest first)
        report.sort(key=lambda x: x["total_profit_potential"], reverse=True)
        
        return {"products": report}

    @staticmethod
    def compare_periods(db: Session, organization_id: int, days: int = 30) -> dict:
        """
        Compare current period with previous period.
        
        Args:
            days: Period length in days
        
        Returns:
            {
                "current": {"movements": 150, "quantity": 500},
                "previous": {"movements": 130, "quantity": 420},
                "change_percent": 15.38,
                "trend": "up"  # "up", "down", or "stable"
            }
        """
        now = datetime.utcnow()
        current_start = now - timedelta(days=days)
        previous_start = current_start - timedelta(days=days)
        
        # Current period
        current_movements = db.scalars(
            select(Movement).where(
                Movement.organization_id == organization_id,
                Movement.type == MovementType.SAIDA,
                Movement.created_at >= current_start
            )
        ).all()
        
        # Previous period  
        previous_movements = db.scalars(
            select(Movement).where(
                Movement.organization_id == organization_id,
                Movement.type == MovementType.SAIDA,
                Movement.created_at >= previous_start,
                Movement.created_at < current_start
            )
        ).all()
        
        current_count = len(current_movements)
        current_qty = sum(m.quantity for m in current_movements)
        
        previous_count = len(previous_movements)
        previous_qty = sum(m.quantity for m in previous_movements)
        
        # Calculate change percentage
        if previous_qty > 0:
            change_percent = ((current_qty - previous_qty) / previous_qty) * 100
        else:
            change_percent = 100.0 if current_qty > 0 else 0.0
        
        # Determine trend
        if abs(change_percent) < 5:
            trend = "stable"
        elif change_percent > 0:
            trend = "up"
        else:
            trend = "down"
        
        return {
            "current": {
                "movements": current_count,
                "quantity": current_qty
            },
            "previous": {
                "movements": previous_count,
                "quantity": previous_qty
            },
            "change_percent": round(change_percent, 2),
            "trend": trend
        }

    @staticmethod
    def get_recommendations(db: Session, organization_id: int) -> dict:
        """
        Generate automatic recommendations based on data analysis.
        
        Returns:
            {
                "recommendations": [
                    {
                        "type": "warning",  # "warning", "info", "success"
                        "title": "Low Stock Alert",
                        "message": "5 products are out of stock",
                        "action": "restock"
                    },
                    ...
                ]
            }
        """
        recommendations = []
        
        # Check for products out of stock
        out_of_stock_count = db.scalar(
            select(func.count(Product.id)).where(
                Product.organization_id == organization_id,
                Product.quantity == 0
            )
        ) or 0
        
        if out_of_stock_count > 0:
            recommendations.append({
                "type": "warning",
                "title": "Produtos em Falta",
                "message": f"{out_of_stock_count} produto(s) com estoque zerado",
                "action": "restock",
                "priority": "high"
            })
        
        # Check for low margin products (<10%)
        low_margin_products = db.scalars(
            select(Product).where(
                Product.organization_id == organization_id,
                Product.price > 0,
                ((Product.price - Product.cost_price) / Product.price) < 0.10
            )
        ).all()
        
        if low_margin_products:
            recommendations.append({
                "type": "info",
                "title": "Margem Baixa",
                "message": f"{len(low_margin_products)} produto(s) com margem abaixo de 10%",
                "action": "review_pricing",
                "priority": "medium"
            })
        
        # Check for low stock products
        low_stock_count = db.scalar(
            select(func.count(Product.id)).where(
                Product.organization_id == organization_id,
                Product.quantity > 0,
                Product.quantity <= Product.alert_level
            )
        ) or 0
        
        if low_stock_count > 0:
            recommendations.append({
                "type": "warning",
                "title": "Estoque Baixo",
                "message": f"{low_stock_count} produto(s) abaixo do nível de alerta",
                "action": "reorder",
                "priority": "high"
            })
        
        return {"recommendations": recommendations}
