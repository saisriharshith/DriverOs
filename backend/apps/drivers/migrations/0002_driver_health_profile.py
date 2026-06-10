from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drivers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='driver',
            name='allergies',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='driver',
            name='doctor_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='driver',
            name='emergency_contact_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='driver',
            name='emergency_contact_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='driver',
            name='height_cm',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='driver',
            name='medical_conditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='driver',
            name='medications',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='driver',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name='driver',
            name='weight_kg',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
