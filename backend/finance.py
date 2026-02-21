def calculate_analysis(profile, bnpl_records):
    salary = profile.get("salary", 0)
    emi_total = sum([r["amount"] for r in bnpl_records])

    debt_ratio = emi_total / salary if salary else 0

    if debt_ratio < 0.2:
        risk = "Low"
    elif debt_ratio < 0.4:
        risk = "Medium"
    else:
        risk = "High"

    safe_limit = (0.3 * salary) - emi_total

    return {
        "debt_ratio": debt_ratio,
        "risk": risk,
        "safe_limit": safe_limit
    }
