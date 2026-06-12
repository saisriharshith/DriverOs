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

        # Build Rich Context
        from documents.models import Document
        from trips.models import Trip
        from locations.models import Location
        from django.utils import timezone
        
        docs = Document.objects.filter(user=request.user)
        active_trip = Trip.objects.filter(driver=request.user, status='ACTIVE').first()
        last_loc = Location.objects.filter(user=request.user).first()
        
        doc_info = ", ".join([f"{d.doc_type} expires {d.expiry_date}" for d in docs if d.expiry_date])
        trip_info = f"On trip from {active_trip.start_location} to {active_trip.end_location}" if active_trip else "No active trip"
        loc_info = f"Last location: {last_loc.latitude}, {last_loc.longitude}" if last_loc else "Location unknown"
        
        context = (
            f"User: {request.user.name}, Phone: {request.user.phone}, Role: {request.user.role}. "
            f"User's Documents: {doc_info if doc_info else 'None'}. "
            f"Active Trip: {trip_info}. "
            f"Current Position: {loc_info}."
        )
        
        reply = gemini_chat.get_response(message, context=context)

        return Response({'reply': reply})
