"""Application constants and configuration values."""

# Pagination
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100

# ABC Analysis Thresholds (Percentage)
ABC_CLASS_A_THRESHOLD = 80.0
ABC_CLASS_B_THRESHOLD = 95.0
# Class C is everything else

# XYZ Analysis Thresholds (Coefficient of Variation)
XYZ_CLASS_X_THRESHOLD = 0.5
XYZ_CLASS_Y_THRESHOLD = 1.0
# Class Z is everything else

# Report Default Periods (Days)
REPORT_DEFAULT_DAYS_ABC = 90
REPORT_DEFAULT_WEEKS_XYZ = 12
REPORT_DEFAULT_DAYS_TURNOVER = 30
REPORT_DEFAULT_DAYS_FORECAST = 30
