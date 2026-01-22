// Sample construction subcontract for demo purposes
// This contains common risky clauses that SubShield will identify

export const SAMPLE_CONTRACT = `SUBCONTRACT AGREEMENT

This Subcontract Agreement ("Agreement") is entered into as of the date last signed below, by and between:

GENERAL CONTRACTOR: ABC Construction Company, LLC ("Contractor")
SUBCONTRACTOR: Sample Electrical Services, Inc. ("Subcontractor")

PROJECT: Commercial Office Building - 123 Main Street, Anytown, USA
CONTRACT VALUE: $485,000.00

ARTICLE 1 - SCOPE OF WORK
Subcontractor shall provide all labor, materials, equipment, and supervision necessary to complete the electrical installation work as described in the attached Exhibit A and in accordance with the Prime Contract between Owner and Contractor.

ARTICLE 2 - PAYMENT TERMS

2.1 Pay-If-Paid: Contractor's obligation to make payment to Subcontractor is expressly contingent upon Contractor's receipt of payment from the Owner for Subcontractor's work. Subcontractor agrees that Contractor shall not be obligated to pay Subcontractor unless and until Contractor has received corresponding payment from Owner. If Owner fails to make payment to Contractor for any reason whatsoever, Contractor shall have no obligation to pay Subcontractor for the affected work.

2.2 Progress Payments: Subcontractor shall submit monthly applications for payment by the 25th of each month. Payment shall be made within 45 days after Contractor receives payment from Owner.

2.3 Retainage: Contractor shall retain ten percent (10%) of each progress payment. Retainage shall be released within 60 days after final acceptance by Owner, provided Owner has released retainage to Contractor.

ARTICLE 3 - INDEMNIFICATION

3.1 Subcontractor shall defend, indemnify, and hold harmless Contractor, Owner, Architect, and their respective officers, directors, employees, and agents from and against any and all claims, damages, losses, and expenses, including but not limited to attorneys' fees, arising out of or resulting from the performance of Subcontractor's work, regardless of whether such claim is caused in part by a party indemnified hereunder. This indemnification shall apply to any claims arising from the negligence, errors, omissions, or willful misconduct of Contractor or any other party.

ARTICLE 4 - INSURANCE REQUIREMENTS

4.1 Subcontractor shall maintain the following minimum insurance coverage:
   - Commercial General Liability: $2,000,000 per occurrence / $5,000,000 aggregate
   - Automobile Liability: $1,000,000 combined single limit
   - Workers Compensation: Statutory limits
   - Umbrella/Excess Liability: $5,000,000
   - Professional Liability: $2,000,000

4.2 All policies shall name Contractor and Owner as additional insureds.

ARTICLE 5 - CHANGES AND EXTRAS

5.1 No change order, extra work, or modification shall be valid unless authorized in writing by Contractor prior to commencement of such work. Subcontractor must provide written notice of any claim for additional compensation within twenty-four (24) hours of becoming aware of the condition giving rise to such claim. Failure to provide timely notice shall constitute a complete waiver of any claim for additional compensation.

ARTICLE 6 - DELAYS

6.1 No Damages for Delay: Subcontractor shall not be entitled to any damages, compensation, or recovery of any kind for delays in the performance of the Work, regardless of the cause of such delays, including delays caused by Contractor, Owner, or other subcontractors. Subcontractor's sole remedy for delay shall be an extension of time.

ARTICLE 7 - TERMINATION

7.1 Termination for Convenience: Contractor may terminate this Agreement at any time for convenience upon seven (7) days written notice. In such event, Subcontractor shall be entitled only to payment for work satisfactorily completed prior to termination.

7.2 Termination for Cause: Contractor may terminate this Agreement immediately if Subcontractor fails to perform in accordance with the terms of this Agreement.

ARTICLE 8 - LIEN WAIVERS

8.1 As a condition precedent to each progress payment, Subcontractor shall provide an unconditional lien waiver for all work performed through the date of the previous payment application, regardless of whether Subcontractor has actually received such payment.

ARTICLE 9 - WARRANTY

9.1 Subcontractor warrants all work for a period of three (3) years from the date of substantial completion of the Project. Subcontractor shall respond to warranty claims within four (4) hours of notification and commence remedial work within twenty-four (24) hours.

ARTICLE 10 - DISPUTE RESOLUTION

10.1 Any disputes arising under this Agreement shall be resolved exclusively in the courts of Delaware. Subcontractor waives any objection to venue in such courts.

ARTICLE 11 - LIQUIDATED DAMAGES

11.1 If Subcontractor fails to complete the work within the time specified, Subcontractor shall pay Contractor liquidated damages in the amount of $2,500 per calendar day of delay. The parties agree that this amount represents a reasonable estimate of Contractor's actual damages.

ARTICLE 12 - FLOW-DOWN PROVISIONS

12.1 All terms, conditions, and requirements of the Prime Contract between Owner and Contractor are hereby incorporated by reference and shall apply to Subcontractor's work.

IN WITNESS WHEREOF, the parties have executed this Agreement.

ABC CONSTRUCTION COMPANY, LLC

By: _________________________ Date: _____________
Name: John Smith
Title: Project Manager

SAMPLE ELECTRICAL SERVICES, INC.

By: _________________________ Date: _____________
Name: _______________________
Title: _______________________
`;

export const SAMPLE_CONTRACT_FILENAME = 'Sample_Subcontract_Agreement.pdf';
