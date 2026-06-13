import os
import json
import base64
from django.conf import settings


class GeminiOCRService:
    """Gemini Vision API integration for OCR"""
    
    def __init__(self):
        self._client = None
        api_key = os.environ.get('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', None)
        if api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except ImportError:
                self._client = None
        else:
            self._client = None

    @property
    def client(self):
        return self._client
    
    def _encode_image(self, image_file):
        """Encode image to base64"""
        image_file.seek(0)
        return base64.b64encode(image_file.read()).decode('utf-8')
    
    def process_receipt(self, image_file) -> dict:
        """Process fuel receipt and extract expense data"""
        if not self._client:
            return self._mock_receipt_response()
        
        try:
            image_data = self._encode_image(image_file)
            
            prompt = """
            Analyze this fuel receipt image and extract the following information in JSON format:
            {
                "category": "FUEL",
                "amount": <total_amount_in_rupees>,
                "litres": <litres_purchased>,
                "price_per_litre": <price_per_litre>,
                "fuel_type": "<DIESEL|PETROL|CNG>",
                "fuel_station": "<station_name>",
                "date": "<YYYY-MM-DD>",
                "odometer_reading": <optional_odometer>,
                "vehicle_number": "<optional_vehicle_number>",
                "confidence": <0-100>
            }
            
            Look for: total amount, litres, price per litre, fuel type (diesel/petrol/CNG), 
            station name, date, odometer reading if visible.
            If any field is not found, use null.
            """
            
            from google.genai import types
            
            response = self._client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    types.Content(
                        parts=[
                            types.Part.from_text(text=prompt),
                            types.Part.from_bytes(
                                data=base64.b64decode(image_data),
                                mime_type="image/jpeg",
                            ),
                        ]
                    )
                ],
            )
            
            # Parse JSON from response
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:-3]
            elif text.startswith('```'):
                text = text[3:-3]
            
            return json.loads(text)
            
        except Exception as e:
            return {
                "error": str(e),
                "category": "FUEL",
                "amount": 0,
                "confidence": 0
            }
    
    def process_document(self, image_file, doc_type: str) -> dict:
        """Process vehicle document (RC, Insurance, Permit, PUC, Fitness)"""
        if not self._client:
            return self._mock_document_response(doc_type)
        
        try:
            image_data = self._encode_image(image_file)
            
            prompts = {
                'RC': """
                    Extract from this Registration Certificate (RC):
                    {
                        "vehicle_number": "<registration_number>",
                        "owner_name": "<owner_name>",
                        "chassis_number": "<chassis_number>",
                        "engine_number": "<engine_number>",
                        "vehicle_class": "<class>",
                        "fuel_type": "<fuel_type>",
                        "manufacturing_year": <year>,
                        "registration_date": "<YYYY-MM-DD>",
                        "rto": "<rto_office>",
                        "confidence": <0-100>
                    }
                """,
                'INSURANCE': """
                    Extract from this Insurance Policy:
                    {
                        "policy_number": "<policy_number>",
                        "vehicle_number": "<vehicle_number>",
                        "insurer": "<insurance_company>",
                        "policy_start": "<YYYY-MM-DD>",
                        "policy_end": "<YYYY-MM-DD>",
                        "premium_amount": <amount>,
                        "coverage_type": "<TP/Comprehensive>",
                        "confidence": <0-100>
                    }
                """,
                'PERMIT': """
                    Extract from this Permit:
                    {
                        "permit_number": "<permit_number>",
                        "vehicle_number": "<vehicle_number>",
                        "permit_type": "<national/state/district>",
                        "valid_from": "<YYYY-MM-DD>",
                        "valid_to": "<YYYY-MM-DD>",
                        "route": "<route_details>",
                        "confidence": <0-100>
                    }
                """,
                'PUC': """
                    Extract from this PUC Certificate:
                    {
                        "certificate_number": "<cert_number>",
                        "vehicle_number": "<vehicle_number>",
                        "test_date": "<YYYY-MM-DD>",
                        "valid_to": "<YYYY-MM-DD>",
                        "emission_reading": "<reading>",
                        "confidence": <0-100>
                    }
                """,
                'FITNESS': """
                    Extract from this Fitness Certificate:
                    {
                        "certificate_number": "<cert_number>",
                        "vehicle_number": "<vehicle_number>",
                        "test_date": "<YYYY-MM-DD>",
                        "valid_to": "<YYYY-MM-DD>",
                        "testing_station": "<station_name>",
                        "confidence": <0-100>
                    }
                """,
            }
            
            prompt = prompts.get(doc_type, prompts['RC'])
            
            from google.genai import types
            
            response = self._client.models.generate_content(
                model='gemini-2.0-flash',
                contents=[
                    types.Content(
                        parts=[
                            types.Part.from_text(text=prompt),
                            types.Part.from_bytes(
                                data=base64.b64decode(image_data),
                                mime_type="image/jpeg",
                            ),
                        ]
                    )
                ],
            )
            
            text = response.text.strip()
            if text.startswith('```json'):
                text = text[7:-3]
            elif text.startswith('```'):
                text = text[3:-3]
            
            return json.loads(text)
            
        except Exception as e:
            return {"error": str(e), "confidence": 0}
    
    def _mock_receipt_response(self):
        """Mock response for development"""
        return {
            "category": "FUEL",
            "amount": 4600,
            "litres": 50,
            "price_per_litre": 92.0,
            "fuel_type": "DIESEL",
            "fuel_station": "HPCL Nagpur Bypass",
            "date": "2026-06-10",
            "confidence": 95
        }
    
    def _mock_document_response(self, doc_type):
        """Mock response for development"""
        mocks = {
            'RC': {"vehicle_number": "MH12AB1234", "confidence": 90},
            'INSURANCE': {"policy_number": "POL123456", "confidence": 90},
            'PERMIT': {"permit_number": "PRM123456", "confidence": 90},
            'PUC': {"certificate_number": "PUC123456", "confidence": 90},
            'FITNESS': {"certificate_number": "FIT123456", "confidence": 90},
        }
        return mocks.get(doc_type, {"confidence": 0})


# Singleton instance
gemini_ocr = GeminiOCRService()
