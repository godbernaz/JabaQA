import sys
import json
from sacrebleu import corpus_bleu

# Ler os dados da entrada padrão
input_data = sys.stdin.read().strip()
if not input_data:
    print(json.dumps({"error": "No input data received"}))
    sys.exit(1)

try:
    data = json.loads(input_data)
except json.JSONDecodeError as e:
    print(json.dumps({"error": f"Failed to parse JSON: {str(e)}"}))
    sys.exit(1)

# Extrair os textos de origem e destino
source_texts = data.get("source", [])
target_texts = data.get("target", [])

# Calcular a pontuação BLEU
if not target_texts or not source_texts:
    evaluation = "No valid translations to evaluate"
else:
    # Usar source_texts como referência e target_texts como hipóteses
    bleu = corpus_bleu(target_texts, [source_texts])
    evaluation = f"BLEU score: {bleu.score:.2f}"

# Retornar o resultado como JSON
result = {
    "evaluation": evaluation
}
print(json.dumps(result))