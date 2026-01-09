"""
Knowledge Base Service for CallBot AI
Handles document upload, processing, and AI context injection
"""

import os
import re
import hashlib
from datetime import datetime
from typing import Dict, Optional, List, Any
import httpx
from io import BytesIO

# File size limits
MAX_FILE_SIZE_MB = 10
MAX_FILES_PER_BUSINESS = 50
ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx', '.md', '.csv', '.json'}


class KnowledgeBaseEntry:
    """Single knowledge base document/entry"""

    def __init__(
        self,
        entry_id: str,
        business_id: str,
        title: str,
        content: str,
        category: str = "general",
        source_type: str = "manual"
    ):
        self.id = entry_id
        self.business_id = business_id
        self.title = title
        self.content = content
        self.category = category
        self.source_type = source_type  # manual, upload, website, api
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.content_hash = hashlib.md5(content.encode()).hexdigest()


class KnowledgeBase:
    """Knowledge base for a business"""

    def __init__(self, business_id: str):
        self.business_id = business_id
        self.entries: List[KnowledgeBaseEntry] = []
        self.categories = ["general", "faq", "pricing", "services", "policies", "procedures"]

    def add_entry(self, entry: KnowledgeBaseEntry):
        """Add an entry to the knowledge base"""
        # Check for duplicates by content hash
        for existing in self.entries:
            if existing.content_hash == entry.content_hash:
                return False
        self.entries.append(entry)
        return True

    def remove_entry(self, entry_id: str) -> bool:
        """Remove an entry from the knowledge base"""
        for i, entry in enumerate(self.entries):
            if entry.id == entry_id:
                self.entries.pop(i)
                return True
        return False

    def get_entry(self, entry_id: str) -> Optional[KnowledgeBaseEntry]:
        """Get a specific entry"""
        for entry in self.entries:
            if entry.id == entry_id:
                return entry
        return None

    def search(self, query: str, category: Optional[str] = None) -> List[KnowledgeBaseEntry]:
        """Search entries by keyword"""
        query_lower = query.lower()
        results = []

        for entry in self.entries:
            if category and entry.category != category:
                continue

            if query_lower in entry.title.lower() or query_lower in entry.content.lower():
                results.append(entry)

        return results

    def get_by_category(self, category: str) -> List[KnowledgeBaseEntry]:
        """Get all entries in a category"""
        return [e for e in self.entries if e.category == category]

    def generate_context_prompt(self, max_tokens: int = 4000) -> str:
        """Generate a context prompt from knowledge base for AI"""

        sections = []

        # Group by category
        by_category = {}
        for entry in self.entries:
            if entry.category not in by_category:
                by_category[entry.category] = []
            by_category[entry.category].append(entry)

        # Build context
        for category, entries in by_category.items():
            section_content = f"\n## {category.upper()}\n"
            for entry in entries:
                section_content += f"\n### {entry.title}\n{entry.content}\n"
            sections.append(section_content)

        full_context = "\n".join(sections)

        # Truncate if too long (rough token estimate: 4 chars per token)
        max_chars = max_tokens * 4
        if len(full_context) > max_chars:
            full_context = full_context[:max_chars] + "\n\n[Knowledge base truncated due to length...]"

        return full_context

    @property
    def stats(self) -> Dict:
        return {
            "total_entries": len(self.entries),
            "categories": list(set(e.category for e in self.entries)),
            "total_chars": sum(len(e.content) for e in self.entries),
            "entries_by_category": {
                cat: len([e for e in self.entries if e.category == cat])
                for cat in self.categories
            }
        }


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes (basic extraction)"""
    # Note: For production, use PyPDF2 or pdfplumber
    # This is a placeholder that would need actual PDF library
    try:
        import PyPDF2
        pdf_file = BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except ImportError:
        return "[PDF extraction requires PyPDF2 library]"
    except Exception as e:
        return f"[Error extracting PDF: {str(e)}]"


def extract_text_from_docx(docx_bytes: bytes) -> str:
    """Extract text from DOCX bytes"""
    try:
        import docx
        doc_file = BytesIO(docx_bytes)
        doc = docx.Document(doc_file)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except ImportError:
        return "[DOCX extraction requires python-docx library]"
    except Exception as e:
        return f"[Error extracting DOCX: {str(e)}]"


def process_uploaded_file(
    filename: str,
    content: bytes,
    business_id: str
) -> Dict:
    """Process an uploaded file and extract content"""

    # Check file size
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        return {"success": False, "error": f"File too large. Max size: {MAX_FILE_SIZE_MB}MB"}

    # Check extension
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {"success": False, "error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}

    # Extract text based on file type
    try:
        if ext in ['.txt', '.md']:
            text = content.decode('utf-8', errors='ignore')
        elif ext == '.pdf':
            text = extract_text_from_pdf(content)
        elif ext in ['.doc', '.docx']:
            text = extract_text_from_docx(content)
        elif ext == '.csv':
            text = content.decode('utf-8', errors='ignore')
            # Convert CSV to readable format
            lines = text.split('\n')
            if lines:
                headers = lines[0].split(',')
                formatted = []
                for line in lines[1:]:
                    values = line.split(',')
                    row = ", ".join(f"{h}: {v}" for h, v in zip(headers, values) if v.strip())
                    if row:
                        formatted.append(row)
                text = "\n".join(formatted)
        elif ext == '.json':
            import json
            data = json.loads(content.decode('utf-8'))
            text = json.dumps(data, indent=2)
        else:
            text = content.decode('utf-8', errors='ignore')

        return {
            "success": True,
            "filename": filename,
            "content": text,
            "size_bytes": len(content),
            "extracted_chars": len(text)
        }

    except Exception as e:
        return {"success": False, "error": f"Error processing file: {str(e)}"}


def parse_faq_content(content: str) -> List[Dict]:
    """Parse FAQ-style content into Q&A pairs"""
    faqs = []

    # Pattern 1: Q: ... A: ...
    qa_pattern = r'Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)'
    matches = re.findall(qa_pattern, content, re.DOTALL | re.IGNORECASE)
    for q, a in matches:
        faqs.append({"question": q.strip(), "answer": a.strip()})

    # Pattern 2: **Question** ... Answer ...
    md_pattern = r'\*\*(.+?)\*\*\s*\n(.+?)(?=\*\*|$)'
    matches = re.findall(md_pattern, content, re.DOTALL)
    for q, a in matches:
        if "?" in q:  # Likely a question
            faqs.append({"question": q.strip(), "answer": a.strip()})

    return faqs


def generate_faq_prompt(faqs: List[Dict]) -> str:
    """Generate AI prompt section from FAQs"""
    if not faqs:
        return ""

    prompt = "FREQUENTLY ASKED QUESTIONS:\n"
    for faq in faqs:
        prompt += f"\nQ: {faq['question']}\nA: {faq['answer']}\n"

    return prompt


async def scrape_website_content(url: str) -> Dict:
    """Scrape content from a website URL for knowledge base"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"User-Agent": "CallBotAI Knowledge Scraper/1.0"},
                timeout=30.0,
                follow_redirects=True
            )

            if response.status_code != 200:
                return {"success": False, "error": f"HTTP {response.status_code}"}

            html = response.text

            # Basic HTML to text conversion (for production, use BeautifulSoup)
            # Remove scripts and styles
            html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
            html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)

            # Remove HTML tags
            text = re.sub(r'<[^>]+>', ' ', html)

            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text).strip()

            # Remove common boilerplate
            text = re.sub(r'Cookie Policy.*?Accept', '', text, flags=re.IGNORECASE)

            return {
                "success": True,
                "url": url,
                "content": text[:50000],  # Limit to 50k chars
                "extracted_chars": len(text)
            }

    except Exception as e:
        return {"success": False, "error": str(e)}


def create_pricing_context(pricing_data: Dict) -> str:
    """Create pricing context for AI from structured pricing data"""

    context = "PRICING INFORMATION:\n"

    if pricing_data.get("service_call"):
        context += f"- Service/diagnostic call: ${pricing_data['service_call']}\n"

    if pricing_data.get("hourly_rate"):
        context += f"- Hourly rate: ${pricing_data['hourly_rate']}/hour\n"

    if pricing_data.get("packages"):
        context += "\nService Packages:\n"
        for pkg in pricing_data["packages"]:
            context += f"- {pkg['name']}: ${pkg['price']} - {pkg.get('description', '')}\n"

    if pricing_data.get("free_estimates"):
        context += "- Free estimates available for larger projects\n"

    if pricing_data.get("payment_methods"):
        context += f"- Accepted payment methods: {', '.join(pricing_data['payment_methods'])}\n"

    if pricing_data.get("financing"):
        context += "- Financing options available\n"

    return context


def create_services_context(services: List[Dict]) -> str:
    """Create services context for AI"""

    context = "SERVICES OFFERED:\n"

    for service in services:
        name = service.get("name", "")
        description = service.get("description", "")
        price = service.get("price", "")

        context += f"\n{name}"
        if price:
            context += f" - ${price}"
        if description:
            context += f"\n  {description}"
        context += "\n"

    return context


class KnowledgeBaseManager:
    """Manages knowledge bases for multiple businesses"""

    def __init__(self):
        self.knowledge_bases: Dict[str, KnowledgeBase] = {}

    def get_or_create(self, business_id: str) -> KnowledgeBase:
        """Get or create a knowledge base for a business"""
        if business_id not in self.knowledge_bases:
            self.knowledge_bases[business_id] = KnowledgeBase(business_id)
        return self.knowledge_bases[business_id]

    def update_assistant_context(self, business_id: str, base_prompt: str) -> str:
        """Generate updated assistant prompt with knowledge base context"""
        kb = self.get_or_create(business_id)
        kb_context = kb.generate_context_prompt()

        if kb_context:
            return base_prompt + f"\n\nKNOWLEDGE BASE:\n{kb_context}"
        return base_prompt

    def get_stats(self, business_id: str) -> Dict:
        """Get knowledge base stats for a business"""
        kb = self.get_or_create(business_id)
        return kb.stats


# Global manager instance
kb_manager = KnowledgeBaseManager()
