import re

def parsel_bnpl_email(text):
    amount=re.search(r'₹[\d,]+', text)
    
    installments = re.search(r'\d+\sinstallment', text)

    return {
        "amount": amount.group() if amount else None,
        "installments": installments.group() if installments else None
    }