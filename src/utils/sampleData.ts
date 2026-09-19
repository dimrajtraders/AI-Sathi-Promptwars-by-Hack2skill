export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  iconName: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'doc-elec',
    title: 'Electricity Disconnection Notice',
    category: 'Utility Bill',
    iconName: 'Zap',
    text: `CITY POWER & ELECTRICITY DISTRIBUTION LTD.
URGENT NOTICE OF OVERDUE AMOUNT
Consumer No: 1084-9382-11
Consumer Name: Ramesh Sharma
Service Address: 42 Palm Grove Colony

Subject: Final demand notice prior to supply disconnection.

Dear Consumer,
Our records indicate that an outstanding balance of $84.50 (Eighty-Four Dollars and Fifty Cents) remains unpaid for the billing period ending August 25.
Please be advised that under Section 56(1) of the Electricity Act, power supply will be disconnected without further notice on September 24 at 10:00 AM if full settlement is not remitted prior to said deadline.

Payment Options:
1. Online portal at citypower.gov/pay
2. In-person at City Power Cash Counter (Mon-Fri, 9am-4pm)
Late reconnection fee of $35.00 shall apply if disconnected.
For grievances, contact Helpline 1800-200-333.`,
  },
  {
    id: 'doc-rx',
    title: 'Hospital Discharge & Prescription',
    category: 'Medical',
    iconName: 'Pill',
    text: `METROPOLITAN GENERAL HOSPITAL
Department of Internal Medicine
Patient: Ramesh Sharma (Age 72)
Discharge Date: September 12

DIAGNOSIS: Essential Hypertension, Mild Osteoarthritis Left Knee.

DISCHARGE MEDICATION SCHEDULE:
1. Tab. Amlodipine 5mg: 1 tablet daily in the morning after breakfast. Monitor BP weekly.
2. Tab. Paracetamol 650mg: Take 1 tablet as needed for joint pain, not exceeding 2 tablets in 24 hours.
3. Tab. Calcium + Vit D3 (500mg/400IU): 1 tablet daily with lunch.

ADVICE & RESTRICTIONS:
- Low-sodium diet (less than 1 teaspoon salt daily).
- Drink 1.5 to 2 liters of water daily unless advised otherwise.
- Avoid lifting heavy weights and abrupt squatting.
- Next follow-up appointment with Dr. Henderson on September 28 at 11:00 AM in OPD Room 204.
Call hospital helpline immediately if chest pain or extreme dizziness occurs.`,
  },
  {
    id: 'doc-kyc',
    title: 'Bank Annual KYC Verification Letter',
    category: 'Banking',
    iconName: 'Landmark',
    text: `NATIONAL COOPERATIVE BANK
Retail Banking Operations Branch

Date: September 05
To: Mr. Ramesh Sharma
Account ending: ...4921

Dear Valued Customer,
As mandated by Central Bank regulatory compliance norms, your Savings Account requires periodic Re-KYC (Know Your Customer) update once every 2 years.

Action Required:
Kindly visit your home branch before October 15 with the following original documents along with one self-attested photocopy:
1. Valid government photo identity card (Voter ID, Passport, or Senior Citizen Card).
2. Recent utility bill or bank passbook for proof of current address.
3. Two recent passport-size photographs.

IMPORTANT SAFETY CAUTION:
Our bank NEVER sends SMS or WhatsApp links asking you to update KYC online by installing any mobile application or clicking remote links. Any request asking for your debit card PIN or OTP is fraudulent.`,
  },
];

export interface SampleScam {
  id: string;
  title: string;
  expectedVerdict: 'LIKELY SCAM' | 'SUSPICIOUS' | 'SAFE';
  text: string;
  senderLabel: string;
}

export const SAMPLE_SCAMS: SampleScam[] = [
  {
    id: 'scam-1',
    title: 'Bank Account Block Threat (SMS)',
    expectedVerdict: 'LIKELY SCAM',
    senderLabel: 'SMS from +1-839-442-9901',
    text: `URGENT ALERT: Dear Customer, your SBI/HDFC Bank Account has been BLOCKED today due to non-updated PAN Card. To unblock and keep services active immediately, visit bit.ly/bank-kyc-verify-now and submit your debit card number and OTP within 2 hours. Failure will lead to permanent account seizure.`,
  },
  {
    id: 'scam-2',
    title: 'Electricity Cut Tonight Threat (WhatsApp)',
    expectedVerdict: 'LIKELY SCAM',
    senderLabel: 'WhatsApp from unknown number',
    text: `Dear consumer, your electricity power line will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Immediately call our electricity officer Mr. Sharma at 98765-43210 to stop power cut immediately.`,
  },
  {
    id: 'scam-3',
    title: 'Lottery Prize & Processing Fee (Email)',
    expectedVerdict: 'LIKELY SCAM',
    senderLabel: 'Email from claims@international-rewards-desk.org',
    text: `CONGRATULATIONS! Your email was selected as lucky winner of $250,000 in Senior Citizens International Welfare Sweepstakes. To claim your prize funds, reply with your bank account details and wire a small $150 customs verification clearance fee today via gift card.`,
  },
  {
    id: 'scam-4',
    title: 'Legitimate Grocery Order Receipt',
    expectedVerdict: 'SAFE',
    senderLabel: 'SMS from FreshStore',
    text: `Thank you for shopping at FreshStore Mart! Your bill of $18.20 for milk, bread, and apples has been paid in cash at Register 3 on Sept 18. Receipt #88392. Have a wonderful day!`,
  },
];

export const SUGGESTED_QUESTIONS = [
  'How do I video call my grandson on WhatsApp?',
  'What are gentle morning stretches for knee pain?',
  'How can I tell if a phone call is a scam?',
  'Remind me to drink warm water with lemon',
  'What should I eat when my blood sugar is slightly high?',
  'How do I make my phone font larger and easier to see?',
];
