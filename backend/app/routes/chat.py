from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from app.config import OPENAI_API_KEY
import base64, io, json, csv, tempfile, os

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
    data: str  # base64-encoded

class ChatRequest(BaseModel):
    messages: list[Message]
    files: list[FileAttachment] = []

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

def extract_audio(name: str, mime: str, data: bytes) -> str:
    """Transcribe audio using OpenAI Whisper."""
    try:
        ext = name.lower().rsplit(".", 1)[-1] if "." in name else "mp3"
        # Whisper accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
        allowed = {"mp3","mp4","mpeg","mpga","m4a","wav","webm","ogg"}
        if ext not in allowed:
            ext = "mp3"
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
            )
        os.unlink(tmp_path)
        return f"[Audio Transcript]\n{transcript.text}"
    except Exception as e:
        return f"(Could not transcribe audio: {e})"

def extract_file(name: str, mime: str, data: bytes) -> str:
    ext = name.lower().rsplit(".", 1)[-1] if "." in name else ""
    # Audio
    if mime.startswith("audio/") or ext in ("mp3","mp4","m4a","wav","webm","ogg","mpeg","mpga"):
        return extract_audio(name, mime, data)
    # Image — return a marker so the route can handle it via vision
    if mime.startswith("image/") or ext in ("jpg","jpeg","png","gif","webp"):
        return "__IMAGE__"
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
        try:
            return data.decode("utf-8", errors="replace")[:8000]
        except:
            return f"(Binary file '{name}' — cannot display contents as text)"

# ── ROUTE ──

@router.post("/chat")
def chat(request: ChatRequest):
    try:
        messages = [SYSTEM_PROMPT] + [m.dict() for m in request.messages]

        if request.files:
            file_sections = []
            image_files = []  # collect images for vision

            for f in request.files:
                try:
                    raw = base64.b64decode(f.data)
                except Exception:
                    raw = f.data.encode("utf-8", errors="replace")

                extracted = extract_file(f.name, f.mime, raw)

                if extracted == "__IMAGE__":
                    # store for vision call
                    image_files.append({"mime": f.mime, "data": f.data})
                else:
                    file_sections.append(
                        f"--- File: {f.name} ---\n{extracted}\n--- End of {f.name} ---"
                    )

            # Inject text files into last user message
            if file_sections:
                file_block = "\n\n".join(file_sections)
                if messages and messages[-1]["role"] == "user":
                    messages[-1]["content"] += f"\n\n{file_block}"
                else:
                    messages.append({"role": "user", "content": file_block})

            # Handle images via vision (multimodal content)
            if image_files:
                last = messages[-1] if messages else None
                text_part = (last["content"] if last and last["role"] == "user" else "") or "Analyse this image."
                # Remove last user message — we'll rebuild it as multimodal
                if last and last["role"] == "user":
                    messages = messages[:-1]
                content = [{"type": "text", "text": text_part}]
                for img in image_files:
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{img['mime']};base64,{img['data']}"}
                    })
                messages.append({"role": "user", "content": content})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            messages=messages
        )

        return {"answer": response.choices[0].message.content}

    except Exception as e:
        print("Error:", str(e))
        return {"answer": "Something went wrong. Please try again."}