# app/utils/image_processor.py
import base64
import re
import io
from typing import Tuple, Optional
from PIL import Image

def parse_data_url(data_url: str) -> Tuple[str, bytes]:
    """
    Extrai o tipo MIME e os bytes da imagem do Data URL
    
    Args:
        data_url: String no formato 'data:image/jpeg;base64,/9j/4AAQ...'
    
    Returns:
        Tuple contendo (mime_type, image_bytes)
    
    Raises:
        ValueError: Se o formato do Data URL for inválido
    """
    if not data_url or not data_url.startswith('data:'):
        raise ValueError("Formato inválido: deve começar com 'data:'")
    
    # Regex para extrair tipo MIME e dados base64
    match = re.match(r'data:([^;]+);base64,(.+)', data_url)
    if not match:
        raise ValueError("Formato Data URL inválido")
    
    mime_type = match.group(1)
    base64_data = match.group(2)
    
    # Decodifica o base64
    try:
        image_bytes = base64.b64decode(base64_data)
        return mime_type, image_bytes
    except Exception as e:
        raise ValueError(f"Erro ao decodificar base64: {e}")

def is_avif_format(image_bytes: bytes) -> bool:
    """
    Detecta se os bytes da imagem são do formato AVIF
    pela assinatura do arquivo
    
    Args:
        image_bytes: Bytes da imagem
    
    Returns:
        bool: True se for AVIF, False caso contrário
    """
    # Assinatura AVIF: "ftyp" seguido de "avif" nos primeiros bytes
    return (len(image_bytes) >= 12 and 
           image_bytes[4:8] == b'ftyp' and 
           image_bytes[8:12] == b'avif')

def convert_avif_to_jpeg(image_bytes: bytes, quality: int = 85) -> bytes:
    """
    Converte imagem AVIF para JPEG usando PIL
    
    Args:
        image_bytes: Bytes da imagem AVIF
        quality: Qualidade do JPEG (1-100)
    
    Returns:
        bytes: Imagem convertida em JPEG
    
    Raises:
        Exception: Se a conversão falhar
    """
    try:
        # Abre a imagem com PIL
        image = Image.open(io.BytesIO(image_bytes))
        
        # Converte para RGB se necessário (AVIF pode ter transparência)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Cria um fundo branco para imagens com transparência
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Salva como JPEG
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=quality, optimize=True)
        
        return output.getvalue()
    
    except Exception as e:
        raise Exception(f"Erro ao converter AVIF para JPEG: {e}")

def convert_unsupported_format(image_bytes: bytes, mime_type: str) -> Tuple[bytes, str]:
    """
    Converte formatos não suportados pelo Flutter para JPEG
    
    Args:
        image_bytes: Bytes da imagem original
        mime_type: Tipo MIME da imagem original
    
    Returns:
        Tuple contendo (converted_bytes, new_mime_type)
    """
    # Formatos que precisam ser convertidos
    unsupported_formats = ['image/avif', 'image/heif', 'image/heic']
    
    # Verifica se é AVIF pelos bytes (mais confiável que o MIME type)
    if is_avif_format(image_bytes) or mime_type in unsupported_formats:
        try:
            converted_bytes = convert_avif_to_jpeg(image_bytes)
            return converted_bytes, 'image/jpeg'
        except Exception as e:
            # Se a conversão falhar, retorna erro
            raise ValueError(f"Erro ao converter formato não suportado: {e}")
    
    # Se já é um formato suportado, retorna sem modificar
    return image_bytes, mime_type

def process_image_base64(data_url: Optional[str]) -> Optional[str]:
    """
    Processa uma imagem em Data URL, convertendo formatos não suportados
    
    Args:
        data_url: Data URL da imagem ou None
    
    Returns:
        str: Data URL processado com formato suportado pelo Flutter ou None
    
    Raises:
        ValueError: Se houver erro no processamento da imagem
    """
    if not data_url:
        return None
    
    try:
        # Parse do Data URL
        mime_type, image_bytes = parse_data_url(data_url)
        
        # Converte formatos não suportados
        converted_bytes, final_mime_type = convert_unsupported_format(image_bytes, mime_type)
        
        # Reconstrói o Data URL com o formato convertido
        converted_base64 = base64.b64encode(converted_bytes).decode('utf-8')
        processed_data_url = f"data:{final_mime_type};base64,{converted_base64}"
        
        return processed_data_url
    
    except Exception as e:
        raise ValueError(f"Erro ao processar imagem: {e}")

def get_image_info(data_url: Optional[str]) -> dict:
    """
    Obtém informações sobre uma imagem em Data URL
    
    Args:
        data_url: Data URL da imagem
    
    Returns:
        dict: Informações da imagem (tipo, tamanho, etc.)
    """
    if not data_url:
        return {"type": None, "size": 0, "format": None}
    
    try:
        mime_type, image_bytes = parse_data_url(data_url)
        
        # Detecta formato real pelos bytes
        actual_format = "AVIF" if is_avif_format(image_bytes) else mime_type.split('/')[-1].upper()
        
        return {
            "type": mime_type,
            "size": len(image_bytes),
            "format": actual_format,
            "size_kb": round(len(image_bytes) / 1024, 1)
        }
    except:
        return {"type": "unknown", "size": 0, "format": "unknown"}