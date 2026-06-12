from django.utils import timezone
from documents.models import Document
from trips.models import Trip
from vehicles.models import Vehicle
from maintenance.models import MaintenanceSchedule
from ..models import ComplianceScore

def calculate_user_compliance(user):
    score = 100
    deductions = []
    
    # 1. Documents (40% weight)
    docs = Document.objects.filter(user=user)
    required_docs = ['RC', 'INSURANCE', 'PUC', 'FITNESS', 'PERMIT']
    found_docs = docs.values_list('doc_type', flat=True)
    
    for doc_type in required_docs:
        if doc_type not in found_docs:
            score -= 8
            deductions.append(f"Missing {doc_type}")
        else:
            doc = docs.filter(doc_type=doc_type).order_by('-upload_date').first()
            if doc.status == 'EXPIRED':
                score -= 8
                deductions.append(f"Expired {doc_type}")
            elif doc.status == 'EXPIRING_SOON':
                score -= 2
                deductions.append(f"{doc_type} expiring soon")
                
    # 2. Maintenance (30% weight)
    vehicles = Vehicle.objects.filter(user=user)
    for vehicle in vehicles:
        overdue = MaintenanceSchedule.objects.filter(vehicle=vehicle, status='OVERDUE').count()
        if overdue > 0:
            score -= (overdue * 5)
            deductions.append(f"Overdue maintenance for {vehicle.vehicle_number}")
            
    # 3. Safety (30% weight)
    # This could involve SOS events, harsh braking, etc. 
    # For now, let's use SOS events as a proxy
    sos_events = user.sos_events.filter(status='ACTIVE').count()
    if sos_events > 0:
        score -= (sos_events * 10)
        deductions.append(f"Active SOS events")
        
    score = max(0, score)
    
    risk_level = 'SAFE'
    if score < 40:
        risk_level = 'HIGH'
    elif score < 70:
        risk_level = 'WARNING'
        
    compliance, created = ComplianceScore.objects.update_or_create(
        user=user,
        defaults={
            'score': score,
            'risk_level': risk_level,
            'last_updated': timezone.now()
        }
    )
    
    return compliance
