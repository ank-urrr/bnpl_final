import re
from datetime import datetime

# Allowed sender domains/keywords for financial emails
ALLOWED_SENDERS = [
    'cred', 'paylater', 'pay-later', 'emi', 'simpl', 'lazypay',
    'amazon', 'flipkart', 'paytm', 'phonepe', 'gpay', 'googlepay',
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'bank',
    'card', 'credit', 'loan', 'statement', 'finance',
    'bajaj', 'zestmoney', 'slice', 'uni', 'jupiter'
]

# Financial keywords that must be present
FINANCIAL_KEYWORDS = [
    'installment', 'instalment', 'emi', 'due date', 'payment due',
    'minimum due', 'total outstanding', 'statement generated',
    'repayment', 'amount due', 'total due', 'bill generated',
    'payment reminder', 'overdue', 'monthly payment'
]

# Keywords to exclude (marketing/promotional)
EXCLUDE_KEYWORDS = [
    'unsubscribe', 'promotional', 'advertisement', 'offer valid',
    'limited time', 'sale', 'discount', 'cashback offer',
    'new arrival', 'trending', 'bestseller', 'deal of the day'
]

def is_valid_financial_email(sender, subject, body):
    """
    Strict validation: Email must be from financial sender OR have strong financial indicators.
    """
    text = f"{sender} {subject} {body}".lower()
    
    # Check if sender is from allowed financial domain
    sender_valid = any(keyword in sender.lower() for keyword in ALLOWED_SENDERS)
    
    # Check if contains financial keywords
    has_financial_keyword = any(keyword in text for keyword in FINANCIAL_KEYWORDS)
    
    # Check for strong financial indicators (amount + due date + payment terms)
    has_amount = bool(re.search(r'(?:rs\.?|₹|inr)\s*\d+', text, re.IGNORECASE))
    has_due_date = bool(re.search(r'due\s*date|payment\s*due|pay\s*before|due\s*on|due\s*by', text, re.IGNORECASE))
    has_payment_term = bool(re.search(r'emi|installment|instalment|pending|outstanding|payable', text, re.IGNORECASE))
    
    # Strong financial indicator: has amount + (due date OR payment term)
    strong_indicator = has_amount and (has_due_date or has_payment_term)
    
    # Accept if: (valid sender AND financial keyword) OR strong indicator
    if (sender_valid and has_financial_keyword) or strong_indicator:
        # Still exclude promotional emails
        is_promotional = any(keyword in text for keyword in EXCLUDE_KEYWORDS)
        if is_promotional:
            return False
        return True
    
    return False

def parse_bnpl_email(sender, subject, body):
    """
    Extract BNPL data with strict structured parsing.
    Returns dict with: vendor, amount, installments, due_date
    """
    text = f"{subject} {body}"
    
    # Extract vendor from sender email
    vendor = extract_vendor_from_sender(sender, subject)
    
    # Extract amount with priority
    amount = extract_amount_with_priority(text)
    
    # Extract installments
    installments = extract_installments(text)
    
    # Extract due date
    due_date = extract_due_date(text)
    
    return {
        "vendor": vendor,
        "amount": amount,
        "installments": installments,
        "due_date": due_date
    }

def extract_vendor_from_sender(sender, subject):
    """
    Extract vendor name from sender email or subject.
    """
    # Try to extract from sender email
    sender_lower = sender.lower()
    
    # Check known vendors
    vendor_map = {
        'amazon': 'Amazon',
        'flipkart': 'Flipkart',
        'paytm': 'Paytm',
        'cred': 'CRED',
        'simpl': 'Simpl',
        'lazypay': 'LazyPay',
        'phonepe': 'PhonePe',
        'gpay': 'Google Pay',
        'hdfc': 'HDFC Bank',
        'icici': 'ICICI Bank',
        'sbi': 'SBI',
        'axis': 'Axis Bank',
        'kotak': 'Kotak Bank',
        'bajaj': 'Bajaj Finserv',
        'zest': 'ZestMoney',
        'slice': 'Slice',
        'uni': 'Uni Card'
    }
    
    for key, name in vendor_map.items():
        if key in sender_lower:
            return name
    
    # Try to extract from email domain
    if '@' in sender:
        domain = sender.split('@')[1].split('.')[0]
        return domain.capitalize()
    
    return "Unknown"

def extract_amount_with_priority(text):
    """
    Extract amount with priority for financial terms.
    """
    text_lower = text.lower()
    
    # Priority patterns with context
    priority_patterns = [
        (r'(?:total due|amount due|minimum due|outstanding|pending)[:\s]*(?:rs\.?|₹|inr)?\s*[\d,]+(?:\.\d{2})?', 'high'),
        (r'(?:pay|payment|payable)[:\s]*(?:rs\.?|₹|inr)?\s*[\d,]+(?:\.\d{2})?', 'medium'),
        (r'(?:rs\.?|₹|inr)\s*[\d,]+(?:\.\d{2})?', 'low'),
        (r'\d+(?:,\d+)*(?:\.\d{2})?\s*(?:rupees|rs)', 'low')
    ]
    
    amounts = []
    
    for pattern, priority in priority_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            matched_str = match.group()
            # Extract just the digits, commas, and optional decimal
            number_match = re.search(r'[\d,]+(?:\.\d{2})?', matched_str)
            if number_match:
                amount_str = number_match.group().replace(',', '')
                try:
                    amount = float(amount_str)
                    if amount > 0 and amount < 10000000:  # Reasonable range
                        amounts.append((amount, priority))
                except:
                    continue
    
    # Return highest priority amount
    if amounts:
        # Sort by priority: high > medium > low, then by amount
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        amounts.sort(key=lambda x: (priority_order[x[1]], -x[0]))
        return amounts[0][0]
    
    return None

def extract_installments(text):
    """
    Extract number of installments/EMIs.
    """
    patterns = [
        r'(\d+)\s*(?:emi|emis)',
        r'(\d+)\s*(?:installment|instalment)s?',
        r'(\d+)\s*(?:month|months)\s*(?:emi|installment)',
        r'(?:emi|installment)[\s:]*(\d+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                count = int(match.group(1))
                if 1 <= count <= 60:  # Reasonable range
                    return count
            except:
                continue
    
    return None

def extract_due_date(text):
    """
    Extract due date with multiple format support.
    """
    # Pattern 1: DD/MM/YYYY or DD-MM-YYYY
    pattern1 = r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})'
    match = re.search(pattern1, text)
    if match:
        try:
            day, month, year = match.groups()
            date_str = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
            # Validate date
            datetime.strptime(date_str, '%d/%m/%Y')
            return date_str
        except:
            pass
    
    # Pattern 2: YYYY-MM-DD
    pattern2 = r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})'
    match = re.search(pattern2, text)
    if match:
        try:
            year, month, day = match.groups()
            date_str = f"{day.zfill(2)}/{month.zfill(2)}/{year}"
            datetime.strptime(date_str, '%d/%m/%Y')
            return date_str
        except:
            pass
    
    # Pattern 3: "Due on 15 March 2026" or "15 March 2026" or "pay before 15 March"
    months = {
        'january': '01', 'jan': '01',
        'february': '02', 'feb': '02',
        'march': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'may': '05',
        'june': '06', 'jun': '06',
        'july': '07', 'jul': '07',
        'august': '08', 'aug': '08',
        'september': '09', 'sep': '09', 'sept': '09',
        'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12'
    }
    
    pattern3 = r'(\d{1,2})\s+(' + '|'.join(months.keys()) + r')(?:\s+(\d{4}))?'
    match = re.search(pattern3, text, re.IGNORECASE)
    if match:
        try:
            day = match.group(1)
            month_name = match.group(2)
            year = match.group(3) if match.group(3) else str(datetime.now().year)
            month = months[month_name.lower()]
            date_str = f"{day.zfill(2)}/{month}/{year}"
            datetime.strptime(date_str, '%d/%m/%Y')
            return date_str
        except:
            pass
    
    # Pattern 4: Just look for "due date" or "pay before" followed by any date-like pattern
    # This handles cases like "pay before this due date" where date might be implied
    if re.search(r'due\s*date|pay\s*before|due\s*on|due\s*by', text, re.IGNORECASE):
        # If we found due date keywords but no actual date, return a placeholder
        # This indicates there's a due date mentioned but not parseable
        return "Due date mentioned"
    
    return None

def is_bnpl_email(sender, subject, body):
    """
    Check if email is a valid BNPL/financial email.
    """
    return is_valid_financial_email(sender, subject, body)