import os
from django.conf import settings


class GeminiChatService:
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

    def get_response(self, message, context=None):
        if not self._client:
            return "I'm currently in offline mode. I can help with document renewals, fines, PUC, insurance, license, fitness certificate, E-Way Bill, trips, and emergency guidance."

        try:
            prompt = f"""
            You are DriverOS Assistant, a helpful AI for Indian commercial vehicle drivers. 
            You provide advice on:
            - Document renewals (RC, Insurance, PUC, Permit, Fitness)
            - RTO rules and fines
            - Trip management and expenses
            - Health and safety during long drives
            - Emergency guidance

            Context: {context if context else 'User is a commercial driver in India.'}

            User says: {message}

            Provide a concise, helpful response in English (or Hindi if the user asks in Hindi).
            Keep it practical and specific to the Indian context.
            """
            
            response = self._client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            return f"Error: {str(e)}"

gemini_chat = GeminiChatService()
