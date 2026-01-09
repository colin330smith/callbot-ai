"""
Prospect Research Tool
Helps build a list of businesses to contact for AI Phone Agent sales

USAGE:
1. Go to Google Maps
2. Search "[industry] in [city]" (e.g., "HVAC companies in Austin")
3. For each business, collect: name, phone, website
4. Add to prospects.csv

Or use this script to help organize the data.
"""

import csv
from datetime import datetime

# Target industries in order of priority
INDUSTRIES = [
    "hvac",
    "plumbing",
    "personal_injury_lawyer",
    "dentist",
    "medspa",
    "contractor",
    "auto_repair",
    "real_estate"
]

# Cities to target (start local, expand)
CITIES = [
    "Austin",
    "Houston",
    "Dallas",
    "San Antonio",
    "Denver",
    "Phoenix"
]

def add_prospect(csv_path: str, prospect: dict):
    """Add a prospect to the CSV file"""
    with open(csv_path, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'business_name', 'contact_name', 'email', 'phone',
            'industry', 'city', 'source', 'status', 'notes', 'last_contact'
        ])
        writer.writerow({
            'business_name': prospect.get('name', ''),
            'contact_name': prospect.get('contact', ''),
            'email': prospect.get('email', ''),
            'phone': prospect.get('phone', ''),
            'industry': prospect.get('industry', ''),
            'city': prospect.get('city', ''),
            'source': prospect.get('source', 'manual'),
            'status': 'not_contacted',
            'notes': prospect.get('notes', ''),
            'last_contact': ''
        })

def update_status(csv_path: str, business_name: str, new_status: str, notes: str = ''):
    """Update a prospect's status"""
    rows = []
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['business_name'] == business_name:
                row['status'] = new_status
                row['last_contact'] = datetime.now().strftime('%Y-%m-%d')
                if notes:
                    row['notes'] = notes
            rows.append(row)

    with open(csv_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

# Status options:
# - not_contacted: Haven't reached out yet
# - email_sent: Sent cold email
# - called: Made cold call
# - voicemail: Left voicemail
# - replied: They responded
# - demo_scheduled: Demo call booked
# - demo_completed: Had the demo
# - proposal_sent: Sent pricing/proposal
# - won: Signed up!
# - lost: Said no
# - nurture: Not now but maybe later

if __name__ == "__main__":
    print("Prospect Research Tool")
    print("=" * 50)
    print(f"Target Industries: {', '.join(INDUSTRIES[:4])}")
    print(f"Target Cities: {', '.join(CITIES[:3])}")
    print()
    print("QUICK START:")
    print("1. Open Google Maps")
    print("2. Search: 'HVAC companies in Austin TX'")
    print("3. For each result, get: Name, Phone, Website")
    print("4. Add to prospects.csv")
    print()
    print("AIM FOR: 50 prospects today")
    print("CONTACT: All 50 via cold call + email")
