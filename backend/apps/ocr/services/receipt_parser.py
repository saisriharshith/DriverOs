import re
from decimal import Decimal
from datetime import datetime


def parse_fuel_receipt_text(text: str) -> dict:
    """Parse fuel receipt from speech/text input (Hindi/English)"""
    result = {
        'category': 'FUEL',
        'amount': None,
        'litres': None,
        'price_per_litre': None,
        'fuel_type': 'DIESEL',
        'fuel_station': None,
        'odometer_reading': None,
    }
    
    text_lower = text.lower()
    
    # Extract litres
    litre_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:litre|ltr|liter|लीटर|লিটার|లీటర్|லிட்டர்|ಲೀಟರ್|लिटर|ലിറ്റർ)',
        r'(\d+(?:\.\d+)?)\s*[Ll]',
    ]
    for pattern in litre_patterns:
        match = re.search(pattern, text_lower)
        if match:
            result['litres'] = float(match.group(1))
            break
    
    # Extract total cost / rupees
    cost_patterns = [
        r'(?:rs|rupee|rupay|rupe|₹|रुपये?|রুপি|రూపాయ|ரூபாய்|ರೂಪಾಯಿ|रुपया|रुपए|रूपये|രൂപ)\.?\s*(\d[\d,]*)',
        r'(\d[\d,]*)\s*(?:rs|rupee|rupay|rupe|₹|रुपये?|রুপি|రూపాయ|ரூபாய்|ರೂಪಾಯಿ|रुपया|रुपए|रूपये|രൂപ)',
        r'total\s*[:\-]?\s*(?:rs|₹)?\s*(\d[\d,]*)',
    ]
    for pattern in cost_patterns:
        match = re.search(pattern, text_lower)
        if match:
            result['amount'] = float(match.group(1).replace(',', ''))
            break
    
    # Derive price per litre
    if result['litres'] and result['amount']:
        result['price_per_litre'] = round(result['amount'] / result['litres'], 2)
    
    # Extract fuel type
    if any(w in text_lower for w in ['diesel', 'डीजल', 'डिझेल', 'ডিজেল', 'డీజిల్', 'டீசல்', 'ಡೀಸೆಲ್', 'ഡീസൽ']):
        result['fuel_type'] = 'DIESEL'
    elif any(w in text_lower for w in ['petrol', 'पेट्रोल', 'পেট্রোল', 'పెట్రోల్', 'பெட்ரோல்', 'ಪೆಟ್ರೋಲ್', 'പെട്രോൾ']):
        result['fuel_type'] = 'PETROL'
    elif any(w in text_lower for w in ['cng', 'सीएनजी']):
        result['fuel_type'] = 'CNG'
    
    # Extract station name - text after "at", "on", "in", "में", "पर", "में", "లో", "ல்", "ನಲ್ಲಿ", "ൽ"
    station_patterns = [
        r'(?:at|on|in|at the|में|पर|नगर|স্টেশন|లో|ல்|ನಲ್ಲಿ|ൽ)\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\.|at)',
        r'(?:hpcl|bpcl|iocl|shell|essar|reliance)\s+([A-Z][a-zA-Z\s]+)',
    ]
    for pattern in station_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result['fuel_station'] = match.group(1).strip()
            break
    
    # Extract odometer
    odo_match = re.search(r'(?:odometer|odo|reading|मीटर|ओडोमीटर|অডোমিটার|ఓడోమీటர்|ஆடோமீட்டர்|ಓಡೋಮೀಟર|ओडोमीटर)\.?\s*[:\-]?\s*(\d[\d,]*)', text_lower)
    if odo_match:
        result['odometer_reading'] = int(odo_match.group(1).replace(',', ''))
    
    return result


def parse_voice_expense(text: str) -> dict:
    """Parse general voice expense input"""
    result = {
        'category': 'OTHER',
        'amount': None,
        'description': text[:200],
    }
    
    text_lower = text.lower()
    
    # Extract amount
    amount_patterns = [
        r'(?:spent|paid|cost|खर्च|খরচ|చర్చ|செலவு|ఖర్చು|ಖರ್ಚು|வழிநூறு)\s*(?:rs|rupee|rupay|₹|रुपये?)?\s*(\d[\d,]*)',
        r'(\d[\d,]*)\s*(?:rs|rupee|rupay|₹|रुपये?)',
    ]
    for pattern in amount_patterns:
        match = re.search(pattern, text_lower)
        if match:
            result['amount'] = float(match.group(1).replace(',', ''))
            break
    
    # Category detection
    categories = {
        'FUEL': ['fuel', 'diesel', 'petrol', 'cng', 'ईंधन', 'ఇంధనం', 'எரிபொருள்', 'ಇಂಧನ'],
        'TOLL': ['toll', 'टोल', 'টোল', 'టోల్', 'டோல்', 'ಟೋಲ್'],
        'REPAIR': ['repair', 'fix', 'service', 'रिपेयर', 'রিপেয়ার', 'మరమ్మత್', 'மரம்பு', 'ಮರಮತ್ತು'],
        'FOOD': ['food', 'dhaba', 'meal', 'खाना', 'খাবার', 'ఆహారం', 'உணவு', 'ಆಹಾರ'],
        'LOADING': ['loading', 'unloading', 'लोडिंग', 'লোডিং', 'లోడింగ్', 'ಏற்றladen'],
    }
    
    for cat, keywords in categories.items():
        if any(kw in text_lower for kw in keywords):
            result['category'] = cat
            break
    
    return result


def extract_structured_data(ocr_result: dict, doc_type: str) -> dict:
    """Extract structured data from OCR result for document"""
    structured = {}
    
    if doc_type == 'RC':
        structured = {
            'number': ocr_result.get('vehicle_number'),
            'owner_name': ocr_result.get('owner_name'),
            'chassis_number': ocr_result.get('chassis_number'),
            'engine_number': ocr_result.get('engine_number'),
            'registration_date': ocr_result.get('registration_date'),
        }
    elif doc_type == 'INSURANCE':
        structured = {
            'policy_number': ocr_result.get('policy_number'),
            'expiry': ocr_result.get('policy_end'),
            'insurer': ocr_result.get('insurer'),
        }
    elif doc_type == 'PERMIT':
        structured = {
            'number': ocr_result.get('permit_number'),
            'expiry': ocr_result.get('valid_to'),
            'permit_type': ocr_result.get('permit_type'),
        }
    elif doc_type == 'PUC':
        structured = {
            'certificate_number': ocr_result.get('certificate_number'),
            'expiry': ocr_result.get('valid_to'),
        }
    elif doc_type == 'FITNESS':
        structured = {
            'certificate_number': ocr_result.get('certificate_number'),
            'expiry': ocr_result.get('valid_to'),
        }
    
    return structured
