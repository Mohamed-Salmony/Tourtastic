# Placeholder for PDF Generation Utility
# Using FPDF2 for simple text-based PDFs as per knowledge module

from fpdf import FPDF
import os

# Ensure the output directory exists
def ensure_dir(file_path):
    directory = os.path.dirname(file_path)
    if not os.path.exists(directory):
        os.makedirs(directory)

# Basic example: Generate a simple confirmation PDF
# In a real scenario, this would take booking details and format them properly.
def generate_simple_booking_pdf(booking_details, output_path):
    ensure_dir(output_path)
    
    pdf = FPDF()
    pdf.add_page()
    
    # Add Font supporting basic characters (add CJK font if needed)
    # pdf.add_font("NotoSansCJK", fname="/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc")
    # pdf.set_font("NotoSansCJK", size=12)
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="Tourtastic - Booking Confirmation", ln=1, align="C")
    pdf.ln(10)

    pdf.cell(200, 10, txt=f"Booking ID: {booking_details.get("bookingId", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Customer: {booking_details.get("customerName", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Email: {booking_details.get("customerEmail", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Type: {booking_details.get("type", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Destination: {booking_details.get("destination", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Date: {booking_details.get("bookingDate", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Amount: ${booking_details.get("amount", "N/A")}", ln=1)
    pdf.cell(200, 10, txt=f"Status: {booking_details.get("status", "N/A")}", ln=1)
    pdf.ln(10)
    pdf.cell(200, 10, txt="Thank you for booking with Tourtastic!", ln=1)

    try:
        pdf.output(output_path, "F")
        print(f"PDF generated successfully at {output_path}")
        return output_path
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise

# Example usage (called from Node.js via child_process if needed)
# if __name__ == "__main__":
#     import json
#     import sys
#     if len(sys.argv) > 2:
#         details_json = sys.argv[1]
#         output_file = sys.argv[2]
#         details = json.loads(details_json)
#         generate_simple_booking_pdf(details, output_file)
#     else:
#         print("Usage: python generatePdf.py <booking_details_json> <output_path>")

