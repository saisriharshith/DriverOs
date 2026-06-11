from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from .services.gemini_chat import gemini_chat


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

        # Basic context can be added here (e.g., user role, recent trips)
        context = f"User: {request.user.name}, Phone: {request.user.phone}, Role: {request.user.role}"
        
        reply = gemini_chat.get_response(message, context=context)

        return Response({'reply': reply})
