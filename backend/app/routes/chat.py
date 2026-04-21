from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from app.config import OPENAI_API_KEY
import base64, io, json, csv

router = APIRouter()
client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "You are Sage, a helpful and intelligent AI assistant and expert programmer. "
        "When the user shares file contents, read and analyse them carefully. "
        "Answer clearly and naturally. "
        "Use **bold** and `code` formatting where helpful. "
        "Be concise unless the user asks for detail."
    )
}

class Message(BaseModel):
    role: str
    content: str

class FileAttachment(BaseModel):
    name: str
    mime: str
    data: str   # base64-encoded file content from frontend

class ChatRequest(BaseModel):
    messages: list[Message]
    files: list[FileAttachment] = []   # optional attached files

# ── FILE EXTRACTORS ──

def extract_pdf(data: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            pages = []
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    pages.append(f"[Page {i+1}]\n{text.strip()}")
            return "\n\n".join(pages) if pages else "(PDF had no extractable text)"
    except ImportError:
        # fallback: pypdf
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(data))
            pages = [p.extract_text() for p in reader.pages if p.extract_text()]
            return "\n\n".join(pages) if pages else "(PDF had no extractable text)"
        except Exception as e:
            return f"(Could not extract PDF: {e})"

def extract_docx(data: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        return f"(Could not extract DOCX: {e})"

def extract_csv(data: bytes) -> str:
    try:
        text = data.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return "(Empty CSV)"
        # Show header + up to 50 rows
        lines = [" | ".join(r) for r in rows[:51]]
        result = "\n".join(lines)
        if len(rows) > 51:
            result += f"\n... ({len(rows)-51} more rows)"
        return result
    except Exception as e:
        return f"(Could not parse CSV: {e})"

def extract_json(data: bytes) -> str:
    try:
        obj = json.loads(data.decode("utf-8", errors="replace"))
        return json.dumps(obj, indent=2)[:8000]
    except Exception as e:
        return f"(Could not parse JSON: {e})"

def extract_text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")

def extract_file(name: str, mime: str, data: bytes) -> str:
    ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
    if ext == "pdf" or mime == "application/pdf":
        return extract_pdf(data)
    elif ext in ("docx",) or "wordprocessingml" in mime:
        return extract_docx(data)
    elif ext == "doc":
        return "(Old .doc format not supported — please save as .docx)"
    elif ext == "csv" or mime == "text/csv":
        return extract_csv(data)
    elif ext == "json" or mime == "application/json":
        return extract_json(data)
    elif ext in ("txt","md","py","js","ts","jsx","tsx","html","css","java","c","cpp","cs","go","rs","sh","yaml","yml","toml","xml","sql") or mime.startswith("text/"):
        return extract_text(data)
    else:
        # Try as plain text, fallback gracefully
        try:
            return data.decode("utf-8", errors="replace")[:8000]
        except:
            return f"(Binary file '{name}' — cannot display contents as text)"

# ── ROUTE ──

@router.post("/chat")
def chat(request: ChatRequest):
    try:
        messages = [SYSTEM_PROMPT] + [m.dict() for m in request.messages]

        # Inject extracted file contents into the last user message
        if request.files:
            file_sections = []
            for f in request.files:
                try:
                    raw = base64.b64decode(f.data)
                except Exception:
                    raw = f.data.encode("utf-8", errors="replace")
                extracted = extract_file(f.name, f.mime, raw)
                file_sections.append(
                    f"--- File: {f.name} ---\n{extracted}\n--- End of {f.name} ---"
                )
            file_block = "\n\n".join(file_sections)
            # Append file content to last user message
            if messages and messages[-1]["role"] == "user":
                messages[-1]["content"] += f"\n\n{file_block}"
            else:
                messages.append({"role": "user", "content": file_block})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            messages=messages
        )

        return {"answer": response.choices[0].message.content}

    except Exception as e:
        print("Error:", str(e))
        return {"answer": "Something went wrong. Please try again."}