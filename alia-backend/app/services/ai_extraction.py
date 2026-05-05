import os
import json
import asyncio
from datetime import date
from typing import Protocol, Tuple
import fitz
from PIL import Image, ImageEnhance
import pytesseract
from openai import AsyncOpenAI
from groq import Groq
from docx import Document as DocxDocument
from app.config import settings
from app.models.ai import AIExtractedTask

# ────────────────────────────────────────────────────────────
# TESSERACT BINARY PATH (Windows)
# ────────────────────────────────────────────────────────────
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

CONFIDENCE_REVIEW_THRESHOLD = 0.70

# ────────────────────────────────────────────────────────────
# LLM CLIENT (NVIDIA NIM)
# ────────────────────────────────────────────────────────────
client = AsyncOpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.nvidia_api_key
)

# ────────────────────────────────────────────────────────────
# AUDIO CLIENT (Groq — synchronous, wrapped for async)
# ────────────────────────────────────────────────────────────
groq_client = Groq(api_key=settings.groq_api_key)


class TaskExtractionProvider(Protocol):
    async def complete(self, messages: list[dict[str, str]]) -> str:
        """Return raw model text for an extraction prompt."""


class NvidiaNimTaskExtractionProvider:
    """Synchronous MVP provider for task extraction via OpenAI-compatible NVIDIA NIM."""

    async def complete(self, messages: list[dict[str, str]]) -> str:
        response = await client.chat.completions.create(
            model="meta/llama-3.1-70b-instruct",
            messages=messages,
            temperature=0.1,
        )
        return response.choices[0].message.content or "[]"


task_extraction_provider: TaskExtractionProvider = NvidiaNimTaskExtractionProvider()


# ────────────────────────────────────────────────────────────
# FILE EXTRACTORS
# ────────────────────────────────────────────────────────────

async def extract_from_image(file_path: str) -> str:
    """Preprocess image and extract text using Tesseract OCR."""
    img = Image.open(file_path)
    # Preprocessing: Grayscale
    img = img.convert('L')
    # Preprocessing: Contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)
    
    # Run OCR
    text = pytesseract.image_to_string(img)
    return text.strip()

async def extract_from_pdf(file_path: str) -> Tuple[str, bool, int]:
    """Extract text from PDF. Returns (text, pages_truncated, total_pages)."""
    doc = fitz.open(file_path)
    total_pages = len(doc)
    pages_to_process = min(total_pages, 10)
    pages_truncated = total_pages > 10
    
    text_content = ""
    for i in range(pages_to_process):
        page = doc[i]
        page_text = page.get_text()
        if not page_text.strip():
            # Fallback to OCR if no text layer
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x resolution
            img_path = f"{file_path}_page_{i}.png"
            pix.save(img_path)
            try:
                page_text = await extract_from_image(img_path)
            finally:
                if os.path.exists(img_path):
                    os.remove(img_path)
        
        text_content += page_text + "\n"
        
    doc.close()
    return text_content.strip(), pages_truncated, total_pages


def _transcribe_audio_sync(file_path: str) -> str:
    """Synchronous Groq Whisper transcription (runs in a thread)."""
    with open(file_path, "rb") as audio_file:
        transcript = groq_client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=audio_file,
        )
    return transcript.text.strip()


async def extract_from_audio(file_path: str) -> str:
    """Extract text from audio using Groq Whisper (sync client in thread)."""
    text = await asyncio.to_thread(_transcribe_audio_sync, file_path)
    return text


async def extract_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    doc = DocxDocument(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    
    # Also extract text from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs.append(row_text)
    
    return "\n".join(paragraphs).strip()


# ────────────────────────────────────────────────────────────
# LLM TASK EXTRACTION
# ────────────────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """
You are an AI tasked with extracting action items and tasks from the provided text.
Your ONLY job is to extract tasks and return them as a JSON array.
If no tasks are found in the text, you MUST return an empty array `[]`. Never fabricate tasks.

Today's date is: {today}
Use this date to resolve any relative dates (like "by Friday", "next week", "tomorrow").

For each task identified, create a JSON object with exactly the following fields (no extra fields):
- "task_name": A clear, concise title for the task (string).
- "due_date": An ISO 8601 date string (YYYY-MM-DD) if a deadline is mentioned or can be inferred. Otherwise, null.
- "priority": One of "Urgent", "High", "Medium", "Low". Infer from urgency language. Default to "Medium".
- "suggested_action": A single sentence describing the recommended next step (string).
- "category": One of "Finance", "Health", "Legal", "Home", "Work", "Personal". Infer from context.
- "confidence_score": A float between 0.0 and 1.0 representing how certain you are this is a real task.

Example output:
[
  {{
    "task_name": "Pay electricity bill",
    "due_date": "2023-11-15",
    "priority": "High",
    "suggested_action": "Log into the utility portal to process payment.",
    "category": "Finance",
    "confidence_score": 0.95
  }}
]

IMPORTANT: You must return RAW JSON ONLY. Do not include markdown formatting (like ```json). Do not include any explanations or other text.
"""

RETRY_PROMPT = """
Your previous response could not be parsed as valid JSON.
You MUST return ONLY a valid JSON array of task objects, and absolutely nothing else.
No markdown, no preamble, no text outside the brackets.
"""

def _parse_json_array(raw_response: str) -> list:
    """Parse a JSON array, tolerating accidental markdown fences or surrounding text."""
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start == -1 or end == -1 or end <= start:
            raise
        data = json.loads(cleaned[start:end + 1])

    if not isinstance(data, list):
        raise ValueError("Expected a JSON array from LLM.")

    return data


async def extract_tasks_with_llm(text: str) -> list[AIExtractedTask]:
    """Pass text to the configured provider and parse a strict task array."""
    if not text.strip():
        return []
        
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(today=date.today().isoformat())
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text}
    ]
    
    raw_response = await task_extraction_provider.complete(messages)
    
    # Try parsing
    try:
        data = _parse_json_array(raw_response)
    except json.JSONDecodeError:
        # Retry logic
        messages.append({"role": "assistant", "content": raw_response})
        messages.append({"role": "user", "content": RETRY_PROMPT})
        
        raw_response = await task_extraction_provider.complete(messages)
        try:
            data = _parse_json_array(raw_response)
        except json.JSONDecodeError:
            raise ValueError("Failed to parse LLM response into JSON after retry.")
        
    tasks = []
    for item in data:
        if not isinstance(item, dict):
            continue

        # Filter out unknown keys to prevent validation errors on Pydantic init if model messed up
        allowed_keys = {"task_name", "due_date", "priority", "suggested_action", "category", "confidence_score"}
        filtered_item = {k: v for k, v in item.items() if k in allowed_keys}
        
        # Calculate needs_review
        score = filtered_item.get("confidence_score")
        needs_review = True if score is not None and score < CONFIDENCE_REVIEW_THRESHOLD else False
        filtered_item["needs_review"] = needs_review
        
        tasks.append(AIExtractedTask(**filtered_item))
        
    return tasks
