
import json
import hmac
import hashlib
import base64
import time
import uuid
from typing import Tuple, Dict, Optional
from io import BytesIO
import qrcode
from qrcode.image.pil import PilImage
from .config import get_settings

settings = get_settings()


def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def generate_token(student_id: str) -> Tuple[str, str]:

    nonce = uuid.uuid4().hex
    
    payload = {
        "sid": str(student_id),
        "nonce": nonce,
        "iat": int(time.time())
    }
    
    payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    payload_bytes = payload_json.encode('utf-8')
    
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).digest()
    
    payload_b64 = base64url_encode(payload_bytes)
    sig_b64 = base64url_encode(signature)
    
    token = f"{payload_b64}.{sig_b64}"
    
    return token, nonce


def verify_token(token: str) -> Dict:

    try:
        parts = token.split('.')
        if len(parts) != 2:
            raise ValueError("Invalid token format")
        
        payload_b64, sig_b64 = parts
        
        payload_bytes = base64url_decode(payload_b64)
        payload_json = payload_bytes.decode('utf-8')
        
        provided_signature = base64url_decode(sig_b64)
        
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload_bytes,
            hashlib.sha256
        ).digest()
        
        if not hmac.compare_digest(provided_signature, expected_signature):
            raise ValueError("Invalid token signature")
        
        payload = json.loads(payload_json)
        
        required_keys = {"sid", "nonce", "iat"}
        if not all(key in payload for key in required_keys):
            raise ValueError("Invalid payload structure")
        
        return payload
        
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def generate_qr_image(token: str, size: int = 300) -> BytesIO:

    qr = qrcode.QRCode(
        version=None,  # Auto-detect version based on data
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Medium error correction
        box_size=10,
        border=4,
    )
    
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white", image_factory=PilImage)
    
    img = img.resize((size, size))
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return buffer


def save_qr_image(token: str, filepath: str, size: int = 300) -> None:
 
    buffer = generate_qr_image(token, size)
    
    with open(filepath, 'wb') as f:
        f.write(buffer.getvalue())
