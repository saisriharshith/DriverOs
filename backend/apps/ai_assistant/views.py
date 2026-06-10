from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema


RESPONSES = {
    'insurance': (
        "Your insurance must be renewed before driving. Keep RC, previous policy, "
        "Aadhaar/PAN, and payment details ready. Upload the renewed policy in "
        "Document Vault so compliance can update."
    ),
    'license': (
        "For driving license renewal, use Sarathi/Parivahan or visit the RTO. "
        "Commercial/HMV drivers usually need the old license, Aadhaar, photo, "
        "and medical Form 1-A."
    ),
    'puc': (
        "PUC can be renewed at an authorised emission testing centre. Upload the "
        "new certificate and expiry date after renewal."
    ),
    'fitness': (
        "Commercial vehicle fitness certificates are required for operation. "
        "Renew through the RTO with RC, insurance, PUC, and vehicle inspection."
    ),
    'eway': (
        "E-Way Bill is generally required for goods movement above the GST value "
        "threshold. Generate it on the official e-way bill portal before travel."
    ),
}


class AssistantChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request={"type": "object", "properties": {"message": {"type": "string"}}},
        responses={
            200: {"type": "object", "properties": {"reply": {"type": "string"}}},
            400: {"type": "object", "properties": {"error": {"type": "string"}}}
        }
    )
    def post(self, request):
        message = str(request.data.get('message', '')).strip()
        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        text = message.lower()
        if 'insurance' in text or 'bima' in text:
            answer = RESPONSES['insurance']
        elif 'license' in text or 'licence' in text or 'dl' in text:
            answer = RESPONSES['license']
        elif 'puc' in text or 'pollution' in text:
            answer = RESPONSES['puc']
        elif 'fitness' in text:
            answer = RESPONSES['fitness']
        elif 'eway' in text or 'e-way' in text or 'way bill' in text:
            answer = RESPONSES['eway']
        else:
            answer = (
                "I can help with document renewals, fines, PUC, insurance, license, "
                "fitness certificate, E-Way Bill, trips, and emergency guidance."
            )

        return Response({'reply': answer})
