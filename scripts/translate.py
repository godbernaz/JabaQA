import sys
import json
from transformers import M2M100Tokenizer, M2M100ForConditionalGeneration

# Carregar o modelo e o tokenizer
model_name = "facebook/m2m100_418M"
tokenizer = M2M100Tokenizer.from_pretrained(model_name)
model = M2M100ForConditionalGeneration.from_pretrained(model_name)

# Ler os dados da entrada padrão
input_data = sys.stdin.read().strip()  # Remover espaços em branco ou quebras de linha extras
if not input_data:
    print(json.dumps({"error": "No input data received"}))
    sys.exit(1)

try:
    data = json.loads(input_data)
except json.JSONDecodeError as e:
    print(json.dumps({"error": f"Failed to parse JSON: {str(e)}"}))
    sys.exit(1)

# Extrair os textos e os idiomas
source_texts = data.get("source", [])
source_lang = data.get("sourceLang", "en").lower()  # Default para inglês se não especificado
target_lang = data.get("targetLang", "pt").lower()  # Default para português se não especificado

# Mapear códigos de idioma para os suportados pelo modelo M2M100
lang_mapping = {
    "en": "en",  # Inglês
    "pt": "pt",  # Português (genérico)
    "pt-pt": "pt",  # Português de Portugal
    "pt-br": "pt",  # Português do Brasil
    "de": "de",  # Alemão
    "fr": "fr",  # Francês
    "es": "es",  # Espanhol
    # Adicione mais idiomas conforme necessário
}

# Converter os códigos de idioma
source_lang_mapped = lang_mapping.get(source_lang, "en")  # Default para inglês se não mapeado
target_lang_mapped = lang_mapping.get(target_lang, "pt")  # Default para português se não mapeado

# Configurar o idioma de origem e destino
tokenizer.src_lang = source_lang_mapped
target_lang = target_lang_mapped

# Traduzir cada texto
translated_texts = []
for text in source_texts:
    if not text:  # Ignorar textos vazios
        translated_texts.append("")
        continue
    # Tokenizar o texto
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    # Gerar a tradução
    translated_tokens = model.generate(
        **inputs,
        forced_bos_token_id=tokenizer.get_lang_id(target_lang)
    )
    # Decodificar a tradução
    translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
    translated_texts.append(translated_text)

# Retornar os resultados como JSON
result = {
    "translations": translated_texts
}
print(json.dumps(result))